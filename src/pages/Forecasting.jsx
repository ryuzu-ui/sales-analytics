import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  TrendingUp,
  Brain,
  Target,
  Calculator,
  CalendarDays,
  ArrowUpRight,
  ArrowDownRight,
  Info,
} from "lucide-react";

import { useSalesData } from "../context/SalesDataContext";

function linearRegression(data) {
  const n = data.length;

  if (!n) {
    return {
      slope: 0,
      intercept: 0,
      predict: () => 0,
      predictions: [],
      r2: 0,
      mae: 0,
    };
  }

  const x = data.map((_, index) => index + 1);
  const y = data.map((item) => Number(item.revenue) || 0);

  const xMean =
    x.reduce((sum, value) => sum + value, 0) / n;

  const yMean =
    y.reduce((sum, value) => sum + value, 0) / n;

  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i += 1) {
    numerator +=
      (x[i] - xMean) * (y[i] - yMean);

    denominator +=
      (x[i] - xMean) ** 2;
  }

  const slope =
    denominator === 0
      ? 0
      : numerator / denominator;

  const intercept =
    yMean - slope * xMean;

  const predict = (period) =>
    intercept + slope * period;

  const predictions = data.map(
    (item, index) => ({
      ...item,
      predicted: predict(index + 1),
    })
  );

  const ssTotal = y.reduce(
    (sum, value) =>
      sum + (value - yMean) ** 2,
    0
  );

  const ssResidual = predictions.reduce(
    (sum, item) =>
      sum +
      (item.revenue - item.predicted) ** 2,
    0
  );

  const r2 =
    ssTotal === 0
      ? 0
      : Math.max(
          0,
          1 - ssResidual / ssTotal
        );

  const mae =
    predictions.reduce(
      (sum, item) =>
        sum +
        Math.abs(
          item.revenue -
            item.predicted
        ),
      0
    ) / n;

  return {
    slope,
    intercept,
    predict,
    predictions,
    r2,
    mae,
  };
}

function formatCurrency(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "£0.00";
  }

  return `£${number.toLocaleString(
    "en-GB",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}`;
}

function formatCompactCurrency(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "£0.00";
  }

  if (Math.abs(number) >= 1000000) {
    return `£${(
      number / 1000000
    ).toFixed(1)}M`;
  }

  if (Math.abs(number) >= 1000) {
    return `£${(
      number / 1000
    ).toFixed(0)}K`;
  }

  return `£${number.toLocaleString(
    "en-GB",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}`;
}

function getNextMonthLabel(
  lastMonth,
  offset
) {
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const lastIndex =
    monthNames.indexOf(lastMonth);

  if (lastIndex === -1) {
    return `M+${offset}`;
  }

  return monthNames[
    (lastIndex + offset) % 12
  ];
}

