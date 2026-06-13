/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `InternetPackage` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "freeTrialUsed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "freeTrialUsedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "InternetPackage" ADD COLUMN     "isFreeTrial" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "InternetPackage_name_key" ON "InternetPackage"("name");
