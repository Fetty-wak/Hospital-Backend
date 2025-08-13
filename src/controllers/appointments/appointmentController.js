import { PrismaClient } from '@prisma/client';
import { notify } from '../../utils/notificationCreator.js';

const prisma = new PrismaClient();

export const createAppointment = async (req, res) => {
  try {
    const { role, id: creatorId, fullName } = req.user;
    const { doctorId, patientId, date, reason } = req.body;

    // Validate target(s) exist
    let recipientIds = [];

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
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
