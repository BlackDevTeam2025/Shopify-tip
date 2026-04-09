import { authenticate, unauthenticated } from "../shopify.server";
import { loadTipConfig } from "../tip-config.server.js";
import { upsertPaidTipMetric } from "../tip-metrics.server.js";

export const action = async ({ request }) => {
  const { payload, shop, topic } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  try {
    const { admin } = await unauthenticated.admin(shop);
    const config = await loadTipConfig(admin);

    await upsertPaidTipMetric({
      shop,
      payload,
      tipVariantId: config.tip_variant_id,
    });
  } catch (error) {
    console.error(`Failed to sync paid tip metrics for ${shop}`, error);
  }

  return new Response();
};
