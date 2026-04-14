import { useEffect, useMemo, useState } from "react";
import { useFetcher, useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";

import { authenticateBillingRoute } from "../billing/gate.server";
import { isLicenseActive } from "../billing/license.server.js";
import { ensureTipCartTransform } from "../cart-transform.server.js";
import {
  buildPreviewPresets,
  getPreviewSupportMessage,
  resolvePreviewDefaultSelection,
} from "../tip-preview.utils.js";

const INDUSTRY_MESSAGES = {
  general: "Every tip goes directly to the people who packed your order.",
  food: "Tips support the chefs behind every order.",
  handmade: "Each item is made by hand, with love. Tips help us keep going.",
  fashion: "Tips help our packing team do more.",
  subscription: "Tips go to the team curating your box every month.",
};

const responsiveStyles = `
  .tip-settings-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 360px;
    gap: 20px;
    align-items: start;
  }

  .tip-settings-preview-column {
    position: sticky;
    top: 18px;
  }

  @media (max-width: 1180px) {
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
    minHeight: "100%",
    background: "#f5f7fa",
    padding: "16px 10px 28px",
    display: "grid",
    gap: "20px",
    maxWidth: "100%",
    margin: 0,
    width: "100%",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  pageTitle: {
    margin: 0,
    fontSize: "28px",
    lineHeight: 1.1,
    letterSpacing: "-0.02em",
    fontWeight: 700,
    color: "#111827",
  },
  pageSub: {
    margin: "4px 0 0",
    fontSize: "13px",
    lineHeight: 1.5,
    color: "#6b7280",
  },
  mainCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    overflow: "hidden",
    boxShadow: "0 8px 28px rgba(15, 23, 42, 0.06)",
  },
  cardHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "14px",
    padding: "18px 22px",
    borderBottom: "1px solid #eef2f7",
  },
  cardHeaderTitle: {
    margin: 0,
    fontSize: "17px",
    lineHeight: 1.3,
    fontWeight: 700,
    color: "#111827",
  },
  cardHeaderSub: {
    margin: "4px 0 0",
    fontSize: "12px",
    lineHeight: 1.45,
    color: "#6b7280",
  },
  toggle: {
    width: "40px",
    height: "22px",
    marginTop: "1px",
    accentColor: "#1d9e75",
    cursor: "pointer",
  },
  section: {
    padding: "20px 24px",
    borderBottom: "1px solid #eef2f7",
    display: "grid",
    gap: "12px",
    transition: "opacity 0.18s ease",
  },
  sectionDisabled: {
    opacity: 0.38,
    pointerEvents: "none",
  },
  sectionLabel: {
    margin: 0,
    fontSize: "14px",
    lineHeight: 1.4,
    fontWeight: 700,
    color: "#111827",
  },
  sectionHint: {
    margin: "2px 0 0",
    fontSize: "12px",
    lineHeight: 1.5,
    color: "#6b7280",
  },
  row2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },
  row3: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "12px",
  },
  field: {
    display: "grid",
    gap: "6px",
  },
  label: {
    fontSize: "12px",
    lineHeight: 1.3,
    fontWeight: 700,
    color: "#4b5563",
  },
  input: {
    width: "100%",
    height: "36px",
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    padding: "0 10px",
    fontSize: "13px",
    lineHeight: 1.4,
    color: "#111827",
    background: "#ffffff",
    outline: "none",
    boxSizing: "border-box",
  },
  select: {
    width: "100%",
    height: "36px",
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    padding: "0 10px",
    fontSize: "13px",
    lineHeight: 1.4,
    color: "#111827",
    background: "#ffffff",
    outline: "none",
    boxSizing: "border-box",
  },
  textareaWrap: {
    position: "relative",
  },
  textarea: {
    width: "100%",
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    padding: "8px 10px 22px",
    fontSize: "13px",
    lineHeight: 1.5,
    color: "#111827",
    background: "#ffffff",
    outline: "none",
    boxSizing: "border-box",
    resize: "none",
    minHeight: "78px",
    fontFamily: "inherit",
  },
  inputWrap: {
    position: "relative",
  },
  inputWithCounter: {
    width: "100%",
    height: "36px",
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    padding: "0 52px 0 10px",
    fontSize: "13px",
    lineHeight: 1.4,
    color: "#111827",
    background: "#ffffff",
    outline: "none",
    boxSizing: "border-box",
  },
  charCount: {
    position: "absolute",
    right: "8px",
    bottom: "7px",
    fontSize: "11px",
    lineHeight: 1,
    color: "#9ca3af",
    pointerEvents: "none",
  },
  charCountDanger: {
    color: "#b91c1c",
  },
  numWrap: {
    position: "relative",
  },
  percentInput: {
    width: "100%",
    height: "36px",
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    padding: "0 26px 0 10px",
    fontSize: "13px",
    lineHeight: 1.4,
    color: "#111827",
    background: "#ffffff",
    outline: "none",
    boxSizing: "border-box",
  },
  percentUnit: {
    position: "absolute",
    right: "10px",
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: "13px",
    color: "#6b7280",
  },
  defaultRow: {
    display: "grid",
    gap: "8px",
    marginTop: "4px",
    maxWidth: "460px",
  },
  defaultLabel: {
    fontSize: "12px",
    lineHeight: 1.3,
    fontWeight: 700,
    color: "#4b5563",
  },
  infoBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    height: "22px",
    borderRadius: "999px",
    border: "1px solid #9eead4",
    background: "#ecfdf5",
    color: "#0f766e",
    padding: "0 8px",
    fontSize: "11px",
    lineHeight: 1.2,
    fontWeight: 700,
    width: "fit-content",
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
    padding: "14px 22px",
    background: "#fafafa",
  },
  actions: {
    marginLeft: "auto",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  previewCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 8px 28px rgba(15, 23, 42, 0.06)",
  },
  previewHeader: {
    padding: "11px 14px",
    borderBottom: "1px solid #eef2f7",
  },
  previewHeaderText: {
    margin: 0,
    fontSize: "12px",
    lineHeight: 1.4,
    fontWeight: 700,
    color: "#4b5563",
  },
  previewOff: {
    padding: "30px 16px",
    textAlign: "center",
    color: "#6b7280",
    fontSize: "13px",
    lineHeight: 1.4,
  },
  previewBody: {
    padding: "14px",
  },
  previewTipCard: {
    border: "1px solid #dbe1ea",
    borderRadius: "14px",
    padding: "12px",
    display: "grid",
    gap: "10px",
    background: "#fbfdff",
  },
  previewTitle: {
    margin: 0,
    fontSize: "15px",
    lineHeight: 1.25,
    fontWeight: 700,
    color: "#111827",
  },
  previewMessage: {
    margin: 0,
    fontSize: "12px",
    lineHeight: 1.4,
    color: "#6b7280",
    minHeight: "17px",
  },
  previewGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
  },
  previewBtn: {
    appearance: "none",
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    background: "#ffffff",
    minHeight: "52px",
    cursor: "pointer",
    display: "grid",
    placeItems: "center",
    gap: "2px",
    padding: "7px 8px",
    transition: "all 0.15s ease",
  },
  previewBtnActive: {
    border: "2px solid #1d9e75",
    background: "#e9fbf4",
  },
  previewBtnText: {
    margin: 0,
    fontSize: "15px",
    lineHeight: 1.2,
    fontWeight: 700,
    color: "#111827",
  },
  previewCustomText: {
    margin: 0,
    fontSize: "13px",
    lineHeight: 1.25,
    fontWeight: 500,
    color: "#111827",
  },
  previewTipRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    marginTop: "2px",
  },
  previewTipLabel: {
    margin: 0,
    fontSize: "13px",
    lineHeight: 1.3,
    color: "#111827",
    fontWeight: 500,
  },
  previewTipValue: {
    margin: 0,
    fontSize: "13px",
    lineHeight: 1.3,
    color: "#111827",
    fontWeight: 700,
  },
  previewThanks: {
    margin: 0,
    fontSize: "11px",
    lineHeight: 1.45,
    color: "#4b5563",
  },
  previewNote: {
    margin: 0,
    padding: "9px 14px",
    borderTop: "1px solid #eef2f7",
    fontSize: "10px",
    lineHeight: 1.4,
    color: "#9ca3af",
  },
  customizedTag: {
    fontSize: "11px",
    lineHeight: 1.2,
    color: "#b45309",
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

function resolveIndustryPresetByMessage(message) {
  const normalizedMessage = String(message ?? "").trim();

  for (const [preset, presetMessage] of Object.entries(INDUSTRY_MESSAGES)) {
    if (presetMessage === normalizedMessage) {
      return preset;
    }
  }

  return "general";
}

function getTipRowPreviewValue({
  selection,
  presets,
  customAmount,
}) {
  if (selection === "custom") {
    return customAmount ? `Custom (${customAmount})` : "Custom";
  }

  const selectedPreset =
    presets.find((preset) => preset.key === selection) ??
    presets.find((preset) => preset.key === "preset_2") ??
    presets[0];

  return `${selectedPreset?.label ?? "15"}%`;
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
  const [selectedIndustryPreset, setSelectedIndustryPreset] = useState(() =>
    resolveIndustryPresetByMessage(currentConfig.support_text),
  );
  const [supportCustomized, setSupportCustomized] = useState(() => {
    const preset = resolveIndustryPresetByMessage(currentConfig.support_text);
    return (
      String(currentConfig.support_text ?? "").trim() !==
      String(INDUSTRY_MESSAGES[preset] ?? "").trim()
    );
  });
  const [previewSelectedTip, setPreviewSelectedTip] = useState(() =>
    resolvePreviewDefaultSelection(currentConfig.default_tip_choice),
  );
  const [previewCustomAmount, setPreviewCustomAmount] = useState("");
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
  const activeSectionsStyle = draftConfig.enabled
    ? null
    : styles.sectionDisabled;
  const supportMessageLength = String(draftConfig.support_text ?? "").length;
  const thankYouLength = String(draftConfig.thank_you_text ?? "").length;

  useEffect(() => {
    setDraftConfig(cloneConfig(currentConfig));
    const preset = resolveIndustryPresetByMessage(currentConfig.support_text);
    setSelectedIndustryPreset(preset);
    setSupportCustomized(
      String(currentConfig.support_text ?? "").trim() !==
        String(INDUSTRY_MESSAGES[preset] ?? "").trim(),
    );
    setPreviewSelectedTip(resolvePreviewDefaultSelection(currentConfig.default_tip_choice));
    setPreviewCustomAmount("");
  }, [currentConfig]);

  useEffect(() => {
    setPreviewSelectedTip(
      resolvePreviewDefaultSelection(draftConfig.default_tip_choice, previewPresets),
    );
    setPreviewCustomAmount("");
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

  const resetDraft = () => {
    setDraftConfig(cloneConfig(currentConfig));
    const preset = resolveIndustryPresetByMessage(currentConfig.support_text);
    setSelectedIndustryPreset(preset);
    setSupportCustomized(
      String(currentConfig.support_text ?? "").trim() !==
        String(INDUSTRY_MESSAGES[preset] ?? "").trim(),
    );
    setPreviewSelectedTip(resolvePreviewDefaultSelection(currentConfig.default_tip_choice));
    setPreviewCustomAmount("");
  };

  const applyIndustryPreset = (presetKey) => {
    const presetMessage =
      INDUSTRY_MESSAGES[presetKey] ?? INDUSTRY_MESSAGES.general;
    setSelectedIndustryPreset(presetKey);
    setSupportCustomized(false);
    updateDraft("support_text", presetMessage);
  };

  const handleSupportMessageChange = (nextMessage) => {
    const matchedPreset = resolveIndustryPresetByMessage(nextMessage);
    const isCustomized =
      String(nextMessage ?? "").trim() !==
      String(INDUSTRY_MESSAGES[matchedPreset] ?? "").trim();

    setSelectedIndustryPreset(matchedPreset);
    setSupportCustomized(isCustomized);
    updateDraft("support_text", nextMessage);
  };

  return (
    <s-page title="Setting">
      <div style={styles.page}>
        <style>{responsiveStyles}</style>

        <div>
          <h1 style={styles.pageTitle}>Tipping</h1>
          <p style={styles.pageSub}>
            Edit the tip choices shown directly in checkout.
          </p>
        </div>

        <div className="tip-settings-layout">
          <fetcher.Form method="POST" style={styles.mainCard}>
            <input type="hidden" name="custom_amount_enabled" value="on" />

            <div style={styles.cardHeader}>
              <div>
                <p style={styles.cardHeaderTitle}>Enable tipping</p>
                <p style={styles.cardHeaderSub}>
                  {draftConfig.enabled
                    ? "Tipping is active in checkout"
                    : "Tipping is paused"}
                </p>
              </div>
              <input
                id="enabled"
                name="enabled"
                type="checkbox"
                checked={Boolean(draftConfig.enabled)}
                onChange={(event) => updateDraft("enabled", event.target.checked)}
                style={styles.toggle}
              />
            </div>

            <div style={{ ...styles.section, ...activeSectionsStyle }}>
              <div>
                <p style={styles.sectionLabel}>Summary</p>
                <p style={styles.sectionHint}>
                  Controls the title, button label, and closing note shown in
                  checkout.
                </p>
              </div>

              <div style={styles.row2}>
                <div style={styles.field}>
                  <label htmlFor="heading" style={styles.label}>
                    Title
                  </label>
                  <input
                    id="heading"
                    name="heading"
                    value={draftConfig.heading}
                    onChange={(event) => updateDraft("heading", event.target.value)}
                    style={styles.input}
                    maxLength={42}
                  />
                </div>

                <div style={styles.field}>
                  <label htmlFor="cta_label" style={styles.label}>
                    Button label
                  </label>
                  <input
                    id="cta_label"
                    name="cta_label"
                    value={draftConfig.cta_label}
                    onChange={(event) => updateDraft("cta_label", event.target.value)}
                    style={styles.input}
                    maxLength={28}
                  />
                </div>
              </div>

              <div style={styles.field}>
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
                    style={styles.inputWithCounter}
                    maxLength={60}
                  />
                  <span
                    style={{
                      ...styles.charCount,
                      ...(thankYouLength > 60 ? styles.charCountDanger : null),
                    }}
                  >
                    {thankYouLength}/60
                  </span>
                </div>
              </div>
            </div>

            <div style={{ ...styles.section, ...activeSectionsStyle }}>
              <div>
                <p style={styles.sectionLabel}>Support message</p>
                <p style={styles.sectionHint}>
                  Shown below the title in checkout. Pick a preset or write your
                  own.
                </p>
              </div>

              <div style={styles.field}>
                <label htmlFor="industry_preset" style={styles.label}>
                  Industry preset
                </label>
                <select
                  id="industry_preset"
                  value={selectedIndustryPreset}
                  onChange={(event) => applyIndustryPreset(event.target.value)}
                  style={styles.select}
                >
                  <option value="general">General / DTC</option>
                  <option value="food">Food & beverage</option>
                  <option value="handmade">Handmade / artisan</option>
                  <option value="fashion">Fashion & apparel</option>
                  <option value="subscription">Subscription box</option>
                </select>
              </div>

              <div style={styles.field}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <label htmlFor="support_text" style={styles.label}>
                    Message
                  </label>
                  {supportCustomized ? (
                    <span style={styles.customizedTag}>- customized</span>
                  ) : null}
                </div>
                <div style={styles.textareaWrap}>
                  <textarea
                    id="support_text"
                    name="support_text"
                    value={draftConfig.support_text ?? ""}
                    onChange={(event) =>
                      handleSupportMessageChange(event.target.value)
                    }
                    style={styles.textarea}
                    maxLength={80}
                  />
                  <span
                    style={{
                      ...styles.charCount,
                      ...(supportMessageLength > 80 ? styles.charCountDanger : null),
                    }}
                  >
                    {supportMessageLength}/80
                  </span>
                </div>
              </div>
            </div>

            <div style={{ ...styles.section, ...activeSectionsStyle, borderBottom: "0" }}>
              <div>
                <p style={styles.sectionLabel}>Preset percentages</p>
                <p style={styles.sectionHint}>
                  Buyers always see three percentage choices plus a custom amount.
                </p>
              </div>

              <div style={styles.row3}>
                <div style={styles.field}>
                  <label htmlFor="preset_1" style={styles.label}>
                    Preset 1
                  </label>
                  <div style={styles.numWrap}>
                    <input
                      id="preset_1"
                      name="preset_1"
                      inputMode="decimal"
                      value={presetValues.preset_1}
                      onChange={(event) => updatePreset("preset_1", event.target.value)}
                      style={styles.percentInput}
                    />
                    <span style={styles.percentUnit}>%</span>
                  </div>
                </div>

                <div style={styles.field}>
                  <label htmlFor="preset_2" style={styles.label}>
                    Preset 2
                  </label>
                  <div style={styles.numWrap}>
                    <input
                      id="preset_2"
                      name="preset_2"
                      inputMode="decimal"
                      value={presetValues.preset_2}
                      onChange={(event) => updatePreset("preset_2", event.target.value)}
                      style={styles.percentInput}
                    />
                    <span style={styles.percentUnit}>%</span>
                  </div>
                </div>

                <div style={styles.field}>
                  <label htmlFor="preset_3" style={styles.label}>
                    Preset 3
                  </label>
                  <div style={styles.numWrap}>
                    <input
                      id="preset_3"
                      name="preset_3"
                      inputMode="decimal"
                      value={presetValues.preset_3}
                      onChange={(event) => updatePreset("preset_3", event.target.value)}
                      style={styles.percentInput}
                    />
                    <span style={styles.percentUnit}>%</span>
                  </div>
                </div>
              </div>

              <div style={styles.defaultRow}>
                <label htmlFor="default_tip_choice" style={styles.defaultLabel}>
                  Default selected
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
                <span style={styles.infoBadge}>
                  <span
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: "#1d9e75",
                      display: "inline-block",
                    }}
                  />
                  {presetValues.preset_2}% converts best
                </span>
              </div>
            </div>

            <div style={styles.footer}>
              <div>
                {transformStatus?.errors?.length > 0 ? (
                  <s-banner tone="warning">
                    {transformStatus.errors.map((error) => error.message).join(", ")}
                  </s-banner>
                ) : null}
                {errors?.length > 0 ? (
                  <s-banner tone="critical">
                    {errors.map((error) => error.message).join(", ")}
                  </s-banner>
                ) : null}
                {saved ? <s-banner tone="success">Settings saved successfully.</s-banner> : null}
              </div>
              <div style={styles.actions}>
                <s-button
                  type="button"
                  variant="secondary"
                  disabled={!isDirty || isLoading}
                  onClick={resetDraft}
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
              <p style={styles.previewHeaderText}>Live preview</p>
            </div>

            {!draftConfig.enabled ? (
              <div style={styles.previewOff}>Tipping is disabled.</div>
            ) : (
              <div style={styles.previewBody}>
                <div style={styles.previewTipCard}>
                  <p style={styles.previewTitle}>{draftConfig.heading || "Tip"}</p>
                  <p style={styles.previewMessage}>
                    {previewSupportMessage || "Show your support for the team."}
                  </p>

                  <div style={styles.previewGrid}>
                    {previewPresets.map((preset) => {
                      const isActive = previewSelectedTip === preset.key;

                      return (
                        <button
                          key={preset.key}
                          type="button"
                          onClick={() => setPreviewSelectedTip(preset.key)}
                          style={
                            isActive
                              ? { ...styles.previewBtn, ...styles.previewBtnActive }
                              : styles.previewBtn
                          }
                        >
                          <p style={styles.previewBtnText}>{preset.label}%</p>
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => setPreviewSelectedTip("custom")}
                      style={
                        previewSelectedTip === "custom"
                          ? { ...styles.previewBtn, ...styles.previewBtnActive }
                          : styles.previewBtn
                      }
                    >
                      <p style={styles.previewCustomText}>Custom</p>
                    </button>
                  </div>

                  {previewSelectedTip === "custom" ? (
                    <input
                      type="text"
                      value={previewCustomAmount}
                      onChange={(event) => setPreviewCustomAmount(event.target.value)}
                      placeholder="Custom tip"
                      style={styles.input}
                    />
                  ) : null}

                  <div style={styles.previewTipRow}>
                    <p style={styles.previewTipLabel}>Tip</p>
                    <p style={styles.previewTipValue}>
                      {getTipRowPreviewValue({
                        selection: previewSelectedTip,
                        presets: previewPresets,
                        customAmount: previewCustomAmount,
                      })}
                    </p>
                  </div>

                  <p style={styles.previewThanks}>
                    {draftConfig.thank_you_text || "Thank you — it means the world to us."}
                  </p>
                </div>
              </div>
            )}

            <p style={styles.previewNote}>
              Interactive simulation only. Does not write to checkout.
            </p>
          </aside>
        </div>
      </div>
    </s-page>
  );
}

export const headers = (args) => boundary.headers(args);
