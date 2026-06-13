-- CreateTable
CREATE TABLE "AppSetting" (
    "id" TEXT NOT NULL DEFAULT 'main',
    "portalName" TEXT NOT NULL DEFAULT 'CRAFT WIFI',
    "subtitle" TEXT NOT NULL DEFAULT 'Fast internet for Manguo Estate',
    "supportPhone" TEXT,
    "whatsappPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("id")
);
