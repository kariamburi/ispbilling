/*
  Warnings:

  - You are about to drop the `InternetPackage` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "InternetSession" ADD COLUMN     "password" TEXT;

-- DropTable
DROP TABLE "InternetPackage";
