import {Router} from 'express';
const router= Router();

//middleware imports
import { roleInjector } from '../../middleware/roleBasedInjector.js';
import validator  from '../../middleware/formValidator.js';
import { isInvolved } from '../../middleware/diagnosisInvolvementCheck.js';
import { accessChecker } from '../../middleware/universalAccessCheck.js';

//controllers imports
import { createDiagnosis, updateDiagnosis, getDiagnosis, getDiagnosisById, completeDiagnosis } from '../../controllers/diagnosis/diagnosisController.js';


//validators import
import { createDiagnosisSchema } from '../../validators/diagnosis/createDiagnosis.schema.js';
import { updateDiagnosisSchema } from '../../validators/diagnosis/updateDiagnosis.schema.js';



//routing 
router.post('/',accessChecker('DOCTOR'),validator(createDiagnosisSchema), roleInjector, createDiagnosis);
router.patch('/:id',isInvolved, accessChecker('DOCTOR'),validator(updateDiagnosisSchema), updateDiagnosis);
router.get('/',accessChecker(['DOCTOR', 'PATIENT']), getDiagnosis);
router.get('/:id',isInvolved, getDiagnosisById);
router.patch('/:id/complete', isInvolved,accessChecker('DOCTOR'), completeDiagnosis);


export default router;