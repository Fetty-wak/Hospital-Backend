import {z} from 'zod';

export const cancelAppointmentSchema= z.object({
    cancellationReason: z.string().min(5, 'Enter a reason for cancellation').transform(str=> str.trim())
}).strict();