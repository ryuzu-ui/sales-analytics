// Monthly summaries provide a calendar year and a zero-based monthNumber.
export function calculateQuarterlySales(monthlySales) {
  const quarters = new Map();

  for (const item of monthlySales) {
    const quarter = Math.floor(item.monthNumber / 3) + 1;
    const key = `${item.year}-Q${quarter}`;

    if (!quarters.has(key)) {
      quarters.set(key, {
        year: item.year,
        quarter,
        label: `Q${quarter} ${item.year}`,
        revenue: 0,
      });
    }

    quarters.get(key).revenue += Number(item.revenue) || 0;
  }

  return Array.from(quarters.values()).sort(
    (a, b) => a.year - b.year || a.quarter - b.quarter,
  );
}
