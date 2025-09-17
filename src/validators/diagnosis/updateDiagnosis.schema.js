import { z } from 'zod';

export const updateDiagnosisSchema = z
  .object({
    symptoms: z.string().transform(str => str.trim()).optional(),
    description: z.string().transform(str => str.trim()).optional(),
    outcome: z.string().transform(str => str.trim()).optional(),
    prescribed: z.boolean().optional(),
    labTests: z.array(z.number().int().positive()).optional(),
    prescriptions: z
      .array(
        z.object({
          drugId: z.string().min(1).transform(str=> str.trim()),
          dosePerAdmin: z.string().transform(str => str.trim()),
          frequencyPerDay: z.string().transform(str => str.trim()),
          durationDays: z.string().transform(str => str.trim()),
          instructions: z.string().transform(str => str.trim()).optional(),
        })
      )
      .optional(),
    requiresLabTests: z.boolean().optional(),
  })
  .strict()
  .refine(
    data => Object.keys(data).length > 0,
    { message: 'At least one field must be provided' }
  );
