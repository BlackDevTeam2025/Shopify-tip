export function buildLicensePageState({
  shopEligibility,
  licenseState,
}) {
  const licenseStatus = licenseState?.licenseStatus ?? "none";
  const isLicensed =
    licenseStatus === "active" || licenseStatus === "bypass";
  const hasBillingIssue = licenseStatus === "frozen";

  return {
    mode: !shopEligibility?.eligible
      ? "ineligible"
      : hasBillingIssue
        ? "billing_issue"
        : "purchase",
    canManagePlan: shopEligibility?.eligible && !isLicensed,
    licenseStatus,
    planDisplayName: shopEligibility?.publicDisplayName ?? "Unknown",
    worksForPlusStoresMessage: "This app works for Shopify Plus stores.",
  };
}
