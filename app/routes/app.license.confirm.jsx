import { redirect } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";

import { getTipRuntimeEnabled } from "../billing/access-policy.server.js";
import { authenticateBillingRoute } from "../billing/gate.server";
import { isLicenseActive } from "../billing/license.server";

function throwEmbeddedRedirect(adminContext, url) {
  if (typeof adminContext?.redirect === "function") {
    const response = adminContext.redirect(url);
    throw response;
  }

  throw redirect(url);
}

export const loader = async ({ request }) => {
  const adminContext = await authenticateBillingRoute(request);
  const { licenseState, shopEligibility } = adminContext;
  const runtimeEnabled = getTipRuntimeEnabled({
    shopEligibility,
    licenseActive: isLicenseActive(licenseState),
  });

  if (runtimeEnabled) {
    throwEmbeddedRedirect(adminContext, "/app");
  }

  throwEmbeddedRedirect(adminContext, "/app/license");
};

export const headers = (args) => boundary.headers(args);
