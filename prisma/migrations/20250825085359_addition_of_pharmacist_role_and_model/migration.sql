-- AlterEnum
ALTER TYPE "public"."InvitedRoles" ADD VALUE 'PHARMACIST';

-- AlterEnum
ALTER TYPE "public"."Role" ADD VALUE 'PHARMACIST';

-- CreateTable
CREATE TABLE "public"."Pharmacist" (
    "id" SERIAL NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "departmentId" INTEGER NOT NULL,

    CONSTRAINT "Pharmacist_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Pharmacist" ADD CONSTRAINT "Pharmacist_id_fkey" FOREIGN KEY ("id") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Pharmacist" ADD CONSTRAINT "Pharmacist_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "public"."Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
