/*
  Warnings:

  - Added the required column `description` to the `LabTest` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."LabTest" ADD COLUMN     "available" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "description" TEXT NOT NULL;
