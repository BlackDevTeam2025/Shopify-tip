import db from "./db.server.js";

export const TIP_METRICS_WINDOW_DAYS = 60;
export const TIP_METRICS_RANGE_OPTIONS = [7, 30, 60, 90];

function parsePositiveNumber(value) {
  const parsed = Number.parseFloat(String(value ?? "").trim());
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function parseNonNegativeNumber(value) {
  const parsed = Number.parseFloat(String(value ?? "").trim());
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function parseInteger(value) {
  const parsed = Number.parseInt(String(value ?? "").trim(), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseDate(value) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function roundCurrencyAmount(value) {
  return Number(parseNonNegativeNumber(value).toFixed(2));
}

function getWindowStart(windowDays, now = new Date()) {
  const currentDate = parseDate(now) ?? new Date();
  const start = new Date(
    Date.UTC(
      currentDate.getUTCFullYear(),
      currentDate.getUTCMonth(),
      currentDate.getUTCDate(),
    ),
  );
  start.setUTCDate(start.getUTCDate() - Math.max(windowDays - 1, 0));
  return start;
}

function formatTrendDateKey(date) {
  return date.toISOString().slice(0, 10);
}

export function normalizeTipMetricsWindowDays(
  value,
  fallback = TIP_METRICS_WINDOW_DAYS,
) {
  const parsed = parseInteger(value);
  return TIP_METRICS_RANGE_OPTIONS.includes(parsed) ? parsed : fallback;
}

function getOrderId(payload = {}) {
  const orderId = parseInteger(payload.order_id);
  if (orderId) {
    return String(orderId);
  }

  const directId = parseInteger(payload.id);
  if (directId) {
    return String(directId);
  }

  return "";
}

function getRefundId(payload = {}) {
  const directId = parseInteger(payload.id);
  if (directId) {
    return String(directId);
  }

  const graphqlId = String(payload.admin_graphql_api_id ?? "").trim();
  if (graphqlId) {
    return graphqlId;
  }

  return "";
}

function parseVariantNumericId(variantId = "") {
  const raw = String(variantId ?? "").trim();

  if (!raw) {
    return null;
  }

  if (raw.startsWith("gid://shopify/ProductVariant/")) {
    return parseInteger(raw.split("/").pop());
  }

  return parseInteger(raw);
}

function isTipLineItem(lineItem = {}, tipVariantNumericId) {
  if (!tipVariantNumericId) {
    return false;
  }

  return parseInteger(lineItem.variant_id) === tipVariantNumericId;
}

function lineItemTotal(lineItem = {}) {
  const quantity = Math.max(parseInteger(lineItem.quantity) ?? 1, 1);
  const unitAmount =
    parseNonNegativeNumber(lineItem.discounted_price_set?.shop_money?.amount) ||
    parseNonNegativeNumber(lineItem.discounted_price) ||
    parseNonNegativeNumber(lineItem.price_set?.shop_money?.amount) ||
    parseNonNegativeNumber(lineItem.price);

  return unitAmount * quantity;
}

export function extractTipFromPaidOrder(payload = {}, tipVariantId = "") {
  const tipVariantNumericId = parseVariantNumericId(tipVariantId);
  const lineItems = Array.isArray(payload.line_items) ? payload.line_items : [];
  const tipLineItems = lineItems.filter((lineItem) =>
    isTipLineItem(lineItem, tipVariantNumericId),
  );
  const tipAmount = tipLineItems.reduce(
    (total, lineItem) => total + lineItemTotal(lineItem),
    0,
  );

  return {
    orderId: getOrderId(payload),
    currency:
      payload.currency ??
      payload.total_price_set?.shop_money?.currency_code ??
      "USD",
    paidAt: parseDate(payload.processed_at ?? payload.updated_at ?? payload.created_at),
    tipAmount,
  };
}

export function extractRefundedTipAmount(payload = {}, tipVariantId = "") {
  const tipVariantNumericId = parseVariantNumericId(tipVariantId);
  const refundItems = Array.isArray(payload.refund_line_items)
    ? payload.refund_line_items
    : [];

  return refundItems.reduce((total, refundLineItem) => {
    const lineItem = refundLineItem.line_item ?? {};

    if (!isTipLineItem(lineItem, tipVariantNumericId)) {
      return total;
    }

    const explicitSubtotal =
      parseNonNegativeNumber(
        refundLineItem.subtotal_set?.shop_money?.amount,
      ) || parseNonNegativeNumber(refundLineItem.subtotal);

    if (explicitSubtotal > 0) {
      return total + explicitSubtotal;
    }

    const quantity = Math.max(parseInteger(refundLineItem.quantity) ?? 1, 1);
    const unitAmount =
      parseNonNegativeNumber(lineItem.price_set?.shop_money?.amount) ||
      parseNonNegativeNumber(lineItem.price);

    return total + unitAmount * quantity;
  }, 0);
}

export async function upsertPaidTipMetric({
  shop,
  payload,
  tipVariantId,
  dbClient = db,
}) {
  const extracted = extractTipFromPaidOrder(payload, tipVariantId);

  if (!extracted.orderId || extracted.tipAmount <= 0) {
    return { updated: false, reason: "no_tip_line" };
  }

  const existing = await dbClient.tipMetric.findUnique({
    where: {
      shop_orderId: {
        shop,
        orderId: extracted.orderId,
      },
    },
  });

  const refundedAmount = existing?.refundedAmount ?? 0;
  const netAmount = Math.max(extracted.tipAmount - refundedAmount, 0);

  await dbClient.tipMetric.upsert({
    where: {
      shop_orderId: {
        shop,
        orderId: extracted.orderId,
      },
    },
    update: {
      currency: extracted.currency,
      tipAmount: extracted.tipAmount,
      netAmount,
      status: netAmount > 0 ? "paid" : "refunded",
      paidAt: extracted.paidAt,
    },
    create: {
      shop,
      orderId: extracted.orderId,
      currency: extracted.currency,
      tipAmount: extracted.tipAmount,
      refundedAmount: 0,
      netAmount: extracted.tipAmount,
      status: "paid",
      paidAt: extracted.paidAt,
    },
  });

  return {
    updated: true,
    orderId: extracted.orderId,
    tipAmount: extracted.tipAmount,
    netAmount,
  };
}

export async function applyRefundTipMetric({
  shop,
  payload,
  tipVariantId,
  dbClient = db,
}) {
  const orderId = getOrderId(payload);
  const refundId = getRefundId(payload);
  const refundedTipAmount = extractRefundedTipAmount(payload, tipVariantId);

  if (!orderId || !refundId || refundedTipAmount <= 0) {
    return { updated: false, reason: "no_tip_refund", orderId };
  }
  const runTransaction =
    typeof dbClient.$transaction === "function"
      ? (work) => dbClient.$transaction(work)
      : async (work) => work(dbClient);

  return runTransaction(async (tx) => {
    const alreadyProcessed = await tx.tipMetricRefundEvent.findUnique({
      where: {
        shop_refundId: {
          shop,
          refundId,
        },
      },
    });

    if (alreadyProcessed) {
      return {
        updated: false,
        reason: "already_processed",
        orderId,
      };
    }

    const existing = await tx.tipMetric.findUnique({
      where: {
        shop_orderId: {
          shop,
          orderId,
        },
      },
    });
    const nextRefundedAmount =
      (existing?.refundedAmount ?? 0) + refundedTipAmount;
    const tipAmount = existing?.tipAmount ?? 0;
    const netAmount = Math.max(tipAmount - nextRefundedAmount, 0);

    await tx.tipMetricRefundEvent.create({
      data: {
        shop,
        orderId,
        refundId,
        tipAmount: refundedTipAmount,
      },
    });

    await tx.tipMetric.upsert({
      where: {
        shop_orderId: {
          shop,
          orderId,
        },
      },
      update: {
        refundedAmount: nextRefundedAmount,
        netAmount,
        status: netAmount > 0 ? "paid" : "refunded",
      },
      create: {
        shop,
        orderId,
        currency:
          payload.currency ??
          payload.transactions?.[0]?.currency ??
          payload.order?.currency ??
          "USD",
        tipAmount: 0,
        refundedAmount: refundedTipAmount,
        netAmount: 0,
        status: "refunded",
      },
    });

    return {
      updated: true,
      orderId,
      refundedAmount: refundedTipAmount,
      netAmount,
    };
  });
}

export async function cancelTipMetric({ shop, payload, dbClient = db }) {
  const orderId = getOrderId(payload);

  if (!orderId) {
    return { updated: false, reason: "missing_order_id" };
  }

  const cancelledAt = parseDate(
    payload.cancelled_at ?? payload.updated_at ?? payload.processed_at,
  );
  const existing = await dbClient.tipMetric.findUnique({
    where: {
      shop_orderId: {
        shop,
        orderId,
      },
    },
  });

  if (!existing) {
    return { updated: false, reason: "metric_not_found" };
  }

  await dbClient.tipMetric.update({
    where: {
      shop_orderId: {
        shop,
        orderId,
      },
    },
    data: {
      status: "cancelled",
      netAmount: 0,
      cancelledAt,
    },
  });

  return { updated: true, orderId };
}

export function summarizeTipMetrics(rows = [], windowDays = TIP_METRICS_WINDOW_DAYS) {
  const byCurrency = new Map();

  for (const row of rows) {
    const currency = row.currency || "USD";
    const current = byCurrency.get(currency) ?? {
      currency,
      totalNet: 0,
      ordersWithTip: 0,
    };

    current.totalNet += parseNonNegativeNumber(row.netAmount);
    if (parseNonNegativeNumber(row.netAmount) > 0) {
      current.ordersWithTip += 1;
    }

    byCurrency.set(currency, current);
  }

  const currencies = Array.from(byCurrency.values())
    .map((entry) => ({
      ...entry,
      totalNet: Number(entry.totalNet.toFixed(2)),
      averageTip:
        entry.ordersWithTip > 0
          ? Number((entry.totalNet / entry.ordersWithTip).toFixed(2))
          : 0,
    }))
    .sort((left, right) => right.totalNet - left.totalNet);

  return {
    windowDays,
    currencies,
    primary: currencies[0] ?? null,
    hasData: currencies.length > 0,
  };
}

export function buildTipMetricsTrend({
  rows = [],
  windowDays = TIP_METRICS_WINDOW_DAYS,
  currency = "USD",
  now = new Date(),
}) {
  const safeWindowDays = normalizeTipMetricsWindowDays(windowDays);
  const windowStart = getWindowStart(safeWindowDays, now);
  const totalsByDate = new Map();

  for (const row of rows) {
    if ((row.currency || "USD") !== currency) {
      continue;
    }

    const paidAt = parseDate(row.paidAt);
    if (!paidAt || paidAt < windowStart) {
      continue;
    }

    const dateKey = formatTrendDateKey(paidAt);
    const currentTotal = totalsByDate.get(dateKey) ?? 0;
    totalsByDate.set(
      dateKey,
      roundCurrencyAmount(currentTotal + parseNonNegativeNumber(row.netAmount)),
    );
  }

  const points = [];
  for (let dayIndex = 0; dayIndex < safeWindowDays; dayIndex += 1) {
    const date = new Date(windowStart);
    date.setUTCDate(windowStart.getUTCDate() + dayIndex);

    const dateKey = formatTrendDateKey(date);
    points.push({
      date: dateKey,
      netAmount: totalsByDate.get(dateKey) ?? 0,
    });
  }

  return points;
}

export async function loadTipMetricsSummary({
  shop,
  windowDays = TIP_METRICS_WINDOW_DAYS,
  dbClient = db,
  now = new Date(),
}) {
  const safeWindowDays = normalizeTipMetricsWindowDays(windowDays);

  if (!shop) {
    return {
      ...summarizeTipMetrics([], safeWindowDays),
      trend: buildTipMetricsTrend({
        rows: [],
        windowDays: safeWindowDays,
      }),
      trendCurrency: "USD",
    };
  }

  const since = getWindowStart(safeWindowDays, now);
  const rows = await dbClient.tipMetric.findMany({
    where: {
      shop,
      paidAt: {
        gte: since,
      },
    },
    select: {
      currency: true,
      netAmount: true,
      paidAt: true,
    },
  });

  const summary = summarizeTipMetrics(rows, safeWindowDays);
  const trendCurrency = summary.primary?.currency ?? "USD";

  return {
    ...summary,
    trend: buildTipMetricsTrend({
      rows,
      windowDays: safeWindowDays,
      currency: trendCurrency,
      now,
    }),
    trendCurrency,
  };
}
