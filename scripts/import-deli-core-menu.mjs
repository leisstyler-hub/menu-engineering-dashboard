import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import xlsx from "xlsx";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = join(root, "docs", "menu-data", "Deli Core Menu Item Index - Costed Scope.csv");
const descriptionPath = join(root, "docs", "ssmt", "SEA Standard Menu Template (1).xlsx");
const menuItemsPath = join(root, "src", "data", "menuItems.json");
const rawArchivePath = join(root, "public", "data", "deli-core-raw-2026-09-30.json");
const publicRawArchivePath = "/data/deli-core-raw-2026-09-30.json";
const sourceVersion = "deli-core-2026-09-30";
const targetMenu = "AMZ: Deli Core";
const targetStations = new Set(["Curated Sandwiches", "Regional Spotlights - Deli"]);
const omittedMrns = new Set(["134362.15", "141826"]);

const allergenColumns = [
  "Egg", "Fish", "Milk", "Peanuts", "Sesame", "Shellfish - Crustacean", "Soy", "Tree Nuts", "Wheat",
  "Alcohol", "Beef", "Buckwheat", "Celery", "Garlic", "Gluten", "Lupin", "MSG", "Mushroom", "Mustard",
  "Onion", "Orange", "Pork", "Poultry", "Shellfish - Mollusk", "Strawberry", "Sulphites", "Tomato",
];

const nutritionMap = {
  "KCAL": "calories", "FAT (g)": "totalFatG", "SatFAT (g)": "saturatedFatG", "TransFAT (g)": "transFatG",
  "Sat+TransFAT (g)": "satPlusTransFatG", "CHO (g)": "carbsG", "Total Sugars (g)": "sugarsG",
  "Added Sugars (g)": "addedSugarsG", "CHOL (mg)": "cholesterolMg", "PRO (g)": "proteinG",
  "DFIB (g)": "fiberG", "Na (mg)": "sodiumMg", "K (mg)": "potassiumMg", "Ca (mg)": "calciumMg",
  "Fe (mg)": "ironMg", "Vit D (mcg)": "vitaminDMcg", "Vit B12 (ug)": "vitaminB12Mcg",
  "Vit B12 (µg)": "vitaminB12Mcg", "Vit C (mg)": "vitaminCMg", "Caffeine (mg)": "caffeineMg",
  "% Cal Fat": "percentCaloriesFat", "% Cal Pro": "percentCaloriesProtein", "% Cal CHO": "percentCaloriesCarbs",
  "Sodium (% Of DV)": "sodiumPercentDv", "Total Carbohydrate (% Of DV)": "carbsPercentDv",
  "Dietary Fiber (% Of DV)": "fiberPercentDv", "Iron (% Of DV)": "ironPercentDv",
  "Added Sugar (% Of DV)": "addedSugarPercentDv", "Potassium (% Of DV)": "potassiumPercentDv",
  "Calcium (% Of DV)": "calciumPercentDv",
};

function text(value) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/^'/, "").trim();
}

