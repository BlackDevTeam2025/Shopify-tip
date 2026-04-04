import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const checkoutSource = fs.readFileSync(
  "D:/khanh-dev/extensions/checkout-ui/src/Checkout.jsx",
  "utf8",
);

test("checkout extension source references subtotal percentage helpers instead of fixed amount parsing", () => {
  assert.equal(checkoutSource.includes("parseTipPercentages"), true);
  assert.equal(checkoutSource.includes("calculateSubtotalTipAmount"), true);
  assert.equal(checkoutSource.includes("parseFixedTipAmounts"), false);
  assert.equal(checkoutSource.includes("Add a quick tip to this order."), false);
  assert.equal(checkoutSource.includes("<s-grid"), true);
  assert.equal(checkoutSource.includes("<s-button"), true);
  assert.equal(checkoutSource.includes("getInitialSelection"), true);
});
