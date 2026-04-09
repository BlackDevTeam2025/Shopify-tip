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

    if (query.includes("query ValidateTipMerchandise")) {
      return {
        data: {
          nodes: [
            {
              __typename: "Product",
              id: "gid://shopify/Product/1",
              variants: {
                edges: [
                  {
                    node: {
                      id: "gid://shopify/ProductVariant/1",
                    },
                  },
                ],
              },
            },
            {
              __typename: "ProductVariant",
              id: "gid://shopify/ProductVariant/1",
              product: {
                id: "gid://shopify/Product/1",
              },
            },
          ],
        },
      };
    }

    if (query.includes("query GetPublications")) {
      return {
        data: {
          publications: {
            edges: [
              {
                node: {
                  id: "gid://shopify/Publication/1",
                  name: "Online Store",
                },
              },
            ],
          },
        },
      };
    }

    if (query.includes("query HomeDashboardMeta")) {
      return {
        data: {
          shop: {
            name: "Saovang",
          },
          currentAppInstallation: {
            accessScopes: [
              { handle: "write_cart_transforms" },
              { handle: "write_products" },
              { handle: "write_publications" },
              { handle: "read_publications" },
              { handle: "write_metaobjects" },
              { handle: "write_metaobject_definitions" },
            ],
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
    sessionScope: "write_cart_transforms,write_products",
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
  assert.equal(dashboard.store.status, "ready");
  assert.equal(dashboard.license.status, "ready");
  assert.equal(dashboard.checkoutRuntime.status, "ready");
  assert.equal(dashboard.tipInfrastructure.status, "ready");
  assert.equal(dashboard.scopes.status, "ready");
  assert.deepEqual(dashboard.settingsSummary.presets, ["10", "15", "20"]);
  assert.equal(dashboard.settingsSummary.defaultTipChoice, "preset_2");
  assert.equal(dashboard.tipMetrics.currency, "USD");
  assert.equal(dashboard.tipMetrics.totalNet, 20);
  assert.equal(dashboard.tipMetrics.ordersWithTip, 2);
  assert.equal(dashboard.tipMetrics.averageTip, 10);
});

test("loadHomeDashboardData surfaces blocked store state and missing scopes without crashing", async () => {
  const admin = createAdmin((query, options) => {
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

    if (query.includes("query FindAppManagedTipProduct")) {
      assert.equal(options?.variables?.query, "tag:app_tip_internal");
      return {
        data: {
          products: {
            edges: [],
          },
        },
      };
    }

    if (query.includes("query GetPublications")) {
      return {
        data: {
          publications: {
            edges: [],
          },
        },
      };
    }

    if (query.includes("query HomeDashboardMeta")) {
      return {
        data: {
          shop: {
            name: "Blocked store",
          },
          currentAppInstallation: {
            accessScopes: [{ handle: "write_products" }],
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
    sessionScope: "",
    metricsDbClient: {
      tipMetric: {
        findMany: async () => [],
      },
    },
  });

  assert.equal(dashboard.header.readinessLabel, "Home - Attention");
  assert.equal(dashboard.store.status, "blocked");
  assert.equal(dashboard.license.status, "blocked");
  assert.equal(dashboard.checkoutRuntime.status, "warning");
  assert.equal(dashboard.tipInfrastructure.status, "warning");
  assert.equal(dashboard.scopes.status, "warning");
  assert.equal(
    dashboard.tipInfrastructure.message,
    "Could not find the Online Store publication required for tip checkout.",
  );
  assert.equal(
    dashboard.scopes.items.some(
      (scope) => scope.handle === "write_cart_transforms" && scope.granted === false,
    ),
    true,
  );
  assert.equal(dashboard.tipMetrics.hasData, false);
  assert.equal(dashboard.tipMetrics.totalNet, 0);
});
