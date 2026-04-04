export function getBillingEnforcementMode(env = process.env) {
  return env.BILLING_ENFORCEMENT === "required" ? "required" : "bypass";
}

export function shouldBypassBilling(env = process.env) {
  return getBillingEnforcementMode(env) === "bypass";
}

export function shouldUseTestCharge(env = process.env) {
  return env.SHOPIFY_BILLING_TEST_MODE === "true";
}
