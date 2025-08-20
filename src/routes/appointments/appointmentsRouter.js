import { Router } from "express";
const router= Router();

//import controllers
import { createAppointment, getAllAppointments, getAppointmentById, updateAppointment, confirmAppointment, cancelAppointment, completeAppointment, updateAppointmentNotes} from "../../controllers/appointments/appointmentController.js";

//import middleware (input validation, role injection)
import validator from "../../middleware/formValidator.js";
import { roleInjector } from "../../middleware/roleBasedInjector.js";
import { accessChecker } from "../../middleware/appointmentAccessCheck.js";

//import zod schemas
import { createAppointmentSchema } from "../../validators/appointment/appointmentCreation.schema.js";
import { updateAppointmentSchema } from "../../validators/appointment/appointmentUpdate.schema.js";
import { cancelAppointmentSchema } from "../../validators/appointment/appointmentCancellation.schema.js";
import { appointmentNotesSchema } from "../../validators/appointment/appointmentNotes.schema.js";

//route definitions
router.post('/', validator(createAppointmentSchema), roleInjector, createAppointment);
router.get('/', getAllAppointments);
router.get('/:id', accessChecker, getAppointmentById );
router.patch('/:id', validator(updateAppointmentSchema),accessChecker, updateAppointment );
router.patch('/:id/confirm', accessChecker, confirmAppointment);
router.patch('/:id/cancel',validator(cancelAppointmentSchema),accessChecker, cancelAppointment );
router.patch('/:id/Notes', validator(appointmentNotesSchema),accessChecker, updateAppointmentNotes);
router.patch('/:id/complete', completeAppointment);

export default router;