-- CreateTable
CREATE TABLE "ShopLicense" (
    "shop" TEXT NOT NULL PRIMARY KEY,
    "licenseStatus" TEXT NOT NULL,
    "purchaseId" TEXT,
    "purchaseName" TEXT,
    "isTest" BOOLEAN NOT NULL DEFAULT false,
    "activatedAt" DATETIME,
    "updatedAt" DATETIME NOT NULL
);
