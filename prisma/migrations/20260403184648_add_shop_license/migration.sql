-- CreateTable
CREATE TABLE "ShopLicense" (
    "shop" TEXT NOT NULL,
    "licenseStatus" TEXT NOT NULL,
    "purchaseId" TEXT,
    "purchaseName" TEXT,
    "isTest" BOOLEAN NOT NULL DEFAULT false,
    "activatedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ShopLicense_pkey" PRIMARY KEY ("shop")
);
