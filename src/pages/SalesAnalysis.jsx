import { useMemo, useState } from "react";
import {
  TrendingUp,
  ShoppingCart,
  PhilippinePeso,
  Calculator,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import { useSalesData } from "../context/SalesDataContext";

function formatCurrency(value, maximumFractionDigits = 0) {
  return `£${Number(value || 0).toLocaleString(undefined, {
    maximumFractionDigits,
  })}`;
}

function formatCompactCurrency(value) {
  const number = Number(value || 0);

  if (number >= 1_000_000) {
    return `£${(number / 1_000_000).toFixed(2)}M`;
  }

  if (number >= 1_000) {
    return `£${(number / 1_000).toFixed(1)}K`;
  }

  return formatCurrency(number);
}

function calculateMedian(values) {
  if (!values.length) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }

  return sorted[middle];
}

function calculateMode(values) {
  if (!values.length) return 0;

  const frequency = {};

  values.forEach((value) => {
    const key = String(value);

    frequency[key] = (frequency[key] || 0) + 1;
  });

  let mode = values[0];
  let highestFrequency = 0;

  Object.entries(frequency).forEach(([key, count]) => {
    if (count > highestFrequency) {
      highestFrequency = count;
      mode = Number(key);
    }
  });

  return mode;
}

function SalesAnalysis() {
  const [period, setPeriod] = useState("monthly");

  const {
    salesRecords,
    monthlySales,
    topProducts,
    summary,
    isImported,
    isCleaned,
  } = useSalesData();

  const analysis = useMemo(() => {
    if (!salesRecords.length) {
      return {
        totalRevenue: 0,
        totalUnits: 0,
        totalTransactions: 0,
        averageTransaction: 0,
        averageUnitPrice: 0,
        medianTransaction: 0,
        modeUnitPrice: 0,
        countryPerformance: [],
        highestCountry: null,
        lowestCountry: null,
        highestTransaction: null,
        lowestTransaction: null,
      };
    }

    const revenues = salesRecords
      .map((row) => Number(row.revenue || 0))
      .filter(Number.isFinite);

    const quantities = salesRecords
      .map((row) => Number(row.quantity || 0))
      .filter(Number.isFinite);

    const unitPrices = salesRecords
      .map((row) => Number(row.unitPrice || 0))
      .filter(Number.isFinite);

    const totalRevenue = revenues.reduce(
      (sum, value) => sum + value,
      0
    );

    const totalUnits = quantities.reduce(
      (sum, value) => sum + value,
      0
    );

    const totalTransactions = salesRecords.length;

    const averageTransaction =
      totalTransactions > 0
        ? totalRevenue / totalTransactions
        : 0;

    const averageUnitPrice =
      unitPrices.length > 0
        ? unitPrices.reduce((sum, value) => sum + value, 0) /
          unitPrices.length
        : 0;

    const medianTransaction = calculateMedian(revenues);

    const modeUnitPrice = calculateMode(unitPrices);

    /*
     * UCI Online Retail does not have a native category field.
     * Country is therefore used for geographic performance analysis.
     */
    const countryMap = {};

    salesRecords.forEach((row) => {
      const country = row.region || row.country || "Unknown";

      if (!countryMap[country]) {
        countryMap[country] = {
          country,
          revenue: 0,
          units: 0,
          transactions: 0,
        };
      }

      countryMap[country].revenue += Number(row.revenue || 0);
      countryMap[country].units += Number(row.quantity || 0);
      countryMap[country].transactions += 1;
    });

    const countryPerformance = Object.values(countryMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const highestCountry = countryPerformance[0] || null;

    const lowestCountry =
      countryPerformance.length > 0
        ? countryPerformance[countryPerformance.length - 1]
        : null;

    const highestTransaction = salesRecords.reduce(
      (highest, row) => {
        if (
          !highest ||
          Number(row.revenue || 0) >
            Number(highest.revenue || 0)
        ) {
          return row;
        }

        return highest;
      },
      null
    );

    const lowestTransaction = salesRecords.reduce(
      (lowest, row) => {
        if (
          !lowest ||
          Number(row.revenue || 0) <
            Number(lowest.revenue || 0)
        ) {
          return row;
        }

        return lowest;
      },
      null
    );

    return {
      totalRevenue,
      totalUnits,
      totalTransactions,
      averageTransaction,
      averageUnitPrice,
      medianTransaction,
      modeUnitPrice,
      countryPerformance,
      highestCountry,
      lowestCountry,
      highestTransaction,
      lowestTransaction,
    };
  }, [salesRecords]);

  const growth = useMemo(() => {
    if (!monthlySales || monthlySales.length < 2) {
      return 0;
    }

    const previous =
      Number(
        monthlySales[monthlySales.length - 2]?.revenue
      ) || 0;

    const current =
      Number(
        monthlySales[monthlySales.length - 1]?.revenue
      ) || 0;

    return previous !== 0
      ? ((current - previous) / Math.abs(previous)) * 100
      : 0;
  }, [monthlySales]);

  const chartData = useMemo(() => {
    if (period === "monthly") {
      return monthlySales;
    }

    if (period === "quarterly") {
      const quarters = [
        { month: "Q1", revenue: 0 },
        { month: "Q2", revenue: 0 },
        { month: "Q3", revenue: 0 },
        { month: "Q4", revenue: 0 },
      ];

      monthlySales.forEach((item, index) => {
        const quarter = Math.floor(index / 3);

        if (quarters[quarter]) {
          quarters[quarter].revenue +=
            Number(item.revenue || 0);
        }
      });

      return quarters;
    }

    return monthlySales.slice(-6);
  }, [period, monthlySales]);

  return (
    <div className="sales-analysis-page">

      {/* =========================
          HEADER
      ========================= */}

      <section className="analysis-heading">

        <div>

          <div className="section-kicker">
            <span className="kicker-block">03</span>
            DESCRIPTIVE ANALYSIS
          </div>

          <h1>SALES ANALYSIS</h1>

          <p>
            Understand overall sales performance using
            descriptive statistics, revenue trends,
            transaction volume, and geographic performance.
          </p>

        </div>

        <div className="analysis-period">

          <span>VIEW PERIOD</span>

          <select
            value={period}
            onChange={(event) =>
              setPeriod(event.target.value)
            }
          >
            <option value="monthly">
              Monthly
            </option>

            <option value="quarterly">
              Quarterly
            </option>

            <option value="recent">
              Recent 6 Months
            </option>
          </select>

        </div>

      </section>

      {/* =========================
          DATA STATUS
      ========================= */}

      {isImported && (
        <section className="analysis-data-status">

          <span>
            DATASET
          </span>

          <strong>
            {isCleaned
              ? "CLEANED ANALYTICS DATA"
              : "RAW IMPORTED DATA"}
          </strong>

          <span>
            {salesRecords.length.toLocaleString()} records
          </span>

        </section>
      )}

      {/* =========================
          KPI CARDS
      ========================= */}

      <section className="analysis-kpi-grid">

        <AnalysisKpi
          icon={<PhilippinePeso size={23} />}
          label="TOTAL REVENUE"
          value={
            isImported
              ? formatCompactCurrency(
                  analysis.totalRevenue
                )
              : "—"
          }
          description={
            isImported
              ? "Revenue across analyzed transactions"
              : "Import a dataset first"
          }
          accent="purple"
        />

        <AnalysisKpi
          icon={<ShoppingCart size={23} />}
          label="UNITS SOLD"
          value={
            isImported
              ? analysis.totalUnits.toLocaleString()
              : "—"
          }
          description={
            isImported
              ? "Total quantity sold"
              : "Import a dataset first"
          }
          accent="yellow"
        />

        <AnalysisKpi
          icon={<Calculator size={23} />}
          label="AVG. TRANSACTION"
          value={
            isImported
              ? formatCurrency(
                  Math.round(
                    analysis.averageTransaction
                  )
                )
              : "—"
          }
          description={
            isImported
              ? "Average revenue per transaction row"
              : "Import a dataset first"
          }
          accent="pink"
        />

        <AnalysisKpi
          icon={<TrendingUp size={23} />}
          label="RECENT GROWTH"
          value={
            isImported
              ? `${growth >= 0 ? "+" : ""}${growth.toFixed(
                  1
                )}%`
              : "—"
          }
          description={
            isImported
              ? "Compared with previous month"
              : "Import a dataset first"
          }
          accent="white"
          positive={isImported ? growth >= 0 : undefined}
        />

      </section>

      {/* =========================
          REVENUE TREND
      ========================= */}

      <section className="analysis-main-chart">

        <div className="analysis-card-header">

          <div>
            <span className="studio-label">
              TIME-SERIES OVERVIEW
            </span>

            <h2>
              REVENUE TREND
            </h2>
          </div>

          <div className="chart-highlight">

            <span>
              LATEST
            </span>

            <strong>
              {isImported && chartData.length
                ? formatCurrency(
                    chartData[
                      chartData.length - 1
                    ].revenue
                  )
                : "—"}
            </strong>

          </div>

        </div>

        <div className="analysis-chart">

          {chartData.length > 0 ? (

            <ResponsiveContainer
              width="100%"
              height={360}
            >

              <LineChart
                data={chartData}
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
                  opacity={0.15}
                />

                <XAxis
                  dataKey="label"
                  tick={{
                    fill: "#111",
                    fontSize: 11,
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
                    `£${Math.round(
                      value / 1000
                    )}k`
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
                    fontFamily: "Public Sans",
                    fontWeight: 700,
                  }}
                />

                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#111"
                  strokeWidth={4}
                  dot={{
                    r: 5,
                    fill: "#f2d048",
                    stroke: "#111",
                    strokeWidth: 3,
                  }}
                  activeDot={{
                    r: 8,
                    fill: "#f08cb6",
                    stroke: "#111",
                    strokeWidth: 3,
                  }}
                />

              </LineChart>

            </ResponsiveContainer>

          ) : (

            <EmptyAnalysis
              title="NO DATA AVAILABLE"
              description="Import a sales dataset to generate the revenue trend."
            />

          )}

        </div>

      </section>

      {/* =========================
          LOWER ANALYSIS
      ========================= */}

      <section className="analysis-two-column">

        {/* COUNTRY PERFORMANCE */}

        <div className="category-analysis-card">

          <div className="analysis-card-header">

            <div>

              <span className="studio-label">
                PERFORMANCE BREAKDOWN
              </span>

              <h2>
                TOP COUNTRIES BY SALES
              </h2>

            </div>

          </div>

          <div className="category-chart">

            {analysis.countryPerformance.length > 0 ? (

              <ResponsiveContainer
                width="100%"
                height={300}
              >

                <BarChart
                  data={
                    analysis.countryPerformance
                  }
                  layout="vertical"
                  margin={{
                    top: 10,
                    right: 25,
                    left: 15,
                    bottom: 10,
                  }}
                >

                  <CartesianGrid
                    horizontal={false}
                    stroke="#111"
                    opacity={0.12}
                  />

                  <XAxis
                    type="number"
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
                      `£${Math.round(
                        value / 1000
                      )}k`
                    }
                  />

                  <YAxis
                    type="category"
                    dataKey="country"
                    tick={{
                      fill: "#111",
                      fontSize: 9,
                      fontWeight: 700,
                    }}
                    axisLine={{
                      stroke: "#111",
                      strokeWidth: 2,
                    }}
                    tickLine={false}
                    width={95}
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
                      fontFamily: "Public Sans",
                      fontWeight: 700,
                    }}
                  />

                  <Bar
                    dataKey="revenue"
                    fill="#bc9fdb"
                    stroke="#111"
                    strokeWidth={2}
                    barSize={24}
                  />

                </BarChart>

              </ResponsiveContainer>

            ) : (

              <EmptyAnalysis
                title="NO COUNTRY DATA"
                description="Import a valid sales dataset to calculate country performance."
              />

            )}

          </div>

        </div>

        {/* DESCRIPTIVE STATISTICS */}

        <div className="descriptive-card">

          <div className="analysis-card-header pink-header">

            <div>

              <span className="studio-label">
                DESCRIPTIVE STATISTICS
              </span>

              <h2>
                NUMERICAL SUMMARY
              </h2>

            </div>

          </div>

          <div className="descriptive-list">

            <StatisticRow
              label="Total Transactions"
              value={
                isImported
                  ? analysis.totalTransactions.toLocaleString()
                  : "—"
              }
            />

            <StatisticRow
              label="Total Revenue"
              value={
                isImported
                  ? formatCurrency(
                      analysis.totalRevenue
                    )
                  : "—"
              }
            />

            <StatisticRow
              label="Total Units"
              value={
                isImported
                  ? analysis.totalUnits.toLocaleString()
                  : "—"
              }
            />

            <StatisticRow
              label="Mean Transaction Value"
              value={
                isImported
                  ? formatCurrency(
                      Math.round(
                        analysis.averageTransaction
                      )
                    )
                  : "—"
              }
            />

            <StatisticRow
              label="Median Transaction Value"
              value={
                isImported
                  ? formatCurrency(
                      Math.round(
                        analysis.medianTransaction
                      )
                    )
                  : "—"
              }
            />

            <StatisticRow
              label="Mean Unit Price"
              value={
                isImported
                  ? formatCurrency(
                      Math.round(
                        analysis.averageUnitPrice
                      )
                    )
                  : "—"
              }
            />

            <StatisticRow
              label="Mode Unit Price"
              value={
                isImported
                  ? formatCurrency(
                      analysis.modeUnitPrice
                    )
                  : "—"
              }
            />

          </div>

        </div>

      </section>

      {/* =========================
          TOP PRODUCTS
      ========================= */}

      <section className="analysis-products-card">

        <div className="analysis-card-header yellow-header">

          <div>

            <span className="studio-label">
              PRODUCT PERFORMANCE
            </span>

            <h2>
              TOP PRODUCTS BY SALES
            </h2>

          </div>

          <span className="analysis-count">
            {topProducts.length} PRODUCTS
          </span>

        </div>

        <div className="analysis-product-list">

          {topProducts.length > 0 ? (

            topProducts.map((product, index) => (

              <div
                className="analysis-product-row"
                key={product.name}
              >

                <div className="product-rank">
                  {String(index + 1).padStart(
                    2,
                    "0"
                  )}
                </div>

                <div className="product-information">

                  <strong>
                    {product.name}
                  </strong>

                  <span>
                    Product
                  </span>

                </div>

                <div className="product-units">

                  <span>
                    UNITS
                  </span>

                  <strong>
                    {Number(
                      product.units || 0
                    ).toLocaleString()}
                  </strong>

                </div>

                <div className="product-sales">

                  <span>
                    SALES
                  </span>

                  <strong>
                    {formatCurrency(
                      product.sales
                    )}
                  </strong>

                </div>

                <div className="product-arrow">
                  <ArrowUpRight size={20} />
                </div>

              </div>

            ))

          ) : (

            <EmptyAnalysis
              title="NO PRODUCT DATA"
              description="Import a sales dataset to calculate product performance."
            />

          )}

        </div>

      </section>

      {/* =========================
          EXTREME TRANSACTIONS
      ========================= */}

      <section className="analysis-two-column">

        <div className="descriptive-card">

          <div className="analysis-card-header">

            <div>

              <span className="studio-label">
                TRANSACTION ANALYSIS
              </span>

              <h2>
                HIGHEST TRANSACTION
              </h2>

            </div>

          </div>

          {analysis.highestTransaction ? (

            <div className="transaction-highlight">

              <strong>
                {formatCurrency(
                  analysis.highestTransaction.revenue
                )}
              </strong>

              <span>
                {analysis.highestTransaction.product ||
                  "Unknown product"}
              </span>

              <small>
                Invoice:{" "}
                {analysis.highestTransaction.id ||
                  "N/A"}
              </small>

            </div>

          ) : (

            <EmptyAnalysis
              title="NO TRANSACTION DATA"
              description="Import a dataset first."
            />

          )}

        </div>

        <div className="descriptive-card">

          <div className="analysis-card-header">

            <div>

              <span className="studio-label">
                TRANSACTION ANALYSIS
              </span>

              <h2>
                LOWEST TRANSACTION
              </h2>

            </div>

          </div>

          {analysis.lowestTransaction ? (

            <div className="transaction-highlight">

              <strong>
                {formatCurrency(
                  analysis.lowestTransaction.revenue
                )}
              </strong>

              <span>
                {analysis.lowestTransaction.product ||
                  "Unknown product"}
              </span>

              <small>
                Invoice:{" "}
                {analysis.lowestTransaction.id ||
                  "N/A"}
              </small>

            </div>

          ) : (

            <EmptyAnalysis
              title="NO TRANSACTION DATA"
              description="Import a dataset first."
            />

          )}

        </div>

      </section>

      {/* =========================
          INTERPRETATION
      ========================= */}

      <section className="analysis-interpretation">

        <div className="interpretation-mark">
          !
        </div>

        <div>

          <span className="studio-label">
            INITIAL INTERPRETATION
          </span>

          <h2>
            WHAT THE NUMBERS SAY
          </h2>

          {!isImported ? (

            <p>
              Import a sales dataset to generate
              descriptive statistics and performance
              findings.
            </p>

          ) : (

            <p>

              The cleaned dataset contains{" "}
              <strong>
                {analysis.totalTransactions.toLocaleString()}
              </strong>{" "}
              transaction records and{" "}
              <strong>
                {analysis.totalUnits.toLocaleString()}
              </strong>{" "}
              total units sold, generating{" "}
              <strong>
                {formatCurrency(
                  analysis.totalRevenue
                )}
              </strong>{" "}
              in recorded revenue.

              {analysis.highestCountry && (
                <>
                  {" "}
                  {analysis.highestCountry.country} has
                  the highest recorded revenue among the
                  countries in the dataset, with{" "}
                  <strong>
                    {formatCurrency(
                      analysis.highestCountry.revenue
                    )}
                  </strong>
                  .
                </>
              )}

              {" "}
              The results provide the descriptive
              baseline for the succeeding pattern,
              correlation, statistical, and forecasting
              analysis.

            </p>

          )}

        </div>

      </section>

    </div>
  );
}

function AnalysisKpi({
  icon,
  label,
  value,
  description,
  accent,
  positive,
}) {
  return (
    <div
      className={`analysis-kpi ${accent}`}
    >

      <div className="analysis-kpi-icon">
        {icon}
      </div>

      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

      <small>

        {positive !== undefined && (
          <>
            {positive ? (
              <ArrowUpRight size={13} />
            ) : (
              <ArrowDownRight size={13} />
            )}
          </>
        )}

        {description}

      </small>

    </div>
  );
}

function StatisticRow({
  label,
  value,
}) {
  return (
    <div className="statistic-row">

      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

    </div>
  );
}

function EmptyAnalysis({
  title,
  description,
}) {
  return (
    <div className="dashboard-empty-state">

      <DatabaseIcon />

      <strong>
        {title}
      </strong>

      <span>
        {description}
      </span>

    </div>
  );
}

function DatabaseIcon() {
  return (
    <svg
      width="38"
      height="38"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <ellipse
        cx="12"
        cy="5"
        rx="9"
        ry="3"
      />

      <path
        d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"
      />

      <path
        d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"
      />

    </svg>
  );
}

export default SalesAnalysis;