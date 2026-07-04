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

const PROTEIN_SIGNAL = /\b(beef|chicken|pork|turkey|salmon|fish|cod|shrimp|tuna|meatballs?|steak|brisket|carnitas|chorizo|bacon|sausage|eggs?|tofu|tempeh|paneer|lentils?|beans?|chickpeas?|falafel|poultry|ham|lamb)\b/i;
const SUPPORT_SIGNAL = /sauce|dressing|dip|salsa|aioli|chutney|relish|gravy|marinade|vinaigrette|condiment|garnish|pickle|seasoning|spice|rub|spread|preserve|preserves/i;
const SIDE_CHOICE_SIGNAL = /side choice|side pairing|a la carte\s*(?:&|and)\s*side choice|hot a la carte|cold a la carte/i;
const ENTREE_CATEGORY_SIGNAL = /main entree|sandwich\/wrap|pizza\/calzone\/flatbread|breakfast|premium mains|vegetarian mains/i;

export function recipeLibraryCategoryGroup(row = {}) {
  const menu = textValue(row, "menu");
  const notes = textValue(row, "menuItemNotes");
  const selectorGroup = textValue(row, "plannerSelectorGroup", "selectorGroup");
  const role = textValue(row, "menuItemRole", "selectionBehavior");
  if (
    menu === "AMZ: Carvery" &&
    (/charred vegetable option/i.test(notes) || /carvery-rotating-vegetable/i.test(`${selectorGroup} ${role}`))
  ) {
    return "Vegetable Carvery";
  }
  return textValue(row, "category") || "Unclassified";
}

function itemTrustText(row, { includeIngredients = true } = {}) {
  const values = [
    itemName(row),
    textValue(row, "recipeName"),
    textValue(row, "recipeCategory"),
    textValue(row, "category"),
    textValue(row, "menuItemNotes"),
    textValue(row, "station"),
  ];
  if (includeIngredients) values.push(textValue(row, "ingredientsCommonName"));
  return values.filter(Boolean).join(" ");
}

export function itemTrustFlags(row = {}) {
  const flags = [];
  const category = textValue(row, "category").toLowerCase();
  const recipeCategory = textValue(row, "recipeCategory").toLowerCase();
  const notes = textValue(row, "menuItemNotes");
  const lowerNotes = notes.toLowerCase();
  const text = itemTrustText(row);
  const supportText = itemTrustText(row, { includeIngredients: false });
  const price = numberValue(row, "price");
  const trueCost = numberValue(row, "trueCost", "itemCost");
  const calories = numberValue(row, "calories", "calories_kcal", "kcal");
  const allergens = Array.isArray(row?.allergens) ? row.allergens : [];
  const hasAllergenSignal = Boolean(allergens.length || textValue(row, "allergenSummary") || Object.values(row?.allergenDetails || {}).some(Boolean));
  const hasDescription = itemDescription(row) !== "No description loaded yet.";
  const hasProtein = PROTEIN_SIGNAL.test(text);
  const isSupport = SUPPORT_SIGNAL.test(supportText);
  const isSideChoice = SIDE_CHOICE_SIGNAL.test(lowerNotes);

  if ((price == null || price <= 0) && hasProtein && !isSupport) {
    flags.push({
      level: "review",
      label: "Protein price gap",
      detail: /protein choice/i.test(notes) ? "Protein choice has no direct price; confirm whether price is inherited from the composed menu." : "Protein-bearing item has no positive selling price.",
    });
  } else if ((price == null || price <= 0) && !isSupport && !["subrecipe", "extension"].includes(category)) {
    flags.push({
      level: "review",
      label: "Price review",
      detail: "Item is not marked as complimentary support but has no positive selling price.",
    });
  }

  if (trueCost == null) {
    flags.push({ level: "review", label: "Missing true cost", detail: "Food cost and margin reads need true cost." });
  }

  if (category === "side" && (price >= 5 || ENTREE_CATEGORY_SIGNAL.test(recipeCategory)) && !isSideChoice) {
    flags.push({ level: "review", label: "Category review", detail: "Side row has entree-style price or recipe category without side-choice notes." });
  }

  if (category === "side" && isSupport && !isSideChoice) {
    flags.push({ level: "watch", label: "Support item check", detail: "Sauce, condiment, or support-style row is currently grouped as a side." });
  }

  if (!hasAllergenSignal) {
    flags.push({ level: "watch", label: "Allergens not listed", detail: "Chef-facing allergen details are missing or blank." });
  }

  if (!hasDescription) {
    flags.push({ level: "watch", label: "Description missing", detail: "Chef-facing item description is missing." });
  }

  if (calories == null) {
    flags.push({ level: "watch", label: "Calories missing", detail: "Nutrition display cannot show calories yet." });
  }

  return flags;
}

export function itemTrustStatus(row = {}) {
  const flags = itemTrustFlags(row);
  if (flags.some((flag) => flag.level === "review")) return "Needs Review";
  if (flags.some((flag) => flag.level === "watch")) return "Watch";
  return "Trusted";
}

export function recipeLibraryItemKey(row) {
  if (row?.id != null && row?.id !== "") return `row:${row.id}`;
  const mrn = textValue(row, "mrn", "MRN");
  const menu = textValue(row, "menu").toLowerCase();
  if (mrn) return `mrn:${menu}:${mrn}`;
  const recipeName = textValue(row, "recipeName");
  if (recipeName) return `recipe:${menu}:${recipeName.toLowerCase()}`;
  const name = itemName(row).toLowerCase();
  return `item:${menu}:${name}`;
}

export function normalizeRecipeLibraryItem(row) {
  const recipeDocuments = Array.isArray(row?.recipeDocuments)
    ? row.recipeDocuments.filter((document) => document?.is_active !== false)
    : [];
  return {
    item_key: recipeLibraryItemKey(row),
    source_row_id: row?.id ?? null,
    mrn: textValue(row, "mrn", "MRN"),
    menu: textValue(row, "menu"),
    station: textValue(row, "station"),
    meal: textValue(row, "meal"),
    category: textValue(row, "category"),
    category_group: recipeLibraryCategoryGroup(row),
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
    recipe_documents: recipeDocuments,
    file_slots: RECIPE_DOCUMENT_SLOTS.map((slot) => {
      const document = recipeDocuments.find((entry) => entry.document_type === slot.type);
      return {
        ...slot,
        document: document || null,
        attached: Boolean(document),
        fileName: document?.file_name || "",
        versionLabel: document?.version_label || "",
        signedUrl: document?.signed_url || "",
        uploadedAt: document?.uploaded_at || "",
      };
    }),
    trust_flags: itemTrustFlags(row),
    trust_status: itemTrustStatus(row),
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
