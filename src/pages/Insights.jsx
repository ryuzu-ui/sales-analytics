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

import { useSalesData } from "../context/SalesDataContext";

/* ============================================================
   FORMATTING
============================================================ */

function formatCurrency(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "£0.00";
  }

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

function formatPercent(value) {
  if (!Number.isFinite(value)) {
    return "0.0%";
  }

  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

/* ============================================================
   BASIC STATISTICS
============================================================ */

function calculateMean(values) {
  if (!values.length) {
    return 0;
  }

  return (
    values.reduce(
      (sum, value) => sum + Number(value),
      0
    ) / values.length
  );
}

/* ============================================================
   PEARSON CORRELATION
============================================================ */

function calculateCorrelation(xValues, yValues) {
  const pairs = [];

  for (
    let i = 0;
    i < Math.min(
      xValues.length,
      yValues.length
    );
    i += 1
  ) {
    const x = Number(xValues[i]);
    const y = Number(yValues[i]);

    if (
      Number.isFinite(x) &&
      Number.isFinite(y)
    ) {
      pairs.push([x, y]);
    }
  }

  if (pairs.length < 2) {
    return 0;
  }

  const xMean = calculateMean(
    pairs.map(([x]) => x)
  );

  const yMean = calculateMean(
    pairs.map(([, y]) => y)
  );

  let numerator = 0;
  let xDenominator = 0;
  let yDenominator = 0;

  for (const [x, y] of pairs) {
    const xDifference =
      x - xMean;

    const yDifference =
      y - yMean;

    numerator +=
      xDifference *
      yDifference;

    xDenominator +=
      xDifference ** 2;

    yDenominator +=
      yDifference ** 2;
  }

  if (
    xDenominator === 0 ||
    yDenominator === 0
  ) {
    return 0;
  }

  return (
    numerator /
    Math.sqrt(
      xDenominator *
        yDenominator
    )
  );
}

/* ============================================================
   CORRELATION STRENGTH
============================================================ */

function getStrength(value) {
  const absolute =
    Math.abs(value);

  if (absolute >= 0.8) {
    return "Very Strong";
  }

  if (absolute >= 0.6) {
    return "Strong";
  }

  if (absolute >= 0.4) {
    return "Moderate";
  }

  if (absolute >= 0.2) {
    return "Weak";
  }

  return "Very Weak";
}

/* ============================================================
   TREND / FORECAST
============================================================ */

function calculateLinearRegression(
  values
) {
  const n = values.length;

  if (n < 2) {
    return {
      slope: 0,
      intercept:
        values[0] || 0,
      nextForecast:
        values[0] || 0,
    };
  }

  const xMean =
    (n - 1) / 2;

  const yMean =
    calculateMean(values);

  let numerator = 0;
  let denominator = 0;

  for (
    let i = 0;
    i < n;
    i += 1
  ) {
    const xDifference =
      i - xMean;

    const yDifference =
      values[i] - yMean;

    numerator +=
      xDifference *
      yDifference;

    denominator +=
      xDifference ** 2;
  }

  const slope =
    denominator === 0
      ? 0
      : numerator /
        denominator;

  const intercept =
    yMean -
    slope * xMean;

  const nextX = n;

  const nextForecast =
    intercept +
    slope * nextX;

  return {
    slope,
    intercept,
    nextForecast,
  };
}

/* ============================================================
   MAIN COMPONENT
============================================================ */

function Insights() {
  const {
    records,
    monthlySales,
    topProducts,
    isImported,
    isCleaned,
  } = useSalesData();

  /* ==========================================================
     ACTUAL DATA ANALYSIS
  ========================================================== */

  const analysis = useMemo(() => {
    const monthlyValues =
      monthlySales
        .map((item) =>
          Number(item.revenue)
        )
        .filter(Number.isFinite);

    if (!monthlyValues.length) {
      return {
        hasData: false,
        firstHalfAverage: 0,
        secondHalfAverage: 0,
        overallChange: 0,
        secondHalfChange: 0,
        highestMonth: null,
        lowestMonth: null,
        latestRevenue: 0,
        previousRevenue: 0,
        latestGrowth: 0,
        averageRevenue: 0,
        forecastSlope: 0,
        nextForecast: 0,
        forecastChange: 0,
        correlation: 0,
        correlationStrength:
          "Very Weak",
        correlationObservations: 0,
      };
    }

    /* --------------------------------------------------------
       First half / second half
    -------------------------------------------------------- */

    const midpoint =
      Math.floor(
        monthlyValues.length / 2
      );

    const firstHalf =
      monthlyValues.slice(
        0,
        midpoint
      );

    const secondHalf =
      monthlyValues.slice(
        midpoint
      );

    const firstHalfAverage =
      calculateMean(firstHalf);

    const secondHalfAverage =
      calculateMean(secondHalf);

    const secondHalfChange =
      firstHalfAverage === 0
        ? 0
        : ((secondHalfAverage -
            firstHalfAverage) /
            firstHalfAverage) *
          100;

    /* --------------------------------------------------------
       First-to-latest change
    -------------------------------------------------------- */

    const firstRevenue =
      monthlyValues[0];

    const latestRevenue =
      monthlyValues[
        monthlyValues.length - 1
      ];

    const previousRevenue =
      monthlyValues.length > 1
        ? monthlyValues[
            monthlyValues.length - 2
          ]
        : latestRevenue;

    const overallChange =
      firstRevenue === 0
        ? 0
        : ((latestRevenue -
            firstRevenue) /
            firstRevenue) *
          100;

    const latestGrowth =
      previousRevenue === 0
        ? 0
        : ((latestRevenue -
            previousRevenue) /
            previousRevenue) *
          100;

    /* --------------------------------------------------------
       Highest / lowest month
    -------------------------------------------------------- */

    const highestMonth =
      monthlySales.reduce(
        (highest, current) =>
          Number(
            current.revenue
          ) >
          Number(
            highest.revenue
          )
            ? current
            : highest,
        monthlySales[0]
      );

    const lowestMonth =
      monthlySales.reduce(
        (lowest, current) =>
          Number(
            current.revenue
          ) <
          Number(
            lowest.revenue
          )
            ? current
            : lowest,
        monthlySales[0]
      );

    /* --------------------------------------------------------
       Linear regression forecast
       Same concept used by Forecasting.jsx
    -------------------------------------------------------- */

    const regression =
      calculateLinearRegression(
        monthlyValues
      );

    const forecastChange =
      latestRevenue === 0
        ? 0
        : ((regression.nextForecast -
            latestRevenue) /
            latestRevenue) *
          100;

    /* --------------------------------------------------------
       ACTUAL transaction-level correlation
       
       Quantity ↔ Revenue

       Revenue is already calculated by the context as:
       quantity × unitPrice
    -------------------------------------------------------- */

    const quantityValues = [];
    const revenueValues = [];

    for (const record of records) {
      const quantity =
        Number(
          record.quantity
        );

      const revenue =
        Number(record.revenue);

      if (
        Number.isFinite(
          quantity
        ) &&
        Number.isFinite(
          revenue
        )
      ) {
        quantityValues.push(
          quantity
        );

        revenueValues.push(
          revenue
        );
      }
    }

    const correlation =
      calculateCorrelation(
        quantityValues,
        revenueValues
      );

    return {
      hasData: true,

      firstHalfAverage,
      secondHalfAverage,

      overallChange,
      secondHalfChange,

      highestMonth,
      lowestMonth,

      firstRevenue,
      latestRevenue,
      previousRevenue,

      latestGrowth,

      averageRevenue:
        calculateMean(
          monthlyValues
        ),

      forecastSlope:
        regression.slope,

      nextForecast:
        regression.nextForecast,

      forecastChange,

      correlation,

      correlationStrength:
        getStrength(
          correlation
        ),

      correlationObservations:
        quantityValues.length,
    };
  }, [
    records,
    monthlySales,
  ]);

  /* ==========================================================
     EMPTY STATE
  ========================================================== */

  if (
    !isImported ||
    !isCleaned ||
    !analysis.hasData
  ) {
    return (
      <div className="insights-page">
        <section className="insights-heading">
          <div>
            <div className="section-kicker">
              <span className="kicker-block">
                09
              </span>

              ANALYTICAL FINDINGS
            </div>

            <h1>
              DATA
              <br />
              <span>
                INSIGHTS.
              </span>
            </h1>

            <p>
              Import and clean a sales
              dataset to generate analytical
              findings from the actual sales
              records.
            </p>
          </div>

          <div className="insight-status">
            <AlertTriangle
              size={20}
            />

            <div>
              <span>
                ANALYSIS STATUS
              </span>

              <strong>
                WAITING FOR DATA
              </strong>
            </div>
          </div>
        </section>
      </div>
    );
  }

  /* ==========================================================
     INSIGHT CARDS
  ========================================================== */

  const trendIcon =
    analysis.overallChange >= 0
      ? TrendingUp
      : TrendingDown;

  const insightCards = [
    {
      type: "trend",
      icon: trendIcon,
      label: "FIRST-TO-LATEST CHANGE",
      title:
        analysis.overallChange >= 0
          ? "Revenue increased across the observed period"
          : "Revenue decreased across the observed period",
      value: formatPercent(
        analysis.overallChange
      ),
      description: `Revenue changed from ${formatCurrency(
        analysis.firstRevenue
      )} in ${
        monthlySales[0].month
      } to ${formatCurrency(
        analysis.latestRevenue
      )} in ${
        monthlySales[
          monthlySales.length - 1
        ].month
      }.`,
      className:
        "insight-purple",
    },

    {
      type: "period",
      icon: CalendarRange,
      label: "PERIOD COMPARISON",
      title:
        analysis.secondHalfChange >= 0
          ? "Later-period average revenue was higher"
          : "Later-period average revenue was lower",
      value: formatPercent(
        analysis.secondHalfChange
      ),
      description: `The second-half average was ${formatCurrency(
        analysis.secondHalfAverage
      )}, compared with ${formatCurrency(
        analysis.firstHalfAverage
      )} in the first half.`,
      className:
        "insight-yellow",
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
        "This period represents the strongest observed monthly revenue in the cleaned dataset.",
      className:
        "insight-pink",
    },

    {
      type: "relationship",
      icon: Link2,
      label: "CORRELATION",
      title:
        "Quantity and revenue relationship",
      value:
        analysis.correlation.toFixed(
          3
        ),
      description: `${analysis.correlationStrength} positive relationship between quantity sold and transaction revenue based on ${analysis.correlationObservations.toLocaleString()} cleaned records.`,
      className:
        "insight-white",
    },
  ];

  return (
    <div className="insights-page">
      {/* ==================================================
          HEADER
      ================================================== */}

      <section className="insights-heading">
        <div>
          <div className="section-kicker">
            <span className="kicker-block">
              09
            </span>

            ANALYTICAL FINDINGS
          </div>

          <h1>
            DATA
            <br />
            <span>
              INSIGHTS.
            </span>
          </h1>

          <p>
            Turn statistical results,
            discovered patterns,
            relationships, and forecasts
            into clear findings that can
            support business decisions.
          </p>
        </div>

        <div className="insight-status">
          <CheckCircle2
            size={20}
          />

          <div>
            <span>
              ANALYSIS STATUS
            </span>

            <strong>
              COMPLETE
            </strong>
          </div>
        </div>
      </section>

      {/* ==================================================
          EXECUTIVE SUMMARY
      ================================================== */}

      <section className="insight-overview">
        <div className="overview-main">
          <span className="insight-card-kicker">
            EXECUTIVE SUMMARY
          </span>

          <h2>
            Sales performance shows
            substantial variation across
            the observed period.
          </h2>

          <p>
            The cleaned dataset contains
            monthly revenue observations
            with noticeable increases and
            decreases across the period.
            The strongest observed month was{" "}
            <strong>
              {analysis.highestMonth.month}
            </strong>
            , while the lowest was{" "}
            <strong>
              {analysis.lowestMonth.month}
            </strong>
            .
          </p>

          <div className="overview-highlight">
            <div>
              <span>
                AVERAGE REVENUE
              </span>

              <strong>
                {formatCurrency(
                  analysis.averageRevenue
                )}
              </strong>
            </div>

            <div>
              <span>
                LATEST REVENUE
              </span>

              <strong>
                {formatCurrency(
                  analysis.latestRevenue
                )}
              </strong>
            </div>

            <div>
              <span>
                NEXT FORECAST
              </span>

              <strong>
                {formatCurrency(
                  analysis.nextForecast
                )}
              </strong>
            </div>
          </div>
        </div>

        <div className="overview-side">
          <Brain size={36} />

          <span>
            PREDICTIVE SIGNAL
          </span>

          <strong>
            {analysis.forecastSlope >= 0
              ? "POSITIVE"
              : "NEGATIVE"}
          </strong>

          <p>
            The linear historical trend
            produces a{" "}
            {analysis.forecastSlope >= 0
              ? "positive"
              : "negative"}{" "}
            baseline forecast direction.
          </p>
        </div>
      </section>

      {/* ==================================================
          INSIGHT CARDS
      ================================================== */}

      <section className="insight-grid">
        {insightCards.map(
          (item) => {
            const Icon =
              item.icon;

            return (
              <article
                key={item.type}
                className={`insight-card ${item.className}`}
              >
                <div className="insight-card-top">
                  <div className="insight-icon">
                    <Icon size={21} />
                  </div>

                  <span>
                    {item.label}
                  </span>
                </div>

                <h2>
                  {item.title}
                </h2>

                <strong className="insight-value">
                  {item.value}
                </strong>

                <p>
                  {item.description}
                </p>
              </article>
            );
          }
        )}
      </section>

      {/* ==================================================
          KEY FINDINGS
      ================================================== */}

      <section className="findings-section">
        <div className="findings-header">
          <div>
            <span className="insight-card-kicker">
              KEY FINDINGS
            </span>

            <h2>
              What the analysis
              discovered
            </h2>
          </div>

          <div className="findings-count">
            04 FINDINGS
          </div>
        </div>

        <div className="findings-list">
          {/* -----------------------------------------------
              FINDING 01
          ----------------------------------------------- */}

          <article className="finding-row">
            <div className="finding-number">
              01
            </div>

            <div className="finding-icon finding-green">
              {analysis.overallChange >=
              0 ? (
                <TrendingUp
                  size={23}
                />
              ) : (
                <TrendingDown
                  size={23}
                />
              )}
            </div>

            <div className="finding-content">
              <span>
                TREND ANALYSIS
              </span>

              <h3>
                Revenue changed across
                the observed period
              </h3>

              <p>
                Revenue changed from{" "}
                <strong>
                  {formatCurrency(
                    analysis.firstRevenue
                  )}
                </strong>{" "}
                in{" "}
                <strong>
                  {monthlySales[0].month}
                </strong>{" "}
                to{" "}
                <strong>
                  {formatCurrency(
                    analysis.latestRevenue
                  )}
                </strong>{" "}
                in{" "}
                <strong>
                  {
                    monthlySales[
                      monthlySales.length -
                        1
                    ].month
                  }
                </strong>
                , representing a first-to-latest
                change of{" "}
                <strong>
                  {formatPercent(
                    analysis.overallChange
                  )}
                </strong>
                .
              </p>
            </div>
          </article>

          {/* -----------------------------------------------
              FINDING 02
          ----------------------------------------------- */}

          <article className="finding-row">
            <div className="finding-number">
              02
            </div>

            <div className="finding-icon finding-yellow">
              <CalendarRange
                size={23}
              />
            </div>

            <div className="finding-content">
              <span>
                PERIOD COMPARISON
              </span>

              <h3>
                Later periods produced{" "}
                {analysis.secondHalfChange >=
                0
                  ? "higher"
                  : "lower"}{" "}
                average sales
              </h3>

              <p>
                The second-half average
                revenue is{" "}
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
                in the first half, a
                difference of{" "}
                <strong>
                  {formatPercent(
                    analysis.secondHalfChange
                  )}
                </strong>
                .
              </p>
            </div>
          </article>

          {/* -----------------------------------------------
              FINDING 03
          ----------------------------------------------- */}

          <article className="finding-row">
            <div className="finding-number">
              03
            </div>

            <div className="finding-icon finding-pink">
              <Link2 size={23} />
            </div>

            <div className="finding-content">
              <span>
                CORRELATION ANALYSIS
              </span>

              <h3>
                Quantity has a strong
                positive relationship with
                revenue
              </h3>

              <p>
                The calculated Pearson
                correlation is{" "}
                <strong>
                  {analysis.correlation.toFixed(
                    3
                  )}
                </strong>
                , indicating a{" "}
                <strong>
                  {analysis.correlationStrength.toLowerCase()}
                </strong>{" "}
                positive relationship
                between quantity sold and
                transaction revenue.
              </p>

              <p>
                This relationship does not
                establish causation. Revenue
                is calculated from quantity
                and unit price, so a strong
                quantity-revenue relationship
                is expected.
              </p>
            </div>
          </article>

          {/* -----------------------------------------------
              FINDING 04
          ----------------------------------------------- */}

          <article className="finding-row">
            <div className="finding-number">
              04
            </div>

            <div className="finding-icon finding-purple">
              <Brain size={23} />
            </div>

            <div className="finding-content">
              <span>
                FORECASTING
              </span>

              <h3>
                Historical trend provides a
                baseline forecast direction
              </h3>

              <p>
                Using the same linear trend
                approach as the Forecasting
                module, the next-period
                estimated revenue is
                approximately{" "}
                <strong>
                  {formatCurrency(
                    analysis.nextForecast
                  )}
                </strong>
                .
              </p>

              <p>
                The forecast should be treated
                as a baseline estimate because
                historical monthly revenue
                shows substantial variation.
              </p>
            </div>
          </article>
        </div>
      </section>

      {/* ==================================================
          BUSINESS IMPLICATIONS
      ================================================== */}

      <section className="business-insight-grid">
        <article className="business-card business-card-yellow">
          <div className="business-card-icon">
            <Lightbulb size={25} />
          </div>

          <div>
            <span>
              BUSINESS IMPLICATION
            </span>

            <h2>
              Monitor monthly revenue
              fluctuations
            </h2>

            <p>
              Tracking monthly revenue can
              help identify whether changes
              represent recurring patterns or
              temporary fluctuations in the
              historical dataset.
            </p>
          </div>
        </article>

        <article className="business-card business-card-pink">
          <div className="business-card-icon">
            <Target size={25} />
          </div>

          <div>
            <span>
              PLANNING IMPLICATION
            </span>

            <h2>
              Use forecasts as a planning
              baseline
            </h2>

            <p>
              Forecast values can be compared
              with actual future sales to
              identify differences between
              expected and observed
              performance.
            </p>
          </div>
        </article>
      </section>

      {/* ==================================================
          INTERPRETATION WARNING
      ================================================== */}

      <section className="insight-warning">
        <AlertTriangle size={22} />

        <div>
          <strong>
            INTERPRETATION REMINDER
          </strong>

          <p>
            These insights describe patterns
            present in the current cleaned
            dataset. Correlation does not
            establish causation, and forecasts
            are estimates rather than
            guaranteed future outcomes.
          </p>
        </div>
      </section>

      {/* ==================================================
          TOP PRODUCTS
      ================================================== */}

      <section className="top-product-insights">
        <div className="findings-header">
          <div>
            <span className="insight-card-kicker">
              PRODUCT PERFORMANCE
            </span>

            <h2>
              Top observed products
            </h2>
          </div>
        </div>

        <div className="product-insight-grid">
          {topProducts
            .slice(0, 5)
            .map(
              (
                product,
                index
              ) => (
                <article
                  className="product-insight-card"
                  key={
                    product.name
                  }
                >
                  <div className="product-rank">
                    {String(
                      index + 1
                    ).padStart(
                      2,
                      "0"
                    )}
                  </div>

                  <div className="product-insight-info">
                    <span>
                      {product.category ||
                        "Uncategorized"}
                    </span>

                    <h3>
                      {
                        product.name
                      }
                    </h3>

                    <strong>
                      {formatCurrency(
                        product.sales
                      )}
                    </strong>

                    <p>
                      {Number(
                        product.units
                      ).toLocaleString(
                        "en-GB"
                      )}{" "}
                      units sold
                    </p>
                  </div>
                </article>
              )
            )}
        </div>
      </section>
    </div>
  );
}

export default Insights;