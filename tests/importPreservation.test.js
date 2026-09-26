import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { JSDOM } from "jsdom";
import { createServer } from "vite";
import react from "@vitejs/plugin-react";
import * as XLSX from "xlsx";

let server;
let dom;
let root;
let current;
const globals = ["window", "document", "IS_REACT_ACT_ENVIRONMENT"];
const originalGlobals = new Map(
  globals.map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]),
);

before(async () => {
  dom = new JSDOM("<!doctype html><div id='root'></div>");
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  server = await createServer({
    configFile: false,
    plugins: [react()],
    server: { middlewareMode: true, watch: null },
    appType: "custom",
  });
  const { SalesDataProvider, useSalesData } = await server.ssrLoadModule(
    "/src/context/SalesDataContext.jsx",
  );
  function Probe() {
    current = useSalesData();
    return null;
  }
  root = createRoot(document.getElementById("root"));
  await act(async () => {
    root.render(createElement(SalesDataProvider, null, createElement(Probe)));
  });
});

after(async () => {
  if (root) await act(async () => root.unmount());
  await server?.close();
  dom?.window.close();
  for (const key of globals) {
    const original = originalGlobals.get(key);
    if (original) Object.defineProperty(globalThis, key, original);
    else delete globalThis[key];
  }
});

function workbookFile(name, rows) {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), "Sales");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  return { name, arrayBuffer: async () => buffer };
}

const sale = {
  InvoiceNo: "INV-1",
  StockCode: "SKU-1",
  Description: "Notebook",
  Quantity: 2,
  InvoiceDate: "2026-01-15",
  UnitPrice: 10,
  Country: "Philippines",
};

async function importFile(file) {
  await act(async () => current.importFile(file));
}

function datasetSnapshot() {
  return Object.fromEntries(
    [
      "records", "rawRecords", "sourceColumns", "datasetName",
      "isImported", "isCleaned", "cleaningReport", "monthlySales",
      "topProducts", "summary", "categories", "regions",
    ].map((key) => [key, current[key]]),
  );
}

test("failed imports preserve a previously imported and cleaned dataset", async (t) => {
  t.mock.method(console, "error", () => {});
  await importFile(workbookFile("original.xlsx", [sale, sale]));
  await act(async () => current.cleanDataset());
  assert.equal(current.rawRecords.length, 2);
  assert.equal(current.records.length, 1);
  assert.equal(current.cleaningReport.removedRows, 1);
  const previous = datasetSnapshot();

  const failures = [
    [{ name: "wrong.pdf" }, /Unsupported file type/],
    [workbookFile("empty.xlsx", []), /contains no records/],
    [workbookFile("missing-columns.xlsx", [{ Item: "Notebook" }]), /required sales columns/],
    [{ name: "unreadable.xlsx", arrayBuffer: async () => { throw new Error("Cannot read file"); } }, /Cannot read file/],
  ];

  for (const [file, message] of failures) {
    await importFile(file);
    assert.match(current.importError, message);
    assert.equal(current.isImporting, false);
    assert.deepEqual(datasetSnapshot(), previous, file.name);
  }

  // A successful retry replaces the active dataset and resets cleaning state.
  await importFile(workbookFile("replacement.xlsx", [{ ...sale, InvoiceNo: "INV-2", Quantity: 5 }]));
  assert.equal(current.datasetName, "replacement.xlsx");
  assert.equal(current.records.length, 1);
  assert.equal(current.records[0].invoiceNo, "INV-2");
  assert.equal(current.summary.totalRevenue, 50);
  assert.equal(current.isCleaned, false);
  assert.equal(current.cleaningReport, null);
  assert.equal(current.importError, "");
  assert.equal(current.isImporting, false);

  const uncleaned = datasetSnapshot();
  await importFile({ name: "invalid.pdf" });
  assert.match(current.importError, /Unsupported file type/);
  assert.deepEqual(datasetSnapshot(), uncleaned);
});

test("a first failed import leaves an empty dataset and a cancelled selection changes nothing", async (t) => {
  t.mock.method(console, "error", () => {});
  await act(async () => current.clearDataset());
  const empty = datasetSnapshot();
  await importFile({ name: "invalid.pdf" });
  assert.match(current.importError, /Unsupported file type/);
  assert.equal(current.isImporting, false);
  assert.deepEqual(datasetSnapshot(), empty);
  await importFile(null);
  assert.deepEqual(datasetSnapshot(), empty);
});
