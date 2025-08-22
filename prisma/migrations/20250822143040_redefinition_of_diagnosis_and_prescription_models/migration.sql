/*
  Warnings:

  - You are about to drop the column `endDate` on the `Prescription` table. All the data in the column will be lost.
  - You are about to drop the column `medication` on the `Prescription` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `Prescription` table. All the data in the column will be lost.
  - Added the required column `drugId` to the `Prescription` table without a default value. This is not possible if the table is not empty.
  - Added the required column `duration` to the `Prescription` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Diagnosis" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "requiresLabTests" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."Prescription" DROP COLUMN "endDate",
DROP COLUMN "medication",
DROP COLUMN "startDate",
ADD COLUMN     "drugId" INTEGER NOT NULL,
ADD COLUMN     "duration" TEXT NOT NULL,
ADD COLUMN     "instructions" TEXT;

-- CreateTable
CREATE TABLE "public"."Drug" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "dosageForm" TEXT NOT NULL,
    "strength" TEXT NOT NULL,

    CONSTRAINT "Drug_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Prescription" ADD CONSTRAINT "Prescription_drugId_fkey" FOREIGN KEY ("drugId") REFERENCES "public"."Drug"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
