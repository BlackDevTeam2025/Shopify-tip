import { authenticate, unauthenticated } from "../shopify.server";
import {
  isLicenseActive,
  syncShopLicenseFromSubscriptionWebhook,
} from "../billing/license.server.js";
import { syncTipConfigEnabled } from "../tip-config.server.js";
import { ensureTipCartTransform } from "../cart-transform.server.js";
import { loadShopEligibility } from "../billing/shop-eligibility.server.js";

export const loader = async () =>
  new Response(null, {
    status: 401,
    statusText: "Unauthorized",
  });

export const action = async ({ request }) => {
  const { payload, shop, topic } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  try {
    const { admin } = await unauthenticated.admin(shop);
    const licenseState = await syncShopLicenseFromSubscriptionWebhook({
      shop,
      payload,
      admin,
    });
    const shopEligibility = await loadShopEligibility(admin);
    const runtimeEnabled =
      shopEligibility.eligible && isLicenseActive(licenseState);
    const transformStatus = runtimeEnabled
      ? await ensureTipCartTransform(admin)
      : { active: false };
    await syncTipConfigEnabled(admin, runtimeEnabled, transformStatus.active);
  } catch (error) {
    console.error(`Failed to sync app subscription for ${shop}`, error);
  }

  return new Response();
};
