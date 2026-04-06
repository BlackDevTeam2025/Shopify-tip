import { useEffect, useState } from "react";
import { useFetcher, useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";

import { authenticateBillingRoute } from "../billing/gate.server";
import { isLicenseActive } from "../billing/license.server.js";
import { ensureTipCartTransform } from "../cart-transform.server.js";

const styles = {
  page: {
    display: "grid",
    gap: "24px",
    maxWidth: "920px",
    margin: "0 auto",
    width: "100%",
  },
  hero: {
    display: "grid",
    gap: "8px",
  },
  title: {
    margin: 0,
    fontSize: "38px",
    lineHeight: 1.08,
    fontWeight: 800,
    letterSpacing: "-0.04em",
    color: "#111827",
  },
  subtitle: {
    margin: 0,
    fontSize: "16px",
    lineHeight: 1.7,
    color: "#4b5563",
    maxWidth: "52rem",
  },
  card: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "28px",
    boxShadow: "0 20px 45px rgba(15, 23, 42, 0.06)",
    overflow: "hidden",
  },
  cardHeader: {
    padding: "28px 30px 20px",
    borderBottom: "1px solid #eef2f7",
    display: "grid",
    gap: "10px",
  },
  cardBody: {
    padding: "28px 30px",
    display: "grid",
    gap: "24px",
  },
  section: {
    display: "grid",
    gap: "14px",
  },
  sectionTitle: {
    margin: 0,
    fontSize: "16px",
    fontWeight: 800,
    color: "#111827",
  },
  sectionBody: {
    margin: 0,
    fontSize: "14px",
    lineHeight: 1.6,
    color: "#6b7280",
  },
  statusStrip: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "12px",
  },
  statusBox: {
    borderRadius: "18px",
    border: "1px solid #e5e7eb",
    background: "#f8fafc",
    padding: "16px",
    display: "grid",
    gap: "6px",
  },
  statusLabel: {
    margin: 0,
    fontSize: "12px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#6b7280",
  },
  statusValue: {
    margin: 0,
    fontSize: "15px",
    fontWeight: 700,
    color: "#111827",
  },
  fieldGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "18px 20px",
  },
  fieldGroup: {
    display: "grid",
    gap: "8px",
  },
  fieldFull: {
    gridColumn: "1 / -1",
  },
  label: {
    fontSize: "13px",
    fontWeight: 700,
    color: "#111827",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  input: {
    width: "100%",
    borderRadius: "16px",
    border: "1px solid #dbe1ea",
    background: "#ffffff",
    color: "#111827",
    padding: "14px 16px",
    fontSize: "15px",
    lineHeight: 1.4,
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    minHeight: "108px",
    borderRadius: "16px",
    border: "1px solid #dbe1ea",
    background: "#ffffff",
    color: "#111827",
    padding: "14px 16px",
    fontSize: "15px",
    lineHeight: 1.6,
    boxSizing: "border-box",
    resize: "vertical",
    fontFamily: "inherit",
  },
  toggleCard: {
    display: "flex",
    alignItems: "flex-start",
    gap: "14px",
    padding: "16px 18px",
    borderRadius: "18px",
    border: "1px solid #dbe1ea",
    background: "#ffffff",
  },
  checkbox: {
    width: "20px",
    height: "20px",
    marginTop: "2px",
  },
  checkboxTitle: {
    margin: 0,
    fontSize: "15px",
    fontWeight: 700,
    color: "#111827",
  },
  checkboxHelp: {
    margin: 0,
    fontSize: "14px",
    lineHeight: 1.6,
    color: "#6b7280",
  },
  advancedDetails: {
    borderRadius: "20px",
    border: "1px solid #e5e7eb",
    background: "#fbfcfd",
    padding: "18px 20px",
  },
  advancedSummary: {
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: 700,
    color: "#111827",
  },
  actionBar: {
    padding: "20px 30px",
    borderTop: "1px solid #eef2f7",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
    background: "#fafbfc",
  },
  actionMeta: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    alignItems: "center",
  },
};

function cloneConfig(config) {
  return { ...config };
}

