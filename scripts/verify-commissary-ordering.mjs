import assert from "node:assert/strict";
import { mock } from "node:test";
import { readFile } from "node:fs/promises";
import JSZip from "jszip";
import * as XLSX from "xlsx";
import BOM_XLSX from "xlsx-js-style";

import { commissaryWriteValidation } from "../api/storage/records.js";
import { buildS4Rows, buildS4Workbook } from "../src/features/transfer-tool/transferExport.js";
import { COMMISSARY_LEGACY_ORDER_ITEMS, COMMISSARY_ORDER_ITEMS, COMMISSARY_PREVIOUS_ORDER_ITEMS, COMMISSARY_RETIRED_ORDER_ITEMS, SALAD_BAR_COST_SOURCE, commissaryItemMapForWeek, commissaryOrderItemsForWeek } from "../src/features/commissary-ordering/commissaryCatalog.js";
import { buildCommissaryBomWorkbook, buildCommissaryTransfer } from "../src/features/commissary-ordering/commissaryExport.js";
import { buildCommissaryMetadataRecord, DEFAULT_COMMISSARY_METADATA, isApprovedCommissaryMetadataRecord, resolveCommissaryMetadata } from "../src/features/commissary-ordering/commissaryMetadata.js";
import { COMMISSARY_BREAKFAST_ORDER_VERSION, COMMISSARY_DELI_ORDER_VERSION, COMMISSARY_GLOBAL_ORDER_VERSION, COMMISSARY_GRILL_ORDER_VERSION, COMMISSARY_ORDER_UNIT_VERSION, DELIVERY_KEYS, GLOBAL_UNIT_PREPARATION_NOTES, addDays, breakfastOrderLinesForCafe, breakfastPrepLinesForCafe, buildOrderRecord, buildPackoutPacketRecord, buildPrepProgressRecord, deliCycleForWeek, deliOrderLinesForCafe, deliPrepLinesForCafe, deliveriesForWeek, emptyBreakfastOrder, emptyDeliOrder, emptyGlobalOrder, emptyGrillOrder, emptyQuantities, firstOpenWeek, globalCycleForWeek, globalOrderLinesForCafe, globalPrepLinesForCafe, globalTransferLinesForCafe, grillCycleForWeek, grillOrderLinesForCafe, grillPrepLinesForCafe, grillTransferLinesForCafe, isGrillCoreAvailable, isWeekLocked, latestPrepWeek, normalizeDeliOrder, normalizePrepCompleted, normalizeQuantities, orderValue, prepDisplayQuantity, rolledUpPrepItems, standingOrderReductions, togglePrepCompleted, transferPeriod } from "../src/features/commissary-ordering/commissaryModel.js";
import { prepareGlobalCommissaryComponents } from "../src/features/commissary-ordering/commissaryPrepPolicy.js";
import { buildPackoutPacket, buildPackoutPdfBytes } from "../src/features/commissary-ordering/commissaryPackout.js";
import { GRILL_LTO_ITEM_MRNS, GRILL_LTO_PREP_ITEM_IDS, GRILL_LTO_PROGRAM } from "../src/features/commissary-ordering/grillLtoCatalog.js";
import { DELI_ORDERING_ITEM_MRNS, DELI_ORDERING_PREP_ITEM_IDS, DELI_ORDERING_PROGRAM } from "../src/features/commissary-ordering/deliCycleCatalog.js";
import { GLOBAL_ORDERING_ITEM_IDS, GLOBAL_ORDERING_PREP_ITEM_IDS, GLOBAL_ORDERING_PROGRAM } from "../src/features/commissary-ordering/globalCycleCatalog.js";
import { BREAKFAST_ORDERING_ITEM_IDS, BREAKFAST_ORDERING_PREP_ITEM_IDS, BREAKFAST_ORDERING_PROGRAM } from "../src/features/commissary-ordering/breakfastCatalog.js";
import { COMMISSARY_SPANISH } from "../src/features/commissary-ordering/commissaryTranslations.js";
import { COMMISSARY_STATIONS, commissaryHubFor, isCafeStationEnabled, isCommissaryHub } from "../src/features/commissary-ordering/commissaryRouting.js";
import { filterCommissaryComponents, isRawAnimalProteinComponent } from "../src/features/commissary-ordering/commissaryPrepPolicy.js";

function validateBeforeCutoff(records, context = { tool: "commissaryOrders" }) {
  mock.timers.enable({ apis: ["Date"], now: new Date("2026-11-10T12:00:00Z") });
  try {
    return commissaryWriteValidation(records, context);
  } finally {
    mock.timers.reset();
  }
}

