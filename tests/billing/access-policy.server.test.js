import test from "node:test";
import assert from "node:assert/strict";

import {
  getBillingRouteAccessDecision,
  getTipRuntimeEnabled,
} from "../../app/billing/access-policy.server.js";

const eligibleShop = { eligible: true };
const ineligibleShop = { eligible: false };

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

test("only enables tip runtime for eligible licensed shops", () => {
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
      shopEligibility: ineligibleShop,
      licenseActive: true,
    }),
    false,
  );
});
