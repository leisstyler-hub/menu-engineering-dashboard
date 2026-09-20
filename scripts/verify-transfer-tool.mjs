import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import JSZip from "jszip";
import CATALOG from "../src/data/transferToolCatalog.json" with { type: "json" };
import INGREDIENT_COSTING_LOOKUP from "../api/data/ingredientCosting91926.json" with { type: "json" };
import { buildS4Workbook, S4_TEMPLATE_SHA256 } from "../src/features/transfer-tool/transferExport.js";
import { cafeProfitCenter } from "../src/features/transfer-tool/cafeProfitCenters.js";
import { balanceIngredientAllocations, defaultTransferDescription, normalizeTransferTitle, PREPARED_FOODS_GL_CODE, refreshCopiedItems, S4_EXPORT_VERSION, transferRecordId, transferTotal, validateS4Transfer, validateTransfer } from "../src/features/transfer-tool/transferModel.js";
import { CAFE_UNITS } from "../src/shared/cafeUnits.js";

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");
const fail = (message) => { console.error(`Transfer Tool verification failed: ${message}`); process.exit(1); };

if (CATALOG.menus.length !== 53 || CATALOG.items.length < 1483) fail("catalog does not cover the current menu/item source");
if (!CATALOG.items.every((item) => item.menu && item.item && Object.hasOwn(item, "itemWasteCost") && !Object.hasOwn(item, "glGroups"))) fail("catalog contains malformed or legacy G/L rows");
const caprese = INGREDIENT_COSTING_LOOKUP.recipes["34303.45"];
const capreseMozzarella = caprese?.components?.find((component) => component.ingredientMrn === "7776");
const capreseTomato = caprese?.components?.find((component) => component.ingredientMrn === "7552");
const pintoBeans = INGREDIENT_COSTING_LOOKUP.recipes["157816"]?.components?.find((component) => component.ingredientMrn === "169551");
const caesar = INGREDIENT_COSTING_LOOKUP.recipes["37311.43"];
const caesarParmesan = caesar?.components?.find((component) => component.ingredientMrn === "1648");
const caesarRomaine = caesar?.components?.find((component) => component.ingredientMrn === "3760");
const blta = INGREDIENT_COSTING_LOOKUP.recipes["9182.8"];
const bltaAvocado = blta?.components?.find((component) => component.ingredientMrn === "276");
const arcadianComponents = Object.values(INGREDIENT_COSTING_LOOKUP.recipes).flatMap((recipe) => recipe.components || []).filter((component) => component.ingredientMrn === "118307");
if (capreseMozzarella?.unitPrice !== 0.32 || capreseMozzarella?.allocationPerPortion !== 1.28 || capreseTomato?.priceSourceMrn !== "16479" || capreseTomato?.allocationPerPortion !== 0.18 || pintoBeans?.allocationPerPortion !== 0.08 || caesarParmesan?.allocationPerPortion !== 0.24 || caesarRomaine?.priceSourceMrn !== "3756" || caesarRomaine?.allocationPerPortion !== 0.29 || caesar?.unpricedComponents?.length !== 0 || bltaAvocado?.priceSourceMrn !== "276" || bltaAvocado?.priceSourceUnit !== "cup" || bltaAvocado?.allocationPerPortion !== 0.3728 || blta?.unpricedComponents?.length !== 0) {
  fail("ingredient lookup must use canonical prices, structural source inference, normalized ingredient-form matching, and approved unit conversions");
}
const substituteComponents = Object.values(INGREDIENT_COSTING_LOOKUP.recipes).flatMap((recipe) => recipe.components || []).filter((component) => component.isSubstitutePrice);
if (!substituteComponents.length || substituteComponents.some((component) => !/Substitute price used/i.test(component.priceSourceNote || ""))) {
  fail("ingredient lookup must expose clearly labeled, name-anchored substitute prices when an exact price is unavailable");
}
if (!arcadianComponents.length || arcadianComponents.some((component) => component.priceSourceMrn !== "3753" || component.unitPrice !== 0.59 || !/approved.*Spring \(Mesclun\).*1 cup = 1 ounce/i.test(component.priceSourceNote || "")) || arcadianComponents.some((component) => component.priceSourceMrn === "87650")) {
  fail("Arcadian Classic Mix must use the approved Spring Mesclun source MRN 3753 and never Spam");
}
const balancedAllocation = balanceIngredientAllocations({
  components: [{ ingredientMrn: "known", ingredientName: "Known ingredient", glCode: "4111005", allocationPerPortion: 2.2 }],
  unpricedComponents: [{ ingredientMrn: "missing", ingredientName: "Missing ingredient", glCode: "4111012", allocationPerPortion: null }],
  itemWasteCost: 2.3,
});
if (!balancedAllocation.pricingComplete || balancedAllocation.allocationPerPortion !== 2.3 || balancedAllocation.residualCost !== 0.1 || balancedAllocation.ingredientAllocations.at(-1)?.glCode !== PREPARED_FOODS_GL_CODE || !balancedAllocation.ingredientAllocations.at(-1)?.isResidualCostBalance) {
  fail("unpriced components must retain the Item + Waste Cost through a Prepared Foods cost balance adjustment");
}
if (transferRecordId(" My  Transfer ") !== "transfer|my%20transfer") fail("title identity is not deterministic");
if (normalizeTransferTitle(" MY   TRANSFER ") !== "my transfer") fail("title normalization is not case/space insensitive");
if (transferTotal([{ quantity: 2, allocationPerPortion: 1.234 }]) !== 2.468) fail("ingredient allocation total is incorrect");
if (cafeProfitCenter("Dawson") !== "28676" || cafeProfitCenter("Astra") !== "62844" || cafeProfitCenter("Eclipse") !== "62100" || cafeProfitCenter("LAX78") !== "64002" || cafeProfitCenter("SNA3") !== "44280") fail("cafe profit-center mapping is incorrect");
if (!CAFE_UNITS.every(({ cafe }) => /^\d{5}$/.test(cafeProfitCenter(cafe)))) fail("one or more current cafés are missing a five-digit profit center");
if (defaultTransferDescription("Tuna Sandwich", "Dawson to Nessie").length > 50) fail("default descriptions are not capped at 50 characters");
const refreshed = refreshCopiedItems([{ catalogId: CATALOG.items[0].id, itemWasteCost: 999 }], CATALOG.items);
if (refreshed[0].itemWasteCost === 999) fail("copied transfers do not refresh current cost");
const duplicateErrors = validateTransfer({ title: " Existing ", departingUnit: "Dawson", receivingUnit: "Nessie", transferDate: "2026-09-10", items: [{ catalogId: "x", quantity: 1 }] }, [{ title: "existing" }]);
if (!duplicateErrors.title) fail("duplicate global title validation is missing");

