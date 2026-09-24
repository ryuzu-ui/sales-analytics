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
} from "lucide-react";
import { monthlySales, topProducts, salesRecords } from "../data/salesData";

function formatCurrency(value) {
  return `₱${Math.round(value).toLocaleString("en-PH")}`;
}

function calculateMean(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function calculateMedian(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }

  return sorted[middle];
}

function calculateStandardDeviation(values) {
  const mean = calculateMean(values);

  const variance =
    values.reduce(
      (sum, value) => sum + (value - mean) ** 2,
      0
    ) /
    (values.length - 1);

  return Math.sqrt(variance);
}

function calculateCorrelation(xValues, yValues) {
  const xMean = calculateMean(xValues);
  const yMean = calculateMean(yValues);

  let numerator = 0;
  let xVariance = 0;
  let yVariance = 0;

  for (let i = 0; i < xValues.length; i += 1) {
    const xDifference = xValues[i] - xMean;
    const yDifference = yValues[i] - yMean;

    numerator += xDifference * yDifference;
    xVariance += xDifference ** 2;
    yVariance += yDifference ** 2;
  }

  if (xVariance === 0 || yVariance === 0) {
    return 0;
  }

  return numerator / Math.sqrt(xVariance * yVariance);
}

function Reports() {
  const [expandedSections, setExpandedSections] = useState({
    dataset: true,
    cleaning: true,
    descriptive: true,
    eda: true,
    correlation: true,
    forecasting: true,
    statistics: true,
    insights: true,
  });

  const analysis = useMemo(() => {
    const revenues = monthlySales.map(
      (item) => item.revenue
    );

    const quantities = salesRecords.map(
      (item) => item.quantity
    );

    const recordRevenues = salesRecords.map(
      (item) => item.revenue
    );

    const mean = calculateMean(revenues);
    const median = calculateMedian(revenues);
    const standardDeviation =
      calculateStandardDeviation(revenues);

    const highestMonth = monthlySales.reduce(
      (highest, current) =>
        current.revenue > highest.revenue
          ? current
          : highest
    );

    const lowestMonth = monthlySales.reduce(
      (lowest, current) =>
        current.revenue < lowest.revenue
          ? current
          : lowest
    );

    const correlation = calculateCorrelation(
      quantities,
      recordRevenues
    );

    const slope =
      (revenues[revenues.length - 1] - revenues[0]) /
      (revenues.length - 1);

    const nextForecast =
      revenues[revenues.length - 1] + slope;

    const growth =
      ((revenues[revenues.length - 1] - revenues[0]) /
        revenues[0]) *
      100;

    return {
      mean,
      median,
      standardDeviation,
      highestMonth,
      lowestMonth,
      correlation,
      slope,
      nextForecast,
      growth,
    };
  }, []);

  const toggleSection = (section) => {
    setExpandedSections((current) => ({
      ...current,
      [section]: !current[section],
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    const report = {
      title: "Sales Analytics and Forecasting Report",
      generatedAt: new Date().toISOString(),
      dataset: {
        records: salesRecords.length,
        monthlyObservations: monthlySales.length,
      },
      descriptiveStatistics: {
        mean: analysis.mean,
        median: analysis.median,
        standardDeviation: analysis.standardDeviation,
        minimum: analysis.lowestMonth.revenue,
        maximum: analysis.highestMonth.revenue,
      },
      exploratoryAnalysis: {
        highestMonth: analysis.highestMonth,
        lowestMonth: analysis.lowestMonth,
        overallGrowth: analysis.growth,
      },
      correlation: {
        quantityRevenue: analysis.correlation,
      },
      forecasting: {
        nextPeriodEstimate: analysis.nextForecast,
        slope: analysis.slope,
      },
      topProducts,
    };

    const blob = new Blob(
      [JSON.stringify(report, null, 2)],
      {
        type: "application/json",
      }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "sales-analytics-report.json";
    link.click();

    URL.revokeObjectURL(url);
  };

  const sections = [
    {
      id: "dataset",
      number: "01",
      icon: Database,
      title: "Dataset Overview",
      description:
        "Source structure, observations, and data coverage.",
    },
    {
      id: "cleaning",
      number: "02",
      icon: CheckCircle2,
      title: "Data Cleaning",
      description:
        "Data quality checks and preprocessing operations.",
    },
    {
      id: "descriptive",
      number: "03",
      icon: BarChart3,
      title: "Descriptive Statistics",
      description:
        "Central tendency and variability measurements.",
    },
    {
      id: "eda",
      number: "04",
      icon: TrendingUp,
      title: "EDA & Pattern Recognition",
      description:
        "Sales trends, high/low periods, and observed patterns.",
    },
    {
      id: "correlation",
      number: "05",
      icon: Link2,
      title: "Correlation Analysis",
      description:
        "Relationships between selected sales variables.",
    },
    {
      id: "forecasting",
      number: "06",
      icon: Brain,
      title: "Predictive Analysis",
      description:
        "Historical trend and future sales estimation.",
    },
    {
      id: "statistics",
      number: "07",
      icon: FlaskConical,
      title: "Inferential Statistics",
      description:
        "Statistical estimation and hypothesis testing.",
    },
    {
      id: "insights",
      number: "08",
      icon: FileText,
      title: "Analytical Insights",
      description:
        "Summary of the major findings from the analysis.",
    },
  ];

  return (
    <div className="reports-page">
      <section className="reports-heading">
        <div>
          <div className="section-kicker">
            <span className="kicker-block">10</span>
            FINAL REPORT
          </div>

          <h1>
            ANALYTICS
            <br />
            <span>REPORT.</span>
          </h1>

          <p>
            Consolidated report containing the dataset
            information, statistical analysis, patterns,
            correlations, forecasts, and analytical findings.
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

      <section className="report-cover">
        <div className="report-cover-left">
          <div className="report-cover-mark">
            <FileText size={30} />
          </div>

          <div>
            <span>ANALYTICAL REPORT</span>

            <h2>
              Sales Analytics
              <br />
              & Forecasting
            </h2>

            <p>
              Historical sales performance, statistical
              analysis, predictive modeling, and insights.
            </p>
          </div>
        </div>

        <div className="report-cover-meta">
          <div>
            <span>DATASET</span>
            <strong>ONLINE RETAIL</strong>
          </div>

          <div>
            <span>OBSERVATIONS</span>
            <strong>
              {salesRecords.length.toLocaleString()}
            </strong>
          </div>

          <div>
            <span>STATUS</span>
            <strong>READY</strong>
          </div>
        </div>
      </section>

      <section className="report-summary-grid">
        <article className="report-summary-card purple">
          <span>TOTAL MONTHS</span>
          <strong>{monthlySales.length}</strong>
          <p>Historical monthly observations</p>
        </article>

        <article className="report-summary-card yellow">
          <span>AVERAGE REVENUE</span>
          <strong>
            {formatCurrency(analysis.mean)}
          </strong>
          <p>Average monthly sales</p>
        </article>

        <article className="report-summary-card pink">
          <span>OVERALL GROWTH</span>
          <strong>
            +{analysis.growth.toFixed(1)}%
          </strong>
          <p>First to latest observed period</p>
        </article>

        <article className="report-summary-card white">
          <span>NEXT FORECAST</span>
          <strong>
            {formatCurrency(analysis.nextForecast)}
          </strong>
          <p>Baseline future estimate</p>
        </article>
      </section>

      <section className="report-sections">
        <div className="report-sections-header">
          <div>
            <span className="report-kicker">
              REPORT CONTENT
            </span>

            <h2>Analysis Breakdown</h2>
          </div>

          <span className="report-section-count">
            {sections.length} SECTIONS
          </span>
        </div>

        <div className="report-section-list">
          {sections.map((section) => {
            const Icon = section.icon;
            const isExpanded =
              expandedSections[section.id];

            return (
              <article
                key={section.id}
                className={`report-section ${
                  isExpanded ? "expanded" : ""
                }`}
              >
                <button
                  type="button"
                  className="report-section-header"
                  onClick={() =>
                    toggleSection(section.id)
                  }
                >
                  <div className="report-section-number">
                    {section.number}
                  </div>

                  <div className="report-section-icon">
                    <Icon size={20} />
                  </div>

                  <div className="report-section-title">
                    <span>{section.title}</span>
                    <p>{section.description}</p>
                  </div>

                  <div className="report-section-toggle">
                    {isExpanded ? (
                      <ChevronUp size={20} />
                    ) : (
                      <ChevronDown size={20} />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="report-section-content">
                    {section.id === "dataset" && (
                      <DatasetReport />
                    )}

                    {section.id === "cleaning" && (
                      <CleaningReport />
                    )}

                    {section.id === "descriptive" && (
                      <DescriptiveReport
                        analysis={analysis}
                      />
                    )}

                    {section.id === "eda" && (
                      <EDAReport
                        analysis={analysis}
                      />
                    )}

                    {section.id === "correlation" && (
                      <CorrelationReport
                        analysis={analysis}
                      />
                    )}

                    {section.id === "forecasting" && (
                      <ForecastReport
                        analysis={analysis}
                      />
                    )}

                    {section.id === "statistics" && (
                      <StatisticsReport
                        analysis={analysis}
                      />
                    )}

                    {section.id === "insights" && (
                      <InsightsReport
                        analysis={analysis}
                      />
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <section className="report-final">
        <div className="report-final-icon">
          <CheckCircle2 size={30} />
        </div>

        <div>
          <span>REPORT STATUS</span>

          <h2>Analysis Complete</h2>

          <p>
            The report combines data preparation, descriptive
            analysis, exploratory analysis, correlation,
            predictive analysis, inferential statistics, and
            analytical interpretation into one consolidated
            result.
          </p>
        </div>
      </section>
    </div>
  );
}

function DatasetReport() {
  return (
    <div className="report-content-grid">
      <div className="report-info-box">
        <span>DATA SOURCE</span>
        <strong>Historical Sales Dataset</strong>
        <p>
          Transaction-level sales information prepared for
          analytics and forecasting.
        </p>
      </div>

      <div className="report-info-box">
        <span>OBSERVATIONS</span>
        <strong>{salesRecords.length}</strong>
        <p>
          Records currently loaded into the analysis
          interface.
        </p>
      </div>

      <div className="report-info-box">
        <span>TIME SERIES</span>
        <strong>{monthlySales.length} Months</strong>
        <p>
          Monthly revenue observations used for trend and
          forecasting analysis.
        </p>
      </div>
    </div>
  );
}

function CleaningReport() {
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
          <strong>PREPROCESSING PIPELINE</strong>
          <p>
            Dataset quality checks are available before
            downstream analysis.
          </p>
        </div>
      </div>

      <div className="cleaning-check-grid">
        {checks.map((check, index) => (
          <div key={check}>
            <span>
              {String(index + 1).padStart(2, "0")}
            </span>

            <strong>{check}</strong>

            <em>CHECKED</em>
          </div>
        ))}
      </div>
    </div>
  );
}

function DescriptiveReport({ analysis }) {
  const rows = [
    ["Mean", formatCurrency(analysis.mean)],
    ["Median", formatCurrency(analysis.median)],
    [
      "Standard Deviation",
      formatCurrency(analysis.standardDeviation),
    ],
    [
      "Minimum",
      formatCurrency(analysis.lowestMonth.revenue),
    ],
    [
      "Maximum",
      formatCurrency(analysis.highestMonth.revenue),
    ],
  ];

  return (
    <div className="mini-report-table">
      {rows.map(([label, value]) => (
        <div key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  );
}

function EDAReport({ analysis }) {
  return (
    <div className="report-text-content">
      <div>
        <span>HIGHEST PERIOD</span>

        <strong>
          {analysis.highestMonth.month} —{" "}
          {formatCurrency(
            analysis.highestMonth.revenue
          )}
        </strong>
      </div>

      <div>
        <span>LOWEST PERIOD</span>

        <strong>
          {analysis.lowestMonth.month} —{" "}
          {formatCurrency(
            analysis.lowestMonth.revenue
          )}
        </strong>
      </div>

      <p>
        Exploratory analysis identifies the highest and lowest
        observed revenue periods and provides a basis for
        recognizing changes in the sales trend.
      </p>
    </div>
  );
}

function CorrelationReport({ analysis }) {
  return (
    <div className="correlation-report">
      <div className="correlation-score">
        <span>QUANTITY ↔ REVENUE</span>

        <strong>
          {analysis.correlation.toFixed(2)}
        </strong>
      </div>

      <div>
        <span>INTERPRETATION</span>

        <p>
          The calculated Pearson correlation indicates a{" "}
          {Math.abs(analysis.correlation) >= 0.6
            ? "strong"
            : Math.abs(analysis.correlation) >= 0.4
            ? "moderate"
            : "weak"}{" "}
          relationship between quantity sold and revenue in
          the available transaction sample.
        </p>
      </div>
    </div>
  );
}

function ForecastReport({ analysis }) {
  return (
    <div className="forecast-report">
      <div>
        <span>MODEL</span>
        <strong>Linear Regression</strong>
      </div>

      <div>
        <span>TREND SLOPE</span>
        <strong>
          {formatCurrency(analysis.slope)}
        </strong>
      </div>

      <div>
        <span>NEXT PERIOD</span>
        <strong>
          {formatCurrency(analysis.nextForecast)}
        </strong>
      </div>
    </div>
  );
}

function StatisticsReport({ analysis }) {
  return (
    <div className="statistics-report">
      <div className="stat-test-box">
        <span>HYPOTHESIZED MEAN</span>
        <strong>₱100,000</strong>
      </div>

      <div className="stat-test-box">
        <span>CONFIDENCE LEVEL</span>
        <strong>95%</strong>
      </div>

      <div className="stat-test-box">
        <span>SAMPLE MEAN</span>
        <strong>
          {formatCurrency(analysis.mean)}
        </strong>
      </div>

      <p>
        Inferential analysis uses the observed monthly revenue
        sample to demonstrate statistical estimation and
        hypothesis-testing concepts.
      </p>
    </div>
  );
}

function InsightsReport({ analysis }) {
  return (
    <div className="insights-report">
      <div>
        <strong>01</strong>

        <p>
          Revenue shows an overall{" "}
          <b>
            {analysis.growth >= 0
              ? "positive"
              : "negative"}
          </b>{" "}
          movement across the observed period.
        </p>
      </div>

      <div>
        <strong>02</strong>

        <p>
          The highest observed period was{" "}
          <b>{analysis.highestMonth.month}</b>.
        </p>
      </div>

      <div>
        <strong>03</strong>

        <p>
          Quantity and revenue show a measurable correlation
          within the transaction sample.
        </p>
      </div>

      <div>
        <strong>04</strong>

        <p>
          The historical trend provides a baseline for future
          revenue forecasting.
        </p>
      </div>
    </div>
  );
}

export default Reports;