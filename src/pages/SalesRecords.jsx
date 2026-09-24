import { useMemo, useState } from "react";

import {
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  SlidersHorizontal,
  Database,
} from "lucide-react";

import { useSalesData } from "../context/SalesDataContext";

function SalesRecords() {
  const {
    salesRecords,
    datasetName,
    isImported,
  } = useSalesData();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [region, setRegion] = useState("All");
  const [sortBy, setSortBy] = useState("date");
  const [sortDirection, setSortDirection] = useState("desc");
  const [page, setPage] = useState(1);

  const rowsPerPage = 7;

  const categories = useMemo(() => {
    return [
      "All",
      ...new Set(
        salesRecords
          .map((item) => item.category)
          .filter(Boolean)
      ),
    ];
  }, [salesRecords]);

  const regions = useMemo(() => {
    return [
      "All",
      ...new Set(
        salesRecords
          .map((item) => item.region)
          .filter(Boolean)
      ),
    ];
  }, [salesRecords]);

  const filteredRecords = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    const result = salesRecords.filter((record) => {
      const id = String(record.id || "").toLowerCase();
      const invoice = String(
        record.invoiceNo || ""
      ).toLowerCase();

      const product = String(
        record.product || ""
      ).toLowerCase();

      const regionValue = String(
        record.region || ""
      ).toLowerCase();

      const categoryValue = String(
        record.category || ""
      ).toLowerCase();

      const matchesSearch =
        !keyword ||
        id.includes(keyword) ||
        invoice.includes(keyword) ||
        product.includes(keyword) ||
        regionValue.includes(keyword) ||
        categoryValue.includes(keyword);

      const matchesCategory =
        category === "All" ||
        record.category === category;

      const matchesRegion =
        region === "All" ||
        record.region === region;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesRegion
      );
    });

    result.sort((a, b) => {
      let first = a[sortBy];
      let second = b[sortBy];

      if (sortBy === "date") {
        first = new Date(first);
        second = new Date(second);
      }

      if (
        typeof first === "string" &&
        sortBy !== "date"
      ) {
        first = first.toLowerCase();
        second = second.toLowerCase();
      }

      if (first < second) {
        return sortDirection === "asc"
          ? -1
          : 1;
      }

      if (first > second) {
        return sortDirection === "asc"
          ? 1
          : -1;
      }

      return 0;
    });

    return result;
  }, [
    salesRecords,
    search,
    category,
    region,
    sortBy,
    sortDirection,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredRecords.length / rowsPerPage
    )
  );

  const safePage = Math.min(
    page,
    totalPages
  );

  const visibleRecords = filteredRecords.slice(
    (safePage - 1) * rowsPerPage,
    safePage * rowsPerPage
  );

  const changeSort = (field) => {
    if (sortBy === field) {
      setSortDirection((current) =>
        current === "asc"
          ? "desc"
          : "asc"
      );
    } else {
      setSortBy(field);
      setSortDirection("desc");
    }

    setPage(1);
  };

  const resetFilters = () => {
    setSearch("");
    setCategory("All");
    setRegion("All");
    setPage(1);
  };

  const formatDate = (date) => {
    if (!date) return "—";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "—";
    }

    return parsed.toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "2-digit",
        year: "numeric",
      }
    );
  };

  const formatNumber = (value) => {
    return Number(value || 0).toLocaleString(
      undefined,
      {
        maximumFractionDigits: 2,
      }
    );
  };

  const formatCurrency = (value) => {
    return `₱${Number(value || 0).toLocaleString(
      undefined,
      {
        maximumFractionDigits: 2,
      }
    )}`;
  };

  return (
    <div className="records-page">

      {/* =========================
          PAGE HEADER
      ========================= */}

      <section className="records-heading">

        <div>

          <div className="section-kicker">
            <span className="kicker-block" />
            RAW SALES DATA
          </div>

          <h2>
            Sales
            <span> Records.</span>
          </h2>

          <p>
            Explore the transaction-level dataset
            used throughout the analytics pipeline.
          </p>

        </div>

        <button
          className="records-export-button"
          disabled={!isImported}
        >
          <Download size={18} />
          Export Dataset
        </button>

      </section>

      {/* =========================
          DATASET INFO
      ========================= */}

      <section className="dataset-strip">

        <div className="dataset-strip-main">

          <div className="dataset-icon">
            {datasetName
              ? datasetName
                  .split(".")
                  .pop()
                  .toUpperCase()
              : "—"}
          </div>

          <div>

            <strong>
              {datasetName ||
                "NO DATASET IMPORTED"}
            </strong>

            <span>
              {isImported
                ? "Transaction-level sales records"
                : "Import CSV or Excel to begin analysis"}
            </span>

          </div>

        </div>

        <div className="dataset-meta">

          <div>
            <span>RECORDS</span>

            <strong>
              {salesRecords.length.toLocaleString()}
            </strong>
          </div>

          <div>
            <span>VISIBLE</span>

            <strong>
              {filteredRecords.length.toLocaleString()}
            </strong>
          </div>

          <div>
            <span>STATUS</span>

            <strong
              className={
                isImported
                  ? "ready-label"
                  : ""
              }
            >
              {isImported
                ? "READY"
                : "WAITING"}
            </strong>
          </div>

        </div>

      </section>

      {/* =========================
          EMPTY DATASET STATE
      ========================= */}

      {!isImported && (
        <section className="records-empty-state">

          <Database size={42} />

          <strong>
            NO DATASET IMPORTED
          </strong>

          <span>
            Use the <b>Import Data</b> button
            in the top navigation to upload
            the UCI Online Retail dataset.
          </span>

        </section>
      )}

      {/* =========================
          FILTER PANEL
      ========================= */}

      <section className="records-filter-panel">

        <div className="filter-title">

          <SlidersHorizontal size={18} />

          <div>
            <strong>
              FILTER DATA
            </strong>

            <span>
              Narrow the dataset before analysis
            </span>
          </div>

        </div>

        <div className="records-filters">

          <div className="records-search">

            <Search size={17} />

            <input
              type="text"
              placeholder="Search invoice, product or region..."
              value={search}
              onChange={(event) => {
                setSearch(
                  event.target.value
                );

                setPage(1);
              }}
              disabled={!isImported}
            />

          </div>

          <div className="records-select">

            <Filter size={16} />

            <select
              value={category}
              onChange={(event) => {
                setCategory(
                  event.target.value
                );

                setPage(1);
              }}
              disabled={!isImported}
            >

              {categories.map((item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              ))}

            </select>

          </div>

          <div className="records-select">

            <select
              value={region}
              onChange={(event) => {
                setRegion(
                  event.target.value
                );

                setPage(1);
              }}
              disabled={!isImported}
            >

              {regions.map((item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              ))}

            </select>

          </div>

          <button
            className="clear-filter"
            onClick={resetFilters}
          >
            RESET
          </button>

        </div>

      </section>

      {/* =========================
          TABLE
      ========================= */}

      <section className="neo-table-card">

        <div className="table-topline">

          <div>

            <span className="table-label">
              TRANSACTION LEDGER
            </span>

            <strong>
              {filteredRecords.length.toLocaleString()} records
            </strong>

          </div>

          <div className="table-indicator">

            <span />

            {isImported
              ? "LIVE DATA VIEW"
              : "WAITING FOR DATA"}

          </div>

        </div>

        <div className="sales-table-wrapper">

          <table className="neo-sales-table">

            <thead>

              <tr>

                <th>
                  <button
                    onClick={() =>
                      changeSort("id")
                    }
                  >
                    INVOICE
                    <ArrowUpDown size={13} />
                  </button>
                </th>

                <th>
                  <button
                    onClick={() =>
                      changeSort("date")
                    }
                  >
                    DATE
                    <ArrowUpDown size={13} />
                  </button>
                </th>

                <th>
                  PRODUCT
                </th>

                <th>
                  CATEGORY
                </th>

                <th>
                  <button
                    onClick={() =>
                      changeSort(
                        "quantity"
                      )
                    }
                  >
                    QTY
                    <ArrowUpDown size={13} />
                  </button>
                </th>

                <th>
                  UNIT PRICE
                </th>

                <th>
                  <button
                    onClick={() =>
                      changeSort(
                        "revenue"
                      )
                    }
                  >
                    REVENUE
                    <ArrowUpDown size={13} />
                  </button>
                </th>

                <th>
                  REGION
                </th>

              </tr>

            </thead>

            <tbody>

              {visibleRecords.map(
                (record, index) => (

                  <tr
                    key={record.id}
                  >

                    <td>

                      <div className="invoice-cell">

                        <span>
                          {String(
                            (safePage - 1) *
                              rowsPerPage +
                              index +
                              1
                          ).padStart(
                            2,
                            "0"
                          )}
                        </span>

                        <strong>
                          {record.invoiceNo ||
                            record.id}
                        </strong>

                      </div>

                    </td>

                    <td>

                      <span className="date-cell">
                        {formatDate(
                          record.date
                        )}
                      </span>

                    </td>

                    <td>

                      <div className="product-cell">

                        <strong>
                          {record.product ||
                            "Unknown Product"}
                        </strong>

                        <span>
                          {record.stockCode
                            ? `STOCK CODE: ${record.stockCode}`
                            : "PRODUCT SALE"}
                        </span>

                      </div>

                    </td>

                    <td>

                      <span
                        className={`category-pill category-${String(
                          record.category ||
                            "uncategorized"
                        )
                          .toLowerCase()
                          .replace(
                            /\s+/g,
                            "-"
                          )}`}
                      >
                        {record.category ||
                          "Uncategorized"}
                      </span>

                    </td>

                    <td>

                      <strong className="quantity-cell">
                        {formatNumber(
                          record.quantity
                        )}
                      </strong>

                    </td>

                    <td>

                      <span className="price-cell">
                        {formatCurrency(
                          record.unitPrice
                        )}
                      </span>

                    </td>

                    <td>

                      <div className="revenue-cell">

                        <strong>
                          {formatCurrency(
                            record.revenue
                          )}
                        </strong>

                        <span>
                          GROSS SALES
                        </span>

                      </div>

                    </td>

                    <td>

                      <span className="region-cell">
                        {record.region ||
                          "Unknown"}
                      </span>

                    </td>

                  </tr>

                )
              )}

              {visibleRecords.length === 0 && (
                <tr>

                  <td
                    colSpan="8"
                    className="neo-empty"
                  >

                    <div>

                      <strong>
                        {isImported
                          ? "NO RECORDS FOUND"
                          : "NO DATASET"}
                      </strong>

                      <span>
                        {isImported
                          ? "Try changing your filters."
                          : "Import a dataset to populate the transaction ledger."}
                      </span>

                    </div>

                  </td>

                </tr>
              )}

            </tbody>

          </table>

        </div>

        {/* =========================
            PAGINATION
        ========================= */}

        <div className="neo-pagination">

          <div className="pagination-info">

            <span>
              DISPLAYING
            </span>

            <strong>
              {visibleRecords.length}
            </strong>

            <span>
              OF
            </span>

            <strong>
              {filteredRecords.length.toLocaleString()}
            </strong>

            <span>
              RECORDS
            </span>

          </div>

          <div className="pagination-controls">

            <button
              disabled={
                safePage === 1
              }
              onClick={() =>
                setPage((current) =>
                  Math.max(
                    1,
                    current - 1
                  )
                )
              }
            >
              <ChevronLeft size={18} />
            </button>

            <div className="page-box">

              {String(
                safePage
              ).padStart(2, "0")}

              <span>/</span>

              {String(
                totalPages
              ).padStart(2, "0")}

            </div>

            <button
              disabled={
                safePage ===
                totalPages
              }
              onClick={() =>
                setPage((current) =>
                  Math.min(
                    totalPages,
                    current + 1
                  )
                )
              }
            >
              <ChevronRight size={18} />
            </button>

          </div>

        </div>

      </section>

    </div>
  );
}

export default SalesRecords;