import { useEffect, useRef, useState } from "react";
import { useLoaderData, useLocation } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticateBillingRoute } from "../billing/gate.server";
import { appendEmbeddedSearch } from "../embedded-app-url.js";

const responsiveStyles = `
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

const uiFontFamily =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const styles = {
  page: {
    minHeight: "100%",
    background: "#f5f7fa",
    padding: "32px 24px 40px",
    fontFamily: uiFontFamily,
  },
  container: {
    width: "100%",
    maxWidth: "1180px",
    margin: "0 auto",
    display: "grid",
    gap: "28px",
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "12px",
    flexWrap: "wrap",
  },
  titleWrap: {
    display: "grid",
    gap: "2px",
  },
  title: {
    margin: 0,
    fontSize: "22px",
    lineHeight: 1.2,
    letterSpacing: 0,
    fontWeight: 600,
    color: "#0f172a",
  },
  subtitle: {
    margin: 0,
    fontSize: "13px",
    lineHeight: 1.35,
    color: "#111827",
    fontWeight: 400,
  },
  dateSelectorWrap: {
    position: "relative",
  },
  dateTrigger: {
    minWidth: "200px",
    height: "36px",
    borderRadius: "12px",
    border: "0.5px solid #d1d5db",
    background: "#ffffff",
    color: "#111827",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
    padding: "0 11px",
    cursor: "pointer",
    fontSize: "13px",
    lineHeight: 1.2,
    fontWeight: 400,
    fontFamily: uiFontFamily,
  },
  dateTriggerLeft: {
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
  },
  dateTriggerIcon: {
    display: "inline-flex",
    color: "#6b7280",
  },
  dateDropdown: {
    position: "absolute",
    right: 0,
    top: "calc(100% + 6px)",
    minWidth: "200px",
    borderRadius: "12px",
    border: "0.5px solid #d1d5db",
    background: "#ffffff",
    boxShadow: "0 10px 26px rgba(15, 23, 42, 0.1)",
    padding: "6px",
    zIndex: 10,
  },
  dateOption: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: "8px",
    textDecoration: "none",
    color: "#111827",
    padding: "7px 8px",
    fontSize: "12px",
    lineHeight: 1.3,
    fontWeight: 400,
    fontFamily: uiFontFamily,
  },
  dateOptionActive: {
    color: "#0f6e56",
    fontWeight: 500,
  },
  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "18px",
  },
  kpiCard: {
    borderRadius: "18px",
    border: "0.5px solid #e5e7eb",
    background: "#ffffff",
    boxShadow: "0 8px 20px rgba(15, 23, 42, 0.04)",
    padding: "22px 24px",
    display: "grid",
    gap: "8px",
  },
  kpiLabel: {
    margin: 0,
    fontSize: "11px",
    lineHeight: 1.3,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    fontWeight: 500,
    color: "#111827",
  },
  kpiValue: {
    margin: 0,
    fontSize: "34px",
    lineHeight: 1.1,
    letterSpacing: 0,
    fontWeight: 500,
    color: "#0f172a",
  },
  kpiSubtext: {
    margin: 0,
    fontSize: "12px",
    lineHeight: 1.4,
    color: "#111827",
    fontWeight: 400,
  },
  deltaBadge: {
    justifySelf: "start",
    borderRadius: "999px",
    minHeight: "30px",
    display: "inline-flex",
    alignItems: "center",
    padding: "0 12px",
    fontSize: "10px",
    lineHeight: 1.2,
    fontWeight: 500,
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
    borderRadius: "18px",
    border: "0.5px solid #e5e7eb",
    background: "#ffffff",
    boxShadow: "0 8px 20px rgba(15, 23, 42, 0.04)",
    padding: "24px 28px 22px",
    display: "grid",
    gap: "18px",
  },
  chartHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: "8px",
  },
  chartLabel: {
    margin: 0,
    fontSize: "12px",
    lineHeight: 1.35,
    color: "#111827",
    fontWeight: 400,
  },
  chartWrap: {
    position: "relative",
    borderRadius: "12px",
    border: "none",
    background: "transparent",
    padding: 0,
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
    minWidth: "160px",
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
    fontSize: "14px",
    lineHeight: 1.2,
    fontWeight: 500,
    color: "#0f172a",
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
  const abs = Math.abs(rounded);
  const compact = Number.isInteger(abs) ? String(abs) : abs.toFixed(1);
  const arrow = rounded > 0 ? "↑" : "↓";
  return `${arrow} ${compact}% vs previous period`;
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
  const width = 1440;
  const height = 170;
  const padding = { top: 8, right: 10, bottom: 28, left: 46 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const safePoints = points.length > 0 ? points : [{ date: "", netAmount: 0 }];
  const maxValue = getChartMax(safePoints);

  const positionX = (index) =>
    padding.left +
    (index / Math.max(safePoints.length - 1, 1)) * chartWidth;
  const positionY = (value) =>
    padding.top + chartHeight - (Number(value ?? 0) / maxValue) * chartHeight;

  const pointsWithPosition = safePoints.map((point, index) => ({
    x: positionX(index),
    y: positionY(point.netAmount),
  }));

  const linePath = buildSmoothPath(pointsWithPosition);

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

function buildSmoothPath(points) {
  if (!points.length) {
    return "";
  }

  if (points.length === 1) {
    return `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  }

  let path = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;

  for (let index = 0; index < points.length - 1; index += 1) {
    const p0 = points[index - 1] ?? points[index];
    const p1 = points[index];
    const p2 = points[index + 1];
    const p3 = points[index + 2] ?? p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }

  return path;
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
  const [rangeOpen, setRangeOpen] = useState(false);
  const selectorRef = useRef(null);
  const rangeLabels = {
    7: "Last 7 days",
    30: "Last 30 days",
    60: "Last 60 days",
    90: "Last 90 days",
  };
  const selectedRangeLabel =
    rangeLabels[data.tipMetrics.selectedWindowDays] ??
    `Last ${data.tipMetrics.selectedWindowDays} days`;

  useEffect(() => {
    if (!rangeOpen) {
      return undefined;
    }

    const onPointerDown = (event) => {
      if (!selectorRef.current?.contains(event.target)) {
        setRangeOpen(false);
      }
    };

    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [rangeOpen]);

  return (
    <div style={styles.page}>
      <style>{responsiveStyles}</style>
      <div style={styles.container}>
        <header style={styles.header}>
          <div style={styles.titleWrap}>
            <h1 style={styles.title}>Home</h1>
            <p style={styles.subtitle}>{selectedRangeLabel}</p>
          </div>

          <div style={styles.dateSelectorWrap} ref={selectorRef}>
            <button
              type="button"
              style={styles.dateTrigger}
              onClick={() => setRangeOpen((value) => !value)}
            >
              <span style={styles.dateTriggerLeft}>
                <span style={styles.dateTriggerIcon}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <rect x="1" y="3" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.2" />
                    <path d="M5 1V4M11 1V4M1 7H15" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                </span>
                <span>{selectedRangeLabel}</span>
              </span>
              <span style={styles.dateTriggerIcon}>{rangeOpen ? "▴" : "▾"}</span>
            </button>

            {rangeOpen ? (
              <div style={styles.dateDropdown}>
                {data.tipMetrics.rangeOptions.map((windowDays) => {
                  const isActive = windowDays === data.tipMetrics.selectedWindowDays;
                  return (
                    <a
                      key={windowDays}
                      href={buildRangeHref(location.search, windowDays)}
                      style={{
                        ...styles.dateOption,
                        ...(isActive ? styles.dateOptionActive : {}),
                      }}
                      onClick={() => setRangeOpen(false)}
                    >
                      <span>{rangeLabels[windowDays] ?? `Last ${windowDays} days`}</span>
                      <span>{isActive ? "✓" : ""}</span>
                    </a>
                  );
                })}
              </div>
            ) : null}
          </div>
        </header>

        <section className="home-kpi-grid" style={styles.kpiGrid}>
          <article style={styles.kpiCard}>
            <p style={styles.kpiLabel}>{`TOTAL TIPS · ${data.tipMetrics.selectedWindowDays} DAYS`}</p>
            <p style={styles.kpiValue}>
              {formatMoney(
                data.tipMetrics.summary.totalNet,
                data.tipMetrics.summary.currency,
              )}
            </p>
            <p style={styles.kpiSubtext}>
              {`from ${data.tipMetrics.summary.ordersWithTip ?? 0} orders with a tip`}
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
            <p style={styles.kpiLabel}>{`TIP ATTACH RATE · ${data.tipMetrics.selectedWindowDays} DAYS`}</p>
            <p style={styles.kpiValue}>
              {formatAttachRate(data.tipMetrics.summary.tipAttachRate)}
            </p>
            <p style={styles.kpiSubtext}>
              {`${data.tipMetrics.summary.ordersWithTip ?? 0} of ${
                data.tipMetrics.summary.totalOrders ?? 0
              } orders tipped`}
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
            <p style={styles.chartLabel}>
              {`Daily tip revenue · last ${data.tipMetrics.selectedWindowDays} days`}
            </p>
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
                style={{ width: "100%", height: "180px", display: "block" }}
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

                <path d={chart.areaPath} fill="#1d9e75" opacity="0.08" />
                <path
                  d={chart.linePath}
                  fill="none"
                  stroke="#1d9e75"
                  strokeWidth="1.8"
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
                    {hoveredPoint?.date === point.date ? (
                      <circle
                        cx={point.x.toFixed(2)}
                        cy={point.y.toFixed(2)}
                        r="3.2"
                        fill="#1d9e75"
                        pointerEvents="none"
                      />
                    ) : null}
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
        </section>
      </div>
    </div>
  );
}

export const headers = (args) => boundary.headers(args);
