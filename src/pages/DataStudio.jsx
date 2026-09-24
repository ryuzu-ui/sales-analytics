import { useMemo, useState } from "react";

import {
  CheckCircle2,
  Database,
  FileSpreadsheet,
  AlertTriangle,
  Wand2,
  RefreshCw,
  Ban,
  Copy,
  CalendarX2,
  PackageX,
  CircleDollarSign,
} from "lucide-react";

import { useSalesData } from "../context/SalesDataContext";

function DataStudio() {
  const {
    rawRecords,
    salesRecords,
    sourceColumns,
    datasetName,
    isImported,
    isCleaned,
    cleaningReport,
    cleanDataset,
    resetToRawDataset,
  } = useSalesData();

  const [showAll, setShowAll] = useState(false);

  const analysis = useMemo(() => {
    const rows = rawRecords || [];

    const missing = rows.reduce(
      (count, row) => {
        const values = [
          row.invoiceNo,
          row.date,
          row.product,
          row.quantity,
          row.unitPrice,
          row.region,
        ];

        return (
          count +
          values.filter(
            (value) =>
              value === null ||
              value === undefined ||
              value === "" ||
              (typeof value === "number" &&
                Number.isNaN(value))
          ).length
        );
      },
      0
    );

    const duplicateRecords =
      cleaningReport?.inspection
        ?.duplicateRecords ?? 0;

    const invalidQuantity =
      cleaningReport?.inspection
        ?.invalidQuantity ??
      rows.filter(
        (row) =>
          !Number.isFinite(
            Number(row.quantity)
          ) ||
          Number(row.quantity) <= 0
      ).length;

    const invalidPrice =
      cleaningReport?.inspection
        ?.invalidPrice ??
      rows.filter(
        (row) =>
          !Number.isFinite(
            Number(row.unitPrice)
          ) ||
          Number(row.unitPrice) <= 0
      ).length;

    const invalidDates =
      cleaningReport?.inspection
        ?.invalidDates ??
      rows.filter((row) => !row.date)
        .length;

    const cancelledTransactions =
      cleaningReport?.inspection
        ?.cancelledTransactions ??
      rows.filter((row) =>
        String(row.invoiceNo || "")
          .toUpperCase()
          .startsWith("C")
      ).length;

    return {
      totalRows: rows.length,

      columns:
        sourceColumns.length ||
        (rows.length
          ? Object.keys(rows[0]).length
          : 0),

      missing,

      duplicateRecords,

      invalidQuantity,

      invalidPrice,

      invalidDates,

      cancelledTransactions,

      validRows: isCleaned
        ? salesRecords.length
        : rows.filter(
            (row) =>
              row.invoiceNo &&
              row.date &&
              row.product &&
              Number.isFinite(
                Number(row.quantity)
              ) &&
              Number(row.quantity) > 0 &&
              Number.isFinite(
                Number(row.unitPrice)
              ) &&
              Number(row.unitPrice) > 0
          ).length,

      removedRows:
        cleaningReport?.removedRows ?? 0,
    };
  }, [
    rawRecords,
    salesRecords,
    sourceColumns,
    cleaningReport,
    isCleaned,
  ]);

  const previewRows = showAll
    ? salesRecords
    : salesRecords.slice(0, 6);

  const handleClean = () => {
    cleanDataset();
  };

  const handleReset = () => {
    resetToRawDataset();
  };

  if (!isImported) {
    return (
      <div className="data-studio-page">
        <section className="data-studio-heading">
          <div>
            <div className="section-kicker">
              <span className="kicker-block">
                02
              </span>
              DATA PREPARATION
            </div>

            <h1>DATA STUDIO</h1>

            <p>
              Inspect, validate, and prepare the
              sales dataset before performing
              statistical and predictive analysis.
            </p>
          </div>
        </section>

        <section className="studio-empty-state">
          <Database size={52} />

          <span>NO DATASET IMPORTED</span>

          <h2>
            IMPORT A DATASET FIRST
          </h2>

          <p>
            Use the <strong>Import Data</strong>{" "}
            button in the top navigation to load
            a CSV, XLS, or XLSX sales dataset.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="data-studio-page">
      {/* HEADER */}

      <section className="data-studio-heading">
        <div>
          <div className="section-kicker">
            <span className="kicker-block">
              02
            </span>
            DATA PREPARATION
          </div>

          <h1>DATA STUDIO</h1>

          <p>
            Inspect, validate, and prepare the
            sales dataset before performing
            statistical and predictive analysis.
          </p>

          <div className="studio-dataset-name">
            <Database size={15} />

            <span>
              {datasetName}
            </span>
          </div>
        </div>

        <button
          className={`studio-clean-button ${
            isCleaned ? "is-cleaned" : ""
          }`}
          onClick={
            isCleaned
              ? handleReset
              : handleClean
          }
        >
          {isCleaned ? (
            <>
              <RefreshCw size={18} />
              RESET TO RAW
            </>
          ) : (
            <>
              <Wand2 size={18} />
              CLEAN DATASET
            </>
          )}
        </button>
      </section>

      {/* DATASET SUMMARY */}

      <section className="studio-summary-grid">
        <div className="studio-stat-card purple">
          <div className="studio-stat-icon">
            <Database size={25} />
          </div>

          <span>
            {isCleaned
              ? "CLEAN RECORDS"
              : "TOTAL RECORDS"}
          </span>

          <strong>
            {salesRecords.length.toLocaleString()}
          </strong>

          <small>
            {isCleaned
              ? "Records after preprocessing"
              : "Rows detected in dataset"}
          </small>
        </div>

        <div className="studio-stat-card yellow">
          <div className="studio-stat-icon">
            <FileSpreadsheet size={25} />
          </div>

          <span>COLUMNS</span>

          <strong>
            {analysis.columns}
          </strong>

          <small>
            Detected data fields
          </small>
        </div>

        <div className="studio-stat-card pink">
          <div className="studio-stat-icon">
            <AlertTriangle size={25} />
          </div>

          <span>DATA ISSUES</span>

          <strong>
            {analysis.missing +
              analysis.duplicateRecords +
              analysis.invalidQuantity +
              analysis.invalidPrice +
              analysis.invalidDates}
          </strong>

          <small>
            Issues detected before cleaning
          </small>
        </div>

        <div className="studio-stat-card white">
          <div className="studio-stat-icon">
            <CheckCircle2 size={25} />
          </div>

          <span>REMOVED ROWS</span>

          <strong>
            {analysis.removedRows.toLocaleString()}
          </strong>

          <small>
            {isCleaned
              ? "Removed during cleaning"
              : "Cleaning not yet applied"}
          </small>
        </div>
      </section>

      {/* DATA QUALITY */}

      <section className="studio-quality-card">
        <div className="studio-card-header">
          <div>
            <span className="studio-label">
              DATA QUALITY CHECK
            </span>

            <h2>
              {isCleaned
                ? "CLEANING RESULTS"
                : "IS THE DATA READY?"}
            </h2>
          </div>

          <div
            className={`quality-status ${
              isCleaned
                ? "clean"
                : "warning"
            }`}
          >
            {isCleaned ? (
              <>
                <CheckCircle2 size={18} />
                CLEANED
              </>
            ) : (
              <>
                <AlertTriangle size={18} />
                NEEDS REVIEW
              </>
            )}
          </div>
        </div>

        <div className="quality-grid">
          <QualityItem
            icon={<AlertTriangle size={20} />}
            label="Missing Values"
            value={analysis.missing}
            status={
              analysis.missing === 0
                ? "good"
                : "warning"
            }
          />

          <QualityItem
            icon={<Copy size={20} />}
            label="Duplicate Records"
            value={analysis.duplicateRecords}
            status={
              analysis.duplicateRecords === 0
                ? "good"
                : "warning"
            }
          />

          <QualityItem
            icon={<PackageX size={20} />}
            label="Invalid Quantity"
            value={analysis.invalidQuantity}
            status={
              analysis.invalidQuantity === 0
                ? "good"
                : "warning"
            }
          />

          <QualityItem
            icon={
              <CircleDollarSign size={20} />
            }
            label="Invalid Unit Price"
            value={analysis.invalidPrice}
            status={
              analysis.invalidPrice === 0
                ? "good"
                : "warning"
            }
          />

          <QualityItem
            icon={<CalendarX2 size={20} />}
            label="Invalid Dates"
            value={analysis.invalidDates}
            status={
              analysis.invalidDates === 0
                ? "good"
                : "warning"
            }
          />

          <QualityItem
            icon={<Ban size={20} />}
            label="Cancelled Transactions"
            value={
              analysis.cancelledTransactions
            }
            status={
              analysis.cancelledTransactions === 0
                ? "good"
                : "warning"
            }
          />
        </div>
      </section>

      {/* CLEANING PROCESS */}

      <section className="studio-process-card">
        <div className="studio-card-header">
          <div>
            <span className="studio-label">
              PREPROCESSING PIPELINE
            </span>

            <h2>
              CLEANING OPERATIONS
            </h2>
          </div>

          <span className="process-count">
            {isCleaned
              ? "4 / 4 COMPLETE"
              : "0 / 4 COMPLETE"}
          </span>
        </div>

        <div className="cleaning-steps">
          <CleaningStep
            number="01"
            title="CHECK MISSING VALUES"
            description="Identify empty or null fields that may affect analysis."
            completed={isCleaned}
          />

          <CleaningStep
            number="02"
            title="CHECK DUPLICATES"
            description="Detect repeated transaction records before analysis."
            completed={isCleaned}
          />

          <CleaningStep
            number="03"
            title="VALIDATE NUMERIC DATA"
            description="Verify quantity and unit price values are valid and positive."
            completed={isCleaned}
          />

          <CleaningStep
            number="04"
            title="PREPARE ANALYTICS DATA"
            description="Remove invalid and cancelled transactions and retain valid records."
            completed={isCleaned}
          />
        </div>
      </section>

      {/* CLEANING RESULT */}

      {isCleaned &&
        cleaningReport && (
          <section className="studio-cleaning-result">
            <div>
              <span className="studio-label">
                CLEANING SUMMARY
              </span>

              <h2>
                DATASET PREPARED
              </h2>

              <p>
                The raw dataset was processed
                using the configured preprocessing
                rules.
              </p>
            </div>

            <div className="cleaning-result-stats">
              <div>
                <span>BEFORE</span>

                <strong>
                  {cleaningReport.beforeRows.toLocaleString()}
                </strong>
              </div>

              <div>
                <span>REMOVED</span>

                <strong>
                  {cleaningReport.removedRows.toLocaleString()}
                </strong>
              </div>

              <div>
                <span>AFTER</span>

                <strong>
                  {cleaningReport.afterRows.toLocaleString()}
                </strong>
              </div>
            </div>
          </section>
        )}

      {/* DATA PREVIEW */}

      <section className="studio-preview-card">
        <div className="studio-card-header preview-header">
          <div>
            <span className="studio-label">
              DATA PREVIEW
            </span>

            <h2>
              {isCleaned
                ? "CLEANED TRANSACTION DATA"
                : "RAW TRANSACTION DATA"}
            </h2>
          </div>

          <button
            className="preview-toggle"
            onClick={() =>
              setShowAll(
                (value) => !value
              )
            }
          >
            {showAll
              ? "SHOW LESS"
              : "SHOW ALL"}
          </button>
        </div>

        <div className="studio-table-wrapper">
          <table className="studio-table">
            <thead>
              <tr>
                <th>#</th>
                <th>INVOICE</th>
                <th>DATE</th>
                <th>PRODUCT</th>
                <th>CATEGORY</th>
                <th>QUANTITY</th>
                <th>UNIT PRICE</th>
                <th>REVENUE</th>
                <th>REGION</th>
              </tr>
            </thead>

            <tbody>
              {previewRows.map(
                (row, index) => (
                  <tr key={row.id}>
                    <td className="row-number">
                      {String(
                        index + 1
                      ).padStart(
                        2,
                        "0"
                      )}
                    </td>

                    <td className="studio-invoice">
                      {row.invoiceNo ||
                        row.id}
                    </td>

                    <td>
                      {row.date
                        ? new Date(
                            row.date
                          ).toLocaleString(
                            "en-US"
                          )
                        : "—"}
                    </td>

                    <td className="studio-product">
                      {row.product ||
                        "—"}
                    </td>

                    <td>
                      <span
                        className={`studio-category ${String(
                          row.category ||
                            "Uncategorized"
                        )
                          .toLowerCase()
                          .replace(
                            /\s+/g,
                            "-"
                          )}`}
                      >
                        {row.category ||
                          "Uncategorized"}
                      </span>
                    </td>

                    <td className="studio-number">
                      {Number.isFinite(
                        Number(
                          row.quantity
                        )
                      )
                        ? Number(
                            row.quantity
                          ).toLocaleString()
                        : "—"}
                    </td>

                    <td className="studio-price">
                      {Number.isFinite(
                        Number(
                          row.unitPrice
                        )
                      )
                        ? `£${Number(
                            row.unitPrice
                          ).toLocaleString(
                            undefined,
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}`
                        : "—"}
                    </td>

                    <td className="studio-revenue">
                      {Number.isFinite(
                        Number(
                          row.revenue
                        )
                      )
                        ? `£${Number(
                            row.revenue
                          ).toLocaleString(
                            undefined,
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}`
                        : "—"}
                    </td>

                    <td>
                      {row.region ||
                        "—"}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>

        <div className="studio-table-footer">
          <span>
            Showing{" "}
            {previewRows.length.toLocaleString()}{" "}
            of{" "}
            {salesRecords.length.toLocaleString()}{" "}
            records
          </span>

          <span className="footer-status">
            {isCleaned
              ? "CLEAN DATASET"
              : "RAW DATA PREVIEW"}
          </span>
        </div>
      </section>

      {/* NEXT STEP */}

      <section className="studio-next-card">
        <div>
          <span className="studio-label">
            NEXT STAGE
          </span>

          <h2>
            {isCleaned
              ? "READY FOR SALES ANALYSIS"
              : "CLEAN DATA BEFORE ANALYSIS"}
          </h2>

          <p>
            {isCleaned
              ? "The cleaned dataset is now available to the other analytics modules for descriptive statistics, EDA, pattern recognition, correlation, forecasting, and statistical analysis."
              : "Run the cleaning process first. The system will remove invalid transactions and prepare the dataset for downstream analytics."}
          </p>
        </div>

        <div className="next-arrow">
          →
        </div>
      </section>
    </div>
  );
}

function QualityItem({
  icon,
  label,
  value,
  status,
}) {
  return (
    <div
      className={`quality-item ${status}`}
    >
      <div className="quality-item-left">
        {icon}

        <span>{label}</span>
      </div>

      <strong>
        {Number(value || 0).toLocaleString()}
      </strong>
    </div>
  );
}

function CleaningStep({
  number,
  title,
  description,
  completed,
}) {
  return (
    <div
      className={`cleaning-step ${
        completed ? "completed" : ""
      }`}
    >
      <div className="cleaning-number">
        {number}
      </div>

      <div className="cleaning-content">
        <h3>{title}</h3>

        <p>{description}</p>
      </div>

      <div className="cleaning-status">
        {completed ? (
          <CheckCircle2 size={22} />
        ) : (
          <span className="status-dot" />
        )}
      </div>
    </div>
  );
}

export default DataStudio;