import {Router} from 'express';
const router= Router();

//controller import
import {createDoctor, getDoctorById, getDoctors, updateDoctor, verifyDoctor } from '../../controllers/doctors/doctorsController.js';

// middleware import
import validator from '../../middleware/formValidator.js';
import {accessChecker} from '../../middleware/universalAccessCheck.js';
import {emailExists} from '../../middleware/emailCheck.js';

//zod schemas import
import { adminDoctorSchema } from '../../validators/adminUserCreation.schema.js';
import { updateDoctorSchema } from '../../validators/doctors/updateDoctors.schema.js';

//route definitions
router.post('/', accessChecker('ADMIN'), validator(adminDoctorSchema), emailExists(false), createDoctor);
router.get('/', getDoctors);
router.get('/:id',getDoctorById);
router.patch('/:id', accessChecker(['ADMIN', 'DOCTOR']), validator(updateDoctorSchema), updateDoctor);
router.patch('/:id/verify', accessChecker('ADMIN'), verifyDoctor);

export default router;