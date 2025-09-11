import { Router } from "express";
const router= Router();

//import controllers
import { createAppointment, getAllAppointments, getAppointmentById, updateAppointment, confirmAppointment, cancelAppointment, completeAppointment, updateAppointmentNotes} from "../../controllers/appointments/appointmentController.js";

//import middleware (input validation, role injection)
import validator from "../../middleware/formValidator.js";
import { roleInjector } from "../../middleware/roleBasedInjector.js";
import { isInvolved } from "../../middleware/appointmentInvolvementCheck.js";
import { accessChecker } from "../../middleware/universalAccessCheck.js";

//import zod schemas
import { createAppointmentSchema } from "../../validators/appointment/appointmentCreation.schema.js";
import { updateAppointmentSchema } from "../../validators/appointment/appointmentUpdate.schema.js";
import { cancelAppointmentSchema } from "../../validators/appointment/appointmentCancellation.schema.js";
import { appointmentNotesSchema } from "../../validators/appointment/appointmentNotes.schema.js";

//route definitions
router.post('/', validator(createAppointmentSchema), roleInjector, createAppointment);
router.get('/', getAllAppointments);
router.get('/:id', isInvolved, getAppointmentById );
router.patch('/:id',isInvolved, validator(updateAppointmentSchema), updateAppointment );
router.patch('/:id/confirm', isInvolved, confirmAppointment);
router.patch('/:id/cancel',isInvolved,validator(cancelAppointmentSchema), cancelAppointment );
router.patch('/:id/notes',isInvolved, accessChecker('DOCTOR'), validator(appointmentNotesSchema), updateAppointmentNotes);
router.patch('/:id/complete',isInvolved, accessChecker('DOCTOR'), completeAppointment);

export default router;