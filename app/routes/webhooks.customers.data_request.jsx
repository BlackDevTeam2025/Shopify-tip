import { authenticate } from "../shopify.server.js";

export const action = async ({ request }) => {
  const { payload, shop, topic } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);
  console.log(
    `No locally stored customer records to export for ${shop}. Requested orders: ${
      Array.isArray(payload?.orders_requested)
        ? payload.orders_requested.length
        : 0
    }`,
  );

  return new Response(null, { status: 200 });
};

