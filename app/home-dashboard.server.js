import { isLicenseActive } from "./billing/license.server.js";
import { getTipRuntimeEnabled } from "./billing/access-policy.server.js";
import { loadTipConfig } from "./tip-config.server.js";
import {
  TIP_METRICS_RANGE_OPTIONS,
  loadTipMetricsSummary,
  normalizeTipMetricsWindowDays,
} from "./tip-metrics.server.js";

async function executeAdminJson(admin, query, variables) {
  const response = await admin.graphql(query, variables ? { variables } : {});
  return response.json();
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
  const json = await executeAdminJson(
    admin,
    `#graphql
    query HomeDashboardHeader {
      shop {
        name
      }
    }`,
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
  const metricsPrimary = metricsSummary.primary ?? {
    currency: "USD",
    totalNet: 0,
    ordersWithTip: 0,
    averageTip: 0,
  };

  return {
    header: {
      storeName: json.data?.shop?.name ?? "Store",
      readinessLabel:
        !shopEligibility?.eligible || !licenseActive
          ? "Home - Attention"
          : "Home - Ready",
      subtitle: "Track license access and net tip revenue in one place.",
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
      },
      currency: metricsPrimary.currency,
      totalNet: metricsPrimary.totalNet,
      ordersWithTip: metricsPrimary.ordersWithTip,
      averageTip: metricsPrimary.averageTip,
      currencies: metricsSummary.currencies,
    },
  };
}
