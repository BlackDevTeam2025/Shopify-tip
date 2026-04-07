import { useLoaderData, useLocation } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticateBillingRoute } from "../billing/gate.server";
import { appendEmbeddedSearch } from "../embedded-app-url.js";

const styles = {
  page: {
    minHeight: "100%",
    background: "#f5f7fa",
    padding: "32px 24px 40px",
  },
  container: {
    maxWidth: "1120px",
    margin: "0 auto",
    display: "grid",
    gap: "24px",
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "16px",
    flexWrap: "wrap",
  },
  headerMeta: {
    display: "grid",
    gap: "10px",
  },
  titleRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },
  pageTitle: {
    margin: 0,
    fontSize: "34px",
    lineHeight: 1.05,
    fontWeight: 800,
    letterSpacing: "-0.04em",
    color: "#111827",
  },
  pageIntro: {
    margin: 0,
    maxWidth: "760px",
    fontSize: "15px",
    lineHeight: 1.65,
    color: "#4b5563",
  },
  action: {
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
    whiteSpace: "nowrap",
  },
  section: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "20px",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.04)",
    padding: "24px",
    display: "grid",
    gap: "18px",
  },
  sectionHeader: {
    display: "grid",
    gap: "8px",
  },
  sectionEyebrow: {
    margin: 0,
    fontSize: "12px",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    fontWeight: 700,
    color: "#6b7280",
  },
  sectionTitle: {
    margin: 0,
    fontSize: "24px",
    lineHeight: 1.15,
    fontWeight: 800,
    color: "#111827",
    letterSpacing: "-0.03em",
  },
  sectionText: {
    margin: 0,
    fontSize: "15px",
    lineHeight: 1.65,
    color: "#4b5563",
  },
  gridThree: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "16px",
  },
  gridTwo: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.4fr) minmax(280px, 0.9fr)",
    gap: "16px",
    alignItems: "start",
  },
  card: {
    borderRadius: "16px",
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    padding: "20px",
    display: "grid",
    gap: "12px",
  },
  cardTop: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "12px",
  },
  cardLabel: {
    margin: 0,
    fontSize: "12px",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    fontWeight: 700,
    color: "#6b7280",
  },
  cardTitle: {
    margin: 0,
    fontSize: "24px",
    lineHeight: 1.15,
    fontWeight: 800,
    color: "#111827",
    letterSpacing: "-0.03em",
  },
  cardText: {
    margin: 0,
    fontSize: "15px",
    lineHeight: 1.65,
    color: "#4b5563",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: "30px",
    padding: "0 10px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: 800,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    border: "1px solid transparent",
  },
  badgeReady: {
    background: "#f3f4f6",
    borderColor: "#d1d5db",
    color: "#374151",
  },
  badgeWarning: {
    background: "#fff7ed",
    borderColor: "#fdba74",
    color: "#9a3412",
  },
  badgeCritical: {
    background: "#fef2f2",
    borderColor: "#fca5a5",
    color: "#b91c1c",
  },
  checkGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "12px",
  },
  checkCard: {
    borderRadius: "14px",
    border: "1px solid #e5e7eb",
    background: "#f9fafb",
    padding: "16px",
    display: "grid",
    gap: "6px",
  },
  checkLabel: {
    margin: 0,
    fontSize: "15px",
    fontWeight: 700,
    color: "#111827",
  },
  checkValue: {
    margin: 0,
    fontSize: "14px",
    lineHeight: 1.6,
    color: "#6b7280",
  },
  settingsList: {
    display: "grid",
    gap: "12px",
  },
  settingsRow: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: "16px",
    paddingBottom: "12px",
    borderBottom: "1px solid #f1f5f9",
  },
  settingsKey: {
    margin: 0,
    fontSize: "14px",
    color: "#6b7280",
  },
  settingsValue: {
    margin: 0,
    fontSize: "15px",
    color: "#111827",
    fontWeight: 700,
    textAlign: "right",
  },
  presetRow: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  presetChip: {
    minWidth: "64px",
    minHeight: "42px",
    padding: "0 14px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    background: "#f9fafb",
    color: "#111827",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
  },
};

function getOverallStatus(data) {
  const statuses = [
    data.store.status,
    data.license.status,
    data.checkoutRuntime.status,
    data.tipInfrastructure.status,
  ];

  if (statuses.includes("blocked")) {
    return "blocked";
  }

  if (statuses.includes("warning")) {
    return "warning";
  }

  return "ready";
}

function statusLabel(status) {
  if (status === "ready") return "Ready";
  if (status === "blocked") return "Blocked";
  return "Attention";
}