assert.equal(COMMISSARY_ORDER_ITEMS.length, 41, "The source workbook should produce 41 commissary order items.");
assert.equal(COMMISSARY_LEGACY_ORDER_ITEMS.length, 41, "The pre-effective-date catalog should preserve the original 41-item roster.");
assert.equal(SALAD_BAR_COST_SOURCE.sha256, "42E2DF61F1B97489ED2B9F27B81C86100B7D404E649099840829B23F76BB80F4");
assert.equal(SALAD_BAR_COST_SOURCE.effectiveDate, "2026-11-16");
assert.equal(commissaryOrderItemsForWeek("2026-11-09").find((row) => row.name === "Frozen Peas")?.orderUnitCost, 9.08, "The Nov 9 week must use the original Frozen Peas gallon cost.");
assert.equal(commissaryOrderItemsForWeek("2026-11-09").some((row) => row.name === "Green Peas"), false);
assert.equal(commissaryOrderItemsForWeek("2026-11-16").find((row) => row.name === "Green Peas")?.orderUnitCost, 9.455573, "The workbook refresh must begin on Nov 16.");
assert.equal(COMMISSARY_ORDER_ITEMS.find((row) => row.name === "Spiced Edamame")?.mrn, "176736");
assert.equal(COMMISSARY_ORDER_ITEMS.find((row) => row.name === "Balsamic Vinegar")?.orderUnit, "gallon");
assert.equal(COMMISSARY_ORDER_ITEMS.find((row) => row.name === "Fat Free Italian Dressing")?.orderUnit, "gallon");
assert.equal(COMMISSARY_ORDER_ITEMS.find((row) => row.name === "Ranch Dressing")?.orderUnit, "gallon");
assert.equal(COMMISSARY_ORDER_ITEMS.filter((row) => row.orderUnit === "3-pound container").length, 6);
const greenPeas = COMMISSARY_ORDER_ITEMS.find((row) => row.name === "Green Peas");
assert.ok(greenPeas, "Green Peas should be available from the authoritative gallon-costing workbook.");
assert.equal(greenPeas.mrn, "62341");
assert.equal(greenPeas.orderUnitCost, 9.455573);
assert.equal(greenPeas.transferGlCode, "4111009");
assert.equal(COMMISSARY_RETIRED_ORDER_ITEMS.find((row) => row.name === "Frozen Peas")?.mrn, "4877");
const priorSpringMix = COMMISSARY_PREVIOUS_ORDER_ITEMS.find((row) => row.name === "Spring Mix");
const currentSpringMix = COMMISSARY_ORDER_ITEMS.find((row) => row.name === "Spring Mix");
assert.notEqual(priorSpringMix.id, currentSpringMix.id, "A package-unit change must not reinterpret a saved gallon quantity.");
assert.equal(commissaryItemMapForWeek("2026-12-28", { [priorSpringMix.id]: { friday: 1, monday: 0, wednesday: 0 } }).get(priorSpringMix.id)?.orderUnit, "gallon");
assert.equal(commissaryItemMapForWeek("2026-12-28", {}).get(currentSpringMix.id)?.orderUnit, "3-pound bag");
assert.deepEqual(DELIVERY_KEYS, ["friday", "monday", "wednesday"]);
assert.equal(isRawAnimalProteinComponent("Chicken, Breast, Fillet, Breaded, Frozen"), true);
assert.equal(isRawAnimalProteinComponent("Tuna, Canned, Precooked"), false);
assert.equal(isRawAnimalProteinComponent("Santa Fe Black Bean Burger Patty"), false);
assert.equal(isRawAnimalProteinComponent("Fish Sauce"), false);
assert.equal(isRawAnimalProteinComponent("Chicken Breast Fillet with Sauce"), true);
assert.equal(filterCommissaryComponents([{ name: "Raw Chicken" }, { name: "Tuna, Canned" }], "2026-11-09").length, 2);
assert.deepEqual(filterCommissaryComponents([{ name: "Raw Chicken" }, { name: "Tuna, Canned" }], "2026-11-16").map(({ name }) => name), ["Tuna, Canned"]);
assert.equal(GRILL_LTO_PROGRAM.anchorWeekStart, "2026-11-16");
assert.equal(GRILL_LTO_ITEM_MRNS.length, 19);
assert.equal(GRILL_LTO_PROGRAM.coreItems.length, 7);
assert.ok(GRILL_LTO_PREP_ITEM_IDS.length > 20);
assert.deepEqual(grillCycleForWeek("2026-11-16"), GRILL_LTO_PROGRAM.cycleWeeks[0], "Monday 11/16/2026 must be Grill Cycle Week 1.");
assert.deepEqual(grillCycleForWeek("2026-12-21"), GRILL_LTO_PROGRAM.cycleWeeks[5]);
assert.deepEqual(grillCycleForWeek("2026-12-28"), GRILL_LTO_PROGRAM.cycleWeeks[0], "The six-week Grill cycle must repeat.");
assert.equal(grillCycleForWeek("2026-11-09"), null, "The Grill cycle must not appear before its 11/16/2026 anchor.");
assert.equal(isGrillCoreAvailable("Atlas", "2026-11-09"), true, "Atlas Grill Core must begin one week before the general Grill program.");
assert.equal(isGrillCoreAvailable("Nessie", "2026-11-09"), false);
assert.equal(DELI_ORDERING_PROGRAM.cycleLengthWeeks, 4);
assert.deepEqual(DELI_ORDERING_PROGRAM.cycleWeeks.map(({ items }) => items.length), [5, 5, 5, 6]);
assert.equal(DELI_ORDERING_ITEM_MRNS.length, 19);
assert.deepEqual(DELI_ORDERING_PROGRAM.standingOrderItemMrns, ["37394.7"]);
assert.ok(DELI_ORDERING_PREP_ITEM_IDS.length > 100);
assert.equal(deliCycleForWeek("2026-11-16").week, 1);
assert.equal(deliCycleForWeek("2026-12-07").week, 4);
assert.equal(deliCycleForWeek("2026-12-14").week, 1, "The four-week Deli cycle must repeat.");
assert.equal(GLOBAL_ORDERING_PROGRAM.anchorWeekStart, "2026-11-16");
assert.equal(GLOBAL_ORDERING_ITEM_IDS.length, 258);
assert.ok(GLOBAL_ORDERING_PREP_ITEM_IDS.length > 700);
assert.deepEqual(globalCycleForWeek("2026-11-16").menus.map(({ label }) => label), ["Porto", "Taco Total"]);
assert.deepEqual(globalCycleForWeek("2026-12-21").menus.map(({ label }) => label), ["Smokehouse BBQ", "Roam BBQ"]);
assert.equal(globalCycleForWeek("2026-12-28").week, 1, "The six-week Global cycle must repeat.");
assert.deepEqual(deliveriesForWeek(DEFAULT_COMMISSARY_METADATA.deliveries, "2026-11-16").map(({ title }) => title), ["Friday 11/13", "Monday 11/16", "Wednesday 11/18"]);
assert.equal(isCafeStationEnabled("Grace", COMMISSARY_STATIONS.SALAD_BAR), false);
assert.equal(isCafeStationEnabled("Grace", COMMISSARY_STATIONS.GRILL), true);
assert.equal(isCafeStationEnabled("Dynamo", COMMISSARY_STATIONS.DELI), true);
assert.equal(commissaryHubFor("Nessie", COMMISSARY_STATIONS.DELI), "Cricket");
assert.equal(commissaryHubFor("Dynamo", COMMISSARY_STATIONS.DELI), "Sonic");
assert.equal(commissaryHubFor("Nessie", COMMISSARY_STATIONS.GLOBAL), "Cricket");
assert.equal(commissaryHubFor("Astra", COMMISSARY_STATIONS.GLOBAL), "Blueshift");
assert.equal(commissaryHubFor("Roxanne Coffee", COMMISSARY_STATIONS.BREAKFAST), "Blueshift");
assert.equal(commissaryHubFor("Atlas", COMMISSARY_STATIONS.GRILL), "Cricket");
assert.equal(commissaryHubFor("Frontier", COMMISSARY_STATIONS.GLOBAL), "Cricket");
assert.equal(commissaryHubFor("Frontier", COMMISSARY_STATIONS.SALAD_BAR), "Cricket");
assert.deepEqual([COMMISSARY_STATIONS.GLOBAL, COMMISSARY_STATIONS.SALAD_BAR].map((station) => isCafeStationEnabled("Frontier", station)), [true, true]);
assert.equal(isCafeStationEnabled("Atlas", COMMISSARY_STATIONS.SALAD_BAR), false);
assert.deepEqual(["Brazil Coffee", "Roxanne Coffee", "Arizona Coffee", "Zoka Coffee"].map((cafe) => isCafeStationEnabled(cafe, COMMISSARY_STATIONS.BREAKFAST)), [true, true, true, true]);
assert.equal(commissaryHubFor("Zoka Coffee", COMMISSARY_STATIONS.BREAKFAST), "Cricket");
assert.equal(commissaryHubFor("Zoka Coffee", COMMISSARY_STATIONS.DELI), "Cricket");
assert.deepEqual(["Cricket", "Sonic", "Blueshift", "Nessie"].map(isCommissaryHub), [true, true, true, false]);
assert.equal(isCafeStationEnabled("Doppler", COMMISSARY_STATIONS.GRILL), false);
assert.equal(isCafeStationEnabled("Day 1", COMMISSARY_STATIONS.GRILL), true);
assert.equal(isCafeStationEnabled("Nitro", COMMISSARY_STATIONS.DELI), false);
assert.equal(BREAKFAST_ORDERING_ITEM_IDS.length, 28);
assert.ok(BREAKFAST_ORDERING_PREP_ITEM_IDS.length > 40);
assert.ok(BREAKFAST_ORDERING_PROGRAM.items.some(({ mrn, name }) => mrn === "17350.24" && name === "Bacon Egg Cheddar Croissant"));
const retiredFrozenPeas = COMMISSARY_RETIRED_ORDER_ITEMS.find((row) => row.name === "Frozen Peas");
assert.deepEqual(normalizeQuantities({ "commissary-9002-2": { monday: 1.5, wednesday: 0.5 } }, { orderUnitVersion: COMMISSARY_ORDER_UNIT_VERSION })[retiredFrozenPeas.id], { friday: 0, monday: 1.5, wednesday: 0.5 }, "Historical Frozen Peas quantities must remain readable without making the retired item selectable.");
const legacyFrozenPeas = COMMISSARY_LEGACY_ORDER_ITEMS.find((row) => row.name === "Frozen Peas");
assert.deepEqual(normalizeQuantities({ [legacyFrozenPeas.id]: { friday: 0, monday: 0, wednesday: 4 } }, { orderUnitVersion: 1, weekStart: "2026-11-02" })[legacyFrozenPeas.id], { friday: 0, monday: 0, wednesday: 1 }, "A pre-conversion saved order must restore its original quart quantity as gallons exactly once.");
assert.deepEqual(normalizeQuantities({ [legacyFrozenPeas.id]: { friday: 0.25, monday: 0, wednesday: 0.25 } }, { orderUnitVersion: 2, weekStart: "2026-11-02" })[legacyFrozenPeas.id], { friday: 0.25, monday: 0, wednesday: 0.25 }, "A version-2 saved order must preserve its original gallon quantities.");
assert.equal(COMMISSARY_ORDER_ITEMS.find((row) => row.name === "Ranch Dressing")?.quantityIncrement, 1);
assert.equal(COMMISSARY_ORDER_ITEMS.find((row) => row.name === "Spring Mix")?.quantityIncrement, 1);
assert.equal(COMMISSARY_ORDER_ITEMS.find((row) => row.name === "Baby Arugula")?.quantityIncrement, 1);
assert.equal(COMMISSARY_ORDER_ITEMS.find((row) => row.name === "Green Peas")?.quantityIncrement, 0.25);
assert.deepEqual(
  [
    ["Spring Mix", "3-pound bag", 7.75],
    ["Baby Arugula", "4-pound bag", 17.8],
    ["Chopped Kale", "2.5-pound bag", 8.81],
    ["4% Full Fat Cottage Cheese", "5-pound container", 14.15],
    ["Blue Cheese Crumbles", "5-pound bag", 16.79],
    ["Crumbled Feta Cheese", "5-pound bag", 15.89],
    ["Shredded Cheddar Cheese", "5-pound bag", 13.6],
  ].map(([name, orderUnit, orderUnitCost]) => {
    const item = COMMISSARY_ORDER_ITEMS.find((row) => row.name === name);
    return [item?.name, item?.orderUnit, item?.orderUnitCost, item?.quantityIncrement];
  }),
  [
    ["Spring Mix", "3-pound bag", 7.75, 1],
    ["Baby Arugula", "4-pound bag", 17.8, 1],
    ["Chopped Kale", "2.5-pound bag", 8.81, 1],
    ["4% Full Fat Cottage Cheese", "5-pound container", 14.15, 1],
    ["Blue Cheese Crumbles", "5-pound bag", 16.79, 1],
    ["Crumbled Feta Cheese", "5-pound bag", 15.89, 1],
    ["Shredded Cheddar Cheese", "5-pound bag", 13.6, 1],
  ],
);

