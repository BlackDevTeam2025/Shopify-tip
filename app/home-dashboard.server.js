import { isLicenseActive } from "./billing/license.server.js";
import { getTipRuntimeEnabled } from "./billing/access-policy.server.js";
import { loadTipConfig } from "./tip-config.server.js";
import {
  TIP_METRICS_RANGE_OPTIONS,
  TIP_METRICS_WINDOW_DAYS,
  loadTipMetricsSummary,
  normalizeTipMetricsWindowDays,
} from "./tip-metrics.server.js";

async function executeAdminJson(admin, query, variables) {
  const response = await admin.graphql(query, variables ? { variables } : {});
  return response.json();
}

function getMetricsWindowBounds(windowDays, now = new Date()) {
  const safeWindowDays = normalizeTipMetricsWindowDays(
    windowDays,
    TIP_METRICS_WINDOW_DAYS,
  );
  const currentDate = new Date(now);
  const start = new Date(
    Date.UTC(
      currentDate.getUTCFullYear(),
      currentDate.getUTCMonth(),
      currentDate.getUTCDate(),
      0,
      0,
      0,
      0,
    ),
  );
  start.setUTCDate(start.getUTCDate() - Math.max(safeWindowDays - 1, 0));

  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + safeWindowDays - 1);
  end.setUTCHours(23, 59, 59, 999);

  return { start, end, windowDays: safeWindowDays };
}

function buildOrdersCountSearch(windowDays, now = new Date()) {
  const { start, end } = getMetricsWindowBounds(windowDays, now);
  return [
    `processed_at:>=${start.toISOString()}`,
    `processed_at:<=${end.toISOString()}`,
  ].join(" ");
}

function normalizeCountValue(value) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function computeAttachRate(ordersWithTip, totalOrders) {
  if (!Number.isFinite(totalOrders) || totalOrders <= 0) {
    return null;
  }

  const safeOrdersWithTip = Number.isFinite(ordersWithTip) ? ordersWithTip : 0;
  return Number(
    (Math.min((safeOrdersWithTip / totalOrders) * 100, 100)).toFixed(1),
  );
}

function computeDeltaPercent(currentValue, previousValue) {
  const current = Number(currentValue ?? 0);
  const previous = Number(previousValue ?? 0);

  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous <= 0) {
    return null;
  }

  return Number((((current - previous) / previous) * 100).toFixed(1));
}

