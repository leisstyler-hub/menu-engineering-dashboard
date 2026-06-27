import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname } from "node:path";
import xlsx from "xlsx";

const SOURCE_FILE =
  process.argv[2] ||
  "C:/Users/leiss/Downloads/MenuWorks_Menu_Item_7ff8ac47-2d46-4000-80f0-0564db85892a.csv";
const OUTPUT_FILE = "src/data/menuItems.json";
const BASELINE_FILE = process.argv[3] || process.env.MENUWORKS_BASELINE_FILE || OUTPUT_FILE;
const SOURCE_VERSION = "menuworks-2026-06-26-7ff8ac47";
const RAW_ARCHIVE_FILE = "public/data/menuworks-raw-2026-06-26-7ff8ac47.json";
const RAW_ARCHIVE_PUBLIC_PATH = "/data/menuworks-raw-2026-06-26-7ff8ac47.json";
const HIBERNATE_EFFECTIVE_DATE = "2026-08-01";

const ALLERGEN_COLUMNS = [
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

const NUTRITION_MAP = {
  "KCAL": "calories",
  "FAT (g)": "totalFatG",
  "SatFAT (g)": "saturatedFatG",
  "TransFAT (g)": "transFatG",
  "Sat+TransFAT (g)": "satPlusTransFatG",
  "CHO (g)": "carbsG",
  "Total Sugars (g)": "sugarsG",
  "Added Sugars (g)": "addedSugarsG",
  "CHOL (mg)": "cholesterolMg",
  "PRO (g)": "proteinG",
  "DFIB (g)": "fiberG",
  "Na (mg)": "sodiumMg",
  "K (mg)": "potassiumMg",
  "Ca (mg)": "calciumMg",
  "Fe (mg)": "ironMg",
  "Vit D (mcg)": "vitaminDMcg",
  "Vit B12 (ug)": "vitaminB12Mcg",
  "Vit C (mg)": "vitaminCMg",
  "Caffeine (mg)": "caffeineMg",
  "% Cal Fat": "percentCaloriesFat",
  "% Cal Pro": "percentCaloriesProtein",
  "% Cal CHO": "percentCaloriesCarbs",
  "Sodium (% Of DV)": "sodiumPercentDv",
  "Total Carbohydrate (% Of DV)": "carbsPercentDv",
  "Dietary Fiber (% Of DV)": "fiberPercentDv",
  "Iron (% Of DV)": "ironPercentDv",
  "Added Sugar (% Of DV)": "addedSugarPercentDv",
  "Potassium (% Of DV)": "potassiumPercentDv",
  "Calcium (% Of DV)": "calciumPercentDv",
};

function cleanText(value) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/^'/, "").trim();
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8").replace(/^\uFEFF/, ""));
}

function numberValue(value) {
  const text = cleanText(value);
  if (!text || text === "-") return null;
  const numeric = Number(text.replace(/[,+$%]/g, "").replace(/\s+/g, ""));
  return Number.isFinite(numeric) ? numeric : null;
}

function percentValue(value) {
  const numeric = numberValue(value);
  return numeric === null ? null : numeric / 100;
}

function round(value, places = 3) {
  return value === null || value === undefined ? null : Number(value.toFixed(places));
}

