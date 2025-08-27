import { PrismaClient } from "@prisma/client";
const prisma= new PrismaClient();
import bcrypt from 'bcrypt';

export const createPatient = async (req, res) => {
  try {
    const {
      email,
      fullName,
      password,
      address,
      phoneNumber,
      gender,
      bloodType,
      dateOfBirth,
      allergies,
    } = req.body;

    const hashed = await bcrypt.hash(password, 10);

    const newPatient = await prisma.$transaction(async (prisma) => {
      const newUser = await prisma.user.create({
        data: {
          email,
          fullName,
          password: hashed,
          role: "PATIENT",
        },
      });

      const patient = await prisma.patient.create({
        data: {
          id: newUser.id, 
          address,
          phoneNumber,
          gender,
          bloodType,
          dateOfBirth,
          allergies,
        },
        include: { user: true },
      });

      return patient;
    });

    return res.status(201).json({
      success: true,
      message: "Patient created successfully",
      data: { patient: newPatient },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to create patient",
      data: {},
    });
  }
};

export const getAllPatients = async (req, res) => {
  try {
    const patients = await prisma.patient.findMany({
      select: {
        phoneNumber: true,
        gender: true,
        dateOfBirth: true
      },
      include: {
        user: {select: {
            fullName: true,
            email: true
        }}, // include user info
      },
    });

    return res.status(200).json({
      success: true,
      message: "Patients retrieved successfully",
      data: { patients },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve patients",
      data: {},
    });
  }
};

export const getPatientById = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid patient ID",
        data: {},
      });
    }

    const requester = req.user; // authenticated user

    // Fetch the patient including all user info
    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        user: true, // fetch all user fields for internal processing
      },
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
        data: {},
      });
    }

    // Role-based response logic
    if (requester.role === "PATIENT") {
      if (requester.id !== patient.id) {
        return res.status(403).json({
          success: false,
          message: "You are not allowed to view this patient",
          data: {},
        });
      }

      const { password, ...safeUser } = patient.user; // exclude password
      return res.status(200).json({
        success: true,
        message: "Patient retrieved successfully",
        data: { patient: { ...patient, user: safeUser } },
      });
    } else {
      const limitedUser = {
        fullName: patient.user.fullName,
        email: patient.user.email,
      };

      return res.status(200).json({
        success: true,
        message: "Patient retrieved successfully",
        data: { patient: { ...patient, user: limitedUser } },
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve patient",
      data: {},
    });
  }
};

