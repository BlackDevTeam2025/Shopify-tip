export const TIP_CART_TRANSFORM_HANDLE = "tip-transform";

function isAlreadyExistsError(error) {
  return /already (exists|registered)/i.test(error?.message ?? "");
}

export function hasCartTransformScope(scope = "") {
  return String(scope)
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .includes("write_cart_transforms");
}

export async function ensureTipCartTransform(admin, scope = "") {
  if (!hasCartTransformScope(scope)) {
    return {
      active: false,
      cartTransformId: null,
      errors: [
        {
          field: ["scope"],
          message:
            "The current app session is missing write_cart_transforms. Reinstall or re-auth the app so Shopify grants the new scope.",
        },
      ],
    };
  }

  const response = await admin.graphql(
    `#graphql
    mutation EnsureTipCartTransform($functionHandle: String!) {
      cartTransformCreate(functionHandle: $functionHandle) {
        cartTransform {
          id
        }
        userErrors {
          field
          message
        }
      }
    }`,
    {
      variables: {
        functionHandle: TIP_CART_TRANSFORM_HANDLE,
      },
    },
  );

  const json = await response.json();
  const payload = json.data?.cartTransformCreate;
  const errors = payload?.userErrors ?? [];

  if (errors.some(isAlreadyExistsError)) {
    return {
      active: true,
      cartTransformId: null,
      errors: [],
    };
  }

  if (errors.length > 0) {
    return {
      active: false,
      cartTransformId: null,
      errors,
    };
  }

  return {
    active: true,
    cartTransformId: payload?.cartTransform?.id ?? null,
    errors: [],
  };
}
