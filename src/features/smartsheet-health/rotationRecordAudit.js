import { SMARTSHEET_COLUMNS, SMARTSHEET_RECORD_TYPES } from "../../integrations/smartsheet/contract.js";

const ROTATION_CYCLE_START = new Date("2026-01-05T00:00:00");
const ROTATION_DAY_MS = 24 * 60 * 60 * 1000;
const ROTATION_WEEK_MS = 7 * ROTATION_DAY_MS;

const REINVENT_BLOCK_LABELS = new Map([
  ["monday + tuesday", "monTue"],
  ["wednesday + thursday", "wedThu"],
  ["friday", "friCarry"],
  ["monday carryover", "monCarry"],
  ["monday carryover from prior friday", "monCarry"],
  ["tuesday + wednesday", "tueWed"],
  ["thursday + friday", "thuFri"],
]);

const CAFE_STATION_CONFIG = {
  Nitro: ["global", "carvery", "grill", "pizza"],
  Doppler: ["global", "salad", "grill", "pizza", "deli"],
  "Day 1": ["global", "noodles", "grill", "salad", "fishMarket", "deli"],
  "Re:Invent": ["fishMarket", "global", "deli", "grill"],
};

const OPTIONAL_STATIONS = {
  Doppler: new Set(["pizza"]),
};

function asText(value) {
  return String(value ?? "").trim();
}

function isSubmitted(value) {
  return asText(value).toLowerCase() === "submitted";
}

function cleanRecord(record = {}) {
  return Object.fromEntries(Object.entries(record).filter(([key]) => !key.startsWith("__")));
}

function weekIndexFromStart(weekStartDate = "") {
  const weekStart = new Date(`${weekStartDate}T00:00:00`);
  if (Number.isNaN(weekStart.getTime())) return 0;
  return Math.max(0, Math.round((weekStart - ROTATION_CYCLE_START) / ROTATION_WEEK_MS));
}

function expectedReInventBlockIds(weekStartDate = "") {
  return weekIndexFromStart(weekStartDate) % 2 === 0
    ? new Set(["monTue", "wedThu", "friCarry"])
    : new Set(["monCarry", "tueWed", "thuFri"]);
}

function recordIdWeek(recordId = "") {
  const parts = asText(recordId).split("|");
  return parts[0] === "rotation" ? parts[1] || "" : "";
}

function blockIdFromRecord(record = {}) {
  const globalBlockId = asText(record[SMARTSHEET_COLUMNS.globalBlockId]);
  const blockFromId = globalBlockId.split("|").filter(Boolean).pop() || "";
  if (blockFromId) return blockFromId;
  const label = asText(record[SMARTSHEET_COLUMNS.menuBlockLabel]).toLowerCase();
  return REINVENT_BLOCK_LABELS.get(label) || label;
}

function issueBase(record = {}) {
  return {
    recordId: asText(record[SMARTSHEET_COLUMNS.recordId]),
    parentRecordId: asText(record[SMARTSHEET_COLUMNS.parentRecordId]),
    recordType: asText(record[SMARTSHEET_COLUMNS.recordType]),
    status: asText(record[SMARTSHEET_COLUMNS.status]) || "Draft",
    district: asText(record[SMARTSHEET_COLUMNS.district]),
    cafe: asText(record[SMARTSHEET_COLUMNS.cafeUnit]),
    weekStartDate: asText(record[SMARTSHEET_COLUMNS.weekStartDate]),
    dateRangeLabel: asText(record[SMARTSHEET_COLUMNS.dateRangeLabel]),
    stationKey: asText(record[SMARTSHEET_COLUMNS.stationKey]),
    menu: asText(record[SMARTSHEET_COLUMNS.menuConcept]),
    item: asText(record[SMARTSHEET_COLUMNS.menuItemSelection]) || asText(record[SMARTSHEET_COLUMNS.uploadedItemName]),
    blockId: blockIdFromRecord(record),
    record: cleanRecord(record),
  };
}

