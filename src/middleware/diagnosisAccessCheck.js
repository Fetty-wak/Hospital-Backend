import { PrismaClient } from "@prisma/client";
const prisma= new PrismaClient();

export const accessChecker= async (req, res, next)=>{
    try {
        const { id: diagnosisId } = req.params;
        const { id: userId, role } = req.user;

        // Fetch the appointment
        const diagnosis = await prisma.diagnosis.findUnique({
        where: { id: parseInt(diagnosisId) },
        select: {
            doctorId: true,
            patientId: true,
        },
        });

        if (!diagnosis) {
        return res.status(404).json({ message: 'Diagnosis not found' });
        }

        // Check if user is involved
        if (userId === diagnosis.doctorId || userId === diagnosis.patientId) {
        return next();
        }

        // Otherwise, forbidden
        return res.status(403).json({ message: 'Access denied' });

    } catch (error) {
        console.error('Error in diagnosis access check:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }

}