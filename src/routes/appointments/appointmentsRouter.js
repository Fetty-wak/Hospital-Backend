import { Router } from "express";
const router= Router();

//import controllers
import { createAppointment, getAllAppointments, getAppointmentById } from "../../controllers/appointments/appointmentController.js";

//import middleware (input validation, role injection)
import validator from "../../middleware/formValidator.js";
import { roleInjector } from "../../middleware/roleBasedInjector.js";
import { appointmentAccessCheck } from "../../middleware/appointmentAccessCheck.js";

//import zod schemas
import { createAppointmentSchema } from "../../validators/appointment/appointmentCreation.schema.js";

//route definitions
router.post('/', validator(createAppointmentSchema), roleInjector, createAppointment);
router.get('/', getAllAppointments);
router.get('/:id', appointmentAccessCheck,getAppointmentById );

export default router;