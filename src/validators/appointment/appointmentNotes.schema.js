import { z } from "zod";

export const appointmentNotesSchema = z
  .object({
    outcome: z.string().min(1, "Outcome cannot be empty").optional(),
    createDiagnosis: z.boolean().optional(),
  })
  .refine(
    (data) => data.outcome !== undefined || data.createDiagnosis !== undefined,
    {
      message: "At least one of 'outcome' or 'createDiagnosis' must be provided",
      path: ["outcome"], // anchor error here
    }
  )
  .strict();

