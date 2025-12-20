/*
  Warnings:

  - A unique constraint covering the columns `[idCard]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Doctor" ADD COLUMN     "image" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "birthDate" TIMESTAMP(3),
ADD COLUMN     "idCard" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_idCard_key" ON "User"("idCard");
