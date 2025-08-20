import { PrismaClient } from "@prisma/client";
const prisma= new PrismaClient();

export const createDiagnosis = async (req, res) => {
  try {
    const { id: doctorId, role } = req.user;
    const { patientId} = req.body; 

    //limit access to doctors only
    if (role !== 'DOCTOR') {
      return res.status(403).json({ success: false, message: 'Only doctors can create a diagnosis' });
    }

    //ensure patient is in the system
    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    const createdDiagnosis = await prisma.diagnosis.create({
      data: {
        patientId,
        doctorId,
      },
    });

    const diagnosis = await prisma.diagnosis.findUnique({
      where: { id: createdDiagnosis.id },
      include: {
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

export const updateDiagnosis = async (req, res) => {
  const { outcome, description, prescribed, labTests, symptoms } = req.body;
  const { role } = req.user;
  const { id: diagnosisId } = req.params;

  try {
    // Doctor role check
    if (role !== "DOCTOR")
      return res
        .status(403)
        .json({ success: false, message: "Access denied" });

    // Check if diagnosis exists
    const diagnosis = await prisma.diagnosis.findUnique({
      where: { id: Number(diagnosisId) },
    });
    if (!diagnosis)
      return res
        .status(404)
        .json({ success: false, message: "Diagnosis not found" });

    // Create both the diagnosis update and new labTests if available
    const { updatedDiagnosis, labResults } = await prisma.$transaction(
      async (tx) => {
        const updatedDiagnosis = await tx.diagnosis.update({
          where: { id: Number(diagnosisId) },
          data: {
            ...(symptoms && { symptoms }),
            ...(description && { description }),
            ...(outcome && { outcome }),
            ...(prescribed !== undefined && { prescribed }),
          },
        });

        let labResults;
        const finalLabTests = Array.isArray(labTests)
          ? [...new Set(labTests)]
          : [];

        // Create the labResults if finalLabTests is occupied
        if (finalLabTests.length > 0) {
          labResults = await tx.labResult.createMany({
            data: finalLabTests.map((id) => ({
              labTestId: id,
              diagnosisId: diagnosis.id,
            })),
          });
        }

        return { updatedDiagnosis, labResults };
      }
    );

    // Fetch enriched diagnosis for response
    const finalDiagnosisUpdate = await prisma.diagnosis.findUnique({
      where: { id: updatedDiagnosis.id },
      include: {
        doctor: true,
        patient: true,
        labresults: true,
      },
    });

    const message = labResults
      ? "Diagnosis updated. LabResult(s) created"
      : "Diagnosis updated";

    res.status(200).json({
      success: true,
      message,
      data: finalDiagnosisUpdate,
    });
  } catch (error) {
    console.error("Error in diagnosis update:", error.message);
    res.status(500).json({
      success: false,
      message: "Diagnosis update failed. Internal server error",
      error: error.message,
    });
  }
};
