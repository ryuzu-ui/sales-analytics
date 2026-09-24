import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Database,
  FileSpreadsheet,
  AlertTriangle,
  Trash2,
  Wand2,
  RefreshCw,
} from "lucide-react";

import { salesRecords } from "../data/salesData";

function DataStudio() {
  const [cleaned, setCleaned] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const analysis = useMemo(() => {
    const rows = salesRecords || [];

    const missing = rows.reduce((count, row) => {
      return (
        count +
        Object.values(row).filter(
          (value) => value === null || value === undefined || value === ""
        ).length
      );
    }, 0);

    const duplicateIds = rows.length - new Set(rows.map((row) => row.id)).size;

    const invalidQuantity = rows.filter(
      (row) => Number(row.quantity) <= 0 || Number.isNaN(Number(row.quantity))
    ).length;

    const invalidPrice = rows.filter(
      (row) => Number(row.unitPrice) <= 0 || Number.isNaN(Number(row.unitPrice))
    ).length;

    const validRows = rows.filter(
      (row) =>
        row.id &&
        row.date &&
        row.product &&
        row.category &&
        Number(row.quantity) > 0 &&
        Number(row.unitPrice) > 0
    );

    return {
      totalRows: rows.length,
      columns: rows.length ? Object.keys(rows[0]).length : 0,
      missing,
      duplicateIds,
      invalidQuantity,
      invalidPrice,
      validRows: validRows.length,
      removedRows: rows.length - validRows.length,
    };
  }, []);

  const previewRows = showAll ? salesRecords : salesRecords.slice(0, 6);

  const handleClean = () => {
    setCleaned(true);
  };

  const handleReset = () => {
    setCleaned(false);
  };

  return (
    <div className="data-studio-page">
      {/* HEADER */}
      <section className="data-studio-heading">
        <div>
          <div className="section-kicker">
            <span className="kicker-block">02</span>
            DATA PREPARATION
          </div>

          <h1>DATA STUDIO</h1>

          <p>
            Inspect, validate, and prepare the sales dataset before performing
            statistical and predictive analysis.
          </p>
        </div>

        <button
          className={`studio-clean-button ${cleaned ? "is-cleaned" : ""}`}
          onClick={cleaned ? handleReset : handleClean}
        >
          {cleaned ? (
            <>
              <RefreshCw size={18} />
              RESET CLEANING
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

          <span>TOTAL RECORDS</span>
          <strong>{analysis.totalRows.toLocaleString()}</strong>

          <small>Rows detected in dataset</small>
        </div>

        <div className="studio-stat-card yellow">
          <div className="studio-stat-icon">
            <FileSpreadsheet size={25} />
          </div>

          <span>COLUMNS</span>
          <strong>{analysis.columns}</strong>

          <small>Detected data fields</small>
        </div>

        <div className="studio-stat-card pink">
          <div className="studio-stat-icon">
            <AlertTriangle size={25} />
          </div>

          <span>DATA ISSUES</span>
          <strong>
            {analysis.missing +
              analysis.duplicateIds +
              analysis.invalidQuantity +
              analysis.invalidPrice}
          </strong>

          <small>Potential cleaning issues</small>
        </div>

        <div className="studio-stat-card white">
          <div className="studio-stat-icon">
            <CheckCircle2 size={25} />
          </div>

          <span>VALID RECORDS</span>
          <strong>{analysis.validRows}</strong>

          <small>
            {cleaned ? "After cleaning process" : "Currently valid"}
          </small>
        </div>
      </section>

      {/* DATA QUALITY */}
      <section className="studio-quality-card">
        <div className="studio-card-header">
          <div>
            <span className="studio-label">DATA QUALITY CHECK</span>
            <h2>IS THE DATA READY?</h2>
          </div>

          <div className={`quality-status ${cleaned ? "clean" : "warning"}`}>
            {cleaned ? (
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
            label="Missing Values"
            value={analysis.missing}
            status={analysis.missing === 0 ? "good" : "warning"}
          />

          <QualityItem
            label="Duplicate Records"
            value={analysis.duplicateIds}
            status={analysis.duplicateIds === 0 ? "good" : "warning"}
          />

          <QualityItem
            label="Invalid Quantity"
            value={analysis.invalidQuantity}
            status={analysis.invalidQuantity === 0 ? "good" : "warning"}
          />

          <QualityItem
            label="Invalid Unit Price"
            value={analysis.invalidPrice}
            status={analysis.invalidPrice === 0 ? "good" : "warning"}
          />
        </div>
      </section>

      {/* CLEANING PROCESS */}
      <section className="studio-process-card">
        <div className="studio-card-header">
          <div>
            <span className="studio-label">PREPROCESSING PIPELINE</span>
            <h2>CLEANING OPERATIONS</h2>
          </div>

          <span className="process-count">
            {cleaned ? "4 / 4 COMPLETE" : "0 / 4 COMPLETE"}
          </span>
        </div>

        <div className="cleaning-steps">
          <CleaningStep
            number="01"
            title="CHECK MISSING VALUES"
            description="Identify empty or null fields that may affect analysis."
            completed={cleaned}
          />

          <CleaningStep
            number="02"
            title="CHECK DUPLICATES"
            description="Detect repeated transaction identifiers."
            completed={cleaned}
          />

          <CleaningStep
            number="03"
            title="VALIDATE NUMERIC DATA"
            description="Verify quantity and unit price values."
            completed={cleaned}
          />

          <CleaningStep
            number="04"
            title="PREPARE ANALYTICS DATA"
            description="Keep valid records for downstream analysis."
            completed={cleaned}
          />
        </div>
      </section>

      {/* DATA PREVIEW */}
      <section className="studio-preview-card">
        <div className="studio-card-header preview-header">
          <div>
            <span className="studio-label">DATA PREVIEW</span>
            <h2>TRANSACTION DATASET</h2>
          </div>

          <button
            className="preview-toggle"
            onClick={() => setShowAll((value) => !value)}
          >
            {showAll ? "SHOW LESS" : "SHOW ALL"}
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
              {previewRows.map((row, index) => (
                <tr key={row.id}>
                  <td className="row-number">
                    {String(index + 1).padStart(2, "0")}
                  </td>

                  <td className="studio-invoice">{row.id}</td>

                  <td>{row.date}</td>

                  <td className="studio-product">{row.product}</td>

                  <td>
                    <span
                      className={`studio-category ${row.category
                        .toLowerCase()
                        .replace(/\s+/g, "-")}`}
                    >
                      {row.category}
                    </span>
                  </td>

                  <td className="studio-number">
                    {row.quantity.toLocaleString()}
                  </td>

                  <td className="studio-price">
                    ₱{row.unitPrice.toLocaleString()}
                  </td>

                  <td className="studio-revenue">
                    ₱{row.revenue.toLocaleString()}
                  </td>

                  <td>{row.region}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="studio-table-footer">
          <span>
            Showing {previewRows.length} of {analysis.totalRows} records
          </span>

          <span className="footer-status">
            {cleaned ? "DATASET READY FOR ANALYSIS" : "RAW DATA PREVIEW"}
          </span>
        </div>
      </section>

      {/* NEXT STEP */}
      <section className="studio-next-card">
        <div>
          <span className="studio-label">NEXT STAGE</span>
          <h2>READY FOR SALES ANALYSIS</h2>

          <p>
            Once the dataset passes preprocessing, it can be used for
            descriptive statistics, EDA, pattern recognition, correlation,
            forecasting, and statistical analysis.
          </p>
        </div>

        <div className="next-arrow">→</div>
      </section>
    </div>
  );
}

function QualityItem({ label, value, status }) {
  return (
    <div className={`quality-item ${status}`}>
      <div className="quality-item-left">
        {status === "good" ? (
          <CheckCircle2 size={20} />
        ) : (
          <AlertTriangle size={20} />
        )}

        <span>{label}</span>
      </div>

      <strong>{value}</strong>
    </div>
  );
}

function CleaningStep({ number, title, description, completed }) {
  return (
    <div className={`cleaning-step ${completed ? "completed" : ""}`}>
      <div className="cleaning-number">{number}</div>

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