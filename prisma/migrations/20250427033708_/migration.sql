/*
  Warnings:

  - A unique constraint covering the columns `[fieldId,startRange,endRange]` on the table `FileData` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,parentId]` on the table `Node` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "FileData" ADD COLUMN     "endRange" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "startRange" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "FileData_fieldId_startRange_endRange_key" ON "FileData"("fieldId", "startRange", "endRange");

-- CreateIndex
CREATE UNIQUE INDEX "Node_name_parentId_key" ON "Node"("name", "parentId");
