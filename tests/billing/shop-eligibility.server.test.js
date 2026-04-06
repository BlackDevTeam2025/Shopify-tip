import test from "node:test";
import assert from "node:assert/strict";

import {
  SHOP_ELIGIBILITY_REASONS,
  buildShopEligibility,
} from "../../app/billing/shop-eligibility.server.js";

test("marks Shopify Plus shops as eligible", () => {
  assert.deepEqual(
    buildShopEligibility({
      shopifyPlus: true,
      partnerDevelopment: false,
      publicDisplayName: "Plus",
    }),
    {
      eligible: true,
      isPlus: true,
      isDevStore: false,
      publicDisplayName: "Plus",
      reason: null,
    },
  );
});

test("marks partner development stores as eligible for testing", () => {
  assert.deepEqual(
    buildShopEligibility({
      shopifyPlus: false,
      partnerDevelopment: true,
      publicDisplayName: "Development",
    }),
    {
      eligible: true,
      isPlus: false,
      isDevStore: true,
      publicDisplayName: "Development",
      reason: null,
    },
  );
});

test("marks non-Plus production shops as ineligible", () => {
  assert.deepEqual(
    buildShopEligibility({
      shopifyPlus: false,
      partnerDevelopment: false,
      publicDisplayName: "Grow",
    }),
    {
      eligible: false,
      isPlus: false,
      isDevStore: false,
      publicDisplayName: "Grow",
      reason: SHOP_ELIGIBILITY_REASONS.PLUS_REQUIRED,
    },
  );
});

test("falls back to an unavailable-plan reason when plan data is missing", () => {
  assert.deepEqual(buildShopEligibility(null), {
    eligible: false,
    isPlus: false,
    isDevStore: false,
    publicDisplayName: "Unknown",
    reason: SHOP_ELIGIBILITY_REASONS.PLAN_UNAVAILABLE,
  });
});
