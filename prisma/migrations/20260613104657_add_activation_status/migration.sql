-- AlterTable
ALTER TABLE "InternetSession" ADD COLUMN     "activationError" TEXT,
ADD COLUMN     "activationStatus" TEXT NOT NULL DEFAULT 'PENDING';
