import {z} from 'zod';

export const createLabTestSchema= z.object({
    name: z.string().min(1).transform(str=> str.trim()),
    code: z.string().min(3).max(10).transform(str=> str.trim()).optional(),
    description: z.string().min(3, 'Enter valid description').transform(str=> str.trim())
}).strict();