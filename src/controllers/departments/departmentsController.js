import { PrismaClient } from "@prisma/client";
const prisma= new PrismaClient();
import { notify } from "../../utils/notificationCreator.js";

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

    //notifications to everyone in the department
    const users= await prisma.department.findUnique({
      where: {id},
      include: {doctors: {user: true},
                pharmacists: {user: true},
                labTechs: {user: true}
               }
    });

    let recipientIds=[];
    if(users.doctors.length>0) recipientIds.push(...(users.doctors.map((doc)=>(doc.user.id))));
    if(users.pharmacists.length>0) recipientIds.push(...(users.pharmacists.map((pharmacist)=> (pharmacist.user.id))));
    if (users.labTechs.length>0) recipientIds.push(...(users.labTechs.map((labTech)=>(labTech.user.id))));

    //notify
    if(recipientIds.length>0){
      await notify({
        initiatorId: req.user.id,
        recipientIds,
        type: "DEPARTMENT_UPDATE",
        eventId: department.id,
        message: `Admin ${req.user.fullName}, has updated the department name to ${name}`
      });
    }

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

    await prisma.department.update({ where: { id }, data: {isActive: false} });

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