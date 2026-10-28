import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import JSZip from "jszip";
import * as XLSX from "xlsx";
import BOM_XLSX from "xlsx-js-style";

import { commissaryWriteValidation } from "../api/storage/records.js";
import { buildS4Rows, buildS4Workbook } from "../src/features/transfer-tool/transferExport.js";
import { COMMISSARY_ORDER_ITEMS } from "../src/features/commissary-ordering/commissaryCatalog.js";
import { buildCommissaryBomWorkbook, buildCommissaryTransfer } from "../src/features/commissary-ordering/commissaryExport.js";
import { buildCommissaryMetadataRecord, DEFAULT_COMMISSARY_METADATA, isApprovedCommissaryMetadataRecord, resolveCommissaryMetadata } from "../src/features/commissary-ordering/commissaryMetadata.js";
import { COMMISSARY_ORDER_UNIT_VERSION, DELIVERY_KEYS, addDays, buildOrderRecord, buildPrepProgressRecord, emptyQuantities, firstOpenWeek, isWeekLocked, latestPrepWeek, normalizePrepCompleted, normalizeQuantities, togglePrepCompleted, transferPeriod } from "../src/features/commissary-ordering/commissaryModel.js";
import { COMMISSARY_SPANISH } from "../src/features/commissary-ordering/commissaryTranslations.js";

assert.equal(COMMISSARY_ORDER_ITEMS.length, 41, "The source workbook should produce 41 commissary order items.");
assert.equal(COMMISSARY_ORDER_ITEMS.find((row) => row.name === "Aleppo-Edamame")?.mrn, "176736");
assert.equal(COMMISSARY_ORDER_ITEMS.find((row) => row.name === "Balsamic Vinegar")?.orderUnit, "5-liter container");
assert.equal(COMMISSARY_ORDER_ITEMS.find((row) => row.name === "Fat Free Italian Dressing")?.orderUnit, "32-ounce bottle");
assert.equal(COMMISSARY_ORDER_ITEMS.find((row) => row.name === "Ranch Dressing")?.orderUnit, "gallon");
assert.ok(COMMISSARY_ORDER_ITEMS.filter((row) => row.legacyOrderUnit === "quart").every((row) => row.orderUnit === "gallon"), "Every quart-based catalog item should now order by gallon.");
const frozenPeas = COMMISSARY_ORDER_ITEMS.find((row) => row.name === "Frozen Peas");
assert.ok(frozenPeas, "Frozen Peas should replace Blanched Green Beans in the commissary catalog.");
assert.equal(COMMISSARY_ORDER_ITEMS.some((row) => row.name === "Blanched Green Beans"), false);
assert.equal(frozenPeas.mrn, "4877");
assert.equal(frozenPeas.orderUnit, "gallon");
assert.equal(frozenPeas.orderUnitCost, 9.08);
assert.equal(frozenPeas.transferGlCode, "4111009");
assert.equal(frozenPeas.transferGlCategory, "Frozen");
assert.deepEqual(DELIVERY_KEYS, ["friday", "monday", "wednesday"]);
assert.deepEqual(normalizeQuantities({ "commissary-9002-2": { monday: 1.5, wednesday: 0.5 } }, { orderUnitVersion: 1 })[frozenPeas.id], { friday: 0, monday: 0.38, wednesday: 0.13 }, "Saved green-bean quart quantities should migrate into the replacement peas gallon slot.");
assert.deepEqual(normalizeQuantities({ [frozenPeas.id]: { friday: 0.25, monday: 1.5, wednesday: 0.5 } }, { orderUnitVersion: COMMISSARY_ORDER_UNIT_VERSION })[frozenPeas.id], { friday: 0.25, monday: 1.5, wednesday: 0.5 }, "Current gallon quantities must not be converted twice.");

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
assert.deepEqual(DEFAULT_COMMISSARY_METADATA.receivingCafes.find(({ name }) => name === "Dawson"), { name: "Dawson", displayName: "SEA27 Dawson Cafe", profitCenter: "28675" });
assert.equal(commissaryWriteValidation([metadataRecord], { tool: "commissaryOrders" }), "");
assert.match(commissaryWriteValidation([{ ...metadataRecord, receivingCafes: metadataRecord.receivingCafes.map((row) => row.name === "Dawson" ? { ...row, profitCenter: "incorrect" } : row) }], { tool: "commissaryOrders" }), /approved release configuration/i);

