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
import { monthlySales } from "../data/salesData";

function formatCurrency(value) {
  return `₱${Math.round(value).toLocaleString("en-PH")}`;
}

function calculateMean(values) {
  if (!values.length) return 0;

  return (
    values.reduce((sum, value) => sum + value, 0) /
    values.length
  );
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

function calculateStandardDeviation(values) {
  if (values.length < 2) return 0;

  const mean = calculateMean(values);

  const variance =
    values.reduce(
      (sum, value) => sum + (value - mean) ** 2,
      0
    ) / (values.length - 1);

  return Math.sqrt(variance);
}

function calculateTStatistic(sample, hypothesizedMean) {
  const mean = calculateMean(sample);
  const standardDeviation = calculateStandardDeviation(sample);

  if (standardDeviation === 0 || sample.length === 0) {
    return 0;
  }

  return (
    (mean - hypothesizedMean) /
    (standardDeviation / Math.sqrt(sample.length))
  );
}

function getApproximatePValue(tValue) {
  /*
   * This is intentionally a lightweight approximation for the
   * frontend demonstration. A production statistical backend
   * should calculate the exact t-distribution p-value.
   */
  const absoluteT = Math.abs(tValue);

  if (absoluteT >= 3.5) return 0.001;
  if (absoluteT >= 3.0) return 0.003;
  if (absoluteT >= 2.8) return 0.006;
  if (absoluteT >= 2.5) return 0.015;
  if (absoluteT >= 2.2) return 0.03;
  if (absoluteT >= 2.0) return 0.05;
  if (absoluteT >= 1.8) return 0.08;
  if (absoluteT >= 1.5) return 0.15;

  return 0.25;
}

function StatisticalAnalysis() {
  const [confidenceLevel, setConfidenceLevel] = useState(95);

  const revenueValues = useMemo(
    () => monthlySales.map((item) => item.revenue),
    []
  );

  const statistics = useMemo(() => {
    const mean = calculateMean(revenueValues);
    const median = calculateMedian(revenueValues);
    const standardDeviation =
      calculateStandardDeviation(revenueValues);

    const minimum = Math.min(...revenueValues);
    const maximum = Math.max(...revenueValues);

    return {
      mean,
      median,
      standardDeviation,
      minimum,
      maximum,
    };
  }, [revenueValues]);

  const hypothesis = useMemo(() => {
    /*
     * Example hypothesis:
     *
     * H0: Mean monthly revenue = ₱100,000
     * H1: Mean monthly revenue ≠ ₱100,000
     *
     * This demonstrates a one-sample t-test using the
     * historical monthly revenue sample.
     */
    const hypothesizedMean = 100000;

    const tStatistic = calculateTStatistic(
      revenueValues,
      hypothesizedMean
    );

    const pValue = getApproximatePValue(tStatistic);

    const alpha = confidenceLevel === 99 ? 0.01 : 0.05;

    const rejectNull = pValue < alpha;

    return {
      hypothesizedMean,
      tStatistic,
      pValue,
      alpha,
      rejectNull,
    };
  }, [revenueValues, confidenceLevel]);

  const confidenceInterval = useMemo(() => {
    const mean = statistics.mean;
    const standardError =
      statistics.standardDeviation /
      Math.sqrt(revenueValues.length);

    /*
     * Approximate critical values:
     * 90% = 1.645
     * 95% = 1.96
     * 99% = 2.576
     */
    const criticalValue =
      confidenceLevel === 99
        ? 2.576
        : confidenceLevel === 95
        ? 1.96
        : 1.645;

    const marginOfError =
      criticalValue * standardError;

    return {
      lower: mean - marginOfError,
      upper: mean + marginOfError,
      marginOfError,
    };
  }, [
    confidenceLevel,
    revenueValues.length,
    statistics.mean,
    statistics.standardDeviation,
  ]);

  const distributionData = useMemo(() => {
    return monthlySales.map((item) => ({
      month: item.month,
      revenue: item.revenue,
      mean: statistics.mean,
    }));
  }, [statistics.mean]);

  return (
    <div className="stats-page">
      <section className="stats-heading">
        <div>
          <div className="section-kicker">
            <span className="kicker-block">08</span>
            INFERENTIAL STATISTICS
          </div>

          <h1>
            STATISTICAL
            <br />
            <span>ANALYSIS.</span>
          </h1>

          <p>
            Examine the sales sample using descriptive measures,
            confidence intervals, and hypothesis testing to
            support statistical interpretation.
          </p>
        </div>

        <div className="stats-confidence-card">
          <div className="confidence-label">
            <Target size={18} />
            CONFIDENCE LEVEL
          </div>

          <div className="confidence-buttons">
            {[90, 95, 99].map((level) => (
              <button
                key={level}
                type="button"
                className={
                  confidenceLevel === level
                    ? "confidence-button active"
                    : "confidence-button"
                }
                onClick={() => setConfidenceLevel(level)}
              >
                {level}%
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="stats-kpi-grid">
        <article className="stats-kpi stats-kpi-purple">
          <div className="stats-kpi-top">
            <span>SAMPLE MEAN</span>
            <Sigma size={21} />
          </div>

          <strong>
            {formatCurrency(statistics.mean)}
          </strong>

          <p>Average monthly revenue</p>
        </article>

        <article className="stats-kpi stats-kpi-yellow">
          <div className="stats-kpi-top">
            <span>MEDIAN</span>
            <BarChart3 size={21} />
          </div>

          <strong>
            {formatCurrency(statistics.median)}
          </strong>

          <p>Middle observed value</p>
        </article>

        <article className="stats-kpi stats-kpi-pink">
          <div className="stats-kpi-top">
            <span>STD. DEVIATION</span>
            <FlaskConical size={21} />
          </div>

          <strong>
            {formatCurrency(statistics.standardDeviation)}
          </strong>

          <p>Monthly revenue variability</p>
        </article>

        <article className="stats-kpi stats-kpi-white">
          <div className="stats-kpi-top">
            <span>SAMPLE SIZE</span>
            <Target size={21} />
          </div>

          <strong>{revenueValues.length}</strong>

          <p>Monthly observations</p>
        </article>
      </section>

      <section className="stats-main-grid">
        <article className="distribution-card">
          <div className="stats-card-header">
            <div>
              <span className="stats-card-kicker">
                SAMPLE DISTRIBUTION
              </span>

              <h2>Monthly Revenue</h2>
            </div>

            <div className="mean-tag">
              MEAN: {formatCurrency(statistics.mean)}
            </div>
          </div>

          <div className="distribution-chart">
            <ResponsiveContainer width="100%" height={370}>
              <BarChart
                data={distributionData}
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
                  tickFormatter={(value) =>
                    `₱${Math.round(value / 1000)}K`
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
                  formatter={(value) => [
                    formatCurrency(value),
                    "Revenue",
                  ]}
                  contentStyle={{
                    border: "3px solid #000",
                    borderRadius: "0",
                    boxShadow: "5px 5px 0 #000",
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
              <span>LOWEST</span>
              <strong>
                {formatCurrency(statistics.minimum)}
              </strong>
            </div>

            <div>
              <span>MEAN</span>
              <strong>
                {formatCurrency(statistics.mean)}
              </strong>
            </div>

            <div>
              <span>HIGHEST</span>
              <strong>
                {formatCurrency(statistics.maximum)}
              </strong>
            </div>
          </div>
        </article>

        <article className="descriptive-card">
          <div className="stats-card-kicker">
            DESCRIPTIVE STATISTICS
          </div>

          <h2>Data Summary</h2>

          <div className="descriptive-list">
            <div>
              <span>Mean</span>
              <strong>
                {formatCurrency(statistics.mean)}
              </strong>
            </div>

            <div>
              <span>Median</span>
              <strong>
                {formatCurrency(statistics.median)}
              </strong>
            </div>

            <div>
              <span>Standard Deviation</span>
              <strong>
                {formatCurrency(statistics.standardDeviation)}
              </strong>
            </div>

            <div>
              <span>Minimum</span>
              <strong>
                {formatCurrency(statistics.minimum)}
              </strong>
            </div>

            <div>
              <span>Maximum</span>
              <strong>
                {formatCurrency(statistics.maximum)}
              </strong>
            </div>

            <div>
              <span>Range</span>
              <strong>
                {formatCurrency(
                  statistics.maximum - statistics.minimum
                )}
              </strong>
            </div>
          </div>
        </article>
      </section>

      <section className="inference-grid">
        <article className="hypothesis-card">
          <div className="hypothesis-header">
            <div>
              <span className="stats-card-kicker">
                HYPOTHESIS TESTING
              </span>

              <h2>One-Sample t-Test</h2>
            </div>

            <div className="test-badge">
              α = {hypothesis.alpha}
            </div>
          </div>

          <div className="hypothesis-box">
            <div className="hypothesis-row">
              <span>NULL HYPOTHESIS — H₀</span>

              <strong>
                μ = {formatCurrency(hypothesis.hypothesizedMean)}
              </strong>
            </div>

            <div className="hypothesis-row">
              <span>ALTERNATIVE — H₁</span>

              <strong>
                μ ≠ {formatCurrency(hypothesis.hypothesizedMean)}
              </strong>
            </div>
          </div>

          <div className="test-results">
            <div className="test-result">
              <span>T-STATISTIC</span>

              <strong>
                {hypothesis.tStatistic.toFixed(3)}
              </strong>
            </div>

            <div className="test-result">
              <span>APPROX. P-VALUE</span>

              <strong>
                {hypothesis.pValue.toFixed(3)}
              </strong>
            </div>

            <div className="test-result">
              <span>ALPHA</span>

              <strong>
                {hypothesis.alpha.toFixed(2)}
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
                  ? "The sample provides statistical evidence that the mean monthly revenue differs from the hypothesized value."
                  : "The sample does not provide sufficient statistical evidence that the mean monthly revenue differs from the hypothesized value."}
              </p>
            </div>
          </div>
        </article>

        <article className="confidence-card">
          <div className="stats-card-kicker">
            ESTIMATION
          </div>

          <h2>
            {confidenceLevel}% Confidence Interval
          </h2>

          <p className="confidence-description">
            Estimated interval containing the population mean
            based on the observed monthly revenue sample.
          </p>

          <div className="confidence-range">
            <div className="range-value">
              <span>LOWER BOUND</span>

              <strong>
                {formatCurrency(confidenceInterval.lower)}
              </strong>
            </div>

            <div className="range-line">
              <div className="range-marker left" />
              <div className="range-bar" />
              <div className="range-marker right" />
            </div>

            <div className="range-value">
              <span>UPPER BOUND</span>

              <strong>
                {formatCurrency(confidenceInterval.upper)}
              </strong>
            </div>
          </div>

          <div className="margin-box">
            <span>MARGIN OF ERROR</span>

            <strong>
              ±{formatCurrency(confidenceInterval.marginOfError)}
            </strong>
          </div>
        </article>
      </section>

      <section className="stat-interpretation">
        <div className="interpretation-number">02</div>

        <div>
          <span className="stats-card-kicker">
            STATISTICAL INTERPRETATION
          </span>

          <h2>What do the results tell us?</h2>

          <p>
            The historical dataset contains{" "}
            <strong>{revenueValues.length}</strong> monthly
            observations with an average revenue of{" "}
            <strong>
              {formatCurrency(statistics.mean)}
            </strong>
            .
          </p>

          <p>
            The standard deviation of{" "}
            <strong>
              {formatCurrency(statistics.standardDeviation)}
            </strong>{" "}
            indicates the amount of variation observed around
            the sample mean.
          </p>

          <p>
            At the selected {confidenceLevel}% confidence level,
            the estimated population mean falls between{" "}
            <strong>
              {formatCurrency(confidenceInterval.lower)}
            </strong>{" "}
            and{" "}
            <strong>
              {formatCurrency(confidenceInterval.upper)}
            </strong>
            .
          </p>
        </div>
      </section>

      <section className="stats-note">
        <Info size={20} />

        <div>
          <strong>STATISTICAL ANALYSIS NOTE</strong>

          <p>
            This page demonstrates inferential-statistics
            concepts using the current historical sales dataset.
            For production deployment, exact probability
            distributions and statistical tests should be
            calculated using a dedicated statistical backend or
            validated statistical library.
          </p>
        </div>
      </section>
    </div>
  );
}

export default StatisticalAnalysis;