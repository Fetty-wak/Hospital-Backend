-- DropForeignKey
ALTER TABLE "public"."Doctor" DROP CONSTRAINT "Doctor_departmentId_fkey";

-- AlterTable
ALTER TABLE "public"."Doctor" ALTER COLUMN "departmentId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Doctor" ADD CONSTRAINT "Doctor_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "public"."Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