const metadataRecord = buildCommissaryMetadataRecord(new Date("2026-10-27T12:00:00Z"));
assert.equal(isApprovedCommissaryMetadataRecord(metadataRecord), true);
assert.equal(isApprovedCommissaryMetadataRecord({
  ...metadataRecord,
  deliveries: metadataRecord.deliveries.map(({ day, key, title, detail, titleEs, detailEs }) => ({ detailEs, titleEs, detail, title, key, day })),
  receivingCafes: metadataRecord.receivingCafes.map(({ name, displayName, profitCenter }) => ({ profitCenter, displayName, name })),
}), true, "Supabase JSONB key reordering must not invalidate approved metadata.");
assert.equal(resolveCommissaryMetadata([metadataRecord]).source, "supabase");
assert.equal(resolveCommissaryMetadata([]).source, "fallback");
assert.deepEqual(DEFAULT_COMMISSARY_METADATA.deliveries.map(({ key, detail }) => [key, detail]), [["friday", "Monday service"], ["monday", "Tuesday–Wednesday service"], ["wednesday", "Thursday–Friday service"]]);
assert.deepEqual(DEFAULT_COMMISSARY_METADATA.receivingCafes.find(({ name }) => name === "Dawson"), { name: "Dawson", displayName: "Dawson", profitCenter: "28675" });
assert.equal(DEFAULT_COMMISSARY_METADATA.receivingCafes.length, 23);
assert.deepEqual(DEFAULT_COMMISSARY_METADATA.receivingCafes.find(({ name }) => name === "Zoka Coffee"), { name: "Zoka Coffee", displayName: "Zoka Coffee", profitCenter: "28676" });
assert.equal(DEFAULT_COMMISSARY_METADATA.receivingCafes.find(({ name }) => name === "Atlas")?.profitCenter, "35983");
assert.equal(DEFAULT_COMMISSARY_METADATA.receivingCafes.find(({ name }) => name === "Frontier")?.profitCenter, "53166");
assert.deepEqual(DEFAULT_COMMISSARY_METADATA.receivingCafes.find(({ name }) => name === "Everest"), { name: "Everest", displayName: "Everest", profitCenter: "30911" });
assert.deepEqual(DEFAULT_COMMISSARY_METADATA.receivingCafes.find(({ name }) => name === "Odyssey"), { name: "Odyssey", displayName: "Odyssey", profitCenter: "54245" });
assert.equal(commissaryWriteValidation([metadataRecord], { tool: "commissaryOrders" }), "");
assert.match(commissaryWriteValidation([{ ...metadataRecord, receivingCafes: metadataRecord.receivingCafes.map((row) => row.name === "Dawson" ? { ...row, profitCenter: "incorrect" } : row) }], { tool: "commissaryOrders" }), /approved release configuration/i);

assert.equal(isWeekLocked("2026-10-12", new Date("2026-10-07T23:59:00Z")), false, "4:59 PM Pacific Wednesday should remain open.");
assert.equal(isWeekLocked("2026-10-12", new Date("2026-10-08T00:00:00Z")), true, "5:00 PM Pacific Wednesday should be locked.");
assert.equal(isWeekLocked("2026-10-12", new Date("2026-10-07T12:00:00Z")), false);
assert.deepEqual(transferPeriod("2026-10-12"), { start: "2026-10-09", end: "2026-10-15" });
assert.equal(firstOpenWeek(new Date("2026-10-03T15:00:00Z")), "2026-10-12");
assert.equal(latestPrepWeek(new Date("2026-10-08T12:00:00Z")), "2026-10-12", "Prep View should default to the most recently locked service week.");
assert.ok([...COMMISSARY_LEGACY_ORDER_ITEMS, ...COMMISSARY_ORDER_ITEMS].every((row) => COMMISSARY_SPANISH.items[row.name]), "Spanish translation coverage must follow both service-week catalogs.");
const firstPrepItem = COMMISSARY_ORDER_ITEMS[0].id;
const completed = togglePrepCompleted({}, "monday", firstPrepItem);
assert.deepEqual(completed, { friday: [], monday: [firstPrepItem], wednesday: [] });
assert.deepEqual(togglePrepCompleted(completed, "monday", firstPrepItem), { friday: [], monday: [], wednesday: [] });
assert.deepEqual(normalizePrepCompleted({ monday: [firstPrepItem, firstPrepItem, "not-an-item"] }), { friday: [], monday: [firstPrepItem], wednesday: [] });
const progressRecord = buildPrepProgressRecord({ weekStart: "2026-10-12", completed });
assert.equal(progressRecord["Record ID"], "commissaryOrder|prepProgress|cricket|2026-10-12");
assert.equal(progressRecord.hub, "Cricket");
assert.equal(progressRecord["Record Type"], "Commissary Prep Progress");
const currentLockedProgress = buildPrepProgressRecord({ weekStart: latestPrepWeek(), completed });
assert.equal(commissaryWriteValidation([currentLockedProgress], { tool: "commissaryOrders" }), "");
assert.match(commissaryWriteValidation([{ ...currentLockedProgress, completed: { friday: [], monday: [firstPrepItem, firstPrepItem], wednesday: [] } }], { tool: "commissaryOrders" }), /invalid or duplicate item/i);
assert.match(commissaryWriteValidation([buildPrepProgressRecord({ weekStart: firstOpenWeek(), completed })], { tool: "commissaryOrders" }), /available after.*cutoff/i);

