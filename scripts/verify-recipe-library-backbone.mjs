import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import MENUWORKS_ITEMS from "../src/data/menuItems.json" with { type: "json" };
import { MENU_HEADER_ASSETS, getRecipeLibraryPhoto } from "../src/data/recipeLibraryAssets.js";
import { normalizeRecipeLibraryItem } from "../src/features/recipe-database/recipeLibraryModel.js";

const root = process.cwd();

function read(path) {
  return readFileSync(join(root, path), "utf8");
}

function assertIncludes(file, expected) {
  const text = read(file);
  if (!text.includes(expected)) {
    throw new Error(`${file} is missing expected marker: ${expected}`);
  }
}

function assertNotIncludes(file, unexpected) {
  const text = read(file);
  if (text.includes(unexpected)) {
    throw new Error(`${file} still contains retired marker: ${unexpected}`);
  }
}

assertIncludes("src/app/LandingPage.jsx", "Menu Library");
assertNotIncludes("src/app/LandingPage.jsx", "Recipe Database");

assertIncludes("src/features/recipe-database/RecipeDatabase.jsx", "Menu Library");
assertIncludes("src/features/recipe-database/RecipeDatabase.jsx", "LibraryCardDrawer");
assertIncludes("src/features/recipe-database/RecipeDatabase.jsx", "justify-center");
assertNotIncludes("src/features/recipe-database/RecipeDatabase.jsx", "recipe-library-drawer ml-auto");
assertIncludes("src/features/recipe-database/RecipeDatabase.jsx", "max-w-5xl");
assertIncludes("src/features/recipe-database/RecipeDatabase.jsx", "object-contain");
assertIncludes("src/features/recipe-database/RecipeDatabase.jsx", "md:text-5xl");
assertIncludes("src/features/recipe-database/RecipeDatabase.jsx", "Review signal for pricing, categories, allergens, descriptions, and nutrition.");
assertIncludes("src/features/recipe-database/RecipeDatabase.jsx", "lg:grid-cols-4");
assertIncludes("src/features/recipe-database/RecipeDatabase.jsx", "/api/recipe-library");
assertIncludes("src/features/recipe-database/RecipeDatabase.jsx", "ensureFullRecipeRows");
assertIncludes("src/features/recipe-database/RecipeDatabase.jsx", "usesLocalRows");
assertNotIncludes("src/features/recipe-database/RecipeDatabase.jsx", "import(\"../../data/menuItems.json\")");
assertIncludes("src/features/recipe-database/RecipeDatabase.jsx", "Photo Signal");
assertIncludes("src/features/recipe-database/RecipeDatabase.jsx", "[\"plating-guide\", \"recipe-file\"].includes(slot.type)");
assertNotIncludes("src/features/recipe-database/RecipeDatabase.jsx", "slot.type === \"item-photo\" ? photo : null");
assertIncludes("src/features/recipe-database/RecipeDatabase.jsx", "proteinLabel");
assertNotIncludes("src/features/recipe-database/RecipeDatabase.jsx", "Recipe instructions not attached yet");
assertNotIncludes("src/features/recipe-database/recipeLibraryModel.js", "Recipe instructions not attached yet");
assertIncludes("src/features/recipe-database/RecipeDatabase.jsx", "grid-cols-[repeat(auto-fit,minmax(7rem,1fr))]");
assertIncludes("src/features/recipe-database/RecipeDatabase.jsx", "data-library-property-label");
assertIncludes("src/features/recipe-database/RecipeDatabase.jsx", "MenuWorks Truth Upload");
assertIncludes("src/features/recipe-database/RecipeDatabase.jsx", "Accept Update + Replace Library Data");
assertIncludes("src/features/recipe-database/RecipeDatabase.jsx", "postRecipeLibraryAction");
assertIncludes("src/features/recipe-database/RecipeDatabase.jsx", "updateRecipeItem");
assertIncludes("src/features/recipe-database/RecipeDatabase.jsx", "uploadRecipeDocument");
assertIncludes("src/features/recipe-database/RecipeDatabase.jsx", "Upload food photo");
assertIncludes("src/features/recipe-database/RecipeDatabase.jsx", "DatabaseSourceChip");
assertIncludes("src/features/recipe-database/RecipeDatabase.jsx", "Supabase");
assertIncludes("src/features/recipe-database/RecipeDatabase.jsx", "downloadAllMenusCsv");
assertIncludes("src/features/recipe-database/RecipeDatabase.jsx", "handleDownloadAllMenusCsv");
assertIncludes("src/features/recipe-database/RecipeDatabase.jsx", "Download All Menus CSV");
assertIncludes("src/features/recipe-database/RecipeDatabase.jsx", "Recipe Name");
assertIncludes("src/features/recipe-database/RecipeDatabase.jsx", "Sell Price");
assertIncludes("src/features/recipe-database/RecipeDatabase.jsx", "ensureFullRecipeRows()");

