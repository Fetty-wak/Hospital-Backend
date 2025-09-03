-- AlterEnum
ALTER TYPE "public"."LabResultStatus" ADD VALUE 'CANCELLED';

-- AlterTable
ALTER TABLE "public"."LabResult" ADD COLUMN     "cancellationReason" TEXT;
