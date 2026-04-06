import test from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_TIP_PERCENTAGES,
  calculateSubtotalTipAmount,
  isValidCustomAmount,
  parseTipPercentages,
  roundCurrencyAmount,
} from "../../extensions/checkout-ui/src/tip-percentages.js";

test("parseTipPercentages returns the first three valid editable presets", () => {
  assert.deepEqual(parseTipPercentages("12,16,21,30"), [12, 16, 21]);
});

test("parseTipPercentages falls back per slot for invalid values", () => {
  assert.deepEqual(parseTipPercentages("0,nope,999"), [10, 15, 20]);
  assert.equal(DEFAULT_TIP_PERCENTAGES, "10,15,20");
});

test("roundCurrencyAmount rounds to the shop currency minor unit", () => {
  assert.equal(roundCurrencyAmount(8.865), 8.87);
});

test("calculateSubtotalTipAmount derives tip amount from subtotal percentage", () => {
  assert.equal(
    calculateSubtotalTipAmount({
      subtotal: 330,
      percentage: 15,
    }),
    49.5,
  );
});

test("isValidCustomAmount only accepts positive numeric input", () => {
  assert.equal(isValidCustomAmount("12.5"), true);
  assert.equal(isValidCustomAmount("0"), false);
  assert.equal(isValidCustomAmount("-1"), false);
  assert.equal(isValidCustomAmount("abc"), false);
});
