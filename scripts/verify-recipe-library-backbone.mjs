import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import MENUWORKS_ITEMS from "../src/data/menuItems.json" with { type: "json" };
import { getRecipeLibraryPhoto } from "../src/data/recipeLibraryAssets.js";
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

assertIncludes("src/app/LandingPage.jsx", "Recipe Library");
assertNotIncludes("src/app/LandingPage.jsx", "Recipe Database");

assertIncludes("src/features/recipe-database/RecipeDatabase.jsx", "Recipe Library");
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
assertIncludes("src/features/recipe-database/RecipeDatabase.jsx", "Recipe instructions not attached yet");
assertIncludes("src/features/recipe-database/RecipeDatabase.jsx", "MenuWorks Truth Upload");
assertIncludes("src/features/recipe-database/RecipeDatabase.jsx", "Accept Update + Replace Library Data");

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
assertIncludes("src/features/recipe-database/recipeLibraryModel.js", "item-photo");
assertIncludes("src/features/recipe-database/recipeLibraryModel.js", "plating-guide");
assertIncludes("src/features/recipe-database/recipeLibraryModel.js", "recipe-file");
assertIncludes("src/features/recipe-database/RecipeDatabase.jsx", "MENU_HEADER_ASSETS");
assertIncludes("src/features/recipe-database/RecipeDatabase.jsx", "getRecipeLibraryPhoto");
assertIncludes("src/data/recipeLibraryAssets.js", "AMZ: Andes");
assertIncludes("src/data/recipeLibraryAssets.js", "PHOTO_FIELD_KEYS");
assertIncludes("src/data/recipeLibraryAssets.js", "photoUrl");
assertIncludes("src/data/recipeLibraryAssets.js", "uploadedPhotoSource");
assertIncludes("src/data/recipeLibraryAssets.js", "andes-group.jpg");
assertIncludes("src/data/recipeLibraryAssets.js", "peruvian-stewed-chicken.jpg");
assertIncludes("api/recipe-library.js", "scope === \"menu\"");
assertIncludes("api/recipe-library.js", "scope === \"all\"");
assertIncludes("api/recipe-library.js", "server-menuworks-json");
assertIncludes("api/recipe-library.js", "backfillRecipeItems");
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
    throw new Error(`Recipe Library Andes asset missing: ${assetPath}`);
  }
});

const photoRows = MENUWORKS_ITEMS.filter((row) => getRecipeLibraryPhoto(row));
const mismatchedPhotoRows = photoRows.filter((row) => {
  const itemKey = normalizeRecipeLibraryItem(row).item_key;
  const openedRow = MENUWORKS_ITEMS.find((candidate) => normalizeRecipeLibraryItem(candidate).item_key === itemKey);
  return getRecipeLibraryPhoto(row)?.src !== getRecipeLibraryPhoto(openedRow || {})?.src;
});

if (mismatchedPhotoRows.length) {
  throw new Error(`Recipe Library photo integrity failed for ${mismatchedPhotoRows.length} row(s): ${mismatchedPhotoRows.map((row) => `${row.menu} / ${row.item}`).join(", ")}`);
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

console.log("Recipe Library backbone verification passed.");
