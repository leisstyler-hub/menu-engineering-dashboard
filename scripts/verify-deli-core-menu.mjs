import { readFileSync } from "node:fs";
import { recipeLibraryItemKey } from "../src/features/recipe-database/recipeLibraryModel.js";
import { DELI_CORE_SELECTED_CATALOG } from "../src/features/commissary-ordering/deliCoreCatalog.js";
import recipeLibraryHandler from "../api/recipe-library.js";

const menuItems = JSON.parse(readFileSync("src/data/menuItems.json", "utf8"));
const transferCatalog = JSON.parse(readFileSync("src/data/transferToolCatalog.json", "utf8"));
const rawArchive = JSON.parse(readFileSync("public/data/deli-core-raw-2026-09-30.json", "utf8"));
const menu = "AMZ: Deli Core";
const refreshedMrns = new Set(DELI_CORE_SELECTED_CATALOG.items.map(({ mrn }) => mrn));

function fail(message) {
  console.error(message);
  process.exit(1);
}

const rows = menuItems.filter((row) => row.menu === menu);
if (rows.length !== 165) fail(`Expected 165 authoritative ${menu} rows, found ${rows.length}.`);
if (new Set(rows.map((row) => row.item_key)).size !== 165) fail("Deli Core item keys must remain unique, including portion variants.");
if (rows.filter((row) => !(Number(row.trueCost) > 0)).map(({ mrn }) => mrn).join(",") !== "134362.15") fail("Only source-declared uncosted Deli MRN 134362.15 may remain cost unavailable.");
if (rows.some((row) => row.sourceDataVersion !== "menuworks-authoritative-2026-11-25")) fail("Every Deli Core row must carry the authoritative replacement provenance.");
if (rows.some((row) => !row.culinaryProfile || !row.culinaryProfile.identity?.itemKey || !row.culinaryProfile.provenance?.sourceSha256)) fail("Every Deli Core row must carry its persisted Culinary Tags profile.");
if (rows.some((row) => recipeLibraryItemKey(row) !== row.item_key)) fail("Recipe Library normalization must preserve the explicit Deli Core item key.");
if (rows.filter((row) => row.station === "Curated Sandwiches").length !== 29) fail("Curated Sandwiches count must match the authoritative replacement.");
if (rows.filter((row) => row.station === "Regional Spotlights - Deli").length !== 14) fail("Regional Spotlights - Deli count must be 14.");
if (refreshedMrns.size !== 21) fail("The selected Deli operating catalog must contain 21 exact MRNs after the source-authority update.");
if (!refreshedMrns.has("141826.1") || !refreshedMrns.has("9282.7")) fail("The operating catalog must include source-present exact MRNs 141826.1 and 9282.7.");
if (!rows.some((row) => row.mrn === "141826.1" && Number(row.trueCost) > 0)) fail("Mediterranean Tuna Salad Sandwich must be available with source costing.");
if (!rows.some((row) => row.mrn === "9282.7" && Number(row.trueCost) > 0)) fail("Source-present Buffalo Chicken Wrap MRN 9282.7 must remain available with source costing.");

const catalogRows = transferCatalog.items.filter((row) => row.menu === menu);
if (catalogRows.length !== 165) fail(`Transfer Tool expected 165 ${menu} rows, found ${catalogRows.length}.`);
if (catalogRows.filter((row) => !(Number(row.itemWasteCost) > 0)).map(({ mrn }) => mrn).join(",") !== "134362.15") fail("Transfer Tool must expose the one uncosted source item explicitly without inventing a value.");
if (rawArchive.length !== 41) fail(`Deli Core raw archive expected 41 rows, found ${rawArchive.length}.`);

for (const consumer of [
  ["src/features/recipe-database/RecipeDatabase.jsx", "/api/recipe-library"],
  ["src/features/menu-audit/MenuAuditTool.jsx", "/api/recipe-library?scope=all"],
  ["src/features/cafe-tasting/CafeTastingForm.jsx", "/api/recipe-library?scope=summary"],
  ["src/features/transfer-tool/transferStorage.js", "/api/recipe-library?scope=all"],
]) {
  if (!readFileSync(consumer[0], "utf8").includes(consumer[1])) fail(`${consumer[0]} is no longer connected to the shared Recipe Library source.`);
}

async function invokeRecipeLibrary(body, headers = {}) {
  let statusCode = 0;
  let responseBody = null;
  await recipeLibraryHandler(
    { method: "POST", query: {}, headers, body },
    {
      setHeader() {},
      status(code) {
        statusCode = code;
        return {
          json(payload) {
            responseBody = payload;
          },
        };
      },
    }
  );
  return { statusCode, body: responseBody };
}

const originalFetch = globalThis.fetch;
const originalSupabaseUrl = process.env.SUPABASE_URL;
const originalServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const originalAdminCode = process.env.RECIPE_LIBRARY_ADMIN_CODE;
try {
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
  process.env.RECIPE_LIBRARY_ADMIN_CODE = "test-admin-code";
  let requestedUrl = "";
  globalThis.fetch = async (url) => {
    requestedUrl = String(url);
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify([
        { item_key: "mrn:amz: deli core:100", menu, visible_in_library: true },
        { item_key: "mrn:amz: deli core:101", menu, visible_in_library: false },
      ]),
    };
  };

  const unauthorizedAudit = await invokeRecipeLibrary({ action: "auditRecipeMenuScope", menu });
  if (unauthorizedAudit.statusCode !== 401) fail("Exact-menu Supabase audit must reject unauthorized requests.");
  if (requestedUrl) fail("Unauthorized exact-menu audit must not query Supabase.");

  const authorizedAudit = await invokeRecipeLibrary(
    { action: "auditRecipeMenuScope", menu },
    { "x-admin-code": "test-admin-code" }
  );
  if (authorizedAudit.statusCode !== 200) fail("Authorized exact-menu Supabase audit did not succeed.");
  if (authorizedAudit.body?.count !== 2 || authorizedAudit.body?.visibleCount !== 1 || authorizedAudit.body?.hiddenCount !== 1) {
    fail("Exact-menu Supabase audit must report both visible and hidden rows.");
  }
  const auditedUrl = new URL(requestedUrl);
  if (auditedUrl.searchParams.get("menu") !== `eq.${menu}`) fail("Exact-menu Supabase audit did not preserve the full menu name filter.");
  if (!String(auditedUrl.searchParams.get("select") || "").includes("visible_in_library")) fail("Exact-menu Supabase audit must read visibility state.");
} finally {
  globalThis.fetch = originalFetch;
  if (originalSupabaseUrl === undefined) delete process.env.SUPABASE_URL;
  else process.env.SUPABASE_URL = originalSupabaseUrl;
  if (originalServiceKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  else process.env.SUPABASE_SERVICE_ROLE_KEY = originalServiceKey;
  if (originalAdminCode === undefined) delete process.env.RECIPE_LIBRARY_ADMIN_CODE;
  else process.env.RECIPE_LIBRARY_ADMIN_CODE = originalAdminCode;
}

console.log("Deli Core authoritative replacement verified: 165 source rows feed shared tools; the protected Supabase audit includes hidden rows; exact additions/deletions and Culinary Tags profiles are enforced.");
