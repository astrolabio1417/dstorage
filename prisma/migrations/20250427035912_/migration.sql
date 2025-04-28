/*
  Warnings:

  - A unique constraint covering the columns `[fieldId,startRange]` on the table `FileData` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "FileData_fieldId_startRange_endRange_key";

-- CreateIndex
CREATE UNIQUE INDEX "FileData_fieldId_startRange_key" ON "FileData"("fieldId", "startRange");
