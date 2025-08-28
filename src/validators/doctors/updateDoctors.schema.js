import { z } from 'zod';

export const updateDoctorSchema = z
  .object({
    // Doctor fields
    phoneNumber: z.string().length(10, 'Enter a valid phone number').transform(str => str.trim()).optional(),
    licenseNumber: z.string().transform(str => str.trim()).optional(),
    practiceStartDate: z.string().refine(val => !isNaN(Date.parse(val)), { message: "Invalid date" }),
    departmentId: z.number().int().positive().optional(),
  })
  .refine(obj => Object.keys(obj).length > 0, {
    message: 'At least one field must be provided',
  });
