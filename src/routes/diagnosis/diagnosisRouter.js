import {Router} from 'express';
const router= Router();

//middleware imports
import { roleInjector } from '../../middleware/roleBasedInjector.js';
import { validator } from '../../middleware/formValidator.js'


//controllers imports
import { createDiagnosis } from '../../controllers/diagnosis/diagnosisController.js';


//validators import
import { createDiagnosisSchema } from '../../validators/diagnosis/createDiagnosis.schema.js';


//routing 
router.post('/',validator(createDiagnosisSchema), roleInjector, createDiagnosis);


export default router;