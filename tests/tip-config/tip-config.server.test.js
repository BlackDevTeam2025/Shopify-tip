import test from "node:test";
import assert from "node:assert/strict";

import {
  buildTipConfigFromFormData,
  buildTipRuntimeConfig,
  getDefaultTipConfig,
  getTipConfigSyncPayload,
  normalizeProductVariantId,
  parseTipConfigValue,
} from "../../app/tip-config.server.js";

test("parseTipConfigValue falls back to defaults for empty input", () => {
  assert.deepEqual(parseTipConfigValue(undefined), getDefaultTipConfig());
});

test("buildTipRuntimeConfig merges saved values and enabled flag", () => {
  const runtimeConfig = buildTipRuntimeConfig({
    savedConfig: {
      widget_title: "Support our crew",
      caption1: "Thank you",
      tip_percentages: "5,10,15,18,20",
      percentage_display_option: "percentage_and_amount",
    },
    enabled: true,
  });

  assert.deepEqual(runtimeConfig, {
    enabled: true,
    widget_title: "Support our crew",
    tip_percentages: "5,10,15,18,20",
    percentage_display_option: "percentage_and_amount",
    plus_only: true,
    transform_active: false,
    custom_amount_enabled: true,
    tip_variant_id: "",
    caption1: "Thank you",
    caption2: "Leave a small tip",
    caption3: "Every bit helps!",
  });
});

test("buildTipRuntimeConfig normalizes legacy string booleans", () => {
  const runtimeConfig = buildTipRuntimeConfig({
    savedConfig: {
      custom_amount_enabled: "false",
    },
    enabled: true,
  });

  assert.equal(runtimeConfig.custom_amount_enabled, false);
});

test("buildTipConfigFromFormData normalizes settings payload", () => {
  const formData = new FormData();
  formData.set("widget_title", "Support our team");
  formData.set("tip_percentages", "5,10");
  formData.set("percentage_display_option", "amount_first");
  formData.set("custom_amount_enabled", "on");
  formData.set("tip_variant_id", "1");
  formData.set("caption1", "A");
  formData.set("caption2", "B");
  formData.set("caption3", "C");

  assert.deepEqual(buildTipConfigFromFormData(formData), {
    widget_title: "Support our team",
    tip_percentages: "5,10",
    percentage_display_option: "amount_first",
    plus_only: true,
    transform_active: false,
    custom_amount_enabled: true,
    tip_variant_id: "gid://shopify/ProductVariant/1",
    caption1: "A",
    caption2: "B",
    caption3: "C",
  });
});

test("buildTipRuntimeConfig replaces legacy fixed-amount presets with safe percentage defaults", () => {
  const runtimeConfig = buildTipRuntimeConfig({
    savedConfig: {
      tip_percentages: "10000,20000,50000",
    },
    enabled: true,
  });

  assert.equal(runtimeConfig.tip_percentages, "5,10,15,18,20");
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

test("buildTipRuntimeConfig normalizes legacy numeric tip variant IDs", () => {
  const runtimeConfig = buildTipRuntimeConfig({
    savedConfig: {
      tip_variant_id: "44334137737309",
    },
    enabled: true,
  });

  assert.equal(
    runtimeConfig.tip_variant_id,
    "gid://shopify/ProductVariant/44334137737309",
  );
});

test("getTipConfigSyncPayload migrates legacy stored config that is missing enabled", () => {
  const payload = getTipConfigSyncPayload({
    storedValue:
      '{"widget_title":"Legacy title","tip_percentages":"10","custom_amount_enabled":"false","tip_variant_id":"44334137737309","caption1":"a","caption2":"b","caption3":"c"}',
    enabled: true,
  });

  assert.deepEqual(payload, {
    needsSync: true,
    config: {
      enabled: true,
      widget_title: "Legacy title",
      tip_percentages: "10",
      percentage_display_option: "percentage_and_amount",
      plus_only: true,
      transform_active: false,
      custom_amount_enabled: false,
      tip_variant_id: "gid://shopify/ProductVariant/44334137737309",
      caption1: "a",
      caption2: "b",
      caption3: "c",
    },
  });
});

test("getTipConfigSyncPayload skips sync when stored config already matches runtime shape", () => {
  const payload = getTipConfigSyncPayload({
    storedValue:
      '{"enabled":true,"widget_title":"Support our team","tip_percentages":"5,10","percentage_display_option":"amount_first","plus_only":true,"transform_active":false,"custom_amount_enabled":true,"tip_variant_id":"","caption1":"a","caption2":"b","caption3":"c"}',
    enabled: true,
  });

  assert.deepEqual(payload, {
    needsSync: false,
    config: {
      enabled: true,
      widget_title: "Support our team",
      tip_percentages: "5,10",
      percentage_display_option: "amount_first",
      plus_only: true,
      transform_active: false,
      custom_amount_enabled: true,
      tip_variant_id: "",
      caption1: "a",
      caption2: "b",
      caption3: "c",
    },
  });
});

test("getDefaultTipConfig uses percentage-first Plus defaults", () => {
  assert.deepEqual(getDefaultTipConfig(), {
    enabled: false,
    widget_title: "Leave a Tip",
    tip_percentages: "5,10,15,18,20",
    percentage_display_option: "percentage_and_amount",
    plus_only: true,
    transform_active: false,
    custom_amount_enabled: true,
    tip_variant_id: "",
    caption1: "Buy our team coffee",
    caption2: "Leave a small tip",
    caption3: "Every bit helps!",
  });
});
