import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const extensionConfig = fs.readFileSync(
  path.resolve("extensions/checkout-ui/shopify.extension.toml"),
  "utf8",
);

test("checkout extension target renders after the payment method list", () => {
  assert.equal(
    extensionConfig.includes(
      'target = "purchase.checkout.payment-method-list.render-after"',
    ),
    true,
  );
});
