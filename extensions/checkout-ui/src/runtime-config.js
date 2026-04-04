export const TIP_CONFIG_NAMESPACE = "tip_block_settings";
export const TIP_CONFIG_KEY = "config";
const DEFAULT_TIP_PERCENTAGES = "5,10,15,18,20";
const DEFAULT_PERCENTAGE_DISPLAY_OPTION = "percentage_and_amount";
const VALID_DISPLAY_OPTIONS = new Set([
  "percentage_and_amount",
  "percentage_only",
  "amount_first",
]);

function normalizeBoolean(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

function normalizeDisplayOption(value) {
  return VALID_DISPLAY_OPTIONS.has(value)
    ? value
    : DEFAULT_PERCENTAGE_DISPLAY_OPTION;
}

function normalizeTipPercentages(value, fallback = DEFAULT_TIP_PERCENTAGES) {
  const parsed = String(value ?? "")
    .split(",")
    .map((entry) => Number.parseFloat(entry.trim()))
    .filter((entry) => Number.isFinite(entry) && entry > 0 && entry <= 100);

  if (parsed.length === 0) {
    return fallback;
  }

  return parsed.join(",");
}

function buildRuntimeDefaults() {
  return {
    enabled: false,
    widget_title: "Leave a Tip",
    tip_percentages: DEFAULT_TIP_PERCENTAGES,
    percentage_display_option: DEFAULT_PERCENTAGE_DISPLAY_OPTION,
    plus_only: true,
    transform_active: false,
    custom_amount_enabled: true,
    tip_variant_id: "",
    caption1: "Buy our team coffee",
    caption2: "Leave a small tip",
    caption3: "Every bit helps!",
  };
}

export function getTipRuntimeConfigFromAppMetafields(appMetafields = []) {
  const match = appMetafields.find(
    (entry) =>
      entry?.target?.type === "shop" &&
      entry?.metafield?.namespace === TIP_CONFIG_NAMESPACE &&
      entry?.metafield?.key === TIP_CONFIG_KEY,
  );

  if (!match?.metafield?.value) {
    return null;
  }

  try {
    const parsed = JSON.parse(match.metafield.value);
    const defaults = buildRuntimeDefaults();

    return {
      ...defaults,
      ...parsed,
      enabled: normalizeBoolean(parsed.enabled, defaults.enabled),
      custom_amount_enabled: normalizeBoolean(
        parsed.custom_amount_enabled,
        defaults.custom_amount_enabled,
      ),
      plus_only: normalizeBoolean(parsed.plus_only, defaults.plus_only),
      transform_active: normalizeBoolean(
        parsed.transform_active,
        defaults.transform_active,
      ),
      tip_percentages: normalizeTipPercentages(
        parsed.tip_percentages,
        defaults.tip_percentages,
      ),
      percentage_display_option: normalizeDisplayOption(
        parsed.percentage_display_option,
      ),
    };
  } catch {
    return null;
  }
}