const quantities = emptyQuantities("2026-11-16");
const slicedCucumber = COMMISSARY_ORDER_ITEMS.find((row) => row.name === "Sliced Cucumber");
quantities[slicedCucumber.id] = { friday: 1, monday: 2, wednesday: 1 };
quantities[COMMISSARY_ORDER_ITEMS.find((row) => row.name === "Balsamic Vinegar").id] = { friday: 0, monday: 1, wednesday: 0 };
quantities[greenPeas.id] = { friday: 0.25, monday: 1.25, wednesday: 0.75 };
const record = buildOrderRecord({ cafe: "Nessie", weekStart: "2026-11-16", quantities, now: new Date("2026-11-10T12:00:00Z") });
assert.equal(record.orderUnitVersion, COMMISSARY_ORDER_UNIT_VERSION);
const transfer = buildCommissaryTransfer(record);
const s4Rows = buildS4Rows(transfer);
assert.equal(s4Rows.length, 3, "All three deliveries must consolidate to one S4 row per ordered item.");
const greenPeasTransferRow = s4Rows.find((row) => row.description.includes("Green Peas"));
assert.equal(greenPeasTransferRow.fromGlAccount, "4111009");
assert.equal(greenPeasTransferRow.toGlAccount, "4111009");
assert.equal(greenPeasTransferRow.transferAmount, 21.28);
assert.ok(s4Rows.filter((row) => !row.description.includes("Green Peas")).every((row) => row.fromGlAccount === "4111011" && row.toGlAccount === "4111011"));
assert.ok(s4Rows.every((row) => row.receivingProfitCenter === "30159"));
assert.ok(s4Rows.some((row) => row.transferAmount === Math.round(4 * slicedCucumber.orderUnitCost * 100) / 100));
assert.equal(transfer.departingProfitCenter, "22472");
assert.equal(transfer.transferDate, "2026-11-19");

const geminiRecord = buildOrderRecord({ cafe: "Gemini", weekStart: "2026-11-16", quantities, now: new Date("2026-11-10T12:00:00Z") });
const geminiTransfer = buildCommissaryTransfer(geminiRecord);
assert.equal(geminiTransfer.receivingProfitCenter, "53169", "New Commissary recipients must resolve their S4 destination from shared metadata.");

const bomWorkbook = buildCommissaryBomWorkbook([record], "2026-11-16");
assert.deepEqual(bomWorkbook.SheetNames, ["Friday Prep List", "Monday Prep List", "Wednesday Prep List", "Friday Delivery Map", "Monday Delivery Map", "Wednesday Delivery Map", "Power Automate"]);
const bomSheet = bomWorkbook.Sheets["Monday Prep List"];
const bomRows = XLSX.utils.sheet_to_json(bomSheet, { header: 1, defval: "" });
assert.equal(bomRows[0][0], "Monday Prep List");
assert.deepEqual(bomRows[2].slice(0, 3), ["Ingredient / item", "Total quantity", "Order unit"]);
assert.ok(bomRows.some((row) => row[0] === "Green Peas" && row[1] === 1.25 && row[2] === "gallon"));
assert.equal(bomSheet.A1.s.fill.fgColor.rgb, "17365D", "Prep List title should use the approved navy template band.");
assert.equal(bomSheet.A3.s.font.color.rgb, "FFFFFF", "Prep List column headers should use white text.");
assert.equal(bomSheet.A4.s.fill.fgColor.rgb, "D9EAF7", "The first item in a category should use the blue section-row treatment.");
assert.equal(bomSheet.A4.s.border.top.style, "medium", "Category starts should have a stronger top border.");
assert.equal(bomSheet.F4.s.border.bottom.style, "thin", "Every generated Prep List cell should retain formatted borders.");
assert.equal(bomSheet["!autofilter"].ref, `A3:F${bomRows.length}`);
const automationSheet = bomWorkbook.Sheets["Power Automate"];
const automationRows = XLSX.utils.sheet_to_json(automationSheet, { header: 1, defval: "" });
assert.deepEqual(automationRows[2], ["Finished dish", "Planned portions", "Current status", "Technique key", "Finished dish", "Normalized unit", "Required qty", "Planning quantity"]);
assert.ok(automationRows.some((row) => row[0] === "Green Peas" && row[1] === 2.25 && row[5] === "gallon" && row[6] === 2.25 && row[7] === 2.25));
assert.equal(bomWorkbook.Workbook.Sheets.find((sheet) => sheet.name === "Power Automate")?.Hidden, 1, "The Power Automate tab must open hidden.");
const fridayRows = XLSX.utils.sheet_to_json(bomWorkbook.Sheets["Friday Delivery Map"], { header: 1, defval: "" });
const mondayRows = XLSX.utils.sheet_to_json(bomWorkbook.Sheets["Monday Delivery Map"], { header: 1, defval: "" });
const wednesdayRows = XLSX.utils.sheet_to_json(bomWorkbook.Sheets["Wednesday Delivery Map"], { header: 1, defval: "" });
assert.equal(fridayRows[0][0], "Friday 11/13 Cafe Delivery Map");
assert.equal(mondayRows[0][0], "Monday 11/16 Cafe Delivery Map");
assert.equal(wednesdayRows[0][0], "Wednesday 11/18 Cafe Delivery Map");
assert.ok(fridayRows.some((row) => row[0] === "Nessie" && row[1] === "Salad Bar" && row[2] === "Sliced Cucumber" && row[4] === 1));
assert.ok(mondayRows.some((row) => row[0] === "Nessie" && row[1] === "Salad Bar" && row[2] === "Sliced Cucumber" && row[4] === 2));
assert.ok(wednesdayRows.some((row) => row[0] === "Nessie" && row[1] === "Salad Bar" && row[2] === "Sliced Cucumber" && row[4] === 1));
const mondaySheet = bomWorkbook.Sheets["Monday Delivery Map"];
assert.equal(mondaySheet.A1.s.fill.fgColor.rgb, "17365D");
assert.equal(mondaySheet.A3.s.border.right.color.rgb, "FFFFFF", "Delivery headers should use the template's white border grid.");
assert.equal(mondaySheet.A4.s.fill.fgColor.rgb, "D9EAF7", "The first cafe row should be visually grouped.");
assert.deepEqual(mondayRows[2], ["Cafe", "Station", "Ingredient / item", "MRN", "Quantity", "Order unit", "Finished dish"]);
assert.equal(mondayRows[2].some((value) => /cost/i.test(value)), false, "Prep output must not expose costs.");
const styledBomBytes = BOM_XLSX.write(bomWorkbook, { type: "array", bookType: "xlsx", cellStyles: true });
const roundTripBom = BOM_XLSX.read(styledBomBytes, { type: "array", cellStyles: true });
assert.equal(roundTripBom.Sheets["Monday Prep List"].A1.s.fgColor.rgb, "17365D", "The downloadable workbook must retain the title fill after serialization.");
assert.equal(roundTripBom.Workbook.Sheets.find((sheet) => sheet.name === "Power Automate")?.Hidden, 1, "The downloaded workbook must retain the hidden Power Automate tab.");
const bomArchive = await JSZip.loadAsync(styledBomBytes);
const bomStyles = await bomArchive.file("xl/styles.xml").async("string");
assert.match(bomStyles, /fgColor rgb="FF17365D"/, "The serialized workbook should contain the approved navy fill.");
assert.match(bomStyles, /top style="medium"><color rgb="5B9BD5"/, "Cafe and category grouping borders must survive the download path.");

