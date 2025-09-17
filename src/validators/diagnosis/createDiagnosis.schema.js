import { z } from "zod";

export const createDiagnosisSchema = z.object({
  patientId: z.string().min(1, 'Enter a valid id').transform(str=> str.trim())
}).strict();
