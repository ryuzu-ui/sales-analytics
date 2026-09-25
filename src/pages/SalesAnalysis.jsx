
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

/* ============================================================
   FORMATTERS
   ============================================================ */

function formatCurrency(
  value,
  maximumFractionDigits = 0
) {
  const number = Number(value || 0);

  return `£${number.toLocaleString("en-GB", {
    minimumFractionDigits:
      maximumFractionDigits > 0 ? 0 : 0,
    maximumFractionDigits,
  })}`;
}

function formatExactCurrency(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "£0.00";
  }

  /*
    Keep normal currency values at 2 decimals.
    If the value is extremely small, show enough
    precision so it does not misleadingly appear as £0.00.
  */

  if (number > 0 && number < 0.01) {
    return `£${number.toLocaleString("en-GB", {
      minimumFractionDigits: 4,
      maximumFractionDigits: 6,
    })}`;
  }

  return `£${number.toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
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

/* ============================================================
   STATISTICS
   ============================================================ */

function calculateMedian(values) {
  if (!values.length) {
    return 0;
  }

  const sorted = [...values].sort(
    (a, b) => a - b
  );

  const middle = Math.floor(
    sorted.length / 2
  );

  if (sorted.length % 2 === 0) {
    return (
      (sorted[middle - 1] +
        sorted[middle]) /
      2
    );
  }

  return sorted[middle];
}

function calculateMode(values) {
  if (!values.length) {
    return 0;
  }

  const frequency = new Map();

  values.forEach((value) => {
    const rounded = Number(
      Number(value).toFixed(2)
    );

    frequency.set(
      rounded,
      (frequency.get(rounded) || 0) + 1
    );
  });

  let mode = values[0];
  let highestFrequency = 0;

  frequency.forEach((count, value) => {
    if (count > highestFrequency) {
      highestFrequency = count;
      mode = value;
    }
  });

  return Number(mode);
}

/* ============================================================
   VALID SALES LINE
   ============================================================ */

function isValidSalesLine(row) {
  const quantity = Number(row?.quantity);
  const unitPrice = Number(row?.unitPrice);
  const revenue = Number(row?.revenue);

  return (
    Number.isFinite(quantity) &&
    quantity > 0 &&
    Number.isFinite(unitPrice) &&
    unitPrice > 0 &&
    Number.isFinite(revenue) &&
    revenue > 0 &&
    String(row?.invoiceNo || "").trim() !== "" &&
    String(row?.product || "").trim() !== ""
  );
}

/* ============================================================
   SALES ANALYSIS
   ============================================================ */

function SalesAnalysis() {
  const [period, setPeriod] =
    useState("monthly");

  const {
    salesRecords,
    monthlySales,
    topProducts,
    isImported,
    isCleaned,
  } = useSalesData();

  /* ==========================================================
     DESCRIPTIVE ANALYSIS
     ========================================================== */

  const analysis = useMemo(() => {
    /*
      Always apply validation here as a defensive layer.

      This is important because Sales Analysis should never
      display invalid sales lines even if the page receives
      unexpected/raw records from the shared context.
    */

    const validSalesLines =
      salesRecords.filter(isValidSalesLine);

    if (!validSalesLines.length) {
      return {
        validSalesLines: [],

        totalRevenue: 0,
        totalUnits: 0,
        totalSalesLines: 0,

        averageSalesLine: 0,
        averageUnitPrice: 0,

        medianSalesLine: 0,
        modeUnitPrice: 0,

        countryPerformance: [],

        highestCountry: null,
        lowestCountry: null,

        highestSalesLine: null,
        lowestSalesLine: null,
      };
    }

    const revenues =
      validSalesLines
        .map((row) =>
          Number(row.revenue)
        )
        .filter(Number.isFinite);

    const quantities =
      validSalesLines
        .map((row) =>
          Number(row.quantity)
        )
        .filter(Number.isFinite);

    const unitPrices =
      validSalesLines
        .map((row) =>
          Number(row.unitPrice)
        )
        .filter(Number.isFinite);

    const totalRevenue =
      revenues.reduce(
        (sum, value) =>
          sum + value,
        0
      );

    const totalUnits =
      quantities.reduce(
        (sum, value) =>
          sum + value,
        0
      );

    const totalSalesLines =
      validSalesLines.length;

    const averageSalesLine =
      totalSalesLines > 0
        ? totalRevenue /
          totalSalesLines
        : 0;

    const averageUnitPrice =
      unitPrices.length > 0
        ? unitPrices.reduce(
            (sum, value) =>
              sum + value,
            0
          ) / unitPrices.length
        : 0;

    const medianSalesLine =
      calculateMedian(revenues);

    const modeUnitPrice =
      calculateMode(unitPrices);

    /* ========================================================
       COUNTRY PERFORMANCE
       ======================================================== */

    const countryMap = {};

    validSalesLines.forEach(
      (row) => {
        const country =
          String(
            row.region ||
              row.country ||
              "Unknown"
          ).trim() ||
          "Unknown";

        if (!countryMap[country]) {
          countryMap[country] = {
            country,
            revenue: 0,
            units: 0,
            salesLines: 0,
          };
        }

        countryMap[country].revenue +=
          Number(row.revenue) || 0;

        countryMap[country].units +=
          Number(row.quantity) || 0;

        countryMap[country]
          .salesLines += 1;
      }
    );

    const countryPerformance =
      Object.values(countryMap)
        .sort(
          (a, b) =>
            b.revenue - a.revenue
        )
        .slice(0, 10);

    const highestCountry =
      countryPerformance[0] ||
      null;

    const lowestCountry =
      countryPerformance.length > 0
        ? countryPerformance[
            countryPerformance.length - 1
          ]
        : null;

    /* ========================================================
       HIGHEST SALES LINE
       ======================================================== */

    const highestSalesLine =
      validSalesLines.reduce(
        (highest, row) => {
          if (!highest) {
            return row;
          }

          return Number(row.revenue) >
            Number(highest.revenue)
            ? row
            : highest;
        },
        null
      );

    /* ========================================================
       LOWEST SALES LINE
       ======================================================== */

    const lowestSalesLine =
      validSalesLines.reduce(
        (lowest, row) => {
          if (!lowest) {
            return row;
          }

          return Number(row.revenue) <
            Number(lowest.revenue)
            ? row
            : lowest;
        },
        null
      );

    return {
      validSalesLines,

      totalRevenue,
      totalUnits,
      totalSalesLines,

      averageSalesLine,
      averageUnitPrice,

      medianSalesLine,
      modeUnitPrice,

      countryPerformance,

      highestCountry,
      lowestCountry,

      highestSalesLine,
      lowestSalesLine,
    };
  }, [salesRecords]);

  /* ==========================================================
     MONTHLY GROWTH
     ========================================================== */

  const growth = useMemo(() => {
    if (
      !monthlySales ||
      monthlySales.length < 2
    ) {
      return 0;
    }

    const previous =
      Number(
        monthlySales[
          monthlySales.length - 2
        ]?.revenue
      ) || 0;

    const current =
      Number(
        monthlySales[
          monthlySales.length - 1
        ]?.revenue
      ) || 0;

    if (previous === 0) {
      return 0;
    }

    return (
      ((current - previous) /
        Math.abs(previous)) *
      100
    );
  }, [monthlySales]);

  /* ==========================================================
     CHART DATA
     ========================================================== */

  const chartData = useMemo(() => {
    if (!monthlySales.length) {
      return [];
    }

    if (period === "monthly") {
      return monthlySales;
    }

    if (period === "quarterly") {
      const quarters = [
        {
          month: "Q1",
          revenue: 0,
        },
        {
          month: "Q2",
          revenue: 0,
        },
        {
          month: "Q3",
          revenue: 0,
        },
        {
          month: "Q4",
          revenue: 0,
        },
      ];

      monthlySales.forEach(
        (item, index) => {
          const quarter =
            Math.floor(index / 3);

          if (
            quarters[quarter]
          ) {
            quarters[
              quarter
            ].revenue +=
              Number(
                item.revenue || 0
              );
          }
        }
      );

      return quarters;
    }

    return monthlySales.slice(-6);
  }, [period, monthlySales]);

  /* ==========================================================
     RENDER
     ========================================================== */

  return (
    <div className="sales-analysis-page">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <section className="analysis-heading">

        <div>

          <div className="section-kicker">
            <span className="kicker-block">
              03
            </span>

            DESCRIPTIVE ANALYSIS
          </div>

          <h1>
            SALES ANALYSIS
          </h1>

          <p>
            Understand overall sales
            performance using descriptive
            statistics, revenue trends,
            sales-line volume, and
            geographic performance.
          </p>

        </div>

        <div className="analysis-period">

          <span>
            VIEW PERIOD
          </span>

          <select
            value={period}
            onChange={(event) =>
              setPeriod(
                event.target.value
              )
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

      {/* ======================================================
          DATASET STATUS
      ====================================================== */}

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
            {analysis.validSalesLines.length.toLocaleString()}{" "}
            valid sales lines
          </span>

        </section>
      )}

      {/* ======================================================
          KPI CARDS
      ====================================================== */}

      <section className="analysis-kpi-grid">

        <AnalysisKpi
          icon={
            <PhilippinePeso
              size={23}
            />
          }
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
              ? "Revenue across analyzed sales lines"
              : "Import a dataset first"
          }
          accent="purple"
        />

        <AnalysisKpi
          icon={
            <ShoppingCart
              size={23}
            />
          }
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
          icon={
            <Calculator
              size={23}
            />
          }
          label="AVG. SALES LINE"
          value={
            isImported
              ? formatExactCurrency(
                  analysis.averageSalesLine
                )
              : "—"
          }
          description={
            isImported
              ? "Average revenue per sales line"
              : "Import a dataset first"
          }
          accent="pink"
        />

        <AnalysisKpi
          icon={
            <TrendingUp
              size={23}
            />
          }
          label="RECENT GROWTH"
          value={
            isImported
              ? `${
                  growth >= 0
                    ? "+"
                    : ""
                }${growth.toFixed(
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
          positive={
            isImported
              ? growth >= 0
              : undefined
          }
        />

      </section>

      {/* ======================================================
          REVENUE TREND
      ====================================================== */}

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
              {isImported &&
              chartData.length
                ? formatCurrency(
                    chartData[
                      chartData.length -
                        1
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
                  dataKey={
                    period ===
                    "quarterly"
                      ? "month"
                      : "label"
                  }
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
                  tickFormatter={(
                    value
                  ) =>
                    `£${Math.round(
                      Number(value) /
                        1000
                    )}k`
                  }
                />

                <Tooltip
                  formatter={(
                    value
                  ) => [
                    formatExactCurrency(
                      value
                    ),
                    "Revenue",
                  ]}
                  contentStyle={{
                    border:
                      "3px solid #111",
                    boxShadow:
                      "5px 5px 0 #111",
                    fontFamily:
                      "Public Sans",
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

      {/* ======================================================
          COUNTRY + DESCRIPTIVE STATISTICS
      ====================================================== */}

      <section className="analysis-two-column">

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

            {analysis.countryPerformance.length >
            0 ? (

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
                    tickFormatter={(
                      value
                    ) =>
                      `£${Math.round(
                        Number(value) /
                          1000
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
                    formatter={(
                      value
                    ) => [
                      formatExactCurrency(
                        value
                      ),
                      "Revenue",
                    ]}
                    contentStyle={{
                      border:
                        "3px solid #111",
                      boxShadow:
                        "5px 5px 0 #111",
                      fontFamily:
                        "Public Sans",
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
              label="Total Sales Lines"
              value={
                isImported
                  ? analysis.totalSalesLines.toLocaleString()
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
              label="Mean Sales Line Value"
              value={
                isImported
                  ? formatExactCurrency(
                      analysis.averageSalesLine
                    )
                  : "—"
              }
            />

            <StatisticRow
              label="Median Sales Line Value"
              value={
                isImported
                  ? formatExactCurrency(
                      analysis.medianSalesLine
                    )
                  : "—"
              }
            />

            <StatisticRow
              label="Mean Unit Price"
              value={
                isImported
                  ? formatExactCurrency(
                      analysis.averageUnitPrice
                    )
                  : "—"
              }
            />

            <StatisticRow
              label="Mode Unit Price"
              value={
                isImported
                  ? formatExactCurrency(
                      analysis.modeUnitPrice
                    )
                  : "—"
              }
            />

          </div>

        </div>

      </section>

      {/* ======================================================
          TOP PRODUCTS
      ====================================================== */}

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

            topProducts.map(
              (product, index) => (

                <div
                  className="analysis-product-row"
                  key={product.name}
                >

                  <div className="product-rank">
                    {String(
                      index + 1
                    ).padStart(2, "0")}
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
                        product.units ||
                          0
                      ).toLocaleString()}
                    </strong>

                  </div>

                  <div className="product-sales">

                    <span>
                      SALES
                    </span>

                    <strong>
                      {formatExactCurrency(
                        product.sales
                      )}
                    </strong>

                  </div>

                  <div className="product-arrow">
                    <ArrowUpRight
                      size={20}
                    />
                  </div>

                </div>

              )
            )

          ) : (

            <EmptyAnalysis
              title="NO PRODUCT DATA"
              description="Import a sales dataset to calculate product performance."
            />

          )}

        </div>

      </section>

      {/* ======================================================
          SALES LINE ANALYSIS
      ====================================================== */}

      <section className="analysis-two-column">

        {/* HIGHEST */}

        <div className="descriptive-card">

          <div className="analysis-card-header">

            <div>

              <span className="studio-label">
                SALES-LINE ANALYSIS
              </span>

              <h2>
                HIGHEST SALES LINE
              </h2>

            </div>

          </div>

          {analysis.highestSalesLine ? (

            <SalesLineHighlight
              row={
                analysis.highestSalesLine
              }
              type="highest"
            />

          ) : (

            <EmptyAnalysis
              title="NO SALES-LINE DATA"
              description="Import and clean a sales dataset first."
            />

          )}

        </div>

        {/* LOWEST */}

        <div className="descriptive-card">

          <div className="analysis-card-header">

            <div>

              <span className="studio-label">
                SALES-LINE ANALYSIS
              </span>

              <h2>
                LOWEST SALES LINE
              </h2>

            </div>

          </div>

          {analysis.lowestSalesLine ? (

            <SalesLineHighlight
              row={
                analysis.lowestSalesLine
              }
              type="lowest"
            />

          ) : (

            <EmptyAnalysis
              title="NO SALES-LINE DATA"
              description="Import and clean a sales dataset first."
            />

          )}

        </div>

      </section>

      {/* ======================================================
          INTERPRETATION
      ====================================================== */}

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
              Import a sales dataset to
              generate descriptive
              statistics and performance
              findings.
            </p>

          ) : (

            <p>

              The cleaned dataset contains{" "}

              <strong>
                {analysis.totalSalesLines.toLocaleString()}
              </strong>{" "}

              sales-line records and{" "}

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
                  {analysis.highestCountry.country}{" "}
                  has the highest recorded
                  revenue among the countries
                  in the dataset, with{" "}

                  <strong>
                    {formatCurrency(
                      analysis.highestCountry
                        .revenue
                    )}
                  </strong>
                  .
                </>
              )}

              {" "}

              The results provide the
              descriptive baseline for the
              succeeding pattern,
              correlation, statistical,
              and forecasting analysis.

            </p>

          )}

        </div>

      </section>

    </div>
  );
}

/* ============================================================
   KPI COMPONENT
   ============================================================ */

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
              <ArrowUpRight
                size={13}
              />
            ) : (
              <ArrowDownRight
                size={13}
              />
            )}
          </>
        )}

        {description}

      </small>

    </div>
  );
}

/* ============================================================
   STATISTIC ROW
   ============================================================ */

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

/* ============================================================
   SALES LINE HIGHLIGHT
   ============================================================ */

function SalesLineHighlight({
  row,
  type,
}) {
  const quantity =
    Number(row.quantity) || 0;

  const unitPrice =
    Number(row.unitPrice) || 0;

  const revenue =
    Number(row.revenue) || 0;

  const invoice =
    String(
      row.invoiceNo || ""
    ).trim() || "N/A";

  const product =
    String(
      row.product || ""
    ).trim() ||
    "Unknown product";

  return (
    <div className="transaction-highlight">

      <strong>
        {formatExactCurrency(
          revenue
        )}
      </strong>

      <span>
        {product}
      </span>

      <small>
        Invoice: {invoice}
      </small>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(2, minmax(0, 1fr))",
          gap: "10px",
          marginTop: "16px",
        }}
      >

        <div>

          <span
            style={{
              display: "block",
              fontSize: "10px",
              fontWeight: 800,
              letterSpacing:
                "0.08em",
              marginBottom: "4px",
            }}
          >
            QUANTITY
          </span>

          <strong
            style={{
              display: "block",
              fontSize: "18px",
            }}
          >
            {quantity.toLocaleString()}
          </strong>

        </div>

        <div>

          <span
            style={{
              display: "block",
              fontSize: "10px",
              fontWeight: 800,
              letterSpacing:
                "0.08em",
              marginBottom: "4px",
            }}
          >
            UNIT PRICE
          </span>

          <strong
            style={{
              display: "block",
              fontSize: "18px",
            }}
          >
            {formatExactCurrency(
              unitPrice
            )}
          </strong>

        </div>

      </div>

    </div>
  );
}

/* ============================================================
   EMPTY STATE
   ============================================================ */

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

/* ============================================================
   DATABASE ICON
   ============================================================ */

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

