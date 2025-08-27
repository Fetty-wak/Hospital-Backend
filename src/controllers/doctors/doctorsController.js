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
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid doctor id',
      data: null,
    });
  }

  const {
    fullName,
    email,
    phoneNumber,
    licenseNumber,
    yearsOfExperience,
    departmentId,
  } = req.body;

  // Build update objects with only provided fields
  const userData = {
    ...(fullName && { fullName }),
    ...(email && { email }),
  };

  const doctorData = {
    ...(phoneNumber && { phoneNumber }),
    ...(licenseNumber && { licenseNumber }),
    ...(Number.isInteger(yearsOfExperience) && { yearsOfExperience }),
    ...(Number.isInteger(departmentId) && { departmentId }),
  };

  try {
    const existing = await prisma.doctor.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
        data: null,
      });
    }

    // Determine critical fields that trigger re-verification
    const criticalFields = ['phoneNumber', 'licenseNumber', 'yearsOfExperience', 'departmentId'];
    const updatingCritical = criticalFields.some(field => field in doctorData);

    // If updater is not admin and critical fields changed, set isVerified false
    if (req.user.role !== 'ADMIN' && updatingCritical) {
      doctorData.isVerified = false;

      // Fetch all admin IDs for notification
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true },
      });
      const adminIds = admins.map(a => a.id);

      await notify({
        type: 'DOCTOR_UPDATE',
        message: `Doctor ${existing.user.fullName} updated critical information.`,
        initiatorId: req.user.id,
        recipientIds: adminIds,
        eventId: id,
      });
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (Object.keys(userData).length) {
        await tx.user.update({ where: { id }, data: userData, select: { id: true } });
      }

      return await tx.doctor.update({
        where: { id },
        data: doctorData,
        include: {
          department: { select: { id: true, name: true } },
          user: { select: { id: true, email: true, fullName: true, role: true } },
        },
      });
    });

    return res.status(200).json({
      success: true,
      message: 'Doctor updated successfully',
      data: updated, // direct object
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