export function buildRotationRecordAudit(records = []) {
  const rotationRecords = records.filter((record) => {
    const recordId = asText(record[SMARTSHEET_COLUMNS.recordId]);
    const recordType = asText(record[SMARTSHEET_COLUMNS.recordType]);
    return recordId.startsWith("rotation|") || recordType === SMARTSHEET_RECORD_TYPES.rotationHeader;
  });

  const recordsById = new Map();
  const duplicateRecordIds = [];
  const headersById = new Map();

  rotationRecords.forEach((record) => {
    const recordId = asText(record[SMARTSHEET_COLUMNS.recordId]);
    if (!recordId) return;
    if (!recordsById.has(recordId)) recordsById.set(recordId, []);
    recordsById.get(recordId).push(record);
    if (asText(record[SMARTSHEET_COLUMNS.recordType]) === SMARTSHEET_RECORD_TYPES.rotationHeader) {
      headersById.set(recordId, record);
    }
  });

  recordsById.forEach((group, recordId) => {
    if (group.length > 1) {
      duplicateRecordIds.push({
        recordId,
        count: group.length,
        rows: group.map(issueBase),
      });
    }
  });

  const statusDriftRows = [];
  const orphanChildRows = [];
  const weekMismatchRows = [];
  const reInventBlockIssues = [];
  const reInventGroups = new Map();

  rotationRecords.forEach((record) => {
    const recordType = asText(record[SMARTSHEET_COLUMNS.recordType]);
    const recordId = asText(record[SMARTSHEET_COLUMNS.recordId]);
    const parentRecordId = asText(record[SMARTSHEET_COLUMNS.parentRecordId]);
    const weekStartDate = asText(record[SMARTSHEET_COLUMNS.weekStartDate]);
    const isHeader = recordType === SMARTSHEET_RECORD_TYPES.rotationHeader;
    const parentHeader = parentRecordId ? headersById.get(parentRecordId) : null;

    if (!isHeader && parentRecordId.startsWith("rotation|") && !parentHeader) {
      orphanChildRows.push(issueBase(record));
    }

    if (!isHeader && parentHeader && isSubmitted(parentHeader[SMARTSHEET_COLUMNS.status]) && !isSubmitted(record[SMARTSHEET_COLUMNS.status])) {
      statusDriftRows.push({
        ...issueBase(record),
        targetStatus: asText(parentHeader[SMARTSHEET_COLUMNS.status]),
        targetSubmittedAt: asText(parentHeader[SMARTSHEET_COLUMNS.submittedAt]),
        targetUpdatedAt: asText(parentHeader[SMARTSHEET_COLUMNS.updatedAt]),
        parentHeader: cleanRecord(parentHeader),
      });
    }

    const idWeek = recordIdWeek(recordId || parentRecordId);
    if (idWeek && weekStartDate && idWeek !== weekStartDate) {
      weekMismatchRows.push({
        ...issueBase(record),
        idWeek,
      });
    }

    if (asText(record[SMARTSHEET_COLUMNS.cafeUnit]) === "Re:Invent" && recordType === SMARTSHEET_RECORD_TYPES.globalSelection) {
      const blockId = blockIdFromRecord(record);
      const expected = expectedReInventBlockIds(weekStartDate);
      if (blockId && !expected.has(blockId)) {
        reInventBlockIssues.push({
          ...issueBase(record),
          expectedBlocks: Array.from(expected),
        });
      }

      const groupKey = parentRecordId || `${weekStartDate}|${asText(record[SMARTSHEET_COLUMNS.district])}|${asText(record[SMARTSHEET_COLUMNS.cafeUnit])}`;
      if (!reInventGroups.has(groupKey)) reInventGroups.set(groupKey, { weekStartDate, blocks: new Set(), rows: [] });
      reInventGroups.get(groupKey).blocks.add(blockId);
      reInventGroups.get(groupKey).rows.push(record);
    }
  });

  const reInventMissingBlocks = Array.from(reInventGroups.entries()).flatMap(([parentRecordId, group]) => {
    const expected = Array.from(expectedReInventBlockIds(group.weekStartDate)).filter((blockId) => blockId !== "monCarry");
    const missing = expected.filter((blockId) => !group.blocks.has(blockId));
    return missing.length ? [{
      parentRecordId,
      weekStartDate: group.weekStartDate,
      missingBlocks: missing,
      expectedBlocks: expected,
    }] : [];
  });

  const summary = {
    rotationRows: rotationRecords.length,
    rotationHeaders: headersById.size,
    duplicateRecordIds: duplicateRecordIds.length,
    duplicateRows: duplicateRecordIds.reduce((sum, group) => sum + group.count, 0),
    statusDriftRows: statusDriftRows.length,
    orphanChildRows: orphanChildRows.length,
    weekMismatchRows: weekMismatchRows.length,
    reInventBlockIssues: reInventBlockIssues.length,
    reInventMissingBlocks: reInventMissingBlocks.length,
    repairableRows: statusDriftRows.length,
  };

  return {
    summary,
    duplicateRecordIds,
    statusDriftRows,
    orphanChildRows,
    weekMismatchRows,
    reInventBlockIssues,
    reInventMissingBlocks,
    hasIssues: Object.entries(summary).some(([key, value]) => key !== "rotationRows" && key !== "rotationHeaders" && Number(value) > 0),
  };
}

export function buildStatusDriftRepairRecords(statusDriftRows = []) {
  return statusDriftRows.map((issue) => ({
    ...issue.record,
    [SMARTSHEET_COLUMNS.status]: issue.targetStatus || "Submitted",
    [SMARTSHEET_COLUMNS.submittedAt]: issue.record[SMARTSHEET_COLUMNS.submittedAt] || issue.targetSubmittedAt || "",
    [SMARTSHEET_COLUMNS.updatedAt]: issue.targetUpdatedAt || issue.targetSubmittedAt || issue.record[SMARTSHEET_COLUMNS.updatedAt] || "",
    [SMARTSHEET_COLUMNS.internalReviewNotes]: [
      asText(issue.record[SMARTSHEET_COLUMNS.internalReviewNotes]),
      "Status drift repaired from Data Health audit.",
    ].filter(Boolean).join(" "),
  }));
}

