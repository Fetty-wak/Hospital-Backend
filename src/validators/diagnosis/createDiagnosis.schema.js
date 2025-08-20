import { z } from "zod";

export const createDiagnosisSchema = z.object({
  body: z.object({
    patientId: z.number().int().positive()
  }),
}).strict();
