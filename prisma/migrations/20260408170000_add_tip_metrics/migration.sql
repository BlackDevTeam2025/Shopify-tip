-- CreateTable
CREATE TABLE "TipMetric" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "tipAmount" REAL NOT NULL,
    "refundedAmount" REAL NOT NULL DEFAULT 0,
    "netAmount" REAL NOT NULL,
    "status" TEXT NOT NULL,
    "paidAt" DATETIME,
    "cancelledAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TipMetricRefundEvent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "refundId" TEXT NOT NULL,
    "tipAmount" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "TipMetric_shop_orderId_key" ON "TipMetric"("shop", "orderId");

-- CreateIndex
CREATE INDEX "TipMetric_shop_paidAt_idx" ON "TipMetric"("shop", "paidAt");

-- CreateIndex
CREATE UNIQUE INDEX "TipMetricRefundEvent_shop_refundId_key" ON "TipMetricRefundEvent"("shop", "refundId");

-- CreateIndex
CREATE INDEX "TipMetricRefundEvent_shop_orderId_idx" ON "TipMetricRefundEvent"("shop", "orderId");
