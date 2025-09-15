/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `LabTest` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "LabTest_code_key" ON "public"."LabTest"("code");
