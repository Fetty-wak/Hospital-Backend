/*
  Warnings:

  - You are about to drop the column `dosage` on the `Prescription` table. All the data in the column will be lost.
  - You are about to drop the column `duration` on the `Prescription` table. All the data in the column will be lost.
  - You are about to drop the column `frequency` on the `Prescription` table. All the data in the column will be lost.
  - Changed the type of `dosageForm` on the `Drug` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `dosePerAdmin` to the `Prescription` table without a default value. This is not possible if the table is not empty.
  - Added the required column `durationDays` to the `Prescription` table without a default value. This is not possible if the table is not empty.
  - Added the required column `frequencyPerDay` to the `Prescription` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."DosageForm" AS ENUM ('TABLET', 'CAPSULE', 'SYRUP', 'INJECTION', 'CREAM', 'OINTMENT', 'DROPS', 'SUPPOSITORY', 'SPRAY', 'OTHER');

-- AlterTable
ALTER TABLE "public"."Drug" ADD COLUMN     "available" BOOLEAN NOT NULL DEFAULT true,
DROP COLUMN "dosageForm",
ADD COLUMN     "dosageForm" "public"."DosageForm" NOT NULL;

-- AlterTable
ALTER TABLE "public"."Prescription" DROP COLUMN "dosage",
DROP COLUMN "duration",
DROP COLUMN "frequency",
ADD COLUMN     "dosePerAdmin" INTEGER NOT NULL,
ADD COLUMN     "durationDays" INTEGER NOT NULL,
ADD COLUMN     "frequencyPerDay" INTEGER NOT NULL;
