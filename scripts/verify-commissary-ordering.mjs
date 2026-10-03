import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import * as XLSX from "xlsx";

import { buildS4Rows, buildS4Workbook } from "../src/features/transfer-tool/transferExport.js";
import { COMMISSARY_ORDER_ITEMS } from "../src/features/commissary-ordering/commissaryCatalog.js";
import { buildCommissaryBomWorkbook, buildCommissaryTransfer } from "../src/features/commissary-ordering/commissaryExport.js";
import { addDays, buildOrderRecord, emptyQuantities, firstOpenWeek, isWeekLocked, transferPeriod } from "../src/features/commissary-ordering/commissaryModel.js";

assert.equal(COMMISSARY_ORDER_ITEMS.length, 41, "The source workbook should produce 41 commissary order items.");
assert.equal(COMMISSARY_ORDER_ITEMS.find((row) => row.name === "Aleppo-Edamame")?.mrn, "176736");
assert.equal(COMMISSARY_ORDER_ITEMS.find((row) => row.name === "Balsamic Vinegar")?.orderUnit, "5-liter container");
assert.equal(COMMISSARY_ORDER_ITEMS.find((row) => row.name === "Fat Free Italian Dressing")?.orderUnit, "32-ounce bottle");
assert.equal(COMMISSARY_ORDER_ITEMS.find((row) => row.name === "Ranch Dressing")?.orderUnit, "gallon");

assert.equal(isWeekLocked("2026-10-12", new Date("2026-10-07T23:59:00Z")), false, "4:59 PM Pacific Wednesday should remain open.");
assert.equal(isWeekLocked("2026-10-12", new Date("2026-10-08T00:00:00Z")), true, "5:00 PM Pacific Wednesday should be locked.");
assert.equal(isWeekLocked("2026-10-12", new Date("2026-10-07T12:00:00Z")), false);
assert.deepEqual(transferPeriod("2026-10-12"), { start: "2026-10-09", end: "2026-10-15" });
assert.equal(firstOpenWeek(new Date("2026-10-03T15:00:00Z")), "2026-10-12");

const quantities = emptyQuantities();
quantities[COMMISSARY_ORDER_ITEMS[0].id] = { monday: 2, wednesday: 1 };
quantities[COMMISSARY_ORDER_ITEMS.find((row) => row.name === "Balsamic Vinegar").id] = { monday: 1, wednesday: 0 };
const record = buildOrderRecord({ cafe: "Nessie", weekStart: "2026-10-12", quantities, now: new Date("2026-10-06T12:00:00Z") });
const transfer = buildCommissaryTransfer(record);
const s4Rows = buildS4Rows(transfer);
assert.equal(s4Rows.length, 2, "Both deliveries must consolidate to one S4 row per ordered item.");
assert.ok(s4Rows.every((row) => row.fromGlAccount === "4111011" && row.toGlAccount === "4111011"));
assert.ok(s4Rows.every((row) => row.receivingProfitCenter === "30159"));
assert.ok(s4Rows.some((row) => row.transferAmount === Math.round(3 * COMMISSARY_ORDER_ITEMS[0].orderUnitCost * 100) / 100));
assert.equal(transfer.departingProfitCenter, "22472");
assert.equal(transfer.transferDate, "2026-10-15");

const bomWorkbook = buildCommissaryBomWorkbook([record], "2026-10-12");
assert.deepEqual(bomWorkbook.SheetNames, ["Consolidated Prep List", "Monday Delivery Map", "Wednesday Delivery Map"]);
const bomSheet = bomWorkbook.Sheets["Consolidated Prep List"];
const bomRows = XLSX.utils.sheet_to_json(bomSheet, { header: 1, defval: "" });
assert.equal(bomRows[0][0], "Ingredient Technique BOM Tree");
const mondayRows = XLSX.utils.sheet_to_json(bomWorkbook.Sheets["Monday Delivery Map"], { header: 1, defval: "" });
const wednesdayRows = XLSX.utils.sheet_to_json(bomWorkbook.Sheets["Wednesday Delivery Map"], { header: 1, defval: "" });
assert.ok(mondayRows.some((row) => row[0] === "Nessie" && row[1] === "Sliced Cucumber" && row[3] === 2));
assert.ok(wednesdayRows.some((row) => row[0] === "Nessie" && row[1] === "Sliced Cucumber" && row[3] === 1));

const templateBytes = await readFile(new URL("../public/templates/ExpenseTransfer_Between_PC_Template.xlsx", import.meta.url));
const exportedBytes = await buildS4Workbook(templateBytes, transfer);
const exportedWorkbook = XLSX.read(exportedBytes, { type: "array" });
const exportedRows = XLSX.utils.sheet_to_json(exportedWorkbook.Sheets[exportedWorkbook.SheetNames[0]], { header: 1, defval: "" });
assert.deepEqual(exportedRows[0].slice(0, 6), ["From GL Account", "To Profit Center", "To GL Account", "Description", "Transfer Amount", "Event ID"]);
assert.equal(exportedRows.length, 3, "The exact S4 template should contain a header plus two consolidated item rows.");
assert.ok(exportedRows.slice(1).every((row) => row[0] === "4111011" && row[1] === "30159" && row[2] === "4111011"));

const future = addDays("2026-10-12", 7);
assert.equal(isWeekLocked(future, new Date("2026-10-08T00:01:00Z")), false);

console.log("Commissary Ordering Tool verified: 41 items, Pacific cutoff, three-tab BOM, Friday–Thursday S4 consolidation, and Prepared Foods fallback.");
