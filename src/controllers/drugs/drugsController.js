import {PrismaClient} from '@prisma/client';
const prisma= new PrismaClient();

// Create drug (fields: name, description?, dosageForm, strength)
export const createDrug = async (req, res) => {
  try {
    const { name, description, dosageForm, strength } = req.body;

    const drug = await prisma.drug.create({
      data: { name, description, dosageForm, strength },
    });

    res.status(201).json({
      success: true,
      message: "Drug created successfully",
      data: drug,
    });
  } catch (error) {
    const status = error.code === "P2002" ? 400 : 500;
    res.status(status).json({
      success: false,
      message: "Failed to create drug",
      data: null,
    });
  }
};

// Get all drugs
export const getAllDrugs = async (_req, res) => {
  try {
    const drugs = await prisma.drug.findMany();
    res.status(200).json({
      success: true,
      message: "Drugs retrieved successfully",
      data: drugs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve drugs",
      data: null,
    });
  }
};

// Get drug by ID
export const getDrugById = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);

    const drug = await prisma.drug.findUnique({ where: { id } });
    if (!drug) {
      return res.status(404).json({
        success: false,
        message: "Drug not found",
        data: null,
      });
    }

    res.status(200).json({
      success: true,
      message: "Drug retrieved successfully",
      data: drug,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve drug",
      data: null,
    });
  }
};

// Update drug (fields: name, description?, dosageForm, strength)
export const updateDrug = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, description, dosageForm, available, strength } = req.body;

    const drug = await prisma.drug.update({
      where: { id },
      data: { 
        ...(name && {name}),
        ...(description && {description}),
        ...(strength && {strength}),
        ...(dosageForm && {dosageForm}),
        ...(available !== undefined && {available})
       }
    });

    res.status(200).json({
      success: true,
      message: "Drug updated successfully",
      data: drug,
    });
  } catch (error) {
    const status = error.code === "P2025" ? 404 : 400;
    res.status(status).json({
      success: false,
      message:
        error.code === "P2025" ? "Drug not found" : "Failed to update drug",
      data: null,
    });
  }
};

// Delete drug
export const deleteDrug = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);

    await prisma.drug.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: "Drug deleted successfully",
      data: null,
    });
  } catch (error) {
    const status = error.code === "P2025" ? 404 : 500;
    res.status(status).json({
      success: false,
      message:
        error.code === "P2025" ? "Drug not found" : "Failed to delete drug",
      data: null,
    });
  }
};
