import test from "node:test";
import assert from "node:assert/strict";

import {
  getBillingEnforcementMode,
  shouldBypassBilling,
} from "../../app/billing/env.server.js";

test("defaults to bypass when BILLING_ENFORCEMENT is not set", () => {
  assert.equal(getBillingEnforcementMode({}), "bypass");
  assert.equal(shouldBypassBilling({}), true);
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
