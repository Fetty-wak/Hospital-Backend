import {PrismaClient} from '@prisma/client';
const prisma= new PrismaClient();
import {notify} from '../../utils/notificationCreator.js';

const PRESCRIPTION_INCLUDE = {
  drug: true,
  diagnosis: {
    include: {
      patient: {
        include: { user: true },
      },
      doctor: {
        include: { user: true },
      },
    },
  },
  pharmacist: {
    include: { user: true },
  },
};

export const updatePrescription = async (req, res) => {
  try {
    const role= req.user.role;
    const userId= req.user.id;
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: "Invalid prescription id" });
    }

    // Fields expected (Zod already validated on the route)
    const { drugId, dosePerAdmin, frequencyPerDay, durationDays, instructions } = req.body;

    const existing = await prisma.prescription.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ 
        success: false, 
        message: "Prescription not found" 
      });
    }

    if (existing.dispensed) {
      return res.status(400).json({
        success: false,
        message: "Cannot update a prescription that has already been dispensed",
      });
    }
    
    let updateData= {
        ...(drugId && {drugId}),
        ...(dosePerAdmin && {dosePerAdmin}),
        ...(frequencyPerDay && {frequencyPerDay}),
        ...(durationDays && {durationDays}),
        ...(instructions && {instructions})
    };

    const updated = await prisma.prescription.update({
      where: { id },
      data: updateData,
      include: PRESCRIPTION_INCLUDE,
    });

    return res.status(200).json({
      success: true,
      message: "Prescription updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Update prescription error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update prescription",
    });
  }
};

export const getPrescriptions = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    // query params for filtering
    const { status, patientId, doctorId, pharmacistId } = req.query;

    let where = {
        diagnosis: {}
    };

    if (role === "PATIENT") {
      // patient can only ever see their own prescriptions that are dispensed
      where = {
        status: "DISPENSED",
        diagnosis: { patientId: userId },
      };

    } else if (role === "DOCTOR") {
      // doctor can only ever see prescriptions they created
      where = {
        diagnosis: { doctorId: userId },
      };

    } else if (role === "PHARMACIST") {
      // pharmacist can see pending ones or their own
      where = {};

    } else if (role === "ADMIN") {
      // admin can see all, filters are allowed
      where = {};
    } 

    if(role==='DOCTOR'){
        if (status) where.status= status;
    }else if(role==='ADMIN' || role==='PHARMACIST'){
        if(status) where.status=status;
        if(patientId) where.diagnosis.patientId= Number(patientId);
        if(doctorId) where.diagnosis.doctorId= Number(doctorId);
        if(pharmacistId && role==='PHARMACIST'){
            where.pharmacistId= userId;
        }else if (pharmacistId){
            where.pharmacistId= Number(pharmacistId);
        }  
    }

    const prescriptions = await prisma.prescription.findMany({
      where,
      include: PRESCRIPTION_INCLUDE,
      orderBy: { id: "desc" },
    });

    return res.status(200).json({
      success: true,
      message: "Prescriptions retrieved successfully",
      data: prescriptions,
    });

  } catch (error) {
    console.error("Get prescriptions error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve prescriptions",
    });
  }
};


export const dispensePrescription = async (req, res) => {
  try {
    const userId= req.user.id;
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid prescription id" 
      });
    }

    const existing = await prisma.prescription.findUnique({
      where: { id },
      include: {
        diagnosis: { include: { patient: { include: { user: true } }, doctor: { include: { user: true } } } },
        drug: true,
      },
    });

    if (!existing) {
      return res.status(404).json({ 
        success: false, 
        message: "Prescription not found" 
      });
    }

    if (existing.dispensed) {
      return res.status(400).json({ 
        success: false, 
        message: "Prescription has already been dispensed" 
      });
    }

    const dispensed = await prisma.prescription.update({
      where: { id },
      data: {
        dispensed: true,
        dispensedAt: new Date(),
        pharmacistId: userId,
        status: 'DISPENSED'
      },
      include: PRESCRIPTION_INCLUDE,
    });

    //notify doctor and patient
    let recipientIds= [];
    recipientIds.push(dispensed.diagnosis.doctor.user.id);
    recipientIds.push(dispensed.diagnosis.patient.user.id);

    await notify({
        type: 'PRESCRIPTION',
        initiatorId: userId,
        recipientIds,
        message: `Pharmacist ${req.user.fullName}, has dispensed the drugs.`,
        eventId: dispensed.id
    });

    return res.status(200).json({
      success: true,
      message: "Prescription dispensed successfully",
      data: dispensed,
    });
  } catch (error) {
    console.error("Dispense prescription error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to dispense prescription",
    });
  }
};

export const deletePrescription = async (req, res) => {
  try {
    const role= req.user.role;
    const userId= req.user.id;
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid prescription id" 
      });
    }

    const existing = await prisma.prescription.findUnique({
      where: { id },
      include: { diagnosis: { include: { patient: { include: { user: true } }, doctor: { include: { user: true } } } } },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: "Prescription not found" });
    }

    //check if the doctor deleting the prescription is linked to the diagnosis
    const validDoctor= userId=== existing.diagnosis.doctor.id ? true : false;
    if(!validDoctor) return res.status(403).json({success: false, message: 'Access denied', data: {}});

    //cannot delete a dispensed prescription
    if(existing.dispensed){
        return res.status(400).json({
            success: false,
            message: 'Cannot delete a prescription that is dispensed',
            data: {}
        });
    }

    const cancelled= await prisma.prescription.update({
        where: {id}, 
        data: {status: 'CANCELLED'}
    });

    return res.status(200).json({
      success: true,
      message: "Prescription deleted successfully",
      data: cancelled
    });
  } catch (error) {
    console.error("Delete prescription error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete prescription",
    });
  }
};