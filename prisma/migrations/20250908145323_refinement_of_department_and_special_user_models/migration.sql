/*
  Warnings:

  - A unique constraint covering the columns `[phoneNumber]` on the table `Doctor` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[phoneNumber]` on the table `LabTech` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[phoneNumber]` on the table `Patient` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[phoneNumber]` on the table `Pharmacist` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "public"."NotificationType" ADD VALUE 'DEPARTMENT_UPDATE';

-- AlterTable
ALTER TABLE "public"."Department" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE UNIQUE INDEX "Doctor_phoneNumber_key" ON "public"."Doctor"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "LabTech_phoneNumber_key" ON "public"."LabTech"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_phoneNumber_key" ON "public"."Patient"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Pharmacist_phoneNumber_key" ON "public"."Pharmacist"("phoneNumber");
