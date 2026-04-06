import test from "node:test";
import assert from "node:assert/strict";

import { formatPercentageTipLabel } from "../../extensions/checkout-ui/src/tip-percentages.js";

test("formatPercentageTipLabel shows a consistent percentage-first summary", () => {
  assert.equal(
    formatPercentageTipLabel({
      percentage: 18,
      amount: 59.4,
      currencyCode: "USD",
    }),
    "18% tip ($59.40)",
  );
});
