import { readFileSync } from "node:fs";
import { recipeLibraryItemKey } from "../src/features/recipe-database/recipeLibraryModel.js";
import recipeLibraryHandler from "../api/recipe-library.js";

const menuItems = JSON.parse(readFileSync("src/data/menuItems.json", "utf8"));
const transferCatalog = JSON.parse(readFileSync("src/data/transferToolCatalog.json", "utf8"));
const rawArchive = JSON.parse(readFileSync("public/data/deli-core-raw-2026-09-30.json", "utf8"));
const menu = "AMZ: Deli Core";
const omitted = new Set(["134362.15", "141826"]);

function fail(message) {
  console.error(message);
  process.exit(1);
}

const rows = menuItems.filter((row) => row.menu === menu);
if (rows.length !== 41) fail(`Expected 41 ${menu} rows, found ${rows.length}.`);
if (new Set(rows.map((row) => row.mrn)).size !== 41) fail("Deli Core MRNs are not unique within the menu.");
if (rows.some((row) => omitted.has(row.mrn))) fail("An explicitly omitted uncosted Deli Core item is present.");
if (rows.some((row) => !Number.isFinite(row.trueCost) || row.trueCost <= 0)) fail("Every Deli Core row must have a positive Item + Waste Cost.");
if (rows.some((row) => !row.enticingDescription || !String(row.primaryDescriptionSource).startsWith("ssmt-reference:"))) fail("Every Deli Core row must have an SSMT description.");
if (rows.some((row) => row.item_key !== `mrn:${menu.toLowerCase()}:${row.mrn}`)) fail("Every Deli Core row must use a stable menu-scoped MRN item key.");
if (rows.some((row) => recipeLibraryItemKey(row) !== row.item_key)) fail("Recipe Library normalization must preserve the explicit Deli Core item key.");
if (rows.filter((row) => row.station === "Curated Sandwiches").length !== 27) fail("Curated Sandwiches count must be 27 after omissions.");
if (rows.filter((row) => row.station === "Regional Spotlights - Deli").length !== 14) fail("Regional Spotlights - Deli count must be 14.");
if (rows.some((row) => row.category !== "entree")) fail("Deli Core sandwich rows must remain entree selections.");
if (rows.find((row) => row.mrn === "105146.3")?.primaryDescriptionSource !== "ssmt-reference:CAFE EXPRESS") fail("Chimichurri Steak must use its exact-MRN CAFE EXPRESS SSMT fallback.");

const catalogRows = transferCatalog.items.filter((row) => row.menu === menu);
if (catalogRows.length !== 41) fail(`Transfer Tool expected 41 ${menu} rows, found ${catalogRows.length}.`);
if (catalogRows.some((row) => !Number.isFinite(row.itemWasteCost) || row.itemWasteCost <= 0)) fail("Transfer Tool Deli Core rows must all carry Item + Waste Cost.");
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

console.log("Deli Core import verified: 41 costed, described rows feed shared tools; the protected Supabase audit includes hidden rows; 2 uncosted MRNs remain omitted.");
