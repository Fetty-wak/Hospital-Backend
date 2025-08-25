import {z} from 'zod';

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
]);

export const updateDrugSchema = z
  .object({
    name: z.string().min(1).transform(str=> str.trim()).optional(),
    description: z.string().transform(str=> str.trim()).optional(),
    dosageForm: DosageFormEnum.optional(),
    available: z.boolean().optional(),
    strength: z.string().min(1).transform(str=> str.trim()).optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    { message: "At least one field must be provided for update" }
  );