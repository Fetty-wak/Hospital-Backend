import {Router} from 'express';
const router= Router();

//controller import
import {createPatient, getAllPatients, getPatientById, updatePatient } from '../../controllers/patients/patientsController.js';

//middleware import
import validator from '../../middleware/formValidator.js';
import { accessChecker } from '../../middleware/universalAccessCheck.js';
import { emailExists } from '../../middleware/emailCheck.js';

//zod validators import
import { adminPatientSchema } from '../../validators/adminUserCreation.schema.js';
import {updatePatientSchema} from '../../validators/patients/updatePatients.schema.js'

//route definitions
router.post('/', accessChecker('ADMIN'), validator(adminPatientSchema), emailExists(false), createPatient);
router.get('/', accessChecker(['ADMIN', 'DOCTOR', 'PHARMACIST', 'LAB_TECH']), getAllPatients);
router.get('/:id', getPatientById);
router.patch('/:id', accessChecker(['PATIENT', 'ADMIN', 'DOCTOR']), validator(updatePatientSchema),updatePatient); 


export default router;
