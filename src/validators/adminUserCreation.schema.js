import { z } from "zod";
import { registrationSchema } from "./authValidators.schema.js";

// Utility to extract one option by role
const pickRoleSchema = (role) => {
  const option = registrationSchema.options.find(
    (opt) => opt.shape.role.value === role
  );
  if (!option) throw new Error(`Role schema not found: ${role}`);
  return option;
};

// Derive schemas for each role
export const adminDoctorSchema = pickRoleSchema("DOCTOR").omit({
  inviteCode: true,
});

export const adminPatientSchema = pickRoleSchema("PATIENT");
// patients don’t have inviteCode anyway

export const adminPharmacistSchema = pickRoleSchema("PHARMACIST").omit({
  inviteCode: true,
});

export const adminLabTechSchema = pickRoleSchema("LAB_TECH").omit({
  inviteCode: true,
});

// Optional: a union if you want one adminSchema to validate any role
export const adminCreateSchema = z.union([
  adminDoctorSchema,
  adminPatientSchema,
  adminPharmacistSchema,
  adminLabTechSchema,
]);
