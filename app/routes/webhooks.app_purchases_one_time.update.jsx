import { authenticate, unauthenticated } from "../shopify.server";
import { isLicenseActive, syncShopLicenseFromBilling } from "../billing/license.server";
import { syncTipConfigEnabled } from "../tip-config.server.js";
import { ensureTipCartTransform } from "../cart-transform.server.js";

export const action = async ({ request }) => {
  const { shop, topic } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  try {
    const { admin, billing } = await unauthenticated.admin(shop);
    const licenseState = await syncShopLicenseFromBilling({ shop, billing });
    const transformStatus = isLicenseActive(licenseState)
      ? await ensureTipCartTransform(admin)
      : { active: false };
    await syncTipConfigEnabled(admin, isLicenseActive(licenseState), transformStatus.active);
  } catch (error) {
    console.error(`Failed to sync one-time purchase for ${shop}`, error);
  }

  return new Response();
};
