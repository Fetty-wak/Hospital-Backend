import { z } from 'zod';

export const updateLabTestSchema = z.object({
  name: z.string().min(1).transform(str => str.trim()).optional(),
  code: z.string().min(3).max(10).transform(str => str.trim()).optional(),
  description: z.string().min(3, 'Enter valid description').transform(str => str.trim()).optional(),
}).refine(
  (data) => Object.values(data).some((value) => value !== undefined),
  {
    message: "At least one field must be provided",
    path: [] // applies error at root level
  }
).strict();
