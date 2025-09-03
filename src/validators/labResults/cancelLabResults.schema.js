import {z} from 'zod';

export const cancelLabResultSchema= z.object({
    cancellationReason: z.string().min(5, 'Enter a valid reason for cancellation').transform(str=> str.trim())
}).strict();