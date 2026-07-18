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
    menuWorksDescription: textValue(row, "Enticing Description"),
    primaryDescriptionSource: "menuworks-import",
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
    calories: cleanNumber(textValue(row, "Calories", "Calories.", "Calories (kcal)", "Kcal")),
    protein_g: cleanNumber(textValue(row, "Protein (g)", "Protein", "Protein g")),
    sodium_mg: cleanNumber(textValue(row, "Sodium (mg)", "Sodium", "Sodium mg")),
    carbs_g: cleanNumber(textValue(row, "Carbohydrates (g)", "Carbohydrates", "Total Carbohydrate (g)")),
    fiber_g: cleanNumber(textValue(row, "Dietary Fiber (g)", "Fiber (g)", "Fiber")),
    sugars_g: cleanNumber(textValue(row, "Total Sugars (g)", "Sugars (g)", "Sugars")),
    added_sugars_g: cleanNumber(textValue(row, "Added Sugars (g)", "Added Sugars")),
    total_fat_g: cleanNumber(textValue(row, "Total Fat (g)", "Fat (g)", "Total Fat")),
    saturated_fat_g: cleanNumber(textValue(row, "Saturated Fat (g)", "Sat Fat (g)", "Saturated Fat")),
    trans_fat_g: cleanNumber(textValue(row, "Trans Fat (g)", "Trans Fat")),
    cholesterol_mg: cleanNumber(textValue(row, "Cholesterol (mg)", "Cholesterol")),
    potassium_mg: cleanNumber(textValue(row, "Potassium (mg)", "Potassium")),
    calcium_mg: cleanNumber(textValue(row, "Calcium (mg)", "Calcium")),
    iron_mg: cleanNumber(textValue(row, "Iron (mg)", "Iron")),
    sourceFileName: "",
    sourceTruthName: "MenuWorks upload",
    menuWorksRaw: row,
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

const REQUIRED_COLUMN_GROUPS = [
  ["Menu Name"],
  ["Recipe Name", "Menu Item"],
  ["Recipe Number", "MRN"],
  ["Sell Price", "Price"],
];

function headerSet(rawRows = []) {
  const headers = new Set();
  rawRows.forEach((row) => {
    Object.keys(row || {}).forEach((key) => headers.add(key));
  });
  return headers;
}

function buildPreflight(rawRows = [], importedRows = [], fileName = "") {
  const headers = headerSet(rawRows);
  const missingRequiredGroups = REQUIRED_COLUMN_GROUPS
    .filter((group) => !group.some((column) => headers.has(column)))
    .map((group) => group.join(" or "));
  const exactMrnTextRows = importedRows.filter((row) => /\.\d{2,}$/.test(String(row.mrn || ""))).length;
  const roundedMrnRiskRows = importedRows.filter((row) => {
    const raw = String(row.mrn || "");
    return /\.\d$/.test(raw);
  }).length;
  const missingMrnRows = importedRows.filter((row) => !row.mrn).length;
  const duplicateKeys = [];
  const seen = new Map();
  importedRows.forEach((row) => {
    const key = baseRowKey(row);
    seen.set(key, (seen.get(key) || 0) + 1);
  });
  seen.forEach((count, key) => {
    if (count > 1) duplicateKeys.push(key);
  });

  return {
    status: missingRequiredGroups.length ? "needs attention" : "ready",
    fileName,
    rawRows: rawRows.length,
    parsedRows: importedRows.length,
    columnsDetected: headers.size,
    requiredColumnsPresent: REQUIRED_COLUMN_GROUPS.length - missingRequiredGroups.length,
    missingRequiredColumns: missingRequiredGroups,
    exactMrnTextRows,
    roundedMrnRiskRows,
    missingMrnRows,
    duplicateKeys,
  };
}

function buildImportBatch(fileName, importedRows, importedMenuNames) {
  const safeName = String(fileName || "menuworks-upload").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "menuworks-upload";
  const importedAt = new Date().toISOString();
  return {
    id: `menuworks-${importedAt.slice(0, 10).replace(/-/g, "")}-${safeName.slice(0, 48)}`,
    sourceFileName: fileName || "MenuWorks upload",
    importedAt,
    rowCount: importedRows.length,
    menuCount: importedMenuNames.length,
  };
}

function curatedDescription(row = {}) {
  const description = textValue(row, "enticingDescription");
  if (!description || description === "No description loaded yet.") return "";
  return description;
}

function protectCuratedDescription(importedRow, currentRow) {
  const currentDescription = curatedDescription(currentRow);
  const importedDescription = textValue(importedRow, "enticingDescription");
  if (!currentDescription || !importedDescription || currentDescription === importedDescription) return importedRow;
  return {
    ...importedRow,
    enticingDescription: currentDescription,
    menuWorksDescription: importedDescription,
    primaryDescriptionSource: "source-truth-preserved",
  };
}

export async function buildMenuWorksImportReview(file, currentRows = []) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets.Report || workbook.Sheets[workbook.SheetNames[0]];
  const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: null });
  const parsedRows = rawRows.map((row, index) => parseImportedMenuWorksRow(row, index)).filter(Boolean);

  if (!parsedRows.length) {
    throw new Error("No MenuWorks menu item rows were detected. Use the Menu Item Index or MenuWorks export format.");
  }

  const importedMenuNames = Array.from(new Set(parsedRows.map((row) => row.menu).filter(Boolean)));
  const currentRowsInScope = currentRows.filter((row) => importedMenuNames.includes(row.menu));
  const currentByKey = buildComparableMap(currentRowsInScope);
  const protectedDescriptionChanges = [];
  const importedRows = parsedRows.map((row) => {
    const current = currentByKey.get(`${baseRowKey(row)}|occurrence:0`);
    const protectedRow = protectCuratedDescription(row, current);
    if (protectedRow !== row) {
      protectedDescriptionChanges.push({ before: current, after: row, accepted: protectedRow });
    }
    return {
      ...protectedRow,
      sourceFileName: file.name,
      sourceTruthName: "MenuWorks upload",
    };
  });
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
    protectedDescriptionChanges,
    hiddenAfterAccept: removedItems,
    newMenus,
    fileName: file.name,
    preflight: buildPreflight(rawRows, importedRows, file.name),
    importBatch: buildImportBatch(file.name, importedRows, importedMenuNames),
    comparableCostChangePct,
    totalCostChangePct,
    importQuality: getMenuDataQuality(importedRows),
  };
}
