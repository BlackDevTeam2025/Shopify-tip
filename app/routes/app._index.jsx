import { useLoaderData, useLocation } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticateBillingRoute } from "../billing/gate.server";
import { appendEmbeddedSearch } from "../embedded-app-url.js";

const styles = {
  page: {
    minHeight: "100%",
    background: "#f5f7fa",
    padding: "28px 24px 40px",
  },
  container: {
    maxWidth: "1360px",
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
    fontSize: "30px",
    lineHeight: 1.1,
    fontWeight: 700,
    letterSpacing: "-0.02em",
    color: "#111827",
  },
  pageIntro: {
    margin: 0,
    maxWidth: "760px",
    fontSize: "14px",
    lineHeight: 1.55,
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
    padding: "22px",
    display: "grid",
    gap: "10px",
  },
  cardTop: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "12px",
  },
  cardLabel: {
    margin: 0,
    fontSize: "11px",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    fontWeight: 700,
    color: "#6b7280",
  },
  cardTitle: {
    margin: 0,
    fontSize: "24px",
    lineHeight: 1.15,
    fontWeight: 700,
    color: "#111827",
    letterSpacing: "-0.02em",
  },
  cardText: {
    margin: 0,
    fontSize: "14px",
    lineHeight: 1.55,
    color: "#4b5563",
  },
  chartCard: {
    borderRadius: "20px",
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    padding: "28px",
    display: "grid",
    gap: "20px",
  },
  chartHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "16px",
    flexWrap: "wrap",
  },
  chartIntro: {
    display: "grid",
    gap: "8px",
  },
  chartTitle: {
    margin: 0,
    fontSize: "24px",
    lineHeight: 1.2,
    fontWeight: 700,
    letterSpacing: "-0.02em",
    color: "#111827",
  },
  chartSubtitle: {
    margin: 0,
    fontSize: "13px",
    lineHeight: 1.5,
    color: "#6b7280",
  },
  filterRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  },
  filterPill: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "54px",
    height: "36px",
    padding: "0 12px",
    borderRadius: "999px",
    border: "1px solid #d1d5db",
    background: "#ffffff",
    color: "#374151",
    fontSize: "12px",
    fontWeight: 700,
    textDecoration: "none",
  },
  filterPillActive: {
    borderColor: "#111827",
    background: "#111827",
    color: "#ffffff",
  },
  statGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "16px",
  },
  statCard: {
    borderRadius: "16px",
    border: "1px solid #e5e7eb",
    background: "#f9fafb",
    padding: "18px 20px",
    display: "grid",
    gap: "8px",
  },
  statLabel: {
    margin: 0,
    fontSize: "11px",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    fontWeight: 700,
    color: "#6b7280",
  },
  statValue: {
    margin: 0,
    fontSize: "24px",
    lineHeight: 1.15,
    fontWeight: 700,
    letterSpacing: "-0.02em",
    color: "#111827",
  },
  statText: {
    margin: 0,
    fontSize: "13px",
    lineHeight: 1.5,
    color: "#6b7280",
  },
  chartWrap: {
    borderRadius: "18px",
    border: "1px solid #e5e7eb",
    background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
    padding: "24px",
  },
  chartEmpty: {
    minHeight: "320px",
    display: "grid",
    placeItems: "center",
    textAlign: "center",
    color: "#6b7280",
    fontSize: "14px",
    lineHeight: 1.55,
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: "30px",
    padding: "0 10px",
    borderRadius: "999px",
    fontSize: "10px",
    fontWeight: 700,
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

function formatCompactNumber(value) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));
}

