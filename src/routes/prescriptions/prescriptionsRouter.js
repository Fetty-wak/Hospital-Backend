import {Router} from 'express';
const router= Router();

//controller imports
import { deletePrescription, dispensePrescription, getPrescriptionById, getPrescriptions, updatePrescription } from '../../controllers/prescriptions/prescriptionsController.js';

//middleware imports
import { accessChecker } from '../../middleware/universalAccessCheck.js';
import validator from '../../middleware/formValidator.js';

//zod validation schemas import
import { updatePrescriptionSchema } from '../../validators/prescriptions/updatePrescriptions.schema.js';

//route definitions
router.patch('/:id', accessChecker(['DOCTOR', 'PHARMACIST']), validator(updatePrescriptionSchema),  updatePrescription);
router.get('/', accessChecker(['ADMIN', 'PATIENT', 'DOCTOR', 'PHARMACIST']), getPrescriptions);
router.get('/:id', accessChecker(['ADMIN', 'DOCTOR', 'PATIENT', 'PHARMACIST']), getPrescriptionById);
router.patch('/:id/dispense', accessChecker('PHARMACIST'), dispensePrescription );
router.patch('/:id/cancel', accessChecker('DOCTOR'), deletePrescription);

export default router;