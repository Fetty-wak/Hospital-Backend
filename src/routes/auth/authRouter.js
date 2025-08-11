import {Router} from 'express'
const router= Router();

//mount auth controllers
import {register, login} from '../../controllers/auth/authController.js'

//mount middleware
import validator from '../../middleware/formValidator.js'
import { emailExists } from '../../middleware/emailCheck.js';

//mount validators
import {registrationSchema, loginSchema} from '../../validators/authValidators.schema.js'

//route definitions
router.post('/register', validator(registrationSchema),emailExists(false), register);
router.post('/login', validator(loginSchema),emailExists(true), login);

export default router;
