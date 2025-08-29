import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import bcrypt from 'bcrypt';
import { notify } from "../../utils/notificationCreator.js";

// -------------------- CREATE PHARMACIST --------------------
export const createPharmacist = async (req, res) => {
  try {
    const { email, password, fullName, phoneNumber, departmentId } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const pharmacist = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email, password: hashedPassword, fullName, role: "PHARMACIST" },
        select: { id: true, email: true, fullName: true, role: true, isActive: true, createdAt: true },
      });

      const created = await tx.pharmacist.create({
        data: { id: user.id, phoneNumber, departmentId, isVerified: true },
        include: {
          user: { select: { id: true, email: true, fullName: true, role: true, isActive: true, createdAt: true } },
          department: true,
        },
      });

      return created;
    });

    return res.status(201).json({
      success: true,
      message: "Pharmacist created successfully",
      data: { pharmacist },
    });
  } catch (err) {
    console.error("createPharmacist error:", err);
    return res.status(500).json({ success: false, message: "Internal server error", data: null });
  }
};

// -------------------- GET ALL PHARMACISTS --------------------
export const getAllPharmacists = async (req, res) => {
  try {
    const pharmacists = await prisma.pharmacist.findMany({
      where: { isVerified: true, user: { isActive: true } },
      include: {
        user: { select: { id: true, email: true, fullName: true, role: true, isActive: true, createdAt: true } },
        department: true,
      },
    });

    return res.status(200).json({ success: true, message: "Pharmacists fetched successfully", data: pharmacists });
  } catch (err) {
    console.error("getAllPharmacists error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch pharmacists", data: null });
  }
};

// -------------------- GET PHARMACIST BY ID --------------------
export const getPharmacistById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ success: false, message: "Invalid id parameter", data: {} });

    const pharmacist = await prisma.pharmacist.findUnique({
      where: { id },
      include: { user: { select: { id: true, email: true, fullName: true, role: true, isActive: true, createdAt: true } }, department: { select: { id: true, name: true } } },
    });

    if (!pharmacist) return res.status(404).json({ success: false, message: "Pharmacist not found", data: {} });

    if (req.user?.role === "ADMIN" || req.user?.id === pharmacist.id) {
      return res.status(200).json({ success: true, message: "Pharmacist profile fetched", data: { pharmacist } });
    }

    const limited = { fullName: pharmacist.user.fullName, email: pharmacist.user.email, phoneNumber: pharmacist.phoneNumber, department: pharmacist.department };
    return res.status(200).json({ success: true, message: "Limited profile fetched", data: { pharmacist: limited } });
  } catch (err) {
    console.error("getPharmacistById error:", err);
    return res.status(500).json({ success: false, message: "Internal server error", data: { error: err.message } });
  }
};

// -------------------- UPDATE PHARMACIST --------------------
export const updatePharmacist = async (req, res) => {
  try {
    const pharmacistId = Number(req.params.id);
    if (!Number.isInteger(pharmacistId)) return res.status(400).json({ success: false, message: "Invalid pharmacist ID", data: {} });

    const pharmacist = await prisma.pharmacist.findUnique({ where: { id: pharmacistId }, include: { user: true, department: true } });
    if (!pharmacist) return res.status(404).json({ success: false, message: "Pharmacist not found", data: {} });

    const { departmentId, phoneNumber } = req.body;
    let dataToUpdate = {};

    if (req.user.role === "ADMIN") {
      if (departmentId === undefined) return res.status(400).json({ success: false, message: "Admin must provide departmentId to update", data: {} });
      dataToUpdate.departmentId = departmentId;
      await notify({ type: 'PHARMACIST_UPDATE', message: `Admin ${req.user.fullName} has changed your department`, initiatorId: req.user.id, recipientIds: [pharmacist.id], eventId: pharmacist.id });
    } else if (req.user.id === pharmacist.id) {
      if (phoneNumber !== undefined) dataToUpdate.phoneNumber = phoneNumber;
      if (departmentId !== undefined) {
        dataToUpdate.departmentId = departmentId;
        dataToUpdate.isVerified = false;
        const adminIds = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } });
        const recipientIds = adminIds.map(admin => admin.id);
        await notify({ type: 'PHARMACIST_UPDATE', message: `Pharmacist, ${req.user.fullName}, has changed their department. Please verify.`, initiatorId: req.user.id, recipientIds, eventId: pharmacist.id });
      }
      if (Object.keys(dataToUpdate).length === 0) return res.status(400).json({ success: false, message: "Nothing to update", data: {} });
    }

    const updatedPharmacist = await prisma.pharmacist.update({ where: { id: pharmacistId }, data: dataToUpdate, include: { user: { select: { id: true, email: true, fullName: true, role: true, isActive: true, createdAt: true } }, department: true } });
    return res.status(200).json({ success: true, message: "Pharmacist updated successfully", data: { pharmacist: updatedPharmacist } });
  } catch (err) {
    console.error("updatePharmacist error:", err);
    return res.status(500).json({ success: false, message: "Internal server error", data: { error: err.message } });
  }
};

// -------------------- VERIFY PHARMACIST --------------------
export const verifyPharmacist = async (req, res) => {
  try {
    const pharmacistId = Number(req.params.id);
    if (!Number.isInteger(pharmacistId)) return res.status(400).json({ success: false, message: "Invalid pharmacist ID", data: {} });

    const pharmacist = await prisma.pharmacist.findUnique({ where: { id: pharmacistId }, include: { user: true, department: true } });
    if (!pharmacist) return res.status(404).json({ success: false, message: "Pharmacist not found", data: {} });

    const updatedPharmacist = await prisma.pharmacist.update({ where: { id: pharmacistId }, data: { isVerified: true }, include: { user: { select: { id: true, email: true, fullName: true, role: true, isActive: true, createdAt: true } }, department: true } });

    await notify({ type: 'PHARMACIST_UPDATE', message: `Admin ${req.user.fullName} has verified your profile. You can now proceed`, initiatorId: req.user.id, recipientIds: [updatedPharmacist.id], eventId: updatedPharmacist.id });

    return res.status(200).json({ success: true, message: "Pharmacist verified successfully", data: { pharmacist: updatedPharmacist } });
  } catch (err) {
    console.error("verifyPharmacist error:", err);
    return res.status(500).json({ success: false, message: "Internal server error", data: { error: err.message } });
  }
};
