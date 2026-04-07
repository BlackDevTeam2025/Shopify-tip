import test from "node:test";
import assert from "node:assert/strict";

import {
  ensureTipMerchandise,
  tipMerchandiseConstants,
} from "../../app/tip-merchandise.server.js";

test("ensureTipMerchandise creates and publishes a tip product when none exists", async () => {
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
                  id: "gid://shopify/Product/1",
                  variants: {
                    edges: [
                      {
                        node: {
                          id: "gid://shopify/ProductVariant/1",
                        },
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

      if (calls.length === 3) {
        return {
          json: async () => ({
            data: {
              publications: {
                edges: [
                  {
                    node: {
                      id: "gid://shopify/Publication/1",
                      name: "Online Store",
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
            publishablePublish: {
              publishable: {
                id: "gid://shopify/Product/1",
              },
              userErrors: [],
            },
          },
        }),
      };
    },
  };

  const result = await ensureTipMerchandise(admin, {});

  assert.equal(result.productId, "gid://shopify/Product/1");
  assert.equal(result.variantId, "gid://shopify/ProductVariant/1");
  assert.equal(result.status, "ready");
  assert.equal(result.errorMessage, "");
  assert.equal(result.needsRepair, true);
  assert.equal(calls.length, 4);
  assert.match(calls[0].options.variables.query, /tag:app_tip_internal/);
});

test("ensureTipMerchandise reuses a saved valid variant and only republishes it", async () => {
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
                  id: "gid://shopify/Product/1",
                  variants: {
                    edges: [
                      {
                        node: {
                          id: "gid://shopify/ProductVariant/1",
                        },
                      },
                    ],
                  },
                },
                {
                  __typename: "ProductVariant",
                  id: "gid://shopify/ProductVariant/1",
                  product: {
                    id: "gid://shopify/Product/1",
                  },
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
              publications: {
                edges: [
                  {
                    node: {
                      id: "gid://shopify/Publication/1",
                      name: tipMerchandiseConstants.ONLINE_STORE_PUBLICATION_NAME,
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
            publishablePublish: {
              publishable: {
                id: "gid://shopify/Product/1",
              },
              userErrors: [],
            },
          },
        }),
      };
    },
  };

  const result = await ensureTipMerchandise(admin, {
    tip_product_id: "gid://shopify/Product/1",
    tip_variant_id: "gid://shopify/ProductVariant/1",
  });

  assert.equal(result.productId, "gid://shopify/Product/1");
  assert.equal(result.variantId, "gid://shopify/ProductVariant/1");
  assert.equal(result.status, "ready");
  assert.equal(result.needsRepair, false);
  assert.equal(calls.length, 3);
});

test("ensureTipMerchandise surfaces publication failures as recoverable status", async () => {
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
                      id: "gid://shopify/Product/1",
                      variants: {
                        edges: [
                          {
                            node: {
                              id: "gid://shopify/ProductVariant/1",
                            },
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
            publications: {
              edges: [],
            },
          },
        }),
      };
    },
  };

  const result = await ensureTipMerchandise(admin, {});

  assert.equal(result.status, "error");
  assert.match(result.errorMessage, /Online Store publication/);
  assert.equal(result.productId, "gid://shopify/Product/1");
  assert.equal(result.variantId, "gid://shopify/ProductVariant/1");
});
