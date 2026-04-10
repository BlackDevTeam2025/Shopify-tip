import { useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticateBillingRoute } from "../billing/gate.server";

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
    gap: "20px",
  },
  header: {
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
  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "16px",
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
    fontSize: "32px",
    lineHeight: 1.05,
    fontWeight: 800,
    color: "#111827",
    letterSpacing: "-0.04em",
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
};

function statusLabel(status) {
  if (status === "ready") return "Ready";
  if (status === "blocked") return "Blocked";
  return "Attention";
}

function formatMoney(amount, currency) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(amount ?? 0));
  } catch {
    return `${currency} ${Number(amount ?? 0).toFixed(2)}`;
  }
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
    shop: session?.shop ?? "",
    licenseState,
    shopEligibility,
  });
};

export default function Index() {
  const data = useLoaderData();

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <div style={styles.titleRow}>
            <h1 style={styles.pageTitle}>Home</h1>
            <span style={badgeStyle(data.license.status)}>
              {statusLabel(data.license.status)}
            </span>
          </div>
          <p style={styles.pageIntro}>
            {data.header.subtitle}
          </p>
        </header>

        <section style={styles.kpiGrid}>
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
              <p style={styles.cardLabel}>Total tips (net, 60 days)</p>
              <span style={badgeStyle(data.tipMetrics.status)}>
                {statusLabel(data.tipMetrics.status)}
              </span>
            </div>
            <h2 style={styles.cardTitle}>
              {formatMoney(data.tipMetrics.totalNet, data.tipMetrics.currency)}
            </h2>
            <p style={styles.cardText}>{data.tipMetrics.message}</p>
          </article>
        </section>
      </div>
    </div>
  );
}

export const headers = (args) => boundary.headers(args);
