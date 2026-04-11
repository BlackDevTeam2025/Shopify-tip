import test from "node:test";
import assert from "node:assert/strict";

import {
  applyRefundTipMetric,
  buildTipMetricsTrend,
  loadTipMetricsSummary,
  normalizeTipMetricsWindowDays,
  summarizeTipMetrics,
  upsertPaidTipMetric,
} from "../../app/tip-metrics.server.js";

function createMockMetricsDb(initialRows = []) {
  const metricRows = new Map(
    initialRows.map((row) => [`${row.shop}:${row.orderId}`, { ...row }]),
  );
  const refundRows = new Map();

  const dbClient = {
    tipMetric: {
      async findUnique({ where }) {
        const key = `${where.shop_orderId.shop}:${where.shop_orderId.orderId}`;
        const row = metricRows.get(key);
        return row ? { ...row } : null;
      },
      async upsert({ where, update, create }) {
        const key = `${where.shop_orderId.shop}:${where.shop_orderId.orderId}`;
        const existing = metricRows.get(key);
        const next = existing
          ? { ...existing, ...update }
          : { id: metricRows.size + 1, ...create };
        metricRows.set(key, next);
        return { ...next };
      },
      async update({ where, data }) {
        const key = `${where.shop_orderId.shop}:${where.shop_orderId.orderId}`;
        const existing = metricRows.get(key);
        if (!existing) {
          throw new Error(`Metric row ${key} not found`);
        }
        const next = { ...existing, ...data };
        metricRows.set(key, next);
        return { ...next };
      },
      async findMany() {
        return Array.from(metricRows.values()).map((row) => ({
          currency: row.currency,
          netAmount: row.netAmount,
          paidAt: row.paidAt,
        }));
      },
    },
    tipMetricRefundEvent: {
      async findUnique({ where }) {
        const key = `${where.shop_refundId.shop}:${where.shop_refundId.refundId}`;
        const row = refundRows.get(key);
        return row ? { ...row } : null;
      },
      async create({ data }) {
        const key = `${data.shop}:${data.refundId}`;
        const row = { id: refundRows.size + 1, ...data };
        refundRows.set(key, row);
        return { ...row };
      },
    },
    async $transaction(work) {
      return work(dbClient);
    },
  };

  return {
    dbClient,
    getMetric(shop, orderId) {
      return metricRows.get(`${shop}:${orderId}`);
    },
  };
}

test("upsertPaidTipMetric creates metrics from a paid order tip line", async () => {
  const { dbClient, getMetric } = createMockMetricsDb();
  const result = await upsertPaidTipMetric({
    shop: "demo.myshopify.com",
    tipVariantId: "gid://shopify/ProductVariant/123",
    payload: {
      id: 1001,
      currency: "USD",
      processed_at: "2026-04-08T10:00:00Z",
      line_items: [
        {
          variant_id: 123,
          quantity: 1,
          price: "9.99",
        },
      ],
    },
    dbClient,
  });

  assert.equal(result.updated, true);
  assert.equal(result.orderId, "1001");
  assert.equal(result.tipAmount, 9.99);
  assert.deepEqual(getMetric("demo.myshopify.com", "1001"), {
    id: 1,
    shop: "demo.myshopify.com",
    orderId: "1001",
    currency: "USD",
    tipAmount: 9.99,
    refundedAmount: 0,
    netAmount: 9.99,
    status: "paid",
    paidAt: new Date("2026-04-08T10:00:00Z"),
  });
});

test("applyRefundTipMetric is idempotent for duplicated refunds/create events", async () => {
  const { dbClient, getMetric } = createMockMetricsDb([
    {
      id: 1,
      shop: "demo.myshopify.com",
      orderId: "2001",
      currency: "USD",
      tipAmount: 30,
      refundedAmount: 0,
      netAmount: 30,
      status: "paid",
      paidAt: new Date("2026-04-08T10:00:00Z"),
    },
  ]);

  const payload = {
    id: 99001,
    order_id: 2001,
    refund_line_items: [
      {
        quantity: 1,
        line_item: {
          variant_id: 123,
          price: "12.00",
        },
      },
    ],
  };

  const first = await applyRefundTipMetric({
    shop: "demo.myshopify.com",
    payload,
    tipVariantId: "gid://shopify/ProductVariant/123",
    dbClient,
  });
  const second = await applyRefundTipMetric({
    shop: "demo.myshopify.com",
    payload,
    tipVariantId: "gid://shopify/ProductVariant/123",
    dbClient,
  });

  assert.equal(first.updated, true);
  assert.equal(first.refundedAmount, 12);
  assert.equal(second.updated, false);
  assert.equal(second.reason, "already_processed");
  assert.deepEqual(getMetric("demo.myshopify.com", "2001"), {
    id: 1,
    shop: "demo.myshopify.com",
    orderId: "2001",
    currency: "USD",
    tipAmount: 30,
    refundedAmount: 12,
    netAmount: 18,
    status: "paid",
    paidAt: new Date("2026-04-08T10:00:00Z"),
  });
});

