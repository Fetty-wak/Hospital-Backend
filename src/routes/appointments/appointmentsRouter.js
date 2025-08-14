import { Router } from "express";
const router= Router();

//import controllers
import { createAppointment, getAllAppointments, getAppointmentById, updateAppointment, confirmAppointment, cancelAppointment, completeAppointment} from "../../controllers/appointments/appointmentController.js";

//import middleware (input validation, role injection)
import validator from "../../middleware/formValidator.js";
import { roleInjector } from "../../middleware/roleBasedInjector.js";
import { appointmentAccessCheck } from "../../middleware/appointmentAccessCheck.js";

//import zod schemas
import { createAppointmentSchema } from "../../validators/appointment/appointmentCreation.schema.js";
import { updateAppointmentSchema } from "../../validators/appointment/appointmentUpdate.schema.js";
import { cancelAppointmentSchema } from "../../validators/appointment/appointmentCancellation.schema.js";
import { completeAppointmentSchema } from "../../validators/appointment/appointmentCompletion.schema.js";

//route definitions
router.post('/', validator(createAppointmentSchema), roleInjector, createAppointment);
router.get('/', getAllAppointments);
router.get('/:id', appointmentAccessCheck,getAppointmentById );
router.patch('/:id', validator(updateAppointmentSchema),appointmentAccessCheck, updateAppointment );
router.patch('/:id/confirm', appointmentAccessCheck, confirmAppointment);
router.patch('/:id/cancel',validator(cancelAppointmentSchema),appointmentAccessCheck, cancelAppointment );
router.patch('/:id/complete', validator(completeAppointmentSchema), appointmentAccessCheck, completeAppointment);

export default router;