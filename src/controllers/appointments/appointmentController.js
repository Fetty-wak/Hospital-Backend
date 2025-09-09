import { PrismaClient } from '@prisma/client';
import { notify } from '../../utils/notificationCreator.js';
import { updateConfirmationStatus } from '../../utils/appointmentUtils/appointmentConfirmationUtil.js';

const prisma = new PrismaClient();

export const createAppointment = async (req, res) => {
  try {
    const { role, id: creatorId, fullName } = req.user;
    const { doctorId, patientId, date, reason } = req.body;

    if (!patientId || !doctorId) {
      return res
        .status(404)
        .json({ success: false, message: "Missing doctor or patient Ids" });
    }

    // Validate target(s) exist
    let recipientIds = [];
    let doctorConfirmed;
    let patientConfirmed;

    if (role === "DOCTOR") {
      const patient = await prisma.patient.findUnique({
        where: { id: patientId },
        include: { user: true },
      });
      if (!patient || !patient.user.isActive)
        return res
          .status(404)
          .json({ success: false, message: "Patient not found" });
      recipientIds.push(patientId);
      doctorConfirmed = true;
    } else if (role === "PATIENT") {
      const doctor = await prisma.doctor.findUnique({
        where: { id: doctorId },
        include: { user: true },
      });
      if (!doctor || !doctor.user.isActive)
        return res
          .status(404)
          .json({ message: "Doctor not found" });
      recipientIds.push(doctorId);
      patientConfirmed = true;
    } else if (role === "ADMIN") {
      const doctor = await prisma.doctor.findUnique({
        where: { id: doctorId },
        include: { user: true },
      });
      const patient = await prisma.patient.findUnique({
        where: { id: patientId },
        include: { user: true },
      });
      if (!doctor || !doctor.user.isActive)
        return res
          .status(404)
          .json({ message: "Doctor not found" });
      if (!patient || !patient.user.isActive)
        return res
          .status(404)
          .json({ message: "Patient not found" });
      recipientIds.push(doctorId, patientId);
    } else {
      return res
        .status(403)
        .json({ success: false, message: "Access denied!" });
    }

    // ---------------- DATE VALIDATION ----------------
    const appointmentDate = new Date(date);

    const hour = appointmentDate.getHours();
    if (hour < 9 || hour >= 17) {
      return res.status(400).json({
        success: false,
        message: "Appointments must be booked between 09:00 and 17:00.",
      });
    }

    // ---------------- CONFLICT CHECK ----------------
    const conflict = await prisma.appointment.findFirst({
      where: {
        doctorId,
        date: {
          gte: new Date(appointmentDate.getTime() - 60 * 60 * 1000), // 1 hour before
          lte: new Date(appointmentDate.getTime() + 60 * 60 * 1000), // 1 hour after
        },
      },
    });

    if (conflict) {
      return res.status(409).json({
        success: false,
        message: "This time conflicts with another appointment for this doctor.",
      });
    }

    // ---------------- CREATE APPOINTMENT ----------------
    const appointment = await prisma.appointment.create({
      data: {
        date: appointmentDate,
        reason,
        doctorId,
        patientId,
        createdBy: creatorId,
        ...(doctorConfirmed != undefined && { doctorConfirmed }),
        ...(patientConfirmed != undefined && { patientConfirmed }),
      },
    });

    // Dynamic notification message
    let message;
    if (role === "ADMIN") {
      message = `Admin ${fullName} booked an appointment on ${appointment.date.toISOString()}, please confirm.`;
    } else if (role === "DOCTOR") {
      message = `Dr. ${fullName} scheduled an appointment on ${appointment.date.toISOString()} with you. Please confirm.`;
    } else {
      message = `${fullName} scheduled an appointment on ${appointment.date.toISOString()}. Please confirm.`;
    }

    await notify({
      type: "APPOINTMENT",
      message,
      initiatorId: creatorId,
      recipientIds,
      eventId: appointment.id,
    });

    return res.status(201).json({ success: true, appointment });
  } catch (error) {
    console.error("Error creating appointment:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getAllAppointments = async (req, res) => {
  const { id: userId, role } = req.user;

  // Parse pagination safely
  const limitRaw = parseInt(req.query.limit, 10);
  const pageRaw = parseInt(req.query.page, 10);
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 100) : 10;
  const page = Number.isFinite(pageRaw) ? Math.max(pageRaw, 1) : 1;
  const skip = (page - 1) * limit;

  // Parse filters
  const { status, start, end } = req.query;

  // Admin-only optional filters
  const doctorIdQ = req.query.doctorId ? parseInt(req.query.doctorId, 10) : undefined;
  const patientIdQ = req.query.patientId ? parseInt(req.query.patientId, 10) : undefined;

  // Base where clause
  const where = {};

  try {
    // Role scoping
    if (role === "PATIENT") {
      where.patientId = userId;
    } else if (role === "DOCTOR") {
      where.doctorId = userId;
    } else if (role === "ADMIN") {
      if (Number.isFinite(doctorIdQ)) where.doctorId = doctorIdQ;
      if (Number.isFinite(patientIdQ)) where.patientId = patientIdQ;
    } else {
      return res.status(403).json({ success: false, message: "Unauthorized to access appointments." });
    }

    // Only return active-linked appointments for non-admins
    if (role !== "ADMIN") {
      where.AND = [
        { doctor: { user: { isActive: true } } },
        { patient: { user: { isActive: true } } },
      ];
    }

    // Status filter
    if (status) {
      where.status = String(status).toUpperCase();
    }

    // Date range filter
    if (start || end) {
      const dateFilter = {};
      if (start) {
        const s = new Date(start);
        if (Number.isNaN(s.getTime())) {
          return res.status(400).json({ success: false, message: "Invalid 'start' date." });
        }
        s.setHours(0, 0, 0, 0);
        dateFilter.gte = s;
      }
      if (end) {
        const e = new Date(end);
        if (Number.isNaN(e.getTime())) {
          return res.status(400).json({ success: false, message: "Invalid 'end' date." });
        }
        e.setHours(23, 59, 59, 999);
        dateFilter.lte = e;
      }
      where.date = dateFilter;
    }

    // Total count
    const totalCount = await prisma.appointment.count({ where });

    // Data page
    const appointments = await prisma.appointment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { date: "desc" },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true, department: true } },
      },
    });

    return res.status(200).json({
      success: true,
      data: { appointments },
      pagination: {
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    console.error("get appointments error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.user;
    const appointmentId = Number(id);

    if (!Number.isFinite(appointmentId)) {
      return res.status(400).json({ success: false, message: 'Invalid appointment Id' });
    }

    // Build the where clause dynamically
    let where = { id: appointmentId };

    if (role === 'DOCTOR') {
      where = {
        ...where,
        patient: { user: { isActive: true } }
      };
    } else if (role === 'PATIENT') {
      where = {
        ...where,
        doctor: { user: { isActive: true } }
      };
    }

    const appointment = await prisma.appointment.findFirst({
      where,
      include: {
        doctor: { 
          select: { 
            id: true, 
            user: { select: { fullName: true, email: true, isActive: true } }, 
            phoneNumber: true, 
            departmentId: true 
          } 
        },
        patient: { 
          select: { 
            id: true, 
            user: { select: { fullName: true, email: true, isActive: true } }, 
            phoneNumber: true, 
            bloodType: true 
          } 
        },
        diagnosis: true,
      },
    });

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Appointment retrieved successfully',
      appointment,
    });

  } catch (error) {
    console.error('Error fetching appointment:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const updateAppointment = async (req, res) => {
  const { updateReason, reason, date } = req.body;
  const { id: userId, role, fullName } = req.user;

  try {
    // get id from params
    const appointmentId = Number(req.params.id);
    if (!Number.isFinite(appointmentId)) {
      return res.status(400).json({ success: false, message: 'Invalid appointment ID' });
    }

    // retrieve appointment with doctor/patient active check
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        doctor: { include: { user: { select: { isActive: true } } } },
        patient: { include: { user: { select: { isActive: true } } } },
      },
    });

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // inactive target checks
    if (role === 'PATIENT' && !appointment.doctor.user.isActive) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    if (role === 'DOCTOR' && !appointment.patient.user.isActive) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }
    if (role === 'ADMIN') {
      if (!appointment.doctor.user.isActive) {
        return res.status(404).json({ success: false, message: 'Doctor not found' });
      }
      if (!appointment.patient.user.isActive) {
        return res.status(404).json({ success: false, message: 'Patient not found' });
      }
    }

    // if it's patient and the appointment is already confirmed
    if (role === 'PATIENT' && appointment.status === 'CONFIRMED') {
      return res.status(400).json({ success: false, message: 'Appointment cannot be altered' });
    }

    // check if updatedBy is occupied i.e there is a pending update awaiting confirmation
    if (appointment.updatedBy !== null) {
      return res.status(400).json({ success: false, message: 'Appointment cannot be updated, pending confirmation' });
    }

    const now = new Date();
    const appointmentDate = new Date(appointment.date);
    const duration = (appointmentDate - now) / (1000 * 60 * 60);

    // check if the appointment due date is less than 24 hours away
    if (duration < 24) {
      return res.status(400).json({ success: false, message: 'Appointment cannot be altered. Contact Admin for assistance' });
    }

    // user confirmation change
    let doctorConfirmed = role === 'DOCTOR' ? true : false;
    let patientConfirmed = role === 'PATIENT' ? true : false;

    // update the appointment
    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        ...(date && { date: new Date(date) }),
        ...(reason && { reason }),
        updateReason,
        updatedBy: userId,
        doctorConfirmed,
        patientConfirmed,
        status: 'PENDING',
      },
    });

    // dynamic notification message and recipient resolution
    let message;
    let recipientIds = [];
    if (role === 'PATIENT') {
      message = `${fullName} has changed some details in the appointment. Details: ${updated.updateReason}. Please confirm`;
      recipientIds.push(updated.doctorId);
    } else if (role === 'DOCTOR') {
      message = `Doctor ${fullName} has changed some details in the appointment. Details: ${updated.updateReason}. Please confirm`;
      recipientIds.push(updated.patientId);
    } else {
      message = `Admin ${fullName} has changed some details in the appointment. Details: ${updated.updateReason}. Please confirm`;
      recipientIds.push(updated.patientId, updated.doctorId);
    }

    // send notifications
    await notify({
      message,
      type: 'APPOINTMENT',
      initiatorId: userId,
      recipientIds,
      eventId: updated.id,
    });

    res.status(200).json({ success: true, message: 'appointment updated successfully', data: { updated } });
  } catch (error) {
    console.error('error updating appointment ', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

export const confirmAppointment = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const fullName = req.user.fullName;

    const appointmentId = Number(req.params.id);
    if (!Number.isFinite(appointmentId)) {
      return res.status(400).json({ success: false, message: 'Invalid appointment ID' });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        doctor: { include: { user: { select: { isActive: true } } } },
        patient: { include: { user: { select: { isActive: true } } } },
      },
    });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // inactive user checks
    if (userRole === "DOCTOR" && !appointment.patient.user.isActive) {
      return res.status(404).json({ message: "Patient not found" });
    }
    if (userRole === "PATIENT" && !appointment.doctor.user.isActive) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    if (userRole === "ADMIN") {
      if (!appointment.patient.user.isActive) {
        return res.status(404).json({ message: "Patient not found" });
      }
      if (!appointment.doctor.user.isActive) {
        return res.status(404).json({ message: "Doctor not found" });
      }
    }

    if (appointment.patientConfirmed && appointment.doctorConfirmed) {
      return res.status(400).json({ message: "Already confirmed by both parties" });
    }

    // Check updatedBy precedence
    if (appointment.updatedBy) {
      if (appointment.updatedBy === userId && userRole !== "ADMIN") {
        return res.status(403).json({ message: "You cannot confirm your own update" });
      }
    } else {
      // No updatedBy → use createdBy check
      if (appointment.createdBy === userId && userRole !== "ADMIN") {
        return res.status(403).json({ message: "You cannot confirm your own created appointment" });
      }
    }

    let patientConfirmed;
    let doctorConfirmed;
    // Set confirmation flag
    if (userRole === "PATIENT") {
      patientConfirmed = true;
    } else if (userRole === "DOCTOR") {
      doctorConfirmed = true;
    } else {
      patientConfirmed = true;
      doctorConfirmed = true;
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        patientConfirmed,
        doctorConfirmed,
      },
    });

    // Finalize if both confirmed
    const isConfirmed = await updateConfirmationStatus(updatedAppointment.id);

    // send notification
    let recipientIds = [];
    let message;

    if (userRole === 'DOCTOR') {
      message = `Dr. ${fullName} has confirmed the appointment due on ${updatedAppointment.date.toISOString()}`;
      recipientIds.push(updatedAppointment.patientId);
    } else if (userRole === 'PATIENT') {
      message = `${fullName} has confirmed the appointment due on ${updatedAppointment.date.toISOString()}`;
      recipientIds.push(updatedAppointment.doctorId);
    } else {
      message = `Admin ${fullName} has confirmed the appointment due on ${updatedAppointment.date.toISOString()}`;
      recipientIds.push(updatedAppointment.doctorId, updatedAppointment.patientId);
    }

    await notify({
      message,
      initiatorId: userId,
      recipientIds,
      type: 'APPOINTMENT',
      eventId: updatedAppointment.id,
    });

    res.status(200).json({
      success: true,
      message: 'Appointment confirmed successfully',
      data: { updatedAppointment },
    });
  } catch (error) {
    console.error('could not confirm appointment: ', error.message);
    res.status(500).json({
      success: false,
      message: 'appointment confirmation failed',
      error: error.message,
    });
  }
};

