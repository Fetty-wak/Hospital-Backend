/*
  Warnings:

  - Made the column `departmentId` on table `Doctor` required. This step will fail if there are existing NULL values in that column.
  - Made the column `departmentId` on table `LabTech` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."Doctor" DROP CONSTRAINT "Doctor_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."LabTech" DROP CONSTRAINT "LabTech_departmentId_fkey";

-- AlterTable
ALTER TABLE "public"."Doctor" ALTER COLUMN "departmentId" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."LabTech" ALTER COLUMN "departmentId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."LabTech" ADD CONSTRAINT "LabTech_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "public"."Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Doctor" ADD CONSTRAINT "Doctor_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "public"."Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