const api = read("api/storage/records.js");
const storage = read("src/features/transfer-tool/transferStorage.js");
const component = read("src/features/transfer-tool/TransferTool.jsx");
for (const marker of ["createTransfer", "deleteTransfer", "Titles must be globally unique", "like.transfer|*"]) if (!api.includes(marker)) fail(`API is missing ${marker}`);
for (const marker of ["createTransfer", "deleteTransfer", "tool: \"transfers\"", "/api/recipe-library?scope=all", "row.trueCost"]) if (!storage.includes(marker)) fail(`storage client is missing ${marker}`);
for (const marker of ["Ingredient Costing 9.19.26", "Automatic ingredient G/L allocation", "Substitute price used", "Prepared Foods cost balance", "Export S4 Excel", "Batch export staging", "Include in batch export", "Delete saved transfer", "DRAFT"]) if (!component.includes(marker)) fail(`UI is missing ${marker}`);
for (const removedMarker of ["G/L Breakdown", "S4_GL_ACCOUNTS", "Choose G/L"]) if (component.includes(removedMarker)) fail(`UI still contains retired manual G/L UI ${removedMarker}`);

console.log(`Transfer Tool verification passed: ${CATALOG.menus.length} menus, ${CATALOG.items.length} menu-scoped cost records.`);