const recipeDatabaseText = read("src/features/recipe-database/RecipeDatabase.jsx");
const statusStart = recipeDatabaseText.indexOf("function RecipeLibraryStatus");
const statusEnd = recipeDatabaseText.indexOf("export default function RecipeDatabase");
const statusBlock = recipeDatabaseText.slice(statusStart, statusEnd);
if (statusBlock.includes("databaseSource") || statusBlock.includes("usesLocalRows")) {
  throw new Error("RecipeLibraryStatus must not reference RecipeDatabase scoped state.");
}

assertNotIncludes("src/features/menu-engineering/MenuEngineeringDashboard.jsx", "Initiate MenuWorks Upload");
assertNotIncludes("src/features/menu-engineering/MenuEngineeringDashboard.jsx", "parseMenuWorksFile");
assertNotIncludes("src/features/menu-engineering/MenuEngineeringDashboard.jsx", "MENUWORKS_IMPORT_INITIATION_CODE");
assertNotIncludes("src/features/menu-engineering/MenuEngineeringDashboard.jsx", "culinaryToolsMenuEngineeringItems_v2");
assertIncludes("src/features/menu-engineering/MenuEngineeringDashboard.jsx", "loadMenuWorksItemsFromApi");
assertNotIncludes("src/features/menu-engineering/MenuEngineeringDashboard.jsx", "../../data/menuItems.json");
assertIncludes("src/features/neighborhood-rotations/NeighborhoodRotations.jsx", "loadMenuWorksItemsFromApi");
assertNotIncludes("src/features/neighborhood-rotations/NeighborhoodRotations.jsx", "../../data/menuItems.json");
assertIncludes("src/features/smartsheet-health/SmartsheetHealth.jsx", "loadMenuWorksItemsFromApi");
assertNotIncludes("src/features/smartsheet-health/SmartsheetHealth.jsx", "../../data/menuItems.json");
assertIncludes("src/features/smartsheet-health/SmartsheetHealth.jsx", "RecipeSourcePill");
assertIncludes("src/features/smartsheet-health/SmartsheetHealth.jsx", "supabase-recipe-items");
assertNotIncludes("src/main.jsx", "weeklyTrafficEnhancer");
assertIncludes("src/app/LandingPage.jsx", "/api/traffic/weekly");
assertIncludes("src/app/LandingPage.jsx", "/api/recipe-library?scope=all");
assertNotIncludes("src/app/LandingPage.jsx", "import(\"../data/menuItems.json\")");
assertNotIncludes("src/app/LandingPage.jsx", "Smart Read");

assertIncludes("src/shared/appConfig.js", "APP_VERSION_STAMP");

assertIncludes("src/features/recipe-database/recipeLibraryModel.js", "normalizeRecipeLibraryItem");
assertIncludes("src/features/recipe-database/recipeLibraryModel.js", "row:${row.id}");
assertIncludes("src/features/recipe-database/recipeLibraryModel.js", "culinaryToolsMenuEngineeringItems_v3");
assertIncludes("src/features/recipe-database/recipeLibraryModel.js", "protein_g");
assertIncludes("src/features/recipe-database/recipeLibraryModel.js", "sodium_mg");
assertIncludes("src/features/recipe-database/recipeLibraryModel.js", "potassium_mg");
assertIncludes("src/features/recipe-database/recipeLibraryModel.js", "nutrition_payload");
assertIncludes("src/features/recipe-database/recipeLibraryModel.js", "menuworks_description");
assertIncludes("src/features/recipe-database/recipeLibraryModel.js", "effective_date");
assertIncludes("src/features/recipe-database/recipeLibraryModel.js", "itemTrustFlags");
assertIncludes("src/features/recipe-database/RecipeDatabase.jsx", "Data Confidence");
assertIncludes("src/features/recipe-database/RecipeDatabase.jsx", "Needs Review");
assertNotIncludes("src/features/recipe-database/recipeLibraryModel.js", "type: \"item-photo\"");
assertNotIncludes("src/features/recipe-database/recipeLibraryModel.js", "type: \"source-document\"");
assertIncludes("src/features/recipe-database/recipeLibraryModel.js", "plating-guide");
assertIncludes("src/features/recipe-database/recipeLibraryModel.js", "recipe-file");
assertIncludes("api/recipe-library.js", "\"item-photo\": \"item-photos\"");
assertIncludes("src/features/recipe-database/RecipeDatabase.jsx", "MENU_HEADER_ASSETS");
assertIncludes("src/features/recipe-database/RecipeDatabase.jsx", "getRecipeLibraryPhoto");
assertIncludes("src/data/recipeLibraryAssets.js", "AMZ: Andes");
assertIncludes("src/data/recipeLibraryAssets.js", "PHOTO_FIELD_KEYS");
assertIncludes("src/data/recipeLibraryAssets.js", "photoUrl");
assertIncludes("src/data/recipeLibraryAssets.js", "uploadedPhotoSource");
assertIncludes("src/data/recipeLibraryAssets.js", "andes-group.jpg");
assertIncludes("src/data/recipeLibraryAssets.js", "peruvian-stewed-chicken.jpg");
assertIncludes("src/data/recipeLibraryAssets.js", "AMZ: Atlas Noodle");
assertIncludes("src/data/recipeLibraryAssets.js", "AMZ: Anisa");
assertIncludes("src/data/recipeLibraryAssets.js", "AMZ: Bibimbowl");
assertIncludes("src/data/recipeLibraryAssets.js", "AMZ: Balti");
assertIncludes("src/data/recipeLibraryAssets.js", "AMZ: Breakfast");
assertIncludes("src/data/recipeLibraryAssets.js", "AMZ: Carvery");
assertIncludes("api/recipe-library.js", "scope === \"menu\"");
assertIncludes("api/recipe-library.js", "scope === \"all\"");
assertIncludes("api/recipe-library.js", "server-menuworks-json");
assertIncludes("api/recipe-library.js", "backfillRecipeItems");
assertIncludes("api/recipe-library.js", "updateRecipeItem");
assertIncludes("api/recipe-library.js", "uploadRecipeDocument");
assertIncludes("api/recipe-library.js", "recipe_item_documents");
assertIncludes("api/recipe-library.js", "supabaseStorageFetch");
assertIncludes("api/recipe-library.js", "recipe_items?on_conflict=item_key");
assertIncludes("api/recipe-library.js", "supabase-recipe-items");

