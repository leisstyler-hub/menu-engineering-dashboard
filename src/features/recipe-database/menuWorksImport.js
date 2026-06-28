import * as XLSX from "xlsx";

import { titleCase } from "../../shared/formatting.js";

export const MENUWORKS_IMPORT_INITIATION_CODE = "410410";
export const MENUWORKS_IMPORT_CODE_HINT = "<Six Digits>";

const MENUWORKS_ALLERGEN_COLUMNS = [
  "Egg",
  "Fish",
  "Milk",
  "Peanuts",
  "Sesame",
  "Shellfish - Crustacean",
  "Soy",
  "Tree Nuts",
  "Wheat",
  "Alcohol",
  "Beef",
  "Buckwheat",
  "Celery",
  "Garlic",
  "Gluten",
  "Lupin",
  "MSG",
  "Mushroom",
  "Mustard",
  "Onion",
  "Orange",
  "Pork",
  "Poultry",
  "Shellfish - Mollusk",
  "Strawberry",
  "Sulphites",
  "Tomato",
];

export function coveragePct(value, total) {
  return total ? Math.round((value / total) * 100) : 0;
}

export function getMenuDataQuality(rows = []) {
  const total = rows.length;
  const priced = rows.filter((row) => row.price != null && row.price > 0).length;
  const costed = rows.filter((row) => row.trueCost != null).length;
  const described = rows.filter((row) => row.enticingDescription || row.ingredientsCommonName).length;
  const allergenRows = rows.filter((row) => row.allergens?.length || row.allergenSummary || Object.values(row.allergenDetails || {}).some(Boolean)).length;
  const complimentary = rows.filter((row) => row.price == null || row.price <= 0).length;
  const uploaded = rows.filter((row) => /upload|truth|enhanced/i.test(String(row.dataSource || ""))).length;
  return {
    total,
    priced,
    costed,
    described,
    allergenRows,
    complimentary,
    uploaded,
    priceCoverage: coveragePct(priced, total),
    costCoverage: coveragePct(costed, total),
    descriptionCoverage: coveragePct(described, total),
    allergenCoverage: coveragePct(allergenRows, total),
    uploadedCoverage: coveragePct(uploaded, total),
  };
}

function textValue(row, ...keys) {
  for (const key of keys) {
    const value = row?.[key];
    if (value !== null && value !== undefined && String(value).trim()) return String(value).trim();
  }
  return "";
}

function stripRecipePrefix(value = "") {
  return String(value).replace(/^(AMZ|EUR|RA|AMZ\+RA):\s*/i, "").trim();
}

function cleanMrn(value = "") {
  return String(value || "").replace(/^'/, "").trim();
}

function cleanNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(String(value).replace(/[$,%]/g, ""));
  return Number.isFinite(number) ? number : null;
}

function normalizeWastePct(value) {
  if (value == null) return null;
  return value > 1 ? value / 100 : value;
}

function menuBaseName(menu = "") {
  return stripRecipePrefix(menu);
}

function menuPrefix(menu = "") {
  const match = String(menu || "").match(/^([^:]+):/);
  return match ? match[1] : "";
}

function inferImportedCategory(row, price) {
  const notes = textValue(row, "Menu Item Notes").toLowerCase();
  const recipeCategory = textValue(row, "Recipe Category.", "Recipe Category").toLowerCase();
  const productionArea = textValue(row, "Recipe Production Area.", "Recipe Production Area").toLowerCase();
  const station = textValue(row, "Station", "Station.").toLowerCase();
  const itemText = `${textValue(row, "Recipe Name")} ${textValue(row, "Short Name")} ${recipeCategory}`.toLowerCase();

  if (price == null) return "subRecipe";
  if (/extension/.test(notes) || /cookie|cake|dessert|pastry|beverage|smoothie|chips|salsa|guacamole|queso/.test(itemText)) return "extension";
  if (/a la carte|side choice/.test(notes) || /hot side/.test(productionArea) || /starch\/grain|vegetable/.test(recipeCategory)) return "side";
  if (/entree/.test(notes) || /main entree|breakfast|sandwich\/wrap/.test(recipeCategory) || price >= 9) return "entree";
  if (/side/.test(station)) return "side";
  return price >= 5 ? "entree" : "side";
}

