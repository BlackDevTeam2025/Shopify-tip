import test from "node:test";
import assert from "node:assert/strict";

import {
  FIXED_TIP_PERCENTAGES,
  calculateSubtotalTipAmount,
  isValidCustomAmount,
  roundCurrencyAmount,
} from "../../extensions/checkout-ui/src/tip-percentages.js";

test("fixed tip percentages stay locked to the new preset set", () => {
  assert.deepEqual(FIXED_TIP_PERCENTAGES, [15, 18, 25]);
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
