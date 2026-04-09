import { ensureTipMerchandise } from "./tip-merchandise.server.js";

export const TIP_CONFIG_NAMESPACE = "tip_block_settings";
export const TIP_CONFIG_KEY = "config";
export const DEFAULT_TIP_PERCENTAGES = "10,15,20";
export const DEFAULT_HEADING = "Add tip";
export const DEFAULT_SUPPORT_TEXT = "Show your support for the team.";
export const DEFAULT_THANK_YOU_TEXT = "THANK YOU, WE APPRECIATE IT.";
export const DEFAULT_CTA_LABEL = "Update tip";
export const DEFAULT_CUSTOM_TEXT_COLOR = "#1A1C1E";
export const DEFAULT_CUSTOM_BORDER_COLOR = "#737785";
export const DEFAULT_TIP_INFRASTRUCTURE_STATUS = "pending";
export const DEFAULT_APPLY_CHECKOUT_BRANDING = false;
export const DEFAULT_CHECKOUT_BRANDING_STATUS = "disabled";
export const DEFAULT_TIP_METRICS_ENABLED = true;
export const DEFAULT_TIP_METRICS_WINDOW_DAYS = 60;
export const DEFAULT_DEFAULT_TIP_CHOICE = "preset_2";

function normalizeBoolean(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

function normalizePlusOnly(value, fallback = true) {
  return normalizeBoolean(value, fallback);
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

function normalizePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(String(value ?? "").trim(), 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function normalizeDefaultTipChoice(value, fallback = DEFAULT_DEFAULT_TIP_CHOICE) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();

  if (["preset_1", "preset_2", "preset_3"].includes(normalized)) {
    return normalized;
  }

  return fallback;
}

function normalizePresetEntry(value, fallback) {
  const parsed = Number.parseFloat(String(value ?? "").trim());

  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 100) {
    return fallback;
  }

  return parsed % 1 === 0 ? String(parsed) : String(parsed);
}

function normalizeTipPercentages(
  savedValue,
  fallback = DEFAULT_TIP_PERCENTAGES,
) {
  const fallbackParts = String(fallback)
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  const parsed = String(savedValue ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  const normalized = [0, 1, 2].map((index) =>
    normalizePresetEntry(parsed[index], fallbackParts[index] ?? "10"),
  );

  return normalized.join(",");
}

function getLegacySupportText(
  savedConfig = {},
  fallback = DEFAULT_SUPPORT_TEXT,
) {
  return normalizeText(
    savedConfig.support_text ?? savedConfig.caption1,
    fallback,
  );
}

function getLegacyThankYouText(
  savedConfig = {},
  fallback = DEFAULT_THANK_YOU_TEXT,
) {
  return normalizeText(
    savedConfig.thank_you_text ?? savedConfig.caption3,
    fallback,
  );
}

export function normalizeProductVariantId(value) {
  const raw = value?.toString().trim();

  if (!raw) {
    return "";
  }

  if (raw.startsWith("gid://shopify/ProductVariant/")) {
    return raw;
  }

  const adminUrlMatch = raw.match(/\/variants\/(\d+)/);
  if (adminUrlMatch?.[1]) {
    return `gid://shopify/ProductVariant/${adminUrlMatch[1]}`;
  }

  const numericMatch = raw.match(/^\d+$/);
  if (numericMatch) {
    return `gid://shopify/ProductVariant/${raw}`;
  }

  return raw;
}

export function getDefaultTipConfig() {
  return {
    enabled: false,
    plus_only: true,
    transform_active: false,
    custom_amount_enabled: true,
    hide_until_opt_in: false,
    default_tip_choice: DEFAULT_DEFAULT_TIP_CHOICE,
    tip_product_id: "",
    tip_variant_id: "",
    tip_infrastructure_status: DEFAULT_TIP_INFRASTRUCTURE_STATUS,
    tip_infrastructure_error: "",
    apply_checkout_branding: DEFAULT_APPLY_CHECKOUT_BRANDING,
    checkout_branding_status: DEFAULT_CHECKOUT_BRANDING_STATUS,
    checkout_branding_error: "",
    tip_metrics_enabled: DEFAULT_TIP_METRICS_ENABLED,
    tip_metrics_window_days: DEFAULT_TIP_METRICS_WINDOW_DAYS,
    heading: DEFAULT_HEADING,
    support_text: DEFAULT_SUPPORT_TEXT,
    thank_you_text: DEFAULT_THANK_YOU_TEXT,
    cta_label: DEFAULT_CTA_LABEL,
    tip_percentages: DEFAULT_TIP_PERCENTAGES,
    custom_text_color: DEFAULT_CUSTOM_TEXT_COLOR,
    custom_border_color: DEFAULT_CUSTOM_BORDER_COLOR,
  };
}

export function parseTipConfigValue(value) {
  if (!value) {
    return getDefaultTipConfig();
  }

  try {
    const parsed = JSON.parse(value);
    return buildTipRuntimeConfig({
      savedConfig: parsed,
      enabled: parsed.enabled === true,
    });
  } catch {
    return getDefaultTipConfig();
  }
}

export function buildTipRuntimeConfig({
  savedConfig = {},
  enabled = false,
  transformActive,
}) {
  const defaults = getDefaultTipConfig();

  return {
    ...defaults,
    enabled,
    plus_only: normalizePlusOnly(savedConfig.plus_only, defaults.plus_only),
    transform_active: normalizeBoolean(
      transformActive ?? savedConfig.transform_active,
      defaults.transform_active,
    ),
    custom_amount_enabled: normalizeBoolean(
      savedConfig.custom_amount_enabled,
      defaults.custom_amount_enabled,
    ),
    hide_until_opt_in: false,
    default_tip_choice: normalizeDefaultTipChoice(
      savedConfig.default_tip_choice,
      defaults.default_tip_choice,
    ),
    tip_product_id: normalizeText(
      savedConfig.tip_product_id,
      defaults.tip_product_id,
    ),
    tip_variant_id: normalizeProductVariantId(
      savedConfig.tip_variant_id ?? defaults.tip_variant_id,
    ),
    tip_infrastructure_status: normalizeText(
      savedConfig.tip_infrastructure_status,
      defaults.tip_infrastructure_status,
    ),
    tip_infrastructure_error: normalizeText(
      savedConfig.tip_infrastructure_error,
      defaults.tip_infrastructure_error,
    ),
    apply_checkout_branding: normalizeBoolean(
      savedConfig.apply_checkout_branding,
      defaults.apply_checkout_branding,
    ),
    checkout_branding_status: normalizeText(
      savedConfig.checkout_branding_status,
      defaults.checkout_branding_status,
    ),
    checkout_branding_error: normalizeText(
      savedConfig.checkout_branding_error,
      defaults.checkout_branding_error,
    ),
    tip_metrics_enabled: normalizeBoolean(
      savedConfig.tip_metrics_enabled,
      defaults.tip_metrics_enabled,
    ),
    tip_metrics_window_days: normalizePositiveInteger(
      savedConfig.tip_metrics_window_days,
      defaults.tip_metrics_window_days,
    ),
    heading: normalizeText(
      savedConfig.heading ?? savedConfig.widget_title,
      defaults.heading,
    ),
    support_text: getLegacySupportText(savedConfig, defaults.support_text),
    thank_you_text: getLegacyThankYouText(savedConfig, defaults.thank_you_text),
    cta_label: normalizeText(savedConfig.cta_label, defaults.cta_label),
    tip_percentages: normalizeTipPercentages(
      savedConfig.tip_percentages,
      defaults.tip_percentages,
    ),
    custom_text_color: normalizeHexColor(
      savedConfig.custom_text_color,
      defaults.custom_text_color,
    ),
    custom_border_color: normalizeHexColor(
      savedConfig.custom_border_color,
      defaults.custom_border_color,
    ),
  };
}

export function getTipConfigSyncPayload({ storedValue, enabled = false }) {
  if (!storedValue) {
    return {
      needsSync: false,
      config: buildTipRuntimeConfig({ enabled }),
    };
  }

  let parsedConfig;
  try {
    parsedConfig = JSON.parse(storedValue);
  } catch {
    parsedConfig = {};
  }

  const config = buildTipRuntimeConfig({
    savedConfig: parsedConfig,
    enabled,
  });

  return {
    needsSync: JSON.stringify(config) !== JSON.stringify(parsedConfig),
    config,
  };
}

export function buildTipConfigFromFormData(formData) {
  const presetValues = [
    formData.get("preset_1"),
    formData.get("preset_2"),
    formData.get("preset_3"),
  ];

  return {
    plus_only: true,
    transform_active: false,
    custom_amount_enabled: formData.get("custom_amount_enabled") !== "off",
    hide_until_opt_in: false,
    default_tip_choice: normalizeDefaultTipChoice(
      formData.get("default_tip_choice"),
      DEFAULT_DEFAULT_TIP_CHOICE,
    ),
    apply_checkout_branding:
      formData.get("apply_checkout_branding") === "on",
    checkout_branding_status: DEFAULT_CHECKOUT_BRANDING_STATUS,
    checkout_branding_error: "",
    tip_metrics_enabled: true,
    tip_metrics_window_days: DEFAULT_TIP_METRICS_WINDOW_DAYS,
    heading: normalizeText(formData.get("heading"), DEFAULT_HEADING),
    support_text: normalizeText(
      formData.get("support_text"),
      DEFAULT_SUPPORT_TEXT,
    ),
    thank_you_text: normalizeText(
      formData.get("thank_you_text"),
      DEFAULT_THANK_YOU_TEXT,
    ),
    cta_label: normalizeText(formData.get("cta_label"), DEFAULT_CTA_LABEL),
    tip_percentages: normalizeTipPercentages(presetValues.join(",")),
    custom_text_color: normalizeHexColor(
      formData.get("custom_text_color"),
      DEFAULT_CUSTOM_TEXT_COLOR,
    ),
    custom_border_color: normalizeHexColor(
      formData.get("custom_border_color"),
      DEFAULT_CUSTOM_BORDER_COLOR,
    ),
  };
}

async function fetchShopTipConfig(admin) {
  const response = await admin.graphql(
    `#graphql
    query GetTipBlockConfig {
      shop {
        id
        metafield(namespace: "${TIP_CONFIG_NAMESPACE}", key: "${TIP_CONFIG_KEY}") {
          value
        }
      }
    }`,
  );
  const json = await response.json();

  return {
    shopId: json.data?.shop?.id ?? null,
    value: json.data?.shop?.metafield?.value,
  };
}

export async function ensureTipConfigRuntimeState(admin, enabled) {
  const { value } = await fetchShopTipConfig(admin);
  const { needsSync, config: syncedConfig } = getTipConfigSyncPayload({
    storedValue: value,
    enabled,
  });
  const infrastructureResult = await ensureTipMerchandise(admin, syncedConfig);
  const config = buildTipRuntimeConfig({
    savedConfig: {
      ...syncedConfig,
      tip_product_id: infrastructureResult.productId,
      tip_variant_id: infrastructureResult.variantId,
      tip_infrastructure_status: infrastructureResult.status,
      tip_infrastructure_error: infrastructureResult.errorMessage,
    },
    enabled,
    transformActive: syncedConfig.transform_active,
  });
  const infrastructureChanged =
    JSON.stringify(config) !== JSON.stringify(syncedConfig);

  if (!needsSync && !infrastructureChanged && value) {
    return {
      synced: false,
      config,
      errors: infrastructureResult.errors,
    };
  }

  const result = await saveTipConfig(admin, config);
  return {
    synced: result.errors.length === 0,
    config,
    errors: [...infrastructureResult.errors, ...result.errors],
  };
}

export async function loadTipConfig(
  admin,
  { enabled = false, transformActive } = {},
) {
  const { value } = await fetchShopTipConfig(admin);
  return buildTipRuntimeConfig({
    savedConfig: parseTipConfigValue(value),
    enabled,
    transformActive,
  });
}

export async function saveTipConfig(admin, config) {
  const { shopId } = await fetchShopTipConfig(admin);

  if (!shopId) {
    return {
      config,
      result: [],
      errors: [{ message: "Could not get shop ID" }],
    };
  }

  const response = await admin.graphql(
    `#graphql
    mutation SaveTipSettings($input: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $input) {
        metafields {
          id
          key
          value
        }
        userErrors {
          field
          message
        }
      }
    }`,
    {
      variables: {
        input: [
          {
            namespace: TIP_CONFIG_NAMESPACE,
            key: TIP_CONFIG_KEY,
            type: "json",
            value: JSON.stringify(config),
            ownerId: shopId,
          },
        ],
      },
    },
  );

  const json = await response.json();
  return {
    config,
    result: json.data?.metafieldsSet?.metafields ?? [],
    errors: json.data?.metafieldsSet?.userErrors ?? [],
  };
}

export async function syncTipConfigEnabled(
  admin,
  enabled,
  transformActive = false,
) {
  const currentConfig = await loadTipConfig(admin, {
    enabled,
    transformActive,
  });
  return saveTipConfig(admin, currentConfig);
}
