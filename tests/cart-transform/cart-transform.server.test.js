import test from "node:test";
import assert from "node:assert/strict";

import { ensureTipCartTransform, hasCartTransformScope } from "../../app/cart-transform.server.js";

function createAdminWithJsonResponse(payload) {
  return {
    graphql: async () => ({
      json: async () => payload,
    }),
  };
}

test("ensureTipCartTransform reports active when the transform is created", async () => {
  const result = await ensureTipCartTransform(
    createAdminWithJsonResponse({
      data: {
        cartTransformCreate: {
          cartTransform: { id: "gid://shopify/CartTransform/1" },
          userErrors: [],
        },
      },
    }),
    "write_cart_transforms,write_products",
  );

  assert.deepEqual(result, {
    active: true,
    cartTransformId: "gid://shopify/CartTransform/1",
    errors: [],
  });
});

test("ensureTipCartTransform treats already-existing transforms as active", async () => {
  const result = await ensureTipCartTransform(
    createAdminWithJsonResponse({
      data: {
        cartTransformCreate: {
          cartTransform: null,
          userErrors: [{ field: ["functionHandle"], message: "A cart transform function already exists for the provided function_handle." }],
        },
      },
    }),
    "write_cart_transforms,write_products",
  );

  assert.deepEqual(result, {
    active: true,
    cartTransformId: null,
    errors: [],
  });
});

test("ensureTipCartTransform returns non-active status for real activation errors", async () => {
  const result = await ensureTipCartTransform(
    createAdminWithJsonResponse({
      data: {
        cartTransformCreate: {
          cartTransform: null,
          userErrors: [{ field: ["functionHandle"], message: "Could not find Function." }],
        },
      },
    }),
    "write_cart_transforms,write_products",
  );

  assert.equal(result.active, false);
  assert.equal(result.cartTransformId, null);
  assert.equal(result.errors.length, 1);
  assert.match(result.errors[0].message, /Could not find Function/i);
});

test("ensureTipCartTransform returns a clear error when the session is missing cart transform scope", async () => {
  const result = await ensureTipCartTransform(
    createAdminWithJsonResponse({
      data: {
        cartTransformCreate: {
          cartTransform: { id: "gid://shopify/CartTransform/1" },
          userErrors: [],
        },
      },
    }),
    "write_products,write_metaobjects",
  );

  assert.equal(result.active, false);
  assert.equal(result.cartTransformId, null);
  assert.match(result.errors[0].message, /missing write_cart_transforms/i);
});

test("hasCartTransformScope detects whether the scope is present", () => {
  assert.equal(hasCartTransformScope("write_products,write_metaobjects"), false);
  assert.equal(
    hasCartTransformScope("write_products,write_cart_transforms,write_metaobjects"),
    true,
  );
});
