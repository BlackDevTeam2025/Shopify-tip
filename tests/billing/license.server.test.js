import test from "node:test";
import assert from "node:assert/strict";

import {
  buildLicenseState,
  selectActiveOneTimePurchase,
} from "../../app/billing/license.server.js";

test("prefers an ACTIVE one-time purchase", () => {
  const purchase = selectActiveOneTimePurchase([
    { id: "1", status: "DECLINED", test: false, name: "Lifetime" },
    { id: "2", status: "ACTIVE", test: false, name: "Lifetime" },
  ]);

  assert.deepEqual(purchase, {
    id: "2",
    status: "ACTIVE",
    test: false,
    name: "Lifetime",
  });
});

test("returns null when there is no active purchase", () => {
  assert.equal(
    selectActiveOneTimePurchase([{ id: "1", status: "DECLINED" }]),
    null,
  );
});

test("treats an ACCEPTED purchase as active enough to unlock", () => {
  const purchase = selectActiveOneTimePurchase([
    { id: "3", status: "ACCEPTED", test: false, name: "Lifetime" },
  ]);

  assert.deepEqual(purchase, {
    id: "3",
    status: "ACCEPTED",
    test: false,
    name: "Lifetime",
  });
});

test("builds an active license state from an active purchase", () => {
  const now = new Date("2026-04-04T09:00:00.000Z");
  const licenseState = buildLicenseState({
    shop: "demo.myshopify.com",
    purchases: [{ id: "2", status: "ACTIVE", test: false, name: "Lifetime" }],
    now,
  });

  assert.deepEqual(licenseState, {
    shop: "demo.myshopify.com",
    licenseStatus: "active",
    purchaseId: "2",
    purchaseName: "Lifetime",
    isTest: false,
    activatedAt: now,
  });
});

test("builds a none license state when no purchase is active", () => {
  const licenseState = buildLicenseState({
    shop: "demo.myshopify.com",
    purchases: [{ id: "1", status: "DECLINED", test: false, name: "Lifetime" }],
    now: new Date("2026-04-04T09:00:00.000Z"),
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
