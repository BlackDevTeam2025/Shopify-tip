export const TIP_CONFIG_NAMESPACE = "tip_block_settings";
export const TIP_CONFIG_KEY = "config";
export const DEFAULT_TIP_PERCENTAGES = "10,15,20";

const DEFAULTS = {
  enabled: false,
  plus_only: true,
  transform_active: false,
  custom_amount_enabled: true,
  hide_until_opt_in: false,
  tip_product_id: "",
  tip_variant_id: "",
  tip_infrastructure_status: "pending",
  tip_infrastructure_error: "",
  heading: "Add tip",
  support_text: "Show your support for the team.",
  thank_you_text: "THANK YOU, WE APPRECIATE IT.",
  cta_label: "Add tip",
  tip_percentages: DEFAULT_TIP_PERCENTAGES,
  custom_text_color: "#1A1C1E",
  custom_border_color: "#737785",
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

function normalizeHexColor(value, fallback) {
  const normalized = String(value ?? "")
    .trim()
    .replace(/^#/, "");

  if (/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return `#${normalized.toUpperCase()}`;
  }

  if (/^[0-9a-fA-F]{3}$/.test(normalized)) {
    const expanded = normalized
      .split("")
      .map((character) => `${character}${character}`)
      .join("");
    return `#${expanded.toUpperCase()}`;
  }

  return fallback;
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
      hide_until_opt_in: normalizeBoolean(
        parsed.hide_until_opt_in,
        DEFAULTS.hide_until_opt_in,
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
      heading: normalizeText(
        parsed.heading ?? parsed.widget_title,
        DEFAULTS.heading,
      ),
      support_text: normalizeText(
        parsed.support_text ?? parsed.caption1,
        DEFAULTS.support_text,
      ),
      thank_you_text: normalizeText(
        parsed.thank_you_text ?? parsed.caption3,
        DEFAULTS.thank_you_text,
      ),
      cta_label: normalizeText(parsed.cta_label, DEFAULTS.cta_label),
      tip_percentages: normalizeTipPercentages(
        parsed.tip_percentages,
        DEFAULTS.tip_percentages,
      ),
      custom_text_color: normalizeHexColor(
        parsed.custom_text_color,
        DEFAULTS.custom_text_color,
      ),
      custom_border_color: normalizeHexColor(
        parsed.custom_border_color,
        DEFAULTS.custom_border_color,
      ),
    };
  } catch {
    return null;
  }
}
