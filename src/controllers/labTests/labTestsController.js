import {PrismaClient} from '@prisma/client';
const prisma= new PrismaClient();

// Create lab test type (fields: name, code?)
export const createLabTest = async (req, res) => {
  try {
    const { name, code, description } = req.body;

    const labTest = await prisma.labTest.create({
      data: { name, code, description },
    });

    res.status(201).json({
      success: true,
      message: "Lab test created successfully",
      data: labTest,
    });
  } catch (error) {
    const status = error.code === "P2002" ? 400 : 500;
    res.status(status).json({
      success: false,
      message: "Failed to create lab test",
      data: null,
    });
  }
};

// Get all lab test types
export const getAllLabTests = async (_req, res) => {
  try {
    const labTests = await prisma.labTest.findMany();
    res.status(200).json({
      success: true,
      message: "Lab tests retrieved successfully",
      data: labTests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve lab tests",
      data: null,
    });
  }
};

// Get all available lab test types
export const getAvailableLabTests = async (_req, res) => {
  try {
    const labTests = await prisma.labTest.findMany({where: {available: true}});
    res.status(200).json({
      success: true,
      message: "Available Lab tests retrieved successfully",
      data: labTests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve available lab tests",
      data: null,
    });
  }
};

// Get lab test type by ID
export const getLabTestById = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);

    const labTest = await prisma.labTest.findUnique({ where: { id } });
    if (!labTest) {
      return res.status(404).json({
        success: false,
        message: "Lab test not found",
        data: null,
      });
    }

    res.status(200).json({
      success: true,
      message: "Lab test retrieved successfully",
      data: labTest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve lab test",
      data: null,
    });
  }
};

// Update lab test type (fields: name, code?)
export const updateLabTest = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, code, description, available } = req.body;

    const labTest = await prisma.labTest.update({
      where: { id },
      data: {
        ...(name && {name}),
        ...(code && {code}),
        ...(description && {description}),
        ...(available !==undefined && {available})
      }
    });

    res.status(200).json({
      success: true,
      message: "Lab test updated successfully",
      data: labTest,
    });
  } catch (error) {
    const status = error.code === "P2025" ? 404 : 400;
    res.status(status).json({
      success: false,
      message:
        error.code === "P2025" ? "Lab test not found" : "Failed to update lab test",
      data: null,
    });
  }
};

// Delete lab test type
export const deleteLabTest = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);

    await prisma.labTest.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: "Lab test deleted successfully",
      data: null,
    });
  } catch (error) {
    const status = error.code === "P2025" ? 404 : 500;
    res.status(status).json({
      success: false,
      message:
        error.code === "P2025" ? "Lab test not found" : "Failed to delete lab test",
      data: null,
    });
  }
};
