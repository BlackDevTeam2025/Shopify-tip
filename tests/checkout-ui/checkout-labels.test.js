import test from "node:test";
import assert from "node:assert/strict";

import {formatTipOptionLabel} from "../../extensions/checkout-ui/src/tip-percentages.js";

test("formatTipOptionLabel shows percentage and amount by default", () => {
  assert.equal(
    formatTipOptionLabel({
      percentage: 20,
      amount: 7.5,
      currencyCode: "USD",
      displayOption: "percentage_and_amount",
    }),
    "Add 20% ($7.50) tip",
  );
});

test("formatTipOptionLabel supports percentage-only display", () => {
  assert.equal(
    formatTipOptionLabel({
      percentage: 20,
      amount: 7.5,
      currencyCode: "USD",
      displayOption: "percentage_only",
    }),
    "20%",
  );
});

test("formatTipOptionLabel supports amount-first display", () => {
  assert.equal(
    formatTipOptionLabel({
      percentage: 20,
      amount: 7.5,
      currencyCode: "USD",
      displayOption: "amount_first",
    }),
    "$7.50 (20%)",
  );
});
