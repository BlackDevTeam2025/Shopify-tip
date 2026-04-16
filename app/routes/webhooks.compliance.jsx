import { eraseShopData } from "../compliance.server.js";
import { authenticate } from "../shopify.server.js";

export const loader = async () =>
  new Response(null, {
    status: 401,
    statusText: "Unauthorized",
  });

export const action = async ({ request }) => {
  const { payload, shop, topic } = await authenticate.webhook(request);

  console.log(`Received ${topic} compliance webhook for ${shop}`);

  switch (topic) {
    case "CUSTOMERS_DATA_REQUEST":
      console.log(
        `No locally stored customer records to export for ${shop}. Requested orders: ${
          Array.isArray(payload?.orders_requested)
            ? payload.orders_requested.length
            : 0
        }`,
      );
      return new Response(null, { status: 200 });

    case "CUSTOMERS_REDACT":
      console.log(
        `No locally stored customer records to redact for ${shop}. Customer id: ${
          payload?.customer?.id ??
          payload?.customer?.admin_graphql_api_id ??
          "n/a"
        }`,
      );
      return new Response(null, { status: 200 });

    case "SHOP_REDACT":
      try {
        await eraseShopData(shop);
        return new Response(null, { status: 200 });
      } catch (error) {
        console.error(`Failed to redact local shop data for ${shop}`, error);
        return new Response(null, { status: 500 });
      }

    default:
      console.warn(`Unhandled compliance webhook topic ${topic} for ${shop}`);
      return new Response(null, { status: 200 });
  }
};
