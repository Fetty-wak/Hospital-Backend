import { PrismaClient } from "@prisma/client";
const prisma= new PrismaClient();


// ======= CREATE INVITE CODE =======
export const createInviteCode = async (req, res) => {
  const { role, expiresAt } = req.body;
  const adminId = req.user.id; 

  try {
    if (!role || !["DOCTOR", "LAB_TECH", "PHARMACIST"].includes(role)) {
      return res.status(400).json({success: false, message: "Invalid or missing role for invite code", data: {}});
    }

    // generate 8-character alphanumeric code (A-Z, 0-9)
    const generateCode = () => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let code = "";
        for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    };

    const code= generateCode();

    const inviteCode = await prisma.inviteCode.create({
      data: {
        code,
        role,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdBy: adminId,
      },
    });

    res.status(201).json({
      success: true,
      message: "Invite code created successfully",
      data: inviteCode,
    });
  } catch (error) {
    console.error("Create invite code error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create invite code",
    });
  }
};

// ======= GET ALL INVITE CODES =======
export const getInviteCodes = async (req, res) => {
  const { role, used } = req.query;

  try {
    const filters = {};
    if (role) filters.role = role;
    if (used !== undefined) filters.used = used === "true";

    const inviteCodes = await prisma.inviteCode.findMany({
      where: filters,
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({
      success: true,
      message: "Invite codes retrieved successfully",
      data: inviteCodes,
    });
  } catch (error) {
    console.error("Get invite codes error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve invite codes",
    });
  }
};

// ======= DELETE INVITE CODE =======
export const deleteInviteCode = async (req, res) => {
  const { id } = req.params;

  try {
    const codeId= Number(id);
    if(!Number.isInteger(codeId)){
        return res.status(400).json({
            success: false,
            message: 'Invalid id',
            data: {}
        });
    }

    const existing = await prisma.inviteCode.findUnique({ where: { id: codeId } });
    if (!existing) throw new Error("Invite code not found");

    await prisma.inviteCode.delete({ where: { id: codeId } });

    res.status(200).json({
      success: true,
      message: "Invite code deleted successfully",
    });
  } catch (error) {
    console.error("Delete invite code error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete invite code",
    });
  }
};
