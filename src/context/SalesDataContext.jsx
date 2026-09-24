import {
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";

import * as XLSX from "xlsx";

const SalesDataContext = createContext(null);

function normalizeColumnName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/_/g, "");
}

function findColumn(headers, names) {
  const normalizedNames = names.map(normalizeColumnName);

  return headers.find((header) =>
    normalizedNames.includes(normalizeColumnName(header))
  );
}

function parseExcelDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);

    if (parsed) {
      return new Date(
        parsed.y,
        parsed.m - 1,
        parsed.d,
        parsed.H || 0,
        parsed.M || 0,
        parsed.S || 0
      );
    }
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (!trimmed) {
      return null;
    }

    const parsed = new Date(trimmed);

    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return null;
}

function normalizeSalesRows(rows) {
  if (!rows.length) {
    return {
      records: [],
      sourceColumns: [],
    };
  }

  const headers = Object.keys(rows[0]);

  const invoiceColumn = findColumn(headers, [
    "InvoiceNo",
    "Invoice Number",
    "Invoice",
    "Transaction ID",
  ]);

  const productColumn = findColumn(headers, [
    "Description",
    "Product",
    "Product Name",
    "Item",
  ]);

  const quantityColumn = findColumn(headers, [
    "Quantity",
    "Qty",
  ]);

  const dateColumn = findColumn(headers, [
    "InvoiceDate",
    "Invoice Date",
    "Date",
    "Transaction Date",
  ]);

  const unitPriceColumn = findColumn(headers, [
    "UnitPrice",
    "Unit Price",
    "Price",
  ]);

  const countryColumn = findColumn(headers, [
    "Country",
    "Region",
    "Location",
  ]);

  const stockCodeColumn = findColumn(headers, [
    "StockCode",
    "Stock Code",
    "SKU",
    "Product Code",
  ]);

  const customerColumn = findColumn(headers, [
    "CustomerID",
    "Customer ID",
    "Customer",
  ]);

  if (
    !invoiceColumn ||
    !quantityColumn ||
    !dateColumn ||
    !unitPriceColumn
  ) {
    throw new Error(
      "The dataset does not contain the required sales columns. Required fields include InvoiceNo, Quantity, InvoiceDate, and UnitPrice."
    );
  }

  const records = rows.map((row, index) => {
    const rawQuantity = row[quantityColumn];
    const rawUnitPrice = row[unitPriceColumn];

    const quantity =
      rawQuantity === "" ||
      rawQuantity === null ||
      rawQuantity === undefined
        ? NaN
        : Number(rawQuantity);

    const unitPrice =
      rawUnitPrice === "" ||
      rawUnitPrice === null ||
      rawUnitPrice === undefined
        ? NaN
        : Number(rawUnitPrice);

    const date = parseExcelDate(row[dateColumn]);

    const invoice = String(
      row[invoiceColumn] ?? ""
    ).trim();

    const product = String(
      productColumn ? row[productColumn] ?? "" : ""
    ).trim();

    const country = String(
      countryColumn ? row[countryColumn] ?? "" : ""
    ).trim();

    const stockCode = String(
      stockCodeColumn ? row[stockCodeColumn] ?? "" : ""
    ).trim();

    const customerId = String(
      customerColumn ? row[customerColumn] ?? "" : ""
    ).trim();

    const revenue =
      Number.isFinite(quantity) &&
      Number.isFinite(unitPrice)
        ? quantity * unitPrice
        : 0;

    return {
      id: `${invoice || "ROW"}-${index + 1}`,
      invoiceNo: invoice,
      date: date ? date.toISOString() : "",
      product: product || "",
      category: "Uncategorized",
      quantity,
      unitPrice,
      revenue,
      region: country || "",
      stockCode,
      customerId,
      originalRow: row,
    };
  });

  return {
    records,
    sourceColumns: headers,
  };
}

/* ============================================================
   DATA CLEANING
   ============================================================ */

