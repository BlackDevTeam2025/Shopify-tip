export const SHOP_ELIGIBILITY_REASONS = {
  PLUS_REQUIRED: "plus_required",
  PLAN_UNAVAILABLE: "plan_unavailable",
};

export function buildShopEligibility(plan) {
  const isPlus = plan?.shopifyPlus === true;
  const isDevStore = plan?.partnerDevelopment === true;
  const publicDisplayName =
    typeof plan?.publicDisplayName === "string" && plan.publicDisplayName.trim()
      ? plan.publicDisplayName.trim()
      : "Unknown";
  const eligible = isPlus || isDevStore;

  return {
    eligible,
    isPlus,
    isDevStore,
    publicDisplayName,
    reason: eligible
      ? null
      : plan
        ? SHOP_ELIGIBILITY_REASONS.PLUS_REQUIRED
        : SHOP_ELIGIBILITY_REASONS.PLAN_UNAVAILABLE,
  };
}

export async function loadShopEligibility(admin) {
  const response = await admin.graphql(
    `#graphql
    query TipAppShopEligibility {
      shop {
        plan {
          partnerDevelopment
          publicDisplayName
          shopifyPlus
        }
      }
    }`,
  );
  const json = await response.json();

  return buildShopEligibility(json.data?.shop?.plan ?? null);
}
