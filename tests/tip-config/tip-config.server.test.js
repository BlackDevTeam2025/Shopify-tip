import test from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_CTA_LABEL,
  DEFAULT_CUSTOM_BORDER_COLOR,
  DEFAULT_CUSTOM_TEXT_COLOR,
  DEFAULT_HEADING,
  DEFAULT_SUPPORT_TEXT,
  DEFAULT_THANK_YOU_TEXT,
  DEFAULT_TIP_INFRASTRUCTURE_STATUS,
  DEFAULT_TIP_PERCENTAGES,
  buildTipConfigFromFormData,
  buildTipRuntimeConfig,
  ensureTipConfigRuntimeState,
  getDefaultTipConfig,
  getTipConfigSyncPayload,
  normalizeProductVariantId,
  parseTipConfigValue,
} from "../../app/tip-config.server.js";

test("parseTipConfigValue falls back to defaults for empty input", () => {
  assert.deepEqual(parseTipConfigValue(undefined), getDefaultTipConfig());
});

test("buildTipRuntimeConfig migrates legacy fields into the new runtime shape", () => {
  const runtimeConfig = buildTipRuntimeConfig({
    savedConfig: {
      widget_title: "Support our crew",
      caption1: "Thank you for supporting the staff.",
      caption3: "THANK YOU.",
      tip_percentages: "5,10,15,18,20",
      percentage_display_option: "amount_first",
      custom_amount_enabled: "false",
      tip_variant_id: "44334137737309",
    },
    enabled: true,
  });

  assert.deepEqual(runtimeConfig, {
    enabled: true,
    plus_only: true,
    transform_active: false,
    custom_amount_enabled: false,
    hide_until_opt_in: true,
    tip_product_id: "",
    tip_variant_id: "gid://shopify/ProductVariant/44334137737309",
    tip_infrastructure_status: DEFAULT_TIP_INFRASTRUCTURE_STATUS,
    tip_infrastructure_error: "",
    heading: "Support our crew",
    support_text: "Thank you for supporting the staff.",
    thank_you_text: "THANK YOU.",
    cta_label: DEFAULT_CTA_LABEL,
    tip_percentages: "5,10,15",
    custom_text_color: DEFAULT_CUSTOM_TEXT_COLOR,
    custom_border_color: DEFAULT_CUSTOM_BORDER_COLOR,
  });
});

test("buildTipConfigFromFormData normalizes the compact admin settings payload", () => {
  const formData = new FormData();
  formData.set("heading", "Add gratuity");
  formData.set("support_text", "Show your support.");
  formData.set("thank_you_text", "THANK YOU, TEAM.");
  formData.set("cta_label", "Add tip now");
  formData.set("preset_1", "12");
  formData.set("preset_2", "16");
  formData.set("preset_3", "21");
  formData.set("custom_amount_enabled", "on");
  formData.set("custom_text_color", "1a1c1e");
  formData.set("custom_border_color", "#737785");

  assert.deepEqual(buildTipConfigFromFormData(formData), {
    plus_only: true,
    transform_active: false,
    custom_amount_enabled: true,
    hide_until_opt_in: true,
    heading: "Add gratuity",
    support_text: "Show your support.",
    thank_you_text: "THANK YOU, TEAM.",
    cta_label: "Add tip now",
    tip_percentages: "12,16,21",
    custom_text_color: "#1A1C1E",
    custom_border_color: "#737785",
  });
});

test("buildTipRuntimeConfig keeps only three valid editable presets", () => {
  const runtimeConfig = buildTipRuntimeConfig({
    savedConfig: {
      tip_percentages: "12, 16, 21, 30, 45",
    },
    enabled: true,
  });

  assert.equal(runtimeConfig.tip_percentages, "12,16,21");
});

test("buildTipRuntimeConfig falls back to defaults for invalid preset values", () => {
  const runtimeConfig = buildTipRuntimeConfig({
    savedConfig: {
      tip_percentages: "0,nope,999",
    },
    enabled: true,
  });

  assert.equal(runtimeConfig.tip_percentages, DEFAULT_TIP_PERCENTAGES);
});

test("buildTipRuntimeConfig forces opt-in behavior and normalizes hex colors", () => {
  const runtimeConfig = buildTipRuntimeConfig({
    savedConfig: {
      custom_amount_enabled: "false",
      hide_until_opt_in: "false",
      custom_text_color: "abc",
      custom_border_color: "xyz",
    },
    enabled: true,
  });

  assert.equal(runtimeConfig.custom_amount_enabled, false);
  assert.equal(runtimeConfig.hide_until_opt_in, true);
  assert.equal(runtimeConfig.custom_text_color, "#AABBCC");
  assert.equal(runtimeConfig.custom_border_color, DEFAULT_CUSTOM_BORDER_COLOR);
});

test("normalizeProductVariantId accepts raw numeric IDs", () => {
  assert.equal(
    normalizeProductVariantId("44334137737309"),
    "gid://shopify/ProductVariant/44334137737309",
  );
});

test("normalizeProductVariantId accepts admin variant URLs", () => {
  assert.equal(
    normalizeProductVariantId(
      "https://admin.shopify.com/store/quickstart-3cc5dc2a/products/8103775797341/variants/44334137737309",
    ),
    "gid://shopify/ProductVariant/44334137737309",
  );
});

