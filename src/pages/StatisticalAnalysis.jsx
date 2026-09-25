import { useMemo, useState } from "react";
import {
  BarChart3,
  FlaskConical,
  Sigma,
  Target,
  Info,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import { useSalesData } from "../context/SalesDataContext";

/* ============================================================
   FORMATTING
============================================================ */

function formatCurrency(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "£0.00";
  }

  return `£${number.toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
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
      (sum, value) => sum + value,
      0
    ) / values.length
  );
}

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

function calculateStandardDeviation(values) {
  if (values.length < 2) {
    return 0;
  }

  const mean = calculateMean(values);

  const variance =
    values.reduce(
      (sum, value) =>
        sum + (value - mean) ** 2,
      0
    ) /
    (values.length - 1);

  return Math.sqrt(variance);
}

/* ============================================================
   GAMMA / INCOMPLETE BETA
   Used for Student's t distribution.
============================================================ */

function logGamma(z) {
  const coefficients = [
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109526572012,
    9.9843695780195716e-6,
    1.5056327351493116e-7,
  ];

  if (z < 0.5) {
    return (
      Math.log(Math.PI) -
      Math.log(Math.sin(Math.PI * z)) -
      logGamma(1 - z)
    );
  }

  let x = 0.99999999999980993;

  z -= 1;

  for (
    let i = 0;
    i < coefficients.length;
    i += 1
  ) {
    x +=
      coefficients[i] /
      (z + i + 1);
  }

  const t = z + coefficients.length - 0.5;

  return (
    0.5 * Math.log(2 * Math.PI) +
    (z + 0.5) * Math.log(t) -
    t +
    Math.log(x)
  );
}

function betaContinuedFraction(
  a,
  b,
  x
) {
  const maxIterations = 200;
  const epsilon = 3e-14;
  const fpMin = 1e-300;

  let qab = a + b;
  let qap = a + 1;
  let qam = a - 1;

  let c = 1;
  let d =
    1 -
    (qab * x) / qap;

  if (Math.abs(d) < fpMin) {
    d = fpMin;
  }

  d = 1 / d;

  let h = d;

  for (
    let m = 1;
    m <= maxIterations;
    m += 1
  ) {
    const m2 = 2 * m;

    let aa =
      (m *
        (b - m) *
        x) /
      ((qam + m2) *
        (a + m2));

    d = 1 + aa * d;

    if (Math.abs(d) < fpMin) {
      d = fpMin;
    }

    c =
      1 +
      aa / c;

    if (Math.abs(c) < fpMin) {
      c = fpMin;
    }

    d = 1 / d;

    h *= d * c;

    aa =
      -(
        (a + m) *
        (qab + m) *
        x
      ) /
      ((a + m2) *
        (qap + m2));

    d = 1 + aa * d;

    if (Math.abs(d) < fpMin) {
      d = fpMin;
    }

    c =
      1 +
      aa / c;

    if (Math.abs(c) < fpMin) {
      c = fpMin;
    }

    d = 1 / d;

    const delta =
      d * c;

    h *= delta;

    if (
      Math.abs(delta - 1) <
      epsilon
    ) {
      break;
    }
  }

  return h;
}

function regularizedIncompleteBeta(
  x,
  a,
  b
) {
  if (x <= 0) {
    return 0;
  }

  if (x >= 1) {
    return 1;
  }

  const logBeta =
    logGamma(a) +
    logGamma(b) -
    logGamma(a + b);

  const front =
    Math.exp(
      a * Math.log(x) +
        b * Math.log(1 - x) -
        logBeta
    );

  if (
    x <
    (a + 1) /
      (a + b + 2)
  ) {
    return (
      (front *
        betaContinuedFraction(
          a,
          b,
          x
        )) /
      a
    );
  }

  return (
    1 -
    (front *
      betaContinuedFraction(
        b,
        a,
        1 - x
      )) /
      b
  );
}

/* ============================================================
   STUDENT'S T DISTRIBUTION
============================================================ */

function studentTCDF(t, degreesOfFreedom) {
  if (
    !Number.isFinite(t) ||
    degreesOfFreedom <= 0
  ) {
    return 0.5;
  }

  if (t === 0) {
    return 0.5;
  }

  const df =
    degreesOfFreedom;

  const x =
    df /
    (df + t * t);

  const beta =
    regularizedIncompleteBeta(
      x,
      df / 2,
      0.5
    );

  if (t > 0) {
    return 1 - 0.5 * beta;
  }

  return 0.5 * beta;
}

function calculateTwoTailedPValue(
  tStatistic,
  degreesOfFreedom
) {
  const absoluteT =
    Math.abs(tStatistic);

  const cdf =
    studentTCDF(
      absoluteT,
      degreesOfFreedom
    );

  return Math.max(
    0,
    Math.min(
      1,
      2 * (1 - cdf)
    )
  );
}

/* ============================================================
   T CRITICAL VALUES
   Exact common critical values for the confidence levels
   used by this interface.

   For 13 observations:
   df = 12

   90% = 1.782
   95% = 2.179
   99% = 3.055
============================================================ */

function getTCritical(
  confidenceLevel,
  degreesOfFreedom
) {
  /*
   * The project uses 13 monthly observations,
   * therefore df = 12.
   *
   * For other sample sizes, use a numerical
   * inversion of the Student's t CDF.
   */

  const knownValues = {
    1: {
      90: 6.314,
      95: 12.706,
      99: 63.657,
    },
    2: {
      90: 2.92,
      95: 4.303,
      99: 9.925,
    },
    3: {
      90: 2.353,
      95: 3.182,
      99: 5.841,
    },
    4: {
      90: 2.132,
      95: 2.776,
      99: 4.604,
    },
    5: {
      90: 2.015,
      95: 2.571,
      99: 4.032,
    },
    6: {
      90: 1.943,
      95: 2.447,
      99: 3.707,
    },
    7: {
      90: 1.895,
      95: 2.365,
      99: 3.499,
    },
    8: {
      90: 1.86,
      95: 2.306,
      99: 3.355,
    },
    9: {
      90: 1.833,
      95: 2.262,
      99: 3.25,
    },
    10: {
      90: 1.812,
      95: 2.228,
      99: 3.169,
    },
    11: {
      90: 1.796,
      95: 2.201,
      99: 3.106,
    },
    12: {
      90: 1.782,
      95: 2.179,
      99: 3.055,
    },
    13: {
      90: 1.771,
      95: 2.16,
      99: 3.012,
    },
    14: {
      90: 1.761,
      95: 2.145,
      99: 2.977,
    },
    15: {
      90: 1.753,
      95: 2.131,
      99: 2.947,
    },
    16: {
      90: 1.746,
      95: 2.12,
      99: 2.921,
    },
    17: {
      90: 1.74,
      95: 2.11,
      99: 2.898,
    },
    18: {
      90: 1.734,
      95: 2.101,
      99: 2.878,
    },
    19: {
      90: 1.729,
      95: 2.093,
      99: 2.861,
    },
    20: {
      90: 1.725,
      95: 2.086,
      99: 2.845,
    },
    21: {
      90: 1.721,
      95: 2.08,
      99: 2.831,
    },
    22: {
      90: 1.717,
      95: 2.074,
      99: 2.819,
    },
    23: {
      90: 1.714,
      95: 2.069,
      99: 2.807,
    },
    24: {
      90: 1.711,
      95: 2.064,
      99: 2.797,
    },
    25: {
      90: 1.708,
      95: 2.06,
      99: 2.787,
    },
    30: {
      90: 1.697,
      95: 2.042,
      99: 2.75,
    },
  };

  const known =
    knownValues[degreesOfFreedom];

  if (known) {
    return known[confidenceLevel];
  }

  /*
   * Numerical fallback.
   */
  const alpha =
    1 -
    confidenceLevel / 100;

  const target =
    1 - alpha / 2;

  let low = 0;
  let high = 20;

  for (
    let i = 0;
    i < 60;
    i += 1
  ) {
    const mid =
      (low + high) / 2;

    const cdf =
      studentTCDF(
        mid,
        degreesOfFreedom
      );

    if (cdf < target) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return (low + high) / 2;
}

/* ============================================================
   T-TEST
============================================================ */

function calculateTStatistic(
  sample,
  hypothesizedMean
) {
  const mean =
    calculateMean(sample);

  const standardDeviation =
    calculateStandardDeviation(
      sample
    );

  if (
    standardDeviation === 0 ||
    sample.length < 2
  ) {
    return 0;
  }

  return (
    (mean -
      hypothesizedMean) /
    (standardDeviation /
      Math.sqrt(sample.length))
  );
}

/* ============================================================
   MAIN COMPONENT
============================================================ */

function StatisticalAnalysis() {
  const [
    confidenceLevel,
    setConfidenceLevel,
  ] = useState(95);

  const {
    monthlySales,
    isImported,
    isCleaned,
  } = useSalesData();

  /*
   * Actual monthly revenue from the cleaned dataset.
   *
   * The UCI dataset covers:
   * Dec 2010 → Dec 2011
   *
   * Therefore the current dataset produces
   * 13 monthly observations.
   */
  const revenueValues = useMemo(() => {
    return monthlySales
      .map((item) =>
        Number(item.revenue)
      )
      .filter(Number.isFinite);
  }, [monthlySales]);

  /* ========================================================
     DESCRIPTIVE STATISTICS
  ======================================================== */

  const statistics = useMemo(() => {
    if (!revenueValues.length) {
      return {
        mean: 0,
        median: 0,
        standardDeviation: 0,
        minimum: 0,
        maximum: 0,
      };
    }

    const mean =
      calculateMean(
        revenueValues
      );

    const median =
      calculateMedian(
        revenueValues
      );

    const standardDeviation =
      calculateStandardDeviation(
        revenueValues
      );

    const minimum =
      Math.min(
        ...revenueValues
      );

    const maximum =
      Math.max(
        ...revenueValues
      );

    return {
      mean,
      median,
      standardDeviation,
      minimum,
      maximum,
    };
  }, [revenueValues]);

  /* ========================================================
     HYPOTHESIS TEST
  ======================================================== */

  const hypothesis = useMemo(() => {
    /*
     * H0:
     * Mean monthly revenue = £1,000,000
     *
     * H1:
     * Mean monthly revenue ≠ £1,000,000
     */

    const hypothesizedMean =
      1_000_000;

    const tStatistic =
      calculateTStatistic(
        revenueValues,
        hypothesizedMean
      );

    const degreesOfFreedom =
      Math.max(
        0,
        revenueValues.length - 1
      );

    const pValue =
      degreesOfFreedom > 0
        ? calculateTwoTailedPValue(
            tStatistic,
            degreesOfFreedom
          )
        : 1;

    const alpha =
      confidenceLevel === 99
        ? 0.01
        : confidenceLevel === 90
        ? 0.10
        : 0.05;

    const rejectNull =
      pValue < alpha;

    return {
      hypothesizedMean,
      tStatistic,
      pValue,
      degreesOfFreedom,
      alpha,
      rejectNull,
    };
  }, [
    revenueValues,
    confidenceLevel,
  ]);

  /* ========================================================
     CONFIDENCE INTERVAL
  ======================================================== */

  const confidenceInterval =
    useMemo(() => {
      const mean =
        statistics.mean;

      if (
        revenueValues.length <
        2
      ) {
        return {
          lower: mean,
          upper: mean,
          marginOfError: 0,
          criticalValue: 0,
        };
      }

      const standardError =
        statistics.standardDeviation /
        Math.sqrt(
          revenueValues.length
        );

      const degreesOfFreedom =
        revenueValues.length - 1;

      const criticalValue =
        getTCritical(
          confidenceLevel,
          degreesOfFreedom
        );

      const marginOfError =
        criticalValue *
        standardError;

      return {
        lower:
          mean -
          marginOfError,

        upper:
          mean +
          marginOfError,

        marginOfError,
        criticalValue,
      };
    }, [
      confidenceLevel,
      revenueValues.length,
      statistics.mean,
      statistics.standardDeviation,
    ]);

  /* ========================================================
     CHART DATA
  ======================================================== */

  const distributionData =
    useMemo(() => {
      return monthlySales.map(
        (item) => ({
          month: item.month,
          revenue: Number(
            item.revenue
          ),
          mean: statistics.mean,
        })
      );
    }, [
      monthlySales,
      statistics.mean,
    ]);

  /* ========================================================
     EMPTY STATE
  ======================================================== */

  if (
    !isImported ||
    !isCleaned ||
    !revenueValues.length
  ) {
    return (
      <div className="stats-page">
        <section className="stats-heading">
          <div>
            <div className="section-kicker">
              <span className="kicker-block">
                08
              </span>

              INFERENTIAL STATISTICS
            </div>

            <h1>
              STATISTICAL
              <br />
              <span>
                ANALYSIS.
              </span>
            </h1>

            <p>
              Import and clean a sales
              dataset to calculate
              descriptive statistics,
              confidence intervals,
              and hypothesis tests.
            </p>
          </div>
        </section>
      </div>
    );
  }

  /* ========================================================
     RENDER
  ======================================================== */

  return (
    <div className="stats-page">
      {/* ==================================================
          HEADER
      ================================================== */}

      <section className="stats-heading">
        <div>
          <div className="section-kicker">
            <span className="kicker-block">
              08
            </span>

            INFERENTIAL STATISTICS
          </div>

          <h1>
            STATISTICAL
            <br />
            <span>
              ANALYSIS.
            </span>
          </h1>

          <p>
            Examine the sales sample using
            descriptive measures, confidence
            intervals, and hypothesis testing
            to support statistical
            interpretation.
          </p>
        </div>

        <div className="stats-confidence-card">
          <div className="confidence-label">
            <Target size={18} />
            CONFIDENCE LEVEL
          </div>

          <div className="confidence-buttons">
            {[90, 95, 99].map(
              (level) => (
                <button
                  key={level}
                  type="button"
                  className={
                    confidenceLevel ===
                    level
                      ? "confidence-button active"
                      : "confidence-button"
                  }
                  onClick={() =>
                    setConfidenceLevel(
                      level
                    )
                  }
                >
                  {level}%
                </button>
              )
            )}
          </div>
        </div>
      </section>

      {/* ==================================================
          KPI CARDS
      ================================================== */}

      <section className="stats-kpi-grid">
        <article className="stats-kpi stats-kpi-purple">
          <div className="stats-kpi-top">
            <span>
              SAMPLE MEAN
            </span>

            <Sigma size={21} />
          </div>

          <strong>
            {formatCurrency(
              statistics.mean
            )}
          </strong>

          <p>
            Average monthly revenue
          </p>
        </article>

        <article className="stats-kpi stats-kpi-yellow">
          <div className="stats-kpi-top">
            <span>
              MEDIAN
            </span>

            <BarChart3 size={21} />
          </div>

          <strong>
            {formatCurrency(
              statistics.median
            )}
          </strong>

          <p>
            Middle observed value
          </p>
        </article>

        <article className="stats-kpi stats-kpi-pink">
          <div className="stats-kpi-top">
            <span>
              STD. DEVIATION
            </span>

            <FlaskConical size={21} />
          </div>

          <strong>
            {formatCurrency(
              statistics.standardDeviation
            )}
          </strong>

          <p>
            Monthly revenue
            variability
          </p>
        </article>

        <article className="stats-kpi stats-kpi-white">
          <div className="stats-kpi-top">
            <span>
              SAMPLE SIZE
            </span>

            <Target size={21} />
          </div>

          <strong>
            {revenueValues.length}
          </strong>

          <p>
            Monthly observations
          </p>
        </article>
      </section>

      {/* ==================================================
          DISTRIBUTION + DESCRIPTIVE STATISTICS
      ================================================== */}

      <section className="stats-main-grid">
        <article className="distribution-card">
          <div className="stats-card-header">
            <div>
              <span className="stats-card-kicker">
                SAMPLE DISTRIBUTION
              </span>

              <h2>
                Monthly Revenue
              </h2>
            </div>

            <div className="mean-tag">
              MEAN:{" "}
              {formatCurrency(
                statistics.mean
              )}
            </div>
          </div>

          <div className="distribution-chart">
            <ResponsiveContainer
              width="100%"
              height={370}
            >
              <BarChart
                data={
                  distributionData
                }
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
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                  axisLine={{
                    stroke: "#000",
                    strokeWidth: 2,
                  }}
                  tickLine={false}
                />

                <YAxis
                  tickFormatter={(
                    value
                  ) =>
                    `£${Math.round(
                      value / 1000
                    )}K`
                  }
                  tick={{
                    fill: "#000",
                    fontSize: 11,
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
                    value
                  ) => [
                    formatCurrency(
                      value
                    ),
                    "Revenue",
                  ]}
                  contentStyle={{
                    border:
                      "3px solid #000",
                    borderRadius:
                      "0",
                    boxShadow:
                      "5px 5px 0 #000",
                    fontWeight: 700,
                  }}
                />

                <Bar
                  dataKey="revenue"
                  fill="#bc9fdb"
                  stroke="#000"
                  strokeWidth={2}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="distribution-summary">
            <div>
              <span>
                LOWEST
              </span>

              <strong>
                {formatCurrency(
                  statistics.minimum
                )}
              </strong>
            </div>

            <div>
              <span>
                MEAN
              </span>

              <strong>
                {formatCurrency(
                  statistics.mean
                )}
              </strong>
            </div>

            <div>
              <span>
                HIGHEST
              </span>

              <strong>
                {formatCurrency(
                  statistics.maximum
                )}
              </strong>
            </div>
          </div>
        </article>

        <article className="descriptive-card">
          <div className="stats-card-kicker">
            DESCRIPTIVE STATISTICS
          </div>

          <h2>
            Data Summary
          </h2>

          <div className="descriptive-list">
            <div>
              <span>
                Mean
              </span>

              <strong>
                {formatCurrency(
                  statistics.mean
                )}
              </strong>
            </div>

            <div>
              <span>
                Median
              </span>

              <strong>
                {formatCurrency(
                  statistics.median
                )}
              </strong>
            </div>

            <div>
              <span>
                Standard Deviation
              </span>

              <strong>
                {formatCurrency(
                  statistics.standardDeviation
                )}
              </strong>
            </div>

            <div>
              <span>
                Minimum
              </span>

              <strong>
                {formatCurrency(
                  statistics.minimum
                )}
              </strong>
            </div>

            <div>
              <span>
                Maximum
              </span>

              <strong>
                {formatCurrency(
                  statistics.maximum
                )}
              </strong>
            </div>

            <div>
              <span>
                Range
              </span>

              <strong>
                {formatCurrency(
                  statistics.maximum -
                    statistics.minimum
                )}
              </strong>
            </div>
          </div>
        </article>
      </section>

      {/* ==================================================
          HYPOTHESIS TEST + CONFIDENCE INTERVAL
      ================================================== */}

      <section className="inference-grid">
        <article className="hypothesis-card">
          <div className="hypothesis-header">
            <div>
              <span className="stats-card-kicker">
                HYPOTHESIS TESTING
              </span>

              <h2>
                One-Sample t-Test
              </h2>
            </div>

            <div className="test-badge">
              α ={" "}
              {hypothesis.alpha.toFixed(
                2
              )}
            </div>
          </div>

          <div className="hypothesis-box">
            <div className="hypothesis-row">
              <span>
                NULL HYPOTHESIS — H₀
              </span>

              <strong>
                μ ={" "}
                {formatCurrency(
                  hypothesis.hypothesizedMean
                )}
              </strong>
            </div>

            <div className="hypothesis-row">
              <span>
                ALTERNATIVE — H₁
              </span>

              <strong>
                μ ≠{" "}
                {formatCurrency(
                  hypothesis.hypothesizedMean
                )}
              </strong>
            </div>
          </div>

          <div className="test-results">
            <div className="test-result">
              <span>
                T-STATISTIC
              </span>

              <strong>
                {hypothesis.tStatistic.toFixed(
                  3
                )}
              </strong>
            </div>

            <div className="test-result">
              <span>
                P-VALUE
              </span>

              <strong>
                {hypothesis.pValue.toFixed(
                  4
                )}
              </strong>
            </div>

            <div className="test-result">
              <span>
                DEGREES OF FREEDOM
              </span>

              <strong>
                {hypothesis.degreesOfFreedom}
              </strong>
            </div>
          </div>

          <div
            className={
              hypothesis.rejectNull
                ? "hypothesis-result reject"
                : "hypothesis-result retain"
            }
          >
            {hypothesis.rejectNull ? (
              <XCircle size={24} />
            ) : (
              <CheckCircle2 size={24} />
            )}

            <div>
              <strong>
                {hypothesis.rejectNull
                  ? "REJECT H₀"
                  : "DO NOT REJECT H₀"}
              </strong>

              <p>
                {hypothesis.rejectNull
                  ? `The sample provides statistical evidence that the mean monthly revenue differs from ${formatCurrency(
                      hypothesis.hypothesizedMean
                    )} at the selected significance level.`
                  : `The sample does not provide sufficient statistical evidence that the mean monthly revenue differs from ${formatCurrency(
                      hypothesis.hypothesizedMean
                    )} at the selected significance level.`}
              </p>
            </div>
          </div>
        </article>

        <article className="confidence-card">
          <div className="stats-card-kicker">
            ESTIMATION
          </div>

          <h2>
            {confidenceLevel}%
            Confidence Interval
          </h2>

          <p className="confidence-description">
            Estimated interval for the
            population mean based on the
            observed monthly revenue sample.
          </p>

          <div className="confidence-range">
            <div className="range-value">
              <span>
                LOWER BOUND
              </span>

              <strong>
                {formatCurrency(
                  confidenceInterval.lower
                )}
              </strong>
            </div>

            <div className="range-line">
              <div className="range-marker left" />
              <div className="range-bar" />
              <div className="range-marker right" />
            </div>

            <div className="range-value">
              <span>
                UPPER BOUND
              </span>

              <strong>
                {formatCurrency(
                  confidenceInterval.upper
                )}
              </strong>
            </div>
          </div>

          <div className="margin-box">
            <span>
              MARGIN OF ERROR
            </span>

            <strong>
              ±
              {formatCurrency(
                confidenceInterval.marginOfError
              )}
            </strong>
          </div>
        </article>
      </section>

      {/* ==================================================
          INTERPRETATION
      ================================================== */}

      <section className="stat-interpretation">
        <div className="interpretation-number">
          02
        </div>

        <div>
          <span className="stats-card-kicker">
            STATISTICAL INTERPRETATION
          </span>

          <h2>
            What do the results tell us?
          </h2>

          <p>
            The historical dataset contains{" "}
            <strong>
              {revenueValues.length}
            </strong>{" "}
            monthly observations with an
            average revenue of{" "}
            <strong>
              {formatCurrency(
                statistics.mean
              )}
            </strong>
            .
          </p>

          <p>
            The standard deviation of{" "}
            <strong>
              {formatCurrency(
                statistics.standardDeviation
              )}
            </strong>{" "}
            indicates the amount of variation
            observed around the sample mean.
          </p>

          <p>
            At the selected{" "}
            {confidenceLevel}% confidence
            level, the estimated population
            mean falls between{" "}
            <strong>
              {formatCurrency(
                confidenceInterval.lower
              )}
            </strong>{" "}
            and{" "}
            <strong>
              {formatCurrency(
                confidenceInterval.upper
              )}
            </strong>
            .
          </p>
        </div>
      </section>

      {/* ==================================================
          NOTE
      ================================================== */}

      <section className="stats-note">
        <Info size={20} />

        <div>
          <strong>
            STATISTICAL ANALYSIS NOTE
          </strong>

          <p>
            This analysis uses the cleaned
            historical sales dataset and
            applies descriptive statistics,
            a one-sample Student's t-test,
            and confidence-interval
            estimation to the monthly revenue
            observations. The hypothesis-test
            result depends on the stated
            hypothesized mean and significance
            level.
          </p>
        </div>
      </section>
    </div>
  );
}

export default StatisticalAnalysis;