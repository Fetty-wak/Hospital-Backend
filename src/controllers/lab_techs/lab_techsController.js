import { PrismaClient } from "@prisma/client";
const prisma= new PrismaClient();
import bcrypt from 'bcrypt';
import { notify } from "../../utils/notificationCreator.js";

export const createLabTech = async (req, res) => {
  try {
    const {
      email,
      password,
      fullName,
      phoneNumber,
      departmentId,
    } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const labTech = await prisma.$transaction(async (tx) => {
      // Create the User (role = LAB_TECH)
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          fullName,
          role: "LAB_TECH",
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      });

      // Create the LabTech (FK id === user.id)
      const created = await tx.labTech.create({
        data: {
          id: user.id,
          phoneNumber,
          departmentId,
          isVerified: true,
        },
        include: {
          user: {
            select: { id: true, email: true, fullName: true, role: true, isActive: true, createdAt: true },
          },
          department: true,
        },
      });

      return created;
    });

    return res.status(201).json({
      success: true,
      message: "Lab tech created successfully",
      data: { labTech },
    });
  } catch (err) {
    console.error("createLabTech error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      data: null,
    });
  }
};


export const getAllLabTechs = async (req, res) => {
  try {
    const labTechs = await prisma.labTech.findMany({
      where: {
        isVerified: true,
        user: {
          isActive: true,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
            isActive: true,
            createdAt: true,
          },
        },
        department: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Lab technicians fetched successfully",
      data: labTechs,
    });
  } catch (error) {
    console.error("Error fetching lab technicians:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch lab technicians",
      data: null,
    });
  }
};


export const getLabTechById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid id parameter",
        data: {},
      });
    }

    const labTech = await prisma.labTech.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
            isActive: true,
            createdAt: true,
          },
        },
        department: { select: { id: true, name: true } },
      },
    });

    if (!labTech) {
      return res.status(404).json({
        success: false,
        message: "Lab technician not found",
        data: {},
      });
    }

    // Full profile for admin or the lab tech owner (labTech.id === user.id)
    if (req.user?.role === "ADMIN" || req.user?.id === labTech.id) {
      return res.status(200).json({
        success: true,
        message: "Lab technician profile fetched",
        data: { labTech },
      });
    }

    // Limited profile for others
    const limited = {
      fullName: labTech.user.fullName,
      email: labTech.user.email,
      phoneNumber: labTech.phoneNumber,
      department: labTech.department, 
    };

    return res.status(200).json({
      success: true,
      message: "Limited profile fetched",
      data: { labTech: limited },
    });
  } catch (err) {
    console.error("getLabTechById error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      data: { error: err.message },
    });
  }
};


export const updateLabTech = async (req, res) => {
  try {
    const labTechId = Number(req.params.id);
    if (!Number.isInteger(labTechId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid labTech ID",
        data: {},
      });
    }

    const labTech = await prisma.labTech.findUnique({
      where: { id: labTechId },
      include: { user: true, department: true },
    });

    if (!labTech) {
      return res.status(404).json({
        success: false,
        message: "Lab technician not found",
        data: {},
      });
    }

    const { departmentId, phoneNumber } = req.body;
    let dataToUpdate = {};

    // ---------------------- ADMIN LOGIC ----------------------
    if (req.user.role === "ADMIN") {
      if (departmentId === undefined) {
        return res.status(400).json({
          success: false,
          message: "Admin must provide departmentId to update",
          data: {},
        });
      }

      dataToUpdate.departmentId = departmentId;

      // notify(labTech.user.id, "Your department was updated by admin");
      await notify({
        type: 'LABTECH_UPDATE',
        message: `Admin ${req.user.fullName} has changed your department`,
        initiatorId: req.user.id,
        recipientIds: [labTech.id],
        eventId: labTech.id
      });

    }else if (req.user.id === labTech.id) {
      if (phoneNumber !== undefined) dataToUpdate.phoneNumber = phoneNumber;
      if (departmentId !== undefined) {
        dataToUpdate.departmentId = departmentId;
        dataToUpdate.isVerified = false;

        // TODO: Plug in notification util here to notify admins for verification
        const adminIds= await prisma.user.findMany({where: {role: 'ADMIN'}, select: {id: true}});
        const recipientIds = adminIds.map(admin => admin.id); 

        await notify({
            type: 'LABTECH_UPDATE',
            message: `Lab Technician, ${req.user.fullName}, has changed their department. Please verify.`,
            initiatorId: req.user.id,
            recipientIds,
            eventId: labTech.id
        });
      }

      if (Object.keys(dataToUpdate).length === 0) {
        return res.status(400).json({
          success: false,
          message: "Nothing to update",
          data: {},
        });
      }
    }

    const updatedLabTech = await prisma.labTech.update({
      where: { id: labTechId },
      data: dataToUpdate,
      include: { user: { select: { id: true, email: true, fullName: true, role: true, isActive: true, createdAt: true } }, department: true },
    });

    return res.status(200).json({
      success: true,
      message: "Lab technician updated successfully",
      data: { labTech: updatedLabTech },
    });
  } catch (err) {
    console.error("updateLabTech error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      data: { error: err.message },
    });
  }
};


export const verifyLabTech = async (req, res) => {
  try {
    const labTechId = Number(req.params.id);
    if (!Number.isInteger(labTechId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid labTech ID",
        data: {},
      });
    }

    const labTech = await prisma.labTech.findUnique({
      where: { id: labTechId },
      include: { user: true, department: true },
    });

    if (!labTech) {
      return res.status(404).json({
        success: false,
        message: "Lab technician not found",
        data: {},
      });
    }

    const updatedLabTech = await prisma.labTech.update({
      where: { id: labTechId },
      data: { isVerified: true },
      include: {
        user: { select: { id: true, email: true, fullName: true, role: true, isActive: true, createdAt: true } },
        department: true,
      },
    });

    // notify(labTech.user.id, "You have been verified by admin");
    await notify({
        type: 'LABTECH_UPDATE',
        message: `Admin ${req.user.fullName} has verified your profile. You can now proceed`,
        initiatorId: req.user.id,
        recipientIds: [updatedLabTech.id],
        eventId: updatedLabTech.id
    });

    return res.status(200).json({
      success: true,
      message: "Lab technician verified successfully",
      data: { labTech: updatedLabTech },
    });
  } catch (err) {
    console.error("verifyLabTech error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      data: { error: err.message },
    });
  }
};
