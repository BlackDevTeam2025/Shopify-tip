const DEFAULT_MONTHLY_PRICE = 9.99;
const DEFAULT_YEARLY_PRICE = 99;
const DEFAULT_CURRENCY = "USD";
const DEFAULT_TRIAL_DAYS = 3;
const DEFAULT_APP_HANDLE = "snaptip";

function parsePositiveNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parsePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeAppHandle(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().replace(/\s+/g, "-");
}

function normalizeShopHandle(shop) {
  return String(shop || "")
    .trim()
    .replace(/\.myshopify\.com$/i, "");
}

export const MONTHLY_PRICE = parsePositiveNumber(
  process.env.SHOPIFY_MONTHLY_PRICE,
  DEFAULT_MONTHLY_PRICE,
);
export const YEARLY_PRICE = parsePositiveNumber(
  process.env.SHOPIFY_YEARLY_PRICE,
  DEFAULT_YEARLY_PRICE,
);
export const BILLING_CURRENCY =
  process.env.SHOPIFY_BILLING_CURRENCY?.trim() || DEFAULT_CURRENCY;
export const TRIAL_DAYS = parsePositiveInteger(
  process.env.SHOPIFY_TRIAL_DAYS,
  DEFAULT_TRIAL_DAYS,
);
export const MANAGED_PRICING_APP_HANDLE =
  normalizeAppHandle(
    process.env.SHOPIFY_MANAGED_PRICING_APP_HANDLE ||
      process.env.SHOPIFY_APP_HANDLE,
  ) || DEFAULT_APP_HANDLE;

export function getManagedPricingDetails() {
  return {
    monthly: {
      amount: MONTHLY_PRICE,
      currencyCode: BILLING_CURRENCY,
      intervalLabel: "month",
      label: "Monthly",
    },
    yearly: {
      amount: YEARLY_PRICE,
      currencyCode: BILLING_CURRENCY,
      intervalLabel: "year",
      label: "Yearly",
      badge: "Best value",
    },
    currencyCode: BILLING_CURRENCY,
    trialDays: TRIAL_DAYS,
    appHandle: MANAGED_PRICING_APP_HANDLE,
  };
}

export function getManagedPricingUrl(shop) {
  const shopHandle = normalizeShopHandle(shop);

  if (!shopHandle) {
    return null;
  }

  return `https://admin.shopify.com/store/${shopHandle}/charges/${MANAGED_PRICING_APP_HANDLE}/pricing_plans`;
}
