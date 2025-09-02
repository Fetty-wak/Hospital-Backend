-- CreateEnum
CREATE TYPE "public"."PrescriptionStatus" AS ENUM ('PENDING', 'CANCELLED', 'DISPENSED');

-- AlterTable
ALTER TABLE "public"."Prescription" ADD COLUMN     "status" "public"."PrescriptionStatus" NOT NULL DEFAULT 'PENDING';
