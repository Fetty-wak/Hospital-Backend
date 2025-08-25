import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const isInvolved = async (req, res, next) => {
  try {
    const { id: appointmentId } = req.params;
    const { id: userId, role } = req.user;

    // Fetch the appointment
    const appointment = await prisma.appointment.findUnique({
      where: { id: parseInt(appointmentId) },
      select: {
        doctorId: true,
        patientId: true,
      },
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Admin can access everything
    if (role === 'ADMIN') return next();

    // Check if user is involved
    if (userId === appointment.doctorId || userId === appointment.patientId) {
      return next();
    }

    // Otherwise, forbidden
    return res.status(403).json({ message: 'Access denied' });

  } catch (error) {
    console.error('Error in appointmentAccessCheck:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};
