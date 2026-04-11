import test from "node:test";
import assert from "node:assert/strict";

import { loadHomeDashboardData } from "../../app/home-dashboard.server.js";

function createAdmin(resolver) {
  return {
    graphql: async (query, options) => ({
      json: async () => resolver(query, options),
    }),
  };
}

test("loadHomeDashboardData returns a ready operational dashboard payload", async () => {
  const admin = createAdmin((query) => {
    if (query.includes("query GetTipBlockConfig")) {
      return {
        data: {
          shop: {
            id: "gid://shopify/Shop/1",
            metafield: {
              value: JSON.stringify({
                enabled: true,
                plus_only: true,
                transform_active: true,
                custom_amount_enabled: true,
                hide_until_opt_in: false,
                default_tip_choice: "preset_2",
                tip_product_id: "gid://shopify/Product/1",
                tip_variant_id: "gid://shopify/ProductVariant/1",
                tip_infrastructure_status: "ready",
                tip_infrastructure_error: "",
                heading: "Support our team",
                support_text: "Show your support.",
                thank_you_text: "THANK YOU.",
                cta_label: "Add tip",
                tip_percentages: "10,15,20",
              }),
            },
          },
        },
      };
    }

    if (query.includes("query HomeDashboardHeader")) {
      return {
        data: {
          shop: {
            name: "Saovang",
          },
        },
      };
    }

    throw new Error(`Unexpected query: ${query}`);
  });

  const dashboard = await loadHomeDashboardData({
    admin,
    shop: "saovang-2.myshopify.com",
    licenseState: {
      licenseStatus: "active",
    },
    shopEligibility: {
      eligible: true,
      isDevStore: false,
      publicDisplayName: "Shopify Plus",
    },
    metricsDbClient: {
      tipMetric: {
        findMany: async () => [
          { currency: "USD", netAmount: 12.5 },
          { currency: "USD", netAmount: 7.5 },
        ],
      },
    },
  });

  assert.equal(dashboard.header.storeName, "Saovang");
  assert.equal(dashboard.header.readinessLabel, "Home - Ready");
  assert.equal(dashboard.license.status, "ready");
  assert.equal(dashboard.license.title, "Active");
  assert.equal(dashboard.tipMetrics.title, "Total tips (net, 60 days)");
  assert.equal(dashboard.tipMetrics.summary.currency, "USD");
  assert.equal(dashboard.tipMetrics.summary.totalNet, 20);
  assert.equal(dashboard.tipMetrics.summary.ordersWithTip, 2);
  assert.equal(dashboard.tipMetrics.summary.averageTip, 10);
  assert.equal(dashboard.tipMetrics.selectedWindowDays, 60);
  assert.deepEqual(dashboard.tipMetrics.rangeOptions, [7, 30, 60, 90]);
  assert.equal(dashboard.tipMetrics.trendCurrency, "USD");
  assert.equal(dashboard.tipMetrics.trend.length, 60);
});

test("loadHomeDashboardData surfaces blocked store state and missing scopes without crashing", async () => {
  const admin = createAdmin((query) => {
    if (query.includes("query GetTipBlockConfig")) {
      return {
        data: {
          shop: {
            id: "gid://shopify/Shop/1",
            metafield: {
              value: JSON.stringify({
                enabled: false,
                plus_only: true,
                transform_active: false,
                custom_amount_enabled: true,
                hide_until_opt_in: false,
                default_tip_choice: "preset_2",
                tip_product_id: "",
                tip_variant_id: "",
                tip_infrastructure_status: "pending",
                tip_infrastructure_error: "",
                heading: "Add tip",
                support_text: "Show your support for the team.",
                thank_you_text: "THANK YOU, WE APPRECIATE IT.",
                cta_label: "Add tip",
                tip_percentages: "10,15,20",
              }),
            },
          },
        },
      };
    }

    if (query.includes("query HomeDashboardHeader")) {
      return {
        data: {
          shop: {
            name: "Blocked store",
          },
        },
      };
    }

    throw new Error(`Unexpected query: ${query}`);
  });

  const dashboard = await loadHomeDashboardData({
    admin,
    shop: "blocked-shop.myshopify.com",
    licenseState: {
      licenseStatus: "none",
    },
    shopEligibility: {
      eligible: false,
      isDevStore: false,
      publicDisplayName: "Grow",
    },
    metricsDbClient: {
      tipMetric: {
        findMany: async () => [],
      },
    },
  });

  assert.equal(dashboard.header.readinessLabel, "Home - Attention");
  assert.equal(dashboard.license.status, "blocked");
  assert.equal(dashboard.license.title, "Not active");
  assert.equal(dashboard.tipMetrics.hasData, false);
  assert.equal(dashboard.tipMetrics.summary.totalNet, 0);
  assert.equal(dashboard.tipMetrics.trend.length, 60);
});

test("loadHomeDashboardData honors a supported dashboard range override", async () => {
  const admin = createAdmin((query) => {
    if (query.includes("query GetTipBlockConfig")) {
      return {
        data: {
          shop: {
            id: "gid://shopify/Shop/1",
            metafield: {
              value: JSON.stringify({
                enabled: true,
                plus_only: true,
                transform_active: true,
                custom_amount_enabled: true,
                hide_until_opt_in: false,
                default_tip_choice: "preset_2",
                tip_product_id: "gid://shopify/Product/1",
                tip_variant_id: "gid://shopify/ProductVariant/1",
                tip_infrastructure_status: "ready",
                tip_infrastructure_error: "",
                heading: "Support our team",
                support_text: "Show your support.",
                thank_you_text: "THANK YOU.",
                cta_label: "Add tip",
                tip_percentages: "10,15,20",
              }),
            },
          },
        },
      };
    }

    if (query.includes("query HomeDashboardHeader")) {
      return {
        data: {
          shop: {
            name: "Range test",
          },
        },
      };
    }

    throw new Error(`Unexpected query: ${query}`);
  });

  const dashboard = await loadHomeDashboardData({
    admin,
    shop: "range-test.myshopify.com",
    selectedWindowDays: "30",
    licenseState: {
      licenseStatus: "active",
    },
    shopEligibility: {
      eligible: true,
      isDevStore: false,
      publicDisplayName: "Shopify Plus",
    },
    metricsDbClient: {
      tipMetric: {
        findMany: async () => [
          {
            currency: "USD",
            netAmount: 42,
            paidAt: new Date("2026-04-10T10:00:00Z"),
          },
        ],
      },
    },
  });

  assert.equal(dashboard.tipMetrics.selectedWindowDays, 30);
  assert.equal(dashboard.tipMetrics.title, "Total tips (net, 30 days)");
  assert.equal(dashboard.tipMetrics.trend.length, 30);
});
