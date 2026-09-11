import { readFileSync } from "node:fs";
import { join } from "node:path";
import CATALOG from "../src/data/transferToolCatalog.json" with { type: "json" };
import { normalizeTransferTitle, refreshCopiedItems, transferRecordId, transferTotal, validateTransfer } from "../src/features/transfer-tool/transferModel.js";

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");
const fail = (message) => { console.error(`Transfer Tool verification failed: ${message}`); process.exit(1); };

if (CATALOG.menus.length !== 53 || CATALOG.items.length < 1483) fail("catalog does not cover the current menu/item source");
if (!CATALOG.items.every((item) => item.menu && item.item && Object.hasOwn(item, "itemWasteCost") && !Object.hasOwn(item, "glGroups"))) fail("catalog contains malformed or legacy G/L rows");
if (transferRecordId(" My  Transfer ") !== "transfer|my%20transfer") fail("title identity is not deterministic");
if (normalizeTransferTitle(" MY   TRANSFER ") !== "my transfer") fail("title normalization is not case/space insensitive");
if (transferTotal([{ quantity: 2, itemWasteCost: 1.234 }]) !== 2.468) fail("extended transfer value is incorrect");
const refreshed = refreshCopiedItems([{ catalogId: CATALOG.items[0].id, itemWasteCost: 999 }], CATALOG.items);
if (refreshed[0].itemWasteCost === 999) fail("copied transfers do not refresh current cost");
const duplicateErrors = validateTransfer({ title: " Existing ", departingUnit: "Dawson", receivingUnit: "Nessie", transferDate: "2026-09-10", items: [{ catalogId: "x", quantity: 1 }] }, [{ title: "existing" }]);
if (!duplicateErrors.title) fail("duplicate global title validation is missing");

const api = read("api/storage/records.js");
const storage = read("src/features/transfer-tool/transferStorage.js");
const component = read("src/features/transfer-tool/TransferTool.jsx");
for (const marker of ["createTransfer", "Titles must be globally unique", "like.transfer|*"]) if (!api.includes(marker)) fail(`API is missing ${marker}`);
for (const marker of ["createTransfer", "tool: \"transfers\"", "/api/recipe-library?scope=all", "row.trueCost"]) if (!storage.includes(marker)) fail(`storage client is missing ${marker}`);
for (const marker of ["Item + Waste Cost", "Copy Transfer", "Export Excel", "DRAFT"]) if (!component.includes(marker)) fail(`UI is missing ${marker}`);
for (const removedMarker of ["G/L Breakdown", "GlBreakdown", "reviewed mapping"]) if (component.includes(removedMarker)) fail(`UI still contains ${removedMarker}`);

console.log(`Transfer Tool verification passed: ${CATALOG.menus.length} menus, ${CATALOG.items.length} menu-scoped cost records.`);

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
  items: [{ catalogId: "menu|item|mrn|portion", menu: "Menu", item: "Item", quantity: 2, itemWasteCost: 1.25 }],
  totalValue: 2.5,
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
} finally {
  globalThis.fetch = originalFetch;
}

console.log("Transfer Tool create/update API invariant verification passed.");