function parseAllergenDetails(row) {
  const allergenDetails = {};
  const allergens = [];

  MENUWORKS_ALLERGEN_COLUMNS.forEach((allergen) => {
    const value = textValue(row, allergen);
    if (!value || value.toLowerCase() === "no") return;
    allergenDetails[allergen] = value;
    allergens.push(value.toLowerCase().includes("at risk") ? `${allergen} (At Risk)` : allergen);
  });

  const summary = textValue(row, "Allergens.", "Allergens");
  if (summary && !allergens.length) {
    summary.split(",").map((value) => value.replace(/^contains\s+/i, "").trim()).filter(Boolean).forEach((allergen) => {
      allergenDetails[allergen] = "Yes";
      allergens.push(allergen);
    });
  }

  return { allergenSummary: summary || null, allergenDetails, allergens };
}

function parseImportedMenuWorksRow(row, index) {
  const menu = textValue(row, "Menu Name");
  const recipeName = textValue(row, "Recipe Name", "Menu Item");
  if (!menu || !recipeName || !/^(AMZ|AMZ\+RA|EUR|RA):/i.test(menu)) return null;

  const price = cleanNumber(textValue(row, "Sell Price", "Price"));
  const itemCost = cleanNumber(textValue(row, "Menu Item Cost", "Item Cost"));
  const wastePct = normalizeWastePct(cleanNumber(textValue(row, "Waste %", "Waste")));
  const trueCost = cleanNumber(textValue(row, "Item + Waste Cost", "True Cost")) ?? (itemCost == null ? null : Number((itemCost * (1 + (wastePct || 0))).toFixed(4)));
  const displayName = titleCase(textValue(row, "Short Name") || stripRecipePrefix(recipeName));
  const { allergens, allergenDetails, allergenSummary } = parseAllergenDetails(row);

  return {
    id: index,
    menu,
    meal: textValue(row, "Meal", "Meal Period"),
    station: textValue(row, "Station", "Station.") || menuBaseName(menu),
    item: displayName,
    mrn: cleanMrn(textValue(row, "Recipe Number", "MRN")),
    portion: textValue(row, "Menu Portion Size", "Portion"),
    price,
    itemCost,
    wastePct,
    trueCost,
    forecast: 0,
    menuPrefix: menuPrefix(menu),
    menuBaseName: menuBaseName(menu),
    recipeName,
    recipePrefix: menuPrefix(recipeName),
    recipeSource: textValue(row, "Recipe Source."),
    displayName,
    shortName: displayName,
    portionOz: cleanNumber(textValue(row, "Menu Portion Weight(oz)")),
    category: inferImportedCategory(row, price),
    enticingDescription: textValue(row, "Enticing Description"),
    dietDescription: textValue(row, "Diet Description"),
    dietTags: [textValue(row, "Diet"), textValue(row, "Vegan Tag."), textValue(row, "Vegetarian Tag."), textValue(row, "Compass Fit.")].filter(Boolean).join(", "),
    ingredients: textValue(row, "Ingredients"),
    ingredientsCommonName: textValue(row, "Ingredients Common Name"),
    recipeCategory: textValue(row, "Recipe Category."),
    recipeProductionArea: textValue(row, "Recipe Production Area."),
    productionArea: textValue(row, "Production Area"),
    menuItemNotes: textValue(row, "Menu Item Notes"),
    allergenSummary,
    allergens,
    allergenDetails,
    compassFit: textValue(row, "Compass Fit.") || null,
    exceedsSodiumLimit: textValue(row, "Exceeds Sodium Limit.") || null,
    ghgEmissions: textValue(row, "GHG Emissions.") || null,
    madeFromSingleSource: textValue(row, "Made from Single Source.") || null,
    veganTag: textValue(row, "Vegan Tag.") || null,
    vegetarianTag: textValue(row, "Vegetarian Tag.") || null,
    dataSource: "menuworks-user-upload",
  };
}

