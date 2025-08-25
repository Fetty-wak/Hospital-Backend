-- AlterTable
ALTER TABLE "public"."Pharmacist" ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "id" DROP DEFAULT;
DROP SEQUENCE "Pharmacist_id_seq";
