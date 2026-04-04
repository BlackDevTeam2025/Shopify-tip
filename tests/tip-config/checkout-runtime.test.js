import test from "node:test";
import assert from "node:assert/strict";

import { getTipRuntimeConfigFromAppMetafields } from "../../extensions/checkout-ui/src/runtime-config.js";

test("returns null when no matching app metafield exists", () => {
  assert.equal(getTipRuntimeConfigFromAppMetafields([]), null);
});

test("returns parsed runtime config from shop app metafields", () => {
  const config = getTipRuntimeConfigFromAppMetafields([
    {
      target: { type: "shop", id: "gid://shopify/Shop/1" },
      metafield: {
        namespace: "tip_block_settings",
        key: "config",
        value:
          '{"enabled":true,"widget_title":"Support our team","tip_percentages":"10,15","percentage_display_option":"amount_first","plus_only":true,"transform_active":true,"custom_amount_enabled":true,"tip_variant_id":"","caption1":"a","caption2":"b","caption3":"c"}',
      },
    },
  ]);

  assert.deepEqual(config, {
    enabled: true,
    widget_title: "Support our team",
    tip_percentages: "10,15",
    percentage_display_option: "amount_first",
    plus_only: true,
    transform_active: true,
    custom_amount_enabled: true,
    tip_variant_id: "",
    caption1: "a",
    caption2: "b",
    caption3: "c",
  });
});

test("runtime config normalizes legacy fixed-amount presets back to percentage defaults", () => {
  const config = getTipRuntimeConfigFromAppMetafields([
    {
      target: { type: "shop", id: "gid://shopify/Shop/1" },
      metafield: {
        namespace: "tip_block_settings",
        key: "config",
        value:
          '{"enabled":true,"widget_title":"Support our team","tip_percentages":"10000,20000,50000","percentage_display_option":"amount_first","plus_only":true,"transform_active":false,"custom_amount_enabled":true,"tip_variant_id":"","caption1":"a","caption2":"b","caption3":"c"}',
      },
    },
  ]);

  assert.equal(config.tip_percentages, "5,10,15,18,20");
});
