import test from "node:test";
import assert from "node:assert/strict";

import {
  buildLicenseState,
  selectRelevantSubscription,
} from "../../app/billing/license.server.js";

test("prefers an ACTIVE subscription over lower-priority states", () => {
  const subscription = selectRelevantSubscription([
    { id: "1", status: "CANCELLED", createdAt: "2026-04-01T00:00:00.000Z" },
    { id: "2", status: "FROZEN", createdAt: "2026-04-02T00:00:00.000Z" },
    { id: "3", status: "ACTIVE", createdAt: "2026-04-03T00:00:00.000Z" },
  ]);

  assert.deepEqual(subscription, {
    id: "3",
    status: "ACTIVE",
    createdAt: "2026-04-03T00:00:00.000Z",
  });
});

test("falls back to a cached frozen subscription when no active subscription exists", () => {
  const licenseState = buildLicenseState({
    shop: "demo.myshopify.com",
    subscriptions: [],
    cachedLicense: {
      licenseStatus: "frozen",
      purchaseId: "gid://shopify/AppSubscription/10",
      purchaseName: "Tip App Monthly",
      isTest: false,
    },
  });

  assert.deepEqual(licenseState, {
    shop: "demo.myshopify.com",
    licenseStatus: "frozen",
    purchaseId: "gid://shopify/AppSubscription/10",
    purchaseName: "Tip App Monthly",
    isTest: false,
    activatedAt: null,
  });
});

test("builds an active license state from an active subscription", () => {
  const now = new Date("2026-04-04T09:00:00.000Z");
  const licenseState = buildLicenseState({
    shop: "demo.myshopify.com",
    subscriptions: [
      {
        id: "gid://shopify/AppSubscription/11",
        status: "ACTIVE",
        name: "Tip App Yearly",
        createdAt: "2026-04-04T08:55:00.000Z",
      },
    ],
    now,
  });

  assert.deepEqual(licenseState, {
    shop: "demo.myshopify.com",
    licenseStatus: "active",
    purchaseId: "gid://shopify/AppSubscription/11",
    purchaseName: "Tip App Yearly",
    isTest: false,
    activatedAt: now,
  });
});

test("builds a none state when there is no active or cached subscription status", () => {
  const licenseState = buildLicenseState({
    shop: "demo.myshopify.com",
    subscriptions: [],
    cachedLicense: {
      licenseStatus: "none",
    },
  });

  assert.deepEqual(licenseState, {
    shop: "demo.myshopify.com",
    licenseStatus: "none",
    purchaseId: null,
    purchaseName: null,
    isTest: false,
    activatedAt: null,
  });
});
