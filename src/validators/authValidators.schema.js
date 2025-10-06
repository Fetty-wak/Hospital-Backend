import { z } from "zod";

// ---------------- Base Schema ----------------
const baseSchema = z
  .object({
    fullName: z
      .string()
      .min(5)
      .max(30)
      .transform((str) => str.trim()),
    email: z
      .string()
      .email()
      .transform((str) => str.trim()),
    password: z.string(),
    role: z.enum(["DOCTOR", "PATIENT", "LAB_TECH", "ADMIN", "PHARMACIST"]),
  })
  .strict();

// ---------------- Patient Schema ----------------
const patientSchema = z
  .object({
    address: z.string().transform((str) => str.trim()),
    phoneNumber: z
      .string()
      .length(10, "Enter a valid phone number")
      .transform((str) => str.trim()),
    allergies: z
      .string()
      .max(500)
      .nullable()
      .transform((val) => val?.trim()),
    gender: z
      .enum(["MALE", "FEMALE", "OTHER"])
      .transform((val) => val.toUpperCase()),
    bloodType: z.enum([
      "A_POS",
      "A_NEG",
      "B_POS",
      "B_NEG",
      "AB_POS",
      "AB_NEG",
      "O_POS",
      "O_NEG",
    ]),
    dateOfBirth: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" }), // ISO date string
  })
  .strict();

// ---------------- Doctor Schema ----------------
const doctorSchema = z
  .object({
    phoneNumber: z
      .string()
      .length(10, "Enter a valid phone number")
      .transform((str) => str.trim()),
    licenseNumber: z.string().transform((str) => str.trim()),
    practiceStartDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" }),
    departmentId: z.coerce.number().int().positive(),
    inviteCode: z
      .string()
      .length(8)
      .regex(/^[A-Z0-9]{8}$/, "Invite code must be 8 alphanumeric characters")
      .transform((str) => str.trim()),
  })
  .strict();

// ---------------- Lab Technician Schema ----------------
const labTechnicianSchema = z
  .object({
    phoneNumber: z
      .string()
      .length(10, "Enter a valid phone number")
      .transform((str) => str.trim()),
    departmentId: z.coerce.number().int().positive(),
    inviteCode: z
      .string()
      .length(8)
      .regex(/^[A-Z0-9]{8}$/, "Invite code must be 8 alphanumeric characters")
      .transform((str) => str.trim()),
  })
  .strict();

// ---------------- Pharmacist Schema ------------------
const pharmacistSchema = z
  .object({
    phoneNumber: z
      .string()
      .length(10, "Enter a valid phone number")
      .transform((str) => str.trim()),
    departmentId: z.coerce.number().int().positive(),
    inviteCode: z
      .string()
      .length(8)
      .regex(/^[A-Z0-9]{8}$/, "Invite code must be 8 alphanumeric characters")
      .transform((str) => str.trim()),
  })
  .strict();

// ---------------- Admin Schema ----------------
const adminSchema = z.object({}).strict();

// ---------------- Registration Schema ----------------
export const registrationSchema = z.discriminatedUnion("role", [
  baseSchema.merge(patientSchema).extend({ role: z.literal("PATIENT") }),
  baseSchema.merge(doctorSchema).extend({ role: z.literal("DOCTOR") }),
  baseSchema.merge(labTechnicianSchema).extend({ role: z.literal("LAB_TECH") }),
  baseSchema.merge(pharmacistSchema).extend({ role: z.literal("PHARMACIST") }),
  baseSchema.merge(adminSchema).extend({ role: z.literal("ADMIN") }),
]);

// ---------------- Login Schema ----------------
export const loginSchema = z
  .object({
    email: z
      .string()
      .email()
      .transform((str) => str.trim()),
    password: z.string(),
  })
  .strict();
