import { authenticate } from "../shopify.server.js";

export const action = async ({ request }) => {
  const { payload, shop, topic } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);
  console.log(
    `No locally stored customer records to redact for ${shop}. Customer id: ${
      payload?.customer?.id ?? payload?.customer?.admin_graphql_api_id ?? "n/a"
    }`,
  );

  return new Response(null, { status: 200 });
};

