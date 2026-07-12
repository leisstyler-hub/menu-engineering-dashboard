import { Buffer } from "node:buffer";
import { getRecipeLibraryPhoto } from "../src/data/recipeLibraryAssets.js";
import { itemDescription, normalizeRecipeLibraryItem, recipeLibraryCategoryGroup, textValue } from "../src/features/recipe-database/recipeLibraryModel.js";

const DEFAULT_SUPABASE_URL = "https://pzilyzqhatthctgsjwtt.supabase.co";
const SUPABASE_BATCH_SIZE = 250;
const SUPABASE_READ_PAGE_SIZE = 1000;
const DOCUMENT_BUCKETS = {
  "item-photo": "item-photos",
  "plating-guide": "plating-guides",
  "recipe-file": "recipe-files",
};
let menuWorksFallbackRowsPromise = null;

async function loadMenuWorksFallbackRows() {
  if (!menuWorksFallbackRowsPromise) {
    menuWorksFallbackRowsPromise = import("../src/data/menuItems.json", { with: { type: "json" } })
      .then((module) => (Array.isArray(module.default) ? module.default : []));
  }
  return menuWorksFallbackRowsPromise;
}

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

function requestBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

function isAuthorized(req, body = requestBody(req)) {
  const expected = getAdminCode();
  const provided = String(req.headers["x-admin-code"] || body?.adminCode || req.query.adminCode || "").trim();
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

async function supabaseStorageFetch(path, options = {}) {
  const config = getSupabaseServerConfig();
  if (!config.configured) {
    const error = new Error("Supabase server key is not configured yet.");
    error.status = 503;
    throw error;
  }

  const response = await fetch(`${config.url}/storage/v1/${path}`, {
    ...options,
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const error = new Error(payload?.message || payload?.error || `Supabase Storage error ${response.status}`);
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

function nullableNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(number) ? number : null;
}

function activeDocumentsForRow(row = {}) {
  return Array.isArray(row.recipe_documents)
    ? row.recipe_documents.filter((document) => document?.is_active !== false)
    : [];
}

function hasAttachedPhoto(row = {}) {
  return Boolean(getRecipeLibraryPhoto(row) || activeDocumentsForRow(row).some((document) => document.document_type === "item-photo"));
}

function recipeItemToRow(row = {}) {
  const recipeDocuments = activeDocumentsForRow(row);
  if (row.source_payload && typeof row.source_payload === "object" && Object.keys(row.source_payload).length) {
    return {
      ...row.source_payload,
      id: row.source_payload.id ?? row.source_row_id ?? row.item_key,
      item_key: row.item_key,
      recipeDocuments,
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
    recipeDocuments,
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
    const rows = [];
    for (let offset = 0; offset < 50000; offset += SUPABASE_READ_PAGE_SIZE) {
      const params = new URLSearchParams({
        select: "*",
        visible_in_library: "eq.true",
        order: "menu.asc,station.asc,display_name.asc",
      });
      const page = await supabaseFetch(`recipe_items?${params.toString()}`, {
        headers: {
          "Range-Unit": "items",
          Range: `${offset}-${offset + SUPABASE_READ_PAGE_SIZE - 1}`,
        },
      });
      const pageRows = Array.isArray(page) ? page : [];
      rows.push(...pageRows);
      if (pageRows.length < SUPABASE_READ_PAGE_SIZE) break;
    }
    let documents = [];
    try {
      documents = await loadSupabaseRecipeDocuments();
    } catch {
      documents = [];
    }
    return { ok: true, rows: attachDocumentsToRows(rows, documents), source: "supabase-recipe-items" };
  } catch (error) {
    return { ok: false, rows: [], source: "server-menuworks-json", message: error.message || "Supabase Recipe Library unavailable." };
  }
}

function postgrestQuotedList(values = []) {
  return values
    .map((value) => `"${String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`)
    .join(",");
}

async function loadSupabaseRecipeItemKeys() {
  const keys = [];
  for (let offset = 0; offset < 50000; offset += SUPABASE_READ_PAGE_SIZE) {
    const params = new URLSearchParams({
      select: "item_key",
      visible_in_library: "eq.true",
    });
    const page = await supabaseFetch(`recipe_items?${params.toString()}`, {
      headers: {
        "Range-Unit": "items",
        Range: `${offset}-${offset + SUPABASE_READ_PAGE_SIZE - 1}`,
      },
    });
    const pageRows = Array.isArray(page) ? page : [];
    pageRows.forEach((row) => {
      if (row?.item_key) keys.push(row.item_key);
    });
    if (pageRows.length < SUPABASE_READ_PAGE_SIZE) break;
  }
  return keys;
}

async function hideStaleSupabaseRecipeItems(activeItemKeys = new Set()) {
  const currentKeys = await loadSupabaseRecipeItemKeys();
  const staleKeys = currentKeys.filter((key) => !activeItemKeys.has(key));
  for (let index = 0; index < staleKeys.length; index += 100) {
    const batch = staleKeys.slice(index, index + 100);
    await supabaseFetch(`recipe_items?item_key=in.(${postgrestQuotedList(batch)})`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        visible_in_library: false,
        last_verified_at: new Date().toISOString(),
      }),
    });
  }
  return staleKeys.length;
}

function attachDocumentsToRows(rows = [], documents = []) {
  const documentsByKey = new Map();
  documents.forEach((document) => {
    if (!document?.item_key) return;
    const current = documentsByKey.get(document.item_key) || [];
    current.push(document);
    documentsByKey.set(document.item_key, current);
  });
  return rows.map((row) => recipeItemToRow({ ...row, recipe_documents: documentsByKey.get(row.item_key) || [] }));
}

function encodeStoragePath(path = "") {
  return String(path).split("/").map((part) => encodeURIComponent(part)).join("/");
}

function absoluteSignedUrl(path = "") {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  const config = getSupabaseServerConfig();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${config.url}/storage/v1${normalized}`;
}

async function addSignedUrlToDocument(document) {
  if (!document?.storage_bucket || !document?.storage_path) return document;
  try {
    const payload = await supabaseStorageFetch(`object/sign/${document.storage_bucket}/${encodeStoragePath(document.storage_path)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expiresIn: 60 * 60 }),
    });
    const signedPath = payload?.signedURL || payload?.signedUrl || payload?.signed_url || "";
    return { ...document, signed_url: absoluteSignedUrl(signedPath) };
  } catch {
    return document;
  }
}

