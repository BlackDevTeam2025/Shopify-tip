import { redirect } from "react-router";

import { authenticate } from "../shopify.server";
import { createBypassLicenseState, isLicenseActive, syncShopLicenseFromBilling } from "./license.server";
import { shouldBypassBilling } from "./env.server";
import { ensureTipConfigRuntimeState } from "../tip-config.server.js";

export function isLicensePath(pathname) {
  return pathname === "/app/license" || pathname.startsWith("/app/license/");
}

export async function authenticateBillingRoute(
  request,
  { allowUnlicensed = undefined } = {},
) {
  const adminContext = await authenticate.admin(request);
  const pathname = new URL(request.url).pathname;
  const canAccessWithoutLicense =
    allowUnlicensed ?? isLicensePath(pathname);

  if (shouldBypassBilling()) {
    const licenseState = createBypassLicenseState(adminContext.session.shop);
    await ensureTipConfigRuntimeState(adminContext.admin, isLicenseActive(licenseState));

    return {
      ...adminContext,
      isLicenseRoute: isLicensePath(pathname),
      licenseState,
    };
  }

  const licenseState = await syncShopLicenseFromBilling({
    shop: adminContext.session.shop,
    billing: adminContext.billing,
  });

  if (!canAccessWithoutLicense && !isLicenseActive(licenseState)) {
    throw redirect("/app/license");
  }

  await ensureTipConfigRuntimeState(adminContext.admin, isLicenseActive(licenseState));

  return {
    ...adminContext,
    isLicenseRoute: isLicensePath(pathname),
    licenseState,
  };
}
