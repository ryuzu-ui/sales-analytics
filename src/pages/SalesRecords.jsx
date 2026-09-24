import { useMemo, useState } from "react";
import {
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  SlidersHorizontal,
} from "lucide-react";

import { salesRecords } from "../data/salesData";

function SalesRecords() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [region, setRegion] = useState("All");
  const [sortBy, setSortBy] = useState("date");
  const [sortDirection, setSortDirection] = useState("desc");
  const [page, setPage] = useState(1);

  const rowsPerPage = 7;

  const categories = [
    "All",
    ...new Set(salesRecords.map((item) => item.category)),
  ];

  const regions = [
    "All",
    ...new Set(salesRecords.map((item) => item.region)),
  ];

  const filteredRecords = useMemo(() => {
    const result = salesRecords.filter((record) => {
      const keyword = search.toLowerCase();

      const matchesSearch =
        record.id.toLowerCase().includes(keyword) ||
        record.product.toLowerCase().includes(keyword) ||
        record.region.toLowerCase().includes(keyword);

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

      if (typeof first === "string") {
        first = first.toLowerCase();
        second = second.toLowerCase();
      }

      if (first < second) {
        return sortDirection === "asc" ? -1 : 1;
      }

      if (first > second) {
        return sortDirection === "asc" ? 1 : -1;
      }

      return 0;
    });

    return result;
  }, [
    search,
    category,
    region,
    sortBy,
    sortDirection,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRecords.length / rowsPerPage)
  );

  const visibleRecords = filteredRecords.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const changeSort = (field) => {
    if (sortBy === field) {
      setSortDirection((current) =>
        current === "asc" ? "desc" : "asc"
      );
    } else {
      setSortBy(field);
      setSortDirection("desc");
    }
  };

  const resetFilters = () => {
    setSearch("");
    setCategory("All");
    setRegion("All");
    setPage(1);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "2-digit",
        year: "numeric",
      }
    );
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

        <button className="records-export-button">
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
            CSV
          </div>

          <div>
            <strong>ONLINE RETAIL DATASET</strong>

            <span>
              Transaction-level sales records
            </span>
          </div>
        </div>

        <div className="dataset-meta">
          <div>
            <span>RECORDS</span>
            <strong>{salesRecords.length}</strong>
          </div>

          <div>
            <span>VISIBLE</span>
            <strong>{filteredRecords.length}</strong>
          </div>

          <div>
            <span>STATUS</span>
            <strong className="ready-label">
              READY
            </strong>
          </div>
        </div>

      </section>

      {/* =========================
          FILTER PANEL
      ========================= */}

      <section className="records-filter-panel">

        <div className="filter-title">
          <SlidersHorizontal size={18} />

          <div>
            <strong>FILTER DATA</strong>
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
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="records-select">
            <Filter size={16} />

            <select
              value={category}
              onChange={(event) => {
                setCategory(event.target.value);
                setPage(1);
              }}
            >
              {categories.map((item) => (
                <option key={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="records-select">

            <select
              value={region}
              onChange={(event) => {
                setRegion(event.target.value);
                setPage(1);
              }}
            >
              {regions.map((item) => (
                <option key={item}>
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
              {filteredRecords.length} records
            </strong>
          </div>

          <div className="table-indicator">
            <span />
            LIVE DATA VIEW
          </div>

        </div>

        <div className="sales-table-wrapper">

          <table className="neo-sales-table">

            <thead>
              <tr>

                <th>
                  <button
                    onClick={() => changeSort("id")}
                  >
                    INVOICE
                    <ArrowUpDown size={13} />
                  </button>
                </th>

                <th>
                  <button
                    onClick={() => changeSort("date")}
                  >
                    DATE
                    <ArrowUpDown size={13} />
                  </button>
                </th>

                <th>PRODUCT</th>

                <th>CATEGORY</th>

                <th>
                  <button
                    onClick={() => changeSort("quantity")}
                  >
                    QTY
                    <ArrowUpDown size={13} />
                  </button>
                </th>

                <th>UNIT PRICE</th>

                <th>
                  <button
                    onClick={() => changeSort("revenue")}
                  >
                    REVENUE
                    <ArrowUpDown size={13} />
                  </button>
                </th>

                <th>REGION</th>

              </tr>
            </thead>

            <tbody>

              {visibleRecords.map((record, index) => (

                <tr key={record.id}>

                  <td>
                    <div className="invoice-cell">
                      <span>
                        {String(
                          (page - 1) * rowsPerPage +
                          index +
                          1
                        ).padStart(2, "0")}
                      </span>

                      <strong>
                        {record.id}
                      </strong>
                    </div>
                  </td>

                  <td>
                    <span className="date-cell">
                      {formatDate(record.date)}
                    </span>
                  </td>

                  <td>
                    <div className="product-cell">
                      <strong>
                        {record.product}
                      </strong>

                      <span>
                        PRODUCT SALE
                      </span>
                    </div>
                  </td>

                  <td>
                    <span
                      className={`category-pill category-${record.category
                        .toLowerCase()
                        .replace(/\s+/g, "-")}`}
                    >
                      {record.category}
                    </span>
                  </td>

                  <td>
                    <strong className="quantity-cell">
                      {record.quantity}
                    </strong>
                  </td>

                  <td>
                    <span className="price-cell">
                      ₱
                      {record.unitPrice.toLocaleString()}
                    </span>
                  </td>

                  <td>
                    <div className="revenue-cell">
                      <strong>
                        ₱
                        {record.revenue.toLocaleString()}
                      </strong>

                      <span>
                        GROSS SALES
                      </span>
                    </div>
                  </td>

                  <td>
                    <span className="region-cell">
                      {record.region}
                    </span>
                  </td>

                </tr>

              ))}

              {visibleRecords.length === 0 && (
                <tr>
                  <td
                    colSpan="8"
                    className="neo-empty"
                  >
                    <div>
                      <strong>
                        NO RECORDS FOUND
                      </strong>

                      <span>
                        Try changing your filters.
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

            <span>DISPLAYING</span>

            <strong>
              {visibleRecords.length}
            </strong>

            <span>OF</span>

            <strong>
              {filteredRecords.length}
            </strong>

            <span>RECORDS</span>

          </div>

          <div className="pagination-controls">

            <button
              disabled={page === 1}
              onClick={() =>
                setPage((current) =>
                  Math.max(1, current - 1)
                )
              }
            >
              <ChevronLeft size={18} />
            </button>

            <div className="page-box">
              {String(page).padStart(2, "0")}
              <span>/</span>
              {String(totalPages).padStart(2, "0")}
            </div>

            <button
              disabled={page === totalPages}
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