export async function loadHomeDashboardData({
  admin,
  shop,
  licenseState,
  shopEligibility,
  metricsDbClient,
  selectedWindowDays,
}) {
  const licenseActive = isLicenseActive(licenseState);
  const runtimeEnabled = getTipRuntimeEnabled({
    shopEligibility,
    licenseActive,
  });
  const config = await loadTipConfig(admin, {
    enabled: runtimeEnabled,
  });
  const metricsWindowDays = normalizeTipMetricsWindowDays(
    selectedWindowDays,
    config.tip_metrics_window_days,
  );
  const headerJson = await executeAdminJson(
    admin,
    `#graphql
    query HomeDashboardHeader($ordersQuery: String!) {
      shop {
        name
      }
      ordersCount(query: $ordersQuery) {
        count
      }
    }`,
    {
      ordersQuery: buildOrdersCountSearch(metricsWindowDays),
    },
  );
  const currentWindowBounds = getMetricsWindowBounds(metricsWindowDays);
  const previousWindowNow = new Date(currentWindowBounds.start);
  previousWindowNow.setUTCDate(previousWindowNow.getUTCDate() - 1);
  previousWindowNow.setUTCHours(23, 59, 59, 999);
  const previousOrdersJson = await executeAdminJson(
    admin,
    `#graphql
    query HomeDashboardPreviousOrders($ordersQuery: String!) {
      ordersCount(query: $ordersQuery) {
        count
      }
    }`,
    {
      ordersQuery: buildOrdersCountSearch(metricsWindowDays, previousWindowNow),
    },
  );

  const metricsSummary = config.tip_metrics_enabled
    ? await loadTipMetricsSummary({
        shop,
        windowDays: metricsWindowDays,
        dbClient: metricsDbClient,
      })
    : {
        windowDays: metricsWindowDays,
        currencies: [],
        primary: null,
        hasData: false,
        trend: [],
        trendCurrency: "USD",
      };
  const previousMetricsSummary = config.tip_metrics_enabled
    ? await loadTipMetricsSummary({
        shop,
        windowDays: metricsWindowDays,
        dbClient: metricsDbClient,
        now: previousWindowNow,
      })
    : {
        primary: null,
      };
  const metricsPrimary = metricsSummary.primary ?? {
    currency: "USD",
    totalNet: 0,
    ordersWithTip: 0,
    averageTip: 0,
  };
  const previousMetricsPrimary = previousMetricsSummary.primary ?? {
    currency: metricsPrimary.currency,
    totalNet: 0,
    ordersWithTip: 0,
    averageTip: 0,
  };
  const totalOrdersInWindow = normalizeCountValue(
    headerJson.data?.ordersCount?.count,
  );
  const previousTotalOrdersInWindow = normalizeCountValue(
    previousOrdersJson.data?.ordersCount?.count,
  );
  const tipAttachRate = computeAttachRate(
    metricsPrimary.ordersWithTip,
    totalOrdersInWindow,
  );
  const previousTipAttachRate = computeAttachRate(
    previousMetricsPrimary.ordersWithTip,
    previousTotalOrdersInWindow,
  );

  return {
    header: {
      storeName: headerJson.data?.shop?.name ?? "Store",
      readinessLabel:
        !shopEligibility?.eligible || !licenseActive
          ? "Home - Attention"
          : "Home - Ready",
      subtitle: "Track tip revenue and checkout performance in one place.",
    },
    license: {
      title:
        licenseState?.licenseStatus === "bypass"
          ? "Development Bypass"
          : licenseActive
            ? "Active"
            : "Not active",
      status: licenseActive ? "ready" : "blocked",
      message: licenseActive
        ? "App access is unlocked for this store."
        : "The store must unlock the app before tip checkout can run.",
    },
    tipMetrics: {
      status: config.tip_metrics_enabled ? "ready" : "warning",
      title: `Total tips (net, ${metricsSummary.windowDays} days)`,
      message: config.tip_metrics_enabled
        ? metricsSummary.hasData
          ? `Net tip totals for the last ${metricsSummary.windowDays} days.`
          : `No tip orders found in the last ${metricsSummary.windowDays} days yet.`
        : "Tip metrics are disabled in settings.",
      windowDays: metricsSummary.windowDays,
      selectedWindowDays: metricsSummary.windowDays,
      hasData: metricsSummary.hasData,
      rangeOptions: TIP_METRICS_RANGE_OPTIONS,
      trendCurrency: metricsSummary.trendCurrency,
      trend: metricsSummary.trend,
      summary: {
        currency: metricsPrimary.currency,
        totalNet: metricsPrimary.totalNet,
        ordersWithTip: metricsPrimary.ordersWithTip,
        averageTip: metricsPrimary.averageTip,
        totalOrders: totalOrdersInWindow,
        tipAttachRate,
        delta: {
          totalNet: computeDeltaPercent(
            metricsPrimary.totalNet,
            previousMetricsPrimary.totalNet,
          ),
          ordersWithTip: computeDeltaPercent(
            metricsPrimary.ordersWithTip,
            previousMetricsPrimary.ordersWithTip,
          ),
          averageTip: computeDeltaPercent(
            metricsPrimary.averageTip,
            previousMetricsPrimary.averageTip,
          ),
          tipAttachRate:
            tipAttachRate !== null && previousTipAttachRate !== null
              ? computeDeltaPercent(tipAttachRate, previousTipAttachRate)
              : null,
        },
      },
      currency: metricsPrimary.currency,
      totalNet: metricsPrimary.totalNet,
      ordersWithTip: metricsPrimary.ordersWithTip,
      averageTip: metricsPrimary.averageTip,
      totalOrders: totalOrdersInWindow,
      tipAttachRate,
      currencies: metricsSummary.currencies,
    },
  };
}
