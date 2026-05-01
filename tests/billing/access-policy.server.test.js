import test from "node:test";
import assert from "node:assert/strict";

import {
  getBillingRouteAccessDecision,
  getTipRuntimeEnabled,
} from "../../app/billing/access-policy.server.js";

const eligibleShop = { eligible: true, isDevStore: false };
const developmentShop = { eligible: true, isDevStore: true };
const ineligibleShop = { eligible: false, isDevStore: false };

test("redirects protected routes when the shop is ineligible", () => {
  assert.deepEqual(
    getBillingRouteAccessDecision({
      isLicenseRoute: false,
      canAccessWithoutLicense: false,
      shopEligibility: ineligibleShop,
      licenseActive: true,
    }),
    {
      redirectTo: "/app/license",
      reason: "shop_ineligible",
    },
  );
});

test("allows the license route even when the shop is ineligible", () => {
  assert.deepEqual(
    getBillingRouteAccessDecision({
      isLicenseRoute: true,
      canAccessWithoutLicense: true,
      shopEligibility: ineligibleShop,
      licenseActive: false,
    }),
    {
      redirectTo: null,
      reason: null,
    },
  );
});

test("redirects eligible unpaid shops to the license route for protected pages", () => {
  assert.deepEqual(
    getBillingRouteAccessDecision({
      isLicenseRoute: false,
      canAccessWithoutLicense: false,
      shopEligibility: eligibleShop,
      licenseActive: false,
    }),
    {
      redirectTo: "/app/license",
      reason: "license_required",
    },
  );
});

test("allows eligible licensed shops through protected pages", () => {
  assert.deepEqual(
    getBillingRouteAccessDecision({
      isLicenseRoute: false,
      canAccessWithoutLicense: false,
      shopEligibility: eligibleShop,
      licenseActive: true,
    }),
    {
      redirectTo: null,
      reason: null,
    },
  );
});

test("allows eligible development shops through protected pages without a paid license", () => {
  assert.deepEqual(
    getBillingRouteAccessDecision({
      isLicenseRoute: false,
      canAccessWithoutLicense: false,
      shopEligibility: developmentShop,
      licenseActive: false,
    }),
    {
      redirectTo: null,
      reason: null,
    },
  );
});

test("enables tip runtime for eligible licensed shops and development stores", () => {
  assert.equal(
    getTipRuntimeEnabled({
      shopEligibility: eligibleShop,
      licenseActive: true,
    }),
    true,
  );
  assert.equal(
    getTipRuntimeEnabled({
      shopEligibility: eligibleShop,
      licenseActive: false,
    }),
    false,
  );
  assert.equal(
    getTipRuntimeEnabled({
      shopEligibility: developmentShop,
      licenseActive: false,
    }),
    true,
  );
  assert.equal(
    getTipRuntimeEnabled({
      shopEligibility: ineligibleShop,
      licenseActive: true,
    }),
    false,
  );
});
