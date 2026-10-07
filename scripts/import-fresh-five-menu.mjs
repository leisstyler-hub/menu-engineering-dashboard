import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import xlsx from "xlsx";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourceArgument = process.argv.find((argument) => argument.startsWith("--source="));
const sourcePath = resolve(sourceArgument?.slice("--source=".length) || "");
if (!sourceArgument) throw new Error("Fresh Five import requires --source=<MenuWorks Menu Item CSV path>.");

const menuItemsPath = join(root, "src", "data", "menuItems.json");
const rawArchivePath = join(root, "public", "data", "fresh-five-raw-2026-10-06.json");
const publicRawArchivePath = "/data/fresh-five-raw-2026-10-06.json";
const sourceVersion = "fresh-five-2026-10-06";
const targetMenu = "AMZ: Fresh Five";
const expectedRows = 21;

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

const requiredColumns = [
  "Menu Name", "Recipe Number", "Recipe Name", "Short Name", "Station", "Menu Portion Size",
  "Menu Item Cost", "Waste %", "Sell Price", "Enticing Description", "Ingredients",
  "Ingredients Common Name", "KCAL", "PRO (g)", "Na (mg)",
];

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

function round(value, places = 4) {
  return value === null ? null : Number(value.toFixed(places));
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

function numericFields(row, predicate) {
  const result = {};
  for (const key of Object.keys(row)) {
    if (!predicate(key)) continue;
    const value = number(row[key]);
    if (value !== null) result[key] = value;
  }
  return result;
}

function nutrition(row) {
  const result = {};
  for (const [source, destination] of Object.entries(nutritionMap)) {
    const value = number(row[source]);
    if (value !== null) result[destination] = value;
  }
  return result;
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

function currentRowKey(row) {
  return [text(row.mrn), text(row.station).toLowerCase(), text(row.portion).toLowerCase()].join("|");
}

const existingRows = JSON.parse(readFileSync(menuItemsPath, "utf8").replace(/^\uFEFF/, ""));
const currentFreshFive = existingRows.filter((row) => row.menu === targetMenu);
const currentByKey = new Map(currentFreshFive.map((row) => [currentRowKey(row), row]));
const sourceWorkbook = xlsx.readFile(sourcePath, { raw: true });
const sourceSheet = sourceWorkbook.Sheets[sourceWorkbook.SheetNames[0]];
const allSourceRows = xlsx.utils.sheet_to_json(sourceSheet, { defval: "", raw: true });
const sourceRows = allSourceRows
  .filter((row) => text(row["Menu Name"]) === targetMenu)
  .filter((row) => text(row["Recipe Number"]) && text(row["Recipe Name"]));

if (sourceRows.length !== expectedRows) throw new Error(`Expected ${expectedRows} Fresh Five rows, found ${sourceRows.length}.`);
const sourceHeaders = new Set(Object.keys(sourceRows[0] || {}));
const missingColumns = requiredColumns.filter((column) => !sourceHeaders.has(column));
if (missingColumns.length) throw new Error(`Fresh Five source is missing required columns: ${missingColumns.join(", ")}.`);

for (const row of sourceRows) {
  const missingValues = requiredColumns.filter((column) => !text(row[column]));
  if (missingValues.length) {
    throw new Error(`Fresh Five MRN ${text(row["Recipe Number"])} is missing required values: ${missingValues.join(", ")}.`);
  }
}

let nextId = Math.max(0, ...existingRows.map((row) => Number(row.id) || 0)) + 1;
const importedRows = sourceRows.map((row) => {
  const mrn = text(row["Recipe Number"]);
  const station = text(row.Station);
  const portion = text(row["Menu Portion Size"]);
  const current = currentByKey.get([mrn, station.toLowerCase(), portion.toLowerCase()].join("|"));
  const id = current?.id ?? nextId++;
  const itemCost = number(row["Menu Item Cost"]);
  const wastePct = percent(row["Waste %"]);
  const itemNutrition = nutrition(row);
  const details = allergenDetails(row);
  const allergens = allergenList(row, details);
  const displayName = titleCase(row["Short Name"] || row["Recipe Name"]);
  const allergenSummary = text(row["Allergens."]) || allergens.map((allergen) => `Contains ${allergen}`).join(",");

  return {
    id,
    item_key: current?.item_key || `row:${id}`,
    menu: targetMenu,
    menuType: text(row["Menu Type"]),
    week: text(row.Week),
    dayOfWeekDate: text(row["Day of Week/Date"]),
    meal: text(row["Meal Period"] || row["Meal Category"]),
    mealCategory: text(row["Meal Category"]),
    station,
    item: displayName,
    mrn,
    portion,
    price: number(row["Sell Price"]),
    itemCost,
    wastePct,
    trueCost: round(itemCost * (1 + (wastePct || 0))),
    forecast: current?.forecast ?? 100,
    menuPrefix: "AMZ",
    menuBaseName: "Fresh Five",
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
    selectionBehavior: "entree-no-sides-required",
    requiresSides: false,
    canBeSideChoice: false,
    isALaCarte: false,
    enticingDescription: text(row["Enticing Description"]),
    menuWorksDescription: text(row["Enticing Description"]),
    secondaryDescription: text(row["Enticing Description"]),
    primaryDescriptionSource: "menuworks-fresh-five-import",
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
    allergenSummary,
    allergens,
    allergenDetails: details,
    compassFit: text(row["Compass Fit."]),
    exceedsSodiumLimit: text(row["Exceeds Sodium Limit."]),
    ghgEmissions: text(row["GHG Emissions."]),
    madeFromSingleSource: text(row["Made from Single Source."]),
    veganTag: text(row["Vegan Tag."]),
    vegetarianTag: text(row["Vegetarian Tag."]),
    dataSource: "menuworks-fresh-five-import",
    sourceDataVersion: sourceVersion,
    sourceFileName: basename(sourcePath),
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
      Station: station,
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
if (importedMrns.size !== importedRows.length) throw new Error("Fresh Five import contains duplicate MRNs.");
if (importedRows.some((row) => !row.price || row.itemCost === null || row.trueCost === null)) {
  throw new Error("Fresh Five import contains an item without complete price or cost data.");
}
if (importedRows.some((row) => !row.enticingDescription || !row.ingredients || !row.ingredientsCommonName)) {
  throw new Error("Fresh Five import contains an item without description or ingredient metadata.");
}
if (importedRows.some((row) => row.calories === null || row.proteinG === null || row.sodiumMg === null)) {
  throw new Error("Fresh Five import contains an item without required nutrition metadata.");
}

const retainedRows = existingRows.filter((row) => row.menu !== targetMenu);
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

const marginWarnings = importedRows
  .filter((row) => row.trueCost > row.price)
  .map((row) => ({ mrn: row.mrn, item: row.item, price: row.price, trueCost: row.trueCost }));

console.log(JSON.stringify({
  menu: targetMenu,
  sourceRows: sourceRows.length,
  ignoredFooterRows: allSourceRows.length - sourceRows.length,
  replacedFallbackRows: currentFreshFive.length,
  importedRows: importedRows.length,
  preservedItemKeys: importedRows.filter((row) => row.item_key.startsWith("row:")).length,
  stations: Object.fromEntries([...new Set(importedRows.map((row) => row.station))].sort().map((station) => [station, importedRows.filter((row) => row.station === station).length])),
  marginWarnings,
  outputRows: mergedRows.length,
  rawArchivePath,
}, null, 2));