function normalizeKey(value) {
  return cleanText(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function titleCase(value) {
  const text = cleanText(value);
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/\b([a-z])/g, (match) => match.toUpperCase())
    .replace(/\bAnd\b/g, "and")
    .replace(/\bOf\b/g, "of")
    .replace(/\bWith\b/g, "with")
    .replace(/\bIn\b/g, "in")
    .replace(/\bOn\b/g, "on")
    .replace(/\bThe\b/g, "the");
}

function normalizeMenuName(value) {
  const text = cleanText(value).replace(/\s+/g, " ");
  const replacements = new Map([
    ["AMZ+RA: Bowl INC", "AMZ+RA: Bowl Inc"],
    ["AMZ+RA: SMACO", "AMZ+RA: Smaco"],
    ["AMZ+RA: Panintoeca", "AMZ+RA: Paninoteca"],
    ["AMZ+RA: Panintoeca ", "AMZ+RA: Paninoteca"],
    ["AMZ: Panintoeca", "AMZ+RA: Paninoteca"],
  ]);
  return replacements.get(text) || text;
}

function splitMenu(menu) {
  const [prefix = "", ...rest] = cleanText(menu).split(":");
  return {
    menuPrefix: prefix.trim(),
    menuBaseName: rest.join(":").trim(),
  };
}

function nonEmptyRaw(row) {
  return Object.fromEntries(Object.entries(row).filter(([, value]) => cleanText(value)));
}

function compactRaw(row) {
  const keys = [
    "Menu Name",
    "Menu Type",
    "Week",
    "Day of Week/Date",
    "Meal Period",
    "Meal Category",
    "Station",
    "Recipe Number",
    "Recipe Name",
    "Short Name",
    "Created Date",
    "Created By",
    "Last Modified Date",
    "Last Modified By",
    "System Updated Date",
    "Compass Nutrition & Wellness .",
    "Compass-Ingredient Recipe.",
    "Menu Cycle Categories.",
    "Packaged Labels.",
    "Webtrition Export .",
    "Product Attribute: Diverse Suppliers",
    "Eligible for Package Labels",
    "Data Access",
    "Picture",
    "Supplied Dish",
    "Sub-Recipe Usage",
    "Menu Item Usage",
  ];
  return Object.fromEntries(keys.map((key) => [key, cleanText(row[key])]).filter(([, value]) => value));
}

function trustedDescription(row) {
  if (!row) return "";
  const description = cleanText(row.enticingDescription);
  if (!description) return "";
  if (row.primaryDescriptionSource === "source-truth-preserved") return description;
  if (cleanText(row.sourceTruthName)) return description;
  if (row.dataSource && row.dataSource !== "menuworks-menu-item-import") return description;
  if (!row.sourceDataVersion) return description;
  return "";
}

function existingLookup(rows) {
  const byMrn = new Map();
  const byRecipe = new Map();
  const byName = new Map();

  for (const row of rows) {
    const mrn = cleanText(row.mrn || row.MRN);
    if (mrn && !byMrn.has(mrn)) byMrn.set(mrn, row);

    const recipeKey = normalizeKey(row.recipeName);
    if (recipeKey && !byRecipe.has(recipeKey)) byRecipe.set(recipeKey, row);

    const nameKey = normalizeKey(row.sourceTruthName || row.displayName || row.item || row.shortName);
    if (nameKey && !byName.has(nameKey)) byName.set(nameKey, row);
  }

  return { byMrn, byRecipe, byName };
}

function findExisting(row, lookup) {
  const mrn = cleanText(row["Recipe Number"]);
  const recipeKey = normalizeKey(row["Recipe Name"]);
  const shortKey = normalizeKey(row["Short Name"]);
  return lookup.byMrn.get(mrn) || lookup.byRecipe.get(recipeKey) || lookup.byName.get(shortKey) || null;
}

function deriveCategory(row, existing) {
  if (existing?.category) return existing.category;
  const recipeCategory = cleanText(row["Recipe Category."]).toLowerCase();
  const menuItemNotes = cleanText(row["Menu Item Notes"]).toLowerCase();
  const station = cleanText(row["Station"]).toLowerCase();
  const price = numberValue(row["Sell Price"]);

  if (
    recipeCategory.includes("sauce") ||
    recipeCategory.includes("condiment") ||
    recipeCategory.includes("spread") ||
    recipeCategory.includes("dip") ||
    recipeCategory.includes("salsa") ||
    recipeCategory.includes("beverage") ||
    recipeCategory.includes("dessert") ||
    station.includes("extension")
  ) {
    return "extension";
  }

  if (
    recipeCategory.includes("starch") ||
    recipeCategory.includes("grain") ||
    recipeCategory.includes("vegetable") ||
    recipeCategory.includes("side") ||
    recipeCategory.includes("legume") ||
    menuItemNotes.includes("side")
  ) {
    return "side";
  }

  if (
    recipeCategory.includes("main entree") ||
    recipeCategory.includes("sandwich") ||
    recipeCategory.includes("wrap") ||
    recipeCategory.includes("pizza") ||
    recipeCategory.includes("flatbread") ||
    menuItemNotes.includes("entree")
  ) {
    return "entree";
  }

  return price === null ? "subRecipe" : "entree";
}

function allergenDetails(row) {
  const details = {};
  for (const column of ALLERGEN_COLUMNS) {
    const value = cleanText(row[column]);
    if (!value) continue;
    details[column] = value;
  }
  return details;
}

function allergenList(row, details) {
  const list = new Set();
  const summary = cleanText(row["Allergens."]);
  for (const match of summary.matchAll(/Contains\s+([^,]+)/gi)) {
    const allergen = cleanText(match[1]);
    if (allergen) list.add(allergen);
  }
  for (const [allergen, value] of Object.entries(details)) {
    const normalized = value.toLowerCase();
    if (normalized === "yes" || normalized.includes("risk") || normalized.includes("contains")) {
      list.add(allergen);
    }
  }
  return [...list].sort();
}

function nutrition(row) {
  const output = {};
  for (const [sourceKey, targetKey] of Object.entries(NUTRITION_MAP)) {
    const value = numberValue(row[sourceKey]);
    if (value !== null) output[targetKey] = value;
  }
  return output;
}

function isValidMenuRow(row) {
  const menu = normalizeMenuName(row["Menu Name"]);
  return /^AMZ(\+RA)?:/.test(menu) && cleanText(row["Recipe Number"]);
}

const existingRows = readJson(BASELINE_FILE);
const lookup = existingLookup(existingRows);

const workbook = xlsx.readFile(SOURCE_FILE, { raw: true });
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const incomingRows = xlsx.utils.sheet_to_json(sheet, { defval: "" }).filter(isValidMenuRow);

const importedRows = incomingRows.map((row, index) => {
  const existing = findExisting(row, lookup);
  const menu = normalizeMenuName(row["Menu Name"]);
  const { menuPrefix, menuBaseName } = splitMenu(menu);
  const menuWorksDescription = cleanText(row["Enticing Description"]);
  const preservedDescription = trustedDescription(existing);
  const primaryDescription = preservedDescription || menuWorksDescription;
  const itemCost = numberValue(row["Menu Item Cost"]);
  const wastePct = percentValue(row["Waste %"]);
  const currentNutrition = nutrition(row);
  const currentAllergenDetails = allergenDetails(row);
  const station = cleanText(row["Station"]);
  const isFreshFiveHibernate = menu === "AMZ: Fresh Five" && station === "Hibernate";
  const sourceTruthName = cleanText(existing?.sourceTruthName);
  const shortName = titleCase(row["Short Name"]);

  return {
    id: index + 1,
    menu,
    menuType: cleanText(row["Menu Type"]),
    week: cleanText(row["Week"]),
    dayOfWeekDate: cleanText(row["Day of Week/Date"]),
    meal: cleanText(row["Meal Period"]) || cleanText(row["Meal Category"]),
    mealCategory: cleanText(row["Meal Category"]),
    station,
    item: sourceTruthName || cleanText(existing?.item) || shortName,
    mrn: cleanText(row["Recipe Number"]),
    portion: cleanText(row["Menu Portion Size"]),
    price: numberValue(row["Sell Price"]),
    itemCost,
    wastePct,
    trueCost: itemCost === null ? null : round(itemCost * (1 + (wastePct || 0)), 3),
    forecast: existing?.forecast ?? 100,
    menuPrefix,
    menuBaseName,
    recipeName: cleanText(row["Recipe Name"]),
    recipePrefix: cleanText(row["Recipe Name"]).split(":")[0] || "",
    recipeSource: cleanText(row["Recipe Source."]),
    displayName: sourceTruthName || cleanText(existing?.displayName) || shortName,
    shortName,
    portionGrams: numberValue(row["Menu Portion Weight(g)"]),
    portionOz: numberValue(row["Menu Portion Weight(oz)"]),
    category: deriveCategory(row, existing),
    enticingDescription: primaryDescription,
    menuWorksDescription,
    secondaryDescription: menuWorksDescription,
    primaryDescriptionSource: preservedDescription ? "source-truth-preserved" : "menuworks-import",
    ingredients: cleanText(row["Ingredients"]),
    ingredientsCommonName: cleanText(row["Ingredients Common Name"]),
    recipeCategory: cleanText(row["Recipe Category."]),
    recipeProductionArea: cleanText(row["Recipe Production Area."]),
    productionArea: cleanText(row["Production Area"]),
    menuItemNotes: cleanText(row["Menu Item Notes"]),
    recipeNotes: cleanText(row["Recipe Notes"]),
    diet: cleanText(row["Diet"]),
    dietDescription: cleanText(row["Diet Description"]),
    compassNutritionWellness: cleanText(row["Compass Nutrition & Wellness ."]),
    compassIngredientRecipe: cleanText(row["Compass-Ingredient Recipe."]),
    menuCycleCategories: cleanText(row["Menu Cycle Categories."]),
    packagedLabels: cleanText(row["Packaged Labels."]),
    webtritionExport: cleanText(row["Webtrition Export ."]),
    createdDate: cleanText(row["Created Date"]),
    createdBy: cleanText(row["Created By"]),
    lastModifiedDate: cleanText(row["Last Modified Date"]),
    lastModifiedBy: cleanText(row["Last Modified By"]),
    systemUpdatedDate: cleanText(row["System Updated Date"]),
    preparationTimeMins: numberValue(row["Preparation Time (mins)"]),
    cookingTimeMins: numberValue(row["Cooking Time (mins)"]),
    yield: numberValue(row["Yield"]),
    minBatch: numberValue(row["Min Batch"]),
    maximumProductionAmount: numberValue(row["Maximum Production Amount"]),
    recipeSets: cleanText(row["Recipe Sets"]),
    gtin: cleanText(row["GTIN"]),
    adjustedWeight: cleanText(row["Adjusted Weight"]),
    manualNutrition: cleanText(row["Manual Nutrition"]),
    picture: cleanText(row["Picture"]),
    suppliedDish: cleanText(row["Supplied Dish"]),
    subRecipeUsage: numberValue(row["Sub-Recipe Usage"]),
    productAttributeDiverseSuppliers: cleanText(row["Product Attribute: Diverse Suppliers"]),
    eligibleForPackageLabels: cleanText(row["Eligible for Package Labels"]),
    menuUtensil: cleanText(row["Menu Utensil"]),
    menuTexture: cleanText(row["Menu Texture"]),
    corporateRetailAcceptabilityFactor: percentValue(row["Corporate Retail Acceptability Factor"]),
    choiceAcceptabilityFactor: percentValue(row["Choice Acceptability Factor"]),
    mealCategoryAcceptabilityFactor: percentValue(row["Meal Category Acceptability Factor"]),
    dataAccess: cleanText(row["Data Access"]),
    menuItemUsage: numberValue(row["Menu Item Usage"]),
    mainNonSelect: cleanText(row["Main/Non-Select"]),
    allergenSummary: cleanText(row["Allergens."]),
    allergens: allergenList(row, currentAllergenDetails),
    allergenDetails: currentAllergenDetails,
    compassFit: cleanText(row["Compass Fit."]),
    exceedsSodiumLimit: cleanText(row["Exceeds Sodium Limit."]),
    ghgEmissions: cleanText(row["GHG Emissions."]),
    madeFromSingleSource: cleanText(row["Made from Single Source."]),
    veganTag: cleanText(row["Vegan Tag."]),
    vegetarianTag: cleanText(row["Vegetarian Tag."]),
    dataSource: "menuworks-menu-item-import",
    sourceDataVersion: SOURCE_VERSION,
    sourceFileName: basename(SOURCE_FILE),
    calories: currentNutrition.calories ?? null,
    proteinG: currentNutrition.proteinG ?? null,
    sodiumMg: currentNutrition.sodiumMg ?? null,
    carbsG: currentNutrition.carbsG ?? null,
    fiberG: currentNutrition.fiberG ?? null,
    sugarsG: currentNutrition.sugarsG ?? null,
    addedSugarsG: currentNutrition.addedSugarsG ?? null,
    totalFatG: currentNutrition.totalFatG ?? null,
    saturatedFatG: currentNutrition.saturatedFatG ?? null,
    transFatG: currentNutrition.transFatG ?? null,
    cholesterolMg: currentNutrition.cholesterolMg ?? null,
    potassiumMg: currentNutrition.potassiumMg ?? null,
    calciumMg: currentNutrition.calciumMg ?? null,
    ironMg: currentNutrition.ironMg ?? null,
    nutrition: currentNutrition,
    legacyNames: [...new Set([...(existing?.legacyNames || []), cleanText(existing?.item), shortName].filter(Boolean))],
    sourceTruthName: sourceTruthName || undefined,
    ...(isFreshFiveHibernate
      ? {
          effectiveDate: HIBERNATE_EFFECTIVE_DATE,
          effectiveNote: "Fresh Five Hibernate station effective Aug 1, 2026.",
          stationStatus: "future-effective",
        }
      : {}),
    menuWorksRaw: compactRaw(row),
    menuWorksRawArchivePath: RAW_ARCHIVE_PUBLIC_PATH,
  };
});

writeFileSync(OUTPUT_FILE, `${JSON.stringify(importedRows, null, 2)}\n`);
mkdirSync(dirname(RAW_ARCHIVE_FILE), { recursive: true });
writeFileSync(
  RAW_ARCHIVE_FILE,
  `${JSON.stringify(
    incomingRows.map((row) => ({
      sourceDataVersion: SOURCE_VERSION,
      mrn: cleanText(row["Recipe Number"]),
      menu: normalizeMenuName(row["Menu Name"]),
      station: cleanText(row["Station"]),
      raw: nonEmptyRaw(row),
    })),
    null,
    2
  )}\n`
);

const menuCount = new Set(importedRows.map((row) => row.menu)).size;
const hibernateCount = importedRows.filter((row) => row.menu === "AMZ: Fresh Five" && row.station === "Hibernate").length;
const preservedDescriptions = importedRows.filter((row) => row.primaryDescriptionSource === "source-truth-preserved").length;

console.log(
  JSON.stringify(
    {
      sourceFile: SOURCE_FILE,
      baselineFile: BASELINE_FILE,
      rows: importedRows.length,
      menus: menuCount,
      preservedDescriptions,
      freshFiveHibernateRows: hibernateCount,
      outputFile: OUTPUT_FILE,
      rawArchiveFile: RAW_ARCHIVE_FILE,
    },
    null,
    2
  )
);
