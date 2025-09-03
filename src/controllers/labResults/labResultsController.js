import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// ================= UPDATE LAB RESULT =================
export const updateLabResult = async (req, res) => {
  const { id: userId, role } = req.user;
  const { id: labResultIdRaw } = req.params;
  const { result } = req.body;

  try {
    const labResultId = Number(labResultIdRaw);
    if (!Number.isInteger(labResultId)) {
      return res.status(400).json({ success: false, message: "Invalid labResult ID" });
    }

    // ensure labResult exists
    const labResult = await prisma.labResult.findUnique({
      where: { id: labResultId },
      include: { diagnosis: true },
    });
    if (!labResult) {
      return res.status(404).json({ success: false, message: "LabResult not found" });
    }

    // only labTech can update, assign themselves if not already assigned
    const updatedLabResult = await prisma.labResult.update({
      where: { id: labResultId },
      data: {
        result,
        status: "PENDING", // still editable
        ...(labResult.labTechId ? {} : { labTechId: userId }),
      },
    });

    return res.status(200).json({
      success: true,
      message: "LabResult updated successfully",
      data: updatedLabResult,
    });
  } catch (error) {
    console.error("Error updating labResult:", error);
    return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};

// ================= COMPLETE LAB RESULT =================
export const completeLabResult = async (req, res) => {
  const { id: userId } = req.user;
  const { id: labResultIdRaw } = req.params;

  try {
    const labResultId = Number(labResultIdRaw);
    if (!Number.isInteger(labResultId)) {
      return res.status(400).json({ success: false, message: "Invalid labResult ID" });
    }

    const labResult = await prisma.labResult.findUnique({ where: { id: labResultId } });
    if (!labResult) {
      return res.status(404).json({ success: false, message: "LabResult not found" });
    }
    if (!labResult.result) {
      return res.status(400).json({ success: false, message: "Cannot complete LabResult without a result" });
    }

    const completedLabResult = await prisma.labResult.update({
      where: { id: labResultId },
      data: { status: "COMPLETED", labTechId: labResult.labTechId || userId },
    });

    return res.status(200).json({
      success: true,
      message: "LabResult marked as completed",
      data: completedLabResult,
    });
  } catch (error) {
    console.error("Error completing labResult:", error);
    return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};

// ================= CANCEL LAB RESULT =================
export const cancelLabResult = async (req, res) => {
  const { id: doctorId } = req.user;
  const { id: labResultIdRaw } = req.params;
  const {cancellationReason}= req.body;

  try {
    const labResultId = Number(labResultIdRaw);
    if (!Number.isInteger(labResultId)) {
      return res.status(400).json({ success: false, message: "Invalid labResult ID" });
    }

    const labResult = await prisma.labResult.findUnique({
      where: { id: labResultId },
      include: { diagnosis: true },
    });
    if (!labResult) {
      return res.status(404).json({ success: false, message: "LabResult not found" });
    }

    // only doctor who created diagnosis can cancel
    if (labResult.diagnosis.doctorId !== doctorId) {
      return res.status(403).json({ success: false, message: "Not authorized to cancel this LabResult" });
    }

    if(labResult.status==='COMPLETED'){
        return res.status(404).json({
            success: false,
            message: 'You cannot cancel a completed labResult',
            data: {}
        });
    }

    const cancelledLabResult = await prisma.labResult.update({
      where: { id: labResultId },
      data: { status: "CANCELLED", cancellationReason }, // requires you to add CANCELLED in LabResultStatus enum
    });

    return res.status(200).json({
      success: true,
      message: "LabResult cancelled successfully",
      data: cancelledLabResult,
    });
  } catch (error) {
    console.error("Error cancelling labResult:", error);
    return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};

export const getLabResultById = async (req, res) => {
  const { id: userId, role } = req.user;
  const { id: labResultIdRaw } = req.params;

  try {
    const labResultId = Number(labResultIdRaw);
    if (!Number.isInteger(labResultId)) {
      return res.status(400).json({ success: false, message: "Invalid labResult ID" });
    }

    const labResult = await prisma.labResult.findUnique({
      where: { id: labResultId },
      include: {
        labTest: true,
        ...(role === "DOCTOR" || role === "PATIENT"
          ? { diagnosis: { include: { patient: true, doctor: true } } }
          : {}),
      },
    });

    if (!labResult) {
      return res.status(404).json({ success: false, message: "LabResult not found" });
    }

    // access check
    const isDoctor = labResult.diagnosis?.doctorId === userId;
    const isPatient = labResult.diagnosis?.patientId === userId;
    const allowed =
      role === "ADMIN" ||
      role === "LAB_TECH" ||
      isDoctor ||
      isPatient;

    if (!allowed) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    return res.status(200).json({ success: true, data: labResult });
  } catch (error) {
    console.error("Error fetching labResult by ID:", error);
    return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};

// ================= GET ALL =================
export const getAllLabResults = async (req, res) => {
  const { role } = req.user;

  try {
    const labResults = await prisma.labResult.findMany({
      include: {
        labTest: { select: { name: true } },
        diagnosis: { select: { id: true, patientId: true, doctorId: true } },
      },
    });

    return res.status(200).json({ success: true, data: labResults });
  } catch (error) {
    console.error("Error fetching labResults:", error);
    return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};


