
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * Checks the confirmation booleans for an appointment.
 * If both patientConfirmed and doctorConfirmed are true,
 * sets the overall status to 'CONFIRMED' and clears updatedBy.
 *
 */
export const updateConfirmationStatus = async (appointmentId) => {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: { patientConfirmed: true, doctorConfirmed: true }
    });

    if (!appointment) return {success: false, message: 'Appointment does not exist'}; // appointment not found

    let updatedAppointment;
    if (appointment.patientConfirmed && appointment.doctorConfirmed) {
      updatedAppointment= await prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: 'CONFIRMED', updatedBy: null }
      });
    }

    return {success: true, message: 'Appointment status updated successfully', data: confirmedAppointment};
  } catch (error) {
    console.error('Error updating confirmation status:', error);
    return {sucess: false, message: 'Error updating confirmation status'};
  }
};
