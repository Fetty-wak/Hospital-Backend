-- AlterTable
ALTER TABLE "public"."Prescription" ADD COLUMN     "dispensed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "dispensedAt" TIMESTAMP(3),
ADD COLUMN     "pharmacistId" INTEGER;

-- AddForeignKey
ALTER TABLE "public"."Prescription" ADD CONSTRAINT "Prescription_pharmacistId_fkey" FOREIGN KEY ("pharmacistId") REFERENCES "public"."Pharmacist"("id") ON DELETE SET NULL ON UPDATE CASCADE;
