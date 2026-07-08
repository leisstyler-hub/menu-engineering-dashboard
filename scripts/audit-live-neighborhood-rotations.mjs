const LIVE_URL = process.env.ROTATION_AUDIT_URL || "https://project-d8v25.vercel.app";

const columns = {
  recordId: "Record ID",
  parentRecordId: "Parent Record ID",
  recordType: "Record Type",
  status: "Status",
  district: "District",
  cafe: "Caf\u00e9 / Unit",
  weekStart: "Week Start Date",
  weekEnd: "Week End Date",
  weekLabel: "Date Range Label",
  stationKey: "Station Key",
  selectionType: "Selection Type",
  itemName: "Menu Item / Selection",
  menu: "Menu / Concept",
  blockId: "Global Block ID",
  blockLabel: "Menu Block Label",
  submittedAt: "Submitted At",
  updatedAt: "Updated At",
};

const rotationHeader = "Rotation Header";
const splitCafes = new Set(["Re:Invent", "Blueshift"]);
const splitCycleStarts = {
  "Re:Invent": "2026-07-06",
  Blueshift: "2026-07-06",
};
const reInventClosedWeeks = new Set(["2026-06-29"]);
const validSplitBlocks = new Set(["monTue", "wedThu", "friCarry", "monCarry", "tueWed", "thuFri", "friClosed"]);

function parseDateKey(value = "") {
  const raw = String(value || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
}

function mondayFor(date = new Date()) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  return copy;
}

function addDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function dateKey(date) {
  return date.toISOString().slice(0, 10);
}

function expectedSplitBlocks(cafe, weekStart) {
  if (cafe === "Re:Invent" && reInventClosedWeeks.has(weekStart)) return new Set(["monTue", "wedThu", "friClosed"]);
  const anchor = splitCycleStarts[cafe];
  if (!anchor) return new Set();
  const diffWeeks = Math.max(0, Math.round((new Date(`${weekStart}T00:00:00`) - new Date(`${anchor}T00:00:00`)) / (7 * 24 * 60 * 60 * 1000)));
  return diffWeeks % 2 === 0
    ? new Set(["monTue", "wedThu", "friCarry"])
    : new Set(["monCarry", "tueWed", "thuFri"]);
}

function blockIdFromRecord(record) {
  const raw = String(record[columns.blockId] || record[columns.blockLabel] || record[columns.recordId] || "");
  const candidate = raw.split("|").filter(Boolean).pop() || "";
  const labelMap = {
    "Monday + Tuesday": "monTue",
    "Wednesday + Thursday": "wedThu",
    Friday: "friCarry",
    Monday: "monCarry",
    "Tuesday + Wednesday": "tueWed",
    "Thursday + Friday": "thuFri",
    "Friday Closed": "friClosed",
  };
  return validSplitBlocks.has(candidate) ? candidate : labelMap[String(record[columns.blockLabel] || "")] || "";
}

function parentIdFor(record) {
  const ownId = String(record[columns.recordId] || "");
  return String(record[columns.parentRecordId] || (ownId.startsWith("rotation|") ? ownId.split("|").slice(0, 4).join("|") : ""));
}

function isSubmitted(record) {
  return String(record[columns.status] || "").toLowerCase() === "submitted";
}

async function loadRecords() {
  const response = await fetch(`${LIVE_URL}/api/storage/records?tool=rotation&includeHidden=1`, {
    headers: { "user-agent": "culinary-tools-rotation-audit" },
  });
  if (!response.ok) throw new Error(`Live rotation read failed: HTTP ${response.status}`);
  const payload = await response.json();
  if (!payload.ok) throw new Error(payload.message || "Live rotation read failed.");
  return payload.records || [];
}

const records = await loadRecords();
const currentWeek = dateKey(mondayFor(new Date()));
const nextWeek = dateKey(addDays(mondayFor(new Date()), 7));
const futureRecords = records.filter((record) => parseDateKey(record[columns.weekStart]) >= currentWeek);
const southNextRecords = records.filter((record) => record[columns.district] === "South" && parseDateKey(record[columns.weekStart]) === nextWeek);

const byRecordId = new Map();
records.forEach((record) => {
  const id = String(record[columns.recordId] || "");
  if (!id) return;
  const list = byRecordId.get(id) || [];
  list.push(record);
  byRecordId.set(id, list);
});

const headersByParent = new Map();
records
  .filter((record) => record[columns.recordType] === rotationHeader)
  .forEach((record) => headersByParent.set(String(record[columns.recordId] || ""), record));

const futureIssues = [];
futureRecords.forEach((record) => {
  const recordType = record[columns.recordType];
  const parentId = parentIdFor(record);
  const header = headersByParent.get(parentId);
  if (recordType !== rotationHeader && !header) {
    futureIssues.push({ type: "missing-header", cafe: record[columns.cafe], week: record[columns.weekLabel], recordId: record[columns.recordId] });
  }
  if (recordType !== rotationHeader && header && isSubmitted(header) && !isSubmitted(record)) {
    futureIssues.push({ type: "status-drift", cafe: record[columns.cafe], week: record[columns.weekLabel], recordId: record[columns.recordId] });
  }
});

const splitIssues = [];
futureRecords
  .filter((record) => splitCafes.has(record[columns.cafe]) && record[columns.stationKey] === "global")
  .forEach((record) => {
    const weekStart = parseDateKey(record[columns.weekStart]);
    const expected = expectedSplitBlocks(record[columns.cafe], weekStart);
    const blockId = blockIdFromRecord(record);
    if (blockId && expected.size && !expected.has(blockId)) {
      splitIssues.push({
        type: "wrong-split-block",
        cafe: record[columns.cafe],
        week: record[columns.weekLabel],
        blockId,
        expected: Array.from(expected).join(", "),
        recordId: record[columns.recordId],
      });
    }
  });

const submittedFamilies = Array.from(headersByParent.values()).filter((record) => isSubmitted(record));
const futureSubmittedFamilies = submittedFamilies.filter((record) => parseDateKey(record[columns.weekStart]) >= currentWeek);
const duplicateIds = Array.from(byRecordId.entries()).filter(([, rows]) => rows.length > 1).map(([id, rows]) => ({ id, count: rows.length }));
const southNextHeaders = southNextRecords.filter((record) => record[columns.recordType] === rotationHeader);
const southNextSubmitted = southNextHeaders.filter(isSubmitted);

console.log(JSON.stringify({
  liveUrl: LIVE_URL,
  currentWeek,
  nextWeek,
  totals: {
    records: records.length,
    futureRecords: futureRecords.length,
    futureSubmittedFamilies: futureSubmittedFamilies.length,
    duplicateRecordIds: duplicateIds.length,
    futureIssues: futureIssues.length,
    futureSplitIssues: splitIssues.length,
    southNextRecords: southNextRecords.length,
    southNextHeaders: southNextHeaders.length,
    southNextSubmittedHeaders: southNextSubmitted.length,
  },
  southNext: southNextHeaders.map((record) => ({
    cafe: record[columns.cafe],
    status: record[columns.status],
    submittedAt: record[columns.submittedAt],
    updatedAt: record[columns.updatedAt],
    savedEntryCount: record["Saved Entry Count"],
    menu: record[columns.menu],
  })),
  duplicateIds: duplicateIds.slice(0, 20),
  futureIssues: futureIssues.slice(0, 40),
  splitIssues: splitIssues.slice(0, 40),
}, null, 2));
