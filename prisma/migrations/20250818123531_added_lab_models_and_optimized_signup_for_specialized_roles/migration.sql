-- CreateEnum
CREATE TYPE "public"."LabResultStatus" AS ENUM ('PENDING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "public"."DiagnosisStatus" AS ENUM ('PENDING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "public"."InvitedRoles" AS ENUM ('DOCTOR', 'LAB_TECH');

-- AlterEnum
ALTER TYPE "public"."Role" ADD VALUE 'LAB_TECH';

-- AlterTable
ALTER TABLE "public"."Diagnosis" ADD COLUMN     "status" "public"."DiagnosisStatus" NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "public"."LabTech" (
    "id" INTEGER NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "departmentId" INTEGER,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "LabTech_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InviteCode" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "role" "public"."InvitedRoles" NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER NOT NULL,

    CONSTRAINT "InviteCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LabTest" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LabResult" (
    "id" SERIAL NOT NULL,
    "labTechId" INTEGER NOT NULL,
    "diagnosisId" INTEGER NOT NULL,
    "labTestId" INTEGER NOT NULL,
    "status" "public"."LabResultStatus" NOT NULL DEFAULT 'PENDING',
    "result" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InviteCode_code_key" ON "public"."InviteCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "LabTest_name_key" ON "public"."LabTest"("name");

-- CreateIndex
CREATE UNIQUE INDEX "LabTest_code_key" ON "public"."LabTest"("code");

-- AddForeignKey
ALTER TABLE "public"."LabTech" ADD CONSTRAINT "LabTech_id_fkey" FOREIGN KEY ("id") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LabTech" ADD CONSTRAINT "LabTech_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "public"."Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InviteCode" ADD CONSTRAINT "InviteCode_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LabResult" ADD CONSTRAINT "LabResult_diagnosisId_fkey" FOREIGN KEY ("diagnosisId") REFERENCES "public"."Diagnosis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LabResult" ADD CONSTRAINT "LabResult_labTestId_fkey" FOREIGN KEY ("labTestId") REFERENCES "public"."LabTest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LabResult" ADD CONSTRAINT "LabResult_labTechId_fkey" FOREIGN KEY ("labTechId") REFERENCES "public"."LabTech"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
