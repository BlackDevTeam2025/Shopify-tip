import { authenticate } from "../shopify.server";
import { cancelTipMetric } from "../tip-metrics.server.js";

export const action = async ({ request }) => {
  const { payload, shop, topic } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  try {
    await cancelTipMetric({
      shop,
      payload,
    });
  } catch (error) {
    console.error(`Failed to sync cancelled tip metrics for ${shop}`, error);
  }

  return new Response();
};
