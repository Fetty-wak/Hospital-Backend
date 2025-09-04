import { z } from "zod";

export const createInviteSchema = z.object({
  role: z.enum(["DOCTOR", "PHARMACIST", "LAB_TECH"]),
  expiresAt: z
    .string()
    .optional()
    .refine(val => !val || !isNaN(Date.parse(val)), { message: "Invalid date" })
});
