import {PrismaClient} from '@prisma/client';
const prisma= new PrismaClient();
import {notify} from '../../utils/notificationCreator.js';

const PRESCRIPTION_INCLUDE = {
  drug: true,
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

    const existing = await prisma.prescription.findUnique({ where: { id }, include: {diagnosis: {select: {doctorId: true}}} });
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

    //if its a doctor, ensure its the same doctor linked to the diagnosis
    if(role==='DOCTOR' && existing.diagnosis.doctorId!==userId){
      return res.status(403).json({success: false, message: 'Access denied'})
    }

    
    let updateData= {
        ...(drugId && {drugId: Number(drugId)}),
        ...(dosePerAdmin && {dosePerAdmin}),
        ...(frequencyPerDay && {frequencyPerDay: Number(frequencyPerDay)}),
        ...(durationDays && {durationDays: Number(durationDays)}),
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
      message: "Failed to update prescription",
    });
  }
};

export const getPrescriptions = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    const { status, patientId, doctorId, pharmacistId } = req.query;

    // start with base object
    let where = { diagnosis: {} };

    // =========================
    // PATIENT
    // =========================
    if (role === "PATIENT") {
      where.status = "DISPENSED";
      where.diagnosis.patientId = userId;
    }

    // =========================
    // DOCTOR
    // =========================
    if (role === "DOCTOR") {
      where.diagnosis.doctorId = userId;

      if (status) {
        where.status = status.toUpperCase();
      }

      if (patientId) {
        const patient = await prisma.patient.findUnique({
          where: { id: Number(patientId) },
        });
        if (!patient)
          return res
            .status(400)
            .json({ success: false, message: "Patient not found" });
        where.diagnosis.patientId = Number(patientId);
      }
    }

    // =========================
    // PHARMACIST
    // =========================
    if (role === "PHARMACIST") {
      if (status) {
        where.status = status.toUpperCase();
      }

      if (patientId) {
        const patient = await prisma.patient.findUnique({
          where: { id: Number(patientId) },
        });
        if (!patient)
          return res
            .status(400)
            .json({ success: false, message: "Patient not found" });
        where.diagnosis.patientId = Number(patientId);
      }

      if (doctorId) {
        const doctor = await prisma.doctor.findUnique({
          where: { id: Number(doctorId) },
        });
        if (!doctor)
          return res
            .status(400)
            .json({ success: false, message: "Doctor not found" });
        where.diagnosis.doctorId = Number(doctorId);
      }
    }

    // =========================
    // ADMIN
    // =========================
    if (role === "ADMIN") {
      if (status) {
        where.status = status.toUpperCase();
      }

      if (patientId) {
        const patient = await prisma.patient.findUnique({
          where: { id: Number(patientId) },
        });
        if (!patient)
          return res
            .status(400)
            .json({ success: false, message: "Patient not found" });
        where.diagnosis.patientId = Number(patientId);
      }

      if (doctorId) {
        const doctor = await prisma.doctor.findUnique({
          where: { id: Number(doctorId) },
        });
        if (!doctor)
          return res
            .status(400)
            .json({ success: false, message: "Doctor not found" });
        where.diagnosis.doctorId = Number(doctorId);
      }

      if (pharmacistId) {
        const pharmacist = await prisma.pharmacist.findUnique({
          where: { id: Number(pharmacistId) },
        });
        if (!pharmacist)
          return res
            .status(400)
            .json({ success: false, message: "Pharmacist not found" });
        where.pharmacistId = Number(pharmacistId);
      }
    }

    // =========================
    // QUERY
    // =========================
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
      message: "Failed to retrieve prescriptions",
    });
  }
};

export const getPrescriptionById= async (req, res)=>{
  try{
    const {id: userId, role }= req.user;
    const {id}= req.params;

    const prescriptionId= Number(id);
    if(!Number.isFinite(prescriptionId)){
      return res.status(400).json({success: false, message: 'Invalid prescription Id'});
    }

    const prescription= await prisma.prescription.findUnique({where: {id: prescriptionId}, include: {diagnosis :{select: {doctorId: true, patientId: true}}}});

    if(!prescription){
      return res.status(404).json({success: false, message: 'Prescription not found'});
    }

    if(role==='DOCTOR' && prescription.diagnosis.doctorId!==userId){
      return res.status(403).json({success: false, message: 'Access denied'});
    }
      
    if(role==='PATIENT' && prescription.diagnosis.patientId!==userId){
      return res.status(403).json({success: false, message: 'Access denied'});
    }

    //retrieve the prescription
    let finalPrescription
    if(role==='DOCTOR' || role==="PATIENT"){
      finalPrescription= await prisma.prescription.findFirst({where: {id: prescriptionId}, include: {drug: true, diagnosis: true}});
    }else{
      finalPrescription= await prisma.prescription.findUnique({where: {id: prescriptionId}, include: {drug: true}});
    }

    return res.status(200).json({success: true, message: 'prescription retrieved successfully', data: finalPrescription});
    

  }catch(error){
    console.error("error getting the prescription: ", error);
    res.status(500).json({success: false, message: 'Internal server error'});
  }
}


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

    if (existing.status==='DISPENSED') {
      return res.status(400).json({ 
        success: false, 
        message: "Prescription has already been dispensed" 
      });
    }else if(existing.status==='CANCELLED'){
      return res.status(400).json({ 
        success: false, 
        message: "Prescription has been cancelled" 
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
    recipientIds.push(existing.diagnosis.doctor.user.id);
    recipientIds.push(existing.diagnosis.patient.user.id);

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
      message: "Failed to dispense prescription",
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
      message: "Failed to delete prescription",
    });
  }
};