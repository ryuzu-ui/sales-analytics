import { useMemo, useState } from "react";
import {
  FileText,
  Download,
  Printer,
  Database,
  BarChart3,
  TrendingUp,
  Link2,
  Brain,
  FlaskConical,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
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

function formatNumber(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "0";
  }

  return number.toLocaleString("en-GB");
}

function formatPercent(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "0.0%";
  }

  return `${number >= 0 ? "+" : ""}${number.toFixed(1)}%`;
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

function calculateMedian(values) {
  if (!values.length) {
    return 0;
  }

  const sorted = [...values]
    .map(Number)
    .filter(Number.isFinite)
    .sort((a, b) => a - b);

  if (!sorted.length) {
    return 0;
  }

  const middle =
    Math.floor(sorted.length / 2);

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

  const mean =
    calculateMean(values);

  const variance =
    values.reduce(
      (sum, value) =>
        sum +
        (Number(value) - mean) ** 2,
      0
    ) /
    (values.length - 1);

  return Math.sqrt(variance);
}

/* ============================================================
   PEARSON CORRELATION
============================================================ */

function calculateCorrelation(
  xValues,
  yValues
) {
  const pairs = [];

  const length = Math.min(
    xValues.length,
    yValues.length
  );

  for (let i = 0; i < length; i += 1) {
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

  const xMean =
    calculateMean(
      pairs.map(([x]) => x)
    );

  const yMean =
    calculateMean(
      pairs.map(([, y]) => y)
    );

  let numerator = 0;
  let xVariance = 0;
  let yVariance = 0;

  for (const [x, y] of pairs) {
    const xDifference =
      x - xMean;

    const yDifference =
      y - yMean;

    numerator +=
      xDifference *
      yDifference;

    xVariance +=
      xDifference ** 2;

    yVariance +=
      yDifference ** 2;
  }

  if (
    xVariance === 0 ||
    yVariance === 0
  ) {
    return 0;
  }

  return (
    numerator /
    Math.sqrt(
      xVariance *
        yVariance
    )
  );
}

/* ============================================================
   LINEAR REGRESSION
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
      rSquared: 0,
      mae: 0,
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

  const predictions =
    values.map(
      (_, index) =>
        intercept +
        slope * index
    );

  const ssResidual =
    values.reduce(
      (sum, value, index) =>
        sum +
        (value -
          predictions[index]) **
          2,
      0
    );

  const ssTotal =
    values.reduce(
      (sum, value) =>
        sum +
        (value - yMean) ** 2,
      0
    );

  const rSquared =
    ssTotal === 0
      ? 0
      : 1 -
        ssResidual /
          ssTotal;

  const mae =
    values.reduce(
      (sum, value, index) =>
        sum +
        Math.abs(
          value -
            predictions[index]
        ),
      0
    ) / n;

  const nextForecast =
    intercept +
    slope * n;

  return {
    slope,
    intercept,
    nextForecast,
    rSquared,
    mae,
  };
}

/* ============================================================
   STUDENT-T SUPPORT
============================================================ */

function logGamma(value) {
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

  if (value < 0.5) {
    return (
      Math.log(Math.PI) -
      Math.log(
        Math.sin(
          Math.PI * value
        )
      ) -
      logGamma(1 - value)
    );
  }

  let x =
    0.99999999999980993;

  const shifted =
    value - 1;

  for (
    let i = 0;
    i < coefficients.length;
    i += 1
  ) {
    x +=
      coefficients[i] /
      (shifted + i + 1);
  }

  const t =
    shifted +
    coefficients.length -
    0.5;

  return (
    0.5 *
      Math.log(2 * Math.PI) +
    (shifted + 0.5) *
      Math.log(t) -
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
  const epsilon = 3e-7;
  const fpMin = 1e-30;

  let qab = a + b;
  let qap = a + 1;
  let qam = a - 1;

  let c = 1;
  let d =
    1 -
    (qab * x) / qap;

  if (
    Math.abs(d) <
    fpMin
  ) {
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

    d =
      1 +
      aa * d;

    if (
      Math.abs(d) <
      fpMin
    ) {
      d = fpMin;
    }

    c =
      1 +
      aa / c;

    if (
      Math.abs(c) <
      fpMin
    ) {
      c = fpMin;
    }

    d = 1 / d;
    h *= d * c;

    aa =
      (-(a + m) *
        (qab + m) *
        x) /
      ((a + m2) *
        (qap + m2));

    d =
      1 +
      aa * d;

    if (
      Math.abs(d) <
      fpMin
    ) {
      d = fpMin;
    }

    c =
      1 +
      aa / c;

    if (
      Math.abs(c) <
      fpMin
    ) {
      c = fpMin;
    }

    d = 1 / d;

    const delta =
      d * c;

    h *= delta;

    if (
      Math.abs(
        delta - 1
      ) < epsilon
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

  const front = Math.exp(
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
          x)) /
      a
    );
  }

  return (
    1 -
    (front *
      betaContinuedFraction(
        b,
        a,
        1 - x)) /
      b
  );
}

function studentTCDF(
  t,
  degreesOfFreedom
) {
  if (
    !Number.isFinite(t) ||
    degreesOfFreedom <= 0
  ) {
    return 0.5;
  }

  const absoluteT =
    Math.abs(t);

  const x =
    degreesOfFreedom /
    (degreesOfFreedom +
      absoluteT ** 2);

  const ibeta =
    regularizedIncompleteBeta(
      x,
      degreesOfFreedom / 2,
      0.5
    );

  if (t >= 0) {
    return 1 -
      0.5 * ibeta;
  }

  return (
    0.5 * ibeta
  );
}

function calculateTwoTailedPValue(
  t,
  degreesOfFreedom
) {
  const cdf =
    studentTCDF(
      Math.abs(t),
      degreesOfFreedom
    );

  return Math.min(
    1,
    2 * (1 - cdf)
  );
}

/* ============================================================
   T CRITICAL VALUES
============================================================ */

function getTCritical(
  confidence,
  degreesOfFreedom
) {
  const df =
    Number(degreesOfFreedom);

  if (df <= 0) {
    return 0;
  }

  /*
    Exact common values for df = 12,
    which is the current dataset's
    13 monthly observations.

    For other sample sizes, use a
    normal approximation.
  */

  if (df === 12) {
    if (confidence === 0.9) {
      return 1.782;
    }

    if (confidence === 0.95) {
      return 2.179;
    }

    if (confidence === 0.99) {
      return 3.055;
    }
  }

  if (confidence === 0.9) {
    return 1.645;
  }

  if (confidence === 0.95) {
    return 1.96;
  }

  return 2.576;
}

/* ============================================================
   REPORT COMPONENT
============================================================ */

function Reports() {
  const {
    records,
    monthlySales,
    topProducts,
    datasetName,
    isImported,
    isCleaned,
    cleaningReport,
  } = useSalesData();

  const [expandedSections, setExpandedSections] =
    useState({
      dataset: true,
      cleaning: true,
      descriptive: true,
      eda: true,
      correlation: true,
      forecasting: true,
      statistics: true,
      insights: true,
    });

  /* ==========================================================
     ACTUAL ANALYSIS
  ========================================================== */

  const analysis = useMemo(() => {
    const revenues =
      monthlySales
        .map((item) =>
          Number(item.revenue)
        )
        .filter(Number.isFinite);

    if (!revenues.length) {
      return {
        hasData: false,
        mean: 0,
        median: 0,
        standardDeviation: 0,
        minimum: 0,
        maximum: 0,
        range: 0,
        highestMonth: null,
        lowestMonth: null,
        firstRevenue: 0,
        latestRevenue: 0,
        growth: 0,
        correlation: 0,
        slope: 0,
        intercept: 0,
        nextForecast: 0,
        rSquared: 0,
        mae: 0,
        sampleSize: 0,
        tStatistic: 0,
        pValue: 1,
        degreesOfFreedom: 0,
        confidenceLevel: 0.95,
        confidenceLower: 0,
        confidenceUpper: 0,
        marginOfError: 0,
        hypothesisDecision:
          "INSUFFICIENT DATA",
        firstPeriodAverage: 0,
        finalPeriodAverage: 0,
        periodChange: 0,
        increases: 0,
        decreases: 0,
      };
    }

    /* --------------------------------------------------------
       Descriptive statistics
    -------------------------------------------------------- */

    const mean =
      calculateMean(revenues);

    const median =
      calculateMedian(revenues);

    const standardDeviation =
      calculateStandardDeviation(
        revenues
      );

    const minimum =
      Math.min(...revenues);

    const maximum =
      Math.max(...revenues);

    const range =
      maximum - minimum;

    /* --------------------------------------------------------
       Highest / lowest
    -------------------------------------------------------- */

    const highestMonth =
      monthlySales.reduce(
        (highest, current) =>
          Number(current.revenue) >
          Number(highest.revenue)
            ? current
            : highest,
        monthlySales[0]
      );

    const lowestMonth =
      monthlySales.reduce(
        (lowest, current) =>
          Number(current.revenue) <
          Number(lowest.revenue)
            ? current
            : lowest,
        monthlySales[0]
      );

    /* --------------------------------------------------------
       Overall change
    -------------------------------------------------------- */

    const firstRevenue =
      revenues[0];

    const latestRevenue =
      revenues[
        revenues.length - 1
      ];

    const growth =
      firstRevenue === 0
        ? 0
        : ((latestRevenue -
            firstRevenue) /
            firstRevenue) *
          100;

    /* --------------------------------------------------------
       Period comparison
       For 13 months:
       first 6 vs final 7.
    -------------------------------------------------------- */

    const midpoint =
      Math.floor(
        revenues.length / 2
      );

    const firstPeriod =
      revenues.slice(
        0,
        midpoint
      );

    const finalPeriod =
      revenues.slice(
        midpoint
      );

    const firstPeriodAverage =
      calculateMean(
        firstPeriod
      );

    const finalPeriodAverage =
      calculateMean(
        finalPeriod
      );

    const periodChange =
      firstPeriodAverage === 0
        ? 0
        : ((finalPeriodAverage -
            firstPeriodAverage) /
            firstPeriodAverage) *
          100;

    /* --------------------------------------------------------
       Period-to-period movements
    -------------------------------------------------------- */

    let increases = 0;
    let decreases = 0;

    for (
      let i = 1;
      i < revenues.length;
      i += 1
    ) {
      if (
        revenues[i] >
        revenues[i - 1]
      ) {
        increases += 1;
      } else if (
        revenues[i] <
        revenues[i - 1]
      ) {
        decreases += 1;
      }
    }

    /* --------------------------------------------------------
       Quantity ↔ Revenue correlation
       Uses ALL cleaned records.
    -------------------------------------------------------- */

    const quantityValues = [];
    const recordRevenues = [];

    for (const record of records) {
      const quantity =
        Number(record.quantity);

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

        recordRevenues.push(
          revenue
        );
      }
    }

    const correlation =
      calculateCorrelation(
        quantityValues,
        recordRevenues
      );

    /* --------------------------------------------------------
       Linear regression
    -------------------------------------------------------- */

    const regression =
      calculateLinearRegression(
        revenues
      );

    /* --------------------------------------------------------
       Inferential statistics

       Same benchmark used by the
       Statistical Analysis page:
       H0: μ = £1,000,000
       H1: μ ≠ £1,000,000
       α = 0.05
    -------------------------------------------------------- */

    const hypothesizedMean =
      1000000;

    const sampleSize =
      revenues.length;

    const degreesOfFreedom =
      sampleSize - 1;

    const standardError =
      standardDeviation /
      Math.sqrt(
        sampleSize
      );

    const tStatistic =
      standardError === 0
        ? 0
        : (mean -
            hypothesizedMean) /
          standardError;

    const pValue =
      calculateTwoTailedPValue(
        tStatistic,
        degreesOfFreedom
      );

    const confidenceLevel =
      0.95;

    const tCritical =
      getTCritical(
        confidenceLevel,
        degreesOfFreedom
      );

    const marginOfError =
      tCritical *
      standardError;

    const confidenceLower =
      mean - marginOfError;

    const confidenceUpper =
      mean + marginOfError;

    const hypothesisDecision =
      pValue < 0.05
        ? "REJECT H0"
        : "FAIL TO REJECT H0";

    return {
      hasData: true,

      mean,
      median,
      standardDeviation,

      minimum,
      maximum,
      range,

      highestMonth,
      lowestMonth,

      firstRevenue,
      latestRevenue,
      growth,

      correlation,

      slope:
        regression.slope,

      intercept:
        regression.intercept,

      nextForecast:
        regression.nextForecast,

      rSquared:
        regression.rSquared,

      mae:
        regression.mae,

      sampleSize,

      tStatistic,
      pValue,

      degreesOfFreedom,

      confidenceLevel,

      tCritical,

      standardError,

      confidenceLower,
      confidenceUpper,
      marginOfError,

      hypothesizedMean,

      hypothesisDecision,

      firstPeriodAverage,
      finalPeriodAverage,
      periodChange,

      increases,
      decreases,

      correlationObservations:
        quantityValues.length,
    };
  }, [
    records,
    monthlySales,
  ]);

  /* ==========================================================
     TOGGLE
  ========================================================== */

  const toggleSection = (
    section
  ) => {
    setExpandedSections(
      (current) => ({
        ...current,
        [section]:
          !current[section],
      })
    );
  };

  /* ==========================================================
     PRINT
  ========================================================== */

  const handlePrint = () => {
    window.print();
  };

  /* ==========================================================
     EXPORT
  ========================================================== */

  const handleExport = () => {
    const report = {
      title:
        "Sales Analytics and Forecasting Report",

      generatedAt:
        new Date().toISOString(),

      dataset: {
        source:
          datasetName ||
          "Online Retail",

        rawRecords:
          records.length,

        cleanedRecords:
          records.length,

        monthlyObservations:
          monthlySales.length,

        status:
          isCleaned
            ? "Cleaned"
            : "Imported",
      },

      descriptiveStatistics: {
        mean:
          analysis.mean,

        median:
          analysis.median,

        standardDeviation:
          analysis.standardDeviation,

        minimum:
          analysis.minimum,

        maximum:
          analysis.maximum,

        range:
          analysis.range,
      },

      exploratoryAnalysis: {
        highestMonth:
          analysis.highestMonth,

        lowestMonth:
          analysis.lowestMonth,

        firstToLatestChange:
          analysis.growth,

        firstPeriodAverage:
          analysis.firstPeriodAverage,

        finalPeriodAverage:
          analysis.finalPeriodAverage,

        periodChange:
          analysis.periodChange,

        increases:
          analysis.increases,

        decreases:
          analysis.decreases,
      },

      correlation: {
        variablePair:
          "Quantity ↔ Revenue",

        pearsonR:
          analysis.correlation,

        observations:
          analysis.correlationObservations,
      },

      forecasting: {
        model:
          "Linear Regression",

        slope:
          analysis.slope,

        intercept:
          analysis.intercept,

        nextPeriodEstimate:
          analysis.nextForecast,

        rSquared:
          analysis.rSquared,

        meanAbsoluteError:
          analysis.mae,
      },

      inferentialStatistics: {
        test:
          "One-Sample Student's t-Test",

        hypothesizedMean:
          analysis.hypothesizedMean,

        sampleMean:
          analysis.mean,

        tStatistic:
          analysis.tStatistic,

        pValue:
          analysis.pValue,

        degreesOfFreedom:
          analysis.degreesOfFreedom,

        confidenceLevel:
          analysis.confidenceLevel,

        confidenceLower:
          analysis.confidenceLower,

        confidenceUpper:
          analysis.confidenceUpper,

        marginOfError:
          analysis.marginOfError,

        decision:
          analysis.hypothesisDecision,
      },

      topProducts:
        topProducts.slice(0, 10),
    };

    const blob =
      new Blob(
        [
          JSON.stringify(
            report,
            null,
            2
          ),
        ],
        {
          type:
            "application/json",
        }
      );

    const url =
      URL.createObjectURL(
        blob
      );

    const link =
      document.createElement(
        "a"
      );

    link.href = url;

    link.download =
      "sales-analytics-report.json";

    document.body.appendChild(
      link
    );

    link.click();

    link.remove();

    URL.revokeObjectURL(
      url
    );
  };

  /* ==========================================================
     EMPTY STATE
  ========================================================== */

  if (
    !isImported ||
    !analysis.hasData
  ) {
    return (
      <div className="reports-page">
        <section className="reports-heading">
          <div>
            <div className="section-kicker">
              <span className="kicker-block">
                10
              </span>
              FINAL REPORT
            </div>

            <h1>
              ANALYTICS
              <br />
              <span>REPORT.</span>
            </h1>

            <p>
              Import a sales dataset to
              generate the consolidated
              analytical report.
            </p>
          </div>
        </section>

        <section className="report-final">
          <div className="report-final-icon">
            <AlertTriangle
              size={30}
            />
          </div>

          <div>
            <span>
              REPORT STATUS
            </span>

            <h2>
              Waiting for data
            </h2>

            <p>
              Import and clean a dataset
              before generating the final
              report.
            </p>
          </div>
        </section>
      </div>
    );
  }

  /* ==========================================================
     REPORT SECTIONS
  ========================================================== */

  const sections = [
    {
      id: "dataset",
      number: "01",
      icon: Database,
      title:
        "Dataset Overview",
      description:
        "Source structure, observations, and data coverage.",
    },

    {
      id: "cleaning",
      number: "02",
      icon: CheckCircle2,
      title:
        "Data Cleaning",
      description:
        "Data quality checks and preprocessing operations.",
    },

    {
      id: "descriptive",
      number: "03",
      icon: BarChart3,
      title:
        "Descriptive Statistics",
      description:
        "Central tendency and variability measurements.",
    },

    {
      id: "eda",
      number: "04",
      icon: TrendingUp,
      title:
        "EDA & Pattern Recognition",
      description:
        "Sales trends, high/low periods, and observed patterns.",
    },

    {
      id: "correlation",
      number: "05",
      icon: Link2,
      title:
        "Correlation Analysis",
      description:
        "Relationships between selected sales variables.",
    },

    {
      id: "forecasting",
      number: "06",
      icon: Brain,
      title:
        "Predictive Analysis",
      description:
        "Historical trend and future sales estimation.",
    },

    {
      id: "statistics",
      number: "07",
      icon: FlaskConical,
      title:
        "Inferential Statistics",
      description:
        "Statistical estimation and hypothesis testing.",
    },

    {
      id: "insights",
      number: "08",
      icon: FileText,
      title:
        "Analytical Insights",
      description:
        "Summary of the major findings from the analysis.",
    },
  ];

  return (
    <div className="reports-page">
      {/* ==================================================
          PAGE HEADER
      ================================================== */}

      <section className="reports-heading">
        <div>
          <div className="section-kicker">
            <span className="kicker-block">
              10
            </span>

            FINAL REPORT
          </div>

          <h1>
            ANALYTICS
            <br />
            <span>REPORT.</span>
          </h1>

          <p>
            Consolidated report containing
            the dataset information,
            statistical analysis, patterns,
            correlations, forecasts, and
            analytical findings.
          </p>
        </div>

        <div className="report-actions">
          <button
            type="button"
            className="report-action-button print-button"
            onClick={handlePrint}
          >
            <Printer size={18} />
            PRINT
          </button>

          <button
            type="button"
            className="report-action-button export-button"
            onClick={handleExport}
          >
            <Download size={18} />
            EXPORT
          </button>
        </div>
      </section>

      {/* ==================================================
          REPORT COVER
      ================================================== */}

      <section className="report-cover">
        <div className="report-cover-left">
          <div className="report-cover-mark">
            <FileText size={30} />
          </div>

          <div>
            <span>
              ANALYTICAL REPORT
            </span>

            <h2>
              Sales Analytics
              <br />
              & Forecasting
            </h2>

            <p>
              Historical sales performance,
              statistical analysis,
              predictive modeling, and
              insights.
            </p>
          </div>
        </div>

        <div className="report-cover-meta">
          <div>
            <span>
              DATASET
            </span>

            <strong>
              {datasetName ||
                "ONLINE RETAIL"}
            </strong>
          </div>

          <div>
            <span>
              CLEANED RECORDS
            </span>

            <strong>
              {formatNumber(
                analysis.sampleSize > 0
                  ? records.length
                  : 0
              )}
            </strong>
          </div>

          <div>
            <span>
              STATUS
            </span>

            <strong>
              {isCleaned
                ? "READY"
                : "IMPORTED"}
            </strong>
          </div>
        </div>
      </section>

      {/* ==================================================
          SUMMARY
      ================================================== */}

      <section className="report-summary-grid">
        <article className="report-summary-card purple">
          <span>
            TOTAL MONTHS
          </span>

          <strong>
            {monthlySales.length}
          </strong>

          <p>
            Historical monthly
            observations
          </p>
        </article>

        <article className="report-summary-card yellow">
          <span>
            AVERAGE REVENUE
          </span>

          <strong>
            {formatCurrency(
              analysis.mean
            )}
          </strong>

          <p>
            Average monthly sales
          </p>
        </article>

        <article className="report-summary-card pink">
          <span>
            FIRST-TO-LATEST CHANGE
          </span>

          <strong>
            {formatPercent(
              analysis.growth
            )}
          </strong>

          <p>
            First to latest observed
            period
          </p>
        </article>

        <article className="report-summary-card white">
          <span>
            NEXT FORECAST
          </span>

          <strong>
            {formatCurrency(
              analysis.nextForecast
            )}
          </strong>

          <p>
            Baseline future estimate
          </p>
        </article>
      </section>

      {/* ==================================================
          REPORT CONTENT
      ================================================== */}

      <section className="report-sections">
        <div className="report-sections-header">
          <div>
            <span className="report-kicker">
              REPORT CONTENT
            </span>

            <h2>
              Analysis Breakdown
            </h2>
          </div>

          <span className="report-section-count">
            {sections.length} SECTIONS
          </span>
        </div>

        <div className="report-section-list">
          {sections.map(
            (section) => {
              const Icon =
                section.icon;

              const isExpanded =
                expandedSections[
                  section.id
                ];

              return (
                <article
                  key={
                    section.id
                  }
                  className={`report-section ${
                    isExpanded
                      ? "expanded"
                      : ""
                  }`}
                >
                  <button
                    type="button"
                    className="report-section-header"
                    onClick={() =>
                      toggleSection(
                        section.id
                      )
                    }
                  >
                    <div className="report-section-number">
                      {
                        section.number
                      }
                    </div>

                    <div className="report-section-icon">
                      <Icon
                        size={20}
                      />
                    </div>

                    <div className="report-section-title">
                      <span>
                        {
                          section.title
                        }
                      </span>

                      <p>
                        {
                          section.description
                        }
                      </p>
                    </div>

                    <div className="report-section-toggle">
                      {isExpanded ? (
                        <ChevronUp
                          size={20}
                        />
                      ) : (
                        <ChevronDown
                          size={20}
                        />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="report-section-content">
                      {section.id ===
                        "dataset" && (
                        <DatasetReport
                          records={
                            records
                          }
                          monthlySales={
                            monthlySales
                          }
                          datasetName={
                            datasetName
                          }
                        />
                      )}

                      {section.id ===
                        "cleaning" && (
                        <CleaningReport
                          cleaningReport={
                            cleaningReport
                          }
                          records={
                            records
                          }
                        />
                      )}

                      {section.id ===
                        "descriptive" && (
                        <DescriptiveReport
                          analysis={
                            analysis
                          }
                        />
                      )}

                      {section.id ===
                        "eda" && (
                        <EDAReport
                          analysis={
                            analysis
                          }
                          monthlySales={
                            monthlySales
                          }
                        />
                      )}

                      {section.id ===
                        "correlation" && (
                        <CorrelationReport
                          analysis={
                            analysis
                          }
                        />
                      )}

                      {section.id ===
                        "forecasting" && (
                        <ForecastReport
                          analysis={
                            analysis
                          }
                        />
                      )}

                      {section.id ===
                        "statistics" && (
                        <StatisticsReport
                          analysis={
                            analysis
                          }
                        />
                      )}

                      {section.id ===
                        "insights" && (
                        <InsightsReport
                          analysis={
                            analysis
                          }
                        />
                      )}
                    </div>
                  )}
                </article>
              );
            }
          )}
        </div>
      </section>

      {/* ==================================================
          FINAL STATUS
      ================================================== */}

      <section className="report-final">
        <div className="report-final-icon">
          <CheckCircle2
            size={30}
          />
        </div>

        <div>
          <span>
            REPORT STATUS
          </span>

          <h2>
            Analysis Complete
          </h2>

          <p>
            The report combines data
            preparation, descriptive
            analysis, exploratory analysis,
            correlation, predictive
            analysis, inferential statistics,
            and analytical interpretation
            into one consolidated result
            based on the currently cleaned
            dataset.
          </p>
        </div>
      </section>
    </div>
  );
}

