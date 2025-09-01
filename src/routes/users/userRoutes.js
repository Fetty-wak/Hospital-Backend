import {Router} from 'express';
const router= Router();

//controller imports
import {deleteUser, getUserById, getUsers, updateUser } from '../../controllers/users/userController.js';

//middleware imports
import { accessChecker } from '../../middleware/universalAccessCheck.js';
import validator from '../../middleware/formValidator.js';

//zod validators imports
import { updateUserSchema } from '../../validators/users/updateUser.schema.js';

//route definitions
router.get('/', accessChecker('ADMIN'), getUsers);
router.get('/:id', getUserById);
router.patch('/:id/delete', deleteUser);
router.patch('/:id',validator(updateUserSchema), updateUser);

export default router;