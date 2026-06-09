export const money = (value) =>
  value == null || Number.isNaN(Number(value))
    ? "—"
    : Number(value).toLocaleString(undefined, { style: "currency", currency: "USD" });

export const pct = (value) =>
  value == null || Number.isNaN(Number(value))
    ? "—"
    : String((Number(value) * 100).toFixed(1)) + "%";

export const priceLabel = (value) =>
  value == null || Number.isNaN(Number(value)) ? "Complimentary" : money(value);

export const titleCase = (value) =>
  String(value || "")
    .split(" ")
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(" ");

const getMenuEngineeringCategoryRank = (row) => {
  if (row.price == null) return 4;
  const category = String(row.category || row.itemCategory || row.type || "").toLowerCase();
  const name = String(row.item || row.recipeName || row.displayName || row.shortName || "").toLowerCase();
  if (category.includes("entree") || category.includes("entrée") || row.price >= 9) return 1;
  if (category.includes("side") || (row.price < 9 && !/cookie|cake|dessert|lassi|beverage|drink|chips|bar|brownie|fruit leather/i.test(name))) return 2;
  if (category.includes("extension") || /cookie|cake|dessert|lassi|beverage|drink|chips|bar|brownie|fruit leather/i.test(name)) return 3;
  return 4;
};

export const smartMenuEngineeringSort = (a, b) => {
  const categoryCompare = getMenuEngineeringCategoryRank(a) - getMenuEngineeringCategoryRank(b);
  if (categoryCompare !== 0) return categoryCompare;
  const stationCompare = String(a.station || "").localeCompare(String(b.station || ""));
  if (stationCompare !== 0) return stationCompare;
  return String(a.item || "").localeCompare(String(b.item || ""));
};

