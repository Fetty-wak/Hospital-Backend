import { PrismaClient } from "@prisma/client";
const prisma= new PrismaClient();

export const createDiagnosis = async (req, res) => {
  try {
    const { id: doctorId, role } = req.user;
    const { patientId, symptoms, labTests } = req.body; // labTests: number[] of LabTest IDs

    //limit access to doctors only
    if (role !== 'DOCTOR') {
      return res.status(403).json({ success: false, message: 'Only doctors can create a diagnosis' });
    }

    //ensure patient is in the system
    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    const createdDiagnosis= await prisma.$transaction(async (tx) => {
      const createdDiagnosis = await tx.diagnosis.create({
        data: {
          patientId,
          doctorId,
          symptoms, // optional
        },
      });

      if (Array.isArray(labTests) && labTests.length > 0) {
        //avoid duplicate tests
        const uniqueIds = [...new Set(labTests)];
        
        await tx.labResult.createMany({
          data: uniqueIds.map((labTestId) => ({
            diagnosisId: createdDiagnosis.id,
            labTestId,
            status: 'PENDING',
          })),
        });
      }

      return createdDiagnosis;
    });

    const diagnosis = await prisma.diagnosis.findUnique({
      where: { id: createdDiagnosis.id },
      include: {
        labresults: { include: { labTest: true, labTech: true } },
        patient: { select: { id: true, user: { select: { fullName: true, email: true } } } },
        doctor:  { select: { id: true, user: { select: { fullName: true, email: true } } } },
      },
    });

    return res.status(201).json({ success: true, data: diagnosis });
  } catch (error) {
    console.error('Error creating diagnosis:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};
