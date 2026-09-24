import { useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
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

import { monthlySales, salesRecords, topProducts } from "../data/salesData";

function PatternEDA() {
  const [view, setView] = useState("trend");

  const patternData = useMemo(() => {
    return monthlySales.map((item, index) => {
      const previous = index > 0 ? monthlySales[index - 1].revenue : item.revenue;

      const change = previous
        ? ((item.revenue - previous) / previous) * 100
        : 0;

      return {
        ...item,
        change: Number(change.toFixed(1)),
      };
    });
  }, []);

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
      monthlySales.reduce((sum, item) => sum + item.revenue, 0) /
      monthlySales.length;

    const first = monthlySales[0].revenue;
    const last = monthlySales[monthlySales.length - 1].revenue;

    const growth = first ? ((last - first) / first) * 100 : 0;

    return {
      highest,
      lowest,
      average,
      growth,
    };
  }, []);

  const categoryPattern = useMemo(() => {
    const map = {};

    salesRecords.forEach((row) => {
      if (!map[row.category]) {
        map[row.category] = {
          category: row.category,
          revenue: 0,
          units: 0,
        };
      }

      map[row.category].revenue += Number(row.revenue || 0);
      map[row.category].units += Number(row.quantity || 0);
    });

    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, []);

  const outliers = useMemo(() => {
    if (!salesRecords.length) return [];

    const revenues = salesRecords.map((row) => Number(row.revenue || 0));

    const mean =
      revenues.reduce((sum, value) => sum + value, 0) / revenues.length;

    const variance =
      revenues.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) /
      revenues.length;

    const standardDeviation = Math.sqrt(variance);

    return salesRecords
      .filter(
        (row) =>
          Math.abs(Number(row.revenue) - mean) > standardDeviation
      )
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, []);

  return (
    <div className="pattern-eda-page">
      {/* HEADER */}
      <section className="pattern-heading">
        <div>
          <div className="section-kicker">
            <span className="kicker-block">04</span>
            EXPLORATORY DATA ANALYSIS
          </div>

          <h1>PATTERN + EDA</h1>

          <p>
            Explore sales behavior, identify trends, compare performance,
            detect unusual transactions, and recognize recurring patterns in
            the dataset.
          </p>
        </div>

        <div className="pattern-view-switch">
          <button
            className={view === "trend" ? "active" : ""}
            onClick={() => setView("trend")}
          >
            TREND
          </button>

          <button
            className={view === "category" ? "active" : ""}
            onClick={() => setView("category")}
          >
            CATEGORY
          </button>
        </div>
      </section>

      {/* PATTERN SUMMARY */}
      <section className="pattern-summary-grid">
        <PatternCard
          icon={<TrendingUp size={22} />}
          label="OVERALL TREND"
          value={`${patternSummary.growth >= 0 ? "+" : ""}${patternSummary.growth.toFixed(1)}%`}
          description="Change from first to latest period"
          accent="purple"
        />

        <PatternCard
          icon={<Activity size={22} />}
          label="AVERAGE MONTHLY"
          value={`₱${Math.round(patternSummary.average).toLocaleString()}`}
          description="Mean monthly revenue"
          accent="yellow"
        />

        <PatternCard
          icon={<TrendingUp size={22} />}
          label="HIGHEST PERIOD"
          value={patternSummary.highest?.month || "N/A"}
          description={
            patternSummary.highest
              ? `₱${patternSummary.highest.revenue.toLocaleString()} revenue`
              : "No data"
          }
          accent="pink"
        />

        <PatternCard
          icon={<TrendingDown size={22} />}
          label="LOWEST PERIOD"
          value={patternSummary.lowest?.month || "N/A"}
          description={
            patternSummary.lowest
              ? `₱${patternSummary.lowest.revenue.toLocaleString()} revenue`
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
                : "CATEGORY DISTRIBUTION"}
            </span>

            <h2>
              {view === "trend"
                ? "SALES TREND OVER TIME"
                : "REVENUE BY CATEGORY"}
            </h2>
          </div>

          <div className="pattern-header-tag">
            <Eye size={16} />
            EXPLORING
          </div>
        </div>

        <div className="pattern-chart">
          {view === "trend" ? (
            <ResponsiveContainer width="100%" height={390}>
              <AreaChart
                data={patternData}
                margin={{ top: 20, right: 25, left: 5, bottom: 5 }}
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
            <ResponsiveContainer width="100%" height={390}>
              <BarChart
                data={categoryPattern}
                margin={{ top: 20, right: 25, left: 5, bottom: 5 }}
              >
                <CartesianGrid
                  stroke="#111"
                  strokeDasharray="4 4"
                  opacity={0.14}
                />

                <XAxis
                  dataKey="category"
                  tick={{ fill: "#111", fontSize: 10, fontWeight: 700 }}
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

                <Bar
                  dataKey="revenue"
                  fill="#f08cb6"
                  stroke="#111"
                  strokeWidth={3}
                  barSize={70}
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
            <span className="studio-label">PATTERN DETECTION</span>
            <h2>PERIOD-TO-PERIOD CHANGE</h2>
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
              {patternData.map((item, index) => {
                const direction =
                  item.change > 0
                    ? "INCREASE"
                    : item.change < 0
                    ? "DECREASE"
                    : "STABLE";

                return (
                  <tr key={item.month}>
                    <td className="pattern-period">
                      {String(index + 1).padStart(2, "0")} / {item.month}
                    </td>

                    <td className="pattern-revenue">
                      ₱{item.revenue.toLocaleString()}
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
                        {item.change > 0 ? "+" : ""}
                        {item.change}%
                      </span>
                    </td>

                    <td>
                      <span className="direction-cell">
                        {item.change > 0 ? (
                          <TrendingUp size={16} />
                        ) : item.change < 0 ? (
                          <TrendingDown size={16} />
                        ) : (
                          <Activity size={16} />
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
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* OUTLIERS */}
      <section className="pattern-bottom-grid">
        <div className="outlier-card">
          <div className="pattern-card-header pink-pattern-header">
            <div>
              <span className="studio-label">ANOMALY CHECK</span>
              <h2>POTENTIAL OUTLIERS</h2>
            </div>

            <CircleAlert size={22} />
          </div>

          {outliers.length > 0 ? (
            <div className="outlier-list">
              {outliers.map((row) => (
                <div className="outlier-row" key={row.id}>
                  <div>
                    <strong>{row.id}</strong>
                    <span>{row.product}</span>
                  </div>

                  <strong>₱{row.revenue.toLocaleString()}</strong>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-outlier">
              <Activity size={25} />
              <strong>No obvious outliers detected.</strong>
            </div>
          )}
        </div>

        <div className="pattern-insight-card">
          <span className="studio-label">EDA OBSERVATION</span>

          <h2>WHAT PATTERNS STAND OUT?</h2>

          <div className="pattern-observation-list">
            <Observation
              number="01"
              title="TREND"
              text={
                patternSummary.growth >= 0
                  ? "The overall revenue movement is upward across the available periods."
                  : "The overall revenue movement is downward across the available periods."
              }
            />

            <Observation
              number="02"
              title="PEAK"
              text={
                patternSummary.highest
                  ? `${patternSummary.highest.month} records the highest revenue in the current dataset.`
                  : "No peak period can be identified."
              }
            />

            <Observation
              number="03"
              title="VARIATION"
              text="Period-to-period changes can reveal sudden increases, declines, and possible seasonal behavior."
            />
          </div>
        </div>
      </section>

      {/* TOP PRODUCTS PATTERN */}
      <section className="pattern-products-card">
        <div className="pattern-card-header">
          <div>
            <span className="studio-label">PRODUCT EXPLORATION</span>
            <h2>PRODUCT PERFORMANCE PATTERN</h2>
          </div>
        </div>

        <div className="pattern-product-grid">
          {topProducts.map((product, index) => (
            <div className="pattern-product-card" key={product.name}>
              <div className="pattern-product-rank">
                {String(index + 1).padStart(2, "0")}
              </div>

              <h3>{product.name}</h3>

              <span>{product.category}</span>

              <strong>₱{product.sales.toLocaleString()}</strong>

              <small>{product.units.toLocaleString()} units sold</small>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function PatternCard({ icon, label, value, description, accent }) {
  return (
    <div className={`pattern-stat-card ${accent}`}>
      <div className="pattern-stat-icon">{icon}</div>

      <span>{label}</span>

      <strong>{value}</strong>

      <small>{description}</small>
    </div>
  );
}

function Observation({ number, title, text }) {
  return (
    <div className="observation">
      <div className="observation-number">{number}</div>

      <div>
        <strong>{title}</strong>
        <p>{text}</p>
      </div>
    </div>
  );
}

export default PatternEDA;