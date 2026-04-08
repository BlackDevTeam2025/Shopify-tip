import { useEffect, useMemo, useState } from "react";
import { useFetcher, useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";

import { authenticateBillingRoute } from "../billing/gate.server";
import { isLicenseActive } from "../billing/license.server.js";
import { ensureTipCartTransform } from "../cart-transform.server.js";

const styles = {
  page: {
    display: "grid",
    gap: "20px",
    maxWidth: "980px",
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
  },
  card: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "28px",
    boxShadow: "0 20px 45px rgba(15, 23, 42, 0.06)",
    overflow: "hidden",
  },
  cardHeader: {
    padding: "26px 30px 18px",
    borderBottom: "1px solid #eef2f7",
    display: "grid",
    gap: "8px",
  },
  body: {
    padding: "28px 30px",
    display: "grid",
    gap: "22px",
  },
  contentGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "18px",
  },
  toggleCard: {
    display: "flex",
    alignItems: "flex-start",
    gap: "14px",
    padding: "0",
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
  presetsPanel: {
    display: "grid",
    gap: "18px",
    padding: "22px",
    borderRadius: "20px",
    border: "1px solid #e5e7eb",
    background: "#f8fafc",
  },
  presetsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "18px",
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
  },
  inputWrap: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    alignItems: "center",
    borderRadius: "16px",
    border: "1px solid #dbe1ea",
    background: "#ffffff",
    overflow: "hidden",
  },
  input: {
    width: "100%",
    border: "0",
    background: "transparent",
    color: "#111827",
    padding: "14px 16px",
    fontSize: "15px",
    lineHeight: 1.4,
    boxSizing: "border-box",
    outline: "none",
  },
  textarea: {
    width: "100%",
    minHeight: "104px",
    border: "1px solid #dbe1ea",
    borderRadius: "16px",
    background: "#ffffff",
    color: "#111827",
    padding: "14px 16px",
    fontSize: "15px",
    lineHeight: 1.6,
    boxSizing: "border-box",
    resize: "vertical",
    fontFamily: "inherit",
    outline: "none",
  },
  suffix: {
    padding: "0 16px",
    fontSize: "15px",
    color: "#4b5563",
    whiteSpace: "nowrap",
  },
  divider: {
    height: "1px",
    width: "100%",
    background: "#e5e7eb",
  },
  advancedDetails: {
    borderRadius: "18px",
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
  helper: {
    margin: 0,
    fontSize: "13px",
    lineHeight: 1.6,
    color: "#6b7280",
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

function splitPresetValues(csv) {
  const values = String(csv ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  return {
    preset_1: values[0] ?? "10",
    preset_2: values[1] ?? "15",
    preset_3: values[2] ?? "20",
  };
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
  const {
    buildTipConfigFromFormData,
    buildTipRuntimeConfig,
    loadTipConfig,
    saveTipConfig,
  } = await import("../tip-config.server.js");
  const { admin, licenseState, session } =
    await authenticateBillingRoute(request);
  const licenseActive = isLicenseActive(licenseState);
  const transformStatus = licenseActive
    ? await ensureTipCartTransform(admin, session?.scope)
    : { active: false, cartTransformId: null, errors: [] };
  const formData = await request.formData();
  const settings = buildTipConfigFromFormData(formData);
  const existingConfig = await loadTipConfig(admin, {
    enabled: licenseActive,
    transformActive: transformStatus.active,
  });
  const config = buildTipRuntimeConfig({
    savedConfig: {
      ...existingConfig,
      ...settings,
    },
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
  const presetValues = useMemo(
    () => splitPresetValues(draftConfig.tip_percentages),
    [draftConfig.tip_percentages],
  );

  useEffect(() => {
    setDraftConfig(cloneConfig(currentConfig));
  }, [currentConfig]);

  const updateDraft = (field, value) => {
    setDraftConfig((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const updatePreset = (field, value) => {
    const nextValues = {
      ...splitPresetValues(draftConfig.tip_percentages),
      [field]: value,
    };

    updateDraft(
      "tip_percentages",
      [nextValues.preset_1, nextValues.preset_2, nextValues.preset_3].join(","),
    );
  };
  const infrastructureStatus =
    draftConfig.tip_infrastructure_status === "error"
      ? "Tip setup needs attention"
      : isLoading
        ? "Repairing tip setup"
        : "Tip setup ready";
  const infrastructureTone =
    draftConfig.tip_infrastructure_status === "error" ? "critical" : "success";
  const infrastructureMessage =
    draftConfig.tip_infrastructure_status === "error"
      ? draftConfig.tip_infrastructure_error ||
        "The app could not verify the internal tip product for this shop."
      : "The app manages the internal tip product and variant automatically.";

  return (
    <s-page title="Tip Settings">
      <div style={styles.page}>
        <div style={styles.hero}>
          <h1 style={styles.title}>Tipping</h1>
          <p style={styles.subtitle}>
            Edit the tip choices shown after the buyer opts in at checkout.
          </p>
        </div>

        <fetcher.Form method="POST" style={styles.card}>
          {transformStatus?.errors?.length > 0 ? (
            <div style={styles.cardHeader}>
              <s-banner tone="warning">
                {transformStatus.errors
                  .map((error) => error.message)
                  .join(", ")}
              </s-banner>
            </div>
          ) : null}

          <div style={styles.body}>
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
            <input type="hidden" name="custom_amount_enabled" value="on" />

            <label style={styles.toggleCard}>
              <input
                type="checkbox"
                checked={currentConfig.enabled}
                disabled
                readOnly
                style={styles.checkbox}
              />
              <div>
                <p style={styles.checkboxTitle}>
                  Show tipping options at checkout
                </p>
              </div>
            </label>

            <div style={styles.contentGrid}>
              <div style={styles.fieldGroup}>
                <label htmlFor="heading" style={styles.label}>
                  Title
                </label>
                <div style={styles.inputWrap}>
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
              </div>

              <div style={styles.fieldGroup}>
                <label htmlFor="cta_label" style={styles.label}>
                  Button label
                </label>
                <div style={styles.inputWrap}>
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
                <div style={styles.inputWrap}>
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

            <div style={styles.presetsPanel}>
              <s-banner tone={infrastructureTone}>
                <strong>{infrastructureStatus}</strong>
                <div>{infrastructureMessage}</div>
              </s-banner>

              <div style={styles.presetsGrid}>
                <div style={styles.fieldGroup}>
                  <label htmlFor="preset_1" style={styles.label}>
                    Preset 1
                  </label>
                  <div style={styles.inputWrap}>
                    <input
                      id="preset_1"
                      name="preset_1"
                      inputMode="decimal"
                      value={presetValues.preset_1}
                      onChange={(event) =>
                        updatePreset("preset_1", event.target.value)
                      }
                      style={styles.input}
                    />
                    <span style={styles.suffix}>%</span>
                  </div>
                </div>

                <div style={styles.fieldGroup}>
                  <label htmlFor="preset_2" style={styles.label}>
                    Preset 2
                  </label>
                  <div style={styles.inputWrap}>
                    <input
                      id="preset_2"
                      name="preset_2"
                      inputMode="decimal"
                      value={presetValues.preset_2}
                      onChange={(event) =>
                        updatePreset("preset_2", event.target.value)
                      }
                      style={styles.input}
                    />
                    <span style={styles.suffix}>%</span>
                  </div>
                </div>

                <div style={styles.fieldGroup}>
                  <label htmlFor="preset_3" style={styles.label}>
                    Preset 3
                  </label>
                  <div style={styles.inputWrap}>
                    <input
                      id="preset_3"
                      name="preset_3"
                      inputMode="decimal"
                      value={presetValues.preset_3}
                      onChange={(event) =>
                        updatePreset("preset_3", event.target.value)
                      }
                      style={styles.input}
                    />
                    <span style={styles.suffix}>%</span>
                  </div>
                </div>
              </div>
            </div>
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
