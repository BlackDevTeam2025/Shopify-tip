export function getBillingEnforcementMode(env = process.env) {
  if (env.BILLING_BYPASS_DEVELOPMENT === "true" && isDevelopmentRuntime(env)) {
    return "bypass";
  }

  if (env.BILLING_ENFORCEMENT === "bypass") {
    return "bypass";
  }

  if (env.BILLING_ENFORCEMENT === "required") {
    return "required";
  }

  return "required";
}

export function shouldBypassBilling(env = process.env) {
  return getBillingEnforcementMode(env) === "bypass";
}

function isDevelopmentRuntime(env = process.env) {
  if (env.VERCEL_ENV === "development" || env.VERCEL_ENV === "preview") {
    return true;
  }

  return env.NODE_ENV !== "production";
}

export function shouldUseTestCharge(env = process.env) {
  return env.SHOPIFY_BILLING_TEST_MODE === "true";
}
