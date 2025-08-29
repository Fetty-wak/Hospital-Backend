import {PrismaClient} from '@prisma/client';
const prisma= new PrismaClient();
import bcrypt from 'bcrypt';
import { notify } from '../../utils/notificationCreator.js';

// POST /api/doctors  (Admin)
export const createDoctor = async (req, res) => {
  const {
    fullName,
    email,
    password,
    role,
    phoneNumber,
    licenseNumber,
    yearsOfExperience,
    departmentId,
  } = req.body;

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    const {doctor} = await prisma.$transaction(async (tx) => {
      // 1) Create the User with role DOCTOR
      const user = await tx.user.create({
        data: {
          email,
          password: passwordHash,
          fullName,
          role: role.toUpperCase(),
        },
        select: { id: true, email: true, fullName: true, role: true },
      });

      // 2) Create the Doctor using the same id
      const doctor = await tx.doctor.create({
        data: {
          id: user.id,
          phoneNumber,
          licenseNumber,
          yearsOfExperience,
          departmentId,
          isVerified: true
        },
        include: {
          department: { select: { id: true, name: true } },
          user: { select: { id: true, email: true, fullName: true, role: true } },
        },
      });

      return {doctor};
    });

    return res.status(201).json({
      success: true,
      message: 'Doctor created successfully',
      data: { doctor},
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error while creating doctor',
      data: null,
    });
  }
};

export const getDoctors = async (req, res) => {
  try {
    const doctors = await prisma.doctor.findMany({
      include: {
        department: { select: { id: true, name: true } },
        user: { select: { id: true, email: true, fullName: true, role: true } },
      },
      orderBy: { id: 'asc' },
    });

    const requesterRole = req.user.role;
    const requesterId = req.user.id;

    const doctorsData = doctors.map(doctor => {
      if (
        requesterRole === 'ADMIN' ||
        (requesterRole === 'DOCTOR' && requesterId === doctor.id)
      ) {
        // full info for admin or self
        return doctor;
      } else {
        // partial info for everyone else
        return {
          id: doctor.id,
          fullName: doctor.user.fullName,
          department: doctor.department,
          phoneNumber: doctor.phoneNumber,
          specialization: doctor.specialization || null,
        };
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Doctors fetched successfully',
      data: { doctorsData },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching doctors',
      data: null,
    });
  }
};

export const getDoctorById = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid doctor id',
      data: null,
    });
  }

  try {
    const doctor = await prisma.doctor.findUnique({
      where: { id },
      include: {
        department: { select: { id: true, name: true } },
        user: { select: { id: true, email: true, fullName: true, role: true } },
      },
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
        data: null,
      });
    }

    const requesterRole = req.user.role;
    const requesterId = req.user.id;

    let doctorData;

    if (
      requesterRole === 'ADMIN' ||
      (requesterRole === 'DOCTOR' && requesterId === doctor.id)
    ) {
      // full info for admin or self
      doctorData = doctor;
    } else {
      // partial info for everyone else
      doctorData = {
        id: doctor.id,
        fullName: doctor.user.fullName,
        department: doctor.department,
        phoneNumber: doctor.phoneNumber,
        specialization: doctor.specialization || null,
      };
    }

    return res.status(200).json({
      success: true,
      message: 'Doctor fetched successfully',
      data: { doctorData },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching doctor',
      data: null,
    });
  }
};

export const updateDoctor = async (req, res) => {
  //extract doctor id
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Invalid doctor id',
      data: null,
    });
  }

  try {
    // Fetch doctor
    const doctor = await prisma.doctor.findUnique({
      where: { id },
      include: { user: true, department: true },
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
        data: null,
      });
    }

    const isDoctorSelf = req.user.id === doctor.id;
    const { phoneNumber, licenseNumber, departmentId, practiceStartDate } = req.body;

    // Build update object
    const doctorData = {};

    if (req.user.role === 'DOCTOR' && !isDoctorSelf) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        data: {},
      });

    } else if (isDoctorSelf) {
      // --- Doctor updating self ---
      if (doctor.pendingUpdate) {
        return res.status(403).json({
          success: false,
          message: 'You have a pending update awaiting admin verification',
          data: null,
        });
      }

      // Critical field checks (No pending updates)
      if (licenseNumber || practiceStartDate) {
        if (doctor.isVerified) {
          return res.status(403).json({
            success: false,
            message: 'Cannot update verified license number or practice start date',
            data: null,
          });
        }
        //no pending updates and not verified (allow updates to critical fields)
        if (licenseNumber) doctorData.licenseNumber = licenseNumber;
        if (practiceStartDate) doctorData.practiceStartDate = new Date(practiceStartDate);
      }

      if (departmentId && Number.isInteger(departmentId)) {
        doctorData.departmentId = departmentId;
        doctorData.isVerified = false;
        doctorData.pendingUpdate = true;

        // Notify admins of department change
        const admins = await prisma.user.findMany({
          where: { role: 'ADMIN' },
          select: { id: true },
        });
        const adminIds = admins.map(a => a.id);

        await notify({
          type: 'DOCTOR_UPDATE',
          message: `Doctor ${doctor.user.fullName} changed department; awaiting verification.`,
          initiatorId: req.user.id,
          recipientIds: adminIds,
          eventId: id,
        });
      }
      //include phonenumber if present
      if (phoneNumber) doctorData.phoneNumber = phoneNumber;

    } else {
      // --- Admin updating doctor ---
      if (departmentId && Number.isInteger(departmentId)) {
        doctorData.departmentId = departmentId;

        // Notify the doctor
        await notify({
          type: 'DOCTOR_UPDATE',
          message: `Admin updated your department to ${departmentId}.`,
          initiatorId: req.user.id,
          recipientIds: [doctor.user.id],
          eventId: id,
        });
      }
      // Admin cannot change licenseNumber or practiceStartDate
    }

    // Apply updates
    const updated = await prisma.doctor.update({
      where: { id },
      data: doctorData,
      include: {
        user: { select: { id: true, fullName: true, email: true, role: true } },
        department: { select: { id: true, name: true } },
      },
    });

    // Compute dynamic years of experience from practiceStartDate
    let yearsOfExperience = null;
    if (updated.practiceStartDate) {
      yearsOfExperience = Math.floor(
        (new Date() - new Date(updated.practiceStartDate)) / (1000 * 60 * 60 * 24 * 365)
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Doctor updated successfully',
      data: { ...updated, yearsOfExperience },
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while updating doctor',
      data: null,
    });
  }
};

export const verifyDoctor= async (req, res)=>{
  const id= Number(req.params.id);
  if(!Number.isInteger(id)){
    res.status(400).json({success: false, message: 'Invalid doctor Id', data: null});
  }

  try{
    const doctor= await prisma.doctor.findUnique({where: {id}});
    if(!doctor) return res.status(400).json({success: false, message: 'Invalid doctor Id', data: null});

    //verify
    const verified= await prisma.doctor.update({where: {id}, data: {isVerified: true}});

    res.status(200).json({success: true, message: 'Doctor verified successfully', data: {verified}});
  }catch(error){
    console.error('Verification Error ', error);
    res.status(500).json({success: false, message: 'verification failed. Internal Server Error', data: null});
  }
}