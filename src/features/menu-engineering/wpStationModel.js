const positive = value => String(value).trim() !== '' && Number.isFinite(Number(value)) && Number(value) > 0;
const finite = value => Number.isFinite(value) ? value : null;

// Session quantities are finished pounds entered by the planner, never inferred recipe yields.
export function projectStation(entries, catalog, rate, sellThrough, trusted) {
  const rows = entries.map(entry => {
    const food = catalog.find(row => row.key === entry.key);
    const pounds = positive(entry.pounds) ? Number(entry.pounds) : null;
    const validCost = trusted && food && !food.conflict && Number.isFinite(food.costPerLb) && food.costPerLb >= 0;
    return {...entry, food, pounds, cost: validCost && pounds != null ? finite(food.costPerLb * pounds) : null};
  });
  const quantitiesValid = rows.length > 0 && rows.every(row => row.pounds != null);
  const pounds = quantitiesValid ? finite(rows.reduce((sum, row) => sum + row.pounds, 0)) : null;
  const cost = rows.length && rows.every(row => row.cost != null) ? finite(rows.reduce((sum, row) => sum + row.cost, 0)) : null;
  const sellValid = String(sellThrough).trim() !== '' && Number.isFinite(Number(sellThrough)) && Number(sellThrough) >= 0 && Number(sellThrough) <= 100;
  const soldPounds = pounds != null && sellValid ? finite(pounds * (Number(sellThrough) / 100)) : null;
  const sales = soldPounds != null && positive(rate) ? finite(soldPounds * Number(rate)) : null;
  return {rows, pounds, cost, soldPounds, sales, foodCost: cost != null && sales > 0 ? cost / sales : null,
    contribution: cost != null && sales != null ? sales - cost : null,
    reviewCount: rows.filter(row => row.food?.serviceReasons?.length).length,
    approximate: rows.some(row => row.food?.weightApproximate)};
}
