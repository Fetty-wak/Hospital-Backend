import { z } from 'zod';

export const updateLabTechSchema = z
  .object({
    departmentId: z.number().int().positive().optional(),
    phoneNumber: z
      .string()
      .regex(/^0\d{9}$/, 'Enter a valid phone number (e.g. 0712345678)')
      .optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    { message: 'At least one field is required' }
  )
  .strict();
