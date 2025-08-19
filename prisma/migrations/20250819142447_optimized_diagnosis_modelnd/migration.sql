-- DropForeignKey
ALTER TABLE "public"."LabResult" DROP CONSTRAINT "LabResult_labTechId_fkey";

-- AlterTable
ALTER TABLE "public"."Appointment" ADD COLUMN     "createDiagnosis" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."Diagnosis" ALTER COLUMN "symptoms" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."LabResult" ALTER COLUMN "labTechId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."LabResult" ADD CONSTRAINT "LabResult_labTechId_fkey" FOREIGN KEY ("labTechId") REFERENCES "public"."LabTech"("id") ON DELETE SET NULL ON UPDATE CASCADE;