assert.equal(isWeekLocked("2026-10-12", new Date("2026-10-07T23:59:00Z")), false, "4:59 PM Pacific Wednesday should remain open.");
assert.equal(isWeekLocked("2026-10-12", new Date("2026-10-08T00:00:00Z")), true, "5:00 PM Pacific Wednesday should be locked.");
assert.equal(isWeekLocked("2026-10-12", new Date("2026-10-07T12:00:00Z")), false);
assert.deepEqual(transferPeriod("2026-10-12"), { start: "2026-10-09", end: "2026-10-15" });
assert.equal(firstOpenWeek(new Date("2026-10-03T15:00:00Z")), "2026-10-12");
assert.equal(latestPrepWeek(new Date("2026-10-08T12:00:00Z")), "2026-10-12", "Prep View should default to the most recently locked service week.");
assert.equal(Object.keys(COMMISSARY_SPANISH.items).length, COMMISSARY_ORDER_ITEMS.length, "Every commissary item needs an explicit Spanish label.");
assert.ok(COMMISSARY_ORDER_ITEMS.every((row) => COMMISSARY_SPANISH.items[row.name]), "Spanish translation coverage must follow the entire commissary catalog.");
const firstPrepItem = COMMISSARY_ORDER_ITEMS[0].id;
const completed = togglePrepCompleted({}, "monday", firstPrepItem);
assert.deepEqual(completed, { friday: [], monday: [firstPrepItem], wednesday: [] });
assert.deepEqual(togglePrepCompleted(completed, "monday", firstPrepItem), { friday: [], monday: [], wednesday: [] });
assert.deepEqual(normalizePrepCompleted({ monday: [firstPrepItem, firstPrepItem, "not-an-item"] }), { friday: [], monday: [firstPrepItem], wednesday: [] });
const progressRecord = buildPrepProgressRecord({ weekStart: "2026-10-12", completed });
assert.equal(progressRecord["Record ID"], "commissaryOrder|prepProgress|2026-10-12");
assert.equal(progressRecord["Record Type"], "Commissary Prep Progress");
const currentLockedProgress = buildPrepProgressRecord({ weekStart: latestPrepWeek(), completed });
assert.equal(commissaryWriteValidation([currentLockedProgress], { tool: "commissaryOrders" }), "");
assert.match(commissaryWriteValidation([{ ...currentLockedProgress, completed: { friday: [], monday: [firstPrepItem, firstPrepItem], wednesday: [] } }], { tool: "commissaryOrders" }), /invalid or duplicate item/i);
assert.match(commissaryWriteValidation([buildPrepProgressRecord({ weekStart: firstOpenWeek(), completed })], { tool: "commissaryOrders" }), /available after.*cutoff/i);

const quantities = emptyQuantities();
quantities[COMMISSARY_ORDER_ITEMS[0].id] = { friday: 1, monday: 2, wednesday: 1 };
quantities[COMMISSARY_ORDER_ITEMS.find((row) => row.name === "Balsamic Vinegar").id] = { friday: 0, monday: 1, wednesday: 0 };
quantities[frozenPeas.id] = { friday: 0.25, monday: 1.25, wednesday: 0.75 };
const record = buildOrderRecord({ cafe: "Nessie", weekStart: "2026-10-12", quantities, now: new Date("2026-10-06T12:00:00Z") });
assert.equal(record.orderUnitVersion, COMMISSARY_ORDER_UNIT_VERSION);
const transfer = buildCommissaryTransfer(record);
const s4Rows = buildS4Rows(transfer);
assert.equal(s4Rows.length, 3, "All three deliveries must consolidate to one S4 row per ordered item.");
const frozenPeasTransferRow = s4Rows.find((row) => row.description.includes("Frozen Peas"));
assert.equal(frozenPeasTransferRow.fromGlAccount, "4111009");
assert.equal(frozenPeasTransferRow.toGlAccount, "4111009");
assert.equal(frozenPeasTransferRow.transferAmount, 20.43);
assert.ok(s4Rows.filter((row) => !row.description.includes("Frozen Peas")).every((row) => row.fromGlAccount === "4111011" && row.toGlAccount === "4111011"));
assert.ok(s4Rows.every((row) => row.receivingProfitCenter === "30159"));
assert.ok(s4Rows.some((row) => row.transferAmount === Math.round(4 * COMMISSARY_ORDER_ITEMS[0].orderUnitCost * 100) / 100));
assert.equal(transfer.departingProfitCenter, "22472");
assert.equal(transfer.transferDate, "2026-10-15");

