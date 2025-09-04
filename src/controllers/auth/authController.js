import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import { generateToken } from "../../utils/tokenGenerator.js";
import bcrypt from "bcrypt";

// ---------------- Registration ----------------
export const register = async (req, res) => {
  const { fullName, email, password, role, inviteCode } = req.body;

  try {
    const hashed = await bcrypt.hash(password, 10);
    let user;

    await prisma.$transaction(async (tx) => {
      // Invite code required for elevated roles
      let inviteRecord;
      if ((role === "DOCTOR" || role === "LAB_TECH" || role==='PHARMACIST')) {
        if (!inviteCode) throw new Error("Invite code required for elevated roles");

        inviteRecord = await tx.inviteCode.findUnique({ where: { code: inviteCode } });
        if (!inviteRecord) throw new Error("Invalid invite code");
        if (inviteRecord.used) throw new Error("Invite code already used");
        if (inviteRecord.role !== role) throw new Error("Invite code does not match role");
      }

      // Create base user
      user = await tx.user.create({ data: { fullName, email, password: hashed, role } });

      // Role-specific creation
      if (role === "DOCTOR") {
        const { phoneNumber, licenseNumber, practiceStartDate, departmentId } = req.body;
        await tx.doctor.create({ data: { id: user.id, phoneNumber, licenseNumber, practiceStartDate, departmentId } });
      } else if (role === "LAB_TECH") {
        const { phoneNumber, departmentId } = req.body;
        await tx.labTech.create({ data: { id: user.id, phoneNumber, departmentId } });
      } else if (role === "PATIENT") {
        const { address, phoneNumber, allergies, gender, bloodType, dateOfBirth } = req.body;
        await tx.patient.create({ data: { id: user.id, address, phoneNumber, allergies, gender, bloodType, dateOfBirth } });
      }

      // Mark invite code as used
      if (inviteRecord) {
        await tx.inviteCode.update({ where: { id: inviteRecord.id }, data: { used: true } });
      }
    });

    const token = generateToken({ id: user.id, role: user.role, fullName: user.fullName });

    res.status(201).json({
      success: true,
      message: "Signup successful",
      token,
      data: { name: user.fullName, email: user.email },
    });

  } catch (error) {
    console.error("signup error:", error);
    res.status(500).json({ success: false, message: error.message || "Signup failed, internal server error" });
  }
};

// ---------------- Login ----------------
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({success: false, message: "Invalid login details" });

    // Check verification for elevated roles
    if (user.role === "DOCTOR") {
      const doctor = await prisma.doctor.findUnique({ where: { id: user.id } });
      if (!doctor.isVerified) return res.status(403).json({success: false, message: "Account pending verification by admin" });
    } else if (user.role === "LAB_TECH") {
      const labTech = await prisma.labTech.findUnique({ where: { id: user.id } });
      if (!labTech.isVerified) return res.status(403).json({success: false, message: "Account pending verification by admin" });
    }else if(user.role==="PHARMACIST"){
      const pharmacist= await prisma.pharmacist.findUnique({where: {id: user.id}});
      if(!pharmacist.isVerified) return res.status(403).json({success: false, message: 'Account pending verification by admin'});
    }

    // If PATIENT or verified elevated roles, proceed
    const token = generateToken({ id: user.id, role: user.role, fullName: user.fullName });

    res.status(200).json({success: true,token, message: 'login was successful', data: {id: user.id, name: user.fullName, email}});

  } catch (error) {
    console.error("login error:", error);
    res.status(500).json({success: false, message: "Login failed, internal server error" });
  }
};
