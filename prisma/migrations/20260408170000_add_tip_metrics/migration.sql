-- CreateTable
CREATE TABLE "TipMetric" (
    "id" SERIAL NOT NULL,
    "shop" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "tipAmount" DOUBLE PRECISION NOT NULL,
    "refundedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netAmount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "paidAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TipMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TipMetricRefundEvent" (
    "id" SERIAL NOT NULL,
    "shop" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "refundId" TEXT NOT NULL,
    "tipAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TipMetricRefundEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TipMetric_shop_orderId_key" ON "TipMetric"("shop", "orderId");

-- CreateIndex
CREATE INDEX "TipMetric_shop_paidAt_idx" ON "TipMetric"("shop", "paidAt");

-- CreateIndex
CREATE UNIQUE INDEX "TipMetricRefundEvent_shop_refundId_key" ON "TipMetricRefundEvent"("shop", "refundId");

-- CreateIndex
CREATE INDEX "TipMetricRefundEvent_shop_orderId_idx" ON "TipMetricRefundEvent"("shop", "orderId");