function Forecasting() {
  const [forecastPeriods, setForecastPeriods] =
    useState(6);

  const {
    monthlySales,
    isImported,
    isCleaned,
  } = useSalesData();

  /*
   * The regression uses the already aggregated
   * monthly sales data from SalesDataContext.
   *
   * It does NOT loop through all 524,878
   * transaction records here.
   */
  const model = useMemo(() => {
    return linearRegression(
      monthlySales || []
    );
  }, [monthlySales]);

  const hasData =
    isImported &&
    isCleaned &&
    monthlySales &&
    monthlySales.length > 0;

  const lastActual = hasData
    ? Number(
        monthlySales[
          monthlySales.length - 1
        ].revenue
      ) || 0
    : 0;

  const forecastData = useMemo(() => {
    if (!hasData) {
      return [];
    }

    return Array.from(
      {
        length: forecastPeriods,
      },
      (_, index) => {
        const period =
          monthlySales.length +
          index +
          1;

        const predicted = Math.max(
          0,
          model.predict(period)
        );

        const previousValue =
          index === 0
            ? lastActual
            : Math.max(
                0,
                model.predict(period - 1)
              );

        const change =
          previousValue === 0
            ? 0
            : ((predicted -
                previousValue) /
                previousValue) *
              100;

        return {
          period,

          month:
            getNextMonthLabel(
              monthlySales[
                monthlySales.length - 1
              ].month,
              index + 1
            ),

          forecast: predicted,
          change,
        };
      }
    );
  }, [
    hasData,
    forecastPeriods,
    monthlySales,
    model,
    lastActual,
  ]);

  const chartData = useMemo(() => {
    if (!hasData) {
      return [];
    }

    const historical =
      monthlySales.map(
        (item, index) => ({
          month: item.month,
          actual: item.revenue,

          forecast:
            index ===
            monthlySales.length - 1
              ? item.revenue
              : null,
        })
      );

    const future =
      forecastData.map((item) => ({
        month: item.month,
        actual: null,
        forecast:
          item.forecast,
      }));

    return [
      ...historical,
      ...future,
    ];
  }, [
    hasData,
    monthlySales,
    forecastData,
  ]);

  const averageForecast =
    forecastData.length > 0
      ? forecastData.reduce(
          (sum, item) =>
            sum + item.forecast,
          0
        ) / forecastData.length
      : 0;

  const totalForecast =
    forecastData.reduce(
      (sum, item) =>
        sum + item.forecast,
      0
    );

  const forecastGrowth =
    lastActual === 0
      ? 0
      : forecastData.length > 0
      ? ((forecastData[0].forecast -
          lastActual) /
          lastActual) *
        100
      : 0;

  const trendDirection =
    model.slope > 0
      ? "Increasing"
      : model.slope < 0
      ? "Decreasing"
      : "Stable";

  /*
   * EMPTY STATE
   */
  if (!hasData) {
    return (
      <div className="forecast-page">
        <section className="forecast-heading">
          <div>
            <div className="section-kicker">
              <span className="kicker-block">
                07
              </span>

              PREDICTIVE ANALYSIS
            </div>

            <h1>
              SALES
              <br />
              <span>FORECASTING.</span>
            </h1>

            <p>
              Import and clean a sales dataset
              to generate a regression-based
              revenue forecast.
            </p>
          </div>
        </section>

        <section className="forecast-insight-card">
          <div className="insight-number">
            01
          </div>

          <div>
            <span className="forecast-card-kicker">
              DATA REQUIRED
            </span>

            <h2>
              No cleaned sales data available
            </h2>

            <p>
              Import the UCI Online Retail
              dataset using the{" "}
              <strong>
                Import Data
              </strong>{" "}
              button in the top navigation,
              then clean the dataset in Data
              Studio before generating a
              forecast.
            </p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="forecast-page">
      {/* HEADER */}
      <section className="forecast-heading">
        <div>
          <div className="section-kicker">
            <span className="kicker-block">
              07
            </span>

            PREDICTIVE ANALYSIS
          </div>

          <h1>
            SALES
            <br />
            <span>FORECASTING.</span>
          </h1>

          <p>
            Use historical sales data to
            estimate future revenue using a
            regression-based predictive model.
          </p>
        </div>

        <div className="forecast-control-card">
          <div className="forecast-control-label">
            <CalendarDays size={18} />
            FORECAST HORIZON
          </div>

          <div className="forecast-period-buttons">
            {[3, 6, 12].map(
              (period) => (
                <button
                  key={period}
                  type="button"
                  className={
                    forecastPeriods ===
                    period
                      ? "forecast-period active"
                      : "forecast-period"
                  }
                  onClick={() =>
                    setForecastPeriods(
                      period
                    )
                  }
                >
                  {period}M
                </button>
              )
            )}
          </div>
        </div>
      </section>

      {/* KPI CARDS */}
      <section className="forecast-kpi-grid">
        <article className="forecast-kpi kpi-purple">
          <div className="forecast-kpi-top">
            <span>
              MODEL TREND
            </span>

            <TrendingUp size={22} />
          </div>

          <strong>
            {trendDirection}
          </strong>

          <p>
            {formatCurrency(
              Math.abs(model.slope)
            )}{" "}
            average monthly trend
          </p>
        </article>

        <article className="forecast-kpi kpi-yellow">
          <div className="forecast-kpi-top">
            <span>
              NEXT PERIOD
            </span>

            {forecastGrowth >= 0 ? (
              <ArrowUpRight
                size={22}
              />
            ) : (
              <ArrowDownRight
                size={22}
              />
            )}
          </div>

          <strong>
            {formatCompactCurrency(
              forecastData[0]
                ?.forecast || 0
            )}
          </strong>

          <p>
            {forecastGrowth >= 0
              ? "+"
              : ""}
            {forecastGrowth.toFixed(
              1
            )}
            % vs latest actual
          </p>
        </article>

        <article className="forecast-kpi kpi-pink">
          <div className="forecast-kpi-top">
            <span>
              MODEL R²
            </span>

            <Target size={22} />
          </div>

          <strong>
            {(model.r2 * 100).toFixed(
              1
            )}
            %
          </strong>

          <p>
            Training model fit
          </p>
        </article>

        <article className="forecast-kpi kpi-white">
          <div className="forecast-kpi-top">
            <span>
              AVERAGE FORECAST
            </span>

            <Calculator size={22} />
          </div>

          <strong>
            {formatCompactCurrency(
              averageForecast
            )}
          </strong>

          <p>
            Expected monthly revenue
          </p>
        </article>
      </section>

      {/* MAIN FORECAST */}
      <section className="forecast-main-grid">
        <div className="forecast-chart-card">
          <div className="forecast-card-header">
            <div>
              <span className="forecast-card-kicker">
                HISTORICAL + PREDICTED
              </span>

              <h2>
                Revenue Forecast
              </h2>
            </div>

            <div className="forecast-legend">
              <span>
                <i className="legend-dot actual-dot" />
                ACTUAL
              </span>

              <span>
                <i className="legend-dot forecast-dot" />
                FORECAST
              </span>
            </div>
          </div>

          <div className="forecast-chart">
            <ResponsiveContainer
              width="100%"
              height={400}
            >
              <LineChart
                data={chartData}
                margin={{
                  top: 20,
                  right: 20,
                  left: 10,
                  bottom: 10,
                }}
              >
                <CartesianGrid
                  strokeDasharray="4 4"
                  stroke="#000"
                  opacity={0.12}
                />

                <XAxis
                  dataKey="month"
                  tick={{
                    fill: "#000",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                  axisLine={{
                    stroke: "#000",
                    strokeWidth: 2,
                  }}
                  tickLine={false}
                />

                <YAxis
                  tickFormatter={
                    formatCompactCurrency
                  }
                  tick={{
                    fill: "#000",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                  axisLine={{
                    stroke: "#000",
                    strokeWidth: 2,
                  }}
                  tickLine={false}
                />

                <Tooltip
                  formatter={(
                    value,
                    name
                  ) => [
                    formatCurrency(
                      value
                    ),
                    name ===
                    "actual"
                      ? "Actual"
                      : "Forecast",
                  ]}
                  contentStyle={{
                    border:
                      "3px solid #000",
                    borderRadius:
                      "0px",
                    boxShadow:
                      "5px 5px 0 #000",
                    fontWeight: 700,
                  }}
                />

                <Line
                  type="monotone"
                  dataKey="actual"
                  name="Actual"
                  stroke="#000"
                  strokeWidth={5}
                  dot={{
                    r: 5,
                    stroke: "#000",
                    strokeWidth: 2,
                    fill: "#bc9fdb",
                  }}
                  activeDot={{
                    r: 7,
                    stroke: "#000",
                    strokeWidth: 3,
                    fill: "#f2d048",
                  }}
                  connectNulls
                />

                <Line
                  type="monotone"
                  dataKey="forecast"
                  name="Forecast"
                  stroke="#e85b9d"
                  strokeWidth={5}
                  strokeDasharray="10 6"
                  dot={{
                    r: 5,
                    stroke: "#000",
                    strokeWidth: 2,
                    fill: "#f08cb6",
                  }}
                  activeDot={{
                    r: 7,
                    stroke: "#000",
                    strokeWidth: 3,
                    fill: "#f2d048",
                  }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="forecast-chart-note">
            <Info size={18} />

            <span>
              Forecast values are calculated
              from the historical monthly
              revenue trend using simple linear
              regression.
            </span>
          </div>
        </div>

        {/* MODEL CARD */}
        <aside className="model-card">
          <div className="model-card-header">
            <div className="model-icon">
              <Brain size={27} />
            </div>

            <div>
              <span>MODEL</span>

              <h3>
                Linear Regression
              </h3>
            </div>
          </div>

          <div className="model-equation">
            <span>
              FORECAST EQUATION
            </span>

            <strong>
              y ={" "}
              {model.slope.toFixed(2)}
              x{" "}
              {model.intercept >= 0
                ? "+"
                : "−"}{" "}
              {Math.abs(
                model.intercept
              ).toFixed(2)}
            </strong>
          </div>

          <div className="model-metrics">
            <div>
              <span>SLOPE</span>

              <strong>
                {model.slope >= 0
                  ? "+"
                  : ""}
                {formatCurrency(
                  model.slope
                )}
              </strong>
            </div>

            <div>
              <span>
                INTERCEPT
              </span>

              <strong>
                {formatCurrency(
                  model.intercept
                )}
              </strong>
            </div>

            <div>
              <span>
                TRAINING R²
              </span>

              <strong>
                {(model.r2 * 100).toFixed(
                  2
                )}
                %
              </strong>
            </div>

            <div>
              <span>
                TRAINING MAE
              </span>

              <strong>
                {formatCurrency(
                  model.mae
                )}
              </strong>
            </div>
          </div>

          <div className="model-explanation">
            <strong>
              HOW IT WORKS
            </strong>

            <p>
              The model identifies the
              historical relationship between
              time and revenue, then extends
              that trend into future periods.
            </p>
          </div>

          <div className="model-warning">
            <Info size={17} />

            <span>
              R² and MAE shown here describe
              the model's fit to the available
              historical data. They are not
              independent validation scores.
            </span>
          </div>
        </aside>
      </section>

      {/* FORECAST TABLE */}
      <section className="forecast-table-card">
        <div className="forecast-table-header">
          <div>
            <span className="forecast-card-kicker">
              FUTURE ESTIMATES
            </span>

            <h2>
              Next {forecastPeriods}{" "}
              Months
            </h2>
          </div>

          <div className="forecast-total">
            <span>
              TOTAL FORECAST
            </span>

            <strong>
              {formatCurrency(
                totalForecast
              )}
            </strong>
          </div>
        </div>

        <div className="forecast-table-wrapper">
          <table className="forecast-table">
            <thead>
              <tr>
                <th>#</th>
                <th>PERIOD</th>
                <th>
                  PREDICTED REVENUE
                </th>
                <th>
                  CHANGE VS PREVIOUS
                </th>
                <th>TREND</th>
              </tr>
            </thead>

            <tbody>
              {forecastData.map(
                (item, index) => (
                  <tr
                    key={`${item.month}-${item.period}`}
                  >
                    <td className="forecast-index">
                      {String(
                        index + 1
                      ).padStart(2, "0")}
                    </td>

                    <td className="forecast-month">
                      {item.month}
                    </td>

                    <td className="forecast-value">
                      {formatCurrency(
                        item.forecast
                      )}
                    </td>

                    <td>
                      <span
                        className={
                          item.change >=
                          0
                            ? "change-pill positive"
                            : "change-pill negative"
                        }
                      >
                        {item.change >=
                        0 ? (
                          <ArrowUpRight
                            size={15}
                          />
                        ) : (
                          <ArrowDownRight
                            size={15}
                          />
                        )}

                        {item.change >=
                        0
                          ? "+"
                          : ""}
                        {item.change.toFixed(
                          1
                        )}
                        %
                      </span>
                    </td>

                    <td>
                      <span
                        className={
                          item.change >=
                          0
                            ? "trend-badge trend-up"
                            : "trend-badge trend-down"
                        }
                      >
                        {item.change >=
                        0
                          ? "GROWING"
                          : "DECLINING"}
                      </span>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* BOTTOM */}
      <section className="forecast-bottom-grid">
        <article className="forecast-insight-card">
          <div className="insight-number">
            01
          </div>

          <div>
            <span className="forecast-card-kicker">
              FORECAST INTERPRETATION
            </span>

            <h2>
              What does the model suggest?
            </h2>

            <p>
              Based on the historical dataset,
              the regression model identifies an{" "}
              <strong>
                {trendDirection.toLowerCase()}
              </strong>{" "}
              revenue trend. The estimated
              next-period revenue is{" "}
              <strong>
                {formatCurrency(
                  forecastData[0]
                    ?.forecast || 0
                )}
              </strong>
              .
            </p>

            <p>
              Across the selected{" "}
              {forecastPeriods}-month horizon,
              the estimated average monthly
              revenue is{" "}
              <strong>
                {formatCurrency(
                  averageForecast
                )}
              </strong>
              .
            </p>
          </div>
        </article>

        <article className="forecast-method-card">
          <span className="forecast-card-kicker">
            PREDICTIVE ANALYSIS
          </span>

          <h2>
            Why forecasting matters
          </h2>

          <ul>
            <li>
              Identifies expected future
              sales levels.
            </li>

            <li>
              Converts historical patterns
              into measurable predictions.
            </li>

            <li>
              Supports planning and
              data-driven decision making.
            </li>

            <li>
              Provides a baseline for
              comparing future actual sales
              against predictions.
            </li>
          </ul>
        </article>
      </section>
    </div>
  );
}

export default Forecasting;