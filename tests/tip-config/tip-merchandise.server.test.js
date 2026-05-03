import test from "node:test";
import assert from "node:assert/strict";

import {
  ensureTipMerchandise,
  tipMerchandiseConstants,
} from "../../app/tip-merchandise.server.js";

const PRODUCT_ID = "gid://shopify/Product/1";
const VARIANT_ID = "gid://shopify/ProductVariant/1";

function sellableVariant(overrides = {}) {
  return {
    id: VARIANT_ID,
    inventoryPolicy: "CONTINUE",
    taxable: false,
    inventoryItem: {
      tracked: false,
      requiresShipping: false,
    },
    ...overrides,
  };
}

test("ensureTipMerchandise creates an unlisted sellable tip product when none exists", async () => {
  const calls = [];
  const admin = {
    graphql: async (_query, options) => {
      calls.push({ query: _query, options });

      if (calls.length === 1) {
        return {
          json: async () => ({
            data: {
              products: {
                edges: [],
              },
            },
          }),
        };
      }

      if (calls.length === 2) {
        return {
          json: async () => ({
            data: {
              productCreate: {
                product: {
                  id: PRODUCT_ID,
                  status: "UNLISTED",
                  variants: {
                    edges: [
                      {
                        node: sellableVariant({
                          inventoryPolicy: "DENY",
                          taxable: true,
                          inventoryItem: {
                            tracked: false,
                            requiresShipping: true,
                          },
                        }),
                      },
                    ],
                  },
                },
                userErrors: [],
              },
            },
          }),
        };
      }

      return {
        json: async () => ({
          data: {
            productVariantsBulkUpdate: {
              productVariants: [sellableVariant()],
              userErrors: [],
            },
          },
        }),
      };
    },
  };

  const result = await ensureTipMerchandise(admin, {});

  assert.equal(result.productId, PRODUCT_ID);
  assert.equal(result.variantId, VARIANT_ID);
  assert.equal(result.status, "ready");
  assert.equal(result.errorMessage, "");
  assert.equal(result.needsRepair, true);
  assert.equal(calls.length, 3);
  assert.match(calls[0].options.variables.query, /tag:app_tip_internal/);
  assert.equal(
    calls[1].options.variables.product.status,
    tipMerchandiseConstants.TIP_PRODUCT_STATUS,
  );
  assert.deepEqual(calls[2].options.variables, {
    productId: PRODUCT_ID,
    variants: [
      {
        id: VARIANT_ID,
        inventoryPolicy: tipMerchandiseConstants.TIP_VARIANT_INVENTORY_POLICY,
        taxable: false,
        inventoryItem: {
          tracked: false,
          requiresShipping: false,
        },
      },
    ],
  });
  assert.equal(
    calls.some(({ query }) => /publishablePublish|publications/.test(query)),
    false,
  );
});

test("ensureTipMerchandise reuses a saved sellable unlisted variant without mutations", async () => {
  const calls = [];
  const admin = {
    graphql: async (_query, options) => {
      calls.push({ query: _query, options });

      return {
        json: async () => ({
          data: {
            nodes: [
              {
                __typename: "Product",
                id: PRODUCT_ID,
                status: "UNLISTED",
                variants: {
                  edges: [
                    {
                      node: sellableVariant(),
                    },
                  ],
                },
              },
              {
                __typename: "ProductVariant",
                ...sellableVariant({
                  product: {
                    id: PRODUCT_ID,
                    status: "UNLISTED",
                  },
                }),
              },
            ],
          },
        }),
      };
    },
  };

  const result = await ensureTipMerchandise(admin, {
    tip_product_id: PRODUCT_ID,
    tip_variant_id: VARIANT_ID,
  });

  assert.equal(result.productId, PRODUCT_ID);
  assert.equal(result.variantId, VARIANT_ID);
  assert.equal(result.status, "ready");
  assert.equal(result.needsRepair, false);
  assert.equal(calls.length, 1);
});

test("ensureTipMerchandise repairs saved tip merchandise that can sell out", async () => {
  const calls = [];
  const admin = {
    graphql: async (_query, options) => {
      calls.push({ query: _query, options });

      if (calls.length === 1) {
        return {
          json: async () => ({
            data: {
              nodes: [
                {
                  __typename: "Product",
                  id: PRODUCT_ID,
                  status: "ACTIVE",
                  variants: {
                    edges: [
                      {
                        node: sellableVariant({
                          inventoryPolicy: "DENY",
                          taxable: true,
                          inventoryItem: {
                            tracked: false,
                            requiresShipping: true,
                          },
                        }),
                      },
                    ],
                  },
                },
                {
                  __typename: "ProductVariant",
                  ...sellableVariant({
                    inventoryPolicy: "DENY",
                    taxable: true,
                    inventoryItem: {
                      tracked: false,
                      requiresShipping: true,
                    },
                    product: {
                      id: PRODUCT_ID,
                      status: "ACTIVE",
                    },
                  }),
                },
              ],
            },
          }),
        };
      }

      if (calls.length === 2) {
        return {
          json: async () => ({
            data: {
              productUpdate: {
                product: {
                  id: PRODUCT_ID,
                  status: "UNLISTED",
                },
                userErrors: [],
              },
            },
          }),
        };
      }

      return {
        json: async () => ({
          data: {
            productVariantsBulkUpdate: {
              productVariants: [sellableVariant()],
              userErrors: [],
            },
          },
        }),
      };
    },
  };

  const result = await ensureTipMerchandise(admin, {
    tip_product_id: PRODUCT_ID,
    tip_variant_id: VARIANT_ID,
  });

  assert.equal(result.status, "ready");
  assert.equal(result.needsRepair, true);
  assert.equal(calls.length, 3);
  assert.deepEqual(calls[1].options.variables.product, {
    id: PRODUCT_ID,
    status: tipMerchandiseConstants.TIP_PRODUCT_STATUS,
  });
  assert.equal(
    calls[2].options.variables.variants[0].inventoryPolicy,
    tipMerchandiseConstants.TIP_VARIANT_INVENTORY_POLICY,
  );
});

test("ensureTipMerchandise surfaces variant repair failures as recoverable status", async () => {
  const admin = {
    graphql: async (_query, options) => {
      const operation = options?.variables;

      if (operation?.query) {
        return {
          json: async () => ({
            data: {
              products: {
                edges: [
                  {
                    node: {
                      id: PRODUCT_ID,
                      status: "UNLISTED",
                      variants: {
                        edges: [
                          {
                            node: sellableVariant({
                              inventoryPolicy: "DENY",
                            }),
                          },
                        ],
                      },
                    },
                  },
                ],
              },
            },
          }),
        };
      }

      return {
        json: async () => ({
          data: {
            productVariantsBulkUpdate: {
              productVariants: [],
              userErrors: [
                {
                  field: ["variants", "0", "inventoryPolicy"],
                  message: "Variant cannot be updated",
                },
              ],
            },
          },
        }),
      };
    },
  };

  const result = await ensureTipMerchandise(admin, {});

  assert.equal(result.status, "error");
  assert.match(result.errorMessage, /Variant cannot be updated/);
  assert.equal(result.productId, PRODUCT_ID);
  assert.equal(result.variantId, VARIANT_ID);
});
