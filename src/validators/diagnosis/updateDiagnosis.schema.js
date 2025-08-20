import { z } from 'zod';

export const updateDiagnosisSchema = z
  .object({
    symptoms: z.string().transform(str => str.trim()).optional(),
    description: z.string().transform(str => str.trim()).optional(),
    outcome: z.string().transform(str => str.trim()).optional(),
    prescribed: z.boolean().optional(),
    labTests: z.array(z.number().int().positive()).optional(),
  })
  .strict()
  .refine(
    data => Object.keys(data).length > 0,
    { message: 'At least one field must be provided' }
  );
