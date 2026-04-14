import { useState } from "react";
import { useLoaderData, useLocation } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticateBillingRoute } from "../billing/gate.server";
import { appendEmbeddedSearch } from "../embedded-app-url.js";

const responsiveStyles = `
  @media (max-width: 1000px) {
    .home-kpi-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    }
  }

  @media (max-width: 760px) {
    .home-kpi-grid {
      grid-template-columns: 1fr !important;
    }

    .home-chart-header {
      flex-direction: column;
      align-items: flex-start !important;
    }
  }
`;

const styles = {
  page: {
    minHeight: "100%",
    background: "#f8fafc",
    padding: "24px 24px 44px",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  container: {
    maxWidth: "1760px",
    margin: "0 auto",
    display: "grid",
    gap: "22px",
  },
  header: {
    display: "grid",
    gap: "6px",
  },
  titleRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },
  title: {
    margin: 0,
    fontSize: "34px",
    lineHeight: 1.08,
    letterSpacing: "-0.03em",
    fontWeight: 700,
    color: "#0f172a",
  },
  liveBadge: {
    border: "1px solid #9ae6b4",
    background: "#dcfce7",
    color: "#047857",
    borderRadius: "999px",
    minHeight: "26px",
    display: "inline-flex",
    alignItems: "center",
    padding: "0 10px",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
  },
  liveBadgeBlocked: {
    borderColor: "#fecaca",
    background: "#fef2f2",
    color: "#b91c1c",
  },
  subtitle: {
    margin: 0,
    fontSize: "14px",
    lineHeight: 1.6,
    color: "#475569",
  },
  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "14px",
  },
  kpiCard: {
    borderRadius: "14px",
    border: "1px solid #e2e8f0",
    background: "#ffffff",
    padding: "16px 16px 14px",
    display: "grid",
    gap: "8px",
    boxShadow: "0 8px 22px rgba(15, 23, 42, 0.06)",
  },
  kpiLabel: {
    margin: 0,
    fontSize: "11px",
    lineHeight: 1.35,
    letterSpacing: "0.09em",
    textTransform: "uppercase",
    fontWeight: 700,
    color: "#64748b",
  },
  kpiValue: {
    margin: 0,
    fontSize: "36px",
    lineHeight: 1.05,
    letterSpacing: "-0.04em",
    fontWeight: 700,
    color: "#0f172a",
  },
  kpiValueCompact: {
    fontSize: "32px",
  },
  kpiSubtext: {
    margin: 0,
    fontSize: "12px",
    lineHeight: 1.5,
    color: "#475569",
  },
  deltaBadge: {
    justifySelf: "start",
    borderRadius: "999px",
    minHeight: "24px",
    display: "inline-flex",
    alignItems: "center",
    padding: "0 10px",
    fontSize: "11px",
    lineHeight: 1.2,
    fontWeight: 700,
  },
  deltaPositive: {
    background: "#dcfce7",
    color: "#047857",
    border: "1px solid #86efac",
  },
  deltaNegative: {
    background: "#fee2e2",
    color: "#b91c1c",
    border: "1px solid #fca5a5",
  },
  deltaNeutral: {
    background: "#e2e8f0",
    color: "#334155",
    border: "1px solid #cbd5e1",
  },
  chartCard: {
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    background: "#ffffff",
    padding: "16px 18px 18px",
    display: "grid",
    gap: "14px",
    boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)",
  },
  chartHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
  },
  chartTitleWrap: {
    display: "grid",
    gap: "2px",
  },
  chartTitle: {
    margin: 0,
    fontSize: "28px",
    lineHeight: 1.1,
    letterSpacing: "-0.03em",
    fontWeight: 700,
    color: "#0f172a",
  },
  chartSubtitle: {
    margin: 0,
    fontSize: "13px",
    lineHeight: 1.4,
    color: "#64748b",
  },
  rangePillGroup: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  },
  rangePill: {
    minWidth: "48px",
    height: "34px",
    borderRadius: "11px",
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#334155",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    textDecoration: "none",
    fontSize: "13px",
    fontWeight: 700,
  },
  rangePillActive: {
    borderColor: "#0f172a",
    background: "#0f172a",
    color: "#f8fafc",
  },
  chartWrap: {
    position: "relative",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    background: "#ffffff",
    padding: "16px",
    overflow: "hidden",
  },
  chartEmpty: {
    minHeight: "320px",
    display: "grid",
    placeItems: "center",
    textAlign: "center",
    color: "#64748b",
    fontSize: "14px",
    lineHeight: 1.55,
  },
  tooltip: {
    position: "absolute",
    minWidth: "170px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#0f172a",
    padding: "9px 10px",
    pointerEvents: "none",
    boxShadow: "0 10px 20px rgba(15, 23, 42, 0.15)",
    zIndex: 2,
  },
  tooltipDate: {
    margin: 0,
    fontSize: "11px",
    lineHeight: 1.3,
    color: "#64748b",
  },
  tooltipAmount: {
    margin: "4px 0 0",
    fontSize: "15px",
    lineHeight: 1.2,
    fontWeight: 700,
    color: "#0f172a",
  },
  chartFootnote: {
    margin: 0,
    fontSize: "11px",
    lineHeight: 1.4,
    color: "#64748b",
  },
};

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

