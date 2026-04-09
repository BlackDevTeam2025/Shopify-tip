const REQUIRED_BRANDING_SCOPES = [
  "read_checkout_branding_settings",
  "write_checkout_branding_settings",
];

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

export function hasCheckoutBrandingScope(scope = "") {
  const tokens = String(scope)
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);
  return REQUIRED_BRANDING_SCOPES.every((requiredScope) =>
    tokens.includes(requiredScope),
  );
}

async function loadGrantedScopes(admin) {
  const json = await executeAdminJson(
    admin,
    `#graphql
    query LoadGrantedScopesForBranding {
      currentAppInstallation {
        accessScopes {
          handle
        }
      }
    }`,
  );

  return {
    scopes:
      json.data?.currentAppInstallation?.accessScopes?.map((scope) => scope.handle) ??
      [],
    errors: flattenGraphqlErrors(json.errors),
  };
}

async function loadCheckoutProfile(admin) {
  const json = await executeAdminJson(
    admin,
    `#graphql
    query LoadCheckoutProfilesForBranding {
      checkoutProfiles(first: 10) {
        nodes {
          id
          isPublished
        }
      }
    }`,
  );

  const profiles = json.data?.checkoutProfiles?.nodes ?? [];
  const published = profiles.find((profile) => profile?.isPublished);
  const profile = published ?? profiles[0] ?? null;

  return {
    checkoutProfileId: profile?.id ?? "",
    errors: flattenGraphqlErrors(json.errors),
  };
}

function buildCheckoutBrandingInput({ textColor, borderColor }) {
  return {
    designSystem: {
      colors: {
        schemes: {
          scheme1: {
            base: {
              text: textColor,
            },
            control: {
              border: borderColor,
              selected: {
                border: borderColor,
              },
            },
            primaryButton: {
              background: textColor,
              border: borderColor,
            },
          },
        },
      },
    },
  };
}

async function upsertCheckoutBranding(admin, { checkoutProfileId, input }) {
  const json = await executeAdminJson(
    admin,
    `#graphql
    mutation ApplyTipCheckoutBranding(
      $checkoutProfileId: ID!
      $checkoutBrandingInput: CheckoutBrandingInput!
    ) {
      checkoutBrandingUpsert(
        checkoutProfileId: $checkoutProfileId
        checkoutBrandingInput: $checkoutBrandingInput
      ) {
        userErrors {
          field
          message
        }
      }
    }`,
    {
      checkoutProfileId,
      checkoutBrandingInput: input,
    },
  );

  return {
    errors: [
      ...flattenGraphqlErrors(json.errors),
      ...flattenUserErrors(json.data?.checkoutBrandingUpsert?.userErrors),
    ],
  };
}

export async function applyTipCheckoutBranding({
  admin,
  shopEligibility,
  applyCheckoutBranding,
  customTextColor,
  customBorderColor,
}) {
  if (!applyCheckoutBranding) {
    return {
      status: "disabled",
      applied: false,
      message: "",
      errors: [],
    };
  }

  if (!shopEligibility?.eligible) {
    return {
      status: "warning",
      applied: false,
      message:
        "Checkout branding was not applied. This shop must be Shopify Plus or a development store.",
      errors: [],
    };
  }

  const scopeResult = await loadGrantedScopes(admin);
  const grantedScopeSet = new Set(scopeResult.scopes);
  const missingScopes = REQUIRED_BRANDING_SCOPES.filter(
    (scope) => !grantedScopeSet.has(scope),
  );

  if (scopeResult.errors.length > 0) {
    return {
      status: "warning",
      applied: false,
      message:
        scopeResult.errors[0]?.message ??
        "Checkout branding scope check failed.",
      errors: scopeResult.errors,
    };
  }

  if (missingScopes.length > 0) {
    return {
      status: "warning",
      applied: false,
      message: `Checkout branding was not applied. Missing access scopes: ${missingScopes.join(", ")}.`,
      errors: [],
    };
  }

  const checkoutProfileResult = await loadCheckoutProfile(admin);
  if (
    checkoutProfileResult.errors.length > 0 ||
    !checkoutProfileResult.checkoutProfileId
  ) {
    return {
      status: "warning",
      applied: false,
      message:
        checkoutProfileResult.errors[0]?.message ??
        "Checkout branding was not applied because no checkout profile is available.",
      errors: checkoutProfileResult.errors,
    };
  }

  const result = await upsertCheckoutBranding(admin, {
    checkoutProfileId: checkoutProfileResult.checkoutProfileId,
    input: buildCheckoutBrandingInput({
      textColor: customTextColor,
      borderColor: customBorderColor,
    }),
  });

  if (result.errors.length > 0) {
    return {
      status: "warning",
      applied: false,
      message:
        result.errors[0]?.message ??
        "Checkout branding was not applied due to validation errors.",
      errors: result.errors,
    };
  }

  return {
    status: "applied",
    applied: true,
    message: "Checkout branding colors were applied successfully.",
    errors: [],
  };
}
