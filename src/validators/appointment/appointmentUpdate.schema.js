import {z} from 'zod';

export const updateAppointmentSchema = z.object({
  reason: z.string().min(1, "Reason cannot be empty").optional(),
  date: z.string().datetime().optional(),
  updateReason: z.string().min(1, "Update reason is required"),
}).refine(
  (data) => data.reason !== undefined || data.date !== undefined,
  {
    message: "Either reason or date must be provided",
    path: ["reason"], // Could also be `["date"]` — just to point somewhere in the error
  }
);
