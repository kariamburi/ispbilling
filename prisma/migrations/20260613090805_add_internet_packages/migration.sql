-- CreateTable
CREATE TABLE "InternetPackage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "durationMin" INTEGER NOT NULL,
    "speedLimit" TEXT NOT NULL DEFAULT '2M/2M',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InternetPackage_pkey" PRIMARY KEY ("id")
);
