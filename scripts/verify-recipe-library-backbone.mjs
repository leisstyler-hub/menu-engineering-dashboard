import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

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
assertIncludes("src/features/recipe-database/RecipeDatabase.jsx", "proteinLabel");
assertIncludes("src/features/recipe-database/RecipeDatabase.jsx", "Recipe instructions not attached yet");
assertIncludes("src/features/recipe-database/RecipeDatabase.jsx", "MenuWorks Truth Upload");
assertIncludes("src/features/recipe-database/RecipeDatabase.jsx", "Accept Update + Replace Library Data");

assertNotIncludes("src/features/menu-engineering/MenuEngineeringDashboard.jsx", "Initiate MenuWorks Upload");
assertNotIncludes("src/features/menu-engineering/MenuEngineeringDashboard.jsx", "parseMenuWorksFile");
assertNotIncludes("src/features/menu-engineering/MenuEngineeringDashboard.jsx", "MENUWORKS_IMPORT_INITIATION_CODE");
assertNotIncludes("src/features/menu-engineering/MenuEngineeringDashboard.jsx", "culinaryToolsMenuEngineeringItems_v2");
assertNotIncludes("src/main.jsx", "weeklyTrafficEnhancer");
assertIncludes("src/app/LandingPage.jsx", "/api/traffic/weekly");
assertNotIncludes("src/app/LandingPage.jsx", "Smart Read");

assertIncludes("src/shared/appConfig.js", "APP_VERSION_STAMP");

assertIncludes("src/features/recipe-database/recipeLibraryModel.js", "normalizeRecipeLibraryItem");
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
assertIncludes("src/data/recipeLibraryAssets.js", "andes-group.jpg");
assertIncludes("src/data/recipeLibraryAssets.js", "peruvian-stewed-chicken.jpg");

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
