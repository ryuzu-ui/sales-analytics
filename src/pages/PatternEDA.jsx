import { useMemo, useState } from "react";
import {
  Activity,
  CircleAlert,
  Eye,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import { useSalesData } from "../context/SalesDataContext";

function formatCurrency(value) {
  return `£${Number(value || 0).toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatCompactCurrency(value) {
  const number = Number(value || 0);

  if (Math.abs(number) >= 1000000) {
    return `£${(number / 1000000).toFixed(1)}M`;
  }

  if (Math.abs(number) >= 1000) {
    return `£${Math.round(number / 1000)}k`;
  }

  return formatCurrency(number);
}

function PatternEDA() {
  const [view, setView] = useState("trend");

  const {
    salesRecords,
    monthlySales,
    topProducts,
    isImported,
    isCleaned,
  } = useSalesData();

  /*
   * ============================================================
   * PERIOD-TO-PERIOD PATTERN DATA
   * ============================================================
   */

  const patternData = useMemo(() => {
    return monthlySales.map((item, index) => {
      const previous =
        index > 0
          ? monthlySales[index - 1].revenue
          : item.revenue;

      const change =
        previous !== 0
          ? ((item.revenue - previous) /
              Math.abs(previous)) *
            100
          : 0;

      return {
        ...item,
        change: Number(change.toFixed(1)),
      };
    });
  }, [monthlySales]);

  /*
   * ============================================================
   * PATTERN SUMMARY
   * ============================================================
   */

  const patternSummary = useMemo(() => {
    if (!monthlySales.length) {
      return {
        highest: null,
        lowest: null,
        average: 0,
        growth: 0,
      };
    }

    const highest = monthlySales.reduce((a, b) =>
      b.revenue > a.revenue ? b : a
    );

    const lowest = monthlySales.reduce((a, b) =>
      b.revenue < a.revenue ? b : a
    );

    const average =
      monthlySales.reduce(
        (sum, item) =>
          sum + Number(item.revenue || 0),
        0
      ) / monthlySales.length;

    const first = Number(
      monthlySales[0].revenue || 0
    );

    const last = Number(
      monthlySales[monthlySales.length - 1].revenue || 0
    );

    const growth =
      first !== 0
        ? ((last - first) /
            Math.abs(first)) *
          100
        : 0;

    return {
      highest,
      lowest,
      average,
      growth,
    };
  }, [monthlySales]);

  /*
   * ============================================================
   * COUNTRY PATTERN
   *
   * The UCI Online Retail dataset does not contain a true
   * product-category field. It contains Country.
   *
   * Therefore, this section uses geographic distribution instead
   * of pretending every record belongs to a real category.
   * ============================================================
   */

  const countryPattern = useMemo(() => {
    const map = new Map();

    salesRecords.forEach((row) => {
      const country =
        String(row.region || "").trim() ||
        "Unknown";

      if (!map.has(country)) {
        map.set(country, {
          country,
          revenue: 0,
          units: 0,
        });
      }

      const entry = map.get(country);

      entry.revenue +=
        Number(row.revenue) || 0;

      entry.units +=
        Number(row.quantity) || 0;
    });

    return Array.from(map.values())
      .sort(
        (a, b) =>
          b.revenue - a.revenue
      )
      .slice(0, 10);
  }, [salesRecords]);

  /*
   * ============================================================
   * OUTLIER DETECTION
   *
   * Uses the IQR method rather than mean + standard deviation.
   * This is more appropriate for highly skewed transaction data.
   * ============================================================
   */

  const outliers = useMemo(() => {
    if (!salesRecords.length) {
      return [];
    }

    const validRows = salesRecords.filter(
      (row) =>
        Number.isFinite(
          Number(row.revenue)
        ) &&
        Number(row.revenue) > 0
    );

    if (!validRows.length) {
      return [];
    }

    const values = validRows
      .map((row) => Number(row.revenue))
      .sort((a, b) => a - b);

    const percentile = (array, p) => {
      if (!array.length) return 0;

      const index =
        (array.length - 1) * p;

      const lower = Math.floor(index);
      const upper = Math.ceil(index);

      if (lower === upper) {
        return array[lower];
      }

      return (
        array[lower] +
        (array[upper] -
          array[lower]) *
          (index - lower)
      );
    };

    const q1 = percentile(values, 0.25);
    const q3 = percentile(values, 0.75);

    const iqr = q3 - q1;

    const upperFence =
      q3 + 1.5 * iqr;

    return validRows
      .filter(
        (row) =>
          Number(row.revenue) >
          upperFence
      )
      .sort(
        (a, b) =>
          Number(b.revenue) -
          Number(a.revenue)
      )
      .slice(0, 5);
  }, [salesRecords]);

  /*
   * ============================================================
   * EDA OBSERVATIONS
   * ============================================================
   */

  const trendObservation = useMemo(() => {
    if (!monthlySales.length) {
      return "No monthly sales data is available for analysis.";
    }

    if (patternSummary.growth > 0) {
      return `Revenue increased from ${formatCurrency(
        monthlySales[0].revenue
      )} in ${monthlySales[0].label} to ${formatCurrency(
        monthlySales.at(-1).revenue
      )} in ${monthlySales.at(-1).label}.`;
    }

    if (patternSummary.growth < 0) {
      return `Revenue decreased from ${formatCurrency(
        monthlySales[0].revenue
      )} in ${monthlySales[0].label} to ${formatCurrency(
        monthlySales.at(-1).revenue
      )} in ${monthlySales.at(-1).label}.`;
    }

    return "Revenue remained unchanged between the first and latest period.";
  }, [monthlySales, patternSummary]);

  const variationObservation = useMemo(() => {
    if (patternData.length < 2) {
      return "There are not enough periods to evaluate period-to-period variation.";
    }

    const increases = patternData.filter(
      (item, index) =>
        index > 0 && item.change > 0
    ).length;

    const decreases = patternData.filter(
      (item, index) =>
        index > 0 && item.change < 0
    ).length;

    return `${increases} period-to-period increases and ${decreases} decreases were observed across the available monthly periods.`;
  }, [patternData]);

  /*
   * ============================================================
   * EMPTY STATE
   * ============================================================
   */

  if (!isImported || !salesRecords.length) {
    return (
      <div className="pattern-eda-page">
        <section className="pattern-heading">
          <div>
            <div className="section-kicker">
              <span className="kicker-block">
                04
              </span>
              EXPLORATORY DATA ANALYSIS
            </div>

            <h1>PATTERN + EDA</h1>

            <p>
              Explore sales behavior, identify
              trends, compare performance,
              detect unusual transactions, and
              recognize recurring patterns in the
              dataset.
            </p>
          </div>
        </section>

        <div className="pattern-main-card">
          <div className="no-outlier">
            <Activity size={28} />

            <strong>
              Import a sales dataset to begin
              exploratory analysis.
            </strong>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pattern-eda-page">
      {/* HEADER */}
      <section className="pattern-heading">
        <div>
          <div className="section-kicker">
            <span className="kicker-block">
              04
            </span>
            EXPLORATORY DATA ANALYSIS
          </div>

          <h1>PATTERN + EDA</h1>

          <p>
            Explore sales behavior, identify
            trends, compare performance, detect
            unusual transactions, and recognize
            recurring patterns in the dataset.
          </p>
        </div>

        <div className="pattern-view-switch">
          <button
            className={
              view === "trend" ? "active" : ""
            }
            onClick={() => setView("trend")}
          >
            TREND
          </button>

          <button
            className={
              view === "country"
                ? "active"
                : ""
            }
            onClick={() =>
              setView("country")
            }
          >
            COUNTRY
          </button>
        </div>
      </section>

      {/* PATTERN SUMMARY */}
      <section className="pattern-summary-grid">
        <PatternCard
          icon={<TrendingUp size={22} />}
          label="OVERALL TREND"
          value={`${
            patternSummary.growth >= 0
              ? "+"
              : ""
          }${patternSummary.growth.toFixed(
            1
          )}%`}
          description="Change from first to latest period"
          accent="purple"
        />

        <PatternCard
          icon={<Activity size={22} />}
          label="AVERAGE MONTHLY"
          value={formatCompactCurrency(
            patternSummary.average
          )}
          description="Mean monthly revenue"
          accent="yellow"
        />

        <PatternCard
          icon={<TrendingUp size={22} />}
          label="HIGHEST PERIOD"
          value={
            patternSummary.highest?.label ||
            "N/A"
          }
          description={
            patternSummary.highest
              ? `${formatCurrency(
                  patternSummary.highest
                    .revenue
                )} revenue`
              : "No data"
          }
          accent="pink"
        />

        <PatternCard
          icon={<TrendingDown size={22} />}
          label="LOWEST PERIOD"
          value={
            patternSummary.lowest?.label ||
            "N/A"
          }
          description={
            patternSummary.lowest
              ? `${formatCurrency(
                  patternSummary.lowest.revenue
                )} revenue`
              : "No data"
          }
          accent="white"
        />
      </section>

      {/* MAIN EXPLORATION */}
      <section className="pattern-main-card">
        <div className="pattern-card-header">
          <div>
            <span className="studio-label">
              {view === "trend"
                ? "TIME SERIES EXPLORATION"
                : "GEOGRAPHIC DISTRIBUTION"}
            </span>

            <h2>
              {view === "trend"
                ? "SALES TREND OVER TIME"
                : "REVENUE BY COUNTRY"}
            </h2>
          </div>

          <div className="pattern-header-tag">
            <Eye size={16} />
            EXPLORING
          </div>
        </div>

        <div className="pattern-chart">
          {view === "trend" ? (
            <ResponsiveContainer
              width="100%"
              height={390}
            >
              <AreaChart
                data={patternData}
                margin={{
                  top: 20,
                  right: 25,
                  left: 5,
                  bottom: 5,
                }}
              >
                <defs>
                  <linearGradient
                    id="salesPatternFill"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#bc9fdb"
                      stopOpacity={0.8}
                    />

                    <stop
                      offset="100%"
                      stopColor="#bc9fdb"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  stroke="#111"
                  strokeDasharray="4 4"
                  opacity={0.14}
                />

                <XAxis
                  dataKey="label"
                  tick={{
                    fill: "#111",
                    fontSize: 10,
                  }}
                  axisLine={{
                    stroke: "#111",
                    strokeWidth: 2,
                  }}
                  tickLine={false}
                />

                <YAxis
                  tick={{
                    fill: "#111",
                    fontSize: 10,
                  }}
                  axisLine={{
                    stroke: "#111",
                    strokeWidth: 2,
                  }}
                  tickLine={false}
                  tickFormatter={(value) =>
                    formatCompactCurrency(
                      value
                    )
                  }
                />

                <Tooltip
                  formatter={(value) => [
                    formatCurrency(value),
                    "Revenue",
                  ]}
                  labelFormatter={(label) =>
                    label
                  }
                  contentStyle={{
                    border: "3px solid #111",
                    boxShadow:
                      "5px 5px 0 #111",
                    fontFamily:
                      "Public Sans",
                    fontWeight: 700,
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#111"
                  strokeWidth={4}
                  fill="url(#salesPatternFill)"
                  dot={{
                    r: 4,
                    fill: "#f2d048",
                    stroke: "#111",
                    strokeWidth: 2,
                  }}
                  activeDot={{
                    r: 7,
                    fill: "#f08cb6",
                    stroke: "#111",
                    strokeWidth: 3,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer
              width="100%"
              height={390}
            >
              <BarChart
                data={countryPattern}
                margin={{
                  top: 20,
                  right: 25,
                  left: 5,
                  bottom: 5,
                }}
              >
                <CartesianGrid
                  stroke="#111"
                  strokeDasharray="4 4"
                  opacity={0.14}
                />

                <XAxis
                  dataKey="country"
                  tick={{
                    fill: "#111",
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                  axisLine={{
                    stroke: "#111",
                    strokeWidth: 2,
                  }}
                  tickLine={false}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={70}
                />

                <YAxis
                  tick={{
                    fill: "#111",
                    fontSize: 10,
                  }}
                  axisLine={{
                    stroke: "#111",
                    strokeWidth: 2,
                  }}
                  tickLine={false}
                  tickFormatter={(value) =>
                    formatCompactCurrency(
                      value
                    )
                  }
                />

                <Tooltip
                  formatter={(value) => [
                    formatCurrency(value),
                    "Revenue",
                  ]}
                  contentStyle={{
                    border: "3px solid #111",
                    boxShadow:
                      "5px 5px 0 #111",
                    fontFamily:
                      "Public Sans",
                    fontWeight: 700,
                  }}
                />

                <Bar
                  dataKey="revenue"
                  fill="#f08cb6"
                  stroke="#111"
                  strokeWidth={3}
                  barSize={55}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* MONTHLY PATTERN TABLE */}
      <section className="pattern-table-card">
        <div className="pattern-card-header yellow-pattern-header">
          <div>
            <span className="studio-label">
              PATTERN DETECTION
            </span>

            <h2>
              PERIOD-TO-PERIOD CHANGE
            </h2>
          </div>

          <span className="pattern-count">
            {patternData.length} PERIODS
          </span>
        </div>

        <div className="pattern-table-wrapper">
          <table className="pattern-table">
            <thead>
              <tr>
                <th>PERIOD</th>
                <th>REVENUE</th>
                <th>CHANGE</th>
                <th>DIRECTION</th>
                <th>OBSERVATION</th>
              </tr>
            </thead>

            <tbody>
              {patternData.map(
                (item, index) => {
                  const direction =
                    item.change > 0
                      ? "INCREASE"
                      : item.change < 0
                      ? "DECREASE"
                      : "STABLE";

                  return (
                    <tr
                      key={`${item.key}-${index}`}
                    >
                      <td className="pattern-period">
                        {String(
                          index + 1
                        ).padStart(2, "0")}{" "}
                        / {item.label}
                      </td>

                      <td className="pattern-revenue">
                        {formatCurrency(
                          item.revenue
                        )}
                      </td>

                      <td>
                        <span
                          className={`change-pill ${
                            item.change > 0
                              ? "increase"
                              : item.change < 0
                              ? "decrease"
                              : "stable"
                          }`}
                        >
                          {item.change > 0
                            ? "+"
                            : ""}
                          {item.change}%
                        </span>
                      </td>

                      <td>
                        <span className="direction-cell">
                          {item.change >
                          0 ? (
                            <TrendingUp
                              size={16}
                            />
                          ) : item.change <
                            0 ? (
                            <TrendingDown
                              size={16}
                            />
                          ) : (
                            <Activity
                              size={16}
                            />
                          )}

                          {direction}
                        </span>
                      </td>

                      <td className="observation-cell">
                        {index === 0
                          ? "Baseline period"
                          : item.change > 5
                          ? "Strong upward movement"
                          : item.change > 0
                          ? "Moderate increase"
                          : item.change < -5
                          ? "Notable decline"
                          : item.change < 0
                          ? "Slight decline"
                          : "No significant change"}
                      </td>
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* OUTLIERS + OBSERVATIONS */}
      <section className="pattern-bottom-grid">
        <div className="outlier-card">
          <div className="pattern-card-header pink-pattern-header">
            <div>
              <span className="studio-label">
                ANOMALY CHECK
              </span>

              <h2>
                POTENTIAL OUTLIERS
              </h2>
            </div>

            <CircleAlert size={22} />
          </div>

          {outliers.length > 0 ? (
            <div className="outlier-list">
              {outliers.map((row) => (
                <div
                  className="outlier-row"
                  key={row.id}
                >
                  <div>
                    <strong>
                      {row.invoiceNo ||
                        row.id}
                    </strong>

                    <span>
                      {row.product ||
                        "Unknown Product"}
                    </span>
                  </div>

                  <strong>
                    {formatCurrency(
                      row.revenue
                    )}
                  </strong>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-outlier">
              <Activity size={25} />

              <strong>
                No potential outliers
                detected.
              </strong>
            </div>
          )}
        </div>

        <div className="pattern-insight-card">
          <span className="studio-label">
            EDA OBSERVATION
          </span>

          <h2>
            WHAT PATTERNS STAND OUT?
          </h2>

          <div className="pattern-observation-list">
            <Observation
              number="01"
              title="TREND"
              text={trendObservation}
            />

            <Observation
              number="02"
              title="PEAK"
              text={
                patternSummary.highest
                  ? `${patternSummary.highest.label} records the highest revenue at ${formatCurrency(
                      patternSummary.highest
                        .revenue
                    )}.`
                  : "No peak period can be identified."
              }
            />

            <Observation
              number="03"
              title="VARIATION"
              text={
                variationObservation
              }
            />
          </div>
        </div>
      </section>

      {/* TOP PRODUCTS PATTERN */}
      <section className="pattern-products-card">
        <div className="pattern-card-header">
          <div>
            <span className="studio-label">
              PRODUCT EXPLORATION
            </span>

            <h2>
              PRODUCT PERFORMANCE PATTERN
            </h2>
          </div>

          <span className="pattern-count">
            {topProducts.length} PRODUCTS
          </span>
        </div>

        <div className="pattern-product-grid">
          {topProducts.map(
            (product, index) => (
              <div
                className="pattern-product-card"
                key={product.name}
              >
                <div className="pattern-product-rank">
                  {String(
                    index + 1
                  ).padStart(2, "0")}
                </div>

                <h3>
                  {product.name}
                </h3>

                <span>
                  {product.category ||
                    "Product"}
                </span>

                <strong>
                  {formatCurrency(
                    product.sales
                  )}
                </strong>

                <small>
                  {Number(
                    product.units || 0
                  ).toLocaleString()}{" "}
                  units sold
                </small>
              </div>
            )
          )}
        </div>
      </section>

      {/* DATA METHOD NOTE */}
      <section className="pattern-main-card">
        <div className="pattern-card-header">
          <div>
            <span className="studio-label">
              EDA METHOD
            </span>

            <h2>
              DATA-DRIVEN PATTERN RECOGNITION
            </h2>
          </div>
        </div>

        <div
          style={{
            padding: "0 0 20px",
            lineHeight: 1.7,
          }}
        >
          <p>
            Pattern analysis is based on the
            currently loaded{" "}
            <strong>
              {isCleaned
                ? "cleaned"
                : "imported"}{" "}
              sales dataset
            </strong>
            . Monthly revenue is compared
            across consecutive periods to
            identify increases, decreases, and
            overall movement. Product and
            geographic patterns are aggregated
            directly from the transaction
            records.
          </p>

          <p>
            Potential revenue outliers are
            identified using the{" "}
            <strong>
              Interquartile Range (IQR)
            </strong>{" "}
            method, where transactions above
            the upper fence are flagged for
            further investigation.
          </p>
        </div>
      </section>
    </div>
  );
}

function PatternCard({
  icon,
  label,
  value,
  description,
  accent,
}) {
  return (
    <div
      className={`pattern-stat-card ${accent}`}
    >
      <div className="pattern-stat-icon">
        {icon}
      </div>

      <span>{label}</span>

      <strong>{value}</strong>

      <small>{description}</small>
    </div>
  );
}

function Observation({
  number,
  title,
  text,
}) {
  return (
    <div className="observation">
      <div className="observation-number">
        {number}
      </div>

      <div>
        <strong>{title}</strong>

        <p>{text}</p>
      </div>
    </div>
  );
}

export default PatternEDA;