import {z} from 'zod';

export const createDepartmentSchema= z.object({
    name: z.string().min(5, 'Enter a descriptive name').transform(str=> str.trim())
}).strict();