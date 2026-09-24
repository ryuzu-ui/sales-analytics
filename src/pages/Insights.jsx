import { useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Lightbulb,
  Link2,
  CalendarRange,
  Brain,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  Target,
} from "lucide-react";
import { monthlySales, topProducts } from "../data/salesData";

function formatCurrency(value) {
  return `₱${Math.round(value).toLocaleString("en-PH")}`;
}

function calculateMean(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function calculateCorrelation(xValues, yValues) {
  const n = xValues.length;

  const xMean = calculateMean(xValues);
  const yMean = calculateMean(yValues);

  let numerator = 0;
  let xDenominator = 0;
  let yDenominator = 0;

  for (let i = 0; i < n; i += 1) {
    const xDifference = xValues[i] - xMean;
    const yDifference = yValues[i] - yMean;

    numerator += xDifference * yDifference;
    xDenominator += xDifference ** 2;
    yDenominator += yDifference ** 2;
  }

  if (xDenominator === 0 || yDenominator === 0) {
    return 0;
  }

  return numerator / Math.sqrt(xDenominator * yDenominator);
}

function getStrength(value) {
  const absolute = Math.abs(value);

  if (absolute >= 0.8) return "Very Strong";
  if (absolute >= 0.6) return "Strong";
  if (absolute >= 0.4) return "Moderate";
  if (absolute >= 0.2) return "Weak";

  return "Very Weak";
}

function Insights() {
  const analysis = useMemo(() => {
    const revenues = monthlySales.map((item) => item.revenue);

    const firstHalf = revenues.slice(0, 6);
    const secondHalf = revenues.slice(6);

    const firstHalfAverage = calculateMean(firstHalf);
    const secondHalfAverage = calculateMean(secondHalf);

    const overallGrowth =
      ((revenues[revenues.length - 1] - revenues[0]) /
        revenues[0]) *
      100;

    const averageGrowth =
      ((secondHalfAverage - firstHalfAverage) /
        firstHalfAverage) *
      100;

    const highestMonth = monthlySales.reduce(
      (highest, current) =>
        current.revenue > highest.revenue ? current : highest
    );

    const lowestMonth = monthlySales.reduce(
      (lowest, current) =>
        current.revenue < lowest.revenue ? current : lowest
    );

    const quantityValues = [
      12, 7, 18, 5, 11, 9, 4, 21, 8, 15,
    ];

    const revenueValues = [
      26388,
      24493,
      16182,
      14495,
      14289,
      19791,
      13996,
      18879,
      23192,
      19485,
    ];

    const correlation = calculateCorrelation(
      quantityValues,
      revenueValues
    );

    const latestRevenue =
      revenues[revenues.length - 1];

    const previousRevenue =
      revenues[revenues.length - 2];

    const latestGrowth =
      ((latestRevenue - previousRevenue) /
        previousRevenue) *
      100;

    const averageRevenue = calculateMean(revenues);

    const forecastSlope =
      (revenues[revenues.length - 1] - revenues[0]) /
      (revenues.length - 1);

    const nextForecast =
      latestRevenue + forecastSlope;

    return {
      firstHalfAverage,
      secondHalfAverage,
      overallGrowth,
      averageGrowth,
      highestMonth,
      lowestMonth,
      correlation,
      correlationStrength: getStrength(correlation),
      latestRevenue,
      latestGrowth,
      averageRevenue,
      forecastSlope,
      nextForecast,
    };
  }, []);

  const insightCards = [
    {
      type: "trend",
      icon: TrendingUp,
      label: "SALES TREND",
      title: "Revenue is trending upward",
      value: `+${analysis.overallGrowth.toFixed(1)}%`,
      description: `Revenue increased from ${formatCurrency(
        monthlySales[0].revenue
      )} in ${monthlySales[0].month} to ${formatCurrency(
        analysis.latestRevenue
      )} in ${monthlySales[monthlySales.length - 1].month}.`,
      className: "insight-purple",
    },
    {
      type: "period",
      icon: CalendarRange,
      label: "PERIOD COMPARISON",
      title: "Second-half performance improved",
      value: `+${analysis.averageGrowth.toFixed(1)}%`,
      description: `Average monthly revenue in the second half was higher than the first half of the dataset.`,
      className: "insight-yellow",
    },
    {
      type: "peak",
      icon: ArrowUpRight,
      label: "PEAK PERIOD",
      title: `${analysis.highestMonth.month} recorded the highest revenue`,
      value: formatCurrency(
        analysis.highestMonth.revenue
      ),
      description:
        "This period represents the strongest observed monthly revenue in the current dataset.",
      className: "insight-pink",
    },
    {
      type: "relationship",
      icon: Link2,
      label: "CORRELATION",
      title: "Quantity and revenue move together",
      value: analysis.correlation.toFixed(2),
      description: `${analysis.correlationStrength} positive relationship between quantity sold and transaction revenue in the sample.`,
      className: "insight-white",
    },
  ];

  return (
    <div className="insights-page">
      <section className="insights-heading">
        <div>
          <div className="section-kicker">
            <span className="kicker-block">09</span>
            ANALYTICAL FINDINGS
          </div>

          <h1>
            DATA
            <br />
            <span>INSIGHTS.</span>
          </h1>

          <p>
            Turn statistical results, discovered patterns,
            relationships, and forecasts into clear findings
            that can support business decisions.
          </p>
        </div>

        <div className="insight-status">
          <CheckCircle2 size={20} />

          <div>
            <span>ANALYSIS STATUS</span>
            <strong>COMPLETE</strong>
          </div>
        </div>
      </section>

      <section className="insight-overview">
        <div className="overview-main">
          <span className="insight-card-kicker">
            EXECUTIVE SUMMARY
          </span>

          <h2>
            Sales performance shows a consistent upward
            movement across the observed period.
          </h2>

          <p>
            The current dataset indicates that revenue has
            generally increased over time, with the later
            periods producing higher sales than the beginning
            of the dataset.
          </p>

          <div className="overview-highlight">
            <div>
              <span>AVERAGE REVENUE</span>
              <strong>
                {formatCurrency(analysis.averageRevenue)}
              </strong>
            </div>

            <div>
              <span>LATEST REVENUE</span>
              <strong>
                {formatCurrency(analysis.latestRevenue)}
              </strong>
            </div>

            <div>
              <span>NEXT FORECAST</span>
              <strong>
                {formatCurrency(analysis.nextForecast)}
              </strong>
            </div>
          </div>
        </div>

        <div className="overview-side">
          <Brain size={36} />

          <span>PREDICTIVE SIGNAL</span>

          <strong>
            {analysis.forecastSlope >= 0
              ? "POSITIVE"
              : "NEGATIVE"}
          </strong>

          <p>
            The historical trend produces a{" "}
            {analysis.forecastSlope >= 0
              ? "positive"
              : "negative"}{" "}
            baseline forecast direction.
          </p>
        </div>
      </section>

      <section className="insight-grid">
        {insightCards.map((item) => {
          const Icon = item.icon;

          return (
            <article
              key={item.type}
              className={`insight-card ${item.className}`}
            >
              <div className="insight-card-top">
                <div className="insight-icon">
                  <Icon size={21} />
                </div>

                <span>{item.label}</span>
              </div>

              <h2>{item.title}</h2>

              <strong className="insight-value">
                {item.value}
              </strong>

              <p>{item.description}</p>
            </article>
          );
        })}
      </section>

      <section className="findings-section">
        <div className="findings-header">
          <div>
            <span className="insight-card-kicker">
              KEY FINDINGS
            </span>

            <h2>What the analysis discovered</h2>
          </div>

          <div className="findings-count">
            04 FINDINGS
          </div>
        </div>

        <div className="findings-list">
          <article className="finding-row">
            <div className="finding-number">01</div>

            <div className="finding-icon finding-green">
              <TrendingUp size={23} />
            </div>

            <div className="finding-content">
              <span>TREND ANALYSIS</span>

              <h3>
                Revenue demonstrates sustained growth
              </h3>

              <p>
                The dataset moves from{" "}
                <strong>
                  {formatCurrency(monthlySales[0].revenue)}
                </strong>{" "}
                at the beginning to{" "}
                <strong>
                  {formatCurrency(analysis.latestRevenue)}
                </strong>{" "}
                at the latest observed period, representing
                an overall change of{" "}
                <strong>
                  +{analysis.overallGrowth.toFixed(1)}%
                </strong>
                .
              </p>
            </div>
          </article>

          <article className="finding-row">
            <div className="finding-number">02</div>

            <div className="finding-icon finding-yellow">
              <CalendarRange size={23} />
            </div>

            <div className="finding-content">
              <span>PERIOD COMPARISON</span>

              <h3>
                Later periods produced stronger average sales
              </h3>

              <p>
                The second-half average revenue is{" "}
                <strong>
                  {formatCurrency(
                    analysis.secondHalfAverage
                  )}
                </strong>
                , compared with{" "}
                <strong>
                  {formatCurrency(
                    analysis.firstHalfAverage
                  )}
                </strong>{" "}
                in the first half.
              </p>
            </div>
          </article>

          <article className="finding-row">
            <div className="finding-number">03</div>

            <div className="finding-icon finding-pink">
              <Link2 size={23} />
            </div>

            <div className="finding-content">
              <span>CORRELATION ANALYSIS</span>

              <h3>
                Quantity sold has a positive relationship with
                revenue
              </h3>

              <p>
                The calculated Pearson correlation is{" "}
                <strong>
                  {analysis.correlation.toFixed(2)}
                </strong>
                , indicating a{" "}
                <strong>
                  {analysis.correlationStrength.toLowerCase()}
                </strong>{" "}
                positive relationship in the transaction
                sample.
              </p>
            </div>
          </article>

          <article className="finding-row">
            <div className="finding-number">04</div>

            <div className="finding-icon finding-purple">
              <Brain size={23} />
            </div>

            <div className="finding-content">
              <span>FORECASTING</span>

              <h3>
                Historical growth produces a positive forecast
                direction
              </h3>

              <p>
                Using the historical trend as a baseline, the
                next-period estimated revenue is approximately{" "}
                <strong>
                  {formatCurrency(analysis.nextForecast)}
                </strong>
                .
              </p>
            </div>
          </article>
        </div>
      </section>

      <section className="business-insight-grid">
        <article className="business-card business-card-yellow">
          <div className="business-card-icon">
            <Lightbulb size={25} />
          </div>

          <div>
            <span>BUSINESS IMPLICATION</span>

            <h2>Monitor the upward sales trajectory</h2>

            <p>
              Continued monitoring of monthly revenue can help
              identify whether the observed growth persists in
              future periods.
            </p>
          </div>
        </article>

        <article className="business-card business-card-pink">
          <div className="business-card-icon">
            <Target size={25} />
          </div>

          <div>
            <span>PLANNING IMPLICATION</span>

            <h2>Use forecasts as a planning baseline</h2>

            <p>
              Forecast values can be compared with actual future
              sales to identify differences between expected and
              observed performance.
            </p>
          </div>
        </article>
      </section>

      <section className="insight-warning">
        <AlertTriangle size={22} />

        <div>
          <strong>INTERPRETATION REMINDER</strong>

          <p>
            These insights describe patterns present in the
            current dataset. Correlation does not establish
            causation, and forecasts are estimates rather than
            guaranteed future outcomes.
          </p>
        </div>
      </section>

      <section className="top-product-insights">
        <div className="findings-header">
          <div>
            <span className="insight-card-kicker">
              PRODUCT PERFORMANCE
            </span>

            <h2>Top observed products</h2>
          </div>
        </div>

        <div className="product-insight-grid">
          {topProducts.slice(0, 5).map((product, index) => (
            <article
              className="product-insight-card"
              key={product.name}
            >
              <div className="product-rank">
                {String(index + 1).padStart(2, "0")}
              </div>

              <div className="product-insight-info">
                <span>{product.category}</span>

                <h3>{product.name}</h3>

                <strong>
                  {formatCurrency(product.sales)}
                </strong>

                <p>
                  {product.units.toLocaleString()} units sold
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Insights;