[
  "public/assets/recipe-library/andes/andes-group.jpg",
  "public/assets/recipe-library/andes/arroz-chaufa.jpg",
  "public/assets/recipe-library/andes/lomo-saltado.jpg",
  "public/assets/recipe-library/andes/peruvian-stewed-chicken.jpg",
  "public/assets/recipe-library/andes/peruvian-shrimp.jpg",
  "public/assets/recipe-library/andes/pollo-a-la-brasa.jpg",
].forEach((assetPath) => {
  if (!existsSync(join(root, assetPath))) {
    throw new Error(`Menu Library Andes asset missing: ${assetPath}`);
  }
});

const photoRows = MENUWORKS_ITEMS.filter((row) => getRecipeLibraryPhoto(row));
const expectedCuratedPhotoCounts = {
  "AMZ: Atlas Noodle": 7,
  "AMZ: Anisa": 17,
  "AMZ: Bibimbowl": 6,
  "AMZ: Balti": 10,
  "AMZ: Breakfast": 31,
  "AMZ: Carvery": 39,
};

Object.entries(expectedCuratedPhotoCounts).forEach(([menu, expectedCount]) => {
  const matchedNames = new Set(
    photoRows
      .filter((row) => row.menu === menu)
      .map((row) => normalizeRecipeLibraryItem(row).display_name),
  );
  if (matchedNames.size !== expectedCount) {
    throw new Error(`Menu Library ${menu} photo mapping expected ${expectedCount} dishes, received ${matchedNames.size}.`);
  }
});

photoRows.forEach((row) => {
  const photo = getRecipeLibraryPhoto(row);
  if (photo?.src?.startsWith("/") && !existsSync(join(root, "public", photo.src))) {
    throw new Error(`Menu Library mapped photo is missing: ${row.menu} / ${row.item} -> ${photo.src}`);
  }
});

Object.entries(MENU_HEADER_ASSETS).forEach(([menu, asset]) => {
  if (!existsSync(join(root, "public", asset.src))) {
    throw new Error(`Menu Library header photo is missing: ${menu} -> ${asset.src}`);
  }
});
const mismatchedPhotoRows = photoRows.filter((row) => {
  const itemKey = normalizeRecipeLibraryItem(row).item_key;
  const openedRow = MENUWORKS_ITEMS.find((candidate) => normalizeRecipeLibraryItem(candidate).item_key === itemKey);
  return getRecipeLibraryPhoto(row)?.src !== getRecipeLibraryPhoto(openedRow || {})?.src;
});

if (mismatchedPhotoRows.length) {
  throw new Error(`Menu Library photo integrity failed for ${mismatchedPhotoRows.length} row(s): ${mismatchedPhotoRows.map((row) => `${row.menu} / ${row.item}`).join(", ")}`);
}

assertIncludes("supabase/recipe-library-schema.sql", "recipe_items");
assertIncludes("supabase/recipe-library-schema.sql", "recipe_item_documents");
assertIncludes("supabase/recipe-library-schema.sql", "protein_g");
assertIncludes("supabase/recipe-library-schema.sql", "trans_fat_g");
assertIncludes("supabase/recipe-library-schema.sql", "potassium_mg");
assertIncludes("supabase/recipe-library-schema.sql", "nutrition_payload");
assertIncludes("supabase/recipe-library-schema.sql", "menuworks_description");
assertIncludes("supabase/recipe-library-schema.sql", "effective_date");
assertIncludes("supabase/recipe-library-schema.sql", "recipe-files");
assertIncludes("supabase/recipe-library-schema.sql", "plating-guides");
assertIncludes("supabase/recipe-library-schema.sql", "item-photos");

console.log("Menu Library backbone verification passed.");
