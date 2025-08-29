import {Router} from 'express';
const router= Router();

//controller import
import {createLabTech, getAllLabTechs, getLabTechById, updateLabTech, verifyLabTech} from '../../controllers/lab_techs/lab_techsController.js';

//middleware import
import { accessChecker } from '../../middleware/universalAccessCheck.js';
import validator from '../../middleware/formValidator.js';
import { emailExists } from '../../middleware/emailCheck.js';

//zod validators import
import { adminLabTechSchema } from '../../validators/adminUserCreation.schema.js';
import { updateLabTechSchema } from '../../validators/lab_techs/updateLabTechs.schema.js';

//route definitions
router.post('/', accessChecker('ADMIN'), validator(adminLabTechSchema), emailExists(false), createLabTech);
router.get('/', accessChecker(['ADMIN', 'LAB_TECH']), getAllLabTechs);
router.get('/:id', getLabTechById );
router.patch('/:id', accessChecker(['ADMIN', 'LAB_TECH']), validator(updateLabTechSchema), updateLabTech);
router.patch('/:id/verify', accessChecker('ADMIN'), verifyLabTech);

export default router;