import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const checkoutSource = fs.readFileSync(
  path.resolve("extensions/checkout-ui/src/Checkout.jsx"),
  "utf8",
);

test("checkout extension source uses editable preset parsing and opt-in behavior", () => {
  assert.equal(checkoutSource.includes("FIXED_TIP_PERCENTAGES"), false);
  assert.equal(checkoutSource.includes("formatTipOptionLabel"), false);
  assert.equal(checkoutSource.includes("parseTipPercentages"), true);
  assert.equal(checkoutSource.includes("hide_until_opt_in"), true);
  assert.equal(checkoutSource.includes("if (!optionsExpanded)"), true);
  assert.equal(checkoutSource.includes("setOptionsExpanded(false)"), true);
  assert.equal(
    checkoutSource.includes("setOptionsExpanded(!settings.hide_until_opt_in)"),
    true,
  );
  assert.equal(checkoutSource.includes("thank_you_text"), true);
  assert.equal(checkoutSource.includes("cta_label"), true);
  assert.equal(checkoutSource.includes("<s-press-button"), true);
});
