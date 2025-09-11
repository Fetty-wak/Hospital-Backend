import { z } from "zod";

export const updateAppointmentSchema = z.object({
  reason: z.string().min(1, "Reason cannot be empty").optional(),
  date: z
    .string()
    .optional()
    .refine((val) => {
      if (!val) return true; // skip check if not provided
      const date = new Date(val);
      const now = new Date();
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(now.getFullYear() + 1);

      return (
        !isNaN(date.getTime()) &&
        date > now &&
        date <= oneYearFromNow
      );
    }, {
      message: "Date must be a valid future datetime within one year from now",
    }),
  updateReason: z.string().min(1, "Update reason is required"),
}).refine(
  (data) => data.reason !== undefined || data.date !== undefined,
  {
    message: "Either reason or date must be provided",
    path: ["reason"], // could also be ["date"]
  }
);
