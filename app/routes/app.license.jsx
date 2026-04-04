import { Form, redirect, useLoaderData, useNavigation } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";

import { getLifetimePlanDetails } from "../billing/config.server";
import { authenticateBillingRoute } from "../billing/gate.server";
import { isLicenseActive, syncShopLicenseFromBilling } from "../billing/license.server";
import { shouldBypassBilling, shouldUseTestCharge } from "../billing/env.server";

function formatMoney(amount, currencyCode) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
  }).format(amount);
}

export const loader = async ({ request }) => {
  const { licenseState } = await authenticateBillingRoute(request);

  if (isLicenseActive(licenseState)) {
    throw redirect("/app");
  }

  return {
    ...getLifetimePlanDetails(),
    licenseStatus: licenseState?.licenseStatus ?? "none",
  };
};

export const action = async ({ request }) => {
  if (shouldBypassBilling()) {
    throw redirect("/app");
  }

  const { billing, session } = await authenticateBillingRoute(request);
  const currentLicense = await syncShopLicenseFromBilling({
    shop: session.shop,
    billing,
  });

  if (isLicenseActive(currentLicense)) {
    throw redirect("/app");
  }

  await billing.request({
    plan: getLifetimePlanDetails().plan,
    isTest: shouldUseTestCharge(),
    returnUrl: new URL("/app/license/confirm", request.url).toString(),
  });

  return null;
};

export default function LicensePage() {
  const { amount, currencyCode } = useLoaderData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const formattedPrice = formatMoney(amount, currencyCode);

  return (
    <s-page heading="Unlock Tip App">
      <s-grid columns="2fr 1fr" gap="base">
        <s-section heading="One purchase. Ongoing access.">
          <s-stack direction="block" gap="base">
            <s-box
              padding="base"
              borderWidth="base"
              borderRadius="base"
              background="subdued"
            >
              <s-stack direction="block" gap="base">
                <s-text type="strong">Activate the tip experience for this store</s-text>
                <s-text tone="subdued">
                  Unlock the embedded app, manage tip content from your app settings,
                  and keep checkout placement in Shopify's editor.
                </s-text>
                <s-grid columns="1fr 1fr" gap="base">
                  <s-box
                    padding="base"
                    borderWidth="base"
                    borderRadius="base"
                    background="base"
                  >
                    <s-stack direction="block" gap="small">
                      <s-text type="strong">{formattedPrice}</s-text>
                      <s-text tone="subdued">One-time lifetime license</s-text>
                    </s-stack>
                  </s-box>
                  <s-box
                    padding="base"
                    borderWidth="base"
                    borderRadius="base"
                    background="base"
                  >
                    <s-stack direction="block" gap="small">
                      <s-text type="strong">What unlocks</s-text>
                      <s-text tone="subdued">
                        Billing gate, settings access, and checkout runtime config
                      </s-text>
                    </s-stack>
                  </s-box>
                </s-grid>
              </s-stack>
            </s-box>

            <s-box padding="base" borderWidth="base" borderRadius="base" background="base">
              <s-stack direction="block" gap="small">
                <s-text type="strong">Included with your license</s-text>
                <s-unordered-list>
                  <s-list-item>Configure tip copy and presets from the app</s-list-item>
                  <s-list-item>Use one runtime config across admin and checkout</s-list-item>
                  <s-list-item>Keep checkout placement flexible inside Shopify</s-list-item>
                </s-unordered-list>
              </s-stack>
            </s-box>
          </s-stack>
        </s-section>

        <s-section heading="Purchase">
          <s-box
            padding="base"
            borderWidth="base"
            borderRadius="base"
            background="base"
          >
            <s-stack direction="block" gap="base">
              <s-text type="strong">Ready to unlock this store?</s-text>
              <s-text tone="subdued">
                Shopify will open a secure approval screen and bring you back here after payment.
              </s-text>
              <s-box
                padding="base"
                borderWidth="base"
                borderRadius="base"
                background="subdued"
              >
                <s-stack direction="block" gap="small">
                  <s-text type="strong">{formattedPrice}</s-text>
                  <s-text tone="subdued">Billed once through Shopify</s-text>
                </s-stack>
              </s-box>
              <Form method="post">
                <s-button type="submit" variant="primary" loading={isSubmitting}>
                  {isSubmitting ? "Redirecting..." : "Unlock app forever"}
                </s-button>
              </Form>
            </s-stack>
          </s-box>
        </s-section>
      </s-grid>
    </s-page>
  );
}

export const headers = (args) => boundary.headers(args);