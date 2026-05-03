const TIP_PRODUCT_TAG = "app_tip_internal";
const TIP_PRODUCT_TITLE = "Tip App Internal";
const TIP_PRODUCT_STATUS = "UNLISTED";
const TIP_VARIANT_INVENTORY_POLICY = "CONTINUE";

function flattenUserErrors(userErrors = []) {
  return userErrors
    .filter((error) => error?.message)
    .map((error) => ({
      field: error.field ?? null,
      message: error.message,
    }));
}

function flattenGraphqlErrors(errors = []) {
  return errors
    .filter((error) => error?.message)
    .map((error) => ({
      field: error.path ?? null,
      message: error.message,
    }));
}

async function executeAdminJson(admin, query, variables) {
  const response = await admin.graphql(query, variables ? { variables } : {});
  return response.json();
}

function getFirstVariant(product) {
  return (
    product?.variants?.edges?.[0]?.node ??
    product?.variants?.nodes?.[0] ??
    null
  );
}

function buildMerchandiseDetails({ product, variant }) {
  const selectedVariant = variant ?? getFirstVariant(product);
  const selectedProduct = variant?.product ?? product;

  return {
    productId: selectedProduct?.id ?? product?.id ?? "",
    productStatus: selectedProduct?.status ?? product?.status ?? "",
    variantId: selectedVariant?.id ?? "",
    variantInventoryPolicy: selectedVariant?.inventoryPolicy ?? "",
    variantTaxable: selectedVariant?.taxable,
    variantTracked: selectedVariant?.inventoryItem?.tracked,
    variantRequiresShipping: selectedVariant?.inventoryItem?.requiresShipping,
  };
}

function isTipProductHidden({ productStatus }) {
  return productStatus === TIP_PRODUCT_STATUS;
}

function isTipVariantSellable({
  variantInventoryPolicy,
  variantTaxable,
  variantTracked,
  variantRequiresShipping,
}) {
  return (
    variantInventoryPolicy === TIP_VARIANT_INVENTORY_POLICY &&
    variantTaxable === false &&
    variantTracked === false &&
    variantRequiresShipping === false
  );
}

function buildTipVariantUpdateInput(variantId) {
  return {
    id: variantId,
    inventoryPolicy: TIP_VARIANT_INVENTORY_POLICY,
    taxable: false,
    inventoryItem: {
      tracked: false,
      requiresShipping: false,
    },
  };
}

async function validateSavedMerchandise(admin, { productId, variantId }) {
  const ids = [productId, variantId].filter(Boolean);

  if (ids.length === 0) {
    return {
      productId: "",
      productStatus: "",
      variantId: "",
      variantInventoryPolicy: "",
    };
  }

  const json = await executeAdminJson(
    admin,
    `#graphql
    query ValidateTipMerchandise($ids: [ID!]!) {
      nodes(ids: $ids) {
        __typename
        id
        ... on Product {
          status
          variants(first: 1) {
            edges {
              node {
                id
                inventoryPolicy
                taxable
                inventoryItem {
                  tracked
                  requiresShipping
                }
              }
            }
          }
        }
        ... on ProductVariant {
          inventoryPolicy
          taxable
          inventoryItem {
            tracked
            requiresShipping
          }
          product {
            id
            status
          }
        }
      }
    }`,
    { ids },
  );

  const productNode = json.data?.nodes?.find(
    (node) => node?.__typename === "Product",
  );
  const variantNode = json.data?.nodes?.find(
    (node) => node?.__typename === "ProductVariant",
  );

  return buildMerchandiseDetails({
    product: productNode,
    variant: variantNode,
  });
}

async function findExistingTipProduct(admin) {
  const json = await executeAdminJson(
    admin,
    `#graphql
    query FindAppManagedTipProduct($query: String!) {
      products(first: 1, query: $query, sortKey: UPDATED_AT, reverse: true) {
        edges {
          node {
            id
            title
            status
            tags
            variants(first: 1) {
              edges {
                node {
                  id
                  inventoryPolicy
                  taxable
                  inventoryItem {
                    tracked
                    requiresShipping
                  }
                }
              }
            }
          }
        }
      }
    }`,
    { query: `tag:${TIP_PRODUCT_TAG}` },
  );

  const product = json.data?.products?.edges?.[0]?.node;

  return {
    ...buildMerchandiseDetails({ product }),
    errors: flattenGraphqlErrors(json.errors),
  };
}

async function createTipProduct(admin) {
  const json = await executeAdminJson(
    admin,
    `#graphql
    mutation CreateTipProduct($product: ProductCreateInput!) {
      productCreate(product: $product) {
        product {
          id
          title
          status
          variants(first: 1) {
            edges {
              node {
                id
                inventoryPolicy
                taxable
                inventoryItem {
                  tracked
                  requiresShipping
                }
              }
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }`,
    {
      product: {
        title: TIP_PRODUCT_TITLE,
        status: TIP_PRODUCT_STATUS,
        tags: [TIP_PRODUCT_TAG],
      },
    },
  );

  const errors = [
    ...flattenGraphqlErrors(json.errors),
    ...flattenUserErrors(json.data?.productCreate?.userErrors),
  ];
  const product = json.data?.productCreate?.product;

  return {
    ...buildMerchandiseDetails({ product }),
    errors,
  };
}