function formatCompactNumber(value) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));
}

function formatAttachRate(value) {
  if (value === null || value === undefined) {
    return "—";
  }

  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return "—";
  }

  return `${Math.round(numeric)}%`;
}

function formatDelta(value) {
  if (value === null || value === undefined) {
    return "No baseline";
  }

  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return "No baseline";
  }

  const rounded = Number(numeric.toFixed(1));
  const prefix = rounded > 0 ? "+" : "";
  return `${prefix}${rounded}% vs prev period`;
}

function deltaTone(value) {
  if (value === null || value === undefined) {
    return styles.deltaNeutral;
  }

  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric === 0) {
    return styles.deltaNeutral;
  }

  return numeric > 0 ? styles.deltaPositive : styles.deltaNegative;
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
  const width = 1140;
  const height = 300;
  const padding = { top: 14, right: 14, bottom: 32, left: 48 };
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
  const yTicks = [1, 0.66, 0.33, 0].map((factor) => {
    const value = Number((maxValue * factor).toFixed(2));
    return {
      value,
      y: positionY(value),
    };
  });
  const middleIndex = Math.floor((safePoints.length - 1) / 2);
  const xTicks = [0, middleIndex, safePoints.length - 1].map((index) => ({
    x: positionX(index),
    label: safePoints[index]?.date ? formatTrendDate(safePoints[index].date) : "",
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

function getTooltipPosition(point, chart) {
  const xPercent = (point.x / chart.width) * 100;
  const yPercent = (point.y / chart.height) * 100;
  return {
    left: `calc(${Math.min(Math.max(xPercent, 12), 88)}% - 86px)`,
    top: `calc(${Math.max(yPercent - 20, 2)}% - 42px)`,
  };
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
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const isReady = data.license.status === "ready";

  return (
    <div style={styles.page}>
      <style>{responsiveStyles}</style>
      <div style={styles.container}>
        <header style={styles.header}>
          <div style={styles.titleRow}>
            <h1 style={styles.title}>Home</h1>
            <span
              style={{
                ...styles.liveBadge,
                ...(isReady ? {} : styles.liveBadgeBlocked),
              }}
            >
              Live
            </span>
          </div>
          <p style={styles.subtitle}>{data.header.subtitle}</p>
        </header>

        <section className="home-kpi-grid" style={styles.kpiGrid}>
          <article style={styles.kpiCard}>
            <p style={styles.kpiLabel}>Total tips (net)</p>
            <p style={styles.kpiValue}>
              {formatMoney(
                data.tipMetrics.summary.totalNet,
                data.tipMetrics.summary.currency,
              )}
            </p>
            <span
              style={{
                ...styles.deltaBadge,
                ...deltaTone(data.tipMetrics.summary.delta?.totalNet),
              }}
            >
              {formatDelta(data.tipMetrics.summary.delta?.totalNet)}
            </span>
          </article>

          <article style={styles.kpiCard}>
            <p style={styles.kpiLabel}>Contributing orders</p>
            <p style={{ ...styles.kpiValue, ...styles.kpiValueCompact }}>
              {formatCompactNumber(data.tipMetrics.summary.ordersWithTip)}
            </p>
            <span
              style={{
                ...styles.deltaBadge,
                ...deltaTone(data.tipMetrics.summary.delta?.ordersWithTip),
              }}
            >
              {formatDelta(data.tipMetrics.summary.delta?.ordersWithTip)}
            </span>
          </article>

          <article style={styles.kpiCard}>
            <p style={styles.kpiLabel}>Avg tip per order</p>
            <p style={{ ...styles.kpiValue, ...styles.kpiValueCompact }}>
              {formatMoney(
                data.tipMetrics.summary.averageTip,
                data.tipMetrics.summary.currency,
              )}
            </p>
            <span
              style={{
                ...styles.deltaBadge,
                ...deltaTone(data.tipMetrics.summary.delta?.averageTip),
              }}
            >
              {formatDelta(data.tipMetrics.summary.delta?.averageTip)}
            </span>
          </article>

          <article style={styles.kpiCard}>
            <p style={styles.kpiLabel}>Tip attach rate</p>
            <p style={{ ...styles.kpiValue, ...styles.kpiValueCompact }}>
              {formatAttachRate(data.tipMetrics.summary.tipAttachRate)}
            </p>
            <p style={styles.kpiSubtext}>
              of orders included a tip
            </p>
            <span
              style={{
                ...styles.deltaBadge,
                ...deltaTone(data.tipMetrics.summary.delta?.tipAttachRate),
              }}
            >
              {formatDelta(data.tipMetrics.summary.delta?.tipAttachRate)}
            </span>
          </article>
        </section>

        <section style={styles.chartCard}>
          <div className="home-chart-header" style={styles.chartHeader}>
            <div style={styles.chartTitleWrap}>
              <h2 style={styles.chartTitle}>Tip trend</h2>
              <p style={styles.chartSubtitle}>
                {`Daily net tips · ${data.tipMetrics.trendCurrency} · ${data.tipMetrics.selectedWindowDays}-day view`}
              </p>
            </div>

            <div style={styles.rangePillGroup}>
              {data.tipMetrics.rangeOptions.map((windowDays) => {
                const isActive = windowDays === data.tipMetrics.selectedWindowDays;
                return (
                  <a
                    key={windowDays}
                    href={buildRangeHref(location.search, windowDays)}
                    style={{
                      ...styles.rangePill,
                      ...(isActive ? styles.rangePillActive : {}),
                    }}
                  >
                    {`${windowDays}D`}
                  </a>
                );
              })}
            </div>
          </div>

          <div style={styles.chartWrap}>
            {hoveredPoint ? (
              <div style={{ ...styles.tooltip, ...getTooltipPosition(hoveredPoint, chart) }}>
                <p style={styles.tooltipDate}>
                  {formatTooltipDate(hoveredPoint.date)}
                </p>
                <p style={styles.tooltipAmount}>
                  {formatMoney(hoveredPoint.netAmount, data.tipMetrics.trendCurrency)}
                </p>
              </div>
            ) : null}

            {data.tipMetrics.hasData ? (
              <svg
                viewBox={`0 0 ${chart.width} ${chart.height}`}
                role="img"
                aria-label={`Tip trend for the last ${data.tipMetrics.selectedWindowDays} days`}
                style={{ width: "100%", height: "320px", display: "block" }}
              >
                {chart.yTicks.map((tick, index) => (
                  <g key={`${tick.value}-${index}`}>
                    <line
                      x1="48"
                      x2={chart.width - 14}
                      y1={tick.y}
                      y2={tick.y}
                      stroke="#e2e8f0"
                      strokeWidth="1"
                    />
                    <text
                      x="0"
                      y={tick.y + 4}
                      fill="#64748b"
                      fontSize="11"
                    >
                      {formatMoney(tick.value, data.tipMetrics.trendCurrency)}
                    </text>
                  </g>
                ))}

                <path d={chart.areaPath} fill="#93c5fd" opacity="0.2" />
                <path
                  d={chart.linePath}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {chart.pointPositions.map((point) => (
                  <g key={point.date}>
                    <circle
                      cx={point.x.toFixed(2)}
                      cy={point.y.toFixed(2)}
                      r="10"
                      fill="transparent"
                      onMouseEnter={() => setHoveredPoint(point)}
                      onMouseLeave={() => setHoveredPoint(null)}
                      onFocus={() => setHoveredPoint(point)}
                      onBlur={() => setHoveredPoint(null)}
                    />
                    <circle
                      cx={point.x.toFixed(2)}
                      cy={point.y.toFixed(2)}
                      r="2.6"
                      fill="#2563eb"
                      pointerEvents="none"
                    />
                  </g>
                ))}

                {chart.xTicks.map((tick, index) => (
                  <text
                    key={`${tick.label}-${index}`}
                    x={tick.x}
                    y={chart.height - 4}
                    textAnchor={
                      index === 0
                        ? "start"
                        : index === chart.xTicks.length - 1
                          ? "end"
                          : "middle"
                    }
                    fill="#64748b"
                    fontSize="11"
                  >
                    {tick.label}
                  </text>
                ))}
              </svg>
            ) : (
              <div style={styles.chartEmpty}>
                <p style={{ margin: 0, maxWidth: "440px" }}>
                  No tip orders were recorded in this date range yet. The chart
                  will appear once paid orders with tip lines are synced.
                </p>
              </div>
            )}
          </div>

          <p style={styles.chartFootnote}>
            Today&apos;s data can be partial and may appear lower than usual.
          </p>
        </section>
      </div>
    </div>
  );
}

export const headers = (args) => boundary.headers(args);
