import { PrismaClient } from '@prisma/client';
import { notify } from '../../utils/notificationCreator.js';
import { updateConfirmationStatus } from '../../utils/appointmentUtils/appointmentConfirmationUtil.js';

const prisma = new PrismaClient();

export const createAppointment = async (req, res) => {
  try {
    const { role, id: creatorId, fullName } = req.user;
    const { doctorId, patientId, date, reason } = req.body;

    // Validate target(s) exist
    let recipientIds = [];

    let doctorConfirmed= role==='DOCTOR'? true: false;
    let patientConfirmed= role ==='PATIENT'? true: false;

    if (role === 'DOCTOR') {
      const patient = await prisma.patient.findUnique({ where: { id: patientId } });
      if (!patient) return res.status(404).json({ message: 'Patient not found' });
      recipientIds.push(patientId);

    } else if (role === 'PATIENT') {
      const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
      if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
      recipientIds.push(doctorId);

    } else if (role === 'ADMIN') {
      const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
      const patient = await prisma.patient.findUnique({ where: { id: patientId } });
      if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
      if (!patient) return res.status(404).json({ message: 'Patient not found' });
      recipientIds.push(doctorId, patientId);
    }

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        date: new Date(date),
        reason,
        doctorId,
        patientId,
        createdBy: creatorId,
        ...(doctorConfirmed && {doctorConfirmed}),
        ...(patientConfirmed && {patientConfirmed})
      },
    });

    // Dynamic notification message
    let message;
    if (role === 'ADMIN') {
      message = `Admin ${fullName} booked an appointment on ${appointment.date.toISOString()}, please confirm.`;
    } else if (role === 'DOCTOR') {
      message = `Dr. ${fullName} scheduled an appointment on ${appointment.date.toISOString()} with you. Please confirm`;
    } else {
      message = `${fullName} scheduled an appointment on ${appointment.date.toISOString()}. Please confirm.`;
    }

    // Send notifications
    await notify({
      type: 'APPOINTMENT',
      message,
      initiatorId: creatorId,
      recipientIds,
      eventId: appointment.id,
    });

    return res.status(201).json({ success: true, appointment });

  } catch (error) {
    console.error('Error creating appointment:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

export const getAllAppointments= async (req, res)=>{
    //check the role of the logged in user and display all their appointments
    const {id, fullName, role}= req.user;
    try{
        let appointments;
        if(role==='DOCTOR'){
            appointments= await prisma.appointment.findMany({where: {doctorId: id}});
        
        }else if(role==='PATIENT'){
            appointments= await prisma.appointment.findMany({where: {patientId: id}});

        }else{
            appointments= await prisma.appointment.findMany();

        }

        if(!appointments) return res.status(200).json({success: true, data: {appointments}});

        res.status(200).json({success: true, data: {appointments}});

    }catch(error){
        console.error('get appointments error: ' ,error);
        res.status(500).json({success: false, error: error.message});
    }
};

export const getAppointmentById = async (req, res) => {
  try {
    const { id: appointmentId } = req.params;

    // Fetch the appointment with related doctor, patient, and optional diagnosis
    const appointment = await prisma.appointment.findUnique({
      where: { id: parseInt(appointmentId) },
      include: {
        doctor: { select: { id: true, user: { select: { fullName: true, email: true } }, phoneNumber: true, departmentId: true } },
        patient: { select: { id: true, user: { select: { fullName: true, email: true } }, phoneNumber: true, bloodType: true } },
        diagnosis: true, // include all diagnosis info
      },
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    return res.status(200).json({ success: true, appointment });

  } catch (error) {
    console.error('Error fetching appointment:', error);
    return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

export const updateAppointment= async (req, res)=>{
  const {updateReason, reason, date}= req.body;
  const {id: userId, role, fullName}= req.user;

  try{
    //get id from params
    const appointmentId = parseInt(req.params.id, 10);
    if (isNaN(appointmentId)) {
      return res.status(400).json({ success: false, message: 'Invalid appointment ID' });
    }
    
    //retrieve appointment
    const appointment= await prisma.appointment.findUnique({where: {id: appointmentId}, select: {date: true, reason: true, status: true, updatedBy: true}});

    //if it's patient and the appointment is already confirmed
    if(role==='PATIENT' && appointment.status==='CONFIRMED') return res.status(400).json({success: false,message: 'Appointment cannot be altered'});

    //check if updatedBy is occupied i.e there is a pending update awaiting confirmation
    if(appointment.updatedBy!==null) return res.status(400).json({success: false, message: 'Appointment cannot be updated, pending confirmation'});
    
    const now= new Date();
    const appointmentDate= new Date(appointment.date);
    const duration= (appointmentDate-now)/(1000*60*60);

    //check if the appointment due date is less than 24 hours away
    if(duration<24) return res.status(400).json({success: false,message: 'Appointment cannot be altered. Contact Admin for assistance'});

    //user confirmation change
    let doctorConfirmed= role==='DOCTOR'? true : false;
    let patientConfirmed= role==='PATIENT'? true: false;

    //update the appointment
    const updated= await prisma.appointment.update({where: {id: appointmentId}, data: {
        ...(date && {date: new Date(date)}), 
        ...(reason && {reason}), 
        updateReason,
        updatedBy: userId,
        doctorConfirmed,
        patientConfirmed,
        status: 'PENDING'
    }});

      //dynamic notification message and recipient resolution
      let message;
      let recipientIds=[];
      if(role==='PATIENT'){
        message= `${fullName} has changed some details in the appointment. Details: ${updated.updateReason}. Please confirm`;
        recipientIds.push(updated.doctorId);
      }else if(role==='DOCTOR'){
        message= `Doctor ${fullName} has changed some details in the appointment. Details: ${updated.updateReason}. Please confirm`;
        recipientIds.push(updated.patientId);
      }else{
        message= `Admin ${fullName} has changed some details in the appointment. Details: ${updated.updateReason}. Please confirm`;
        recipientIds.push(updated.patientId, updated.doctorId);
      }

      //send notifications
      await notify({
        message,
        type: 'APPOINTMENT',
        initiatorId: userId,
        recipientIds,
        eventId: updated.id
      });

      res.status(200).json({success: true, message: 'appointment updated successfully', data: {updated}});

  }catch(error){
    console.error('error updating appointment ', error);
    res.status(500).json({success: false, message: 'Internal server error', error: error.message});
  }
}

export const confirmAppointment = async (req, res) => {
  try {
    
    const userId = req.user.id;
    const userRole = req.user.role;
    const fullName= req.user.fullName;

    const appointmentId = parseInt(req.params.id, 10);
    if (isNaN(appointmentId)) {
      return res.status(400).json({ success: false, message: 'Invalid appointment ID' });
    }


    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
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
        return res.status(403).json({ message: "You cannot confirm your own creation" });
      }
    }

    // Set confirmation flag
    if (userRole === "PATIENT") {
      appointment.patientConfirmed = true;
    } else if (userRole === "DOCTOR") {
      appointment.doctorConfirmed = true;
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        patientConfirmed: appointment.patientConfirmed,
        doctorConfirmed: appointment.doctorConfirmed,
      },
    });

    // Finalize if both confirmed
    await updateConfirmationStatus(updatedAppointment.id);

    //send notification
    let recipientIds=[];
    let message;

    if(role==='DOCTOR'){
      message= `Dr. ${fullName} has confirmed the appointment due on ${updatedAppointment.date}`;
      recipientIds.push(updatedAppointment.patientId);
    }else if(role==='PATIENT'){
      message= `${fullName} has confirmed the appointment due on ${updatedAppointment.date}`;
      recipientIds.push(updatedAppointment.doctorId);
    }else{
      message= `Admin ${fullName} has confirmed the appointment due on ${updatedAppointment.date}`;
      recipientIds.push(updatedAppointment.doctorId, updatedAppointment.patientId);
    }

    await notify({
      message,
      initiatorId: userId,
      recipientIds,
      type: 'APPOINTMENT',
      eventId: updatedAppointment.id
    });
    

    res.status(200).json({success: true, message: 'Appointment confirmed successfully',data: {updatedAppointment}});

  } catch (error) {
    console.error('could not confirm appointment: ', error.message);
    res.status(500).json({success: false, message: 'appointment confirmation failed', error: error.message})
  }
};

export const cancelAppointment = async (req, res) => {
  try {
    
    const { cancellationReason } = req.body;
    const { id: userId, role, fullName } = req.user;

    //grab id from params
    const appointmentId = parseInt(req.params.id, 10);
    if (isNaN(appointmentId)) {
      return res.status(400).json({ success: false, message: 'Invalid appointment ID' });
    }


    // Retrieve appointment
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
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

    // Determine recipient(s)
    let recipientIds = [];
    let message;

    if (role === "PATIENT") {
      recipientIds.push(updatedAppointment.doctorId);
      message = `${fullName} has cancelled the appointment. Reason: ${cancellationReason}`;
    } else if (role === "DOCTOR") {
      recipientIds.push(updatedAppointment.patientId);
      message = `Dr. ${fullName} has cancelled the appointment. Reason: ${cancellationReason}`;
    } else {
      recipientIds.push(updatedAppointment.patientId, updatedAppointment.doctorId);
      message = `Admin ${fullName} has cancelled the appointment. Reason: ${cancellationReason}`;
    }

    // Send notifications
    await notify({
      message,
      type: "APPOINTMENT",
      initiatorId: userId,
      recipientIds,
      eventId: updatedAppointment.id,
    });

    res.status(200).json({
      success: true,
      message: "Appointment cancelled successfully",
      data: { updatedAppointment },
    });

  } catch (error) {
    console.error("Error cancelling appointment:", error.message);
    res.status(500).json({
      success: false,
      message: "Appointment cancellation failed",
      error: error.message,
    });
  }
};

export const completeAppointment = async (req, res) => {
  try {
    
    const { outcome } = req.body;
    const { id: userId, role, fullName } = req.user;

    const appointmentId = parseInt(req.params.id, 10);
    if (isNaN(appointmentId)) {
      return res.status(400).json({ success: false, message: 'Invalid appointment ID' });
    }

    // Only doctors can complete
    if (role !== "DOCTOR") {
      return res.status(403).json({ message: "Only doctors can complete appointments" });
    }

    // Retrieve appointment
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (appointment.status === "COMPLETED") {
      return res.status(400).json({ message: "Appointment is already completed" });
    }

    // Update appointment
    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: "COMPLETED",
        outcome,
      },
    });

    // Notify patient
    const message = `Your appointment with Dr. ${fullName} has been marked as completed. Outcome: ${outcome}`;
    await notify({
      message,
      type: "APPOINTMENT",
      initiatorId: userId,
      recipientIds: [updatedAppointment.patientId],
      eventId: updatedAppointment.id,
    });

    res.status(200).json({
      success: true,
      message: "Appointment completed successfully",
      data: { updatedAppointment },
    });

  } catch (error) {
    console.error("Error completing appointment:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to complete appointment",
      error: error.message,
    });
  }
};
