import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const extensionConfig = fs.readFileSync(
  path.resolve("extensions/checkout-ui/shopify.extension.toml"),
  "utf8",
);

test("checkout extension target renders in the order summary after cart lines", () => {
  assert.equal(
    extensionConfig.includes(
      'target = "purchase.checkout.cart-line-list.render-after"',
    ),
    true,
  );
});
