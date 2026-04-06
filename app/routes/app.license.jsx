import { Form, redirect, useLoaderData, useNavigation } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";

import { getLifetimePlanDetails } from "../billing/config.server";
import { authenticateBillingRoute } from "../billing/gate.server";
import { buildLicensePageState } from "../billing/license-page.server";
import {
  isLicenseActive,
  syncShopLicenseFromBilling,
} from "../billing/license.server";
import {
  shouldBypassBilling,
  shouldUseTestCharge,
} from "../billing/env.server";

function formatMoney(amount, currencyCode) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
  }).format(amount);
}

function throwEmbeddedRedirect(adminContext, url) {
  if (typeof adminContext?.redirect === "function") {
    const response = adminContext.redirect(url);
    throw response;
  }

  throw redirect(url);
}

export const loader = async ({ request }) => {
  const adminContext = await authenticateBillingRoute(request);
  const { licenseState, shopEligibility } = adminContext;

  if (shopEligibility.eligible && isLicenseActive(licenseState)) {
    throwEmbeddedRedirect(adminContext, "/app");
  }

  return {
    ...getLifetimePlanDetails(),
    ...buildLicensePageState({ shopEligibility, licenseState }),
    shopEligibility,
  };
};

export const action = async ({ request }) => {
  if (shouldBypassBilling()) {
    const adminContext = await authenticateBillingRoute(request);
    throwEmbeddedRedirect(
      adminContext,
      adminContext.shopEligibility.eligible ? "/app" : "/app/license",
    );
  }

  const adminContext = await authenticateBillingRoute(request);
  const { billing, session, shopEligibility } = adminContext;

  if (!shopEligibility.eligible) {
    throwEmbeddedRedirect(adminContext, "/app/license");
  }

  const currentLicense = await syncShopLicenseFromBilling({
    shop: session.shop,
    billing,
  });

  if (isLicenseActive(currentLicense)) {
    throwEmbeddedRedirect(adminContext, "/app");
  }

  await billing.request({
    plan: getLifetimePlanDetails().plan,
    isTest: shouldUseTestCharge(),
    returnUrl: new URL("/app/license/confirm", request.url).toString(),
  });

  return null;
};

export default function LicensePage() {
  const {
    amount,
    currencyCode,
    mode,
    planDisplayName,
    worksForPlusStoresMessage,
  } = useLoaderData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const formattedPrice = formatMoney(amount, currencyCode);
  const isIneligible = mode === "ineligible";

  return (
    <s-page heading={isIneligible ? "Shopify Plus Required" : "Unlock Tip App"}>
      <s-grid columns="2fr 1fr" gap="base">
        <s-section
          heading={
            isIneligible
              ? "This store isn't eligible yet."
              : "One purchase. Ongoing access."
          }
        >
          <s-stack direction="block" gap="base">
            <s-box
              padding="base"
              borderWidth="base"
              borderRadius="base"
              background="subdued"
            >
              <s-stack direction="block" gap="base">
                <s-text type="strong">
                  {isIneligible
                    ? "This app works for Shopify Plus stores."
                    : "Activate the tip experience for a Shopify Plus store"}
                </s-text>
                <s-text tone="subdued">
                  {isIneligible
                    ? `The current shop is on the ${planDisplayName} plan. Upgrade to Shopify Plus to buy this app and use the checkout tip experience.`
                    : "This one-time purchase unlocks the embedded tip app, app settings, and checkout runtime config for eligible stores. This app works for Shopify Plus stores."}
                </s-text>
                <s-grid columns="1fr 1fr" gap="base">
                  <s-box
                    padding="base"
                    borderWidth="base"
                    borderRadius="base"
                    background="base"
                  >
                    <s-stack direction="block" gap="small">
                      <s-text type="strong">
                        {isIneligible ? planDisplayName : formattedPrice}
                      </s-text>
                      <s-text tone="subdued">
                        {isIneligible
                          ? "Detected current plan"
                          : "One-time lifetime license"}
                      </s-text>
                    </s-stack>
                  </s-box>
                  <s-box
                    padding="base"
                    borderWidth="base"
                    borderRadius="base"
                    background="base"
                  >
                    <s-stack direction="block" gap="small">
                      <s-text type="strong">
                        {isIneligible
                          ? "Eligibility requirement"
                          : "What unlocks"}
                      </s-text>
                      <s-text tone="subdued">
                        {isIneligible
                          ? worksForPlusStoresMessage
                          : "Billing gate, settings access, and checkout runtime config"}
                      </s-text>
                    </s-stack>
                  </s-box>
                </s-grid>
              </s-stack>
            </s-box>

            <s-box
              padding="base"
              borderWidth="base"
              borderRadius="base"
              background="base"
            >
              <s-stack direction="block" gap="small">
                <s-text type="strong">
                  {isIneligible
                    ? "Before you can buy"
                    : "Included with your license"}
                </s-text>
                <s-unordered-list>
                  <s-list-item>
                    {isIneligible
                      ? "Upgrade the shop to Shopify Plus"
                      : "Configure tip copy and presets from the app"}
                  </s-list-item>
                  <s-list-item>
                    {isIneligible
                      ? "Reopen the app after the plan change is active"
                      : "Use one runtime config across admin and checkout"}
                  </s-list-item>
                  <s-list-item>
                    {isIneligible
                      ? "Buy the app once the store is eligible"
                      : "Keep checkout placement flexible inside Shopify"}
                  </s-list-item>
                </s-unordered-list>
              </s-stack>
            </s-box>
          </s-stack>
        </s-section>

        <s-section heading={isIneligible ? "Availability" : "Purchase"}>
          <s-box
            padding="base"
            borderWidth="base"
            borderRadius="base"
            background="base"
          >
            <s-stack direction="block" gap="base">
              <s-text type="strong">
                {isIneligible
                  ? "Shopify Plus is required"
                  : "Ready to unlock this store?"}
              </s-text>
              <s-text tone="subdued">
                {isIneligible
                  ? "The one-time purchase button is hidden because this app works for Shopify Plus stores."
                  : "Shopify will open a secure approval screen and bring you back here after payment."}
              </s-text>
              <s-box
                padding="base"
                borderWidth="base"
                borderRadius="base"
                background="subdued"
              >
                <s-stack direction="block" gap="small">
                  <s-text type="strong">
                    {isIneligible ? "Shopify Plus" : formattedPrice}
                  </s-text>
                  <s-text tone="subdued">
                    {isIneligible
                      ? "Required before purchase is available"
                      : "Billed once through Shopify"}
                  </s-text>
                </s-stack>
              </s-box>
              {isIneligible ? (
                <s-banner tone="warning">
                  Upgrade this store to Shopify Plus, then come back to purchase
                  the app.
                </s-banner>
              ) : (
                <Form method="post">
                  <s-button
                    type="submit"
                    variant="primary"
                    loading={isSubmitting}
                  >
                    {isSubmitting ? "Redirecting..." : "Unlock app forever"}
                  </s-button>
                </Form>
              )}
            </s-stack>
          </s-box>
        </s-section>
      </s-grid>
    </s-page>
  );
}

export const headers = (args) => boundary.headers(args);
