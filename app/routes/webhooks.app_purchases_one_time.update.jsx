import { authenticate, unauthenticated } from "../shopify.server";
import { isLicenseActive, syncShopLicenseFromBilling } from "../billing/license.server";
import { syncTipConfigEnabled } from "../tip-config.server.js";
import { ensureTipCartTransform } from "../cart-transform.server.js";
import { loadShopEligibility } from "../billing/shop-eligibility.server.js";

export const action = async ({ request }) => {
  const { shop, topic } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  try {
    const { admin, billing } = await unauthenticated.admin(shop);
    const licenseState = await syncShopLicenseFromBilling({ shop, billing });
    const shopEligibility = await loadShopEligibility(admin);
    const runtimeEnabled = shopEligibility.eligible && isLicenseActive(licenseState);
    const transformStatus = runtimeEnabled
      ? await ensureTipCartTransform(admin)
      : { active: false };
    await syncTipConfigEnabled(admin, runtimeEnabled, transformStatus.active);
  } catch (error) {
    console.error(`Failed to sync one-time purchase for ${shop}`, error);
  }

  return new Response();
};
