import MENUWORKS_ITEMS from "../src/data/menuItems.json" with { type: "json" };
import { getRecipeLibraryPhoto } from "../src/data/recipeLibraryAssets.js";
import { itemDescription, normalizeRecipeLibraryItem, recipeLibraryCategoryGroup, textValue } from "../src/features/recipe-database/recipeLibraryModel.js";

const DEFAULT_SUPABASE_URL = "https://pzilyzqhatthctgsjwtt.supabase.co";
const SUPABASE_BATCH_SIZE = 250;

function cleanUrl(value = "") {
  return String(value || "").trim().replace(/\/+$/, "");
}

function getSupabaseServerConfig() {
  const url = cleanUrl(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL);
  const key = String(
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    ""
  ).trim();
  return { url, key, configured: Boolean(url && key) };
}

function getAdminCode() {
  return String(process.env.RECIPE_LIBRARY_ADMIN_CODE || process.env.MENUWORKS_IMPORT_INITIATION_CODE || "410410").trim();
}

function isAuthorized(req) {
  const expected = getAdminCode();
  const provided = String(req.headers["x-admin-code"] || req.body?.adminCode || req.query.adminCode || "").trim();
  return Boolean(expected && provided && provided === expected);
}

async function supabaseFetch(path, options = {}) {
  const config = getSupabaseServerConfig();
  if (!config.configured) {
    const error = new Error("Supabase server key is not configured yet.");
    error.status = 503;
    throw error;
  }

  const response = await fetch(`${config.url}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const error = new Error(payload?.message || payload?.error || `Supabase API error ${response.status}`);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
}

function coveragePct(value, total) {
  return total ? Math.round((value / total) * 100) : 0;
}

function menuName(row) {
  return textValue(row, "menu") || "No menu assigned";
}

function nullableInteger(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.round(number) : null;
}

function recipeItemToRow(row = {}) {
  if (row.source_payload && typeof row.source_payload === "object" && Object.keys(row.source_payload).length) {
    return {
      ...row.source_payload,
      id: row.source_payload.id ?? row.source_row_id ?? row.item_key,
      item_key: row.item_key,
      dataSource: row.source_system || row.source_payload.dataSource || "supabase-recipe-library",
    };
  }
  return {
    id: row.source_row_id || row.item_key,
    item_key: row.item_key,
    mrn: row.mrn,
    menu: row.menu,
    station: row.station,
    meal: row.meal,
    category: row.category,
    recipeCategory: row.recipe_category,
    recipeName: row.recipe_name,
    displayName: row.display_name,
    shortName: row.short_name,
    item: row.display_name,
    enticingDescription: row.description,
    ingredients: row.ingredients,
    ingredientsCommonName: row.ingredients_common_name,
    menuItemNotes: row.menu_item_notes,
    portion: row.portion,
    portionOz: row.portion_oz,
    price: row.price,
    trueCost: row.true_cost,
    calories: row.calories,
    protein_g: row.protein_g,
    sodium_mg: row.sodium_mg,
    carbs_g: row.carbs_g,
    fiber_g: row.fiber_g,
    sugars_g: row.sugars_g,
    added_sugars_g: row.added_sugars_g,
    total_fat_g: row.total_fat_g,
    saturated_fat_g: row.saturated_fat_g,
    trans_fat_g: row.trans_fat_g,
    cholesterol_mg: row.cholesterol_mg,
    potassium_mg: row.potassium_mg,
    calcium_mg: row.calcium_mg,
    iron_mg: row.iron_mg,
    allergens: row.allergens || [],
    allergenSummary: row.allergen_summary,
    allergenDetails: row.allergen_details || {},
    veganTag: row.vegan_tag,
    vegetarianTag: row.vegetarian_tag,
    compassFit: row.compass_fit,
    ghgEmissions: row.ghg_emissions,
    dataSource: row.source_system || "supabase-recipe-library",
    sourceFileName: row.source_file_name,
    sourceTruthName: row.source_truth_name,
    menuWorksDescription: row.menuworks_description,
    primaryDescriptionSource: row.primary_description_source,
    effectiveDate: row.effective_date,
    effectiveNote: row.effective_note,
    stationStatus: row.station_status,
    nutrition: row.nutrition_payload || {},
    menuWorksRaw: row.menuworks_raw || {},
  };
}

function recipeItemPayload(row = {}) {
  const item = normalizeRecipeLibraryItem(row);
  return {
    item_key: item.item_key,
    mrn: item.mrn || "",
    source_row_id: item.source_row_id == null ? "" : String(item.source_row_id),
    menu: item.menu || "",
    station: item.station || "",
    meal: item.meal || "",
    category: item.category || "",
    recipe_category: item.recipe_category || "",
    recipe_name: item.recipe_name || "",
    display_name: item.display_name || "Unnamed item",
    short_name: item.short_name || "",
    description: item.description || "",
    ingredients: item.ingredients || "",
    ingredients_common_name: item.ingredients_common_name || "",
    menu_item_notes: item.menu_item_notes || "",
    portion: item.portion || "",
    portion_oz: item.portion_oz,
    price: item.price,
    true_cost: item.true_cost,
    calories: nullableInteger(item.calories),
    protein_g: item.protein_g,
    sodium_mg: item.sodium_mg,
    carbs_g: item.carbs_g,
    fiber_g: item.fiber_g,
    sugars_g: item.sugars_g,
    added_sugars_g: item.added_sugars_g,
    total_fat_g: item.total_fat_g,
    saturated_fat_g: item.saturated_fat_g,
    trans_fat_g: item.trans_fat_g,
    cholesterol_mg: item.cholesterol_mg,
    potassium_mg: item.potassium_mg,
    calcium_mg: item.calcium_mg,
    iron_mg: item.iron_mg,
    serving_size: item.serving_size || "",
    allergens: item.allergens || [],
    allergen_summary: item.allergen_summary || "",
    allergen_details: item.allergen_details || {},
    vegan_tag: item.vegan_tag || "",
    vegetarian_tag: item.vegetarian_tag || "",
    compass_fit: item.compass_fit || "",
    ghg_emissions: item.ghg_emissions || "",
    source_system: item.source_system || "menuworks",
    source_data_version: item.source_data_version || "",
    source_file_name: item.source_file_name || "",
    source_truth_name: item.source_truth_name || "",
    menuworks_description: item.menuworks_description || "",
    primary_description_source: item.primary_description_source || "",
    effective_date: item.effective_date || null,
    effective_note: item.effective_note || "",
    station_status: item.station_status || "",
    nutrition_payload: item.nutrition_payload || {},
    menuworks_raw: item.menuworks_raw || {},
    source_payload: row || {},
    visible_in_library: true,
    last_verified_at: new Date().toISOString(),
  };
}

async function loadSupabaseRecipeRows() {
  try {
    const params = new URLSearchParams({
      select: "*",
      visible_in_library: "eq.true",
      order: "menu.asc,station.asc,display_name.asc",
      limit: "20000",
    });
    const rows = await supabaseFetch(`recipe_items?${params.toString()}`);
    return { ok: true, rows: Array.isArray(rows) ? rows.map(recipeItemToRow) : [], source: "supabase-recipe-items" };
  } catch (error) {
    return { ok: false, rows: [], source: "server-menuworks-json", message: error.message || "Supabase Recipe Library unavailable." };
  }
}

function buildQuality(rows = []) {
  const total = rows.length;
  const priced = rows.filter((row) => row.price != null && row.price > 0).length;
  const costed = rows.filter((row) => row.trueCost != null).length;
  const described = rows.filter((row) => itemDescription(row) !== "No description loaded yet.").length;
  const allergenRows = rows.filter((row) => row.allergens?.length || row.allergenSummary || Object.values(row.allergenDetails || {}).some(Boolean)).length;
  const photoRows = rows.filter((row) => getRecipeLibraryPhoto(row)).length;

  return {
    total,
    priced,
    costed,
    described,
    allergenRows,
    photoRows,
    missingPhotoRows: Math.max(0, total - photoRows),
    priceCoverage: coveragePct(priced, total),
    costCoverage: coveragePct(costed, total),
    descriptionCoverage: coveragePct(described, total),
    allergenCoverage: coveragePct(allergenRows, total),
    photoCoverage: coveragePct(photoRows, total),
  };
}

function buildMenuSummaries(rows = []) {
  const grouped = new Map();
  rows.forEach((row) => {
    const key = menuName(row);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(row);
  });

  return Array.from(grouped.entries())
    .map(([menu, menuRows]) => ({
      menu,
      count: menuRows.length,
      categories: Array.from(new Set(menuRows.map((row) => recipeLibraryCategoryGroup(row)).filter(Boolean))).length,
      quality: buildQuality(menuRows),
    }))
    .sort((a, b) => a.menu.localeCompare(b.menu));
}

function sendJson(res, status, payload) {
  res.status(status).json(payload);
}

export default async function handler(req, res) {
  if (!["GET", "POST"].includes(req.method)) {
    res.setHeader("Allow", "GET, POST");
    sendJson(res, 405, { ok: false, message: "Recipe Library only supports read and protected backfill requests." });
    return;
  }

  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=3600");

  if (req.method === "POST") {
    await handlePost(req, res);
    return;
  }

  await handleGet(req, res);
}

async function handleGet(req, res) {
  const supabaseRead = await loadSupabaseRecipeRows();
  const fallbackRows = Array.isArray(MENUWORKS_ITEMS) ? MENUWORKS_ITEMS : [];
  const rows = supabaseRead.ok && supabaseRead.rows.length ? supabaseRead.rows : fallbackRows;
  const source = supabaseRead.ok && supabaseRead.rows.length ? supabaseRead.source : "server-menuworks-json";
  const scope = String(req.query.scope || "summary").toLowerCase();
  const menus = buildMenuSummaries(rows);
  const summary = buildQuality(rows);

  if (scope === "summary") {
    sendJson(res, 200, {
      ok: true,
      source,
      scope,
      menus,
      summary,
      fallbackMessage: supabaseRead.ok ? "" : supabaseRead.message,
    });
    return;
  }

  if (scope === "menu") {
    const requestedMenu = String(req.query.menu || menus[0]?.menu || "");
    const selectedMenu = menus.some((entry) => entry.menu === requestedMenu) ? requestedMenu : menus[0]?.menu || "";
    const menuRows = selectedMenu ? rows.filter((row) => menuName(row) === selectedMenu) : [];
    sendJson(res, 200, {
      ok: true,
      source,
      scope,
      menus,
      summary,
      selectedMenu,
      selectedSummary: buildQuality(menuRows),
      rows: menuRows,
      fallbackMessage: supabaseRead.ok ? "" : supabaseRead.message,
    });
    return;
  }

  if (scope === "all") {
    sendJson(res, 200, {
      ok: true,
      source,
      scope,
      menus,
      summary,
      rows,
      fallbackMessage: supabaseRead.ok ? "" : supabaseRead.message,
    });
    return;
  }

  sendJson(res, 400, { ok: false, message: `Unsupported Recipe Library scope: ${scope}` });
}

async function handlePost(req, res) {
  if (!isAuthorized(req)) {
    sendJson(res, 401, { ok: false, message: "Recipe Library backfill requires the admin code." });
    return;
  }

  const action = String(req.body?.action || "").trim();
  if (action !== "backfillRecipeItems") {
    sendJson(res, 400, { ok: false, message: "Unsupported Recipe Library action." });
    return;
  }

  try {
    const sourceRows = Array.isArray(req.body?.rows) && req.body.rows.length ? req.body.rows : MENUWORKS_ITEMS;
    const rows = sourceRows.map(recipeItemPayload);
    for (let index = 0; index < rows.length; index += SUPABASE_BATCH_SIZE) {
      const batch = rows.slice(index, index + SUPABASE_BATCH_SIZE);
      await supabaseFetch("recipe_items?on_conflict=item_key", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify(batch),
      });
    }

    sendJson(res, 200, {
      ok: true,
      source: "supabase-recipe-items",
      message: `Backfilled ${rows.length.toLocaleString()} Recipe Library rows to Supabase.`,
      rowsWritten: rows.length,
      menus: buildMenuSummaries(sourceRows).length,
    });
  } catch (error) {
    sendJson(res, error.status || 500, {
      ok: false,
      source: "supabase-recipe-items",
      message: error.message || "Recipe Library Supabase backfill failed.",
      detail: error.payload || null,
    });
  }
}