async function loadSupabaseRecipeDocuments(itemKey = "") {
  const rows = [];
  for (let offset = 0; offset < 50000; offset += SUPABASE_READ_PAGE_SIZE) {
    const params = new URLSearchParams({
      select: "*",
      is_active: "eq.true",
      order: "uploaded_at.desc",
    });
    if (itemKey) params.set("item_key", `eq.${itemKey}`);
    const page = await supabaseFetch(`recipe_item_documents?${params.toString()}`, {
      headers: {
        "Range-Unit": "items",
        Range: `${offset}-${offset + SUPABASE_READ_PAGE_SIZE - 1}`,
      },
    });
    const pageRows = Array.isArray(page) ? page : [];
    rows.push(...pageRows);
    if (itemKey || pageRows.length < SUPABASE_READ_PAGE_SIZE) break;
  }
  return Promise.all(rows.map(addSignedUrlToDocument));
}

function buildQuality(rows = []) {
  const total = rows.length;
  const priced = rows.filter((row) => row.price != null && row.price > 0).length;
  const costed = rows.filter((row) => row.trueCost != null).length;
  const described = rows.filter((row) => itemDescription(row) !== "No description loaded yet.").length;
  const allergenRows = rows.filter((row) => row.allergens?.length || row.allergenSummary || Object.values(row.allergenDetails || {}).some(Boolean)).length;
  const photoRows = rows.filter(hasAttachedPhoto).length;

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
  const usesSupabaseRows = supabaseRead.ok && supabaseRead.rows.length;
  const rows = usesSupabaseRows ? supabaseRead.rows : await loadMenuWorksFallbackRows();
  const source = usesSupabaseRows ? supabaseRead.source : "server-menuworks-json";
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
  const body = requestBody(req);
  const action = String(body?.action || "").trim();

  if (action === "updateRecipeItem") {
    await handleUpdateRecipeItem(req, res, body);
    return;
  }

  if (action === "uploadRecipeDocument") {
    await handleUploadRecipeDocument(req, res, body);
    return;
  }

  if (action !== "backfillRecipeItems") {
    sendJson(res, 400, { ok: false, message: "Unsupported Recipe Library action." });
    return;
  }

  if (!isAuthorized(req, body)) {
    sendJson(res, 401, { ok: false, message: "Recipe Library backfill requires the admin code." });
    return;
  }

  try {
    const sourceRows = Array.isArray(body?.rows) && body.rows.length ? body.rows : await loadMenuWorksFallbackRows();
    const rows = sourceRows.map(recipeItemPayload);
    const activeItemKeys = new Set(rows.map((row) => row.item_key).filter(Boolean));
    for (let index = 0; index < rows.length; index += SUPABASE_BATCH_SIZE) {
      const batch = rows.slice(index, index + SUPABASE_BATCH_SIZE);
      await supabaseFetch("recipe_items?on_conflict=item_key", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify(batch),
      });
    }
    const rowsHidden = await hideStaleSupabaseRecipeItems(activeItemKeys);

    sendJson(res, 200, {
      ok: true,
      source: "supabase-recipe-items",
      message: `Backfilled ${rows.length.toLocaleString()} Recipe Library rows to Supabase and hid ${rowsHidden.toLocaleString()} stale rows.`,
      rowsWritten: rows.length,
      rowsHidden,
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

async function getRecipeItemRecord(itemKey) {
  const params = new URLSearchParams({
    select: "*",
    item_key: `eq.${itemKey}`,
    limit: "1",
  });
  const rows = await supabaseFetch(`recipe_items?${params.toString()}`);
  return Array.isArray(rows) ? rows[0] : null;
}

async function handleUpdateRecipeItem(req, res, body) {
  try {
    const itemKey = String(body?.itemKey || "").trim();
    if (!itemKey) {
      sendJson(res, 400, { ok: false, message: "Recipe item update needs an item key." });
      return;
    }
    const current = await getRecipeItemRecord(itemKey);
    if (!current) {
      sendJson(res, 404, { ok: false, message: "Recipe item was not found in Supabase." });
      return;
    }

    const patch = body?.patch || {};
    const displayName = String(patch.display_name ?? current.display_name ?? "Unnamed item").trim() || "Unnamed item";
    const description = String(patch.description ?? current.description ?? "").trim();
    const allergenSummary = String(patch.allergen_summary ?? current.allergen_summary ?? "").trim();
    const calories = nullableInteger(patch.calories);
    const proteinG = nullableNumber(patch.protein_g);
    const price = nullableNumber(patch.price);
    const trueCost = nullableNumber(patch.true_cost);
    const sourcePayload = {
      ...(current.source_payload || {}),
      displayName,
      item: displayName,
      enticingDescription: description,
      allergenSummary,
      calories,
      protein_g: proteinG,
      price,
      trueCost,
      updatedFromRecipeLibrary: true,
      recipeLibraryUpdatedAt: new Date().toISOString(),
    };

    const params = new URLSearchParams({ item_key: `eq.${itemKey}` });
    const updated = await supabaseFetch(`recipe_items?${params.toString()}`, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        display_name: displayName,
        description,
        allergen_summary: allergenSummary,
        calories,
        protein_g: proteinG,
        price,
        true_cost: trueCost,
        source_payload: sourcePayload,
        last_verified_at: new Date().toISOString(),
      }),
    });
    const updatedRecord = Array.isArray(updated) ? updated[0] : updated;
    const documents = await loadSupabaseRecipeDocuments(itemKey).catch(() => []);
    sendJson(res, 200, {
      ok: true,
      source: "supabase-recipe-items",
      message: "Recipe Library card saved to Supabase.",
      row: recipeItemToRow({ ...updatedRecord, recipe_documents: documents }),
    });
  } catch (error) {
    sendJson(res, error.status || 500, {
      ok: false,
      source: "supabase-recipe-items",
      message: error.message || "Recipe Library card save failed.",
      detail: error.payload || null,
    });
  }
}

