export function buildLicensePageState({
  shopEligibility,
  licenseState,
}) {
  const licenseStatus = licenseState?.licenseStatus ?? "none";
  const isLicensed =
    licenseStatus === "active" || licenseStatus === "bypass";

  return {
    mode: shopEligibility?.eligible ? "purchase" : "ineligible",
    canPurchase: shopEligibility?.eligible && !isLicensed,
    licenseStatus,
    planDisplayName: shopEligibility?.publicDisplayName ?? "Unknown",
    worksForPlusStoresMessage: "This app works for Shopify Plus stores.",
  };
}
