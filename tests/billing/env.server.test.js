import test from "node:test";
import assert from "node:assert/strict";

import {
  getBillingEnforcementMode,
  shouldBypassBilling,
} from "../../app/billing/env.server.js";

test("defaults to required when billing env is not set", () => {
  assert.equal(getBillingEnforcementMode({ NODE_ENV: "production" }), "required");
  assert.equal(shouldBypassBilling({ NODE_ENV: "production" }), false);
});

test("requires billing when BILLING_ENFORCEMENT=required", () => {
  assert.equal(
    getBillingEnforcementMode({ BILLING_ENFORCEMENT: "required" }),
    "required",
  );
  assert.equal(
    shouldBypassBilling({ BILLING_ENFORCEMENT: "required" }),
    false,
  );
});

test("bypasses billing when BILLING_ENFORCEMENT=bypass", () => {
  assert.equal(
    getBillingEnforcementMode({ BILLING_ENFORCEMENT: "bypass" }),
    "bypass",
  );
  assert.equal(
    shouldBypassBilling({ BILLING_ENFORCEMENT: "bypass" }),
    true,
  );
});

test("bypasses billing in development when dev bypass is enabled", () => {
  assert.equal(
    getBillingEnforcementMode({
      BILLING_BYPASS_DEVELOPMENT: "true",
      BILLING_ENFORCEMENT: "required",
      NODE_ENV: "development",
    }),
    "bypass",
  );
  assert.equal(
    shouldBypassBilling({
      BILLING_BYPASS_DEVELOPMENT: "true",
      VERCEL_ENV: "preview",
      NODE_ENV: "production",
    }),
    true,
  );
});

test("does not bypass production with dev bypass enabled", () => {
  assert.equal(
    getBillingEnforcementMode({
      BILLING_BYPASS_DEVELOPMENT: "true",
      VERCEL_ENV: "production",
      NODE_ENV: "production",
    }),
    "required",
  );
});
