import {
  ArrowRight,
  TrendingUp,
  Database,
  Sparkles,
  CalendarDays,
} from "lucide-react";

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

import {
  monthlySales,
  topProducts,
} from "../data/salesData";

function Dashboard() {
  return (
    <div className="dashboard">

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
            <strong>₱1.24M</strong>
            <small>↑ 12.4%</small>
          </div>

          <div className="floating-stat stat-two">
            <span>Forecast</span>
            <strong>₱148K</strong>
            <small>NEXT MONTH</small>
          </div>

          <div className="hero-circle">
            <TrendingUp size={55} />
          </div>
        </div>
      </section>

      <section className="stats-grid">
        <StatCard
          label="Total Revenue"
          value="₱1.24M"
          change="+12.4%"
          description="vs. previous period"
          accent="yellow"
        />

        <StatCard
          label="Units Sold"
          value="18,429"
          change="+8.7%"
          description="total quantity sold"
          accent="blue"
        />

        <StatCard
          label="Avg. Order Value"
          value="₱2,184"
          change="+4.2%"
          description="average transaction"
          accent="red"
        />

        <StatCard
          label="Forecast Accuracy"
          value="91.8%"
          change="+3.1%"
          description="model performance"
          accent="green"
        />
      </section>

      <section className="dashboard-grid">

        <ChartCard
          title="Revenue Performance"
          subtitle="Monthly revenue across the current dataset"
          className="revenue-chart"
        >
          <ResponsiveContainer width="100%" height={330}>
            <BarChart data={monthlySales}>
              <CartesianGrid
                strokeDasharray="4 4"
                vertical={false}
              />

              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
              />

              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) =>
                  `₱${value / 1000}k`
                }
              />

              <Tooltip
                formatter={(value) =>
                  `₱${Number(value).toLocaleString()}`
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
        </ChartCard>

        <section className="insight-card">
          <div className="insight-header">
            <div className="insight-icon">
              <Sparkles size={21} />
            </div>

            <span>KEY INSIGHT</span>
          </div>

          <h3>
            Revenue has maintained
            a strong upward trend.
          </h3>

          <p>
            Sales increased consistently throughout
            the observed period, with the strongest
            performance occurring toward the final
            quarter.
          </p>

          <div className="insight-metric">
            <div>
              <span>Growth</span>
              <strong>+12.4%</strong>
            </div>

            <div>
              <span>Trend</span>
              <strong>UPWARD</strong>
            </div>
          </div>

          <button className="text-button">
            Open Sales Analysis
            <ArrowRight size={17} />
          </button>
        </section>
      </section>

      <section className="bottom-grid">

        <ChartCard
          title="Top Products"
          subtitle="Products generating the highest revenue"
          className="products-card"
        >
          <div className="product-list">
            {topProducts.map((product, index) => (
              <div
                className="product-row"
                key={product.name}
              >
                <div className="product-rank">
                  {String(index + 1).padStart(2, "0")}
                </div>

                <div className="product-info">
                  <strong>{product.name}</strong>
                  <span>{product.category}</span>
                </div>

                <div className="product-sales">
                  <strong>
                    ₱{product.sales.toLocaleString()}
                  </strong>

                  <span>
                    {product.units} units
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

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
              <strong>Import Dataset</strong>
              <span>Upload CSV or Excel</span>
            </div>
            <ArrowRight size={18} />
          </button>

          <button className="quick-action blue">
            <TrendingUp size={22} />
            <div>
              <strong>Run Forecast</strong>
              <span>Predict future sales</span>
            </div>
            <ArrowRight size={18} />
          </button>

          <button className="quick-action red">
            <CalendarDays size={22} />
            <div>
              <strong>View Trends</strong>
              <span>Explore sales patterns</span>
            </div>
            <ArrowRight size={18} />
          </button>
        </section>

      </section>

    </div>
  );
}

export default Dashboard;