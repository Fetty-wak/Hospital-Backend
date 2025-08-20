import {Router} from 'express';
const router= Router();

//middleware imports
import { roleInjector } from '../../middleware/roleBasedInjector.js';
import validator  from '../../middleware/formValidator.js';
import { accessChecker } from '../../middleware/diagnosisAccessCheck.js';

//controllers imports
import { createDiagnosis, updateDiagnosis } from '../../controllers/diagnosis/diagnosisController.js';


//validators import
import { createDiagnosisSchema } from '../../validators/diagnosis/createDiagnosis.schema.js';
import { updateDiagnosisSchema } from '../../validators/diagnosis/updateDiagnosis.schema.js';


//routing 
router.post('/',validator(createDiagnosisSchema), roleInjector, createDiagnosis);
router.patch('/:id', validator(updateDiagnosisSchema), accessChecker, updateDiagnosis);


export default router;