const templatePath = join(root, "public/templates/ExpenseTransfer_Between_PC_Template.xlsx");
const templateBytes = readFileSync(templatePath);
const templateHash = createHash("sha256").update(templateBytes).digest("hex").toUpperCase();
if (templateHash !== S4_TEMPLATE_SHA256) fail(`S4 template hash changed: ${templateHash}`);
const exportTransfer = {
  title: "S4 Verification",
  receivingProfitCenter: "30159",
  eventId: "EVENT-1",
  items: [{ catalogId: "x", item: "=Formula-like item", quantity: 2, itemWasteCost: 1.23456, allocationPerPortion: 1.23456, ingredientAllocations: [{ ingredientMrn: "1", ingredientName: "ingredient", glCode: "4111001", allocationPerPortion: 1.23456 }] }],
};
if (Object.keys(validateS4Transfer(exportTransfer)).length) fail("valid S4 transfer was rejected");
const exportedBytes = await buildS4Workbook(templateBytes, exportTransfer);
const sourceZip = await JSZip.loadAsync(templateBytes);
const exportZip = await JSZip.loadAsync(exportedBytes);
for (const path of Object.keys(sourceZip.files)) {
  if (!exportZip.file(path)) fail(`S4 export dropped template part ${path}`);
  if (path === "xl/worksheets/sheet1.xml" || sourceZip.files[path].dir) continue;
  const [sourcePart, exportPart] = await Promise.all([sourceZip.file(path).async("uint8array"), exportZip.file(path).async("uint8array")]);
  if (Buffer.compare(Buffer.from(sourcePart), Buffer.from(exportPart)) !== 0) fail(`S4 export changed protected template part ${path}`);
}
const sheetXml = await exportZip.file("xl/worksheets/sheet1.xml").async("string");
if (!sheetXml.includes('r="A2" t="inlineStr"') || !sheetXml.includes("=Formula-like item") || sheetXml.includes("<f>")) fail("S4 text cells are not safely emitted as inline strings");
if (!sheetXml.includes('r="E2" t="n"><v>2.47</v>')) fail("S4 amount does not round quantity x cost to two decimal places");
if ((sheetXml.match(/<row r="2"/g) || []).length !== 1) fail("S4 export did not create one row per transfer line");
console.log(`S4 exact-template verification passed: ${templateHash}, sheet1-only patch, safe inline strings.`);

process.env.SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
const { default: storageHandler } = await import("../api/storage/records.js");
const originalFetch = globalThis.fetch;

function invoke(body) {
  let statusCode = 0;
  let payload = null;
  return storageHandler(
    { method: "POST", query: {}, body, headers: {} },
    { status(code) { statusCode = code; return { json(value) { payload = value; } }; }, setHeader() {} },
  ).then(() => ({ statusCode, payload }));
}

