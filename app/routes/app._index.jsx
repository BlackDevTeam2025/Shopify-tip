import { useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticateBillingRoute } from "../billing/gate.server";

const SHOPIFY_FONT_FAMILY =
  'var(--p-font-family-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif)';

const styles = {
  page: {
    minHeight: "100%",
    background: "#f5f7fa",
    padding: "32px 24px 40px",
    fontFamily: SHOPIFY_FONT_FAMILY,
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
    fontSize: "26px",
    lineHeight: 1.25,
    fontWeight: 700,
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
  chartCard: {
    borderRadius: "16px",
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    padding: "20px",
    display: "grid",
    gap: "14px",
  },
  chartHeader: {
    display: "grid",
    gap: "6px",
  },
  chartTitle: {
    margin: 0,
    fontSize: "16px",
    lineHeight: 1.25,
    fontWeight: 700,
    color: "#111827",
  },
  chartSubtitle: {
    margin: 0,
    fontSize: "13px",
    lineHeight: 1.5,
    color: "#6b7280",
  },
  chartSvgWrap: {
    borderRadius: "12px",
    border: "1px solid #eef2f7",
    background: "#fbfdff",
    padding: "10px 12px",
  },
  chartEmpty: {
    margin: 0,
    fontSize: "13px",
    lineHeight: 1.6,
    color: "#6b7280",
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
    lineHeight: 1.25,
    fontWeight: 700,
    color: "#111827",
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

function formatShortDate(dateValue) {
  if (!dateValue) {
    return "";
  }

  const parsed = new Date(`${dateValue}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) {
    return String(dateValue);
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function createPolylinePath(points = []) {
  if (!points.length) {
    return "";
  }

  return points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`)
    .join(" ");
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
  const trend = Array.isArray(data.tipMetrics.trend) ? data.tipMetrics.trend : [];
  const chartWidth = 840;
  const chartHeight = 280;
  const padding = {
    top: 16,
    right: 16,
    bottom: 36,
    left: 42,
  };
  const chartInnerWidth = chartWidth - padding.left - padding.right;
  const chartInnerHeight = chartHeight - padding.top - padding.bottom;
  const maxTrendValue = Math.max(
    ...trend.map((point) => Number(point?.netAmount ?? 0)),
    0,
  );
  const chartMax = maxTrendValue > 0 ? maxTrendValue : 1;
  const trendPoints = trend.map((point, index) => {
    const ratio = trend.length > 1 ? index / (trend.length - 1) : 0;
    const x = Number((padding.left + ratio * chartInnerWidth).toFixed(2));
    const value = Number(point?.netAmount ?? 0);
    const y = Number(
      (padding.top + (1 - value / chartMax) * chartInnerHeight).toFixed(2),
    );

    return {
      x,
      y,
      value,
      date: point?.date ?? "",
    };
  });
  const chartPath = createPolylinePath(trendPoints);
  const xAxisY = padding.top + chartInnerHeight;
  const xTicks = trend.length
    ? [
        trend[0],
        trend[Math.floor((trend.length - 1) / 2)],
        trend[trend.length - 1],
      ]
    : [];
  const yTicks = [chartMax, chartMax / 2, 0];

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

        <section style={styles.chartCard}>
          <header style={styles.chartHeader}>
            <h2 style={styles.chartTitle}>Tip trend (60 days)</h2>
            <p style={styles.chartSubtitle}>
              {data.tipMetrics.trendCurrency
                ? `Primary currency: ${data.tipMetrics.trendCurrency}`
                : "No tip trend data yet."}
            </p>
          </header>

          {data.tipMetrics.hasData ? (
            <div style={styles.chartSvgWrap}>
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                width="100%"
                height="260"
                role="img"
                aria-label="Tip trend chart for the last 60 days"
              >
                {yTicks.map((tick, index) => {
                  const ratio = chartMax > 0 ? tick / chartMax : 0;
                  const y = Number(
                    (padding.top + (1 - ratio) * chartInnerHeight).toFixed(2),
                  );

                  return (
                    <g key={`${tick}-${index}`}>
                      <line
                        x1={padding.left}
                        y1={y}
                        x2={chartWidth - padding.right}
                        y2={y}
                        stroke="#e5e7eb"
                        strokeWidth="1"
                      />
                      <text
                        x={padding.left - 8}
                        y={y + 4}
                        textAnchor="end"
                        fontSize="11"
                        fill="#6b7280"
                      >
                        {formatMoney(tick, data.tipMetrics.trendCurrency ?? data.tipMetrics.currency)}
                      </text>
                    </g>
                  );
                })}

                <line
                  x1={padding.left}
                  y1={xAxisY}
                  x2={chartWidth - padding.right}
                  y2={xAxisY}
                  stroke="#cbd5e1"
                  strokeWidth="1.25"
                />

                {xTicks.map((tick, index) => {
                  if (!tick?.date) {
                    return null;
                  }

                  const pointIndex = trend.findIndex((item) => item?.date === tick.date);
                  if (pointIndex < 0) {
                    return null;
                  }

                  const ratio = trend.length > 1 ? pointIndex / (trend.length - 1) : 0;
                  const x = Number((padding.left + ratio * chartInnerWidth).toFixed(2));

                  return (
                    <text
                      key={`${tick.date}-${index}`}
                      x={x}
                      y={xAxisY + 20}
                      textAnchor="middle"
                      fontSize="11"
                      fill="#6b7280"
                    >
                      {formatShortDate(tick.date)}
                    </text>
                  );
                })}

                {chartPath ? (
                  <path
                    d={chartPath}
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                ) : null}

                {trendPoints.map((point) => (
                  <circle
                    key={point.date}
                    cx={point.x}
                    cy={point.y}
                    r="2.5"
                    fill="#2563eb"
                  />
                ))}
              </svg>
            </div>
          ) : (
            <p style={styles.chartEmpty}>
              No tip data in the last 60 days yet. The chart will appear after tipped
              orders are recorded.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

export const headers = (args) => boundary.headers(args);
