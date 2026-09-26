import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import JSZip from "jszip";
import CATALOG from "../src/data/transferToolCatalog.json" with { type: "json" };
import INGREDIENT_COSTING_LOOKUP from "../api/data/ingredientCosting91926.json" with { type: "json" };
import { buildS4Rows, buildS4Workbook, S4_TEMPLATE_SHA256 } from "../src/features/transfer-tool/transferExport.js";
import { cafeProfitCenter } from "../src/features/transfer-tool/cafeProfitCenters.js";
import { applyPreparedFoodsFallback, balanceIngredientAllocations, defaultTransferDescription, normalizeTransferItemAllocations, normalizeTransferTitle, PREPARED_FOODS_GL_CODE, refreshCopiedItems, S4_EXPORT_VERSION, transferRecordId, transferTotal, validateS4Transfer, validateTransfer } from "../src/features/transfer-tool/transferModel.js";
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
const buffalo = INGREDIENT_COSTING_LOOKUP.recipes["9282.10"];
const buffaloBlueCheese = buffalo?.components?.find((component) => component.ingredientMrn === "1614");
const buffaloFranks = buffalo?.components?.find((component) => component.ingredientMrn === "7179");
const buffaloCelery = buffalo?.unpricedComponents?.find((component) => component.ingredientMrn === "1378");
const brisketSandwich = INGREDIENT_COSTING_LOOKUP.recipes["10379.3"];
const brisketProtein = brisketSandwich?.unpricedComponents?.find((component) => component.ingredientMrn === "36857");
const brisketPepperoncini = brisketSandwich?.components?.find((component) => component.ingredientMrn === "7400");
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
if (buffaloBlueCheese?.priceSourceMrn !== "1639" || !/approved dairy substitute/i.test(buffaloBlueCheese.priceSourceNote || "") || buffaloFranks?.priceSourceMrn !== "7179" || buffaloFranks?.priceSourceUnit !== "floz" || buffaloFranks?.allocationPerPortion !== 0.18 || !/1 fluid ounce = 1 ounce/i.test(buffaloFranks.priceSourceNote || "") || !buffaloCelery) {
  fail("approved Blue Cheese substitution, Frank's exact price conversion, and category-safe substitute matching are not enforced");
}
if (!brisketProtein?.residualAttributionEligible || brisketSandwich.components.some((component) => component.priceSourceMrn === "76270") || brisketPepperoncini?.priceSourceMrn !== "7400" || brisketPepperoncini?.allocationPerPortion !== 0.04) {
  fail("brisket must reject beef-pho broth pricing while pepperoncini uses its exact MRN and approved unit conversion");
}
const brisketCatalogItem = CATALOG.items.find((item) => item.mrn === "10379.3");
const brisketBalanced = balanceIngredientAllocations({
  components: brisketSandwich.components,
  unpricedComponents: brisketSandwich.unpricedComponents,
  itemWasteCost: brisketCatalogItem?.itemWasteCost,
});
const attributedBrisket = brisketBalanced.ingredientAllocations.find((component) => component.ingredientMrn === "36857");
if (!brisketBalanced.pricingComplete || brisketBalanced.residualCost !== 0 || brisketBalanced.unpricedComponents.length || brisketBalanced.allocationPerPortion !== brisketCatalogItem.itemWasteCost || !attributedBrisket?.isItemCostResidualAttribution || attributedBrisket.glCode !== "4111003" || attributedBrisket.allocationPerPortion !== 4.041) {
  fail("the sole unresolved brisket component must receive the exact authoritative Item + Waste Cost remainder on its recipe-mapped meat G/L");
}
const lowerCostBrisket = normalizeTransferItemAllocations({
  catalogId: brisketCatalogItem.id,
  itemWasteCost: brisketCatalogItem.itemWasteCost,
  ingredientAllocations: brisketBalanced.ingredientAllocations,
  unpricedComponents: brisketBalanced.unpricedComponents,
}, 1);
if (lowerCostBrisket.pricingComplete || lowerCostBrisket.residualCost !== 0 || !lowerCostBrisket.unpricedComponents.some((component) => component.ingredientMrn === "36857") || lowerCostBrisket.ingredientAllocations.some((component) => component.ingredientMrn === "36857")) {
  fail("a reopened or copied residual-attributed line must block when its lower current cost leaves no positive amount for the unresolved component");
}
const lowerCostBrisketTransfer = {
  title: "Lower Cost Brisket",
  departingUnit: "Dawson",
  receivingUnit: "Nessie",
  receivingProfitCenter: "30159",
  transferDate: "2026-09-22",
  s4ExportVersion: S4_EXPORT_VERSION,
  items: [{ ...lowerCostBrisket, quantity: 1 }],
};
if (!validateTransfer(lowerCostBrisketTransfer).items || !validateS4Transfer(lowerCostBrisketTransfer).s4Lines) {
  fail("client validation must reject a lower-cost copied line with an uncovered recipe component");
}
let catalogAutomaticAttributions = 0;
let catalogChefReviews = 0;
for (const item of CATALOG.items) {
  const recipe = INGREDIENT_COSTING_LOOKUP.recipes[String(item.mrn)];
  if (!recipe) continue;
  const balanced = balanceIngredientAllocations({ components: recipe.components, unpricedComponents: recipe.unpricedComponents, itemWasteCost: item.itemWasteCost });
  if (balanced.itemCostResidualAttribution > 0) catalogAutomaticAttributions += 1;
  if (balanced.residualCost > 0) catalogChefReviews += 1;
}
if (catalogAutomaticAttributions < 250 || catalogChefReviews > 650) {
  fail(`recipe-aware residual attribution coverage regressed (${catalogAutomaticAttributions} automatic; ${catalogChefReviews} chef reviews)`);
}
const balancedAllocation = balanceIngredientAllocations({
  components: [{ ingredientMrn: "known", ingredientName: "Known ingredient", glCode: "4111005", allocationPerPortion: 2.2 }],
  unpricedComponents: [{ ingredientMrn: "missing", ingredientName: "Missing ingredient", glCode: "4111012", allocationPerPortion: null }],
  itemWasteCost: 2.3,
});
if (balancedAllocation.pricingComplete || balancedAllocation.allocationPerPortion !== 2.2 || balancedAllocation.residualCost !== 0.1 || balancedAllocation.ingredientAllocations.some((component) => component.isResidualCostBalance)) {
  fail("a positive unallocated Item + Waste Cost must require a chef G/L selection");
}
const chefReviewedBalance = balanceIngredientAllocations({
  components: [{ ingredientMrn: "known", ingredientName: "Known ingredient", glCode: "4111005", allocationPerPortion: 2.2 }],
  unpricedComponents: [{ ingredientMrn: "missing", ingredientName: "Missing ingredient", glCode: "4111012", allocationPerPortion: null }],
  itemWasteCost: 2.3,
  residualGlCode: "4111012",
});
if (!chefReviewedBalance.pricingComplete || chefReviewedBalance.allocationPerPortion !== 2.3 || chefReviewedBalance.ingredientAllocations.at(-1)?.glCode !== "4111012" || !chefReviewedBalance.ingredientAllocations.at(-1)?.isResidualCostBalance) {
  fail("chef-selected G/L must allocate the positive remaining Item + Waste Cost");
}
const zeroResidualMultipleUnpriced = balanceIngredientAllocations({
  components: [{ ingredientMrn: "known", ingredientName: "Known ingredient", glCode: "4111005", allocationPerPortion: 2.5 }],
  unpricedComponents: [
    { ingredientMrn: "missing-1", ingredientName: "Missing ingredient 1", glCode: "4111012", allocationPerPortion: null },
    { ingredientMrn: "missing-2", ingredientName: "Missing ingredient 2", glCode: "4111003", allocationPerPortion: null },
  ],
  itemWasteCost: 2.45,
});
if (zeroResidualMultipleUnpriced.pricingComplete || zeroResidualMultipleUnpriced.residualCost !== 0 || zeroResidualMultipleUnpriced.unpricedComponents.length !== 2) {
  fail("multiple unresolved components must block even when priced components already consume the Item + Waste Cost ceiling");
}
const preparedFoodsFallback = applyPreparedFoodsFallback(2.45, "Incomplete ingredient pricing");
if (!preparedFoodsFallback?.pricingComplete || preparedFoodsFallback.ingredientAllocations.length !== 1 || preparedFoodsFallback.ingredientAllocations[0].glCode !== PREPARED_FOODS_GL_CODE || preparedFoodsFallback.ingredientAllocations[0].allocationPerPortion !== 2.45 || preparedFoodsFallback.unpricedComponents.length) {
  fail("approved Prepared Foods fallback must assign the full Item + Waste Cost to one 4111011 allocation");
}
if (applyPreparedFoodsFallback(0, "Missing Item + Waste") || applyPreparedFoodsFallback(null, "Missing Item + Waste")) {
  fail("Prepared Foods fallback must never invent a missing or zero Item + Waste Cost");
}
const refreshedFallback = normalizeTransferItemAllocations({
  catalogId: "fallback",
  itemWasteCost: 2.45,
  ...preparedFoodsFallback,
}, 3.1);
if (refreshedFallback.ingredientAllocations.length !== 1 || refreshedFallback.ingredientAllocations[0].glCode !== PREPARED_FOODS_GL_CODE || refreshedFallback.ingredientAllocations[0].allocationPerPortion !== 3.1 || refreshedFallback.allocationPerPortion !== 3.1) {
  fail("copied or reopened Prepared Foods fallbacks must refresh to the current Item + Waste Cost");
}
const cappedAllocation = balanceIngredientAllocations({
  components: [
    { ingredientMrn: "protein", ingredientName: "Protein", glCode: "4111003", allocationPerPortion: 2 },
    { ingredientMrn: "produce", ingredientName: "Produce", glCode: "4111012", allocationPerPortion: 1 },
  ],
  itemWasteCost: 2.45,
});
if (!cappedAllocation.pricingComplete || !cappedAllocation.allocationWasScaled || cappedAllocation.sourceMappedAllocationPerPortion !== 3 || cappedAllocation.allocationPerPortion !== 2.45 || cappedAllocation.ingredientAllocations.some((component) => !(component.allocationPerPortion < component.sourceAllocationPerPortion)) || Math.abs(cappedAllocation.ingredientAllocations[0].allocationScaleFactor - (2.45 / 3)) > 0.000001) {
  fail("ingredient allocations above Item + Waste Cost must be reduced by one even percentage and reconcile exactly to the item cost");
}
const restoredAllocation = normalizeTransferItemAllocations({
  itemWasteCost: 2.45,
  ingredientAllocations: cappedAllocation.ingredientAllocations,
  residualGlCode: "4111012",
}, 3.5);
if (restoredAllocation.allocationWasScaled || restoredAllocation.ingredientAllocations.some((component) => component.isProportionallyAdjusted || component.allocationScaleFactor) || restoredAllocation.mappedAllocationPerPortion !== 3 || restoredAllocation.residualCost !== 0.5) {
  fail("reopened or copied allocations must clear stale cap metadata when the current Item + Waste Cost no longer requires scaling");
}
let scaledCatalogItems = 0;
for (const item of CATALOG.items) {
  const recipe = INGREDIENT_COSTING_LOOKUP.recipes[String(item.mrn)];
  if (!recipe?.components?.length || !(Number(item.itemWasteCost) > 0)) continue;
  const sourceTotal = recipe.components.reduce((sum, component) => sum + Number(component.allocationPerPortion || 0), 0);
  if (!(sourceTotal > Number(item.itemWasteCost))) continue;
  scaledCatalogItems += 1;
  const balanced = balanceIngredientAllocations({ components: recipe.components, itemWasteCost: item.itemWasteCost });
  if (!balanced.pricingComplete || balanced.ingredientAllocations.some((component) => !(Number(component.allocationPerPortion) > 0))) {
    fail(`catalog scaling made ${item.menu} / ${item.item} unsaveable or reduced a positive mapped ingredient to zero`);
  }
}
if (!scaledCatalogItems) fail("catalog scaling regression did not exercise any real over-mapped menu items");
if (transferRecordId(" My  Transfer ") !== "transfer|my%20transfer") fail("title identity is not deterministic");
if (normalizeTransferTitle(" MY   TRANSFER ") !== "my transfer") fail("title normalization is not case/space insensitive");
if (transferTotal([{ quantity: 2, itemWasteCost: 1.234, allocationPerPortion: 8 }]) !== 2.468) fail("transfer total must use the menu card Item + Waste Cost");
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
for (const marker of ["createTransfer", "deleteTransfer", "tool: \"transfers\"", "/api/recipe-library?scope=all", "row.trueCost", "TRANSFER_MAPPING_NOT_FOUND", "TRANSFER_MAPPING_UNAVAILABLE"]) if (!storage.includes(marker)) fail(`storage client is missing ${marker}`);
for (const marker of ["Ingredient Costing 9.19.26", "Automatic ingredient G/L allocation", "Scaled to Item + Waste Cost", "Item-cost cap applied", "Substitute price used", "Chef-reviewed balance", "Item + Waste / portion", "Chef-reviewed G/L", "Export S4 Excel", "Batch export staging", "Include in batch export", "Delete saved transfer", "DRAFT"]) if (!component.includes(marker)) fail(`UI is missing ${marker}`);
for (const marker of ["Prepared Foods G/L fallback", "Approved Prepared Foods fallback", "4111011 Prepared Foods"]) if (!component.includes(marker)) fail(`UI is missing ${marker}`);
for (const removedMarker of ["G/L Breakdown", "Prepared Foods cost balance"]) if (component.includes(removedMarker)) fail(`UI still contains retired automatic balance UI ${removedMarker}`);

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
const cappedExportRows = buildS4Rows({
  title: "Capped Export",
  receivingProfitCenter: "30159",
  items: [{ catalogId: "capped", item: "Capped sandwich", quantity: 1, itemWasteCost: 2.45, allocationPerPortion: 2.45, ingredientAllocations: cappedAllocation.ingredientAllocations }],
});
if (Number(cappedExportRows.reduce((sum, row) => sum + row.transferAmount, 0).toFixed(2)) !== 2.45) fail("S4 row rounding may not exceed or undershoot Item + Waste Cost");
const brisketExportRows = buildS4Rows({
  title: "Brisket Residual Attribution",
  receivingProfitCenter: "30159",
  items: [{ catalogId: brisketCatalogItem.id, item: brisketCatalogItem.item, quantity: 1, itemWasteCost: brisketCatalogItem.itemWasteCost, ingredientAllocations: brisketBalanced.ingredientAllocations }],
});
if (brisketExportRows.reduce((sum, row) => sum + Math.round(row.transferAmount * 100), 0) !== 511 || !brisketExportRows.some((row) => row.fromGlAccount === "4111003" && row.transferAmount === 4.04)) {
  fail("brisket residual attribution must export on Meat/Poultry and reconcile exactly to $5.11");
}
const correctedExportRows = buildS4Rows({
  title: "Cent Correction",
  receivingProfitCenter: "30159",
  items: [{
    catalogId: "cent-correction",
    item: "Three-way allocation",
    quantity: 1,
    itemWasteCost: 0.9999,
    ingredientAllocations: ["4111001", "4111002", "4111003"].map((glCode, index) => ({ ingredientMrn: String(index + 1), ingredientName: `Ingredient ${index + 1}`, glCode, allocationPerPortion: 0.3333 })),
  }],
});
if (correctedExportRows.reduce((sum, row) => sum + Math.round(row.transferAmount * 100), 0) !== 100 || correctedExportRows.every((row) => row.transferAmount === 0.33)) {
  fail("S4 cent reconciliation did not correct an independently rounded multi-row line to the Item + Waste Cost");
}
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

  const unresolvedS4 = await invoke({ action: "upsertRecords", records: [{
    ...s4Record,
    items: [{ ...s4Record.items[0], unpricedComponents: [{ ingredientMrn: "missing", ingredientName: "Missing ingredient" }] }],
  }], context: { tool: "transfers" } });
  if (unresolvedS4.statusCode !== 400 || !/unresolved recipe component/i.test(unresolvedS4.payload?.message || "")) fail("server accepted an unresolved recipe component without a chef-reviewed G/L allocation");

  const overAllocatedS4 = await invoke({ action: "upsertRecords", records: [{
    ...s4Record,
    items: [{ ...s4Record.items[0], ingredientAllocations: [{ ...s4Record.items[0].ingredientAllocations[0], allocationPerPortion: 1.5 }] }],
    totalValue: 3,
  }], context: { tool: "transfers" } });
  if (overAllocatedS4.statusCode !== 400 || !/may never exceed/i.test(overAllocatedS4.payload?.message || "")) fail("server accepted a mapped G/L total above Item + Waste Cost");

  const underAllocatedS4 = await invoke({ action: "upsertRecords", records: [{
    ...s4Record,
    items: [{ ...s4Record.items[0], ingredientAllocations: [{ ...s4Record.items[0].ingredientAllocations[0], allocationPerPortion: 1 }] }],
    totalValue: 2,
  }], context: { tool: "transfers" } });
  if (underAllocatedS4.statusCode !== 400 || !/must equal/i.test(underAllocatedS4.payload?.message || "")) fail("server accepted a mapped G/L total below Item + Waste Cost");

  const preparedFoodsS4 = await invoke({ action: "upsertRecords", records: [{
    ...s4Record,
    items: [{ ...s4Record.items[0], ingredientAllocations: preparedFoodsFallback.ingredientAllocations, itemWasteCost: 2.45 }],
    totalValue: 4.9,
  }], context: { tool: "transfers" } });
  if (preparedFoodsS4.statusCode !== 200) fail("server rejected the approved 4111011 Prepared Foods fallback");

  const invalidPreparedFoodsS4 = await invoke({ action: "upsertRecords", records: [{
    ...s4Record,
    items: [{ ...s4Record.items[0], ingredientAllocations: [{ ...preparedFoodsFallback.ingredientAllocations[0], glCode: "4111005" }], itemWasteCost: 2.45 }],
    totalValue: 4.9,
  }], context: { tool: "transfers" } });
  if (invalidPreparedFoodsS4.statusCode !== 400 || !/4111011/i.test(invalidPreparedFoodsS4.payload?.message || "")) fail("server accepted a Prepared Foods fallback on the wrong G/L");

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