export const cancelAppointment = async (req, res) => {
  try {
    const { cancellationReason } = req.body;
    const { id: userId, role, fullName } = req.user;

    // grab id from params
    const appointmentId = Number(req.params.id);
    if (!Number.isFinite(appointmentId)) {
      return res.status(400).json({ success: false, message: 'Invalid appointment ID' });
    }

    // Retrieve appointment with doctor/patient active info
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        doctor: { include: { user: { select: { isActive: true } } } },
        patient: { include: { user: { select: { isActive: true } } } },
      },
    });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (appointment.status === "CANCELLED") {
      return res.status(400).json({ message: "Appointment is already cancelled" });
    }

    // Update appointment
    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: "CANCELLED",
        cancelledBy: userId,
        cancellationReason,
      },
    });

    // Determine recipient(s), skipping inactive users
    let recipientIds = [];
    let message;

    if (role === "PATIENT" && appointment.doctor.user.isActive) {
      recipientIds.push(updatedAppointment.doctorId);
      message = `${fullName} has cancelled the appointment. Reason: ${cancellationReason}`;
    } else if (role === "DOCTOR" && appointment.patient.user.isActive) {
      recipientIds.push(updatedAppointment.patientId);
      message = `Dr. ${fullName} has cancelled the appointment. Reason: ${cancellationReason}`;
    } else if (role === "ADMIN") {
      if (appointment.patient.user.isActive) recipientIds.push(updatedAppointment.patientId);
      if (appointment.doctor.user.isActive) recipientIds.push(updatedAppointment.doctorId);
      message = `Admin ${fullName} has cancelled the appointment. Reason: ${cancellationReason}`;
    }

    // Send notifications if there are active recipients
    if (recipientIds.length > 0) {
      await notify({
        message,
        type: "APPOINTMENT",
        initiatorId: userId,
        recipientIds,
        eventId: updatedAppointment.id,
      });
    }

    res.status(200).json({
      success: true,
      message: "Appointment cancelled successfully",
      data: { updatedAppointment },
    });

  } catch (error) {
    console.error("Error cancelling appointment:", error.message);
    res.status(500).json({
      success: false,
      message: "Appointment cancellation failed. Internal server error",
    });
  }
};

