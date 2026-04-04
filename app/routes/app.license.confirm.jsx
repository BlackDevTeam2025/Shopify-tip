import { redirect } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";

import { authenticateBillingRoute } from "../billing/gate.server";
import { isLicenseActive } from "../billing/license.server";
import { syncTipConfigEnabled } from "../tip-config.server.js";
import { ensureTipCartTransform } from "../cart-transform.server.js";

export const loader = async ({ request }) => {
  const { admin, licenseState, session } = await authenticateBillingRoute(request);

  if (isLicenseActive(licenseState)) {
    const transformStatus = await ensureTipCartTransform(admin, session?.scope);
    await syncTipConfigEnabled(admin, true, transformStatus.active);
    throw redirect("/app");
  }

  throw redirect("/app/license");
};

export const headers = (args) => boundary.headers(args);
