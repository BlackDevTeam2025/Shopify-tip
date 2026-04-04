import {useFetcher, useLoaderData} from 'react-router';
import {boundary} from '@shopify/shopify-app-react-router/server';
import {authenticateBillingRoute} from '../billing/gate.server';
import {
  buildTipConfigFromFormData,
  buildTipRuntimeConfig,
  loadTipConfig,
  saveTipConfig,
} from '../tip-config.server.js';
import {isLicenseActive} from '../billing/license.server.js';
import {ensureTipCartTransform} from '../cart-transform.server.js';

const displayOptionLabels = {
  percentage_and_amount: 'Add 20% ($7.50) tip',
  percentage_only: '20% tip',
  amount_first: '$7.50 (20%)',
};

const styles = {
  page: {
    display: 'grid',
    gap: '24px',
    maxWidth: '1480px',
    margin: '0 auto',
    width: '100%',
  },
  hero: {
    display: 'grid',
    gap: '12px',
    padding: '8px 4px 0 4px',
  },
  heroCopy: {
    display: 'grid',
    gap: '10px',
    maxWidth: '58rem',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    width: 'fit-content',
    padding: '8px 12px',
    borderRadius: '999px',
    background: '#eef2ff',
    color: '#4338ca',
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  title: {
    margin: 0,
    fontSize: '38px',
    lineHeight: 1.08,
    fontWeight: 800,
    letterSpacing: '-0.04em',
    color: '#111827',
  },
  subtitle: {
    margin: 0,
    fontSize: '16px',
    lineHeight: 1.7,
    color: '#4b5563',
    maxWidth: '46rem',
  },
  headerLabel: {
    margin: 0,
    fontSize: '12px',
    fontWeight: 700,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  headerValue: {
    margin: 0,
    fontSize: '15px',
    color: '#111827',
    lineHeight: 1.6,
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.9fr) minmax(340px, 0.95fr)',
    gap: '28px',
    alignItems: 'start',
  },
  mainCard: {
    background: 'linear-gradient(180deg, #ffffff 0%, #faf9ff 100%)',
    border: '1px solid #e5e7eb',
    borderRadius: '28px',
    boxShadow: '0 24px 60px rgba(99, 102, 241, 0.10)',
    padding: '34px',
    display: 'grid',
    gap: '28px',
  },
  section: {
    display: 'grid',
    gap: '16px',
  },
  sectionHeader: {
    display: 'grid',
    gap: '6px',
  },
  sectionTitle: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 800,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    color: '#111827',
  },
  sectionBody: {
    margin: 0,
    fontSize: '14px',
    lineHeight: 1.6,
    color: '#6b7280',
  },
  fieldGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '18px 20px',
  },
  fieldFull: {
    gridColumn: '1 / -1',
  },
  fieldGroup: {
    display: 'grid',
    gap: '8px',
  },
  label: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#111827',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  input: {
    width: '100%',
    borderRadius: '18px',
    border: '1px solid #e5e7eb',
    background: '#ffffff',
    color: '#111827',
    padding: '14px 16px',
    fontSize: '15px',
    lineHeight: 1.4,
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    borderRadius: '18px',
    border: '1px solid #c7d2fe',
    background: '#ffffff',
    color: '#111827',
    padding: '14px 16px',
    fontSize: '15px',
    lineHeight: 1.4,
    boxSizing: 'border-box',
  },
  helper: {
    fontSize: '13px',
    color: '#6b7280',
    margin: 0,
    lineHeight: 1.6,
  },
  chipRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
  },
  chip: {
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: '999px',
    padding: '10px 14px',
    background: 'rgba(99, 102, 241, 0.14)',
    color: '#4338ca',
    fontSize: '14px',
    fontWeight: 700,
  },
  toggleCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '18px 20px',
    borderRadius: '20px',
    border: '1px solid #ece7ff',
    background: '#ffffff',
  },
  checkbox: {
    width: '20px',
    height: '20px',
  },
  divider: {
    height: '1px',
    background: '#ece7ff',
    width: '100%',
  },
  actionRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    flexWrap: 'wrap',
  },
  sidebar: {
    display: 'grid',
    gap: '20px',
    position: 'sticky',
    top: '24px',
  },
  statusCard: {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '24px',
    boxShadow: '0 20px 45px rgba(15, 23, 42, 0.06)',
    padding: '24px',
    display: 'grid',
    gap: '18px',
  },
  statusRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '16px',
    alignItems: 'center',
  },
  statusToneGood: {
    color: '#047857',
    fontWeight: 700,
  },
  statusToneWarn: {
    color: '#6d28d9',
    fontWeight: 700,
  },
  runtimeCard: {
    background: '#2f3136',
    color: '#f9fafb',
    borderRadius: '28px',
    padding: '22px',
    display: 'grid',
    gap: '18px',
    boxShadow: '0 24px 60px rgba(15, 23, 42, 0.24)',
  },
  runtimeInner: {
    borderRadius: '18px',
    border: '1px solid rgba(255,255,255,0.10)',
    background: 'rgba(255,255,255,0.03)',
    padding: '16px',
    display: 'grid',
    gap: '12px',
  },
  runtimeLabel: {
    margin: 0,
    fontSize: '12px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'rgba(255,255,255,0.58)',
  },
  runtimeValue: {
    margin: 0,
    fontSize: '15px',
    lineHeight: 1.6,
    color: '#f9fafb',
  },
  runtimePills: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  runtimePillActive: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '56px',
    borderRadius: '12px',
    padding: '10px 12px',
    background: 'rgba(99, 102, 241, 0.95)',
    color: '#ffffff',
    fontWeight: 700,
    fontSize: '14px',
  },
  runtimePill: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '56px',
    borderRadius: '12px',
    padding: '10px 12px',
    background: 'rgba(255,255,255,0.06)',
    color: '#f9fafb',
    border: '1px solid rgba(255,255,255,0.12)',
    fontWeight: 700,
    fontSize: '14px',
  },
  tipCard: {
    background: '#ffe1cc',
    border: '1px solid #ffd0ad',
    borderRadius: '24px',
    padding: '22px',
    display: 'grid',
    gap: '10px',
    color: '#7c2d12',
  },
  tipsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '16px',
  },
  infoCard: {
    background: 'linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)',
    border: '1px solid #e5e7eb',
    borderRadius: '24px',
    padding: '22px',
    display: 'grid',
    gap: '10px',
  },
};

