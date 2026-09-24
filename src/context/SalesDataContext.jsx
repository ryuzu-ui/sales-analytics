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

  const parsed = new Date(value);

  if (!Number.isNaN(parsed.getTime())) {
    return parsed;
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

  if (!invoiceColumn || !quantityColumn || !dateColumn || !unitPriceColumn) {
    throw new Error(
      "The dataset does not contain the required sales columns. Required fields include InvoiceNo, Quantity, InvoiceDate, and UnitPrice."
    );
  }

  const records = rows.map((row, index) => {
    const quantity = Number(row[quantityColumn]) || 0;
    const unitPrice = Number(row[unitPriceColumn]) || 0;
    const date = parseExcelDate(row[dateColumn]);

    const invoice = String(
      row[invoiceColumn] ?? `ROW-${index + 1}`
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

    return {
      id: `${invoice}-${index + 1}`,
      invoiceNo: invoice,
      date: date ? date.toISOString() : "",
      product: product || "Unknown Product",
      category: "Uncategorized",
      quantity,
      unitPrice,
      revenue: quantity * unitPrice,
      region: country || "Unknown",
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

function calculateMonthlySales(records) {
  const monthlyMap = new Map();

  records.forEach((record) => {
    if (!record.date) return;

    const date = new Date(record.date);

    if (Number.isNaN(date.getTime())) return;

    const year = date.getFullYear();
    const month = date.getMonth();

    const key = `${year}-${String(month + 1).padStart(2, "0")}`;

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

    entry.revenue += record.revenue;
    entry.quantity += record.quantity;
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
    const product = record.product || "Unknown Product";

    if (!productMap.has(product)) {
      productMap.set(product, {
        name: product,
        category: record.category,
        sales: 0,
        units: 0,
      });
    }

    const entry = productMap.get(product);

    entry.sales += record.revenue;
    entry.units += record.quantity;
  });

  return Array.from(productMap.values())
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 10);
}

function calculateSummary(records, monthlySales) {
  const totalRevenue = records.reduce(
    (sum, record) => sum + record.revenue,
    0
  );

  const totalUnits = records.reduce(
    (sum, record) => sum + record.quantity,
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
      monthlySales[monthlySales.length - 2].revenue;

    const current =
      monthlySales[monthlySales.length - 1].revenue;

    if (previous !== 0) {
      growth =
        ((current - previous) / Math.abs(previous)) * 100;
    }
  }

  const firstDate = records
    .map((record) => record.date)
    .filter(Boolean)
    .sort()[0];

  const lastDate = records
    .map((record) => record.date)
    .filter(Boolean)
    .sort()
    .at(-1);

  return {
    totalRevenue,
    totalUnits,
    averageOrderValue,
    uniqueInvoices: uniqueInvoices.size,
    growth,
    firstDate: firstDate || null,
    lastDate: lastDate || null,
  };
}

export function SalesDataProvider({ children }) {
  const [records, setRecords] = useState([]);
  const [datasetName, setDatasetName] = useState("");
  const [sourceColumns, setSourceColumns] = useState([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState("");

  const importFile = async (file) => {
    if (!file) return;

    setIsImporting(true);
    setImportError("");

    try {
      const extension = file.name
        .split(".")
        .pop()
        .toLowerCase();

      if (!["xlsx", "xls", "csv"].includes(extension)) {
        throw new Error(
          "Unsupported file type. Please upload CSV, XLS, or XLSX."
        );
      }

      const buffer = await file.arrayBuffer();

      const workbook = XLSX.read(buffer, {
        type: "array",
        cellDates: true,
      });

      if (!workbook.SheetNames.length) {
        throw new Error("The uploaded file does not contain a worksheet.");
      }

      const firstSheet =
        workbook.Sheets[workbook.SheetNames[0]];

      const rows = XLSX.utils.sheet_to_json(firstSheet, {
        defval: "",
        raw: true,
      });

      if (!rows.length) {
        throw new Error(
          "The uploaded dataset contains no records."
        );
      }

      const normalized = normalizeSalesRows(rows);

      setRecords(normalized.records);
      setSourceColumns(normalized.sourceColumns);
      setDatasetName(file.name);
    } catch (error) {
      console.error("Dataset import failed:", error);

      setImportError(
        error?.message ||
          "Unable to import the dataset."
      );

      setRecords([]);
      setSourceColumns([]);
      setDatasetName("");
    } finally {
      setIsImporting(false);
    }
  };

  const clearDataset = () => {
    setRecords([]);
    setSourceColumns([]);
    setDatasetName("");
    setImportError("");
  };

  const monthlySales = useMemo(
    () => calculateMonthlySales(records),
    [records]
  );

  const topProducts = useMemo(
    () => calculateTopProducts(records),
    [records]
  );

  const summary = useMemo(
    () => calculateSummary(records, monthlySales),
    [records, monthlySales]
  );

  const categories = useMemo(() => {
    return [
      "All",
      ...Array.from(
        new Set(records.map((record) => record.category))
      ).filter(Boolean),
    ];
  }, [records]);

  const regions = useMemo(() => {
    return [
      "All",
      ...Array.from(
        new Set(records.map((record) => record.region))
      ).filter(Boolean),
    ];
  }, [records]);

  const value = {
    records,
    salesRecords: records,

    monthlySales,
    topProducts,

    summary,

    categories,
    regions,

    datasetName,
    sourceColumns,

    isImported: records.length > 0,
    isImporting,
    importError,

    importFile,
    clearDataset,
  };

  return (
    <SalesDataContext.Provider value={value}>
      {children}
    </SalesDataContext.Provider>
  );
}

export function useSalesData() {
  const context = useContext(SalesDataContext);

  if (!context) {
    throw new Error(
      "useSalesData must be used inside SalesDataProvider."
    );
  }

  return context;
}