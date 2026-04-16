import { authenticate } from "../shopify.server";
import db from "../db.server";
import { clearShopLicense } from "../billing/license.server";

export const loader = async () =>
  new Response(null, {
    status: 401,
    statusText: "Unauthorized",
  });

export const action = async ({ request }) => {
  const { shop, session, topic } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  // Webhook requests can trigger multiple times and after an app has already been uninstalled.
  // If this webhook already ran, the session may have been deleted previously.
  if (session) {
    await db.session.deleteMany({ where: { shop } });
  }

  await clearShopLicense(shop);

  return new Response();
};
