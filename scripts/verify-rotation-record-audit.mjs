import { buildRotationRecordAudit, buildStatusDriftRepairRecords } from "../src/features/smartsheet-health/rotationRecordAudit.js";
import { SMARTSHEET_COLUMNS, SMARTSHEET_RECORD_TYPES } from "../src/integrations/smartsheet/contract.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function record(overrides = {}) {
  return {
    [SMARTSHEET_COLUMNS.recordId]: "",
    [SMARTSHEET_COLUMNS.parentRecordId]: "",
    [SMARTSHEET_COLUMNS.recordType]: SMARTSHEET_RECORD_TYPES.globalSelection,
    [SMARTSHEET_COLUMNS.status]: "Draft",
    [SMARTSHEET_COLUMNS.district]: "South",
    [SMARTSHEET_COLUMNS.cafeUnit]: "Re:Invent",
    [SMARTSHEET_COLUMNS.weekStartDate]: "2026-06-29",
    [SMARTSHEET_COLUMNS.weekEndDate]: "2026-07-03",
    [SMARTSHEET_COLUMNS.dateRangeLabel]: "Jun 29, 2026 - Jul 3, 2026",
    ...overrides,
  };
}

const submittedHeader = record({
  [SMARTSHEET_COLUMNS.recordId]: "rotation|2026-06-29|South|Re:Invent",
  [SMARTSHEET_COLUMNS.recordType]: SMARTSHEET_RECORD_TYPES.rotationHeader,
  [SMARTSHEET_COLUMNS.status]: "Submitted",
  [SMARTSHEET_COLUMNS.submittedAt]: "Jun 28, 7:30 PM",
  [SMARTSHEET_COLUMNS.updatedAt]: "Jun 28, 7:30 PM",
});

const staleChild = record({
  [SMARTSHEET_COLUMNS.recordId]: "rotation|2026-06-29|South|Re:Invent|global|Entrée|1|Red Curry Chicken Bowl",
  [SMARTSHEET_COLUMNS.parentRecordId]: "rotation|2026-06-29|South|Re:Invent",
  [SMARTSHEET_COLUMNS.globalBlockId]: "rotation|2026-06-29|South|Re:Invent|global|tueWed",
  [SMARTSHEET_COLUMNS.menuBlockLabel]: "tueWed",
  [SMARTSHEET_COLUMNS.menuConcept]: "AMZ: Lemongrass + Lime",
  [SMARTSHEET_COLUMNS.menuItemSelection]: "Red Curry Chicken Bowl",
});

const duplicateChild = {
  ...staleChild,
  [SMARTSHEET_COLUMNS.menuItemSelection]: "Duplicate Red Curry Chicken Bowl",
};

const wrongReInventBlock = record({
  [SMARTSHEET_COLUMNS.recordId]: "rotation|2026-06-29|South|Re:Invent|global|Entrée|1|Wrong Monday Block",
  [SMARTSHEET_COLUMNS.parentRecordId]: "rotation|2026-06-29|South|Re:Invent",
  [SMARTSHEET_COLUMNS.globalBlockId]: "rotation|2026-06-29|South|Re:Invent|global|monTue",
  [SMARTSHEET_COLUMNS.menuBlockLabel]: "monTue",
  [SMARTSHEET_COLUMNS.menuConcept]: "AMZ: Masaya",
  [SMARTSHEET_COLUMNS.menuItemSelection]: "Wrong Monday Block",
});

const orphanChild = record({
  [SMARTSHEET_COLUMNS.recordId]: "rotation|2026-07-13|South|Re:Invent|global|Entrée|1|Orphan",
  [SMARTSHEET_COLUMNS.parentRecordId]: "rotation|2026-07-13|South|Re:Invent",
  [SMARTSHEET_COLUMNS.weekStartDate]: "2026-07-13",
});

const audit = buildRotationRecordAudit([
  submittedHeader,
  staleChild,
  duplicateChild,
  wrongReInventBlock,
  orphanChild,
]);

assert(audit.summary.duplicateRecordIds === 1, "Audit should count duplicate Record IDs.");
assert(audit.summary.statusDriftRows === 3, "Audit should count draft child rows under submitted rotation headers.");
assert(audit.summary.orphanChildRows === 1, "Audit should count child rows without a matching rotation header.");
assert(audit.summary.reInventBlockIssues === 1, "Audit should count Re:Invent blocks that do not belong to the selected week pattern.");
assert(audit.statusDriftRows.some((issue) => issue.recordId === staleChild[SMARTSHEET_COLUMNS.recordId]), "Status drift issues should include the stale child row.");

const repairs = buildStatusDriftRepairRecords(audit.statusDriftRows);
assert(repairs.length === 2, "Repair payload should include one safe update per unique status drift Record ID.");
assert(new Set(repairs.map((row) => row[SMARTSHEET_COLUMNS.recordId])).size === repairs.length, "Repair payload must not contain duplicate Record IDs.");
assert(audit.summary.repairableRows === 2, "Audit repairable count should be unique by Record ID.");
assert(audit.summary.repairDuplicateRows === 1, "Audit should count duplicate repair row instances skipped by the safe repair.");
assert(repairs.every((row) => row[SMARTSHEET_COLUMNS.status] === "Submitted"), "Repair records should inherit submitted status.");
assert(repairs.every((row) => row[SMARTSHEET_COLUMNS.submittedAt] === "Jun 28, 7:30 PM"), "Repair records should inherit submitted time when blank.");

console.log("Rotation record audit verification passed.");
