export const TIP_CONFIG_NAMESPACE = "tip_block_settings";
export const TIP_CONFIG_KEY = "config";
export const DEFAULT_PERCENTAGE_DISPLAY_OPTION = "percentage_and_amount";
export const DEFAULT_TIP_PERCENTAGES = "5,10,15,18,20";
export const VALID_PERCENTAGE_DISPLAY_OPTIONS = new Set([
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

function normalizeDisplayOption(
  value,
  fallback = DEFAULT_PERCENTAGE_DISPLAY_OPTION,
) {
  if (typeof value !== "string") return fallback;

  const normalized = value.trim();
  if (!VALID_PERCENTAGE_DISPLAY_OPTIONS.has(normalized)) {
    return fallback;
  }

  return normalized;
}

function normalizePlusOnly(value, fallback = true) {
  return normalizeBoolean(value, fallback);
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
    ...savedConfig,
    enabled,
    percentage_display_option: normalizeDisplayOption(
      savedConfig.percentage_display_option,
      defaults.percentage_display_option,
    ),
    plus_only: normalizePlusOnly(savedConfig.plus_only, defaults.plus_only),
    transform_active: normalizeBoolean(
      transformActive ?? savedConfig.transform_active,
      defaults.transform_active,
    ),
    tip_percentages: normalizeTipPercentages(
      savedConfig.tip_percentages,
      defaults.tip_percentages,
    ),
    custom_amount_enabled: normalizeBoolean(
      savedConfig.custom_amount_enabled,
      defaults.custom_amount_enabled,
    ),
    tip_variant_id: normalizeProductVariantId(
      savedConfig.tip_variant_id ?? defaults.tip_variant_id,
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
  return {
    widget_title: (formData.get("widget_title") || "Leave a Tip").toString(),
    tip_percentages: normalizeTipPercentages(
      formData.get("tip_percentages"),
      DEFAULT_TIP_PERCENTAGES,
    ),
    percentage_display_option: normalizeDisplayOption(
      formData.get("percentage_display_option"),
    ),
    plus_only: normalizePlusOnly(formData.get("plus_only"), true),
    transform_active: false,
    custom_amount_enabled: formData.get("custom_amount_enabled") === "on",
    tip_variant_id: normalizeProductVariantId(formData.get("tip_variant_id") || ""),
    caption1: (formData.get("caption1") || "Buy our team coffee").toString(),
    caption2: (formData.get("caption2") || "Leave a small tip").toString(),
    caption3: (formData.get("caption3") || "Every bit helps!").toString(),
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
  const { needsSync, config } = getTipConfigSyncPayload({
    storedValue: value,
    enabled,
  });

  if (!needsSync || !value) {
    return {
      synced: false,
      config,
      errors: [],
    };
  }

  const result = await saveTipConfig(admin, config);
  return {
    synced: result.errors.length === 0,
    config,
    errors: result.errors,
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

export async function syncTipConfigEnabled(admin, enabled, transformActive = false) {
  const currentConfig = await loadTipConfig(admin, { enabled, transformActive });
  return saveTipConfig(admin, currentConfig);
}
