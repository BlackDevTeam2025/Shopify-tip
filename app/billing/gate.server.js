import { redirect } from "react-router";

import { authenticate } from "../shopify.server";
import {
  createBypassLicenseState,
  isLicenseActive,
  syncShopLicenseFromSubscription,
} from "./license.server";
import { shouldBypassBilling } from "./env.server";
import { ensureTipConfigRuntimeState } from "../tip-config.server.js";
import {
  getBillingRouteAccessDecision,
  getTipRuntimeEnabled,
} from "./access-policy.server.js";
import { loadShopEligibility } from "./shop-eligibility.server.js";

export function isLicensePath(pathname) {
  return pathname === "/app/license" || pathname.startsWith("/app/license/");
}

function throwEmbeddedRedirect(adminContext, url) {
  if (typeof adminContext?.redirect === "function") {
    const response = adminContext.redirect(url);
    throw response;
  }

  throw redirect(url);
}

export async function authenticateBillingRoute(
  request,
  { allowUnlicensed = undefined } = {},
) {
  const adminContext = await authenticate.admin(request);
  const pathname = new URL(request.url).pathname;
  const isLicenseRoute = isLicensePath(pathname);
  const canAccessWithoutLicense = allowUnlicensed ?? isLicenseRoute;
  const shopEligibility = await loadShopEligibility(adminContext.admin);

  if (shouldBypassBilling()) {
    const licenseState = createBypassLicenseState(adminContext.session.shop);
    const licenseActive = isLicenseActive(licenseState);
    const accessDecision = getBillingRouteAccessDecision({
      isLicenseRoute,
      canAccessWithoutLicense,
      shopEligibility,
      licenseActive,
    });

    if (accessDecision.redirectTo) {
      throwEmbeddedRedirect(adminContext, accessDecision.redirectTo);
    }

    await ensureTipConfigRuntimeState(
      adminContext.admin,
      getTipRuntimeEnabled({ shopEligibility, licenseActive }),
    );

    return {
      ...adminContext,
      isLicenseRoute,
      licenseState,
      shopEligibility,
    };
  }

  const licenseState = await syncShopLicenseFromSubscription({
    shop: adminContext.session.shop,
    admin: adminContext.admin,
  });
  const licenseActive = isLicenseActive(licenseState);
  const accessDecision = getBillingRouteAccessDecision({
    isLicenseRoute,
    canAccessWithoutLicense,
    shopEligibility,
    licenseActive,
  });

  if (accessDecision.redirectTo) {
    throwEmbeddedRedirect(adminContext, accessDecision.redirectTo);
  }

  await ensureTipConfigRuntimeState(
    adminContext.admin,
    getTipRuntimeEnabled({ shopEligibility, licenseActive }),
  );

  return {
    ...adminContext,
    isLicenseRoute,
    licenseState,
    shopEligibility,
  };
}
