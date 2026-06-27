export const MENU_ENGINEERING_OVERRIDE_STORAGE_KEY = "culinaryToolsMenuEngineeringItems_v3";

export const RECIPE_DOCUMENT_SLOTS = [
  {
    type: "item-photo",
    label: "Photo",
    bucket: "item-photos",
    emptyText: "Photo not attached yet",
  },
  {
    type: "plating-guide",
    label: "Plating Guide",
    bucket: "plating-guides",
    emptyText: "Plating guide not attached yet",
  },
  {
    type: "recipe-file",
    label: "Recipe",
    bucket: "recipe-files",
    emptyText: "Recipe instructions not attached yet",
  },
  {
    type: "source-document",
    label: "Source Document",
    bucket: "source-documents",
    emptyText: "Source document not attached yet",
  },
];

export function textValue(row, ...keys) {
  for (const key of keys) {
    const value = row?.[key];
    if (value !== null && value !== undefined && String(value).trim()) return String(value).trim();
  }
  return "";
}

export function numberValue(row, ...keys) {
  for (const key of keys) {
    const value = row?.[key];
    if (value === null || value === undefined || value === "") continue;
    const numeric = Number(String(value).replace(/[^0-9.-]/g, ""));
    if (Number.isFinite(numeric)) return numeric;
  }
  return null;
}

export function itemName(row) {
  return textValue(row, "displayName", "item", "shortName", "recipeName") || "Unnamed item";
}

export function itemDescription(row) {
  return textValue(row, "enticingDescription", "ingredientsCommonName", "ingredients") || "No description loaded yet.";
}

export function recipeLibraryItemKey(row) {
  const mrn = textValue(row, "mrn", "MRN");
  if (mrn) return `mrn:${mrn}`;
  const recipeName = textValue(row, "recipeName");
  if (recipeName) return `recipe:${recipeName.toLowerCase()}`;
  const name = itemName(row).toLowerCase();
  const menu = textValue(row, "menu").toLowerCase();
  return `item:${menu}:${name}`;
}

export function normalizeRecipeLibraryItem(row) {
  return {
    item_key: recipeLibraryItemKey(row),
    source_row_id: row?.id ?? null,
    mrn: textValue(row, "mrn", "MRN"),
    menu: textValue(row, "menu"),
    station: textValue(row, "station"),
    meal: textValue(row, "meal"),
    category: textValue(row, "category"),
    recipe_category: textValue(row, "recipeCategory"),
    recipe_name: textValue(row, "recipeName"),
    display_name: itemName(row),
    short_name: textValue(row, "shortName"),
    description: itemDescription(row),
    ingredients: textValue(row, "ingredients"),
    ingredients_common_name: textValue(row, "ingredientsCommonName"),
    menu_item_notes: textValue(row, "menuItemNotes"),
    portion: textValue(row, "portion", "Portion"),
    portion_oz: numberValue(row, "portionOz"),
    price: numberValue(row, "price"),
    true_cost: numberValue(row, "trueCost", "itemCost"),
    calories: numberValue(row, "calories", "calories_kcal", "kcal"),
    protein_g: numberValue(row, "protein_g", "proteinG", "protein", "proteinGrams"),
    sodium_mg: numberValue(row, "sodium_mg", "sodiumMg", "sodium"),
    carbs_g: numberValue(row, "carbs_g", "carbsG", "carbohydrates", "totalCarbohydrate"),
    fiber_g: numberValue(row, "fiber_g", "fiberG", "dietaryFiber"),
    sugars_g: numberValue(row, "sugars_g", "sugarsG", "totalSugars"),
    added_sugars_g: numberValue(row, "added_sugars_g", "addedSugarsG", "addedSugars"),
    total_fat_g: numberValue(row, "total_fat_g", "totalFatG", "fat"),
    saturated_fat_g: numberValue(row, "saturated_fat_g", "saturatedFatG", "satFat"),
    trans_fat_g: numberValue(row, "trans_fat_g", "transFatG", "transFat"),
    cholesterol_mg: numberValue(row, "cholesterol_mg", "cholesterolMg", "cholesterol"),
    potassium_mg: numberValue(row, "potassium_mg", "potassiumMg", "potassium"),
    calcium_mg: numberValue(row, "calcium_mg", "calciumMg", "calcium"),
    iron_mg: numberValue(row, "iron_mg", "ironMg", "iron"),
    serving_size: textValue(row, "servingSize", "serving_size", "portion"),
    allergens: Array.isArray(row?.allergens) ? row.allergens : [],
    allergen_summary: textValue(row, "allergenSummary"),
    allergen_details: row?.allergenDetails || {},
    vegan_tag: textValue(row, "veganTag"),
    vegetarian_tag: textValue(row, "vegetarianTag"),
    compass_fit: textValue(row, "compassFit"),
    ghg_emissions: textValue(row, "ghgEmissions"),
    source_system: textValue(row, "dataSource", "recipeSource") || "menuworks",
    source_data_version: textValue(row, "sourceDataVersion"),
    source_file_name: textValue(row, "sourceFileName"),
    source_truth_name: textValue(row, "sourceTruthName"),
    menuworks_description: textValue(row, "menuWorksDescription", "secondaryDescription"),
    primary_description_source: textValue(row, "primaryDescriptionSource"),
    effective_date: textValue(row, "effectiveDate"),
    effective_note: textValue(row, "effectiveNote"),
    station_status: textValue(row, "stationStatus"),
    nutrition_payload: row?.nutrition || {},
    menuworks_raw: row?.menuWorksRaw || {},
    file_slots: RECIPE_DOCUMENT_SLOTS,
    raw: row || {},
  };
}

export function proteinLabel(rowOrItem) {
  const protein = rowOrItem?.protein_g ?? numberValue(rowOrItem, "protein_g", "proteinG", "protein", "proteinGrams");
  return protein === null || protein === undefined ? "Protein not loaded" : `${Math.round(Number(protein)).toLocaleString()}g protein`;
}

export function caloriesLabel(value) {
  if (value === null || value === undefined || value === "") return "Calories not loaded";
  const rounded = Math.round(Number(value) / 5) * 5;
  return Number.isFinite(rounded) ? `${rounded.toLocaleString()} cal` : "Calories not loaded";
}

export function applyRecipeLibraryEdit(rows, selectedItem, patch) {
  const targetKey = selectedItem?.item_key || recipeLibraryItemKey(selectedItem?.raw || selectedItem);
  return rows.map((row) => {
    if (recipeLibraryItemKey(row) !== targetKey) return row;
    return {
      ...row,
      displayName: patch.display_name,
      item: patch.display_name || row.item,
      enticingDescription: patch.description,
      allergenSummary: patch.allergen_summary,
      calories: patch.calories === "" ? null : Number(patch.calories),
      protein_g: patch.protein_g === "" ? null : Number(patch.protein_g),
      price: patch.price === "" ? null : Number(patch.price),
      trueCost: patch.true_cost === "" ? null : Number(patch.true_cost),
      updatedFromRecipeLibrary: true,
      recipeLibraryUpdatedAt: new Date().toISOString(),
    };
  });
}
