import { isLicenseActive } from "./billing/license.server.js";
import { getTipRuntimeEnabled } from "./billing/access-policy.server.js";
import { hasCartTransformScope } from "./cart-transform.server.js";
import { loadTipConfig } from "./tip-config.server.js";
import { inspectTipMerchandise } from "./tip-merchandise.server.js";
import { loadTipMetricsSummary } from "./tip-metrics.server.js";

const CRITICAL_SCOPES = [
  {
    handle: "write_cart_transforms",
    label: "Modify cart line items",
  },
  {
    handle: "write_products",
    label: "Manage tip products",
  },
  {
    handle: "write_publications",
    label: "Publish tip products",
  },
  {
    handle: "read_publications",
    label: "Access publication data",
  },
  {
    handle: "write_metaobjects",
    label: "Store app metadata",
  },
  {
    handle: "write_metaobject_definitions",
    label: "Maintain app metadata definitions",
  },
];

function toneForStatus(status) {
  if (status === "ready") return "success";
  if (status === "blocked") return "critical";
  return "warning";
}

async function executeAdminJson(admin, query, variables) {
  const response = await admin.graphql(query, variables ? { variables } : {});
  return response.json();
}

export async function loadHomeDashboardData({
  admin,
  shop,
  licenseState,
  shopEligibility,
  sessionScope = "",
  metricsDbClient,
}) {
  const licenseActive = isLicenseActive(licenseState);
  const runtimeEnabled = getTipRuntimeEnabled({
    shopEligibility,
    licenseActive,
  });
  const config = await loadTipConfig(admin, {
    enabled: runtimeEnabled,
  });
  const tipInfrastructure = await inspectTipMerchandise(admin, config);
  const json = await executeAdminJson(
    admin,
    `#graphql
    query HomeDashboardMeta {
      shop {
        name
      }
      currentAppInstallation {
        accessScopes {
          handle
        }
      }
    }`,
  );

  const grantedScopes = (
    json.data?.currentAppInstallation?.accessScopes ?? []
  ).map((scope) => scope.handle);
  const grantedScopeSet = new Set(grantedScopes);
  const transformScopeGranted =
    grantedScopeSet.has("write_cart_transforms") ||
    hasCartTransformScope(sessionScope);
  const checkoutRuntimeStatus =
    !transformScopeGranted || !runtimeEnabled
      ? "warning"
      : config.transform_active
        ? "ready"
        : "warning";
  const checkoutRuntimeMessage = !transformScopeGranted
    ? "The current app install is missing cart transform access."
    : !runtimeEnabled
      ? "Checkout runtime is blocked until the store is eligible and licensed."
      : config.transform_active
        ? "Real-time tip calculations are enabled at checkout."
        : "Open Tip Settings once to complete Cart Transform activation.";
  const scopeItems = CRITICAL_SCOPES.map((scope) => ({
    ...scope,
    granted: grantedScopeSet.has(scope.handle),
  }));
  const missingCriticalScopes = scopeItems.filter((scope) => !scope.granted);
  const settingsSummary = {
    heading: config.heading,
    ctaLabel: config.cta_label,
    presets: config.tip_percentages.split(",").map((value) => value.trim()),
    defaultTipChoice: config.default_tip_choice,
  };
  const metricsSummary = config.tip_metrics_enabled
    ? await loadTipMetricsSummary({
        shop,
        windowDays: config.tip_metrics_window_days,
        dbClient: metricsDbClient,
      })
    : {
        windowDays: config.tip_metrics_window_days,
        currencies: [],
        primary: null,
        hasData: false,
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
        !shopEligibility?.eligible || !licenseActive || checkoutRuntimeStatus !== "ready"
          ? "Home - Attention"
          : "Home - Ready",
    },
    store: {
      title: shopEligibility?.eligible
        ? shopEligibility.isDevStore
          ? "Development Store"
          : "Shopify Plus"
        : "Not eligible",
      planLabel: shopEligibility?.publicDisplayName ?? "Unknown",
      status: shopEligibility?.eligible ? "ready" : "blocked",
      message: shopEligibility?.eligible
        ? "This store meets the app requirements for checkout tipping."
        : "The app requires Shopify Plus or a development store.",
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
    checkoutRuntime: {
      title: config.transform_active ? "Cart Transform" : "Needs attention",
      status: checkoutRuntimeStatus,
      message: checkoutRuntimeMessage,
    },
    tipInfrastructure: {
      title:
        tipInfrastructure.status === "ready"
          ? "Tip Setup Ready"
          : "Tip Setup Needs Attention",
      status: tipInfrastructure.status,
      message: tipInfrastructure.message,
      checks: [
        {
          label: "Tip product",
          value: tipInfrastructure.productId ? "Ready" : "Missing",
          status: tipInfrastructure.productId ? "ready" : "warning",
        },
        {
          label: "Tip variant",
          value: tipInfrastructure.variantId ? "Ready" : "Missing",
          status: tipInfrastructure.variantId ? "ready" : "warning",
        },
        {
          label: "Publication",
          value: tipInfrastructure.publicationId ? "Connected" : "Missing",
          status: tipInfrastructure.publicationId ? "ready" : "warning",
        },
        {
          label: "Settings sync",
          value: config.enabled ? "Enabled" : "Saved",
          status: "ready",
        },
      ],
    },
    tipMetrics: {
      status: config.tip_metrics_enabled ? "ready" : "warning",
      title: "Tip totals",
      message: config.tip_metrics_enabled
        ? metricsSummary.hasData
          ? `Net tip totals for the last ${metricsSummary.windowDays} days.`
          : `No tip orders found in the last ${metricsSummary.windowDays} days yet.`
        : "Tip metrics are disabled in settings.",
      windowDays: metricsSummary.windowDays,
      hasData: metricsSummary.hasData,
      currency: metricsPrimary.currency,
      totalNet: metricsPrimary.totalNet,
      ordersWithTip: metricsPrimary.ordersWithTip,
      averageTip: metricsPrimary.averageTip,
      currencies: metricsSummary.currencies,
    },
    settingsSummary,
    scopes: {
      title:
        missingCriticalScopes.length === 0
          ? "All granted"
          : `${missingCriticalScopes.length} missing`,
      status: missingCriticalScopes.length === 0 ? "ready" : "warning",
      items: scopeItems,
    },
    tones: {
      store: toneForStatus(shopEligibility?.eligible ? "ready" : "blocked"),
      license: toneForStatus(licenseActive ? "ready" : "blocked"),
      checkoutRuntime: toneForStatus(checkoutRuntimeStatus),
      tipInfrastructure: toneForStatus(tipInfrastructure.status),
      scopes: toneForStatus(
        missingCriticalScopes.length === 0 ? "ready" : "warning",
      ),
    },
  };
}
