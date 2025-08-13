import {z} from 'zod';

export const createAppointmentSchema = z.object({
  date: z.string().refine(val => {
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
    message: 'Date must be a valid date in the future, within one year from now',
  }),
  reason: z.string().min(3, 'Reason must be at least 3 characters').max(1000, 'Reason should be summarized').transform(str=> str.trim()),
  doctorId: z.number().optional(),  // injected by middleware
  patientId: z.number().optional(), // injected by middleware
}).strict();
