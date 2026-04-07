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
          '{"enabled":true,"plus_only":true,"transform_active":true,"custom_amount_enabled":true,"hide_until_opt_in":true,"tip_variant_id":"","heading":"Support our team","support_text":"a","thank_you_text":"THANK YOU.","cta_label":"Add tip now","tip_percentages":"12,16,21","custom_text_color":"#111111","custom_border_color":"#222222"}',
      },
    },
  ]);

  assert.deepEqual(config, {
    enabled: true,
    plus_only: true,
    transform_active: true,
    custom_amount_enabled: true,
    hide_until_opt_in: true,
    tip_product_id: "",
    tip_variant_id: "",
    tip_infrastructure_status: "pending",
    tip_infrastructure_error: "",
    heading: "Support our team",
    support_text: "a",
    thank_you_text: "THANK YOU.",
    cta_label: "Add tip now",
    tip_percentages: "12,16,21",
    custom_text_color: "#111111",
    custom_border_color: "#222222",
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
    tip_product_id: "",
    tip_variant_id: "",
    tip_infrastructure_status: "pending",
    tip_infrastructure_error: "",
    heading: "Support our team",
    support_text: "a",
    thank_you_text: "c",
    cta_label: "Add tip",
    tip_percentages: "5,10,15",
    custom_text_color: "#1A1C1E",
    custom_border_color: "#737785",
  });
  assert.equal(DEFAULT_TIP_PERCENTAGES, "10,15,20");
});
