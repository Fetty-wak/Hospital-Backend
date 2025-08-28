/*
  Warnings:

  - You are about to drop the column `yearsOfExperience` on the `Doctor` table. All the data in the column will be lost.
  - Added the required column `practiceStartDate` to the `Doctor` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."NotificationType" ADD VALUE 'DOCTOR_UPDATE';
ALTER TYPE "public"."NotificationType" ADD VALUE 'PHARMACIST_UPDATE';
ALTER TYPE "public"."NotificationType" ADD VALUE 'LABTECH_UPDATE';
ALTER TYPE "public"."NotificationType" ADD VALUE 'LAB_RESULT';

-- AlterTable
ALTER TABLE "public"."Doctor" DROP COLUMN "yearsOfExperience",
ADD COLUMN     "pendingUpdate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "practiceStartDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "public"."LabTech" ADD COLUMN     "pendingUpdate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "public"."Pharmacist" ADD COLUMN     "pendingUpdate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;
