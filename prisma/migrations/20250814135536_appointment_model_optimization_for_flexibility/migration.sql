-- AlterTable
ALTER TABLE "public"."Appointment" ADD COLUMN     "doctorConfirmed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "patientConfirmed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "updateReason" TEXT,
ADD COLUMN     "updatedBy" INTEGER;

-- AddForeignKey
ALTER TABLE "public"."Appointment" ADD CONSTRAINT "Appointment_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
