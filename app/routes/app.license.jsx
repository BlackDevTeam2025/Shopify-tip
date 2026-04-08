import { useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";

import {
  getManagedPricingDetails,
  getManagedPricingUrl,
} from "../billing/config.server.js";
import { authenticateBillingRoute } from "../billing/gate.server";
import { buildLicensePageState } from "../billing/license-page.server";
import { isLicenseActive } from "../billing/license.server";

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

  throw new Response(null, {
    status: 302,
    headers: {
      Location: url,
    },
  });
}

export const loader = async ({ request }) => {
  const adminContext = await authenticateBillingRoute(request);
  const { licenseState, session, shopEligibility } = adminContext;

  if (shopEligibility.eligible && isLicenseActive(licenseState)) {
    throwEmbeddedRedirect(adminContext, "/app");
  }

  return {
    ...getManagedPricingDetails(),
    ...buildLicensePageState({ shopEligibility, licenseState }),
    pricingUrl: getManagedPricingUrl(session.shop),
    shopEligibility,
  };
};

export default function LicensePage() {
  const {
    monthly,
    yearly,
    trialDays,
    mode,
    planDisplayName,
    pricingUrl,
    worksForPlusStoresMessage,
  } = useLoaderData();
  const isIneligible = mode === "ineligible";
  const hasBillingIssue = mode === "billing_issue";

  return (
    <s-page heading={isIneligible ? "Shopify Plus Required" : "Choose a plan"}>
      <s-grid columns="2fr 1fr" gap="base">
        <s-section
          heading={
            isIneligible
              ? "This store isn't eligible yet."
              : hasBillingIssue
                ? "Update billing to restore app access."
                : `Start with a ${trialDays}-day free trial.`
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
                    : hasBillingIssue
                      ? "Your subscription needs attention."
                      : "Shopify will host plan selection and trial approval."}
                </s-text>
                <s-text tone="subdued">
                  {isIneligible
                    ? `The current shop is on the ${planDisplayName} plan. Upgrade to Shopify Plus to subscribe and use the checkout tip experience.`
                    : hasBillingIssue
                      ? "Shopify marked the current subscription as frozen. Open the hosted pricing page to update billing and restore access."
                      : "Choose a monthly or yearly subscription on Shopify's hosted pricing page, then return here after approval."}
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
                        {isIneligible
                          ? planDisplayName
                          : `${formatMoney(monthly.amount, monthly.currencyCode)}/${monthly.intervalLabel}`}
                      </s-text>
                      <s-text tone="subdued">
                        {isIneligible ? "Detected current plan" : "Monthly plan"}
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
                          : `${formatMoney(yearly.amount, yearly.currencyCode)}/${yearly.intervalLabel}`}
                      </s-text>
                      <s-text tone="subdued">
                        {isIneligible ? worksForPlusStoresMessage : yearly.badge}
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
                  {isIneligible ? "Before you can subscribe" : "Included with every plan"}
                </s-text>
                <s-unordered-list>
                  <s-list-item>
                    {isIneligible
                      ? "Upgrade the shop to Shopify Plus"
                      : `${trialDays}-day free trial before the first recurring charge`}
                  </s-list-item>
                  <s-list-item>
                    {isIneligible
                      ? "Reopen the app after the plan change is active"
                      : "Tip settings, checkout runtime, and managed app access"}
                  </s-list-item>
                  <s-list-item>
                    {isIneligible
                      ? "Open the hosted pricing page once the store is eligible"
                      : `${formatMoney(monthly.amount, monthly.currencyCode)}/month or ${formatMoney(yearly.amount, yearly.currencyCode)}/year`}
                  </s-list-item>
                </s-unordered-list>
              </s-stack>
            </s-box>
          </s-stack>
        </s-section>

        <s-section heading={isIneligible ? "Availability" : "Subscription"}>
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
                  : hasBillingIssue
                    ? "Manage your plan"
                    : "Choose monthly or yearly billing"}
              </s-text>
              <s-text tone="subdued">
                {isIneligible
                  ? "Subscription is unavailable because this app works for Shopify Plus stores."
                  : hasBillingIssue
                    ? "Open Shopify's pricing page to resolve the frozen subscription."
                    : `Start with a ${trialDays}-day free trial, then continue on the plan that fits this store.`}
              </s-text>
              <s-box
                padding="base"
                borderWidth="base"
                borderRadius="base"
                background="subdued"
              >
                <s-stack direction="block" gap="small">
                  <s-text type="strong">{yearly.badge}</s-text>
                  <s-text tone="subdued">
                    {`${formatMoney(monthly.amount, monthly.currencyCode)}/${monthly.intervalLabel} or ${formatMoney(yearly.amount, yearly.currencyCode)}/${yearly.intervalLabel}`}
                  </s-text>
                </s-stack>
              </s-box>
              {isIneligible ? null : (
                <a
                  href={pricingUrl}
                  target="_top"
                  rel="noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "44px",
                    padding: "0 16px",
                    borderRadius: "12px",
                    background: "#111827",
                    color: "#ffffff",
                    textDecoration: "none",
                    fontWeight: 700,
                  }}
                >
                  {hasBillingIssue ? "Open billing" : "Choose a plan"}
                </a>
              )}
            </s-stack>
          </s-box>
        </s-section>
      </s-grid>
    </s-page>
  );
}

export const headers = (args) => boundary.headers(args);
