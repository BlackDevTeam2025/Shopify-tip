const TIP_PRODUCT_TAG = "app_tip_internal";
const TIP_PRODUCT_TITLE = "Tip App Internal";
const ONLINE_STORE_PUBLICATION_NAME = "Online Store";

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

function getFirstVariantId(product) {
  return (
    product?.variants?.edges?.[0]?.node?.id ??
    product?.variants?.nodes?.[0]?.id ??
    ""
  );
}

async function validateSavedMerchandise(admin, { productId, variantId }) {
  const ids = [productId, variantId].filter(Boolean);

  if (ids.length === 0) {
    return {
      productId: "",
      variantId: "",
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
          variants(first: 1) {
            edges {
              node {
                id
              }
            }
          }
        }
        ... on ProductVariant {
          product {
            id
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

  return {
    productId: variantNode?.product?.id ?? productNode?.id ?? "",
    variantId: variantNode?.id ?? getFirstVariantId(productNode),
  };
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
            tags
            variants(first: 1) {
              edges {
                node {
                  id
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
    productId: product?.id ?? "",
    variantId: getFirstVariantId(product),
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
          variants(first: 1) {
            edges {
              node {
                id
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
        status: "ACTIVE",
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
    productId: product?.id ?? "",
    variantId: getFirstVariantId(product),
    errors,
  };
}

async function getOnlineStorePublication(admin) {
  const json = await executeAdminJson(
    admin,
    `#graphql
    query GetPublications {
      publications(first: 25) {
        edges {
          node {
            id
            name
          }
        }
      }
    }`,
  );

  const publications =
    json.data?.publications?.edges?.map((edge) => edge?.node).filter(Boolean) ??
    [];
  const onlineStorePublication =
    publications.find((publication) =>
      publication?.name?.includes(ONLINE_STORE_PUBLICATION_NAME),
    ) ?? null;

  return {
    publicationId: onlineStorePublication?.id ?? "",
    errors: [
      ...flattenGraphqlErrors(json.errors),
      ...(onlineStorePublication
        ? []
        : [
            {
              message:
                "Could not find the Online Store publication required for tip checkout.",
            },
          ]),
    ],
  };
}

async function publishTipProduct(admin, productId, publicationId) {
  const json = await executeAdminJson(
    admin,
    `#graphql
    mutation PublishTipProduct($id: ID!, $input: [PublicationInput!]!) {
      publishablePublish(id: $id, input: $input) {
        publishable {
          ... on Product {
            id
          }
        }
        userErrors {
          field
          message
        }
      }
    }`,
    {
      id: productId,
      input: [{ publicationId }],
    },
  );

  return {
    errors: [
      ...flattenGraphqlErrors(json.errors),
      ...flattenUserErrors(json.data?.publishablePublish?.userErrors),
    ],
  };
}

export async function ensureTipMerchandise(admin, config = {}) {
  const validation = await validateSavedMerchandise(admin, {
    productId: config.tip_product_id,
    variantId: config.tip_variant_id,
  });

  let productId = validation.productId;
  let variantId = validation.variantId;
  let needsRepair = !productId || !variantId;
  const errors = [];

  if (!productId || !variantId) {
    const existing = await findExistingTipProduct(admin);
    productId = existing.productId;
    variantId = existing.variantId;
    needsRepair = true;
    errors.push(...existing.errors);
  }

  if (!productId || !variantId) {
    const created = await createTipProduct(admin);
    productId = created.productId;
    variantId = created.variantId;
    needsRepair = true;

    if (created.errors.length > 0) {
      errors.push(...created.errors);
    }
  }

  if (productId) {
    const publication = await getOnlineStorePublication(admin);

    if (publication.errors.length > 0) {
      errors.push(...publication.errors);
    } else {
      const publishResult = await publishTipProduct(
        admin,
        productId,
        publication.publicationId,
      );

      if (publishResult.errors.length > 0) {
        errors.push(...publishResult.errors);
      }
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
  const validation = await validateSavedMerchandise(admin, {
    productId: config.tip_product_id,
    variantId: config.tip_variant_id,
  });
  const errors = [];
  let productId = validation.productId;
  let variantId = validation.variantId;

  if (!productId || !variantId) {
    const existing = await findExistingTipProduct(admin);
    productId = productId || existing.productId;
    variantId = variantId || existing.variantId;
    errors.push(...existing.errors);
  }

  const publication = await getOnlineStorePublication(admin);
  errors.push(...publication.errors);

  const status =
    errors.length > 0
      ? "warning"
      : productId && variantId && publication.publicationId
        ? "ready"
        : "warning";
  let message = errors[0]?.message ?? "";

  if (!message && (!productId || !variantId)) {
    message =
      "Internal tip merchandise is missing. Open Tip Settings to let the app repair it.";
  } else if (!message && !publication.publicationId) {
    message =
      "The Online Store publication is not available for the internal tip product.";
  } else if (!message) {
    message = "Internal tip product and variant are ready for checkout.";
  }

  return {
    status,
    message,
    productId,
    variantId,
    publicationId: publication.publicationId,
    errors,
  };
}

export const tipMerchandiseConstants = {
  TIP_PRODUCT_TAG,
  TIP_PRODUCT_TITLE,
  ONLINE_STORE_PUBLICATION_NAME,
};