const templateBytes = await readFile(new URL("../public/templates/ExpenseTransfer_Between_PC_Template.xlsx", import.meta.url));
const exportedBytes = await buildS4Workbook(templateBytes, transfer);
const exportedWorkbook = XLSX.read(exportedBytes, { type: "array" });
const exportedRows = XLSX.utils.sheet_to_json(exportedWorkbook.Sheets[exportedWorkbook.SheetNames[0]], { header: 1, defval: "" });
assert.deepEqual(exportedRows[0].slice(0, 6), ["From GL Account", "To Profit Center", "To GL Account", "Description", "Transfer Amount", "Event ID"]);
assert.equal(exportedRows.length, 4, "The exact S4 template should contain a header plus three consolidated item rows.");
assert.ok(exportedRows.slice(1).every((row) => row[1] === "30159"));
assert.ok(exportedRows.slice(1).some((row) => row[0] === "4111009" && row[2] === "4111009" && String(row[3]).includes("Green Peas") && row[4] === 21.28));
assert.ok(exportedRows.slice(1).filter((row) => !String(row[3]).includes("Green Peas")).every((row) => row[0] === "4111011" && row[2] === "4111011"));

const future = addDays("2026-10-12", 7);
assert.equal(isWeekLocked(future, new Date("2026-10-08T00:01:00Z")), false);

const grill = emptyGrillOrder("2026-11-16");
grill.selections = { A: "77139.72", B: "77139.68" };
grill.items = {
  A: { mrn: "77139.72", item: "ATX Burger", portion: "1 each", itemWasteCost: 3.3634 },
  B: { mrn: "77139.68", item: "Diablo Burger", portion: "1 sandwich", itemWasteCost: 3.1803 },
};
grill.quantities = { A: { friday: 10, monday: 20, wednesday: 30 }, B: { friday: 5, monday: 10, wednesday: 15 } };
grill.core.items["147955.17"] = { mrn: "147955.17", item: "Smashburger", portion: "1 sandwich", itemWasteCost: 2.9983 };
grill.core.quantities["147955.17"] = { friday: 2, monday: 4, wednesday: 6 };
const grillRecord = buildOrderRecord({ cafe: "Nessie", weekStart: "2026-11-16", quantities: emptyQuantities(), grill, now: new Date("2026-11-10T12:00:00Z") });
assert.equal(grillRecord.grill.version, COMMISSARY_GRILL_ORDER_VERSION);
assert.equal(grillRecord.grill.cycleWeek, 1);
assert.equal(validateBeforeCutoff([grillRecord]), "");
assert.equal(grillOrderLinesForCafe(grillRecord).length, 3);
assert.equal(grillPrepLinesForCafe(grillRecord).some((line) => line.name === "AMZ: Smashburger Patty"), false, "Raw Grill proteins must be excluded beginning 11/16.");
assert.equal(rolledUpPrepItems([grillRecord]).some((line) => line.name === "AMZ: Smashburger Patty"), false);
assert.ok(orderValue(grillRecord.quantities, grillRecord.grill, {}, {}, "Nessie", {}, "2026-11-16") > 0);
assert.match(validateBeforeCutoff([{ ...grillRecord, grill: { ...grillRecord.grill, selections: { A: "64908.6", B: "77139.68" } } }]), /Set A/i);
assert.match(validateBeforeCutoff([{ ...grillRecord, grill: { ...grillRecord.grill, quantities: { ...grillRecord.grill.quantities, A: { ...grillRecord.grill.quantities.A, friday: 1.5 } } } }]), /whole sandwiches/i);
const grillTransfer = buildCommissaryTransfer(grillRecord);
assert.ok(grillTransfer.items.length > 2);
assert.equal(grillTransfer.items.some((item) => /patty/i.test(item.item)), false);
assert.equal(grillTransfer.items.some((item) => /\bbun\b/i.test(item.item)), false, "Unit-purchased Grill buns must not enter transfers.");
assert.ok(grillTransfer.items.every((item) => item.ingredientAllocations[0].allocationPerPortion === item.itemWasteCost));
const grillBom = buildCommissaryBomWorkbook([grillRecord], "2026-11-16");
const grillBomRows = XLSX.utils.sheet_to_json(grillBom.Sheets["Monday Prep List"], { header: 1, defval: "" });
assert.equal(grillBomRows.some((row) => row[0] === "AMZ: Smashburger Patty"), false);
assert.equal(grillBomRows.some((row) => /\bbun\b/i.test(String(row[0]))), false, "Unit-purchased Grill buns must not enter prep lists.");
const consolidatedRedOnion = rolledUpPrepItems([grillRecord], { consolidateAcrossStations: true }).filter((row) => String(row.mrn) === "166043");
assert.equal(consolidatedRedOnion.length, 1, "Exact MRN matches must consolidate to one prep row.");
const atlasEarlyGrill = emptyGrillOrder("2026-11-09");
atlasEarlyGrill.core.items["147955.17"] = { mrn: "147955.17", item: "Smashburger", portion: "1 sandwich", itemWasteCost: 2.9983 };
atlasEarlyGrill.core.quantities["147955.17"] = { friday: 2, monday: 4, wednesday: 6 };
const atlasEarlyRecord = buildOrderRecord({ cafe: "Atlas", weekStart: "2026-11-09", grill: atlasEarlyGrill, now: new Date("2026-11-03T12:00:00Z") });
assert.equal(atlasEarlyRecord.grill.cycleWeek, null);
// This historical availability fixture must validate before its order cutoff.
mock.timers.enable({ apis: ["Date"], now: new Date("2026-11-03T12:00:00Z") });
try {
  assert.equal(commissaryWriteValidation([atlasEarlyRecord], { tool: "commissaryOrders" }), "");
} finally {
  mock.timers.reset();
}
assert.equal(grillOrderLinesForCafe(atlasEarlyRecord).length, 1);
const grillMondayRows = XLSX.utils.sheet_to_json(grillBom.Sheets["Monday Delivery Map"], { header: 1, defval: "" });
assert.ok(grillMondayRows.some((row) => row[0] === "Nessie" && row[1] === "Grill" && row[6].includes("ATX Burger")));
assert.equal(grillMondayRows.some((row) => /\bbun\b/i.test(String(row[2]))), false, "Grill buns must stay off cafe delivery maps.");

