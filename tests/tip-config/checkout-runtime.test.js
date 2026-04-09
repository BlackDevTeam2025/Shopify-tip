import test from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_TIP_PERCENTAGES,
  getTipRuntimeConfigFromAppMetafields,
} from "../../extensions/checkout-ui/src/runtime-config.js";

test("returns null when no matching app metafield exists", () => {
  assert.equal(getTipRuntimeConfigFromAppMetafields([]), null);
});

test("returns parsed runtime config from shop app metafields using the new semantic fields", () => {
  const config = getTipRuntimeConfigFromAppMetafields([
    {
      target: { type: "shop", id: "gid://shopify/Shop/1" },
      metafield: {
        namespace: "tip_block_settings",
        key: "config",
        value:
          '{"enabled":true,"plus_only":true,"transform_active":true,"custom_amount_enabled":true,"hide_until_opt_in":false,"tip_variant_id":"","heading":"Support our team","support_text_1":"a","support_text_2":"b","support_text_3":"c","thank_you_text":"THANK YOU.","cta_label":"Add tip now","tip_percentages":"12,16,21"}',
      },
    },
  ]);

  assert.deepEqual(config, {
    enabled: true,
    plus_only: true,
    transform_active: true,
    custom_amount_enabled: true,
    hide_until_opt_in: false,
    default_tip_choice: "preset_2",
    tip_product_id: "",
    tip_variant_id: "",
    tip_infrastructure_status: "pending",
    tip_infrastructure_error: "",
    tip_metrics_enabled: true,
    tip_metrics_window_days: 60,
    heading: "Support our team",
    support_text: "a",
    support_text_1: "a",
    support_text_2: "b",
    support_text_3: "c",
    thank_you_text: "THANK YOU.",
    cta_label: "Add tip now",
    tip_percentages: "12,16,21",
  });
});

test("runtime config migrates legacy fields into the new widget shape", () => {
  const config = getTipRuntimeConfigFromAppMetafields([
    {
      target: { type: "shop", id: "gid://shopify/Shop/1" },
      metafield: {
        namespace: "tip_block_settings",
        key: "config",
        value:
          '{"enabled":true,"widget_title":"Support our team","tip_percentages":"5,10,15,18,20","percentage_display_option":"amount_first","plus_only":true,"transform_active":false,"custom_amount_enabled":true,"tip_variant_id":"","caption1":"a","caption2":"b","caption3":"c"}',
      },
    },
  ]);

  assert.deepEqual(config, {
    enabled: true,
    plus_only: true,
    transform_active: false,
    custom_amount_enabled: true,
    hide_until_opt_in: false,
    default_tip_choice: "preset_2",
    tip_product_id: "",
    tip_variant_id: "",
    tip_infrastructure_status: "pending",
    tip_infrastructure_error: "",
    tip_metrics_enabled: true,
    tip_metrics_window_days: 60,
    heading: "Support our team",
    support_text: "a",
    support_text_1: "a",
    support_text_2: "",
    support_text_3: "",
    thank_you_text: "c",
    cta_label: "Update tip",
    tip_percentages: "5,10,15",
  });
  assert.equal(DEFAULT_TIP_PERCENTAGES, "10,15,20");
});
