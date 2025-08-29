import {Router} from 'express';
const router = Router();

//controller imports
import {createPharmacist, getAllPharmacists, getPharmacistById, updatePharmacist, verifyPharmacist} from '../../controllers/pharmacists/pharmacistController.js';

//middleware imports
import validator from '../../middleware/formValidator.js';
import { accessChecker } from '../../middleware/universalAccessCheck.js';
import { emailExists } from '../../middleware/emailCheck.js';

//zod validators imports
import { adminPharmacistSchema } from '../../validators/adminUserCreation.schema.js';
import { updatePharmacistSchema } from '../../validators/pharmacists/updatePharmacist.schema.js';

//route definitions
router.post('/', accessChecker('ADMIN'), validator(adminPharmacistSchema), emailExists(false), createPharmacist);
router.get('/', accessChecker(['ADMIN', 'PHARMACIST']), getAllPharmacists);
router.get('/:id', getPharmacistById);
router.patch('/:id', accessChecker(['ADMIN', 'PHARMACIST']), validator(updatePharmacistSchema), updatePharmacist);
router.patch('/:id/verify', accessChecker('ADMIN'), verifyPharmacist);


export default router;