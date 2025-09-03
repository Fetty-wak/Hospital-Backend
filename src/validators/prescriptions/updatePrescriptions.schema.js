import {z} from 'zod';

export const updatePrescriptionSchema= z.object({
    drugId: z.string().transform(str=> str.trim()).optional(),
    dosePerAdmin: z.string().transform(str=> str.trim()).optional(),
    frequencyPerDay: z.string().transform(str=> str.trim()).optional(),
    durationDays: z.string().transform(str=> str.trim()).optional(),
    instructions: z.string().min(5, 'Enter detailed instrictions please').transform(str=> str.trim()).optional()
}).refine(
    (data)=> Object.keys(data).lenth > 0, 
    {message: 'At least one field is required'}
).strict();