export function buildCafeRotationReadiness(records = [], options = {}) {
  const audit = buildRotationRecordAudit(records);
  const focusWeekStartDate = asText(options.focusWeekStartDate) || records
    .map((record) => asText(record[SMARTSHEET_COLUMNS.weekStartDate]))
    .filter(Boolean)
    .sort()
    .at(-1) || "";
  const focusCafes = options.focusCafes || ["Doppler", "Re:Invent", "Nitro", "Day 1"];
  const focusRecords = records.filter((record) => asText(record[SMARTSHEET_COLUMNS.weekStartDate]) === focusWeekStartDate);
  const rowsByParent = new Map();
  const headersByCafe = new Map();

  focusRecords.forEach((record) => {
    const recordId = asText(record[SMARTSHEET_COLUMNS.recordId]);
    const parentId = asText(record[SMARTSHEET_COLUMNS.parentRecordId]);
    const recordType = asText(record[SMARTSHEET_COLUMNS.recordType]);
    const cafe = asText(record[SMARTSHEET_COLUMNS.cafeUnit]);
    if (recordType === SMARTSHEET_RECORD_TYPES.rotationHeader) {
      headersByCafe.set(cafe, record);
      if (!rowsByParent.has(recordId)) rowsByParent.set(recordId, []);
      rowsByParent.get(recordId).push(record);
      return;
    }
    if (!parentId) return;
    if (!rowsByParent.has(parentId)) rowsByParent.set(parentId, []);
    rowsByParent.get(parentId).push(record);
  });

  const cafes = focusCafes.map((cafe) => {
    const header = headersByCafe.get(cafe) || null;
    const parentId = header ? asText(header[SMARTSHEET_COLUMNS.recordId]) : "";
    const rows = parentId ? rowsByParent.get(parentId) || [] : [];
    const stationKeys = new Set(rows.map((record) => asText(record[SMARTSHEET_COLUMNS.stationKey])).filter(Boolean));
    const expectedStations = CAFE_STATION_CONFIG[cafe] || [];
    const optionalStations = OPTIONAL_STATIONS[cafe] || new Set();
    const requiredStations = expectedStations.filter((station) => !optionalStations.has(station));
    const missingStations = requiredStations.filter((station) => !stationKeys.has(station));
    const statusDrift = audit.statusDriftRows.filter((issue) => issue.parentRecordId === parentId);
    const duplicateRecords = audit.duplicateRecordIds.filter((issue) => issue.recordId === parentId || rows.some((record) => asText(record[SMARTSHEET_COLUMNS.recordId]) === issue.recordId));
    const reInventIssues = cafe === "Re:Invent"
      ? [
        ...audit.reInventBlockIssues.filter((issue) => issue.parentRecordId === parentId),
        ...audit.reInventMissingBlocks.filter((issue) => issue.parentRecordId === parentId),
      ]
      : [];
    const submitted = header ? isSubmitted(header[SMARTSHEET_COLUMNS.status]) : false;
    const blockers = [];
    const warnings = [];

    if (!header) blockers.push("No saved rotation header for this week.");
    if (header && !submitted) blockers.push("Rotation is not submitted/locked.");
    if (missingStations.length) blockers.push(`Missing required stations: ${missingStations.join(", ")}.`);
    if (reInventIssues.length) blockers.push("Re:Invent cycle blocks do not match the selected week pattern.");
    if (statusDrift.length) warnings.push(`${statusDrift.length} child row${statusDrift.length === 1 ? "" : "s"} still show draft under submitted header.`);
    if (duplicateRecords.length) warnings.push(`${duplicateRecords.length} duplicate record ID group${duplicateRecords.length === 1 ? "" : "s"} detected.`);

    const status = blockers.length ? "needs_review" : warnings.length ? "watch" : "ready";
    return {
      cafe,
      district: header ? asText(header[SMARTSHEET_COLUMNS.district]) : "South",
      weekStartDate: focusWeekStartDate,
      dateRangeLabel: header ? asText(header[SMARTSHEET_COLUMNS.dateRangeLabel]) : "",
      status,
      statusLabel: status === "ready" ? "Ready" : status === "watch" ? "Watch" : "Needs Review",
      submitted,
      expectedStations,
      requiredStations,
      completedStations: requiredStations.filter((station) => stationKeys.has(station)),
      optionalStations: Array.from(optionalStations),
      missingStations,
      blockers,
      warnings,
      rowCount: rows.length,
    };
  });

  const summary = {
    weekStartDate: focusWeekStartDate,
    ready: cafes.filter((row) => row.status === "ready").length,
    watch: cafes.filter((row) => row.status === "watch").length,
    needsReview: cafes.filter((row) => row.status === "needs_review").length,
    total: cafes.length,
  };

  return { summary, cafes };
}