export const updateAppointmentNotes = async (req, res) => {
  try {
    const { id } = req.params;
    const { outcome, createDiagnosis } = req.body;

    const appointmentId = Number(id);
    if (!Number.isFinite(appointmentId)) {
      return res.status(400).json({ success: false, message: 'Invalid appointment Id' });
    }

    // pull up the appointment with patient active info
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { patient: { select: { user: { select: { isActive: true } } } } },
    });

    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    // Check if patient is active
    if (!appointment.patient.user.isActive) {
      return res.status(404).json({ success: false, message: "Patient not found or inactive" });
    }

    // Update fields
    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        ...(outcome !== undefined && { outcome }),
        ...(createDiagnosis !== undefined && { createDiagnosis }),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Appointment notes updated successfully",
      appointment: updatedAppointment,
    });
  } catch (error) {
    console.error("Error updating appointment notes:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};


export const completeAppointment = async (req, res) => {
  try {
    const { id: userId, role, fullName } = req.user;

    const appointmentId = Number(req.params.id);
    if (!Number.isFinite(appointmentId)) {
      return res.status(400).json({ success: false, message: 'Invalid appointment ID' });
    }

    // Retrieve appointment
    const appointment = await prisma.appointment.findFirst({
      where: { id: appointmentId },
      include: {
        patient: {include: {user: true}}
      }
    });

    if (!appointment) {
      return res.status(404).json({success: false, message: 'Appointment not found' });
    }

    if(!appointment.patient.user.isActive){
      return res.status(404).json({success: false, message: 'Patient not found'});
    }

    if (appointment.status === 'COMPLETED') {
      return res.status(400).json({success: false, message: 'Appointment is already completed' });
    }

    // Ensure outcome notes exist before completion
    if (!appointment.outcome || appointment.outcome.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Cannot complete appointment without outcome notes',
      });
    }
    

    const {updatedAppointment, diagnosis}= await prisma.$transaction(async (tx) => {
      // Mark appointment completed
      const updatedAppointment = await tx.appointment.update({
        where: { id: appointmentId },
        data: { status: 'COMPLETED' },
      });

      let diagnosis = null;
      // If flag set, create diagnosis
      if (updatedAppointment.createDiagnosis) {
        diagnosis = await tx.diagnosis.create({
          data: {
            doctorId: userId, // same as appointment.doctorId in your schema (Doctor.id === User.id)
            patientId: updatedAppointment.patientId,
            appointmentId: updatedAppointment.id,
            // symptoms left for the doctor to fill later
          },
        });
      }

      return {updatedAppointment, diagnosis};
    });

    // Notify patient
    const message = `Your appointment with Dr. ${fullName} has been marked as completed. Outcome: ${updatedAppointment.outcome}`;
    await notify({
      message,
      type: 'APPOINTMENT',
      initiatorId: userId,
      recipientIds: [updatedAppointment.patientId],
      eventId: updatedAppointment.id,
    });

    return res.status(200).json({
      success: true,
      message: 'Appointment completed successfully',
      data: { updatedAppointment, ...(diagnosis && { diagnosis }) },
    });
  } catch (error) {
    console.error('Error completing appointment:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to complete appointment',
    });
  }
};
