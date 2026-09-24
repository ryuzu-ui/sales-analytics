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

import { monthlySales, salesRecords, topProducts } from "../data/salesData";

function SalesAnalysis() {
  const [period, setPeriod] = useState("monthly");

  const analysis = useMemo(() => {
    const totalRevenue = salesRecords.reduce(
      (sum, row) => sum + Number(row.revenue || 0),
      0
    );

    const totalUnits = salesRecords.reduce(
      (sum, row) => sum + Number(row.quantity || 0),
      0
    );

    const averageTransaction =
      salesRecords.length > 0 ? totalRevenue / salesRecords.length : 0;

    const averageUnitPrice =
      salesRecords.length > 0
        ? salesRecords.reduce(
            (sum, row) => sum + Number(row.unitPrice || 0),
            0
          ) / salesRecords.length
        : 0;

    const categoryMap = {};

    salesRecords.forEach((row) => {
      if (!categoryMap[row.category]) {
        categoryMap[row.category] = {
          category: row.category,
          revenue: 0,
          units: 0,
          transactions: 0,
        };
      }

      categoryMap[row.category].revenue += Number(row.revenue || 0);
      categoryMap[row.category].units += Number(row.quantity || 0);
      categoryMap[row.category].transactions += 1;
    });

    const categories = Object.values(categoryMap).sort(
      (a, b) => b.revenue - a.revenue
    );

    const highestCategory = categories[0];

    return {
      totalRevenue,
      totalUnits,
      averageTransaction,
      averageUnitPrice,
      categories,
      highestCategory,
    };
  }, []);

  const growth = useMemo(() => {
    if (!monthlySales || monthlySales.length < 2) {
      return 0;
    }

    const previous = monthlySales[monthlySales.length - 2].revenue;
    const current = monthlySales[monthlySales.length - 1].revenue;

    return previous ? ((current - previous) / previous) * 100 : 0;
  }, []);

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
        quarters[quarter].revenue += item.revenue;
      });

      return quarters;
    }

    return monthlySales.slice(-6);
  }, [period]);

  return (
    <div className="sales-analysis-page">
      {/* HEADER */}
      <section className="analysis-heading">
        <div>
          <div className="section-kicker">
            <span className="kicker-block">03</span>
            DESCRIPTIVE ANALYSIS
          </div>

          <h1>SALES ANALYSIS</h1>

          <p>
            Understand overall sales performance using descriptive statistics,
            revenue trends, transaction volume, and product performance.
          </p>
        </div>

        <div className="analysis-period">
          <span>VIEW PERIOD</span>

          <select
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
          >
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="recent">Recent 6 Months</option>
          </select>
        </div>
      </section>

      {/* KPI CARDS */}
      <section className="analysis-kpi-grid">
        <AnalysisKpi
          icon={<PhilippinePeso size={23} />}
          label="TOTAL REVENUE"
          value={`₱${analysis.totalRevenue.toLocaleString()}`}
          description="Revenue across analyzed transactions"
          accent="purple"
        />

        <AnalysisKpi
          icon={<ShoppingCart size={23} />}
          label="UNITS SOLD"
          value={analysis.totalUnits.toLocaleString()}
          description="Total quantity sold"
          accent="yellow"
        />

        <AnalysisKpi
          icon={<Calculator size={23} />}
          label="AVG. TRANSACTION"
          value={`₱${Math.round(
            analysis.averageTransaction
          ).toLocaleString()}`}
          description="Average revenue per transaction"
          accent="pink"
        />

        <AnalysisKpi
          icon={<TrendingUp size={23} />}
          label="RECENT GROWTH"
          value={`${growth >= 0 ? "+" : ""}${growth.toFixed(1)}%`}
          description="Compared with previous month"
          accent="white"
          positive={growth >= 0}
        />
      </section>

      {/* REVENUE TREND */}
      <section className="analysis-main-chart">
        <div className="analysis-card-header">
          <div>
            <span className="studio-label">TIME-SERIES OVERVIEW</span>
            <h2>REVENUE TREND</h2>
          </div>

          <div className="chart-highlight">
            <span>LATEST</span>
            <strong>
              ₱
              {chartData.length
                ? chartData[chartData.length - 1].revenue.toLocaleString()
                : "0"}
            </strong>
          </div>
        </div>

        <div className="analysis-chart">
          <ResponsiveContainer width="100%" height={360}>
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 25, left: 5, bottom: 5 }}
            >
              <CartesianGrid stroke="#111" strokeDasharray="4 4" opacity={0.15} />

              <XAxis
                dataKey="month"
                tick={{ fill: "#111", fontSize: 11 }}
                axisLine={{ stroke: "#111", strokeWidth: 2 }}
                tickLine={false}
              />

              <YAxis
                tick={{ fill: "#111", fontSize: 10 }}
                axisLine={{ stroke: "#111", strokeWidth: 2 }}
                tickLine={false}
                tickFormatter={(value) =>
                  `₱${Math.round(value / 1000)}k`
                }
              />

              <Tooltip
                formatter={(value) => [
                  `₱${Number(value).toLocaleString()}`,
                  "Revenue",
                ]}
                contentStyle={{
                  border: "3px solid #111",
                  boxShadow: "5px 5px 0 #111",
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
        </div>
      </section>

      {/* LOWER ANALYSIS */}
      <section className="analysis-two-column">
        {/* CATEGORY PERFORMANCE */}
        <div className="category-analysis-card">
          <div className="analysis-card-header">
            <div>
              <span className="studio-label">PERFORMANCE BREAKDOWN</span>
              <h2>CATEGORY SALES</h2>
            </div>
          </div>

          <div className="category-chart">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={analysis.categories}
                layout="vertical"
                margin={{ top: 10, right: 25, left: 15, bottom: 10 }}
              >
                <CartesianGrid
                  horizontal={false}
                  stroke="#111"
                  opacity={0.12}
                />

                <XAxis
                  type="number"
                  tick={{ fill: "#111", fontSize: 10 }}
                  axisLine={{ stroke: "#111", strokeWidth: 2 }}
                  tickLine={false}
                  tickFormatter={(value) =>
                    `₱${Math.round(value / 1000)}k`
                  }
                />

                <YAxis
                  type="category"
                  dataKey="category"
                  tick={{ fill: "#111", fontSize: 10, fontWeight: 700 }}
                  axisLine={{ stroke: "#111", strokeWidth: 2 }}
                  tickLine={false}
                  width={85}
                />

                <Tooltip
                  formatter={(value) => [
                    `₱${Number(value).toLocaleString()}`,
                    "Revenue",
                  ]}
                  contentStyle={{
                    border: "3px solid #111",
                    boxShadow: "5px 5px 0 #111",
                    fontFamily: "Public Sans",
                    fontWeight: 700,
                  }}
                />

                <Bar
                  dataKey="revenue"
                  fill="#bc9fdb"
                  stroke="#111"
                  strokeWidth={2}
                  barSize={34}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* DESCRIPTIVE STATISTICS */}
        <div className="descriptive-card">
          <div className="analysis-card-header pink-header">
            <div>
              <span className="studio-label">DESCRIPTIVE STATISTICS</span>
              <h2>NUMERICAL SUMMARY</h2>
            </div>
          </div>

          <div className="descriptive-list">
            <StatisticRow
              label="Total Transactions"
              value={salesRecords.length}
            />

            <StatisticRow
              label="Total Revenue"
              value={`₱${analysis.totalRevenue.toLocaleString()}`}
            />

            <StatisticRow
              label="Total Units"
              value={analysis.totalUnits.toLocaleString()}
            />

            <StatisticRow
              label="Mean Transaction Value"
              value={`₱${Math.round(
                analysis.averageTransaction
              ).toLocaleString()}`}
            />

            <StatisticRow
              label="Mean Unit Price"
              value={`₱${Math.round(
                analysis.averageUnitPrice
              ).toLocaleString()}`}
            />

            <StatisticRow
              label="Top Category"
              value={analysis.highestCategory?.category || "N/A"}
            />
          </div>
        </div>
      </section>

      {/* TOP PRODUCTS */}
      <section className="analysis-products-card">
        <div className="analysis-card-header yellow-header">
          <div>
            <span className="studio-label">PRODUCT PERFORMANCE</span>
            <h2>TOP PRODUCTS BY SALES</h2>
          </div>

          <span className="analysis-count">
            {topProducts.length} PRODUCTS
          </span>
        </div>

        <div className="analysis-product-list">
          {topProducts.map((product, index) => (
            <div className="analysis-product-row" key={product.name}>
              <div className="product-rank">
                {String(index + 1).padStart(2, "0")}
              </div>

              <div className="product-information">
                <strong>{product.name}</strong>
                <span>{product.category}</span>
              </div>

              <div className="product-units">
                <span>UNITS</span>
                <strong>{product.units.toLocaleString()}</strong>
              </div>

              <div className="product-sales">
                <span>SALES</span>
                <strong>₱{product.sales.toLocaleString()}</strong>
              </div>

              <div className="product-arrow">
                <ArrowUpRight size={20} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* INTERPRETATION */}
      <section className="analysis-interpretation">
        <div className="interpretation-mark">!</div>

        <div>
          <span className="studio-label">INITIAL INTERPRETATION</span>

          <h2>WHAT THE NUMBERS SAY</h2>

          <p>
            The current dataset shows{" "}
            <strong>
              {analysis.totalRevenue > 0 ? "measurable sales activity" : "no sales activity"}
            </strong>{" "}
            across {analysis.categories.length} product categories.{" "}
            {analysis.highestCategory && (
              <>
                The category contributing the highest revenue is{" "}
                <strong>{analysis.highestCategory.category}</strong>, with{" "}
                <strong>
                  ₱{analysis.highestCategory.revenue.toLocaleString()}
                </strong>{" "}
                in recorded sales.
              </>
            )}{" "}
            The revenue trend can be examined further through pattern
            recognition, correlation analysis, and forecasting.
          </p>
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
    <div className={`analysis-kpi ${accent}`}>
      <div className="analysis-kpi-icon">{icon}</div>

      <span>{label}</span>

      <strong>{value}</strong>

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

function StatisticRow({ label, value }) {
  return (
    <div className="statistic-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default SalesAnalysis;