function formatTrendDate(value) {
  const date = new Date(`${value}T00:00:00Z`);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function formatTooltipDate(value) {
  const date = new Date(`${value}T00:00:00Z`);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function getChartMax(points) {
  const rawMax = Math.max(...points.map((point) => Number(point.netAmount ?? 0)), 0);
  if (rawMax <= 0) {
    return 10;
  }

  const magnitude = 10 ** Math.max(String(Math.floor(rawMax)).length - 1, 0);
  return Math.ceil(rawMax / magnitude) * magnitude;
}

function buildTrendPresentation(points = []) {
  const width = 960;
  const height = 320;
  const padding = { top: 12, right: 12, bottom: 34, left: 54 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const safePoints = points.length > 0 ? points : [{ date: "", netAmount: 0 }];
  const maxValue = getChartMax(safePoints);

  const positionX = (index) =>
    padding.left +
    (index / Math.max(safePoints.length - 1, 1)) * chartWidth;
  const positionY = (value) =>
    padding.top + chartHeight - (Number(value ?? 0) / maxValue) * chartHeight;

  const linePath = safePoints
    .map((point, index) => {
      const prefix = index === 0 ? "M" : "L";
      return `${prefix} ${positionX(index).toFixed(2)} ${positionY(point.netAmount).toFixed(2)}`;
    })
    .join(" ");

  const areaPath = `${linePath} L ${positionX(safePoints.length - 1).toFixed(2)} ${(padding.top + chartHeight).toFixed(2)} L ${positionX(0).toFixed(2)} ${(padding.top + chartHeight).toFixed(2)} Z`;
  const yTicks = [maxValue, maxValue / 2, 0].map((value) => ({
    value,
    y: positionY(value),
  }));
  const xTicks = [
    safePoints[0],
    safePoints[Math.floor((safePoints.length - 1) / 2)],
    safePoints[safePoints.length - 1],
  ]
    .filter(Boolean)
    .map((point, index, collection) => ({
      label: point.date ? formatTrendDate(point.date) : "",
      x:
        index === 0
          ? positionX(0)
          : index === collection.length - 1
            ? positionX(safePoints.length - 1)
            : positionX(Math.floor((safePoints.length - 1) / 2)),
    }));
  const pointPositions = safePoints.map((point, index) => ({
    date: point.date,
    netAmount: Number(point.netAmount ?? 0),
    x: positionX(index),
    y: positionY(point.netAmount),
  }));

  return {
    width,
    height,
    linePath,
    areaPath,
    yTicks,
    xTicks,
    pointPositions,
  };
}

function buildRangeHref(search, windowDays) {
  const params = new URLSearchParams(search);
  params.set("range", String(windowDays));
  return appendEmbeddedSearch("/app", `?${params.toString()}`);
}

export const loader = async ({ request }) => {
  const { admin, licenseState, shopEligibility, session } =
    await authenticateBillingRoute(request);
  const { loadHomeDashboardData } = await import("../home-dashboard.server.js");
  const url = new URL(request.url);

  return loadHomeDashboardData({
    admin,
    shop: session?.shop ?? "",
    licenseState,
    shopEligibility,
    selectedWindowDays: url.searchParams.get("range"),
  });
};

export default function Index() {
  const data = useLoaderData();
  const location = useLocation();
  const chart = buildTrendPresentation(data.tipMetrics.trend);

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
              <p style={styles.cardLabel}>Total tips (net)</p>
              <span style={badgeStyle(data.tipMetrics.status)}>
                {statusLabel(data.tipMetrics.status)}
              </span>
            </div>
            <h2 style={styles.cardTitle}>
              {formatMoney(
                data.tipMetrics.summary.totalNet,
                data.tipMetrics.summary.currency,
              )}
            </h2>
            <p style={styles.cardText}>{data.tipMetrics.message}</p>
          </article>
        </section>

        <section style={styles.chartCard}>
          <div style={styles.chartHeader}>
            <div style={styles.chartIntro}>
              <h2 style={styles.chartTitle}>Tip trend</h2>
              <p style={styles.chartSubtitle}>
                {`Primary currency: ${data.tipMetrics.trendCurrency} · ${data.tipMetrics.selectedWindowDays} day view`}
              </p>
            </div>
            <div style={styles.filterRow}>
              {data.tipMetrics.rangeOptions.map((windowDays) => {
                const isActive =
                  windowDays === data.tipMetrics.selectedWindowDays;

                return (
                  <a
                    key={windowDays}
                    href={buildRangeHref(location.search, windowDays)}
                    style={{
                      ...styles.filterPill,
                      ...(isActive ? styles.filterPillActive : {}),
                    }}
                  >
                    {`${windowDays}D`}
                  </a>
                );
              })}
            </div>
          </div>

          <div style={styles.statGrid}>
            <div style={styles.statCard}>
              <p style={styles.statLabel}>Selected range total</p>
              <p style={styles.statValue}>
                {formatMoney(
                  data.tipMetrics.summary.totalNet,
                  data.tipMetrics.summary.currency,
                )}
              </p>
              <p style={styles.statText}>
                {`Net tips collected in the last ${data.tipMetrics.selectedWindowDays} days.`}
              </p>
            </div>

            <div style={styles.statCard}>
              <p style={styles.statLabel}>Contributing orders</p>
              <p style={styles.statValue}>
                {formatCompactNumber(data.tipMetrics.summary.ordersWithTip)}
              </p>
              <p style={styles.statText}>
                Orders that contributed a net tip in the selected window.
              </p>
            </div>
          </div>

          <div style={styles.chartWrap}>
            {data.tipMetrics.hasData ? (
              <svg
                viewBox={`0 0 ${chart.width} ${chart.height}`}
                role="img"
                aria-label={`Tip trend for the last ${data.tipMetrics.selectedWindowDays} days`}
                style={{ width: "100%", height: "320px", display: "block" }}
              >
                {chart.yTicks.map((tick) => (
                  <g key={tick.value}>
                    <line
                      x1="54"
                      x2="948"
                      y1={tick.y}
                      y2={tick.y}
                      stroke="#e5e7eb"
                      strokeWidth="1"
                    />
                    <text
                      x="0"
                      y={tick.y + 5}
                      fill="#6b7280"
                      fontSize="12"
                    >
                      {formatMoney(tick.value, data.tipMetrics.trendCurrency)}
                    </text>
                  </g>
                ))}

                <path
                  d={chart.areaPath}
                  fill="#2563eb"
                  opacity="0.08"
                />
                <path
                  d={chart.linePath}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {chart.pointPositions.map((point) => (
                  <g key={point.date}>
                    <circle
                      cx={point.x.toFixed(2)}
                      cy={point.y.toFixed(2)}
                      r="12"
                      fill="transparent"
                    >
                      <title>
                        {`${formatTooltipDate(point.date)} · ${formatMoney(
                          point.netAmount,
                          data.tipMetrics.trendCurrency,
                        )}`}
                      </title>
                    </circle>
                    <circle
                      cx={point.x.toFixed(2)}
                      cy={point.y.toFixed(2)}
                      r="3.5"
                      fill="#1d4ed8"
                      pointerEvents="none"
                    />
                  </g>
                ))}

                {chart.xTicks.map((tick, index) => (
                  <text
                    key={`${tick.label}-${index}`}
                    x={tick.x}
                    y={chart.height - 8}
                    textAnchor={
                      index === 0
                        ? "start"
                        : index === chart.xTicks.length - 1
                          ? "end"
                          : "middle"
                    }
                    fill="#6b7280"
                    fontSize="12"
                  >
                    {tick.label}
                  </text>
                ))}
              </svg>
            ) : (
              <div style={styles.chartEmpty}>
                <p style={{ margin: 0, maxWidth: "420px" }}>
                  No tip orders were recorded in this date range yet. The chart
                  will appear once paid orders with tip lines are synced.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export const headers = (args) => boundary.headers(args);