function inspectRecords(records) {
  const missing = records.reduce((count, row) => {
    const fields = [
      row.invoiceNo,
      row.date,
      row.product,
      row.quantity,
      row.unitPrice,
      row.region,
    ];

    return (
      count +
      fields.filter(
        (value) =>
          value === null ||
          value === undefined ||
          value === "" ||
          (typeof value === "number" &&
            Number.isNaN(value))
      ).length
    );
  }, 0);

  const duplicateKeys = new Set();
  let duplicateRecords = 0;

  records.forEach((row) => {
    const key = JSON.stringify([
      row.invoiceNo,
      row.stockCode,
      row.product,
      row.date,
      row.quantity,
      row.unitPrice,
      row.region,
    ]);

    if (duplicateKeys.has(key)) {
      duplicateRecords += 1;
    } else {
      duplicateKeys.add(key);
    }
  });

  const invalidQuantity = records.filter(
    (row) =>
      !Number.isFinite(Number(row.quantity)) ||
      Number(row.quantity) <= 0
  ).length;

  const invalidPrice = records.filter(
    (row) =>
      !Number.isFinite(Number(row.unitPrice)) ||
      Number(row.unitPrice) <= 0
  ).length;

  const invalidDates = records.filter(
    (row) => !row.date
  ).length;

  const missingProduct = records.filter(
    (row) => !String(row.product || "").trim()
  ).length;

  const cancelledTransactions = records.filter(
    (row) =>
      String(row.invoiceNo || "")
        .trim()
        .toUpperCase()
        .startsWith("C")
  ).length;

  const negativeRevenue = records.filter(
    (row) => Number(row.revenue) < 0
  ).length;

  return {
    missing,
    duplicateRecords,
    invalidQuantity,
    invalidPrice,
    invalidDates,
    missingProduct,
    cancelledTransactions,
    negativeRevenue,
  };
}

function cleanSalesRecords(rawRecords) {
  const seen = new Set();

  const cleaned = [];

  const removedReasons = {
    duplicates: 0,
    cancelled: 0,
    invalidQuantity: 0,
    invalidPrice: 0,
    invalidDate: 0,
    missingInvoice: 0,
    missingProduct: 0,
  };

  for (const row of rawRecords) {
    const invoiceNo = String(
      row.invoiceNo || ""
    ).trim();

    const product = String(
      row.product || ""
    ).trim();

    const quantity = Number(row.quantity);
    const unitPrice = Number(row.unitPrice);

    /* --------------------------------------------------------
       1. Remove missing invoice numbers
    -------------------------------------------------------- */

    if (!invoiceNo) {
      removedReasons.missingInvoice += 1;
      continue;
    }

    /* --------------------------------------------------------
       2. Remove cancelled transactions
          UCI Online Retail uses invoice numbers beginning with C
    -------------------------------------------------------- */

    if (invoiceNo.toUpperCase().startsWith("C")) {
      removedReasons.cancelled += 1;
      continue;
    }

    /* --------------------------------------------------------
       3. Remove missing products
    -------------------------------------------------------- */

    if (!product) {
      removedReasons.missingProduct += 1;
      continue;
    }

    /* --------------------------------------------------------
       4. Validate quantity
    -------------------------------------------------------- */

    if (
      !Number.isFinite(quantity) ||
      quantity <= 0
    ) {
      removedReasons.invalidQuantity += 1;
      continue;
    }

    /* --------------------------------------------------------
       5. Validate unit price
    -------------------------------------------------------- */

    if (
      !Number.isFinite(unitPrice) ||
      unitPrice <= 0
    ) {
      removedReasons.invalidPrice += 1;
      continue;
    }

    /* --------------------------------------------------------
       6. Validate date
    -------------------------------------------------------- */

    if (!row.date) {
      removedReasons.invalidDate += 1;
      continue;
    }

    const parsedDate = new Date(row.date);

    if (Number.isNaN(parsedDate.getTime())) {
      removedReasons.invalidDate += 1;
      continue;
    }

    /* --------------------------------------------------------
       7. Detect exact duplicate transaction rows
    -------------------------------------------------------- */

    const duplicateKey = JSON.stringify([
      invoiceNo,
      row.stockCode,
      product,
      row.date,
      quantity,
      unitPrice,
      row.region,
    ]);

    if (seen.has(duplicateKey)) {
      removedReasons.duplicates += 1;
      continue;
    }

    seen.add(duplicateKey);

    /* --------------------------------------------------------
       8. Keep cleaned record
    -------------------------------------------------------- */

    cleaned.push({
      ...row,
      invoiceNo,
      product,
      quantity,
      unitPrice,
      revenue: quantity * unitPrice,
      date: parsedDate.toISOString(),
    });
  }

  return {
    records: cleaned,
    removedReasons,
  };
}

