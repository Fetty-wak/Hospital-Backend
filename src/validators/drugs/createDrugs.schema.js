import { z } from "zod";

// Mirror the Prisma enum
export const DosageFormEnum = z.enum([
  "TABLET",
  "CAPSULE",
  "SYRUP",
  "INJECTION",
  "CREAM",
  "OINTMENT",
  "DROPS",
  "SUPPOSITORY",
  "SPRAY",
  "OTHER",
  "INHALER"
]);

export const createDrugSchema = z.object({
  name: z.string().min(1, "Drug name is required").transform(str=> str.trim()),
  description: z.string().transform(str=> str.trim()).optional(),
  dosageForm: DosageFormEnum,
  strength: z.string().min(1, "Strength is required").transform(str=> str.trim()), // e.g. "500mg"
}).strict();