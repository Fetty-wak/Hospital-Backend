import {z} from 'zod';

export const completeAppointmentSchema= z.object({
    outcome: z.string().min(5, 'Appointment outcome is required').transform(str=> str.trim())
}).strict();