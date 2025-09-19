import { PrismaClient } from "@prisma/client";
const prisma= new PrismaClient();
import { notify } from "../../utils/notificationCreator.js";

export const createDiagnosis = async (req, res) => {
  try {
    const { id: doctorId, role } = req.user;
    const { patientId: patientIdRaw} = req.body; 

    const patientId= Number(patientIdRaw);

    if(!Number.isFinite(patientId)){
      return res.status(404).json({success: false, message: 'Invalid patient Id'});
    }

    //ensure patient is in the system
    const patient = await prisma.patient.findUnique({ where: { id: patientId }, include: {user: true} });
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    if(!patient.user.isActive){
      return res.status(400).json({success: false, message: 'Patient is not active'});
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
  const {
    symptoms,
    description,
    outcome,
    prescribed,
    requiresLabTests,
    labTests,
    prescriptions
  } = req.body;
  const { role } = req.user;
  const { id: diagnosisIdRaw } = req.params;

  try {
    const diagnosisId = Number(diagnosisIdRaw);
    if (!Number.isInteger(diagnosisId)) {
      return res.status(400).json({ success: false, message: 'Invalid diagnosis ID' });
    }

    // Ensure diagnosis exists
    const diagnosis = await prisma.diagnosis.findUnique({
      where: { id: diagnosisId },
      include: {
        patient: {
          include: {
            user: true
          }
        }
      }
    });

    if (!diagnosis) {
      return res.status(404).json({ success: false, message: 'Diagnosis not found' });
    }

    if (!diagnosis.patient.user.isActive) {
      return res.status(400).json({ success: false, message: 'Patient is not active' });
    }

    // Transaction: update diagnosis + (optional) create lab results + (optional) create prescriptions
    const { updatedDiagnosis, labResultsCreated, prescriptionsCreated } = await prisma.$transaction(async (tx) => {
      const updatedDiagnosis = await tx.diagnosis.update({
        where: { id: diagnosisId },
        data: {
          ...(symptoms && { symptoms }),
          ...(description && { description }),
          ...(outcome && { outcome }),
          ...(prescribed !== undefined && { prescribed }),
          ...(requiresLabTests !== undefined && { requiresLabTests }),
        },
      });

      // LAB RESULTS (append; dedupe IDs)
      let labResultsCreated = null;
      const finalLabTests = (requiresLabTests && Array.isArray(labTests))
        ? [...new Set(labTests.map(n => parseInt(n, 10)).filter(Number.isFinite))]
        : [];

      if (finalLabTests.length > 0) {
        // ✅ Validate labTest IDs
        const validTests = await tx.labTest.findMany({
          where: { id: { in: finalLabTests }, available: true },
          select: { id: true },
        });

        const validLabTestIds = new Set(validTests.map(t => t.id));
        const invalidLabTestIds = finalLabTests.filter(id => !validLabTestIds.has(id));

        if (invalidLabTestIds.length > 0) {
          throw new Error(`Invalid labTest IDs: ${invalidLabTestIds.join(', ')}`);
        }

        labResultsCreated = await tx.labResult.createMany({
          data: finalLabTests.map((labTestId) => ({
            labTestId,
            diagnosisId,
          })),
        });
      }

      // PRESCRIPTIONS (append)
      let prescriptionsCreated = null;
      const finalPrescriptions = Array.isArray(prescriptions) ? prescriptions : [];

      if (finalPrescriptions.length > 0) {
        // ✅ Validate drug IDs
        const drugIds = [...new Set(finalPrescriptions.map(p => parseInt(p.drugId, 10)))];

        const validDrugs = await tx.drug.findMany({
          where: { id: { in: drugIds }, available: true },
          select: { id: true },
        });

        const validDrugIds = new Set(validDrugs.map(d => d.id));
        const invalidDrugIds = drugIds.filter(id => !validDrugIds.has(id));

        if (invalidDrugIds.length > 0) {
          throw new Error(`Invalid drug IDs: ${invalidDrugIds.join(', ')}`);
        }

        prescriptionsCreated = await tx.prescription.createMany({
          data: finalPrescriptions.map((p) => ({
            diagnosisId,
            drugId: parseInt(p.drugId, 10),
            dosePerAdmin: parseInt(p.dosePerAdmin, 10),
            frequencyPerDay: parseInt(p.frequencyPerDay, 10),
            durationDays: parseInt(p.durationDays, 10),
            instructions: p.instructions ?? null,
          })),
        });
      }

      return { updatedDiagnosis, labResultsCreated, prescriptionsCreated };
    });

    // Enriched response
    const finalDiagnosisUpdate = await prisma.diagnosis.findUnique({
      where: { id: updatedDiagnosis.id },
      include: {
        doctor: true,
        patient: true,
        labresults: true,
        prescriptions: true,
      },
    });

    const parts = ['Diagnosis updated'];
    if (labResultsCreated && labResultsCreated.count > 0) parts.push('LabResult(s) created');
    if (prescriptionsCreated && prescriptionsCreated.count > 0) parts.push('Prescription(s) created');

    return res.status(200).json({
      success: true,
      message: parts.join('. '),
      data: finalDiagnosisUpdate,
    });
  } catch (error) {
    console.error('Error in diagnosis update:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Diagnosis update failed',
    });
  }
};

export const getDiagnosis = async (req, res) => {
  const { id, role } = req.user;
  const {
    status,
    start,
    end,
    doctorId: doctorIdRaw,
    patientId: patientIdRaw,
    page: pageRaw = "1",
    limit: limitRaw = "10",
    filterBy = "created" // default date filter
  } = req.query;

  // Parse pagination
  const page = Number.isFinite(parseInt(pageRaw, 10)) ? Math.max(parseInt(pageRaw, 10), 1) : 1;
  const limit = Number.isFinite(parseInt(limitRaw, 10)) ? Math.min(Math.max(parseInt(limitRaw, 10), 1), 100) : 10;
  const skip = (page - 1) * limit;

  // Determine which date field to filter
  const dateField = filterBy === "completed" ? "completedAt" : "createdAt";

  // Build where clause dynamically
  const where= {};

  // Role-based scoping
  if (role === "PATIENT") {
    where.patientId = id;
    if (doctorIdRaw) where.doctorId = parseInt(doctorIdRaw, 10);
  } else if (role === "DOCTOR") {
    where.doctorId = id;
    if (patientIdRaw) where.patientId = parseInt(patientIdRaw, 10);
  }

  // Status filter
  if (status) where.status = status.toUpperCase();

  // Date range filter
  if (start || end) {
    where[dateField] = {};
    if (start) where[dateField].gte = new Date(start);
    if (end) where[dateField].lte = new Date(end);
  }

  try {
    // Count total records for pagination
    const totalCount = await prisma.diagnosis.count({ where });

    // Fetch paginated results
    const diagnoses = await prisma.diagnosis.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [dateField]: "desc" },
      include: {
        doctor: { include: { user: true, department: true } },
        patient: { include: { user: true } },
        prescriptions: true,
        labresults: true
      },
    });

    res.status(200).json({
      success: true,
      data: { diagnoses },
      pagination: {
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        limit
      }
    });

  } catch (error) {
    console.error("getDiagnosis error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getDiagnosisById = async (req, res) => {
  const { id: diagnosisIdRaw } = req.params;
  const diagnosisId = parseInt(diagnosisIdRaw, 10);

  try {
    const diagnosis = await prisma.diagnosis.findUnique({
      where: { id: diagnosisId },
      include: {
        doctor: { include: { user: true, department: true } },
        patient: { include: { user: true } },
        prescriptions: true,
        labresults: true
      },
    });

    if (!diagnosis) {
      return res.status(404).json({ success: false, message: "Diagnosis not found." });
    }

    res.status(200).json({ success: true, data: { diagnosis } });

  } catch (error) {
    console.error("getDiagnosisById error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const completeDiagnosis = async (req, res) => {
  const { role } = req.user;
  const { id: diagnosisIdRaw } = req.params;

  try {

    const diagnosisId = parseInt(diagnosisIdRaw, 10);
    if (!Number.isFinite(diagnosisId)) {
      return res.status(400).json({ success: false, message: 'Invalid diagnosis ID' });
    }

    // Fetch essentials
    const diagnosis = await prisma.diagnosis.findUnique({
      where: { id: diagnosisId },
      include: {
        patient: {include: {user: true}},
        labresults: { select: { id: true, status: true } },
        prescriptions: { select: { id: true } },
      },
    });

    if (!diagnosis) {
      return res.status(404).json({ success: false, message: 'Diagnosis not found' });
    }

    if (diagnosis.status === 'COMPLETED') {
      return res.status(400).json({ success: false, message: 'Diagnosis already completed' });
    }

    if(!diagnosis.patient.user.isActive){
      return res.status(400).json({success: false, message: 'Patient is not active'});
    }

    // Lab checks
    const hasLabResults = diagnosis.labresults?.length > 0;
    if (hasLabResults) {
      const hasPending = diagnosis.labresults.some(lr => lr.status !== 'COMPLETED');
      if (hasPending) {
        return res.status(400).json({ success: false, message: 'All lab results must be completed before finalizing diagnosis' });
      }
    } else if (diagnosis.requiresLabTests) {
      return res.status(400).json({ success: false, message: 'Lab results are required for this diagnosis but none exist' });
    }

    // Prescription check
    if (diagnosis.prescribed && diagnosis.prescriptions.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one prescription is required before completing diagnosis' });
    }

    // Finalize diagnosis
    const updated = await prisma.diagnosis.update({
      where: { id: diagnosisId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    // Enriched payload
    const finalDiagnosis = await prisma.diagnosis.findUnique({
      where: { id: updated.id },
      include: {
        doctor: { include: { user: {select: {id: true, fullName: true}}, department: true } },
        patient: { include: { user: {select: {id: true, fullName: true}} } },
        labresults: true,
        prescriptions: { include: { drug: true } },
      },
    });

    //notify the patient
    await notify({
      recipientIds: finalDiagnosis.patient.user.id,
      initiatorId: req.user.id,
      type: 'DIAGNOSIS',
      message: `Your diagnosis with dr. ${req.user.fullName} is completed. You can review details.`,
      eventId: finalDiagnosis.id
    });

    return res.status(200).json({
      success: true,
      message: 'Diagnosis marked as complete',
      data: { diagnosis: finalDiagnosis },
    });
  } catch (error) {
    console.error('completeDiagnosis error:', error);
    return res.status(500).json({
      success: false,
      message: 'Diagnosis completion failed. Internal server error',
    });
  }
};
