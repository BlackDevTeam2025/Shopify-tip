import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const checkoutSource = fs.readFileSync(
  path.resolve("extensions/checkout-ui/src/Checkout.jsx"),
  "utf8",
);

test("checkout extension source keeps the form visible and uses the custom-only submit flow", () => {
  assert.equal(checkoutSource.includes("FIXED_TIP_PERCENTAGES"), false);
  assert.equal(checkoutSource.includes("formatTipOptionLabel"), false);
  assert.equal(checkoutSource.includes("parseTipPercentages"), true);
  assert.equal(checkoutSource.includes("getDefaultTipSelection"), true);
  assert.equal(checkoutSource.includes("default_tip_choice"), true);
  assert.equal(checkoutSource.includes("if (!optionsExpanded)"), false);
  assert.equal(checkoutSource.includes("setOptionsExpanded"), false);
  assert.equal(checkoutSource.includes('primaryLabel: "None"'), false);
  assert.equal(checkoutSource.includes("Update tip"), true);
  assert.equal(
    checkoutSource.includes("Enter a custom amount before updating the tip."),
    true,
  );
  assert.equal(checkoutSource.includes("choice.key === \"custom\""), true);
  assert.equal(checkoutSource.includes("void handleApplyTip"), true);
  assert.equal(checkoutSource.includes('label="Custom tip"'), true);
  assert.equal(
    checkoutSource.includes('gridTemplateColumns="minmax(0, 1fr) auto"'),
    true,
  );
  assert.equal(checkoutSource.includes("accessory={"), true);
  assert.equal(checkoutSource.includes("changeCustomAmount(-1)"), true);
  assert.equal(checkoutSource.includes("changeCustomAmount(1)"), true);
  assert.equal(checkoutSource.includes("Estimated total"), true);
  assert.equal(checkoutSource.includes(">Tip<"), false);
  assert.equal(checkoutSource.includes("thank_you_text"), true);
  assert.equal(checkoutSource.includes("cta_label"), true);
  assert.equal(checkoutSource.includes("<s-press-button"), true);
  assert.equal(checkoutSource.includes("autoSyncKeyRef"), true);
  assert.equal(
    checkoutSource.includes(
      "Unable to keep the tip in sync with the current cart",
    ),
    true,
  );
  assert.equal(checkoutSource.includes("savedTipMode !== \"percentage\""), true);
  assert.equal(checkoutSource.includes("savedTipAmount, nextTipAmount"), true);
});
