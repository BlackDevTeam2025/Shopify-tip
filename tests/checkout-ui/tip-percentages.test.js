import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateSubtotalTipAmount,
  isValidCustomAmount,
  parseTipPercentages,
  roundCurrencyAmount,
} from "../../extensions/checkout-ui/src/tip-percentages.js";

test("parseTipPercentages returns sanitized percentages from csv", () => {
  assert.deepEqual(parseTipPercentages("5, 10, nope, 20, 0, -4, 10000"), [5, 10, 20]);
});

test("roundCurrencyAmount rounds to the shop currency minor unit", () => {
  assert.equal(roundCurrencyAmount(8.865), 8.87);
});

test("calculateSubtotalTipAmount derives tip amount from subtotal percentage", () => {
  assert.equal(
    calculateSubtotalTipAmount({
      subtotal: 88.6,
      percentage: 10,
    }),
    8.86,
  );
});

test("isValidCustomAmount only accepts positive numeric input", () => {
  assert.equal(isValidCustomAmount("12.5"), true);
  assert.equal(isValidCustomAmount("0"), false);
  assert.equal(isValidCustomAmount("-1"), false);
  assert.equal(isValidCustomAmount("abc"), false);
});