test("getTipConfigSyncPayload marks legacy stored config for migration", () => {
  const payload = getTipConfigSyncPayload({
    storedValue:
      '{"widget_title":"Legacy title","tip_percentages":"10","custom_amount_enabled":"false","tip_variant_id":"44334137737309","caption1":"a","caption2":"b","caption3":"c"}',
    enabled: true,
  });

  assert.deepEqual(payload, {
    needsSync: true,
    config: {
      enabled: true,
      plus_only: true,
      transform_active: false,
      custom_amount_enabled: false,
      hide_until_opt_in: true,
      tip_product_id: "",
      tip_variant_id: "gid://shopify/ProductVariant/44334137737309",
      tip_infrastructure_status: DEFAULT_TIP_INFRASTRUCTURE_STATUS,
      tip_infrastructure_error: "",
      heading: "Legacy title",
      support_text: "a",
      thank_you_text: "c",
      cta_label: DEFAULT_CTA_LABEL,
      tip_percentages: "10,15,20",
      custom_text_color: DEFAULT_CUSTOM_TEXT_COLOR,
      custom_border_color: DEFAULT_CUSTOM_BORDER_COLOR,
    },
  });
});

test("getTipConfigSyncPayload skips sync when stored config already matches the new runtime shape", () => {
  const storedConfig = {
    enabled: true,
    plus_only: true,
    transform_active: false,
    custom_amount_enabled: true,
    hide_until_opt_in: true,
    tip_product_id: "",
    tip_variant_id: "",
    tip_infrastructure_status: DEFAULT_TIP_INFRASTRUCTURE_STATUS,
    tip_infrastructure_error: "",
    heading: "Support our team",
    support_text: "a",
    thank_you_text: "THANK YOU.",
    cta_label: "Add tip now",
    tip_percentages: "12,16,21",
    custom_text_color: "#111111",
    custom_border_color: "#222222",
  };

  const payload = getTipConfigSyncPayload({
    storedValue: JSON.stringify(storedConfig),
    enabled: true,
  });

  assert.deepEqual(payload, {
    needsSync: false,
    config: storedConfig,
  });
});

test("getDefaultTipConfig uses editable three-preset defaults", () => {
  assert.deepEqual(getDefaultTipConfig(), {
    enabled: false,
    plus_only: true,
    transform_active: false,
    custom_amount_enabled: true,
    hide_until_opt_in: true,
    tip_product_id: "",
    tip_variant_id: "",
    tip_infrastructure_status: DEFAULT_TIP_INFRASTRUCTURE_STATUS,
    tip_infrastructure_error: "",
    heading: DEFAULT_HEADING,
    support_text: DEFAULT_SUPPORT_TEXT,
    thank_you_text: DEFAULT_THANK_YOU_TEXT,
    cta_label: DEFAULT_CTA_LABEL,
    tip_percentages: DEFAULT_TIP_PERCENTAGES,
    custom_text_color: DEFAULT_CUSTOM_TEXT_COLOR,
    custom_border_color: DEFAULT_CUSTOM_BORDER_COLOR,
  });
});

test("ensureTipConfigRuntimeState persists config plus auto-created tip merchandise when the metafield is missing", async () => {
  const calls = [];
  const admin = {
    graphql: async (_query, options) => {
      calls.push({ query: _query, options });

      if (calls.length === 1) {
        return {
          json: async () => ({
            data: {
              shop: {
                id: "gid://shopify/Shop/1",
                metafield: null,
              },
            },
          }),
        };
      }

      if (calls.length === 2) {
        return {
          json: async () => ({
            data: {
              products: {
                edges: [],
              },
            },
          }),
        };
      }

      if (calls.length === 3) {
        return {
          json: async () => ({
            data: {
              productCreate: {
                product: {
                  id: "gid://shopify/Product/1",
                  variants: {
                    edges: [
                      {
                        node: {
                          id: "gid://shopify/ProductVariant/1",
                        },
                      },
                    ],
                  },
                },
                userErrors: [],
              },
            },
          }),
        };
      }

      if (calls.length === 4) {
        return {
          json: async () => ({
            data: {
              publications: {
                edges: [
                  {
                    node: {
                      id: "gid://shopify/Publication/1",
                      name: "Online Store",
                    },
                  },
                ],
              },
            },
          }),
        };
      }

      if (calls.length === 5) {
        return {
          json: async () => ({
            data: {
              publishablePublish: {
                publishable: {
                  id: "gid://shopify/Product/1",
                },
                userErrors: [],
              },
            },
          }),
        };
      }

      if (calls.length === 6) {
        return {
          json: async () => ({
            data: {
              shop: {
                id: "gid://shopify/Shop/1",
                metafield: null,
              },
            },
          }),
        };
      }

      return {
        json: async () => ({
          data: {
            metafieldsSet: {
              metafields: [{ id: "gid://shopify/Metafield/1" }],
              userErrors: [],
            },
          },
        }),
      };
    },
  };

  const result = await ensureTipConfigRuntimeState(admin, true);

  assert.equal(result.synced, true);
  assert.equal(calls.length, 7);
  assert.match(
    calls[6].options.variables.input[0].value,
    /"enabled":true/,
  );
  assert.match(
    calls[6].options.variables.input[0].value,
    /"tip_product_id":"gid:\/\/shopify\/Product\/1"/,
  );
  assert.match(
    calls[6].options.variables.input[0].value,
    /"tip_variant_id":"gid:\/\/shopify\/ProductVariant\/1"/,
  );
});
