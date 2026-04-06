export const FIXED_TIP_PERCENTAGES = Object.freeze([15, 18, 25]);

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
