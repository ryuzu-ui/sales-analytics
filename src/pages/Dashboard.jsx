import { ArrowRight, TrendingUp, Database, Sparkles, CalendarDays } from "lucide-react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import StatCard from "../components/StatCard";
import ChartCard from "../components/ChartCard";
import { useSalesData } from "../context/SalesDataContext";

function formatCurrency(value, maximumFractionDigits = 0) {
  return `₱${Number(value || 0).toLocaleString(undefined, {
    maximumFractionDigits,
  })}`;
}

function formatCompactCurrency(value) {
  const number = Number(value || 0);

  if (number >= 1_000_000) {
    return `₱${(number / 1_000_000).toFixed(2)}M`;
  }

  if (number >= 1_000) {
    return `₱${(number / 1_000).toFixed(1)}K`;
  }

  return formatCurrency(number);
}

function Dashboard() {
  const {
    monthlySales,
    topProducts,
    summary,
    isImported,
    datasetName,
  } = useSalesData();

  const latestMonth =
    monthlySales.length > 0
      ? monthlySales[monthlySales.length - 1]
      : null;

  const previousMonth =
    monthlySales.length > 1
      ? monthlySales[monthlySales.length - 2]
      : null;

  const growth =
    previousMonth && previousMonth.revenue !== 0
      ? ((latestMonth.revenue - previousMonth.revenue) /
          Math.abs(previousMonth.revenue)) *
        100
      : 0;

  const trend =
    !isImported
      ? "—"
      : growth >= 0
        ? "UPWARD"
        : "DOWNWARD";

  const trendDescription =
    !isImported
      ? "Import a dataset first"
      : growth >= 0
        ? "Latest month increased"
        : "Latest month decreased";

  return (
    <div className="dashboard">

      {/* =========================
          HERO
      ========================= */}

      <section className="hero-panel">
        <div className="hero-copy">

          <div className="hero-tag">
            <Sparkles size={15} />
            DATA ANALYTICS PLATFORM
          </div>

          <h2>
            Turn raw sales data
            <br />
            into <span>clear decisions.</span>
          </h2>

          <p>
            Analyze historical sales, discover patterns,
            measure relationships, and forecast future
            performance from one workspace.
          </p>

          <div className="hero-actions">

            <button className="primary-button">
              Explore Dataset
              <ArrowRight size={18} />
            </button>

            <button className="secondary-button">
              View Reports
            </button>

          </div>

        </div>

        <div className="hero-visual">

          <div className="hero-grid" />

          <div className="floating-stat stat-one">

            <span>Revenue</span>

            <strong>
              {isImported
                ? formatCompactCurrency(summary.totalRevenue)
                : "—"}
            </strong>

            <small>
              {isImported
                ? `${growth >= 0 ? "↑" : "↓"} ${Math.abs(growth).toFixed(1)}%`
                : "IMPORT DATA"}
            </small>

          </div>

          <div className="floating-stat stat-two">

            <span>Latest Period</span>

            <strong>
              {latestMonth
                ? formatCompactCurrency(latestMonth.revenue)
                : "—"}
            </strong>

            <small>
              {latestMonth
                ? latestMonth.label
                : "NO DATA"}
            </small>

          </div>

          <div className="hero-circle">
            <TrendingUp size={55} />
          </div>

        </div>
      </section>

      {/* =========================
          DATASET STATUS
      ========================= */}

      <section className="dashboard-dataset-status">

        <div>
          <span>ACTIVE DATASET</span>

          <strong>
            {isImported
              ? datasetName
              : "No dataset imported"}
          </strong>
        </div>

        <div>
          <span>RECORDS</span>

          <strong>
            {isImported
              ? summary.totalUnits.toLocaleString()
              : "—"}
          </strong>
        </div>

        <div>
          <span>PERIOD</span>

          <strong>
            {isImported &&
            summary.firstDate &&
            summary.lastDate
              ? `${new Date(summary.firstDate).toLocaleDateString(
                  "en-US",
                  {
                    month: "short",
                    year: "numeric",
                  }
                )} — ${new Date(
                  summary.lastDate
                ).toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                })}`
              : "—"}
          </strong>
        </div>

      </section>

      {/* =========================
          STAT CARDS
      ========================= */}

      <section className="stats-grid">

        <StatCard
          label="Total Revenue"
          value={
            isImported
              ? formatCurrency(summary.totalRevenue)
              : "—"
          }
          change={
            isImported
              ? `${growth >= 0 ? "+" : ""}${growth.toFixed(1)}%`
              : "—"
          }
          description={
            isImported
              ? "vs. previous month"
              : "import a dataset first"
          }
          accent="yellow"
        />

        <StatCard
          label="Units Sold"
          value={
            isImported
              ? summary.totalUnits.toLocaleString()
              : "—"
          }
          change="—"
          description={
            isImported
              ? "total quantity sold"
              : "import a dataset first"
          }
          accent="blue"
        />

        <StatCard
          label="Avg. Order Value"
          value={
            isImported
              ? formatCurrency(summary.averageOrderValue)
              : "—"
          }
          change="—"
          description={
            isImported
              ? "average invoice value"
              : "import a dataset first"
          }
          accent="red"
        />

        <StatCard
          label="Forecast Accuracy"
          value="—"
          change="—"
          description="calculated after validation"
          accent="green"
        />

      </section>

      {/* =========================
          REVENUE + INSIGHT
      ========================= */}

      <section className="dashboard-grid">

        <ChartCard
          title="Revenue Performance"
          subtitle={
            isImported
              ? "Monthly revenue across the imported dataset"
              : "Import a dataset to generate the chart"
          }
          className="revenue-chart"
        >

          {monthlySales.length > 0 ? (
            <ResponsiveContainer
              width="100%"
              height={330}
            >
              <BarChart data={monthlySales}>

                <CartesianGrid
                  strokeDasharray="4 4"
                  vertical={false}
                />

                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => {
                    const parts = String(value).split(" ");
                    return parts.length > 1
                      ? `${parts[0]} ${parts[1].slice(2)}`
                      : value;
                  }}
                />

                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) =>
                    `₱${Number(value) / 1000}k`
                  }
                />

                <Tooltip
                  formatter={(value) =>
                    formatCurrency(value)
                  }
                  contentStyle={{
                    border: "3px solid #111",
                    borderRadius: "0",
                    boxShadow: "5px 5px 0 #111",
                    fontFamily: "DM Mono",
                  }}
                />

                <Bar
                  dataKey="revenue"
                  fill="#f5d547"
                  stroke="#111"
                  strokeWidth={2}
                />

              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="dashboard-empty-state">
              <Database size={38} />

              <strong>
                NO DATASET IMPORTED
              </strong>

              <span>
                Use the Import Data button to load
                your sales dataset.
              </span>
            </div>
          )}

        </ChartCard>

        <section className="insight-card">

          <div className="insight-header">

            <div className="insight-icon">
              <Sparkles size={21} />
            </div>

            <span>KEY INSIGHT</span>

          </div>

          <h3>
            {!isImported
              ? "Import sales data to generate insights."
              : growth >= 0
                ? "Revenue is showing an upward movement."
                : "Revenue is showing a downward movement."}
          </h3>

          <p>
            {!isImported
              ? "The dashboard calculates trends and performance directly from the imported dataset."
              : `Based on the latest two observed months, revenue ${growth >= 0 ? "increased" : "decreased"} by ${Math.abs(growth).toFixed(1)}%.`}
          </p>

          <div className="insight-metric">

            <div>
              <span>Growth</span>

              <strong>
                {isImported
                  ? `${growth >= 0 ? "+" : ""}${growth.toFixed(1)}%`
                  : "—"}
              </strong>
            </div>

            <div>
              <span>Trend</span>

              <strong>
                {trend}
              </strong>
            </div>

          </div>

          <button className="text-button">
            Open Sales Analysis
            <ArrowRight size={17} />
          </button>

        </section>

      </section>

      {/* =========================
          TOP PRODUCTS
      ========================= */}

      <section className="bottom-grid">

        <ChartCard
          title="Top Products"
          subtitle={
            isImported
              ? "Products generating the highest revenue"
              : "Import a dataset to calculate product performance"
          }
          className="products-card"
        >

          {topProducts.length > 0 ? (

            <div className="product-list">

              {topProducts
                .slice(0, 5)
                .map((product, index) => (

                  <div
                    className="product-row"
                    key={product.name}
                  >

                    <div className="product-rank">
                      {String(index + 1).padStart(2, "0")}
                    </div>

                    <div className="product-info">

                      <strong>
                        {product.name}
                      </strong>

                      <span>
                        {product.category}
                      </span>

                    </div>

                    <div className="product-sales">

                      <strong>
                        {formatCurrency(product.sales)}
                      </strong>

                      <span>
                        {Number(product.units || 0).toLocaleString()} units
                      </span>

                    </div>

                  </div>

                ))}

            </div>

          ) : (

            <div className="dashboard-empty-state">
              <TrendingUp size={38} />

              <strong>
                NO PRODUCT DATA
              </strong>

              <span>
                Import a sales dataset to calculate
                top-performing products.
              </span>
            </div>

          )}

        </ChartCard>

        {/* =========================
            QUICK ACTIONS
        ========================= */}

        <section className="quick-actions">

          <div className="section-heading">

            <div>
              <span>WORKSPACE</span>
              <h3>Quick Actions</h3>
            </div>

          </div>

          <button className="quick-action yellow">

            <Database size={22} />

            <div>
              <strong>
                Import Dataset
              </strong>

              <span>
                Upload CSV or Excel
              </span>
            </div>

            <ArrowRight size={18} />

          </button>

          <button className="quick-action blue">

            <TrendingUp size={22} />

            <div>
              <strong>
                Run Forecast
              </strong>

              <span>
                Predict future sales
              </span>
            </div>

            <ArrowRight size={18} />

          </button>

          <button className="quick-action red">

            <CalendarDays size={22} />

            <div>
              <strong>
                View Trends
              </strong>

              <span>
                Explore sales patterns
              </span>
            </div>

            <ArrowRight size={18} />

          </button>

        </section>

      </section>

    </div>
  );
}

export default Dashboard;