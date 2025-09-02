import {z} from 'zod';

export const updatePrescriptionSchema= z.object({
    drugId: z.number().int().positive().optional(),
    dosePerAdmin: z.number().int().positive().optional(),
    frequencyPerDay: z.number().int().positive().optional(),
    durationDays: z.number().int().positive().optional(),
    instructions: z.string().min(5, 'Enter detailed instrictions please').transform(str=> str.trim()).optional()
}).refine(
    (data)=> Object.keys(data).lenth > 0, 
    {message: 'At least one field is required'}
).strict();