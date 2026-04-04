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

export function parseTipPercentages(raw) {
  return String(raw ?? "")
    .split(",")
    .map((value) => Number.parseFloat(value.trim()))
    .filter((value) => Number.isFinite(value) && value > 0 && value <= 100);
}

export function calculateSubtotalTipAmount({ subtotal, percentage }) {
  const numericSubtotal = Number(subtotal);
  const numericPercentage = Number(percentage);

  if (!Number.isFinite(numericSubtotal) || numericSubtotal <= 0) return 0;
  if (!Number.isFinite(numericPercentage) || numericPercentage <= 0) return 0;

  return roundCurrencyAmount((numericSubtotal * numericPercentage) / 100);
}

export function formatTipOptionLabel({
  percentage,
  amount,
  currencyCode = "USD",
  displayOption = "percentage_and_amount",
}) {
  const formattedAmount = formatCurrency(amount, currencyCode);

  switch (displayOption) {
    case "percentage_only":
      return `${percentage}%`;
    case "amount_first":
      return `${formattedAmount} (${percentage}%)`;
    case "percentage_and_amount":
    default:
      return `Add ${percentage}% (${formattedAmount}) tip`;
  }
}

export function isValidCustomAmount(value) {
  const numericValue = Number.parseFloat(String(value ?? "").trim());
  return Number.isFinite(numericValue) && numericValue > 0;
}
