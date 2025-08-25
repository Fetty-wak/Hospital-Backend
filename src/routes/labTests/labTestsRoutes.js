import { Router } from "express";
const router= Router();

//controller import
import {createLabTest, deleteLabTest, getAllLabTests, getAvailableLabTests, getLabTestById, updateLabTest } from '../../controllers/labTests/labTestsController.js';

//middleware import
import { accessChecker } from "../../middleware/universalAccessCheck.js";
import validator from "../../middleware/formValidator.js";

//validators import
import { createLabTestSchema } from "../../validators/labTests/createLabTest.schema.js";
import { updateLabTestSchema } from "../../validators/labTests/updateLabTest.schema.js";

//route definitions
router.post('/', accessChecker(['ADMIN', 'LAB_TECH']),validator(createLabTestSchema), createLabTest);
router.get('/', accessChecker(['ADMIN', 'LAB_TECH', 'DOCTOR']),getAllLabTests);
router.get('/available', accessChecker(['ADMIN', 'LAB_TECH', 'DOCTOR']), getAvailableLabTests);
router.get('/', accessChecker(['ADMIN', 'LAB_TECH', 'DOCTOR']), getLabTestById);
router.patch('/:id', accessChecker(['LAB_TECH', 'ADMIN']),validator(updateLabTestSchema), updateLabTest);
router.delete('/:id', accessChecker(['ADMIN', 'LAB_TECH']), deleteLabTest);


export default router;