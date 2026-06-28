import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const sourcePath = join(root, "src", "data", "menuItems.json");
const summaryPath = join(root, "src", "data", "dashboardSummary.json");

const PROTEIN_PATTERN = /\b(beef|chicken|pork|turkey|salmon|fish|cod|shrimp|tuna|meatballs?|steak|brisket|carnitas|chorizo|bacon|sausage|eggs?|tofu|tempeh|paneer|lentils?|beans?|chickpeas?|falafel|poultry|ham|lamb)\b/i;
const COMPLIMENTARY_PATTERN = /sauce|dressing|dip|salsa|aioli|chutney|relish|gravy|marinade|vinaigrette|condiment|garnish|pickle|seasoning|spice|rub/i;

function countBy(rows, getKey) {
  return rows.reduce((acc, row) => {
    const key = getKey(row) || "Unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function percentOf(value, total) {
  return total ? Math.round((value / total) * 100) : 0;
}

function getDietType(item) {
  const vegan = String(item.veganTag || item.dietTags || "").toLowerCase().includes("vegan");
  const vegetarian = String(item.vegetarianTag || item.dietTags || "").toLowerCase().includes("vegetarian");
  if (vegan) return "Vegan";
  if (vegetarian) return "Vegetarian";
  return "Regular";
}

function itemText(item) {
  return [
    item.item,
    item.displayName,
    item.recipeName,
    item.recipeCategory,
    item.category,
    item.menuItemNotes,
    item.ingredientsCommonName,
  ].filter(Boolean).join(" ");
}

function hasProteinSignal(item) {
  return PROTEIN_PATTERN.test(itemText(item));
}

function isComplimentaryItem(item) {
  const category = String(item.category || "").toLowerCase();
  if (category === "subrecipe") return true;
  return category === "extension" || COMPLIMENTARY_PATTERN.test(itemText(item));
}

function buildSummary(items) {
  const totalItems = items.length;
  const priceRequiredItems = items.filter((item) => !isComplimentaryItem(item));
  const pricedRequiredItems = priceRequiredItems.filter((item) => item.price != null && item.price > 0);
  const costedItems = items.filter((item) => item.trueCost != null).length;
  const recentItems = [...items]
    .sort((a, b) => Number(b.id || 0) - Number(a.id || 0))
    .slice(0, 10)
    .map((item) => ({
      id: item.id,
      item: item.item,
      menu: item.menu,
      station: item.station || "No station",
      price: item.price ?? null,
    }));

  return {
    generatedFrom: "src/data/menuItems.json",
    totalItems,
    menuCount: new Set(items.map((item) => item.menu).filter(Boolean)).size,
    costedItems,
    complimentaryItems: items.filter(isComplimentaryItem).length,
    priceRequiredItems: priceRequiredItems.length,
    pricedRequiredItems: pricedRequiredItems.length,
    proteinPriceGaps: priceRequiredItems.filter((item) => hasProteinSignal(item) && !(item.price != null && item.price > 0)).length,
    allergenCoverage: percentOf(items.filter((item) => item.allergens?.length || item.allergenSummary).length, totalItems),
    detailCoverage: percentOf(items.filter((item) => item.enticingDescription || item.ingredientsCommonName).length, totalItems),
    costCoverage: percentOf(costedItems, totalItems),
    priceCoverage: percentOf(pricedRequiredItems.length, priceRequiredItems.length),
    dietCounts: countBy(items, getDietType),
    categoryCounts: countBy(items, (item) => item.category || "Unclassified"),
    recentItems,
    topMenus: Object.entries(countBy(items, (item) => item.menu))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6),
  };
}

const items = JSON.parse(readFileSync(sourcePath, "utf8"));
const expected = `${JSON.stringify(buildSummary(items), null, 2)}\n`;

if (process.argv.includes("--write")) {
  writeFileSync(summaryPath, expected);
  console.log("Dashboard summary refreshed.");
} else {
  const actual = readFileSync(summaryPath, "utf8");
  if (actual !== expected) {
    throw new Error("Dashboard summary is stale. Run node scripts/verify-dashboard-summary.mjs --write.");
  }
  console.log("Dashboard summary verification passed.");
}
