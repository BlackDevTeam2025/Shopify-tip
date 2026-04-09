export const TIP_CONFIG_NAMESPACE = "tip_block_settings";
export const TIP_CONFIG_KEY = "config";
export const DEFAULT_TIP_PERCENTAGES = "10,15,20";
export const DEFAULT_DEFAULT_TIP_CHOICE = "preset_2";

const DEFAULTS = {
  enabled: false,
  plus_only: true,
  transform_active: false,
  custom_amount_enabled: true,
  hide_until_opt_in: false,
  default_tip_choice: DEFAULT_DEFAULT_TIP_CHOICE,
  tip_product_id: "",
  tip_variant_id: "",
  tip_infrastructure_status: "pending",
  tip_infrastructure_error: "",
  tip_metrics_enabled: true,
  tip_metrics_window_days: 60,
  heading: "Tip",
  support_text: "Show your support for the team.",
  support_text_1: "Show your support for the team.",
  support_text_2: "",
  support_text_3: "",
  thank_you_text: "THANK YOU, WE APPRECIATE IT.",
  cta_label: "Update tip",
  tip_percentages: DEFAULT_TIP_PERCENTAGES,
};

function normalizeBoolean(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

function normalizeText(value, fallback) {
  const normalized = value?.toString().trim();
  return normalized ? normalized : fallback;
}

function normalizePresetEntry(value, fallback) {
  const parsed = Number.parseFloat(String(value ?? "").trim());

  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 100) {
    return fallback;
  }

  return String(parsed);
}

function normalizeTipPercentages(value, fallback = DEFAULT_TIP_PERCENTAGES) {
  const fallbackParts = String(fallback)
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  const parsed = String(value ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  const normalized = [0, 1, 2].map((index) =>
    normalizePresetEntry(parsed[index], fallbackParts[index] ?? "10"),
  );

  return normalized.join(",");
}

function normalizePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(String(value ?? "").trim(), 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function normalizeDefaultTipChoice(
  value,
  fallback = DEFAULT_DEFAULT_TIP_CHOICE,
) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();

  if (["preset_1", "preset_2", "preset_3"].includes(normalized)) {
    return normalized;
  }

  return fallback;
}

function getSupportMessages(parsed = {}) {
  const primary = normalizeText(
    parsed.support_text_1 ?? parsed.support_text ?? parsed.caption1,
    DEFAULTS.support_text_1,
  );

  return {
    support_text_1: primary,
    support_text_2: normalizeText(
      parsed.support_text_2,
      DEFAULTS.support_text_2,
    ),
    support_text_3: normalizeText(
      parsed.support_text_3,
      DEFAULTS.support_text_3,
    ),
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
    const supportMessages = getSupportMessages(parsed);

    return {
      ...DEFAULTS,
      enabled: normalizeBoolean(parsed.enabled, DEFAULTS.enabled),
      plus_only: normalizeBoolean(parsed.plus_only, DEFAULTS.plus_only),
      transform_active: normalizeBoolean(
        parsed.transform_active,
        DEFAULTS.transform_active,
      ),
      custom_amount_enabled: normalizeBoolean(
        parsed.custom_amount_enabled,
        DEFAULTS.custom_amount_enabled,
      ),
      hide_until_opt_in: false,
      default_tip_choice: normalizeDefaultTipChoice(
        parsed.default_tip_choice,
        DEFAULTS.default_tip_choice,
      ),
      tip_product_id: normalizeText(
        parsed.tip_product_id,
        DEFAULTS.tip_product_id,
      ),
      tip_variant_id: normalizeText(
        parsed.tip_variant_id,
        DEFAULTS.tip_variant_id,
      ),
      tip_infrastructure_status: normalizeText(
        parsed.tip_infrastructure_status,
        DEFAULTS.tip_infrastructure_status,
      ),
      tip_infrastructure_error: normalizeText(
        parsed.tip_infrastructure_error,
        DEFAULTS.tip_infrastructure_error,
      ),
      tip_metrics_enabled: normalizeBoolean(
        parsed.tip_metrics_enabled,
        DEFAULTS.tip_metrics_enabled,
      ),
      tip_metrics_window_days: normalizePositiveInteger(
        parsed.tip_metrics_window_days,
        DEFAULTS.tip_metrics_window_days,
      ),
      heading: normalizeText(
        parsed.heading ?? parsed.widget_title,
        DEFAULTS.heading,
      ),
      support_text: supportMessages.support_text_1,
      support_text_1: supportMessages.support_text_1,
      support_text_2: supportMessages.support_text_2,
      support_text_3: supportMessages.support_text_3,
      thank_you_text: normalizeText(
        parsed.thank_you_text ?? parsed.caption3,
        DEFAULTS.thank_you_text,
      ),
      cta_label: normalizeText(parsed.cta_label, DEFAULTS.cta_label),
      tip_percentages: normalizeTipPercentages(
        parsed.tip_percentages,
        DEFAULTS.tip_percentages,
      ),
    };
  } catch {
    return null;
  }
}
