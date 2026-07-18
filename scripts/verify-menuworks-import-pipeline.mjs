import * as XLSX from "xlsx";

import { buildMenuWorksImportReview } from "../src/features/recipe-database/menuWorksImport.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function workbookFile(rows, name = "Weekly Master Menus Test.xlsx") {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), "Report");
  const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
  return {
    name,
    async arrayBuffer() {
      return buffer;
    },
  };
}

const currentRows = [
  {
    id: 1,
    menu: "AMZ: Andes",
    station: "Andes",
    item: "Kachumbar Salad",
    displayName: "Kachumbar Salad",
    recipeName: "AMZ: Kachumbar Salad",
    mrn: "165741.11",
    portion: "4 ounce",
    price: 2.55,
    trueCost: 0.42,
    category: "side",
    enticingDescription: "curated cucumber tomato salad",
    ingredientsCommonName: "cucumber, tomato, onion",
    allergenDetails: { Onion: "Yes" },
    sourceDataVersion: "previous-master",
  },
  {
    id: 2,
    menu: "AMZ: Andes",
    station: "Andes",
    item: "Retired Andes Item",
    displayName: "Retired Andes Item",
    recipeName: "AMZ: Retired Andes Item",
    mrn: "999999.99",
    portion: "1 each",
    price: 11.75,
    trueCost: 3.25,
    category: "entree",
    enticingDescription: "old row",
  },
];

const uploadRows = [
  {
    "Menu Name": "AMZ: Andes",
    "Recipe Name": "AMZ: Kachumbar Salad",
    "Short Name": "Kachumbar Salad",
    "Recipe Number": "165741.11",
    "Station": "Andes",
    "Menu Portion Size": "4 ounce",
    "Menu Portion Weight(oz)": "4",
    "Sell Price": "2.55",
    "Menu Item Cost": "0.42",
    "Item + Waste Cost": "0.42",
    "Calories": "80",
    "Protein (g)": "2",
    "Enticing Description": "webtrition cucumber tomato salad",
    "Ingredients Common Name": "cucumber, tomato, onion",
    "Menu Item Notes": "A la carte and side choice",
    "Recipe Category.": "Vegetable",
    "Onion": "Yes",
  },
  {
    "Menu Name": "AMZ: Andes",
    "Recipe Name": "AMZ: Mango Sticky Rice",
    "Short Name": "Mango Sticky Rice",
    "Recipe Number": "182206.25",
    "Station": "Andes",
    "Menu Portion Size": "1 each",
    "Sell Price": "5.00",
    "Menu Item Cost": "1.10",
    "Item + Waste Cost": "1.10",
    "Calories": "310",
    "Protein (g)": "4",
    "Enticing Description": "mango sticky rice",
    "Menu Item Notes": "dessert",
    "Recipe Category.": "Dessert",
  },
];

const review = await buildMenuWorksImportReview(workbookFile(uploadRows), currentRows);

assert(review.preflight?.status === "ready", "Import review should expose a ready preflight status.");
assert(review.preflight.requiredColumnsPresent >= 4, "Import review should count required columns.");
assert(review.preflight.exactMrnTextRows === 2, "MRNs with decimal precision must be counted as exact text rows.");
assert(review.importBatch?.id?.startsWith("menuworks-"), "Import review should create an import batch id.");
assert(review.importBatch.sourceFileName === "Weekly Master Menus Test.xlsx", "Import batch should keep the uploaded source file name.");
assert(review.protectedDescriptionChanges.length === 1, "Curated description differences should be surfaced before accept.");
assert(review.hiddenAfterAccept.length === 1, "Rows absent from refreshed menus should be shown as hidden-after-accept.");
assert(
  review.importedRows.some((row) => row.mrn === "182206.25"),
  "Imported MRNs must retain trailing precision as text."
);

const recipeDatabase = await import("node:fs").then(({ readFileSync }) => readFileSync("src/features/recipe-database/RecipeDatabase.jsx", "utf8"));
assert(recipeDatabase.includes("acceptMenuWorksImport"), "Menu Library must call the server-side acceptMenuWorksImport action.");
assert(recipeDatabase.includes("Import batch"), "Menu Library review should show import batch language.");

const api = await import("node:fs").then(({ readFileSync }) => readFileSync("api/recipe-library.js", "utf8"));
assert(api.includes("acceptMenuWorksImport"), "Recipe Library API must expose acceptMenuWorksImport.");
assert(api.includes("hideStaleSupabaseRecipeItems(activeItemKeys"), "Accepted imports must hide stale Supabase rows.");
assert(api.includes("importBatch"), "Accepted imports should return import batch metadata.");

console.log("MenuWorks import pipeline verification passed.");
