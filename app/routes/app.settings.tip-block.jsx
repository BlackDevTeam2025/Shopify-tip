import { useEffect, useMemo, useState } from "react";
import { useFetcher, useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";

import { authenticateBillingRoute } from "../billing/gate.server";
import { isLicenseActive } from "../billing/license.server.js";
import { ensureTipCartTransform } from "../cart-transform.server.js";
import {
  PREVIEW_SUBTOTAL,
  buildPreviewPresets,
  calculatePreviewTipAmount,
  formatPreviewCurrency,
  getPreviewSupportMessage,
  isPreviewCustomAmountValid,
  resolvePreviewDefaultSelection,
} from "../tip-preview.utils.js";

const responsiveLayoutStyles = `
  .tip-settings-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 428px;
    gap: 32px;
    align-items: start;
  }

  .tip-settings-preview-column {
    position: sticky;
    top: 20px;
  }

  @media (max-width: 1200px) {
    .tip-settings-layout {
      grid-template-columns: 1fr;
    }

    .tip-settings-preview-column {
      position: static;
      top: auto;
    }
  }
`;

const styles = {
  page: {
    display: "grid",
    gap: "28px",
    maxWidth: "1640px",
    margin: "0 auto",
    width: "100%",
    fontFamily:
      'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  layout: {
    display: "grid",
    gap: "28px",
    alignItems: "start",
  },
  hero: {
    display: "grid",
    gap: "8px",
  },
  title: {
    margin: 0,
    fontSize: "36px",
    lineHeight: 1.04,
    fontWeight: 700,
    letterSpacing: "-0.04em",
    color: "#111827",
  },
  subtitle: {
    margin: 0,
    fontSize: "15px",
    lineHeight: 1.55,
    color: "#6b7280",
  },
  eyebrow: {
    margin: 0,
    fontSize: "12px",
    lineHeight: 1.4,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#6b7280",
  },
  card: {
    background: "#ffffff",
    border: "1px solid #e6eaf0",
    borderRadius: "26px",
    boxShadow: "0 18px 42px rgba(15, 23, 42, 0.05)",
    overflow: "hidden",
  },
  cardHeader: {
    padding: "22px 28px 14px",
    borderBottom: "1px solid #eef2f7",
    display: "grid",
    gap: "8px",
  },
  body: {
    padding: "30px 32px 34px",
    display: "grid",
    gap: "22px",
  },
  sectionCard: {
    display: "grid",
    gap: "18px",
    padding: "24px",
    borderRadius: "22px",
    border: "1px solid #e6eaf0",
    background: "#ffffff",
  },
  sectionHeader: {
    display: "grid",
    gap: "4px",
  },
  sectionTitle: {
    margin: 0,
    fontSize: "17px",
    lineHeight: 1.3,
    fontWeight: 700,
    color: "#111827",
  },
  sectionDescription: {
    margin: 0,
    fontSize: "13px",
    lineHeight: 1.55,
    color: "#6b7280",
  },
  toggleRow: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "16px",
  },
  toggleCopy: {
    display: "grid",
    gap: "4px",
  },
  toggleTitle: {
    margin: 0,
    fontSize: "17px",
    lineHeight: 1.3,
    fontWeight: 700,
    color: "#111827",
  },
  toggleDescription: {
    margin: 0,
    fontSize: "13px",
    lineHeight: 1.55,
    color: "#6b7280",
  },
  checkbox: {
    width: "18px",
    height: "18px",
    marginTop: "2px",
  },
  presetsPanel: {
    display: "grid",
    gap: "18px",
    padding: "24px",
  },
  presetsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "16px",
  },
  compactRow: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "16px",
  },
  fieldGroup: {
    display: "grid",
    gap: "7px",
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
    borderRadius: "14px",
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
    fontSize: "14px",
    lineHeight: 1.4,
    boxSizing: "border-box",
    outline: "none",
  },
  textarea: {
    width: "100%",
    minHeight: "132px",
    border: "1px solid #dbe1ea",
    borderRadius: "14px",
    background: "#ffffff",
    color: "#111827",
    padding: "14px 16px",
    fontSize: "14px",
    lineHeight: 1.5,
    boxSizing: "border-box",
    outline: "none",
    resize: "vertical",
    fontFamily: "inherit",
  },
  select: {
    width: "100%",
    border: "1px solid #dbe1ea",
    borderRadius: "14px",
    background: "#ffffff",
    color: "#111827",
    padding: "14px 16px",
    fontSize: "14px",
    lineHeight: 1.4,
    boxSizing: "border-box",
    outline: "none",
  },
  suffix: {
    padding: "0 16px",
    fontSize: "14px",
    color: "#4b5563",
    whiteSpace: "nowrap",
  },
  actionBar: {
    padding: "18px 24px",
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
  actionButtons: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
  },
  previewCard: {
    border: "1px solid #e6eaf0",
    borderRadius: "24px",
    background: "#ffffff",
    boxShadow: "0 12px 30px rgba(15, 23, 42, 0.05)",
    overflow: "hidden",
  },
  previewHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    padding: "16px 18px",
    borderBottom: "1px solid #eef2f7",
    background: "#fafbfc",
  },
  previewTitle: {
    margin: 0,
    fontSize: "15px",
    fontWeight: 700,
    color: "#111827",
  },
  previewHeaderMeta: {
    margin: 0,
    fontSize: "12px",
    color: "#6b7280",
    fontWeight: 600,
  },
  previewBody: {
    display: "grid",
    gap: "14px",
    padding: "20px",
  },
  previewTipBlock: {
    display: "grid",
    gap: "12px",
    border: "1px solid #dbe1ea",
    borderRadius: "18px",
    background: "#fbfdff",
    padding: "16px",
  },
  previewHeading: {
    margin: 0,
    fontSize: "15px",
    lineHeight: 1.2,
    letterSpacing: "-0.02em",
    fontWeight: 700,
    color: "#111827",
  },
  previewSupportText: {
    margin: 0,
    fontSize: "11px",
    lineHeight: 1.45,
    color: "#4b5563",
  },
  previewChoicesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "6px",
  },
  previewChoiceButton: {
    appearance: "none",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    background: "#ffffff",
    color: "#111827",
    cursor: "pointer",
    padding: "7px 6px",
    minHeight: "48px",
    display: "grid",
    placeItems: "center",
    gap: "1px",
    transition: "all 0.15s ease",
  },
  previewChoiceButtonActive: {
    borderColor: "#2563eb",
    boxShadow: "0 0 0 1px #2563eb inset",
    background: "#eff6ff",
  },
  previewChoicePrimary: {
    fontSize: "12px",
    fontWeight: 700,
    lineHeight: 1.15,
    margin: 0,
    color: "#111827",
  },
  previewChoiceSecondary: {
    fontSize: "9px",
    lineHeight: 1.2,
    margin: 0,
    color: "#6b7280",
  },
  previewCustomRow: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    gap: "6px",
    alignItems: "center",
  },
  previewCustomInput: {
    width: "100%",
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    background: "#ffffff",
    color: "#111827",
    fontSize: "11px",
    padding: "8px 10px",
    outline: "none",
    boxSizing: "border-box",
  },
  previewSubmitButton: {
    appearance: "none",
    borderRadius: "10px",
    border: "1px solid #1d4ed8",
    background: "#2563eb",
    color: "#ffffff",
    padding: "8px 11px",
    fontSize: "11px",
    fontWeight: 700,
    cursor: "pointer",
  },
  previewSubmitButtonDisabled: {
    borderColor: "#d1d5db",
    background: "#f3f4f6",
    color: "#9ca3af",
    cursor: "not-allowed",
  },
  previewTipRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
  },
  previewTipLabel: {
    margin: 0,
    fontSize: "12px",
    color: "#374151",
  },
  previewTipAmount: {
    margin: 0,
    fontSize: "12px",
    fontWeight: 700,
    color: "#111827",
  },
  previewThankYou: {
    margin: 0,
    fontSize: "10px",
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    color: "#4b5563",
  },
  previewNote: {
    margin: 0,
    fontSize: "11px",
    lineHeight: 1.5,
    color: "#6b7280",
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
    config,
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
  const previewPresets = useMemo(
    () => buildPreviewPresets(presetValues),
    [presetValues],
  );
  const previewSupportMessage = useMemo(
    () => getPreviewSupportMessage(draftConfig),
    [draftConfig],
  );
  const [previewSelectedTip, setPreviewSelectedTip] = useState(() =>
    resolvePreviewDefaultSelection(draftConfig.default_tip_choice, previewPresets),
  );
  const [previewCustomAmount, setPreviewCustomAmount] = useState("");
  const [previewAppliedTipAmount, setPreviewAppliedTipAmount] = useState(() =>
    calculatePreviewTipAmount({
      selection: resolvePreviewDefaultSelection(
        draftConfig.default_tip_choice,
        previewPresets,
      ),
      customAmount: "",
      presets: previewPresets,
      subtotal: PREVIEW_SUBTOTAL,
      }),
  );

  useEffect(() => {
    setDraftConfig(cloneConfig(currentConfig));
  }, [currentConfig]);

  useEffect(() => {
    const defaultSelection = resolvePreviewDefaultSelection(
      draftConfig.default_tip_choice,
      previewPresets,
    );
    const defaultAppliedAmount = calculatePreviewTipAmount({
      selection: defaultSelection,
      customAmount: "",
      presets: previewPresets,
      subtotal: PREVIEW_SUBTOTAL,
    });

    setPreviewSelectedTip(defaultSelection);
    setPreviewCustomAmount("");
    setPreviewAppliedTipAmount(defaultAppliedAmount);
  }, [draftConfig.default_tip_choice, previewPresets]);

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
  const previewCustomSelected = previewSelectedTip === "custom";
  const previewCanSubmitCustom =
    previewCustomSelected && isPreviewCustomAmountValid(previewCustomAmount);

  const handlePreviewChooseTip = (selection) => {
    setPreviewSelectedTip(selection);

    if (selection === "custom") {
      return;
    }

    setPreviewCustomAmount("");
    setPreviewAppliedTipAmount(
      calculatePreviewTipAmount({
        selection,
        customAmount: "",
        presets: previewPresets,
        subtotal: PREVIEW_SUBTOTAL,
      }),
    );
  };

  const handlePreviewApplyCustom = () => {
    if (!previewCanSubmitCustom) {
      return;
    }

    setPreviewAppliedTipAmount(
      calculatePreviewTipAmount({
        selection: "custom",
        customAmount: previewCustomAmount,
        presets: previewPresets,
        subtotal: PREVIEW_SUBTOTAL,
      }),
    );
  };
  return (
    <s-page title="Tip Settings">
      <div style={styles.page}>
        <style>{responsiveLayoutStyles}</style>
        <div style={styles.hero}>
          <p style={styles.eyebrow}>Tip settings</p>
          <h1 style={styles.title}>Tipping</h1>
          <p style={styles.subtitle}>
            Edit the exact tip content buyers see in checkout.
          </p>
        </div>

        <div className="tip-settings-layout" style={styles.layout}>
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
              <input type="hidden" name="custom_amount_enabled" value="on" />

            <div style={styles.sectionCard}>
              <div style={styles.toggleRow}>
                <div style={styles.toggleCopy}>
                  <h2 style={styles.toggleTitle}>Enable tipping</h2>
                  <p style={styles.toggleDescription}>
                    Tipping is active in checkout.
                  </p>
                </div>
                <input
                  id="enabled"
                  name="enabled"
                  type="checkbox"
                  checked={Boolean(draftConfig.enabled)}
                  onChange={(event) =>
                    updateDraft("enabled", event.target.checked)
                  }
                  style={styles.checkbox}
                />
              </div>
            </div>

            <div style={styles.sectionCard}>
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>Summary</h2>
                <p style={styles.sectionDescription}>
                  Controls the title, button label, and closing note shown in
                  checkout.
                </p>
              </div>

              <div style={styles.compactRow}>
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
                      placeholder="Show your appreciation"
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
                      placeholder="Add a tip"
                    />
                  </div>
                </div>
              </div>

              <div style={styles.fieldGroup}>
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

            <div style={styles.sectionCard}>
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>Support message</h2>
                <p style={styles.sectionDescription}>
                  Shown below the title in checkout.
                </p>
              </div>

              <div style={styles.fieldGroup}>
                <label htmlFor="support_text" style={styles.label}>
                  Message
                </label>
                <textarea
                  id="support_text"
                  name="support_text"
                  value={draftConfig.support_text ?? ""}
                  onChange={(event) =>
                    updateDraft("support_text", event.target.value)
                  }
                  style={styles.textarea}
                  placeholder="Every tip goes directly to the people who packed your order."
                />
              </div>
            </div>

            <div style={{ ...styles.sectionCard, ...styles.presetsPanel }}>
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>Preset percentages</h2>
                <p style={styles.sectionDescription}>
                  Buyers always see three percentage choices plus custom amount.
                </p>
              </div>

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

              <div style={styles.fieldGroup}>
                <label htmlFor="default_tip_choice" style={styles.label}>
                  Default selected preset
                </label>
                <select
                  id="default_tip_choice"
                  name="default_tip_choice"
                  value={draftConfig.default_tip_choice}
                  onChange={(event) =>
                    updateDraft("default_tip_choice", event.target.value)
                  }
                  style={styles.select}
                >
                  <option value="preset_1">
                    Preset 1 ({presetValues.preset_1}%)
                  </option>
                  <option value="preset_2">
                    Preset 2 ({presetValues.preset_2}%)
                  </option>
                  <option value="preset_3">
                    Preset 3 ({presetValues.preset_3}%)
                  </option>
                </select>
              </div>
            </div>
            </div>

            <div style={styles.actionBar}>
              <div style={styles.actionMeta}>
                {saved ? (
                  <s-banner tone="success">
                    Settings saved successfully.
                  </s-banner>
                ) : null}
                {errors && errors.length > 0 ? (
                  <s-banner tone="critical">
                    {errors.map((error) => error.message).join(", ")}
                  </s-banner>
                ) : null}
              </div>
              <div style={styles.actionButtons}>
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

          <aside className="tip-settings-preview-column" style={styles.previewCard}>
            <div style={styles.previewHeader}>
              <h2 style={styles.previewTitle}>Live preview</h2>
              <p style={styles.previewHeaderMeta}>Subtotal ${PREVIEW_SUBTOTAL}</p>
            </div>

            <div style={styles.previewBody}>
              <div style={styles.previewTipBlock}>
                <p style={styles.previewHeading}>
                  {draftConfig.heading || "Tip"}
                </p>
                <p style={styles.previewSupportText}>
                  {previewSupportMessage}
                </p>

                <div style={styles.previewChoicesGrid}>
                  {previewPresets.map((preset) => {
                    const selected = previewSelectedTip === preset.key;
                    const tipAmount = calculatePreviewTipAmount({
                      selection: preset.key,
                      customAmount: "",
                      presets: previewPresets,
                      subtotal: PREVIEW_SUBTOTAL,
                    });

                    return (
                      <button
                        key={preset.key}
                        type="button"
                        style={
                          selected
                            ? {
                                ...styles.previewChoiceButton,
                                ...styles.previewChoiceButtonActive,
                              }
                            : styles.previewChoiceButton
                        }
                        onClick={() => handlePreviewChooseTip(preset.key)}
                      >
                        <p style={styles.previewChoicePrimary}>{preset.label}%</p>
                        <p style={styles.previewChoiceSecondary}>
                          {formatPreviewCurrency(tipAmount)}
                        </p>
                      </button>
                    );
                  })}

                  {draftConfig.custom_amount_enabled ? (
                    <button
                      type="button"
                      style={
                        previewCustomSelected
                          ? {
                              ...styles.previewChoiceButton,
                              ...styles.previewChoiceButtonActive,
                            }
                          : styles.previewChoiceButton
                      }
                      onClick={() => handlePreviewChooseTip("custom")}
                    >
                      <p style={styles.previewChoicePrimary}>Custom</p>
                      <p style={styles.previewChoiceSecondary}>Choose amount</p>
                    </button>
                  ) : null}
                </div>

                {previewCustomSelected && draftConfig.custom_amount_enabled ? (
                  <div style={styles.previewCustomRow}>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={previewCustomAmount}
                      onChange={(event) => setPreviewCustomAmount(event.target.value)}
                      placeholder="Custom tip"
                      style={styles.previewCustomInput}
                    />
                    <button
                      type="button"
                      onClick={handlePreviewApplyCustom}
                      style={
                        previewCanSubmitCustom
                          ? styles.previewSubmitButton
                          : {
                              ...styles.previewSubmitButton,
                              ...styles.previewSubmitButtonDisabled,
                            }
                      }
                      disabled={!previewCanSubmitCustom}
                    >
                      {draftConfig.cta_label || "Update tip"}
                    </button>
                  </div>
                ) : null}

                <div style={styles.previewTipRow}>
                  <p style={styles.previewTipLabel}>Tip</p>
                  <p style={styles.previewTipAmount}>
                    {formatPreviewCurrency(previewAppliedTipAmount)}
                  </p>
                </div>

                <p style={styles.previewThankYou}>
                  {draftConfig.thank_you_text || "THANK YOU, WE APPRECIATE IT."}
                </p>
              </div>

              <p style={styles.previewNote}>
                Interactive simulation only. This preview follows current draft
                values and does not write to checkout.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </s-page>
  );
}

export const headers = (args) => boundary.headers(args);
