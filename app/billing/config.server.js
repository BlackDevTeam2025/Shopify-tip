import { BillingInterval } from "@shopify/shopify-app-react-router/server";

const DEFAULT_LIFETIME_PRICE = 49;
const DEFAULT_CURRENCY = "USD";
const DEFAULT_PLAN_NAME = "Lifetime License";

function parsePositiveNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const LIFETIME_PLAN = process.env.SHOPIFY_LIFETIME_PLAN_NAME?.trim() || DEFAULT_PLAN_NAME;
export const LIFETIME_PRICE = parsePositiveNumber(
  process.env.SHOPIFY_LIFETIME_PRICE,
  DEFAULT_LIFETIME_PRICE,
);
export const LIFETIME_CURRENCY =
  process.env.SHOPIFY_LIFETIME_CURRENCY?.trim() || DEFAULT_CURRENCY;

export const BILLING_CONFIG = {
  [LIFETIME_PLAN]: {
    amount: LIFETIME_PRICE,
    currencyCode: LIFETIME_CURRENCY,
    interval: BillingInterval.OneTime,
  },
};

export function getLifetimePlanDetails() {
  return {
    plan: LIFETIME_PLAN,
    amount: LIFETIME_PRICE,
    currencyCode: LIFETIME_CURRENCY,
  };
}
