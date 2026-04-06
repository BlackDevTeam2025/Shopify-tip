import test from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_CTA_LABEL,
  DEFAULT_CUSTOM_BORDER_COLOR,
  DEFAULT_CUSTOM_TEXT_COLOR,
  DEFAULT_HEADING,
  DEFAULT_SUPPORT_TEXT,
  DEFAULT_THANK_YOU_TEXT,
  FIXED_TIP_PERCENTAGES,
  FIXED_TIP_PERCENTAGES_LABEL,
  buildTipConfigFromFormData,
  buildTipRuntimeConfig,
  getDefaultTipConfig,
  getTipConfigSyncPayload,
  normalizeProductVariantId,
  parseTipConfigValue,
  ensureTipConfigRuntimeState,
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
    hide_until_opt_in: false,
    tip_variant_id: "gid://shopify/ProductVariant/44334137737309",
    heading: "Support our crew",
    support_text: "Thank you for supporting the staff.",
    thank_you_text: "THANK YOU.",
    cta_label: DEFAULT_CTA_LABEL,
    custom_text_color: DEFAULT_CUSTOM_TEXT_COLOR,
    custom_border_color: DEFAULT_CUSTOM_BORDER_COLOR,
  });
});

test("buildTipConfigFromFormData normalizes the new admin settings payload", () => {
  const formData = new FormData();
  formData.set("heading", "Add gratuity");
  formData.set("support_text", "Show your support.");
  formData.set("thank_you_text", "THANK YOU, TEAM.");
  formData.set("cta_label", "Add tip now");
  formData.set("custom_amount_enabled", "on");
  formData.set("hide_until_opt_in", "on");
  formData.set("tip_variant_id", "1");
  formData.set("custom_text_color", "1a1c1e");
  formData.set("custom_border_color", "#737785");

  assert.deepEqual(buildTipConfigFromFormData(formData), {
    plus_only: true,
    transform_active: false,
    custom_amount_enabled: true,
    hide_until_opt_in: true,
    tip_variant_id: "gid://shopify/ProductVariant/1",
    heading: "Add gratuity",
    support_text: "Show your support.",
    thank_you_text: "THANK YOU, TEAM.",
    cta_label: "Add tip now",
    custom_text_color: "#1A1C1E",
    custom_border_color: "#737785",
  });
});

test("buildTipRuntimeConfig normalizes new booleans and hex colors", () => {
  const runtimeConfig = buildTipRuntimeConfig({
    savedConfig: {
      custom_amount_enabled: "false",
      hide_until_opt_in: "true",
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
      hide_until_opt_in: false,
      tip_variant_id: "gid://shopify/ProductVariant/44334137737309",
      heading: "Legacy title",
      support_text: "a",
      thank_you_text: "c",
      cta_label: DEFAULT_CTA_LABEL,
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
    tip_variant_id: "",
    heading: "Support our team",
    support_text: "a",
    thank_you_text: "THANK YOU.",
    cta_label: "Add tip now",
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

test("getDefaultTipConfig uses the new fixed-preset friendly defaults", () => {
  assert.equal(FIXED_TIP_PERCENTAGES_LABEL, FIXED_TIP_PERCENTAGES.join(","));
  assert.deepEqual(getDefaultTipConfig(), {
    enabled: false,
    plus_only: true,
    transform_active: false,
    custom_amount_enabled: true,
    hide_until_opt_in: false,
    tip_variant_id: "",
    heading: DEFAULT_HEADING,
    support_text: DEFAULT_SUPPORT_TEXT,
    thank_you_text: DEFAULT_THANK_YOU_TEXT,
    cta_label: DEFAULT_CTA_LABEL,
    custom_text_color: DEFAULT_CUSTOM_TEXT_COLOR,
    custom_border_color: DEFAULT_CUSTOM_BORDER_COLOR,
  });
});

test("ensureTipConfigRuntimeState persists a default config when the metafield is missing", async () => {
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
  assert.equal(calls.length, 3);
  assert.match(calls[2].options.variables.input[0].value, /"enabled":true/);
});
