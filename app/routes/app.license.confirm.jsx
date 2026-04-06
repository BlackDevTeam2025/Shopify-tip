import { redirect } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";

import { authenticateBillingRoute } from "../billing/gate.server";
import { isLicenseActive } from "../billing/license.server";
import { syncTipConfigEnabled } from "../tip-config.server.js";
import { ensureTipCartTransform } from "../cart-transform.server.js";

function throwEmbeddedRedirect(adminContext, url) {
  if (typeof adminContext?.redirect === "function") {
    const response = adminContext.redirect(url);
    throw response;
  }

  throw redirect(url);
}

export const loader = async ({ request }) => {
  const adminContext = await authenticateBillingRoute(request);
  const { admin, licenseState, session, shopEligibility } = adminContext;

  if (!shopEligibility.eligible) {
    throwEmbeddedRedirect(adminContext, "/app/license");
  }

  if (isLicenseActive(licenseState)) {
    const transformStatus = await ensureTipCartTransform(admin, session?.scope);
    await syncTipConfigEnabled(admin, true, transformStatus.active);
    throwEmbeddedRedirect(adminContext, "/app");
  }

  throwEmbeddedRedirect(adminContext, "/app/license");
};

export const headers = (args) => boundary.headers(args);
