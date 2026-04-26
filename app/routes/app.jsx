import {
  Outlet,
  useLoaderData,
  useLocation,
  useRouteError,
} from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { authenticateBillingRoute } from "../billing/gate.server";
import { appendEmbeddedSearch } from "../embedded-app-url.js";
import { syncLandingInstallation } from "../landing-install-sync.server";

export const loader = async ({ request }) => {
  const billingContext = await authenticateBillingRoute(request);
  const { admin, session, isLicenseRoute } = billingContext;
  await syncLandingInstallation({ admin, session, source: "app_loader" });

  // eslint-disable-next-line no-undef
  return {
    apiKey: process.env.SHOPIFY_API_KEY || "",
    showNav: !isLicenseRoute,
  };
};

export default function App() {
  const { apiKey, showNav } = useLoaderData();
  const location = useLocation();
  const homeHref = appendEmbeddedSearch("/app", location.search);
  const settingsHref = appendEmbeddedSearch(
    "/app/settings/tip-block",
    location.search,
  );

  return (
    <AppProvider embedded apiKey={apiKey}>
      {showNav ? (
        <s-app-nav>
          <s-link href={homeHref}>Home</s-link>
          <s-link href={settingsHref}>Setting</s-link>
        </s-app-nav>
      ) : null}
      <Outlet />
    </AppProvider>
  );
}

// Shopify needs React Router to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
