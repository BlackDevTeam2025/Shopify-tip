import test from "node:test";
import assert from "node:assert/strict";

import { applyTipCheckoutBranding } from "../../app/checkout-branding.server.js";

function createAdmin(resolver) {
  return {
    graphql: async (query, options) => ({
      json: async () => resolver(query, options),
    }),
  };
}

test("applyTipCheckoutBranding skips mutation when apply toggle is off", async () => {
  const result = await applyTipCheckoutBranding({
    admin: createAdmin(() => {
      throw new Error("Should not call Admin API when disabled");
    }),
    shopEligibility: { eligible: true },
    applyCheckoutBranding: false,
    customTextColor: "#111111",
    customBorderColor: "#222222",
  });

  assert.deepEqual(result, {
    status: "disabled",
    applied: false,
    message: "",
    errors: [],
  });
});

test("applyTipCheckoutBranding returns warning when required branding scopes are missing", async () => {
  const admin = createAdmin((query) => {
    if (query.includes("query LoadGrantedScopesForBranding")) {
      return {
        data: {
          currentAppInstallation: {
            accessScopes: [{ handle: "write_products" }],
          },
        },
      };
    }

    throw new Error(`Unexpected query: ${query}`);
  });
  const result = await applyTipCheckoutBranding({
    admin,
    shopEligibility: { eligible: true },
    applyCheckoutBranding: true,
    customTextColor: "#111111",
    customBorderColor: "#222222",
  });

  assert.equal(result.status, "warning");
  assert.equal(result.applied, false);
  assert.match(result.message, /Missing access scopes/i);
});

test("applyTipCheckoutBranding applies branding when profile and scopes are available", async () => {
  const admin = createAdmin((query, options) => {
    if (query.includes("query LoadGrantedScopesForBranding")) {
      return {
        data: {
          currentAppInstallation: {
            accessScopes: [
              { handle: "read_checkout_branding_settings" },
              { handle: "write_checkout_branding_settings" },
            ],
          },
        },
      };
    }

    if (query.includes("query LoadCheckoutProfilesForBranding")) {
      return {
        data: {
          checkoutProfiles: {
            nodes: [{ id: "gid://shopify/CheckoutProfile/1", isPublished: true }],
          },
        },
      };
    }

    if (query.includes("mutation ApplyTipCheckoutBranding")) {
      assert.equal(options?.variables?.checkoutProfileId, "gid://shopify/CheckoutProfile/1");
      return {
        data: {
          checkoutBrandingUpsert: {
            userErrors: [],
          },
        },
      };
    }

    throw new Error(`Unexpected query: ${query}`);
  });
  const result = await applyTipCheckoutBranding({
    admin,
    shopEligibility: { eligible: true },
    applyCheckoutBranding: true,
    customTextColor: "#1A1C1E",
    customBorderColor: "#737785",
  });

  assert.deepEqual(result, {
    status: "applied",
    applied: true,
    message: "Checkout branding colors were applied successfully.",
    errors: [],
  });
});
