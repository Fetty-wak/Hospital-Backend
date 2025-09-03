import {z} from 'zod';

export const updateLabResultSchema= z.object({
    result: z.string().min(3, 'Enter valid outcome').transform(str=> str.trim())
}).strict();