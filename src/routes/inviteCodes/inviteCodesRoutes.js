import {Router} from 'express';
const router= Router();

//controller import
import { createInviteCode, deleteInviteCode, getInviteCodes } from '../../controllers/inviteCodes/inviteCodesController.js';

//middleware import
import {accessChecker} from '../../middleware/universalAccessCheck.js';
import validator from '../../middleware/formValidator.js';

//zod schemas import
import { createInviteSchema } from '../../validators/inviteCodes/createInviteCodes.schema.js';

//route definitions
router.post('/', accessChecker('ADMIN'), validator(createInviteSchema), createInviteCode);
router.get('/', accessChecker('ADMIN'), getInviteCodes);
router.delete('/:id', accessChecker('ADMIN'), deleteInviteCode);

export default router;