function badgeStyle(status) {
  if (status === "ready") return { ...styles.badge, ...styles.badgeReady };
  if (status === "blocked") return { ...styles.badge, ...styles.badgeCritical };
  return { ...styles.badge, ...styles.badgeWarning };
}

export const loader = async ({ request }) => {
  const { admin, licenseState, shopEligibility, session } =
    await authenticateBillingRoute(request);
  const { loadHomeDashboardData } = await import("../home-dashboard.server.js");

  return loadHomeDashboardData({
    admin,
    licenseState,
    shopEligibility,
    sessionScope: session?.scope ?? "",
  });
};

export default function Index() {
  const data = useLoaderData();
  const location = useLocation();
  const settingsHref = appendEmbeddedSearch(
    "/app/settings/tip-block",
    location.search,
  );
  const overallStatus = getOverallStatus(data);

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <div style={styles.headerMeta}>
            <div style={styles.titleRow}>
              <h1 style={styles.pageTitle}>Home</h1>
              <span style={badgeStyle(overallStatus)}>
                {statusLabel(overallStatus)}
              </span>
            </div>
            <p style={styles.pageIntro}>
              This page shows whether the store, license, checkout runtime, and
              internal tip setup are ready. Use it as an operational snapshot,
              not an analytics dashboard.
            </p>
          </div>

          <a href={settingsHref} style={styles.action}>
            Open Tip Settings
          </a>
        </header>

        <section style={styles.gridThree}>
          <article style={styles.card}>
            <div style={styles.cardTop}>
              <p style={styles.cardLabel}>Store status</p>
              <span style={badgeStyle(data.store.status)}>
                {statusLabel(data.store.status)}
              </span>
            </div>
            <h2 style={styles.cardTitle}>{data.store.title}</h2>
            <p style={styles.cardText}>
              Current plan: <strong>{data.store.planLabel}</strong>
            </p>
            <p style={styles.cardText}>{data.store.message}</p>
          </article>

          <article style={styles.card}>
            <div style={styles.cardTop}>
              <p style={styles.cardLabel}>License status</p>
              <span style={badgeStyle(data.license.status)}>
                {statusLabel(data.license.status)}
              </span>
            </div>
            <h2 style={styles.cardTitle}>{data.license.title}</h2>
            <p style={styles.cardText}>{data.license.message}</p>
          </article>

          <article style={styles.card}>
            <div style={styles.cardTop}>
              <p style={styles.cardLabel}>Checkout runtime</p>
              <span style={badgeStyle(data.checkoutRuntime.status)}>
                {statusLabel(data.checkoutRuntime.status)}
              </span>
            </div>
            <h2 style={styles.cardTitle}>{data.checkoutRuntime.title}</h2>
            <p style={styles.cardText}>{data.checkoutRuntime.message}</p>
          </article>
        </section>

        <section style={styles.gridTwo}>
          <article style={styles.section}>
            <div style={styles.sectionHeader}>
              <p style={styles.sectionEyebrow}>Tip setup</p>
              <h2 style={styles.sectionTitle}>{data.tipInfrastructure.title}</h2>
              <p style={styles.sectionText}>{data.tipInfrastructure.message}</p>
            </div>

            <div style={styles.checkGrid}>
              {data.tipInfrastructure.checks.map((check) => (
                <div key={check.label} style={styles.checkCard}>
                  <p style={styles.checkLabel}>{check.label}</p>
                  <p style={styles.checkValue}>{check.value}</p>
                </div>
              ))}
            </div>
          </article>

          <article style={styles.section}>
            <div style={styles.sectionHeader}>
              <p style={styles.sectionEyebrow}>Current tip settings</p>
              <h2 style={styles.sectionTitle}>{data.settingsSummary.heading}</h2>
              <p style={styles.sectionText}>
                This is a compact summary of what buyers currently see in the
                checkout tip block.
              </p>
            </div>

            <div style={styles.settingsList}>
              <div style={styles.settingsRow}>
                <p style={styles.settingsKey}>Button label</p>
                <p style={styles.settingsValue}>{data.settingsSummary.ctaLabel}</p>
              </div>
              <div style={styles.settingsRow}>
                <p style={styles.settingsKey}>Hide until opt-in</p>
                <p style={styles.settingsValue}>
                  {data.settingsSummary.hideUntilOptIn ? "On" : "Off"}
                </p>
              </div>
              <div style={{ display: "grid", gap: "10px" }}>
                <p style={styles.settingsKey}>Preset percentages</p>
                <div style={styles.presetRow}>
                  {data.settingsSummary.presets.map((preset) => (
                    <span key={preset} style={styles.presetChip}>
                      {preset}%
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </article>
        </section>

      </div>
    </div>
  );
}

export const headers = (args) => boundary.headers(args);
