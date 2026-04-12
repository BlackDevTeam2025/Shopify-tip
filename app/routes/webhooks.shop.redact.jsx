import { eraseShopData } from "../compliance.server.js";
import { authenticate } from "../shopify.server.js";

export const action = async ({ request }) => {
  const { shop, topic } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  try {
    await eraseShopData(shop);
    return new Response(null, { status: 200 });
  } catch (error) {
    console.error(`Failed to redact local shop data for ${shop}`, error);
    return new Response(null, { status: 500 });
  }
};

