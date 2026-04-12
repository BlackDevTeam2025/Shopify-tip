import test from "node:test";
import assert from "node:assert/strict";

import { cartTransformRun } from "../../extensions/tip-transform/src/cart_transform_run.js";

test("cartTransformRun returns no operations when no tip line is present", () => {
  const result = cartTransformRun({
    cart: {
      lines: [
        {
          id: "gid://shopify/CartLine/1",
          tipSource: null,
          tipAmount: null,
          tipLabel: null,
        },
      ],
    },
  });

  assert.deepEqual(result, { operations: [] });
});

test("cartTransformRun updates the saved tip line with the dynamic amount and label", () => {
  const result = cartTransformRun({
    cart: {
      lines: [
        {
          id: "gid://shopify/CartLine/2",
          tipSource: { value: "dynamic_subtotal" },
          tipAmount: { value: "8.86" },
          tipLabel: { value: "Add 10% ($8.86) tip" },
        },
      ],
    },
  });

  assert.deepEqual(result, {
    operations: [
      {
        lineUpdate: {
          cartLineId: "gid://shopify/CartLine/2",
          title: "Tip",
          price: {
            adjustment: {
              fixedPricePerUnit: {
                amount: "8.86",
              },
            },
          },
        },
      },
    ],
  });
});
