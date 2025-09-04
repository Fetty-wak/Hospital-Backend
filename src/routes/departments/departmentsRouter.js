import {Router} from 'express';
const router= Router();

//import controllers
import {createDepartment, getAllDepartments, getDepartmentById, updateDepartment, deleteDepartment} from '../../controllers/departments/departmentsController.js'

//import middleware
import validator from '../../middleware/formValidator.js';
import { accessChecker } from '../../middleware/universalAccessCheck.js';

//import validators
import { createDepartmentSchema } from '../../validators/department/createDepartment.schema.js';

//define routes
router.post('/',accessChecker('ADMIN'), validator(createDepartmentSchema), createDepartment);
router.get('/', accessChecker(['ADMIN', 'DOCTOR', 'LAB_TECH', 'PHARMACIST']),getAllDepartments);
router.get('/:id', accessChecker(['ADMIN', 'DOCTOR', 'LAB_TECH', 'PHARMACIST']), getDepartmentById);
router.patch('/:id', accessChecker('ADMIN'),validator(createDepartmentSchema), updateDepartment); //reusing the schema cause its the same
router.delete('/:id', accessChecker('ADMIN'), deleteDepartment);


export default router;