function number(value) {
  const match = text(value).replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

function percent(value) {
  const parsed = number(value);
  return parsed === null ? null : parsed / 100;
}

function round(value, places = 3) {
  return value === null ? null : Number(value.toFixed(places));
}

function normalize(value) {
  return text(value).normalize("NFKC").toLowerCase().replace(/[^a-z0-9.]+/g, " ").replace(/\s+/g, " ").trim();
}

function titleCase(value) {
  return text(value)
    .toLowerCase()
    .replace(/\b([a-z])/g, (match) => match.toUpperCase())
    .replace(/\b(And|Of|With|In|On|The)\b/g, (match) => match.toLowerCase());
}

function nonEmptyRaw(row) {
  return Object.fromEntries(Object.entries(row).filter(([, value]) => text(value)));
}

function sheetRows(workbook, sheetName, headerRow = 1) {
  const sheet = workbook.Sheets[sheetName];
  return sheet ? xlsx.utils.sheet_to_json(sheet, { range: headerRow - 1, defval: "", raw: true }) : [];
}

function descriptionMap(workbook, sheetName, headerRow) {
  const rows = sheetRows(workbook, sheetName, headerRow);
  return new Map(rows.map((row) => [text(row.MRN ?? row.mrn), text(row.DESCRIPTION ?? row.description)]).filter(([mrn, description]) => mrn && description));
}

function buildDescriptionLookup(workbook) {
  const preferred = [
    { sheetName: "DELI CORE", headerRow: 3 },
    { sheetName: "CAFE EXPRESS", headerRow: 1 },
    { sheetName: "Curated Sandwich", headerRow: 1 },
  ];
  const maps = preferred.map(({ sheetName, headerRow }) => ({ sheetName, rows: descriptionMap(workbook, sheetName, headerRow) }));
  return (mrn) => {
    for (const source of maps) {
      const description = source.rows.get(mrn);
      if (description) return { description, sheetName: source.sheetName };
    }
    return { description: "", sheetName: "" };
  };
}

function allergenDetails(row) {
  return Object.fromEntries(allergenColumns.map((column) => [column, text(row[column])]).filter(([, value]) => value));
}

function allergenList(row, details) {
  const values = new Set();
  for (const match of text(row["Allergens."]).matchAll(/Contains\s+([^,]+)/gi)) values.add(text(match[1]));
  for (const [name, value] of Object.entries(details)) {
    if (/^(yes|at risk)|contains/i.test(value)) values.add(name);
  }
  return [...values].filter(Boolean).sort();
}

function nutrition(row) {
  const result = {};
  for (const [source, destination] of Object.entries(nutritionMap)) {
    const value = number(row[source]);
    if (value !== null) result[destination] = value;
  }
  return result;
}

function numericFields(row, predicate) {
  const result = {};
  for (const key of Object.keys(row)) {
    if (!predicate(key)) continue;
    const value = number(row[key]);
    if (value !== null) result[key] = value;
  }
  return result;
}

function existingDeliRows(rows) {
  return new Map(rows.filter((row) => row.menu === targetMenu).map((row) => [text(row.mrn), row]));
}

const existingRows = JSON.parse(readFileSync(menuItemsPath, "utf8").replace(/^\uFEFF/, ""));
const currentDeliByMrn = existingDeliRows(existingRows);
const sourceWorkbook = xlsx.readFile(sourcePath, { raw: true });
const sourceRows = sheetRows(sourceWorkbook, sourceWorkbook.SheetNames[0], 1)
  .filter((row) => text(row["Menu Name"]) === targetMenu)
  .filter((row) => targetStations.has(text(row.Station)))
  .filter((row) => !omittedMrns.has(text(row["Recipe Number"])))
  .filter((row) => number(row["Menu Item Cost"]) !== null);
const descriptionWorkbook = xlsx.readFile(descriptionPath, { raw: true });
const findDescription = buildDescriptionLookup(descriptionWorkbook);

if (sourceRows.length !== 41) throw new Error(`Expected 41 costed Deli Core rows, found ${sourceRows.length}.`);

let nextId = Math.max(0, ...existingRows.map((row) => Number(row.id) || 0)) + 1;
const importedRows = sourceRows.map((row) => {
  const mrn = text(row["Recipe Number"]);
  const current = currentDeliByMrn.get(mrn);
  const itemCost = number(row["Menu Item Cost"]);
  const wastePct = percent(row["Waste %"]);
  const itemNutrition = nutrition(row);
  const details = allergenDetails(row);
  const ssmt = findDescription(mrn);
  if (!ssmt.description) throw new Error(`No SSMT description found for Deli Core MRN ${mrn}.`);
  const displayName = titleCase(row["Short Name"] || row["Recipe Name"]);
  const id = current?.id ?? nextId++;

  return {
    id,
    item_key: `mrn:${targetMenu.toLowerCase()}:${mrn}`,
    menu: targetMenu,
    menuType: text(row["Menu Type"]),
    week: text(row.Week),
    dayOfWeekDate: text(row["Day of Week/Date"]),
    meal: text(row["Meal Period"] || row["Meal Category"]),
    mealCategory: text(row["Meal Category"]),
    station: text(row.Station),
    item: displayName,
    mrn,
    portion: text(row["Menu Portion Size"]),
    price: number(row["Sell Price"]),
    itemCost,
    wastePct,
    trueCost: round(itemCost * (1 + (wastePct || 0))),
    forecast: current?.forecast ?? 100,
    menuPrefix: "AMZ",
    menuBaseName: "Deli Core",
    recipeName: text(row["Recipe Name"]),
    recipePrefix: text(row["Recipe Name"]).split(":")[0] || "",
    recipeSource: text(row["Recipe Source."]),
    displayName,
    shortName: displayName,
    portionGrams: number(row["Menu Portion Weight(g)"]),
    portionOz: number(row["Menu Portion Weight(oz)"]),
    category: "entree",
    plannerSelectorGroup: "",
    menuItemRole: "entree",
    selectionBehavior: "entree",
    requiresSides: false,
    canBeSideChoice: false,
    isALaCarte: false,
    enticingDescription: ssmt.description,
    menuWorksDescription: text(row["Enticing Description"]),
    secondaryDescription: text(row["Enticing Description"]),
    primaryDescriptionSource: `ssmt-reference:${ssmt.sheetName}`,
    ingredients: text(row.Ingredients),
    ingredientsCommonName: text(row["Ingredients Common Name"]),
    recipeCategory: text(row["Recipe Category."]),
    recipeProductionArea: text(row["Recipe Production Area."]),
    productionArea: text(row["Production Area"]),
    menuItemNotes: text(row["Menu Item Notes"]),
    recipeNotes: text(row["Recipe Notes"]),
    diet: text(row.Diet),
    dietDescription: text(row["Diet Description"]),
    compassNutritionWellness: text(row["Compass Nutrition & Wellness ."]),
    compassIngredientRecipe: text(row["Compass-Ingredient Recipe."]),
    menuCycleCategories: text(row["Menu Cycle Categories."]),
    packagedLabels: text(row["Packaged Labels."]),
    webtritionExport: text(row["Webtrition Export ."]),
    createdDate: text(row["Created Date"]),
    createdBy: text(row["Created By"]),
    lastModifiedDate: text(row["Last Modified Date"]),
    lastModifiedBy: text(row["Last Modified By"]),
    systemUpdatedDate: text(row["System Updated Date"]),
    preparationTimeMins: number(row["Preparation Time (mins)"]),
    cookingTimeMins: number(row["Cooking Time (mins)"]),
    yield: number(row.Yield),
    minBatch: number(row["Min Batch"]),
    maximumProductionAmount: number(row["Maximum Production Amount"]),
    recipeSets: text(row["Recipe Sets"]),
    gtin: text(row.GTIN),
    adjustedWeight: text(row["Adjusted Weight"]),
    manualNutrition: text(row["Manual Nutrition"]),
    picture: text(row.Picture),
    suppliedDish: text(row["Supplied Dish"]),
    subRecipeUsage: number(row["Sub-Recipe Usage"]),
    productAttributeDiverseSuppliers: text(row["Product Attribute: Diverse Suppliers"]),
    eligibleForPackageLabels: text(row["Eligible for Package Labels"]),
    menuUtensil: text(row["Menu Utensil"]),
    menuTexture: text(row["Menu Texture"]),
    corporateRetailAcceptabilityFactor: percent(row["Corporate Retail Acceptability Factor"]),
    choiceAcceptabilityFactor: percent(row["Choice Acceptability Factor"]),
    mealCategoryAcceptabilityFactor: percent(row["Meal Category Acceptability Factor"]),
    dataAccess: text(row["Data Access"]),
    menuItemUsage: number(row["Menu Item Usage"]),
    mainNonSelect: text(row["Main/Non-Select"]),
    allergenSummary: text(row["Allergens."]),
    allergens: allergenList(row, details),
    allergenDetails: details,
    compassFit: text(row["Compass Fit."]),
    exceedsSodiumLimit: text(row["Exceeds Sodium Limit."]),
    ghgEmissions: text(row["GHG Emissions."]),
    madeFromSingleSource: text(row["Made from Single Source."]),
    veganTag: text(row["Vegan Tag."]),
    vegetarianTag: text(row["Vegetarian Tag."]),
    dataSource: "menuworks-deli-core-import",
    sourceDataVersion: sourceVersion,
    sourceFileName: `${basename(sourcePath)} + ${basename(descriptionPath)}`,
    sourceTruthName: displayName,
    calories: itemNutrition.calories ?? null,
    proteinG: itemNutrition.proteinG ?? null,
    sodiumMg: itemNutrition.sodiumMg ?? null,
    carbsG: itemNutrition.carbsG ?? null,
    fiberG: itemNutrition.fiberG ?? null,
    sugarsG: itemNutrition.sugarsG ?? null,
    addedSugarsG: itemNutrition.addedSugarsG ?? null,
    totalFatG: itemNutrition.totalFatG ?? null,
    saturatedFatG: itemNutrition.saturatedFatG ?? null,
    transFatG: itemNutrition.transFatG ?? null,
    cholesterolMg: itemNutrition.cholesterolMg ?? null,
    potassiumMg: itemNutrition.potassiumMg ?? null,
    calciumMg: itemNutrition.calciumMg ?? null,
    ironMg: itemNutrition.ironMg ?? null,
    nutrition: itemNutrition,
    nutritionDailyValues: numericFields(row, (key) => key.includes("(% Of DV)") || key.includes("(% of Canadian DV)")),
    mealPatternContributions: numericFields(row, (key) => /\((?:Oz Eq|Cup)\)$/.test(key) || key === "Weekly BPL (Cup)"),
    legacyNames: [...new Set([...(current?.legacyNames || []), text(current?.item), text(current?.displayName), displayName].filter(Boolean))],
    menuWorksRaw: {
      "Menu Name": targetMenu,
      Station: text(row.Station),
      "Recipe Number": mrn,
      "Recipe Name": text(row["Recipe Name"]),
      "Short Name": text(row["Short Name"]),
      "Last Modified Date": text(row["Last Modified Date"]),
      "System Updated Date": text(row["System Updated Date"]),
    },
    menuWorksRawArchivePath: publicRawArchivePath,
  };
});

const importedMrns = new Set(importedRows.map((row) => row.mrn));
if (importedMrns.size !== importedRows.length) throw new Error("Deli Core import contains duplicate MRNs.");
for (const mrn of omittedMrns) if (importedMrns.has(mrn)) throw new Error(`Omitted MRN ${mrn} entered the import.`);

const retainedRows = existingRows.filter((row) => row.menu !== targetMenu || !importedMrns.has(text(row.mrn)));
const mergedRows = [...retainedRows, ...importedRows];

writeFileSync(menuItemsPath, `${JSON.stringify(mergedRows, null, 2)}\n`);
mkdirSync(dirname(rawArchivePath), { recursive: true });
writeFileSync(rawArchivePath, `${JSON.stringify(sourceRows.map((row) => ({
  sourceDataVersion: sourceVersion,
  mrn: text(row["Recipe Number"]),
  menu: targetMenu,
  station: text(row.Station),
  raw: nonEmptyRaw(row),
})), null, 2)}\n`);

console.log(JSON.stringify({
  menu: targetMenu,
  importedRows: importedRows.length,
  stations: Object.fromEntries([...targetStations].map((station) => [station, importedRows.filter((row) => row.station === station).length])),
  omittedMrns: [...omittedMrns],
  fallbackDescriptionMrns: importedRows.filter((row) => row.primaryDescriptionSource !== "ssmt-reference:DELI CORE").map((row) => row.mrn),
  outputRows: mergedRows.length,
  rawArchivePath,
}, null, 2));