function renderPresetChips(csv) {
  return csv
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => `${value}%`);
}

export const loader = async ({request}) => {
  const {admin, licenseState, session} = await authenticateBillingRoute(request);
  const licenseActive = isLicenseActive(licenseState);
  const transformStatus = licenseActive
    ? await ensureTipCartTransform(admin, session?.scope)
    : {active: false, cartTransformId: null, errors: []};
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

export const action = async ({request}) => {
  const {admin, licenseState, session} = await authenticateBillingRoute(request);
  const licenseActive = isLicenseActive(licenseState);
  const transformStatus = licenseActive
    ? await ensureTipCartTransform(admin, session?.scope)
    : {active: false, cartTransformId: null, errors: []};
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
  const transformStatus = fetcher.data?.transformStatus ?? loaderData.transformStatus;
  const formKey = JSON.stringify(currentConfig);
  const isLoading = fetcher.state === 'submitting';
  const saved = fetcher.data?.saved === true;
  const errors = fetcher.data?.errors;
  const presetChips = renderPresetChips(currentConfig.tip_percentages);
  const displayOptionLabel =
    displayOptionLabels[currentConfig.percentage_display_option] ?? displayOptionLabels.percentage_and_amount;

  return (
    <s-page title="Tip Settings">
      <div style={styles.page}>
        <div style={styles.hero}>
          <div style={styles.heroCopy}>
            <div style={styles.badge}>Flexible Tipping</div>
            <h1 style={styles.title}>Tipping Configuration</h1>
            <p style={styles.subtitle}>
              Customize how tips are presented in checkout with a cleaner admin layout, clearer status feedback,
              and a runtime preview that mirrors the buyer experience.
            </p>
          </div>
        </div>

        <div style={styles.layout}>
          <fetcher.Form method="POST" key={formKey} style={styles.mainCard}>
            <input type="hidden" name="plus_only" value="true" />

            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>Checkout Copy</h2>
                <p style={styles.sectionBody}>
                  Configure the title, supporting line, and display style shown in the checkout tip widget.
                </p>
              </div>

              <div style={styles.fieldGrid}>
                <div style={styles.fieldGroup}>
                  <label htmlFor="widget_title" style={styles.label}>Widget Title</label>
                  <input
                    id="widget_title"
                    name="widget_title"
                    defaultValue={currentConfig.widget_title}
                    style={styles.input}
                    placeholder="Leave a Tip"
                  />
                </div>

                <div style={styles.fieldGroup}>
                  <label htmlFor="tip_variant_id" style={styles.label}>Tip Variant ID</label>
                  <input
                    id="tip_variant_id"
                    name="tip_variant_id"
                    defaultValue={currentConfig.tip_variant_id}
                    style={styles.input}
                    placeholder="gid://shopify/ProductVariant/123456789"
                  />
                </div>

                <div style={{...styles.fieldGroup, ...styles.fieldFull}}>
                  <label htmlFor="caption1" style={styles.label}>Checkout Caption</label>
                  <input
                    id="caption1"
                    name="caption1"
                    defaultValue={currentConfig.caption1}
                    style={styles.input}
                    placeholder="Buy our team coffee"
                  />
                </div>
              </div>
            </div>

            <div style={styles.divider} />

            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>Tipping Options</h2>
                <p style={styles.sectionBody}>
                  Keep the preset percentages compact and familiar. Recommended values: 5, 10, 15, 18, and 20.
                </p>
              </div>

              <div style={styles.fieldGrid}>
                <div style={styles.fieldGroup}>
                  <label htmlFor="tip_percentages" style={styles.label}>Preset Percentages</label>
                  <input
                    id="tip_percentages"
                    name="tip_percentages"
                    defaultValue={currentConfig.tip_percentages}
                    style={styles.input}
                    placeholder="5,10,15,18,20"
                  />
                  <p style={styles.helper}>
                    Comma separated percentages based on order subtotal.
                  </p>
                </div>

                <div style={styles.fieldGroup}>
                  <label htmlFor="percentage_display_option" style={styles.label}>Display Format</label>
                  <select
                    id="percentage_display_option"
                    name="percentage_display_option"
                    defaultValue={currentConfig.percentage_display_option}
                    style={styles.select}
                  >
                    <option value="percentage_and_amount">Add 20% ($7.50) tip</option>
                    <option value="percentage_only">20% tip</option>
                    <option value="amount_first">$7.50 (20%)</option>
                  </select>
                </div>
              </div>

              <div style={styles.chipRow}>
                {presetChips.map((chip) => (
                  <span key={chip} style={styles.chip}>{chip}</span>
                ))}
              </div>
            </div>

            <div style={styles.divider} />

            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>Display Behavior</h2>
                <p style={styles.sectionBody}>
                  Control whether buyers can enter a custom amount in addition to the preset tip percentages.
                </p>
              </div>

              <label style={styles.toggleCard}>
                <input
                  type="checkbox"
                  name="custom_amount_enabled"
                  defaultChecked={currentConfig.custom_amount_enabled}
                  style={styles.checkbox}
                />
                <div>
                  <p style={{margin: 0, fontSize: '16px', fontWeight: 700, color: '#111827'}}>Allow custom amount</p>
                  <p style={{margin: 0, fontSize: '14px', lineHeight: 1.6, color: '#6b7280'}}>
                    Adds a dedicated custom option in checkout so buyers can enter their own tip amount.
                  </p>
                </div>
              </label>
            </div>

            <div style={styles.actionRow}>
              <s-button type="submit" loading={isLoading} variant="primary">
                {isLoading ? 'Saving...' : 'Save Settings'}
              </s-button>
              {saved && <s-banner tone="success">Settings saved successfully!</s-banner>}
              {errors && errors.length > 0 && (
                <s-banner tone="critical">
                  Error: {errors.map((e) => e.message).join(', ')}
                </s-banner>
              )}
            </div>
          </fetcher.Form>

          <div style={styles.sidebar}>
            <div style={styles.statusCard}>
              <div style={styles.statusRow}>
                <span style={styles.headerLabel}>App Status</span>
                <span style={currentConfig.enabled ? styles.statusToneGood : styles.statusToneWarn}>
                  {currentConfig.enabled ? 'Active' : 'Billing required'}
                </span>
              </div>
              <div style={styles.statusRow}>
                <span style={styles.headerValue}>Dynamic pricing layer</span>
                <span style={transformStatus?.active ? styles.statusToneGood : styles.statusToneWarn}>
                  {transformStatus?.active ? 'Active' : 'Not active yet'}
                </span>
              </div>
              {transformStatus?.errors?.length > 0 && (
                <p style={{...styles.headerValue, color: '#6d28d9'}}>
                  {transformStatus.errors.map((error) => error.message).join(', ')}
                </p>
              )}
            </div>

            <div style={styles.runtimeCard}>
              <p style={styles.runtimeLabel}>Runtime Preview</p>
              <div style={styles.runtimeInner}>
                <p style={styles.runtimeLabel}>Checkout copy</p>
                <p style={styles.runtimeValue}>{currentConfig.widget_title}</p>
                <p style={{...styles.runtimeValue, color: 'rgba(249,250,251,0.78)'}}>{currentConfig.caption1}</p>
                <p style={styles.runtimeLabel}>Select tip</p>
                <div style={styles.runtimePills}>
                  {presetChips.slice(0, 4).map((chip, index) => (
                    <span
                      key={chip}
                      style={index === 0 ? styles.runtimePillActive : styles.runtimePill}
                    >
                      {chip}
                    </span>
                  ))}
                  {currentConfig.custom_amount_enabled && (
                    <span style={styles.runtimePill}>Custom</span>
                  )}
                </div>
                <p style={styles.runtimeLabel}>Display option</p>
                <p style={styles.runtimeValue}>{displayOptionLabel}</p>
              </div>
            </div>

            <div style={styles.tipCard}>
              <p style={{margin: 0, fontSize: '18px', fontWeight: 800}}>Pro Tip</p>
              <p style={{margin: 0, fontSize: '14px', lineHeight: 1.7}}>
                Keep presets short and familiar. In most stores, 5%, 10%, 15%, 18%, and 20% feel natural and convert better than exotic values.
              </p>
            </div>

            <div style={styles.tipsGrid}>
              <div style={styles.infoCard}>
                <p style={{margin: 0, fontSize: '22px', fontWeight: 800, color: '#111827'}}>Optimize Conversion</p>
                <p style={{margin: 0, fontSize: '14px', lineHeight: 1.7, color: '#4b5563'}}>
                  Keeping 3-5 concise presets helps buyers decide faster without overthinking the tip choice.
                </p>
              </div>
              <div style={styles.infoCard}>
                <p style={{margin: 0, fontSize: '22px', fontWeight: 800, color: '#111827'}}>Runtime Safety</p>
                <p style={{margin: 0, fontSize: '14px', lineHeight: 1.7, color: '#4b5563'}}>
                  This settings page is the source of truth. Save here first, then refresh checkout to pick up the latest runtime config.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </s-page>
  );
}

export const headers = (args) => boundary.headers(args);