function baseRowKey(row) {
  return String([row.menu, row.station, row.mrn, row.item, row.portion].join("|")).toLowerCase();
}

function buildComparableMap(rows) {
  const counts = new Map();
  const result = new Map();
  rows.forEach((row) => {
    const base = baseRowKey(row);
    const occurrence = counts.get(base) || 0;
    counts.set(base, occurrence + 1);
    result.set(`${base}|occurrence:${occurrence}`, row);
  });
  return result;
}

export async function buildMenuWorksImportReview(file, currentRows = []) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets.Report || workbook.Sheets[workbook.SheetNames[0]];
  const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: null });
  const importedRows = rawRows.map((row, index) => parseImportedMenuWorksRow(row, index)).filter(Boolean);

  if (!importedRows.length) {
    throw new Error("No MenuWorks menu item rows were detected. Use the Menu Item Index or MenuWorks export format.");
  }

  const importedMenuNames = Array.from(new Set(importedRows.map((row) => row.menu).filter(Boolean)));
  const currentRowsInScope = currentRows.filter((row) => importedMenuNames.includes(row.menu));
  const currentByKey = buildComparableMap(currentRowsInScope);
  const importedByKey = buildComparableMap(importedRows);
  const newItems = [];
  const removedItems = [];
  const changedItems = [];
  const costIncreases = [];
  const costDecreases = [];
  const priceChanges = [];

  importedByKey.forEach((row, key) => {
    const current = currentByKey.get(key);
    if (!current) {
      newItems.push(row);
      return;
    }

    const priceChanged = current.price !== row.price;
    const costChanged = current.trueCost !== row.trueCost;
    const itemCostChanged = current.itemCost !== row.itemCost;
    const portionChanged = current.portion !== row.portion;
    const detailChanged =
      current.item !== row.item ||
      current.station !== row.station ||
      current.category !== row.category ||
      current.enticingDescription !== row.enticingDescription ||
      current.ingredientsCommonName !== row.ingredientsCommonName ||
      JSON.stringify(current.allergenDetails || {}) !== JSON.stringify(row.allergenDetails || {});

    if (priceChanged || costChanged || itemCostChanged || portionChanged || detailChanged) {
      const change = { before: current, after: row };
      changedItems.push(change);
      if (costChanged && row.trueCost > current.trueCost) costIncreases.push(change);
      if (costChanged && row.trueCost < current.trueCost) costDecreases.push(change);
      if (priceChanged) priceChanges.push(change);
    }
  });

  currentByKey.forEach((row, key) => {
    if (!importedByKey.has(key)) removedItems.push(row);
  });

  const currentMenus = new Set(currentRows.map((row) => row.menu));
  const newMenus = Array.from(new Set(importedRows.map((row) => row.menu))).filter((menu) => !currentMenus.has(menu));
  const comparableBeforeCost = changedItems.reduce((sum, change) => sum + (change.before.trueCost || 0), 0);
  const comparableAfterCost = changedItems.reduce((sum, change) => sum + (change.after.trueCost || 0), 0);
  const comparableCostChangePct = comparableBeforeCost ? ((comparableAfterCost - comparableBeforeCost) / comparableBeforeCost) * 100 : null;
  const currentTotalCost = currentRowsInScope.reduce((sum, row) => sum + (row.trueCost || 0), 0);
  const importedTotalCost = importedRows.reduce((sum, row) => sum + (row.trueCost || 0), 0);
  const totalCostChangePct = currentTotalCost ? ((importedTotalCost - currentTotalCost) / currentTotalCost) * 100 : null;

  return {
    importedRows,
    importedMenuNames,
    newItems,
    removedItems,
    changedItems,
    costIncreases,
    costDecreases,
    priceChanges,
    newMenus,
    fileName: file.name,
    comparableCostChangePct,
    totalCostChangePct,
    importQuality: getMenuDataQuality(importedRows),
  };
}