const deli = emptyDeliOrder("2026-11-16");
deli.items["190990"] = { mrn: "190990", item: "Mediterranean Turkey Wrap", portion: "1 wrap", itemWasteCost: 3.25 };
deli.items["37311.43"] = { mrn: "37311.43", item: "Chicken Caesar Wrap", portion: "1 wrap", itemWasteCost: 2.75 };
deli.quantities["190990"] = { friday: 5, monday: 10, wednesday: 15 };
deli.quantities["37311.43"] = { friday: 2, monday: 4, wednesday: 6 };
const deliRecord = buildOrderRecord({ cafe: "Nessie", weekStart: "2026-11-16", quantities: emptyQuantities(), grill, deli, now: new Date("2026-11-10T12:00:00Z") });
assert.equal(deliRecord.deli.version, COMMISSARY_DELI_ORDER_VERSION);
assert.equal(deliRecord.deli.cycleWeek, 1);
assert.equal(validateBeforeCutoff([deliRecord]), "");
assert.equal(deliOrderLinesForCafe(deliRecord).length, 2);
assert.ok(deliPrepLinesForCafe(deliRecord).some((line) => line.name.includes("Turkey")));
assert.ok(rolledUpPrepItems([deliRecord]).some((line) => line.category.startsWith("Deli")));
assert.ok(orderValue(deliRecord.quantities, deliRecord.grill, deliRecord.deli, {}, "Nessie", {}, "2026-11-16") > (30 * 3.25) + (12 * 2.75));
const deliTransfer = buildCommissaryTransfer(deliRecord);
assert.equal(deliTransfer.items.filter((item) => item.menu === "AMZ: Deli Core").length, 2);
assert.ok(deliTransfer.items.filter((item) => item.menu === "AMZ: Deli Core").every((item) => item.ingredientAllocations[0].glCode === "4111011"));
const deliBom = buildCommissaryBomWorkbook([deliRecord], "2026-11-16");
const deliBomRows = XLSX.utils.sheet_to_json(deliBom.Sheets["Monday Prep List"], { header: 1, defval: "" });
assert.ok(deliBomRows.some((row) => row[0].includes("Turkey") && Number(row[1]) > 0));
const deliMondayRows = XLSX.utils.sheet_to_json(deliBom.Sheets["Monday Delivery Map"], { header: 1, defval: "" });
assert.ok(deliMondayRows.some((row) => row[0] === "Nessie" && row[1] === "Deli" && row[2] === "Mediterranean Turkey Wrap" && row[4] === 10 && row[5] === "sandwich"));
assert.equal(deliMondayRows.some((row) => row[6] === "Mediterranean Turkey Wrap" && row[2] !== "Mediterranean Turkey Wrap"), false, "Deli delivery maps must show sandwiches, not mise en place components.");
assert.ok(rolledUpPrepItems([deliRecord], { hub: "Cricket" }).some((line) => line.category.startsWith("Deli")));
assert.equal(rolledUpPrepItems([deliRecord], { hub: "Sonic" }).length, 0);
const retiredDeli = normalizeDeliOrder({ quantities: { "37394.7": { friday: 2, monday: 3, wednesday: 4 } }, items: { "37394.7": { mrn: "37394.7", item: "Banh Mi Ham Sandwich", portion: "1 sandwich", itemWasteCost: 2.94 } } }, "2026-11-30", "Nessie");
assert.deepEqual(retiredDeli.standingOrderMrns, ["37394.7"], "A saved Ham Banh Mi order must remain visible after it leaves the selectable roster.");
assert.equal(retiredDeli.quantities["37394.7"].monday, 3);
assert.equal(standingOrderReductions({ deli: retiredDeli }, { deli: { ...retiredDeli, quantities: { ...retiredDeli.quantities, "37394.7": { friday: 2, monday: 0, wednesday: 4 } } } }).length, 1);

const breakfast = emptyBreakfastOrder();
const breakfastOption = BREAKFAST_ORDERING_PROGRAM.items[0];
breakfast.selections = [breakfastOption.id];
breakfast.items[breakfastOption.id] = { ...breakfastOption, menu: BREAKFAST_ORDERING_PROGRAM.menu, item: breakfastOption.name, itemWasteCost: 3.5 };
breakfast.quantities[breakfastOption.id] = { friday: 4, monday: 6, wednesday: 8 };
const breakfastRecord = buildOrderRecord({ cafe: "Roxanne Coffee", weekStart: "2026-11-16", breakfast, now: new Date("2026-11-10T12:00:00Z") });
assert.equal(breakfastRecord.breakfast.version, COMMISSARY_BREAKFAST_ORDER_VERSION);
assert.equal(validateBeforeCutoff([breakfastRecord]), "");
assert.equal(breakfastOrderLinesForCafe(breakfastRecord)[0].total, 18);
assert.ok(breakfastPrepLinesForCafe(breakfastRecord).length > 0);
assert.ok(rolledUpPrepItems([breakfastRecord], { hub: "Blueshift" }).some((line) => line.category.startsWith("Breakfast")));
assert.equal(orderValue(breakfastRecord.quantities, breakfastRecord.grill, breakfastRecord.deli, breakfastRecord.global, breakfastRecord.cafe, breakfastRecord.breakfast), 63);
const breakfastTransfer = buildCommissaryTransfer(breakfastRecord);
assert.equal(breakfastTransfer.receivingProfitCenter, "28671");
assert.equal(breakfastTransfer.items[0].ingredientAllocations[0].glCode, "4111011");
assert.ok(buildPackoutPacket([breakfastRecord], "2026-11-16").pages.every((page) => page.stations.every(({ station }) => station === "Breakfast")));
assert.match(validateBeforeCutoff([{ ...breakfastRecord, breakfast: { ...breakfastRecord.breakfast, quantities: { ...breakfastRecord.breakfast.quantities, [breakfastOption.id]: { friday: 0.5, monday: 0, wednesday: 0 } } } }]), /whole items/i);

