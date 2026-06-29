import rows from "../src/data/menuItems.json" with { type: "json" };
import { buildCafeRotationReadiness } from "../src/features/smartsheet-health/rotationRecordAudit.js";
import { buildRecipeMappingAudit } from "../src/features/smartsheet-health/recipeMappingAudit.js";
import { SMARTSHEET_COLUMNS, SMARTSHEET_RECORD_TYPES } from "../src/integrations/smartsheet/contract.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function rotationRecord(overrides = {}) {
  return {
    [SMARTSHEET_COLUMNS.recordId]: "",
    [SMARTSHEET_COLUMNS.parentRecordId]: "",
    [SMARTSHEET_COLUMNS.recordType]: SMARTSHEET_RECORD_TYPES.stationSelection,
    [SMARTSHEET_COLUMNS.status]: "Submitted",
    [SMARTSHEET_COLUMNS.district]: "South",
    [SMARTSHEET_COLUMNS.cafeUnit]: "Doppler",
    [SMARTSHEET_COLUMNS.weekStartDate]: "2026-06-29",
    [SMARTSHEET_COLUMNS.weekEndDate]: "2026-07-03",
    [SMARTSHEET_COLUMNS.dateRangeLabel]: "Jun 29, 2026 - Jul 3, 2026",
    [SMARTSHEET_COLUMNS.stationKey]: "global",
    ...overrides,
  };
}

const dopplerParent = "rotation|2026-06-29|South|Doppler";
const reinventParent = "rotation|2026-06-29|South|Re:Invent";
const readiness = buildCafeRotationReadiness([
  rotationRecord({
    [SMARTSHEET_COLUMNS.recordId]: dopplerParent,
    [SMARTSHEET_COLUMNS.recordType]: SMARTSHEET_RECORD_TYPES.rotationHeader,
    [SMARTSHEET_COLUMNS.cafeUnit]: "Doppler",
  }),
  ...["global", "salad", "grill", "deli"].map((stationKey) => rotationRecord({
    [SMARTSHEET_COLUMNS.recordId]: `${dopplerParent}|${stationKey}|LTO|1|Test`,
    [SMARTSHEET_COLUMNS.parentRecordId]: dopplerParent,
    [SMARTSHEET_COLUMNS.cafeUnit]: "Doppler",
    [SMARTSHEET_COLUMNS.stationKey]: stationKey,
  })),
  rotationRecord({
    [SMARTSHEET_COLUMNS.recordId]: reinventParent,
    [SMARTSHEET_COLUMNS.recordType]: SMARTSHEET_RECORD_TYPES.rotationHeader,
    [SMARTSHEET_COLUMNS.cafeUnit]: "Re:Invent",
  }),
  ...[
    ["global", "tueWed"],
    ["global", "thuFri"],
    ["grill", ""],
    ["deli", ""],
    ["fishMarket", ""],
  ].map(([stationKey, blockId], index) => rotationRecord({
    [SMARTSHEET_COLUMNS.recordId]: `${reinventParent}|${stationKey}|${index}`,
    [SMARTSHEET_COLUMNS.parentRecordId]: reinventParent,
    [SMARTSHEET_COLUMNS.cafeUnit]: "Re:Invent",
    [SMARTSHEET_COLUMNS.stationKey]: stationKey,
    [SMARTSHEET_COLUMNS.recordType]: stationKey === "global" ? SMARTSHEET_RECORD_TYPES.globalSelection : SMARTSHEET_RECORD_TYPES.stationSelection,
    [SMARTSHEET_COLUMNS.globalBlockId]: blockId ? `${reinventParent}|global|${blockId}` : "",
    [SMARTSHEET_COLUMNS.menuBlockLabel]: blockId,
  })),
], { focusWeekStartDate: "2026-06-29" });

const doppler = readiness.cafes.find((row) => row.cafe === "Doppler");
const reinvent = readiness.cafes.find((row) => row.cafe === "Re:Invent");
const day1 = readiness.cafes.find((row) => row.cafe === "Day 1");

assert(doppler.status === "ready", `Doppler should be ready when only optional pizza is missing, got ${doppler.status}.`);
assert(reinvent.status === "ready", `Re:Invent Jun 29 should be ready with tueWed/thuFri plus station rows, got ${reinvent.status}.`);
assert(day1.status === "needs_review", "Day 1 should need review when no saved rotation exists for the focus week.");

const mapping = buildRecipeMappingAudit(rows);
const grillCore = mapping.families.find((family) => family.id === "grill-core");
const carvery = mapping.families.find((family) => family.id === "carvery");
const freshFive = mapping.families.find((family) => family.id === "fresh-five");
const globalMenus = mapping.families.find((family) => family.id === "global-menus");

assert(grillCore && grillCore.status === "ready", `Grill Core mapping should be ready, got ${grillCore?.status}.`);
assert(carvery && carvery.metrics.charredVegetables >= 9, "Carvery mapping should count charred vegetable options.");
assert(freshFive && freshFive.metrics.stationCount >= 5, "Fresh Five mapping should report station coverage.");
assert(globalMenus && globalMenus.metrics.menuCount >= 15, "Global menu mapping should report loaded AMZ global menu count.");
assert(mapping.summary.reviewRows >= 0 && mapping.summary.watchRows >= 0, "Recipe mapping audit should include trust review/watch counts.");

console.log("Operational readiness verification passed.");