async function updateTipProductStatus(admin, productId) {
  const json = await executeAdminJson(
    admin,
    `#graphql
    mutation HideTipProduct($product: ProductUpdateInput!) {
      productUpdate(product: $product) {
        product {
          id
          status
        }
        userErrors {
          field
          message
        }
      }
    }`,
    {
      product: {
        id: productId,
        status: TIP_PRODUCT_STATUS,
      },
    },
  );

  return {
    productStatus: json.data?.productUpdate?.product?.status ?? "",
    errors: [
      ...flattenGraphqlErrors(json.errors),
      ...flattenUserErrors(json.data?.productUpdate?.userErrors),
    ],
  };
}

async function updateTipVariant(admin, { productId, variantId }) {
  const json = await executeAdminJson(
    admin,
    `#graphql
    mutation ConfigureTipVariant(
      $productId: ID!
      $variants: [ProductVariantsBulkInput!]!
    ) {
      productVariantsBulkUpdate(productId: $productId, variants: $variants) {
        productVariants {
          id
          inventoryPolicy
          taxable
          inventoryItem {
            tracked
            requiresShipping
          }
        }
        userErrors {
          field
          message
        }
      }
    }`,
    {
      productId,
      variants: [buildTipVariantUpdateInput(variantId)],
    },
  );

  const variant = json.data?.productVariantsBulkUpdate?.productVariants?.[0];

  return {
    ...buildMerchandiseDetails({ variant }),
    errors: [
      ...flattenGraphqlErrors(json.errors),
      ...flattenUserErrors(json.data?.productVariantsBulkUpdate?.userErrors),
    ],
  };
}

export async function ensureTipMerchandise(admin, config = {}) {
  let merchandise = await validateSavedMerchandise(admin, {
    productId: config.tip_product_id,
    variantId: config.tip_variant_id,
  });

  let productId = merchandise.productId;
  let variantId = merchandise.variantId;
  let needsRepair = !productId || !variantId;
  const errors = [];

  if (!productId || !variantId) {
    const existing = await findExistingTipProduct(admin);
    merchandise = existing;
    productId = merchandise.productId;
    variantId = merchandise.variantId;
    needsRepair = true;
    errors.push(...existing.errors);
  }

  if (!productId || !variantId) {
    const created = await createTipProduct(admin);
    merchandise = created;
    productId = merchandise.productId;
    variantId = merchandise.variantId;
    needsRepair = true;

    if (created.errors.length > 0) {
      errors.push(...created.errors);
    }
  }

  if (productId && !isTipProductHidden(merchandise)) {
    const statusResult = await updateTipProductStatus(admin, productId);
    needsRepair = true;

    if (statusResult.errors.length > 0) {
      errors.push(...statusResult.errors);
    } else {
      merchandise = {
        ...merchandise,
        productStatus: statusResult.productStatus || TIP_PRODUCT_STATUS,
      };
    }
  }

  if (productId && variantId && !isTipVariantSellable(merchandise)) {
    const variantResult = await updateTipVariant(admin, {
      productId,
      variantId,
    });
    needsRepair = true;

    if (variantResult.errors.length > 0) {
      errors.push(...variantResult.errors);
    } else {
      merchandise = {
        ...merchandise,
        ...variantResult,
        productId,
        productStatus: merchandise.productStatus,
      };
    }
  }

  return {
    productId,
    variantId,
    status: errors.length > 0 ? "error" : "ready",
    errorMessage: errors[0]?.message ?? "",
    needsRepair,
    errors,
  };
}

export async function inspectTipMerchandise(admin, config = {}) {
  let merchandise = await validateSavedMerchandise(admin, {
    productId: config.tip_product_id,
    variantId: config.tip_variant_id,
  });
  const errors = [];
  let productId = merchandise.productId;
  let variantId = merchandise.variantId;

  if (!productId || !variantId) {
    const existing = await findExistingTipProduct(admin);
    merchandise = {
      ...merchandise,
      ...existing,
      productId: productId || existing.productId,
      variantId: variantId || existing.variantId,
    };
    productId = merchandise.productId;
    variantId = merchandise.variantId;
    errors.push(...existing.errors);
  }

  const productReady = productId && isTipProductHidden(merchandise);
  const variantReady = variantId && isTipVariantSellable(merchandise);

  const status =
    errors.length > 0 || !productReady || !variantReady
      ? "warning"
      : productId && variantId
        ? "ready"
        : "warning";
  let message = errors[0]?.message ?? "";

  if (!message && (!productId || !variantId)) {
    message =
      "Internal tip merchandise is missing. Open Tip Settings to let the app repair it.";
  } else if (!message && !productReady) {
    message =
      "Internal tip product should be unlisted. Open Tip Settings to let the app repair it.";
  } else if (!message && !variantReady) {
    message =
      "Internal tip variant can sell out. Open Tip Settings to let the app repair it.";
  } else if (!message) {
    message = "Internal tip product and variant are ready for checkout.";
  }

  return {
    status,
    message,
    productId,
    variantId,
    publicationId: "",
    errors,
  };
}

export const tipMerchandiseConstants = {
  TIP_PRODUCT_TAG,
  TIP_PRODUCT_TITLE,
  TIP_PRODUCT_STATUS,
  TIP_VARIANT_INVENTORY_POLICY,
};