const global = emptyGlobalOrder("2026-11-16");
const globalOption = globalCycleForWeek("2026-11-16").menus[0].items[0];
global.menu = globalOption.menu;
global.selections.entrees[0] = globalOption.id;
global.items[globalOption.id] = { ...globalOption, item: globalOption.name, itemWasteCost: 4.25 };
global.quantities[globalOption.id] = { friday: 2, monday: 3, wednesday: 4 };
const globalRecord = buildOrderRecord({ cafe: "Everest", weekStart: "2026-11-16", quantities: emptyQuantities(), global, now: new Date("2026-11-10T12:00:00Z") });
assert.equal(globalRecord.global.version, COMMISSARY_GLOBAL_ORDER_VERSION);
assert.equal(globalRecord.global.cycleWeek, 1);
assert.equal(validateBeforeCutoff([globalRecord]), "");
assert.equal(globalOrderLinesForCafe(globalRecord)[0].total, 9);
assert.ok(globalPrepLinesForCafe(globalRecord).length > 0);
assert.ok(rolledUpPrepItems([globalRecord], { hub: "Blueshift" }).some((line) => line.category.startsWith("Global")));
assert.equal(rolledUpPrepItems([globalRecord], { hub: "Cricket" }).length, 0);
assert.ok(orderValue(globalRecord.quantities, globalRecord.grill, globalRecord.deli, globalRecord.global, globalRecord.cafe, {}, globalRecord.weekStart) >= 0);
const globalTransfer = buildCommissaryTransfer(globalRecord);
assert.equal(globalTransfer.items.length, globalTransferLinesForCafe(globalRecord).length);
assert.ok(globalTransfer.items.every((item) => item.itemWasteCost > 0));
const cricketScopedWorkbook = buildCommissaryBomWorkbook([record, globalRecord], "2026-11-16", DEFAULT_COMMISSARY_METADATA, { hub: "Cricket" });
const cricketScopedMonday = XLSX.utils.sheet_to_json(cricketScopedWorkbook.Sheets["Monday Delivery Map"], { header: 1, defval: "" });
assert.ok(cricketScopedMonday.some((row) => row[0] === "Nessie"), "Cricket prep must include a Cricket-routed cafe.");
assert.equal(cricketScopedMonday.some((row) => row[0] === "Everest"), false, "Cricket prep must exclude cafes routed to other hubs.");
const porto = emptyGlobalOrder("2026-11-16");
const portoMenu = globalCycleForWeek("2026-11-16").menus.find(({ menu }) => menu === "AMZ: Porto");
const portoPotatoes = portoMenu.items.find(({ mrn }) => mrn === "121015");
const portoChicken = portoMenu.items.find(({ mrn }) => mrn === "121026");
const portoDippingSauce = portoMenu.items.find(({ mrn }) => mrn === "120722");
const portoPirinaise = portoMenu.items.find(({ mrn }) => mrn === "121071");
assert.ok(portoDippingSauce && portoPirinaise, "Porto must expose both reviewed optional sauces.");
porto.menu = portoMenu.menu;
porto.selections.entrees[0] = portoChicken.id;
porto.selections.sides[0] = portoPotatoes.id;
porto.selections.sauces[0] = portoDippingSauce.id;
for (const option of [portoChicken, portoPotatoes, portoDippingSauce]) {
  porto.items[option.id] = { ...option, item: option.name, itemWasteCost: 2 };
  porto.quantities[option.id] = { friday: 8, monday: 0, wednesday: 0 };
}
const portoRecord = buildOrderRecord({ cafe: "Everest", weekStart: "2026-11-16", global: porto, now: new Date("2026-11-10T12:00:00Z") });
const portoPrep = globalPrepLinesForCafe(portoRecord);
assert.ok(portoPrep.some(({ name }) => name === "Piri Piri Potato Wedge Spice Mix"));
assert.equal(portoPrep.some(({ name }) => /canola|kosher salt|black pepper|^spice,/i.test(name)), false);
assert.ok(portoPrep.some(({ name, mrn }) => name === "Piri Piri Marinade/Base" && mrn === "120715"), "Piri Piri protein orders must resolve the hidden reviewed marinade.");
assert.equal(portoPrep.some(({ name }) => /Chicken, Whole Fryer/i.test(name)), false, "Unit-purchased protein must not enter Commissary prep.");
assert.ok(globalTransferLinesForCafe(portoRecord).some(({ name, mrn }) => name === "Piri Piri Marinade/Base" && mrn === "120715"), "The same hidden marinade must reach transfers.");

const balti = emptyGlobalOrder("2026-12-07");
const baltiMenu = globalCycleForWeek("2026-12-07").menus.find(({ menu }) => menu === "AMZ: Balti");
const butterChicken = baltiMenu.items.find(({ mrn }) => mrn === "212486.1");
balti.menu = baltiMenu.menu;
balti.selections.entrees[0] = butterChicken.id;
balti.items[butterChicken.id] = { ...butterChicken, item: butterChicken.name, itemWasteCost: 3.241 };
balti.quantities[butterChicken.id] = { friday: 10, monday: 0, wednesday: 0 };
const baltiRecord = buildOrderRecord({ cafe: "Everest", weekStart: "2026-12-07", global: balti, now: new Date("2026-12-01T12:00:00Z") });
const baltiPrep = globalPrepLinesForCafe(baltiRecord);
assert.ok(baltiPrep.some(({ name, mrn }) => name === "Tikka Marinade" && mrn === "165741.29"));
assert.ok(baltiPrep.some(({ name }) => name === "Butter Chicken Sauce"));
assert.equal(baltiPrep.some(({ name }) => /Chicken, Thigh/i.test(name)), false);
assert.ok(globalTransferLinesForCafe(baltiRecord).some(({ name }) => name === "Butter Chicken Sauce"));

const smokehouse = emptyGlobalOrder("2026-12-21");
const smokehouseMenu = globalCycleForWeek("2026-12-21").menus.find(({ menu }) => menu === "AMZ: Smokehouse BBQ");
const kielbasa = smokehouseMenu.items.find(({ mrn }) => mrn === "5365.6");
smokehouse.menu = smokehouseMenu.menu;
smokehouse.selections.entrees[0] = kielbasa.id;
smokehouse.items[kielbasa.id] = { ...kielbasa, item: kielbasa.name, itemWasteCost: 2 };
smokehouse.quantities[kielbasa.id] = { friday: 6, monday: 0, wednesday: 0 };
const kielbasaRecord = buildOrderRecord({ cafe: "Everest", weekStart: "2026-12-21", global: smokehouse, now: new Date("2026-12-15T12:00:00Z") });
assert.equal(globalPrepLinesForCafe(kielbasaRecord).length, 0, "Kielbasa is wholly in-unit.");
assert.equal(globalTransferLinesForCafe(kielbasaRecord).length, 0, "Kielbasa must not reach Commissary transfers.");
assert.deepEqual(prepareGlobalCommissaryComponents([
  { name: "Plant-Based Beef Crumble", quantity: 4, unit: "ounce" },
  { name: "Kofta Sauce", quantity: 2, unit: "fluid ounce" },
], "2026-11-30", "global|amz-cypress|132544.5|1-each").map(({ name }) => name), ["Kofta Sauce"], "Direct-build plant protein stays in-unit while its preparation remains.");
assert.match(validateBeforeCutoff([{ ...globalRecord, global: { ...globalRecord.global, quantities: { ...globalRecord.global.quantities, [globalOption.id]: { friday: 0.5, monday: 0, wednesday: 0 } } } }]), /whole portions/i);
assert.match(validateBeforeCutoff([{ ...globalRecord, global: { ...globalRecord.global, menu: "AMZ: Taco Total" } }]), /outside the selected menu/i);
const legacyMultiMenu = emptyGlobalOrder("2026-11-16");
const legacyOtherMenuOption = globalCycleForWeek("2026-11-16").menus[1].items.find(({ category }) => category === "entree");
legacyMultiMenu.version = 1;
legacyMultiMenu.quantities[globalOption.id] = { friday: 2, monday: 0, wednesday: 0 };
legacyMultiMenu.quantities[legacyOtherMenuOption.id] = { friday: 0, monday: 3, wednesday: 0 };
legacyMultiMenu.items[globalOption.id] = { ...globalOption, item: globalOption.name, itemWasteCost: 4.25 };
legacyMultiMenu.items[legacyOtherMenuOption.id] = { ...legacyOtherMenuOption, item: legacyOtherMenuOption.name, itemWasteCost: 3.5 };
const legacyMultiMenuRecord = buildOrderRecord({ cafe: "Everest", weekStart: "2026-11-16", quantities: emptyQuantities(), global: legacyMultiMenu, now: new Date("2026-11-10T12:00:00Z") });
const normalizedLegacyMultiMenu = legacyMultiMenuRecord.global;
assert.equal(normalizedLegacyMultiMenu.legacyReviewRequired, true);
assert.equal(normalizedLegacyMultiMenu.quantities[globalOption.id].friday, 2, "Legacy multi-menu quantities must remain intact until an operator chooses the replacement menu.");
assert.equal(normalizedLegacyMultiMenu.quantities[legacyOtherMenuOption.id].monday, 3);
assert.equal(globalOrderLinesForCafe(legacyMultiMenuRecord).length, 2, "Legacy multi-menu quantities must remain available to transfers and packouts.");
assert.ok(globalPrepLinesForCafe(legacyMultiMenuRecord).length > 0, "Legacy multi-menu quantities must remain available to prep.");
assert.ok(orderValue(legacyMultiMenuRecord.quantities, legacyMultiMenuRecord.grill, legacyMultiMenuRecord.deli, legacyMultiMenuRecord.global, legacyMultiMenuRecord.cafe, {}, legacyMultiMenuRecord.weekStart) > 0);
assert.match(validateBeforeCutoff([{ ...globalRecord, global: normalizedLegacyMultiMenu }]), /explicit replacement/i);