/* ============================================================
   ANALYTICS
   ============================================================ */

function calculateMonthlySales(records) {
  const monthlyMap = new Map();

  records.forEach((record) => {
    if (!record.date) return;

    const date = new Date(record.date);

    if (Number.isNaN(date.getTime())) return;

    const year = date.getFullYear();
    const month = date.getMonth();

    const key = `${year}-${String(
      month + 1
    ).padStart(2, "0")}`;

    if (!monthlyMap.has(key)) {
      monthlyMap.set(key, {
        key,
        year,
        month,
        revenue: 0,
        quantity: 0,
      });
    }

    const entry = monthlyMap.get(key);

    entry.revenue += Number(record.revenue) || 0;
    entry.quantity += Number(record.quantity) || 0;
  });

  return Array.from(monthlyMap.values())
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((item) => ({
      month: new Date(
        item.year,
        item.month,
        1
      ).toLocaleDateString("en-US", {
        month: "short",
      }),
      year: item.year,
      monthNumber: item.month,
      label: new Date(
        item.year,
        item.month,
        1
      ).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      }),
      revenue: item.revenue,
      quantity: item.quantity,
    }));
}

function calculateTopProducts(records) {
  const productMap = new Map();

  records.forEach((record) => {
    const product =
      record.product || "Unknown Product";

    if (!productMap.has(product)) {
      productMap.set(product, {
        name: product,
        category: record.category,
        sales: 0,
        units: 0,
      });
    }

    const entry = productMap.get(product);

    entry.sales += Number(record.revenue) || 0;
    entry.units += Number(record.quantity) || 0;
  });

  return Array.from(productMap.values())
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 10);
}

function calculateSummary(records, monthlySales) {
  const totalRevenue = records.reduce(
    (sum, record) =>
      sum + (Number(record.revenue) || 0),
    0
  );

  const totalUnits = records.reduce(
    (sum, record) =>
      sum + (Number(record.quantity) || 0),
    0
  );

  const uniqueInvoices = new Set(
    records
      .map((record) => record.invoiceNo)
      .filter(Boolean)
  );

  const averageOrderValue =
    uniqueInvoices.size > 0
      ? totalRevenue / uniqueInvoices.size
      : 0;

  let growth = 0;

  if (monthlySales.length >= 2) {
    const previous =
      monthlySales[monthlySales.length - 2]
        .revenue;

    const current =
      monthlySales[monthlySales.length - 1]
        .revenue;

    if (previous !== 0) {
      growth =
        ((current - previous) /
          Math.abs(previous)) *
        100;
    }
  }

  const dates = records
    .map((record) => record.date)
    .filter(Boolean)
    .sort();

  return {
    totalRevenue,
    totalUnits,
    averageOrderValue,
    uniqueInvoices: uniqueInvoices.size,
    growth,
    firstDate: dates[0] || null,
    lastDate: dates.at(-1) || null,
  };
}

/* ============================================================
   PROVIDER
   ============================================================ */

