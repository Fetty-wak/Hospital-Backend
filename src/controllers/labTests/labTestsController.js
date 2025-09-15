import {PrismaClient} from '@prisma/client';
const prisma= new PrismaClient();

// Create lab test type (fields: name, code?)
export const createLabTest = async (req, res) => {
  try {
    const { name, code, description } = req.body;

    //check if a test with similar code exists
    if(code){
      const existing= await prisma.labTest.findUnique({where: {code}});

      if(existing) return res.status(400).json({success: false, message: 'No duplicate tests allowed'});
    }
    
    //create a labTest
    const labTest = await prisma.labTest.create({
      data: { 
        name,
        description,
        ...(code && {code})
      },
    });

    res.status(201).json({
      success: true,
      message: "Lab test created successfully",
      data: labTest,
    });
  } catch (error) {
    const status = error.code === "P2002" ? 400 : 500;
    console.error("error creating labTest", error);
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
    const id = Number(req.params.id);

    if(!Number.isFinite(id)){
      return res.status(400).json({success: false, message: 'Invalid labTest id'});
    }

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
    const id = Number(req.params.id);
    const { name, code, description } = req.body;

    if(!Number.isFinite(id)){
      return res.status(400).json({success: false, message: 'Invalid labTest id'});
    }

    const exists= await prisma.labTest.findUnique({where: {id}});

    if(!exists) return res.status(404).json({success: false, message: 'LabTest does not exist'});

    const labTest = await prisma.labTest.update({
      where: { id },
      data: {
        ...(name && {name}),
        ...(code && {code}),
        ...(description && {description}),
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
    const id = Number(req.params.id);

    if(!Number.isFinite(id)){
      return res.status(400).json({success: false, message: 'Invalid labTest id'});
    }

    const exists= await prisma.labTest.findUnique({where: {id}});

    if(!exists) return res.status(404).json({success: false, message: 'LabTest does not exist'});

    if(!exists.available) return res.status(400).json({success: false, message: 'The test is already delisted'});
    
    const delisted= await prisma.labTest.update({ where: { id }, data: {available: false} });

    res.status(200).json({
      success: true,
      message: "Lab test delisted successfully",
      data: delisted,
    });
  } catch (error) {
    const status = error.code === "P2025" ? 404 : 500;
    res.status(status).json({
      success: false,
      message:
        error.code === "P2025" ? "Lab test not found" : "Failed to delist lab test",
      data: null,
    });
  }
};
