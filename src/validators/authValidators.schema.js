import { z } from "zod";

const baseSchema = z.object({
  fullName: z.string().min(5).max(30).transform(str => str.trim()),
  email: z.string().email().transform(str => str.trim()),
  password: z.string(),
  role: z.enum(['DOCTOR', 'PATIENT', 'ADMIN'])
}).strict();

const patientSchema = z.object({
  address: z.string(),
  phoneNumber: z.string().transform(str => str.trim()),
  allergies: z.string().max(500).nullable(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  bloodType: z.enum(['A_POS', 'A_NEG', 'B_POS', 'B_NEG', 'AB_POS', 'AB_NEG', 'O_POS', 'O_NEG']),
  dateOfBirth: z.string().refine(val => !isNaN(Date.parse(val)), { message: "Invalid date" }) // ISO date as string
}).strict();

const doctorSchema = z.object({
  phoneNumber: z.string().transform(str => str.trim()),
  licenseNumber: z.string().transform(str => str.trim()),
  yearsOfExperience: z.number().int().min(0).max(60)
}).strict();

const adminSchema= z.object({});

export const registrationSchema= z.discriminatedUnion('role',[
    baseSchema.merge(patientSchema).extend({role: z.literal('PATIENT')}),
    baseSchema.merge(doctorSchema).extend({role: z.literal('DOCTOR')}),
    baseSchema.merge(adminSchema).extend({role: z.literal('ADMIN')})
]);

export const loginSchema= z.object({
    email: z.string().email().transform(str => str.trim()),
    password: z.string()
}).strict();

