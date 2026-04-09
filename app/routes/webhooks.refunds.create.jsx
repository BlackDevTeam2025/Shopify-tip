import { authenticate, unauthenticated } from "../shopify.server";
import { loadTipConfig } from "../tip-config.server.js";
import { applyRefundTipMetric } from "../tip-metrics.server.js";

export const action = async ({ request }) => {
  const { payload, shop, topic } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  try {
    const { admin } = await unauthenticated.admin(shop);
    const config = await loadTipConfig(admin);

    await applyRefundTipMetric({
      shop,
      payload,
      tipVariantId: config.tip_variant_id,
    });
  } catch (error) {
    console.error(`Failed to sync refunded tip metrics for ${shop}`, error);
  }

  return new Response();
};
