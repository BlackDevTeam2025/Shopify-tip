import test from "node:test";
import assert from "node:assert/strict";

import { buildLicensePageState } from "../../app/billing/license-page.server.js";

test("builds a purchasable state for eligible unpaid shops", () => {
  assert.deepEqual(
    buildLicensePageState({
      shopEligibility: {
        eligible: true,
        publicDisplayName: "Plus",
      },
      licenseState: {
        licenseStatus: "none",
      },
    }),
    {
      mode: "purchase",
      canManagePlan: true,
      licenseStatus: "none",
      planDisplayName: "Plus",
      worksForPlusStoresMessage: "This app works for Shopify Plus stores.",
    },
  );
});

test("builds an ineligible state with no purchase CTA for non-Plus shops", () => {
  assert.deepEqual(
    buildLicensePageState({
      shopEligibility: {
        eligible: false,
        publicDisplayName: "Grow",
      },
      licenseState: {
        licenseStatus: "none",
      },
    }),
    {
      mode: "ineligible",
      canManagePlan: false,
      licenseStatus: "none",
      planDisplayName: "Grow",
      worksForPlusStoresMessage: "This app works for Shopify Plus stores.",
    },
  );
});

test("builds a billing issue state for frozen subscriptions", () => {
  assert.deepEqual(
    buildLicensePageState({
      shopEligibility: {
        eligible: true,
        publicDisplayName: "Shopify Plus",
      },
      licenseState: {
        licenseStatus: "frozen",
      },
    }),
    {
      mode: "billing_issue",
      canManagePlan: true,
      licenseStatus: "frozen",
      planDisplayName: "Shopify Plus",
      worksForPlusStoresMessage: "This app works for Shopify Plus stores.",
    },
  );
});