test("summarizeTipMetrics groups totals by currency and computes averages", () => {
  const summary = summarizeTipMetrics(
    [
      { currency: "USD", netAmount: 10 },
      { currency: "USD", netAmount: 30 },
      { currency: "EUR", netAmount: 15 },
    ],
    60,
  );

  assert.equal(summary.windowDays, 60);
  assert.equal(summary.hasData, true);
  assert.deepEqual(summary.primary, {
    currency: "USD",
    totalNet: 40,
    ordersWithTip: 2,
    averageTip: 20,
  });
});

test("normalizeTipMetricsWindowDays accepts only supported dashboard ranges", () => {
  assert.equal(normalizeTipMetricsWindowDays("7"), 7);
  assert.equal(normalizeTipMetricsWindowDays(30), 30);
  assert.equal(normalizeTipMetricsWindowDays("45"), 60);
});

test("buildTipMetricsTrend returns a daily primary-currency series with zero-filled gaps", () => {
  const trend = buildTipMetricsTrend({
    windowDays: 7,
    currency: "USD",
    now: new Date("2026-04-11T10:00:00Z"),
    rows: [
      {
        currency: "USD",
        netAmount: 10,
        paidAt: new Date("2026-04-05T09:00:00Z"),
      },
      {
        currency: "USD",
        netAmount: 5.5,
        paidAt: new Date("2026-04-05T16:00:00Z"),
      },
      {
        currency: "USD",
        netAmount: 7,
        paidAt: new Date("2026-04-09T12:00:00Z"),
      },
      {
        currency: "EUR",
        netAmount: 99,
        paidAt: new Date("2026-04-09T12:00:00Z"),
      },
    ],
  });

  assert.equal(trend.length, 7);
  assert.deepEqual(trend[0], {
    date: "2026-04-05",
    netAmount: 15.5,
  });
  assert.deepEqual(trend[4], {
    date: "2026-04-09",
    netAmount: 7,
  });
  assert.deepEqual(trend[6], {
    date: "2026-04-11",
    netAmount: 0,
  });
});

test("loadTipMetricsSummary returns summary and trend for the selected range", async () => {
  const { dbClient } = createMockMetricsDb([
    {
      id: 1,
      shop: "demo.myshopify.com",
      orderId: "1001",
      currency: "USD",
      tipAmount: 12,
      refundedAmount: 0,
      netAmount: 12,
      status: "paid",
      paidAt: new Date("2026-04-09T10:00:00Z"),
    },
    {
      id: 2,
      shop: "demo.myshopify.com",
      orderId: "1002",
      currency: "USD",
      tipAmount: 8,
      refundedAmount: 0,
      netAmount: 8,
      status: "paid",
      paidAt: new Date("2026-04-11T10:00:00Z"),
    },
    {
      id: 3,
      shop: "demo.myshopify.com",
      orderId: "1003",
      currency: "EUR",
      tipAmount: 5,
      refundedAmount: 0,
      netAmount: 5,
      status: "paid",
      paidAt: new Date("2026-04-11T10:00:00Z"),
    },
  ]);

  const summary = await loadTipMetricsSummary({
    shop: "demo.myshopify.com",
    windowDays: 7,
    now: new Date("2026-04-11T12:00:00Z"),
    dbClient,
  });

  assert.equal(summary.windowDays, 7);
  assert.equal(summary.trendCurrency, "USD");
  assert.equal(summary.primary.currency, "USD");
  assert.equal(summary.primary.totalNet, 20);
  assert.equal(summary.trend.length, 7);
  assert.deepEqual(summary.trend[4], {
    date: "2026-04-09",
    netAmount: 12,
  });
  assert.deepEqual(summary.trend[6], {
    date: "2026-04-11",
    netAmount: 8,
  });
});