const bomWorkbook = buildCommissaryBomWorkbook([record], "2026-10-12");
assert.deepEqual(bomWorkbook.SheetNames, ["Consolidated Prep List", "Friday Delivery Map", "Monday Delivery Map", "Wednesday Delivery Map", "Power Automate"]);
const bomSheet = bomWorkbook.Sheets["Consolidated Prep List"];
const bomRows = XLSX.utils.sheet_to_json(bomSheet, { header: 1, defval: "" });
assert.equal(bomRows[0][0], "Ingredient Technique Prep List");
assert.deepEqual(bomRows[2].slice(0, 3), ["Ingredient / item", "Total quantity", "Order unit"]);
assert.ok(bomRows.some((row) => row[0] === "Frozen Peas" && row[1] === 2.25 && row[2] === "gallon"));
assert.equal(bomSheet.A1.s.fill.fgColor.rgb, "17365D", "Prep List title should use the approved navy template band.");
assert.equal(bomSheet.A3.s.font.color.rgb, "FFFFFF", "Prep List column headers should use white text.");
assert.equal(bomSheet.A4.s.fill.fgColor.rgb, "D9EAF7", "The first item in a category should use the blue section-row treatment.");
assert.equal(bomSheet.A4.s.border.top.style, "medium", "Category starts should have a stronger top border.");
assert.equal(bomSheet.F4.s.border.bottom.style, "thin", "Every generated Prep List cell should retain formatted borders.");
assert.equal(bomSheet["!autofilter"].ref, `A3:F${bomRows.length}`);
const automationSheet = bomWorkbook.Sheets["Power Automate"];
const automationRows = XLSX.utils.sheet_to_json(automationSheet, { header: 1, defval: "" });
assert.deepEqual(automationRows[2], ["Finished dish", "Planned portions", "Current status", "Technique key", "Finished dish", "Normalized unit", "Required qty", "Planning quantity"]);
assert.ok(automationRows.some((row) => row[0] === "Frozen Peas" && row[1] === 2.25 && row[5] === "gallon" && row[6] === 2.25 && row[7] === 2.25));
assert.equal(bomWorkbook.Workbook.Sheets.find((sheet) => sheet.name === "Power Automate")?.Hidden, 1, "The Power Automate tab must open hidden.");
const fridayRows = XLSX.utils.sheet_to_json(bomWorkbook.Sheets["Friday Delivery Map"], { header: 1, defval: "" });
const mondayRows = XLSX.utils.sheet_to_json(bomWorkbook.Sheets["Monday Delivery Map"], { header: 1, defval: "" });
const wednesdayRows = XLSX.utils.sheet_to_json(bomWorkbook.Sheets["Wednesday Delivery Map"], { header: 1, defval: "" });
assert.ok(fridayRows.some((row) => row[0] === "Nessie" && row[1] === "Sliced Cucumber" && row[3] === 1));
assert.ok(mondayRows.some((row) => row[0] === "Nessie" && row[1] === "Sliced Cucumber" && row[3] === 2));
assert.ok(wednesdayRows.some((row) => row[0] === "Nessie" && row[1] === "Sliced Cucumber" && row[3] === 1));
const mondaySheet = bomWorkbook.Sheets["Monday Delivery Map"];
assert.equal(mondaySheet.A1.s.fill.fgColor.rgb, "17365D");
assert.equal(mondaySheet.A3.s.border.right.color.rgb, "FFFFFF", "Delivery headers should use the template's white border grid.");
assert.equal(mondaySheet.A4.s.fill.fgColor.rgb, "D9EAF7", "The first cafe row should be visually grouped.");
assert.equal(mondaySheet.G4.z, "$#,##0.00");
const styledBomBytes = BOM_XLSX.write(bomWorkbook, { type: "array", bookType: "xlsx", cellStyles: true });
const roundTripBom = BOM_XLSX.read(styledBomBytes, { type: "array", cellStyles: true });
assert.equal(roundTripBom.Sheets["Consolidated Prep List"].A1.s.fgColor.rgb, "17365D", "The downloadable workbook must retain the title fill after serialization.");
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
assert.ok(exportedRows.slice(1).some((row) => row[0] === "4111009" && row[2] === "4111009" && String(row[3]).includes("Frozen Peas") && row[4] === 20.43));
assert.ok(exportedRows.slice(1).filter((row) => !String(row[3]).includes("Frozen Peas")).every((row) => row[0] === "4111011" && row[2] === "4111011"));

const future = addDays("2026-10-12", 7);
assert.equal(isWeekLocked(future, new Date("2026-10-08T00:01:00Z")), false);

console.log("Commissary Ordering Tool verified: Supabase-backed Dawson metadata, Friday/Monday/Wednesday delivery routing, legacy gallon conversion, shared Prep View progress, styled delivery maps, and Friday–Thursday S4 consolidation.");
