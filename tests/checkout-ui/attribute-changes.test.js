import test from "node:test";
import assert from "node:assert/strict";

import {
  buildUpdateAttributeChange,
  buildRemoveAttributeChange,
  canUpdateCheckoutAttributes,
} from "../../extensions/checkout-ui/src/attribute-changes.js";

test("buildUpdateAttributeChange returns the shape Shopify expects", () => {
  assert.deepEqual(buildUpdateAttributeChange("tip_amount", "88.60"), {
    type: "updateAttribute",
    key: "tip_amount",
    value: "88.60",
  });
});

test("buildRemoveAttributeChange returns the shape Shopify expects", () => {
  assert.deepEqual(buildRemoveAttributeChange("tip_amount"), {
    type: "removeAttribute",
    key: "tip_amount",
  });
});

test("canUpdateCheckoutAttributes only blocks when Shopify explicitly disallows it", () => {
  assert.equal(canUpdateCheckoutAttributes(undefined), true);
  assert.equal(canUpdateCheckoutAttributes({ attributes: {} }), true);
  assert.equal(
    canUpdateCheckoutAttributes({ attributes: { canUpdateAttributes: true } }),
    true,
  );
  assert.equal(
    canUpdateCheckoutAttributes({ attributes: { canUpdateAttributes: false } }),
    false,
  );
});
