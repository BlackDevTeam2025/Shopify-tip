import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { syncLandingInstallation } from "../landing-install-sync.server";

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  await syncLandingInstallation({ admin, session, source: "auth_callback" });

  return null;
};

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