export const loader = async ({ request }) => {
  const { buildTipRuntimeConfig, loadTipConfig, saveTipConfig } =
    await import("../tip-config.server.js");
  const { admin, licenseState, session } =
    await authenticateBillingRoute(request);
  const licenseActive = isLicenseActive(licenseState);
  const transformStatus = licenseActive
    ? await ensureTipCartTransform(admin, session?.scope)
    : { active: false, cartTransformId: null, errors: [] };
  const storedConfig = await loadTipConfig(admin, {
    enabled: licenseActive,
  });

  if (storedConfig.transform_active !== transformStatus.active) {
    await saveTipConfig(
      admin,
      buildTipRuntimeConfig({
        savedConfig: storedConfig,
        enabled: licenseActive,
        transformActive: transformStatus.active,
      }),
    );
  }

  return {
    config: buildTipRuntimeConfig({
      savedConfig: storedConfig,
      enabled: licenseActive,
      transformActive: transformStatus.active,
    }),
    transformStatus,
  };
};

export const action = async ({ request }) => {
  const { buildTipConfigFromFormData, buildTipRuntimeConfig, saveTipConfig } =
    await import("../tip-config.server.js");
  const { admin, licenseState, session } =
    await authenticateBillingRoute(request);
  const licenseActive = isLicenseActive(licenseState);
  const transformStatus = licenseActive
    ? await ensureTipCartTransform(admin, session?.scope)
    : { active: false, cartTransformId: null, errors: [] };
  const formData = await request.formData();
  const settings = buildTipConfigFromFormData(formData);
  const config = buildTipRuntimeConfig({
    savedConfig: settings,
    enabled: licenseActive,
    transformActive: transformStatus.active,
  });

  const result = await saveTipConfig(admin, config);
  return {
    ...result,
    saved: result.errors.length === 0,
    transformStatus,
  };
};

