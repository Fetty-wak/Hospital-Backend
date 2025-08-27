import { z } from 'zod';

export const updateDoctorSchema = z
  .object({
    // User fields
    fullName: z.string().min(5).max(30).transform(str => str.trim()).optional(),
    email: z.string().email().transform(str => str.trim()).optional(),

    // Doctor fields
    phoneNumber: z.string().length(10, 'Enter a valid phone number').transform(str => str.trim()).optional(),
    licenseNumber: z.string().transform(str => str.trim()).optional(),
    yearsOfExperience: z.number().int().min(0).max(60).optional(),
    departmentId: z.number().int().positive().optional(),
  })
  .refine(obj => Object.keys(obj).length > 0, {
    message: 'At least one field must be provided',
  });
