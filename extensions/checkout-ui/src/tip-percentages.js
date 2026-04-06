export const DEFAULT_TIP_PERCENTAGES = "10,15,20";

function formatCurrency(amount, currencyCode = "USD") {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currencyCode} ${amount.toFixed(2)}`;
  }
}

function normalizePresetEntry(value, fallback) {
  const parsed = Number.parseFloat(String(value ?? "").trim());

  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 100) {
    return fallback;
  }

  return parsed;
}

export function parseTipPercentages(raw, fallback = DEFAULT_TIP_PERCENTAGES) {
  const fallbackParts = String(fallback)
    .split(",")
    .map((entry) => Number.parseFloat(entry.trim()))
    .filter((entry) => Number.isFinite(entry) && entry > 0 && entry <= 100);
  const parsed = String(raw ?? "")
    .split(",")
    .map((value) => Number.parseFloat(value.trim()))
    .filter((value) => Number.isFinite(value) && value > 0 && value <= 100);

  return [0, 1, 2].map((index) =>
    normalizePresetEntry(parsed[index], fallbackParts[index] ?? 10),
  );
}

export function roundCurrencyAmount(amount) {
  return Math.round((Number(amount) + Number.EPSILON) * 100) / 100;
}

export function calculateSubtotalTipAmount({ subtotal, percentage }) {
  const numericSubtotal = Number(subtotal);
  const numericPercentage = Number(percentage);

  if (!Number.isFinite(numericSubtotal) || numericSubtotal <= 0) return 0;
  if (!Number.isFinite(numericPercentage) || numericPercentage <= 0) return 0;

  return roundCurrencyAmount((numericSubtotal * numericPercentage) / 100);
}

export function formatPercentageTipLabel({
  percentage,
  amount,
  currencyCode = "USD",
}) {
  return `${percentage}% tip (${formatCurrency(amount, currencyCode)})`;
}

export function isValidCustomAmount(value) {
  const numericValue = Number.parseFloat(String(value ?? "").trim());
  return Number.isFinite(numericValue) && numericValue > 0;
}