const title = "Globally Unique Transfer";
const record = {
  "Record ID": transferRecordId(title),
  "Record Type": "Transfer",
  "Visible In Dashboard": true,
  title,
  departingUnit: "Dawson",
  receivingUnit: "Nessie",
  transferDate: "2026-09-10",
  items: [{ catalogId: "menu|item|mrn|portion", menu: "Menu", item: "Item", quantity: 2, itemWasteCost: 1.25, allocationPerPortion: 1.25, ingredientAllocations: [{ ingredientMrn: "1", ingredientName: "Ingredient", glCode: "4111005", allocationPerPortion: 1.25 }] }],
  totalValue: 2.5,
};
const s4Record = {
  ...record,
  s4ExportVersion: S4_EXPORT_VERSION,
  departingProfitCenter: "28676",
  receivingProfitCenter: "30159",
  eventId: "EVENT-1",
  items: record.items,
};
try {
  let insertCalls = 0;
  globalThis.fetch = async (url, options = {}) => {
    const href = String(url);
    if (href.includes("record_id=eq.transfer")) return { ok: true, status: 200, text: async () => "[]" };
    if (href.endsWith("/rest/v1/app_records") && options.method === "POST") {
      insertCalls += 1;
      return { ok: true, status: 201, text: async () => "" };
    }
    throw new Error(`Unexpected Transfer Tool API fetch: ${href}`);
  };
  const created = await invoke({ action: "createTransfer", records: [record], context: { tool: "transfers" } });
  if (created.statusCode !== 201 || insertCalls !== 1) fail("create-only API path did not insert a unique title");

  globalThis.fetch = async (url) => {
    const href = String(url);
    if (href.includes("record_id=eq.transfer")) return { ok: true, status: 200, text: async () => JSON.stringify([{ record_id: record["Record ID"] }]) };
    throw new Error(`Duplicate title should not insert: ${href}`);
  };
  const duplicate = await invoke({ action: "createTransfer", records: [record], context: { tool: "transfers" } });
  if (duplicate.statusCode !== 409 || !/globally unique/i.test(duplicate.payload?.message || "")) fail("create-only API path did not reject a duplicate title");

  globalThis.fetch = async () => { throw new Error("A disguised transfer write must be rejected before storage access."); };
  const disguised = await invoke({ action: "upsertRecords", records: [record], context: { tool: "rotation" } });
  if (disguised.statusCode !== 400 || !/transfer context/i.test(disguised.payload?.message || "")) fail("generic upsert accepted a transfer under misleading context");

  const renamed = { ...record, title: "Renamed Transfer" };
  const invalidRename = await invoke({ action: "upsertRecords", records: [renamed], context: { tool: "transfers" } });
  if (invalidRename.statusCode !== 400 || !/identity/i.test(invalidRename.payload?.message || "")) fail("generic upsert accepted a mismatched transfer title and identity");

  globalThis.fetch = async (url, options = {}) => {
    const href = String(url);
    if (href.includes("record_payload") && href.includes("record_id=eq.transfer")) {
      return { ok: true, status: 200, text: async () => JSON.stringify([{ record_id: record["Record ID"], record_payload: { title } }]) };
    }
    if (href.includes("on_conflict=record_id") && options.method === "POST") return { ok: true, status: 201, text: async () => "" };
    throw new Error(`Unexpected validated update fetch: ${href}`);
  };
  const updated = await invoke({ action: "upsertRecords", records: [record], context: { tool: "transfers" } });
  if (updated.statusCode !== 200) fail("validated immutable-title transfer update did not save");

  const validS4 = await invoke({ action: "upsertRecords", records: [s4Record], context: { tool: "transfers" } });
  if (validS4.statusCode !== 200) fail("valid versioned S4 transfer did not save");

  const invalidS4 = await invoke({ action: "upsertRecords", records: [{ ...s4Record, receivingProfitCenter: "" }], context: { tool: "transfers" } });
  if (invalidS4.statusCode !== 400 || !/profit center/i.test(invalidS4.payload?.message || "")) fail("versioned S4 transfer accepted missing receiving profit center");

  let deleteCalls = 0;
  globalThis.fetch = async (url, options = {}) => {
    const href = String(url);
    if (options.method === "DELETE") {
      deleteCalls += 1;
      return { ok: true, status: 204, text: async () => "" };
    }
    if (href.includes("parent_record_id") || href.includes("record_id=like.")) return { ok: true, status: 200, text: async () => "[]" };
    if (href.includes("record_id=eq.")) return { ok: true, status: 200, text: async () => JSON.stringify([{ record_id: record["Record ID"] }]) };
    throw new Error(`Unexpected transfer delete fetch: ${href}`);
  };
  const deleted = await invoke({ action: "deleteTransfer", recordId: record["Record ID"], context: { tool: "transfers" } });
  if (deleted.statusCode !== 200 || deleteCalls !== 1 || deleted.payload?.action !== "deleteTransfer") fail("transfer-only delete did not remove exactly one saved transfer");

  globalThis.fetch = async () => { throw new Error("Invalid transfer delete must be rejected before storage access."); };
  const invalidDeletes = [
    { recordId: "rotation|unsafe", context: { tool: "rotation" } },
    { recordId: ["transfer|one", "transfer|two"], context: { tool: "transfers" } },
    { recordId: "transfer|", context: { tool: "transfers" } },
    { recordId: "transfer|one|two", context: { tool: "transfers" } },
  ];
  for (const invalidDeleteRequest of invalidDeletes) {
    const invalidDelete = await invoke({ action: "deleteTransfer", ...invalidDeleteRequest });
    if (invalidDelete.statusCode !== 400 || !/transfer context/i.test(invalidDelete.payload?.message || "")) fail("transfer delete accepted invalid, multiple, or empty identity/context");
  }
} finally {
  globalThis.fetch = originalFetch;
}

console.log("Transfer Tool create/update/delete API invariant verification passed.");
