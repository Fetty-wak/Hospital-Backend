import { PrismaClient } from "@prisma/client";
const prisma= new PrismaClient();
import bcrypt from 'bcrypt';

export const getUsers = async (req, res) => {
  try {
    const { role, page, limit } = req.query;

    // base filter: active users only
    const where = {
      isActive: true,
      ...(role ? { role } : {})
    };

    // optional pagination (only if both page & limit are valid positive integers)
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const usePagination =
      Number.isInteger(pageNum) && pageNum > 0 &&
      Number.isInteger(limitNum) && limitNum > 0;

    const query = {
      where,
      include: {
        doctor: { include: { department: true } },
        patient: true,
        pharmacist: { include: { department: true } },
        labTech: { include: { department: true } },
      },
      ...(usePagination ? { skip: (pageNum - 1) * limitNum, take: limitNum } : {})
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany(query),
      prisma.user.count({ where })
    ]);

    // strip password field from results
    const safeUsers = users.map(({ password, ...rest }) => rest);

    const responseData = usePagination
      ? {
          users: safeUsers,
          meta: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.max(1, Math.ceil(total / limitNum)),
          },
        }
      : { users: safeUsers };

    return res.status(200).json({
      success: true,
      message: "Users retrieved successfully",
      data: responseData,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      data: null,
    });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const idNum = Number(id);
    const activeUser= req.user;

    if (!Number.isInteger(idNum) || idNum <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid user id",
        data: null,
      });
    }

    const user = await prisma.user.findFirst({
      where: { id: idNum, isActive: true },
      include: {
        doctor: { include: { department: true } },
        patient: true,
        pharmacist: { include: { department: true } },
        labTech: { include: { department: true } },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        data: null,
      });
    }

    // Only actual user or admin is allowed
    if (activeUser.id !== existing.id && activeUser.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
        data: null,
      });
    }

    const { password, ...safeUser } = user;

    return res.status(200).json({
      success: true,
      message: "User retrieved successfully",
      data: safeUser,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user",
      data: null,
    });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const idNum = Number(id);
    const activeUser = req.user;

    if (!Number.isInteger(idNum) || idNum <= 0 || Number.isNaN(idNum)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user id",
        data: null,
      });
    }

    // Ensure the target user exists and is active
    const existing = await prisma.user.findFirst({
      where: { id: idNum, isActive: true },
      select: { id: true },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "User not found or inactive",
        data: null,
      });
    }

    // Only actual user or admin is allowed
    if (activeUser.id !== existing.id && activeUser.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
        data: null,
      });
    }

    // Obtain fields and hash password if present
    const { fullName, password } = req.body;
    let hashedPassword;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const updated = await prisma.user.update({
      where: { id: idNum },
      data: {
        ...(hashedPassword && { password: hashedPassword }),
        ...(fullName && { fullName }),
      },
      include: {
        doctor: { include: { department: true } },
        patient: true,
        pharmacist: { include: { department: true } },
        labTech: { include: { department: true } },
      },
    });

    // Strip password if it sneaks through
    if (updated.password) {
      delete updated.password;
    }

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Update failed. Internal server error",
      data: null,
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const idNum = Number(id);
    const activeUser= req.user;

    if (!Number.isInteger(idNum) || idNum <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid user id",
        data: null,
      });
    }

    // Ensure exists & active before deactivation
    const existing = await prisma.user.findFirst({
      where: { id: idNum, isActive: true },
      select: { id: true },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "User not found or already inactive",
        data: null,
      });
    }

    //only actual users or admin are allowed
    if(activeUser.id !== existing.id && activeUser.role !== 'ADMIN'){
        return res.status(403).json({success: false, message: 'Access denied', data: {}});
    }

    const deactivated = await prisma.user.update({
      where: { id: idNum },
      data: { isActive: false },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "User deactivated successfully",
      data: deactivated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to deactivate user",
      data: null,
    });
  }
};