export function SalesDataProvider({ children }) {
  const [rawRecords, setRawRecords] = useState([]);
  const [records, setRecords] = useState([]);

  const [datasetName, setDatasetName] =
    useState("");

  const [sourceColumns, setSourceColumns] =
    useState([]);

  const [isImporting, setIsImporting] =
    useState(false);

  const [importError, setImportError] =
    useState("");

  const [isCleaned, setIsCleaned] =
    useState(false);

  const [cleaningReport, setCleaningReport] =
    useState(null);

  const importFile = async (file) => {
    if (!file) return;

    setIsImporting(true);
    setImportError("");

    try {
      const extension = file.name
        .split(".")
        .pop()
        .toLowerCase();

      if (
        !["xlsx", "xls", "csv"].includes(
          extension
        )
      ) {
        throw new Error(
          "Unsupported file type. Please upload CSV, XLS, or XLSX."
        );
      }

      const buffer =
        await file.arrayBuffer();

      const workbook = XLSX.read(buffer, {
        type: "array",
        cellDates: true,
      });

      if (!workbook.SheetNames.length) {
        throw new Error(
          "The uploaded file does not contain a worksheet."
        );
      }

      const firstSheet =
        workbook.Sheets[
          workbook.SheetNames[0]
        ];

      const rows =
        XLSX.utils.sheet_to_json(
          firstSheet,
          {
            defval: "",
            raw: true,
          }
        );

      if (!rows.length) {
        throw new Error(
          "The uploaded dataset contains no records."
        );
      }

      const normalized =
        normalizeSalesRows(rows);

      setRawRecords(normalized.records);
      setRecords(normalized.records);

      setSourceColumns(
        normalized.sourceColumns
      );

      setDatasetName(file.name);

      setIsCleaned(false);
      setCleaningReport(null);
    } catch (error) {
      console.error(
        "Dataset import failed:",
        error
      );

      setImportError(
        error?.message ||
          "Unable to import the dataset."
      );

      setRawRecords([]);
      setRecords([]);
      setSourceColumns([]);
      setDatasetName("");
      setIsCleaned(false);
      setCleaningReport(null);
    } finally {
      setIsImporting(false);
    }
  };

  /* ==========================================================
     CLEAN DATASET
  ========================================================== */

  const cleanDataset = () => {
    if (!rawRecords.length) {
      return;
    }

    const result =
      cleanSalesRecords(rawRecords);

    const inspection =
      inspectRecords(rawRecords);

    setRecords(result.records);
    setIsCleaned(true);

    setCleaningReport({
      beforeRows: rawRecords.length,
      afterRows: result.records.length,
      removedRows:
        rawRecords.length -
        result.records.length,

      inspection,

      removedReasons:
        result.removedReasons,

      cleanedAt:
        new Date().toISOString(),
    });
  };

  /* ==========================================================
     RESET TO RAW DATA
  ========================================================== */

  const resetToRawDataset = () => {
    setRecords(rawRecords);
    setIsCleaned(false);
    setCleaningReport(null);
  };

  const clearDataset = () => {
    setRawRecords([]);
    setRecords([]);
    setSourceColumns([]);
    setDatasetName("");
    setImportError("");
    setIsCleaned(false);
    setCleaningReport(null);
  };

  /* ==========================================================
     DERIVED DATA
  ========================================================== */

  const monthlySales = useMemo(
    () => calculateMonthlySales(records),
    [records]
  );

  const topProducts = useMemo(
    () => calculateTopProducts(records),
    [records]
  );

  const summary = useMemo(
    () =>
      calculateSummary(
        records,
        monthlySales
      ),
    [records, monthlySales]
  );

  const categories = useMemo(() => {
    return [
      "All",
      ...Array.from(
        new Set(
          records.map(
            (record) => record.category
          )
        )
      ).filter(Boolean),
    ];
  }, [records]);

  const regions = useMemo(() => {
    return [
      "All",
      ...Array.from(
        new Set(
          records.map(
            (record) => record.region
          )
        )
      ).filter(Boolean),
    ];
  }, [records]);

  const value = {
    /* Dataset */

    records,

    salesRecords: records,

    rawRecords,

    cleanedRecords: records,

    sourceColumns,

    datasetName,

    isImported:
      rawRecords.length > 0,

    isCleaned,

    /* Cleaning */

    cleaningReport,

    cleanDataset,

    resetToRawDataset,

    /* Import */

    isImporting,

    importError,

    importFile,

    clearDataset,

    /* Analytics */

    monthlySales,

    topProducts,

    summary,

    categories,

    regions,
  };

  return (
    <SalesDataContext.Provider
      value={value}
    >
      {children}
    </SalesDataContext.Provider>
  );
}

export function useSalesData() {
  const context =
    useContext(SalesDataContext);

  if (!context) {
    throw new Error(
      "useSalesData must be used inside SalesDataProvider."
    );
  }

  return context;
}