import {Router} from 'express';
const router= Router();

//controller import
import { cancelLabResult, completeLabResult, getAllLabResults, getLabResultById, updateLabResult } from '../../controllers/labResults/labResultsController.js';

//middleware import
import { accessChecker } from '../../middleware/universalAccessCheck.js';
import validator from '../../middleware/formValidator.js';

//zod schema imports
import { updateLabResultSchema } from '../../validators/labResults/updateLabResults.schema.js';
import { cancelLabResultSchema } from '../../validators/labResults/cancelLabResults.schema.js';


//route definitions
router.patch('/:id', accessChecker('LAB_TECH'), validator(updateLabResultSchema), updateLabResult);
router.patch('/:id', accessChecker('DOCTOR'), validator(cancelLabResultSchema), cancelLabResult);
router.patch('/:id/complete', accessChecker('LAB_TECH'), completeLabResult);
router.get('/', accessChecker(['DOCTOR', 'PATIENT', 'ADMIN', 'LAB_TECH']), getAllLabResults);
router.get('/:id', accessChecker(['DOCTOR', 'PATIENT', 'ADMIN', 'LAB_TECH']), getLabResultById);

export default router;