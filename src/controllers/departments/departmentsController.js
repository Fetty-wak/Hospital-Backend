import { PrismaClient } from "@prisma/client";
const prisma= new PrismaClient();

// Create department (fields: name)
export const createDepartment = async (req, res) => {
  try {
    const { name } = req.body;

    const department = await prisma.department.create({ data: { name } });

    res.status(201).json({
      success: true,
      message: "Department created successfully",
      data: department,
    });
  } catch (error) {
    const status = error.code === "P2002" ? 400 : 500;
    res.status(status).json({
      success: false,
      message: "Failed to create department",
      data: null,
    });
  }
};

// Get all departments
export const getAllDepartments = async (_req, res) => {
  try {
    const departments = await prisma.department.findMany();
    res.status(200).json({
      success: true,
      message: "Departments retrieved successfully",
      data: departments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve departments",
      data: null,
    });
  }
};

// Get department by ID
export const getDepartmentById = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);

    const department = await prisma.department.findUnique({ where: { id } });
    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
        data: null,
      });
    }

    res.status(200).json({
      success: true,
      message: "Department retrieved successfully",
      data: department,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve department",
      data: null,
    });
  }
};

// Update department (fields: name)
export const updateDepartment = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { name } = req.body;

    const department = await prisma.department.update({
      where: { id },
      data: { name },
    });

    res.status(200).json({
      success: true,
      message: "Department updated successfully",
      data: department,
    });
  } catch (error) {
    const status = error.code === "P2025" ? 404 : 400;
    res.status(status).json({
      success: false,
      message:
        error.code === "P2025" ? "Department not found" : "Failed to update department",
      data: null,
    });
  }
};

// Delete department
export const deleteDepartment = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);

    await prisma.department.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: "Department deleted successfully",
      data: null,
    });
  } catch (error) {
    const status = error.code === "P2025" ? 404 : 500;
    res.status(status).json({
      success: false,
      message:
        error.code === "P2025" ? "Department not found" : "Failed to delete department",
      data: null,
    });
  }
};