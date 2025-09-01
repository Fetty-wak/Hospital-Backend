import { z } from "zod";

export const updateUserSchema = z.object({
  fullName: z
    .string()
    .min(3, "Enter your full name")
    .transform((str) => str.trim())
    .optional(),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      "Password must include at least one uppercase letter, one lowercase letter, one number, and one special character"
    )
    .optional(),
}).refine(
    (data)=> Object.keys(data).length > 0, 
    {message: 'At least one field is required!'}
).strict();
