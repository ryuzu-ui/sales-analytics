import assert from "node:assert/strict";
import test from "node:test";
import { calculateQuarterlySales } from "../src/utils/quarterlySales.js";

test("groups a December-starting 13-month dataset into calendar quarters without dropping its last month", () => {
  const monthlySales = [
    { year: 2010, monthNumber: 11, revenue: 100 },
    ...Array.from({ length: 12 }, (_, monthNumber) => ({
      year: 2011,
      monthNumber,
      revenue: (monthNumber + 1) * 10,
    })),
  ];

  const result = calculateQuarterlySales(monthlySales);

  assert.deepEqual(result, [
    { year: 2010, quarter: 4, label: "Q4 2010", revenue: 100 },
    { year: 2011, quarter: 1, label: "Q1 2011", revenue: 60 },
    { year: 2011, quarter: 2, label: "Q2 2011", revenue: 150 },
    { year: 2011, quarter: 3, label: "Q3 2011", revenue: 240 },
    { year: 2011, quarter: 4, label: "Q4 2011", revenue: 330 },
  ]);
  assert.equal(
    result.reduce((sum, item) => sum + item.revenue, 0),
    monthlySales.reduce((sum, item) => sum + item.revenue, 0),
  );
});

test("sorts sparse multi-year data chronologically without treating missing months as observations", () => {
  const monthlySales = [
    { year: 2026, monthNumber: 6, revenue: 30.5 },
    { year: 2024, monthNumber: 3, revenue: 10.25 },
    { year: 2025, monthNumber: 3, revenue: 20 },
    { year: 2024, monthNumber: 5, revenue: -0.25 },
    { year: 2026, monthNumber: 8, revenue: 0 },
  ];
  const original = structuredClone(monthlySales);

  assert.deepEqual(calculateQuarterlySales(monthlySales), [
    { year: 2024, quarter: 2, label: "Q2 2024", revenue: 10 },
    { year: 2025, quarter: 2, label: "Q2 2025", revenue: 20 },
    { year: 2026, quarter: 3, label: "Q3 2026", revenue: 30.5 },
  ]);
  assert.deepEqual(monthlySales, original);
});

test("returns no invented quarters for an empty dataset", () => {
  assert.deepEqual(calculateQuarterlySales([]), []);
});
