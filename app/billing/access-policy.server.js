export function getBillingRouteAccessDecision({
  isLicenseRoute = false,
  canAccessWithoutLicense = false,
  shopEligibility,
  licenseActive = false,
}) {
  if (!shopEligibility?.eligible && !isLicenseRoute) {
    return {
      redirectTo: "/app/license",
      reason: "shop_ineligible",
    };
  }

  if (
    !canAccessWithoutLicense &&
    !getTipRuntimeEnabled({ shopEligibility, licenseActive })
  ) {
    return {
      redirectTo: "/app/license",
      reason: "license_required",
    };
  }

  return {
    redirectTo: null,
    reason: null,
  };
}

export function getTipRuntimeEnabled({
  shopEligibility,
  licenseActive = false,
}) {
  return Boolean(
    shopEligibility?.eligible &&
      (licenseActive || shopEligibility?.isDevStore === true),
  );
}
