import { z } from "zod";

export const createDiagnosisSchema = z.object({
  body: z.object({
    patientId: z.number().int().positive(),
    symptoms: z.string().optional(),
    labTests: z.array(z.number().int().positive()).optional(),
  }),
});
