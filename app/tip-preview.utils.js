export const PREVIEW_SUBTOTAL = 100;
export const DEFAULT_SUPPORT_ROTATION_SECONDS = 30;
export const MIN_SUPPORT_ROTATION_SECONDS = 5;
export const MAX_SUPPORT_ROTATION_SECONDS = 300;

const DEFAULT_PRESETS = [10, 15, 20];

function normalizePercentage(value, fallback) {
  const parsed = Number.parseFloat(String(value ?? "").trim());

  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 100) {
    return fallback;
  }

  return parsed;
}

export function normalizePreviewSupportRotationSeconds(
  value,
  fallback = DEFAULT_SUPPORT_ROTATION_SECONDS,
) {
  const parsed = Number.parseInt(String(value ?? "").trim(), 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.min(
    MAX_SUPPORT_ROTATION_SECONDS,
    Math.max(MIN_SUPPORT_ROTATION_SECONDS, parsed),
  );
}

export function buildPreviewPresets(presetValues = {}) {
  const presetNumbers = [
    normalizePercentage(presetValues.preset_1, DEFAULT_PRESETS[0]),
    normalizePercentage(presetValues.preset_2, DEFAULT_PRESETS[1]),
    normalizePercentage(presetValues.preset_3, DEFAULT_PRESETS[2]),
  ];

  return presetNumbers.map((value, index) => ({
    key: `preset_${index + 1}`,
    value,
    label: String(value),
  }));
}

export function resolvePreviewDefaultSelection(
  defaultTipChoice,
  presets = buildPreviewPresets(),
) {
  const normalized = String(defaultTipChoice ?? "").trim().toLowerCase();
  const presetKeys = new Set(presets.map((preset) => preset.key));

  if (presetKeys.has(normalized)) {
    return normalized;
  }

  return "preset_2";
}

export function parsePreviewCustomAmount(value) {
  return Number.parseFloat(String(value ?? "").trim());
}

export function isPreviewCustomAmountValid(value) {
  const parsed = parsePreviewCustomAmount(value);
  return Number.isFinite(parsed) && parsed >= 0;
}

export function calculatePreviewTipAmount({
  selection,
  customAmount,
  presets = buildPreviewPresets(),
  subtotal = PREVIEW_SUBTOTAL,
}) {
  if (selection === "custom") {
    if (!isPreviewCustomAmountValid(customAmount)) {
      return 0;
    }

    return Math.round((parsePreviewCustomAmount(customAmount) + Number.EPSILON) * 100) / 100;
  }

  const selectedPreset =
    presets.find((preset) => preset.key === selection) ??
    presets.find((preset) => preset.key === "preset_2") ??
    presets[0];

  const percentage = selectedPreset?.value ?? DEFAULT_PRESETS[1];
  return Math.round(((subtotal * percentage) / 100 + Number.EPSILON) * 100) / 100;
}

export function getPreviewSupportMessage(config = {}) {
  const candidates = [
    config.support_text_1,
    config.support_text,
    config.support_text_2,
    config.support_text_3,
  ];

  return (
    candidates.find((message) => String(message ?? "").trim().length > 0) ??
    "Show your support for the team."
  );
}

export function formatPreviewCurrency(amount, currencyCode = "USD") {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currencyCode} ${Number(amount ?? 0).toFixed(2)}`;
  }
}