const legacyOverCap = emptyGlobalOrder("2026-11-16");
const sameMenuOptions = globalCycleForWeek("2026-11-16").menus[0].items.filter(({ category }) => category === "entree").slice(0, 4);
assert.equal(sameMenuOptions.length, 4, "The fixture requires four entrees to verify legacy slot preservation.");
legacyOverCap.version = 1;
for (const [index, option] of sameMenuOptions.entries()) {
  legacyOverCap.quantities[option.id] = { friday: index + 1, monday: 0, wednesday: 0 };
  legacyOverCap.items[option.id] = { ...option, item: option.name, itemWasteCost: 2 + index };
}
const legacyOverCapRecord = buildOrderRecord({ cafe: "Everest", weekStart: "2026-11-16", quantities: emptyQuantities(), global: legacyOverCap, now: new Date("2026-11-10T12:00:00Z") });
assert.equal(legacyOverCapRecord.global.legacyReviewRequired, true);
assert.equal(globalOrderLinesForCafe(legacyOverCapRecord).length, 4, "A legacy fourth entree must not be silently dropped.");

const convertedSauce = prepDisplayQuantity({ name: "Piri Piri Sauce", finishedDish: "Piri Piri Chicken", orderUnit: "fluid ounce", total: 64, friday: 64, monday: 0, wednesday: 0, cafes: { Nessie: { friday: 64, monday: 0, wednesday: 0 } } });
assert.equal(convertedSauce.orderUnit, "quart");
assert.equal(convertedSauce.friday, 2);
const weightedSauce = prepDisplayQuantity({ name: "Tomato Sauce", orderUnit: "ounce", total: 64, friday: 64, monday: 0, wednesday: 0, cafes: {} });
assert.equal(weightedSauce.orderUnit, "ounce", "Weight ounces must never be treated as fluid ounces.");
const grillTablespoons = prepDisplayQuantity({ station: "Grill", name: "Burger Sauce", orderUnit: "tbsp", total: 64, friday: 64, monday: 0, wednesday: 0, cafes: {} });
assert.equal(grillTablespoons.orderUnit, "quart");
assert.equal(grillTablespoons.total, 1);
const kilograms = prepDisplayQuantity({ name: "Tomatoes", orderUnit: "kg", total: 2, friday: 2, monday: 0, wednesday: 0, cafes: {} });
assert.equal(kilograms.orderUnit, "pound");
assert.equal(kilograms.total, 4.4092);
const avocadoScoops = prepDisplayQuantity({ name: "Avocado Mash", orderUnit: "#16 scoop", total: 64, friday: 64, monday: 0, wednesday: 0, cafes: {} });
assert.equal(avocadoScoops.orderUnit, "gallon");
assert.equal(avocadoScoops.total, 1);
assert.equal(GLOBAL_UNIT_PREPARATION_NOTES["AMZ: Balti"], "Rice and naan purchased and prepared in unit.");
assert.equal(GLOBAL_UNIT_PREPARATION_NOTES["AMZ: Lotus"], "Rice purchased and prepared in unit.");

const packet = buildPackoutPacket([globalRecord], "2026-11-16");
assert.equal(packet.pages.length, 3);
assert.ok(packet.pages.every((page) => page.cafe === "Everest" && page.stations.every(({ station }) => ["Global"].includes(station))));
const packetBytes = buildPackoutPdfBytes(packet);
assert.equal(new TextDecoder().decode(packetBytes.slice(0, 8)), "%PDF-1.4");
assert.ok(packetBytes.length > 3000);
const exactCafePacket = buildPackoutPacket([globalRecord], "2026-11-16", DEFAULT_COMMISSARY_METADATA, { selectedCafe: "Everest" });
assert.ok(exactCafePacket.pages.every((page) => page.cafe === "Everest"));
const sonicHubPacket = buildPackoutPacket([globalRecord], "2026-11-16", DEFAULT_COMMISSARY_METADATA, { selectedCafe: "Sonic" });
assert.equal(sonicHubPacket.pages.length, 3, "Sonic hub packout must include routed Everest Global work.");
const cricketHubPacket = buildPackoutPacket([globalRecord], "2026-11-16", DEFAULT_COMMISSARY_METADATA, { selectedCafe: "Cricket" });
assert.equal(cricketHubPacket.pages.length, 0, "Cricket hub packout must not include Everest Global work.");
const packetRecord = { ...buildPackoutPacketRecord({ weekStart: "2026-11-16", records: [globalRecord], packet, metadataVersion: 19, now: new Date("2026-11-12T01:00:00Z") }), packet };
assert.equal(commissaryWriteValidation([packetRecord], { tool: "commissaryOrders" }), "");
assert.match(commissaryWriteValidation([{ ...packetRecord, packet: { ...packet, pages: [{ ...packet.pages[0], cafe: "Unknown Cafe" }] } }], { tool: "commissaryOrders" }), /scope|invalid cafe/i);
assert.match(commissaryWriteValidation([{ ...packetRecord, orderRecordIds: [`commissaryOrder|nessie|${packetRecord.weekStart}`] }], { tool: "commissaryOrders" }), /order-reference scope/i);
assert.match(commissaryWriteValidation([{ ...packetRecord, packet: { ...packet, pages: packet.pages.map((page, index) => index ? page : { ...page, deliveryDate: "2026-11-17" }) } }], { tool: "commissaryOrders" }), /invalid cafe, delivery/i);
const duplicateLinePage = packet.pages.find((page) => page.stations.some(({ lines }) => lines.length));
const duplicateStation = duplicateLinePage.stations.find(({ lines }) => lines.length);
const packetWithDuplicateLine = { ...packet, pages: packet.pages.map((page) => page === duplicateLinePage ? { ...page, stations: page.stations.map((station) => station === duplicateStation ? { ...station, lines: [...station.lines, station.lines[0]] } : station) } : page) };
assert.match(commissaryWriteValidation([{ ...packetRecord, packet: packetWithDuplicateLine }], { tool: "commissaryOrders" }), /invalid cafe, delivery/i);

const zeroVolumeRecord = buildOrderRecord({ cafe: "Nessie", weekStart: "2026-11-16", quantities: emptyQuantities(), now: new Date("2026-11-10T12:00:00Z") });
const scopedPacketRecord = buildPackoutPacketRecord({ weekStart: "2026-11-16", records: [globalRecord, zeroVolumeRecord], packet, metadataVersion: 13, now: new Date("2026-11-12T01:00:00Z") });
assert.equal(scopedPacketRecord.cafeCount, 1);
assert.deepEqual(scopedPacketRecord.orderRecordIds, [globalRecord["Record ID"]]);

console.log("Commissary Ordering Tool verified: immutable saved orders, day-specific prep lists, exact-MRN rollups, whole-sandwich Deli delivery maps, station-grouped cost-free delivery maps, unified Grill ordering, and Friday-Thursday S4 consolidation.");