function sanitizePathPart(value = "") {
  return String(value || "file")
    .trim()
    .replace(/[^a-z0-9._-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 140) || "file";
}

function base64ToBuffer(value = "") {
  const raw = String(value || "");
  const [, data = raw] = raw.includes(",") ? raw.split(",", 2) : ["", raw];
  return Buffer.from(data, "base64");
}

async function nextDocumentVersion(itemKey, documentType) {
  const params = new URLSearchParams({
    select: "id",
    item_key: `eq.${itemKey}`,
    document_type: `eq.${documentType}`,
  });
  const rows = await supabaseFetch(`recipe_item_documents?${params.toString()}`);
  return `v${(Array.isArray(rows) ? rows.length : 0) + 1}`;
}

async function handleUploadRecipeDocument(req, res, body) {
  try {
    const itemKey = String(body?.itemKey || "").trim();
    const documentType = String(body?.documentType || "").trim();
    const fileName = String(body?.fileName || "").trim();
    const mimeType = String(body?.mimeType || "application/octet-stream").trim();
    const fileBase64 = String(body?.fileBase64 || "");
    const bucket = DOCUMENT_BUCKETS[documentType];
    if (!itemKey || !bucket || !fileName || !fileBase64) {
      sendJson(res, 400, { ok: false, message: "Recipe file upload needs an item, file type, file name, and file contents." });
      return;
    }
    const current = await getRecipeItemRecord(itemKey);
    if (!current) {
      sendJson(res, 404, { ok: false, message: "Recipe item was not found in Supabase." });
      return;
    }

    const buffer = base64ToBuffer(fileBase64);
    if (!buffer.length) {
      sendJson(res, 400, { ok: false, message: "The uploaded file was empty." });
      return;
    }

    const versionLabel = await nextDocumentVersion(itemKey, documentType);
    const storagePath = `${sanitizePathPart(itemKey)}/${documentType}/${Date.now()}-${sanitizePathPart(fileName)}`;
    await supabaseStorageFetch(`object/${bucket}/${encodeStoragePath(storagePath)}`, {
      method: "POST",
      headers: {
        "Content-Type": mimeType,
        "x-upsert": "false",
      },
      body: buffer,
    });

    const activeParams = new URLSearchParams({
      item_key: `eq.${itemKey}`,
      document_type: `eq.${documentType}`,
      is_active: "eq.true",
    });
    await supabaseFetch(`recipe_item_documents?${activeParams.toString()}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ is_active: false }),
    });

    const inserted = await supabaseFetch("recipe_item_documents", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        item_key: itemKey,
        document_type: documentType,
        storage_bucket: bucket,
        storage_path: storagePath,
        file_name: fileName,
        mime_type: mimeType,
        file_size_bytes: buffer.length,
        uploaded_by: String(body?.uploadedBy || "Recipe Library").trim() || "Recipe Library",
        version_label: versionLabel,
        notes: String(body?.notes || "").trim(),
        is_active: true,
      }),
    });
    const document = await addSignedUrlToDocument(Array.isArray(inserted) ? inserted[0] : inserted);
    sendJson(res, 200, {
      ok: true,
      source: "supabase-recipe-documents",
      message: `${documentType === "item-photo" ? "Photo" : "File"} saved to Supabase Storage.`,
      document,
    });
  } catch (error) {
    sendJson(res, error.status || 500, {
      ok: false,
      source: "supabase-recipe-documents",
      message: error.message || "Recipe file upload failed.",
      detail: error.payload || null,
    });
  }
}