export default function TipBlockSettings() {
  const loaderData = useLoaderData();
  const fetcher = useFetcher();
  const currentConfig = fetcher.data?.config ?? loaderData.config;
  const transformStatus =
    fetcher.data?.transformStatus ?? loaderData.transformStatus;
  const [draftConfig, setDraftConfig] = useState(() =>
    cloneConfig(currentConfig),
  );
  const isLoading = fetcher.state === "submitting";
  const saved = fetcher.data?.saved === true;
  const errors = fetcher.data?.errors;
  const isDirty = JSON.stringify(draftConfig) !== JSON.stringify(currentConfig);

  useEffect(() => {
    setDraftConfig(cloneConfig(currentConfig));
  }, [currentConfig]);

  const updateDraft = (field, value) => {
    setDraftConfig((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  return (
    <s-page title="Tip Settings">
      <div style={styles.page}>
        <div style={styles.hero}>
          <h1 style={styles.title}>Tipping</h1>
          <p style={styles.subtitle}>
            Configure the checkout tip block. This screen now only keeps the
            runtime settings that materially affect the buyer experience.
          </p>
        </div>

        <fetcher.Form method="POST" style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={styles.statusStrip}>
              <div style={styles.statusBox}>
                <p style={styles.statusLabel}>Billing</p>
                <p style={styles.statusValue}>
                  {currentConfig.enabled ? "Active" : "Blocked"}
                </p>
              </div>
              <div style={styles.statusBox}>
                <p style={styles.statusLabel}>Cart Transform</p>
                <p style={styles.statusValue}>
                  {transformStatus?.active ? "Active" : "Not active"}
                </p>
              </div>
            </div>
            {transformStatus?.errors?.length > 0 ? (
              <s-banner tone="warning">
                {transformStatus.errors
                  .map((error) => error.message)
                  .join(", ")}
              </s-banner>
            ) : null}
          </div>

          <div style={styles.cardBody}>
            <input
              type="hidden"
              name="custom_text_color"
              value={draftConfig.custom_text_color}
            />
            <input
              type="hidden"
              name="custom_border_color"
              value={draftConfig.custom_border_color}
            />

            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Checkout copy</h2>
              <p style={styles.sectionBody}>
                Fixed presets stay at 15%, 18%, 25%, Custom, and None. You only
                edit the text and behavior here.
              </p>
              <div style={styles.fieldGrid}>
                <div style={styles.fieldGroup}>
                  <label htmlFor="heading" style={styles.label}>
                    Heading
                  </label>
                  <input
                    id="heading"
                    name="heading"
                    value={draftConfig.heading}
                    onChange={(event) =>
                      updateDraft("heading", event.target.value)
                    }
                    style={styles.input}
                    placeholder="Add tip"
                  />
                </div>

                <div style={styles.fieldGroup}>
                  <label htmlFor="cta_label" style={styles.label}>
                    Button label
                  </label>
                  <input
                    id="cta_label"
                    name="cta_label"
                    value={draftConfig.cta_label}
                    onChange={(event) =>
                      updateDraft("cta_label", event.target.value)
                    }
                    style={styles.input}
                    placeholder="Add tip"
                  />
                </div>

                <div style={{ ...styles.fieldGroup, ...styles.fieldFull }}>
                  <label htmlFor="support_text" style={styles.label}>
                    Support text
                  </label>
                  <textarea
                    id="support_text"
                    name="support_text"
                    value={draftConfig.support_text}
                    onChange={(event) =>
                      updateDraft("support_text", event.target.value)
                    }
                    style={styles.textarea}
                    placeholder="Show your support for the team."
                  />
                </div>

                <div style={{ ...styles.fieldGroup, ...styles.fieldFull }}>
                  <label htmlFor="thank_you_text" style={styles.label}>
                    Thank you text
                  </label>
                  <input
                    id="thank_you_text"
                    name="thank_you_text"
                    value={draftConfig.thank_you_text}
                    onChange={(event) =>
                      updateDraft("thank_you_text", event.target.value)
                    }
                    style={styles.input}
                    placeholder="THANK YOU, WE APPRECIATE IT."
                  />
                </div>
              </div>
            </div>

            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Behavior</h2>
              <div style={styles.section}>
                <label style={styles.toggleCard}>
                  <input
                    type="checkbox"
                    name="hide_until_opt_in"
                    checked={draftConfig.hide_until_opt_in}
                    onChange={(event) =>
                      updateDraft("hide_until_opt_in", event.target.checked)
                    }
                    style={styles.checkbox}
                  />
                  <div>
                    <p style={styles.checkboxTitle}>
                      Hide tip choices until the buyer opts in
                    </p>
                    <p style={styles.checkboxHelp}>
                      Starts collapsed, then reveals the full choice set after
                      the buyer opens the block.
                    </p>
                  </div>
                </label>

                <label style={styles.toggleCard}>
                  <input
                    type="checkbox"
                    name="custom_amount_enabled"
                    checked={draftConfig.custom_amount_enabled}
                    onChange={(event) =>
                      updateDraft("custom_amount_enabled", event.target.checked)
                    }
                    style={styles.checkbox}
                  />
                  <div>
                    <p style={styles.checkboxTitle}>Allow custom amount</p>
                    <p style={styles.checkboxHelp}>
                      Keeps the buyer-entered custom tip amount field available.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <details style={styles.advancedDetails}>
              <summary style={styles.advancedSummary}>Advanced</summary>
              <div style={{ ...styles.section, marginTop: "18px" }}>
                <div style={styles.fieldGroup}>
                  <label htmlFor="tip_variant_id" style={styles.label}>
                    Tip variant ID
                  </label>
                  <input
                    id="tip_variant_id"
                    name="tip_variant_id"
                    value={draftConfig.tip_variant_id}
                    onChange={(event) =>
                      updateDraft("tip_variant_id", event.target.value)
                    }
                    style={styles.input}
                    placeholder="gid://shopify/ProductVariant/123456789"
                  />
                  <p style={styles.sectionBody}>
                    Required for the extension to add or update the tip line in
                    checkout.
                  </p>
                </div>
              </div>
            </details>
          </div>

          <div style={styles.actionBar}>
            <div style={styles.actionMeta}>
              {saved ? (
                <s-banner tone="success">Settings saved successfully.</s-banner>
              ) : null}
              {errors && errors.length > 0 ? (
                <s-banner tone="critical">
                  {errors.map((error) => error.message).join(", ")}
                </s-banner>
              ) : null}
            </div>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <s-button
                type="button"
                variant="secondary"
                disabled={!isDirty || isLoading}
                onClick={() => setDraftConfig(cloneConfig(currentConfig))}
              >
                Discard
              </s-button>
              <s-button type="submit" loading={isLoading} variant="primary">
                {isLoading ? "Saving..." : "Save settings"}
              </s-button>
            </div>
          </div>
        </fetcher.Form>
      </div>
    </s-page>
  );
}

export const headers = (args) => boundary.headers(args);