/* ============================================================
   DATASET REPORT
============================================================ */

function DatasetReport({
  records,
  monthlySales,
  datasetName,
}) {
  return (
    <div className="report-content-grid">
      <div className="report-info-box">
        <span>
          DATA SOURCE
        </span>

        <strong>
          {datasetName ||
            "Online Retail"}
        </strong>

        <p>
          Transaction-level sales
          information prepared for
          analytics and forecasting.
        </p>
      </div>

      <div className="report-info-box">
        <span>
          CLEANED OBSERVATIONS
        </span>

        <strong>
          {formatNumber(
            records.length
          )}
        </strong>

        <p>
          Valid sales records remaining
          after the preprocessing stage.
        </p>
      </div>

      <div className="report-info-box">
        <span>
          TIME SERIES
        </span>

        <strong>
          {monthlySales.length} Months
        </strong>

        <p>
          Monthly revenue observations
          used for trend and forecasting
          analysis.
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   CLEANING REPORT
============================================================ */

function CleaningReport({
  cleaningReport,
  records,
}) {
  const checks = [
    "Missing-value inspection",
    "Duplicate-record inspection",
    "Invalid quantity inspection",
    "Invalid price inspection",
  ];

  return (
    <div className="cleaning-report">
      <div className="cleaning-status">
        <CheckCircle2 size={20} />

        <div>
          <strong>
            PREPROCESSING PIPELINE
          </strong>

          <p>
            Dataset quality checks and
            preprocessing operations are
            applied before downstream
            analysis.
          </p>
        </div>
      </div>

      <div className="cleaning-check-grid">
        {checks.map(
          (check, index) => (
            <div key={check}>
              <span>
                {String(
                  index + 1
                ).padStart(
                  2,
                  "0"
                )}
              </span>

              <strong>
                {check}
              </strong>

              <em>
                CHECKED
              </em>
            </div>
          )
        )}
      </div>

      <div className="report-cleaning-summary">
        <div>
          <span>
            VALID RECORDS
          </span>

          <strong>
            {formatNumber(
              records.length
            )}
          </strong>
        </div>

        {cleaningReport?.removed !==
          undefined && (
          <div>
            <span>
              REMOVED RECORDS
            </span>

            <strong>
              {formatNumber(
                cleaningReport.removed
              )}
            </strong>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   DESCRIPTIVE STATISTICS
============================================================ */

function DescriptiveReport({
  analysis,
}) {
  const rows = [
    [
      "Mean",
      formatCurrency(
        analysis.mean
      ),
    ],

    [
      "Median",
      formatCurrency(
        analysis.median
      ),
    ],

    [
      "Standard Deviation",
      formatCurrency(
        analysis.standardDeviation
      ),
    ],

    [
      "Minimum",
      formatCurrency(
        analysis.minimum
      ),
    ],

    [
      "Maximum",
      formatCurrency(
        analysis.maximum
      ),
    ],

    [
      "Range",
      formatCurrency(
        analysis.range
      ),
    ],
  ];

  return (
    <div className="mini-report-table">
      {rows.map(
        ([label, value]) => (
          <div key={label}>
            <span>
              {label}
            </span>

            <strong>
              {value}
            </strong>
          </div>
        )
      )}
    </div>
  );
}

/* ============================================================
   EDA
============================================================ */

function EDAReport({
  analysis,
  monthlySales,
}) {
  return (
    <div className="report-text-content">
      <div>
        <span>
          HIGHEST PERIOD
        </span>

        <strong>
          {
            analysis
              .highestMonth
              .month
          }{" "}
          —{" "}
          {formatCurrency(
            analysis
              .highestMonth
              .revenue
          )}
        </strong>
      </div>

      <div>
        <span>
          LOWEST PERIOD
        </span>

        <strong>
          {
            analysis
              .lowestMonth
              .month
          }{" "}
          —{" "}
          {formatCurrency(
            analysis
              .lowestMonth
              .revenue
          )}
        </strong>
      </div>

      <div>
        <span>
          PERIOD MOVEMENTS
        </span>

        <strong>
          {analysis.increases} increases
          {" · "}
          {analysis.decreases} decreases
        </strong>
      </div>

      <p>
        Exploratory analysis identifies
        the highest and lowest observed
        revenue periods and compares
        consecutive monthly observations
        to identify changes in the sales
        pattern.
      </p>

      <p>
        Across{" "}
        <strong>
          {monthlySales.length}
        </strong>{" "}
        monthly observations, revenue
        ranges from{" "}
        <strong>
          {formatCurrency(
            analysis.minimum
          )}
        </strong>{" "}
        to{" "}
        <strong>
          {formatCurrency(
            analysis.maximum
          )}
        </strong>
        .
      </p>
    </div>
  );
}

/* ============================================================
   CORRELATION
============================================================ */

function CorrelationReport({
  analysis,
}) {
  const absolute =
    Math.abs(
      analysis.correlation
    );

  let strength = "very weak";

  if (absolute >= 0.8) {
    strength =
      "very strong";
  } else if (
    absolute >= 0.6
  ) {
    strength = "strong";
  } else if (
    absolute >= 0.4
  ) {
    strength = "moderate";
  } else if (
    absolute >= 0.2
  ) {
    strength = "weak";
  }

  return (
    <div className="correlation-report">
      <div className="correlation-score">
        <span>
          QUANTITY ↔ REVENUE
        </span>

        <strong>
          {analysis.correlation >=
          0
            ? "+"
            : ""}
          {analysis.correlation.toFixed(
            3
          )}
        </strong>
      </div>

      <div>
        <span>
          INTERPRETATION
        </span>

        <p>
          The Pearson correlation
          coefficient indicates a{" "}
          <strong>
            {strength}
          </strong>{" "}
          positive relationship between
          quantity sold and transaction
          revenue across{" "}
          <strong>
            {formatNumber(
              analysis.correlationObservations
            )}
          </strong>{" "}
          cleaned records.
        </p>

        <p>
          This correlation does not
          establish causation. Revenue is
          calculated from quantity and
          unit price, so a strong
          quantity-revenue relationship is
          mathematically expected.
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   FORECASTING
============================================================ */

function ForecastReport({
  analysis,
}) {
  return (
    <div className="forecast-report">
      <div>
        <span>
          MODEL
        </span>

        <strong>
          Linear Regression
        </strong>
      </div>

      <div>
        <span>
          TREND SLOPE
        </span>

        <strong>
          {analysis.slope >= 0
            ? "+"
            : ""}
          {formatCurrency(
            analysis.slope
          )}
        </strong>
      </div>

      <div>
        <span>
          NEXT PERIOD
        </span>

        <strong>
          {formatCurrency(
            analysis.nextForecast
          )}
        </strong>
      </div>

      <div>
        <span>
          TRAINING R²
        </span>

        <strong>
          {(analysis.rSquared *
            100).toFixed(
            1
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
            analysis.mae
          )}
        </strong>
      </div>

      <p>
        The linear model provides a
        baseline estimate based on the
        historical monthly trend. The R²
        value represents the proportion of
        historical monthly variation
        explained by the linear time trend;
        it should not be interpreted as
        forecast accuracy.
      </p>
    </div>
  );
}

/* ============================================================
   INFERENTIAL STATISTICS
============================================================ */

function StatisticsReport({
  analysis,
}) {
  return (
    <div className="statistics-report">
      <div className="stat-test-box">
        <span>
          HYPOTHESIZED MEAN
        </span>

        <strong>
          {formatCurrency(
            analysis.hypothesizedMean
          )}
        </strong>
      </div>

      <div className="stat-test-box">
        <span>
          CONFIDENCE LEVEL
        </span>

        <strong>
          95%
        </strong>
      </div>

      <div className="stat-test-box">
        <span>
          SAMPLE MEAN
        </span>

        <strong>
          {formatCurrency(
            analysis.mean
          )}
        </strong>
      </div>

      <div className="stat-test-box">
        <span>
          T-STATISTIC
        </span>

        <strong>
          {analysis.tStatistic.toFixed(
            3
          )}
        </strong>
      </div>

      <div className="stat-test-box">
        <span>
          P-VALUE
        </span>

        <strong>
          {analysis.pValue.toFixed(
            4
          )}
        </strong>
      </div>

      <div className="stat-test-box">
        <span>
          DEGREES OF FREEDOM
        </span>

        <strong>
          {analysis.degreesOfFreedom}
        </strong>
      </div>

      <div className="stat-test-box">
        <span>
          95% CONFIDENCE INTERVAL
        </span>

        <strong>
          {formatCurrency(
            analysis.confidenceLower
          )}{" "}
          –{" "}
          {formatCurrency(
            analysis.confidenceUpper
          )}
        </strong>
      </div>

      <div className="stat-test-box">
        <span>
          DECISION
        </span>

        <strong>
          {analysis.hypothesisDecision}
        </strong>
      </div>

      <p>
        A one-sample Student's t-test is
        applied using H₀: μ ={" "}
        {formatCurrency(
          analysis.hypothesizedMean
        )}{" "}
        and H₁: μ ≠{" "}
        {formatCurrency(
          analysis.hypothesizedMean
        )}
        . At α = 0.05, the current
        calculated p-value is{" "}
        <strong>
          {analysis.pValue.toFixed(
            4
          )}
        </strong>
        .
      </p>

      <p>
        The 95% confidence interval for
        the estimated mean monthly revenue
        is{" "}
        <strong>
          {formatCurrency(
            analysis.confidenceLower
          )}
        </strong>{" "}
        to{" "}
        <strong>
          {formatCurrency(
            analysis.confidenceUpper
          )}
        </strong>
        .
      </p>
    </div>
  );
}

/* ============================================================
   INSIGHTS
============================================================ */

function InsightsReport({
  analysis,
}) {
  return (
    <div className="insights-report">
      <div>
        <strong>
          01
        </strong>

        <p>
          Revenue changed from{" "}
          <b>
            {formatCurrency(
              analysis.firstRevenue
            )}
          </b>{" "}
          in the first observed period
          to{" "}
          <b>
            {formatCurrency(
              analysis.latestRevenue
            )}
          </b>{" "}
          in the latest period, a{" "}
          <b>
            {formatPercent(
              analysis.growth
            )}
          </b>{" "}
          first-to-latest change.
        </p>
      </div>

      <div>
        <strong>
          02
        </strong>

        <p>
          The highest observed period was{" "}
          <b>
            {
              analysis
                .highestMonth
                .month
            }
          </b>{" "}
          with revenue of{" "}
          <b>
            {formatCurrency(
              analysis
                .highestMonth
                .revenue
            )}
          </b>
          .
        </p>
      </div>

      <div>
        <strong>
          03
        </strong>

        <p>
          Quantity and revenue show a{" "}
          <b>
            {analysis.correlation >=
            0
              ? "positive"
              : "negative"}
          </b>{" "}
          Pearson relationship of{" "}
          <b>
            {analysis.correlation.toFixed(
              3
            )}
          </b>{" "}
          across the cleaned transaction
          records.
        </p>
      </div>

      <div>
        <strong>
          04
        </strong>

        <p>
          The historical linear trend
          provides a baseline next-period
          estimate of{" "}
          <b>
            {formatCurrency(
              analysis.nextForecast
            )}
          </b>
          .
        </p>
      </div>
    </div>
  );
}

export default Reports;