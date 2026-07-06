import { createHash } from "crypto";

const SMARTSHEET_API_BASE = "https://api.smartsheet.com/2.0";
const TRAFFIC_RECORD_TYPE = "Traffic Daily Visitor";
const TRAFFIC_TIME_ZONE = "America/Los_Angeles";
const TRAFFIC_COLUMNS = {
  recordId: "Record ID",
  recordType: "Record Type",
  status: "Status",
  businessDate: "Business Date",
  dayOfWeek: "Day of Week",
  submittedAt: "Submitted At",
  updatedAt: "Updated At",
  visibleInDashboard: "Visible In Dashboard",
  isTestRecord: "Is Test Record",
  notes: "Notes",
};

async function smartsheetFetch(path, options = {}) {
  const token = process.env.SMARTSHEET_ACCESS_TOKEN;
  if (!token) {
    const error = new Error("Missing SMARTSHEET_ACCESS_TOKEN environment variable");
    error.statusCode = 500;
    throw error;
  }

  const response = await fetch(`${SMARTSHEET_API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  let payload = {};
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { raw: text };
  }

  if (!response.ok) {
    const error = new Error(payload.message || payload.error || `Smartsheet API error ${response.status}`);
    error.statusCode = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

function getSheetId() {
  return process.env.SMARTSHEET_TRAFFIC_SHEET_ID || process.env.SMARTSHEET_SHEET_ID;
}

function columnMapByTitle(sheet) {
  return new Map((sheet.columns || []).map((column) => [column.title, column.id]));
}

function getCellValue(row, columnId) {
  const cell = (row.cells || []).find((entry) => String(entry.columnId) === String(columnId));
  return cell?.displayValue ?? cell?.value ?? "";
}

async function ensureTrafficColumns(sheetId, sheet) {
  let latestSheet = sheet;
  let columnMap = columnMapByTitle(latestSheet);
  const missingColumns = Object.values(TRAFFIC_COLUMNS).filter((title) => !columnMap.has(title));

  for (const title of missingColumns) {
    await smartsheetFetch(`/sheets/${sheetId}/columns`, {
      method: "POST",
      body: JSON.stringify([{
        title,
        type: title === TRAFFIC_COLUMNS.businessDate ? "DATE" : "TEXT_NUMBER",
        index: (latestSheet.columns || []).length,
      }]),
    });
    latestSheet = await smartsheetFetch(`/sheets/${sheetId}`);
    columnMap = columnMapByTitle(latestSheet);
  }

  return { sheet: latestSheet, columnMap, missingColumns };
}

function zonedDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TRAFFIC_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(date).reduce((acc, part) => {
    acc[part.type] = part.value;
    return acc;
  }, {});

  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    dayOfWeek: parts.weekday,
  };
}

function dateAtNoon(dateString) {
  return new Date(`${dateString}T12:00:00`);
}

function addDays(dateString, days) {
  const date = dateAtNoon(dateString);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function getWeekDays(todayString) {
  const date = dateAtNoon(todayString);
  const weekday = date.getUTCDay();
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
  const monday = addDays(todayString, mondayOffset);
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return labels.map((day, index) => ({
    day,
    date: addDays(monday, index),
    visitors: 0,
  }));
}

function buildCells(record, columnMap) {
  return Object.entries(record)
    .filter(([title]) => columnMap.has(title))
    .map(([title, value]) => ({
      columnId: columnMap.get(title),
      value: value === undefined || value === null ? "" : value,
      strict: false,
    }));
}

function hashVisitorId(visitorId) {
  const salt = process.env.ANALYTICS_HASH_SALT || process.env.VERCEL_GIT_COMMIT_SHA || "culinary-tools-platform";
  return createHash("sha256").update(`${salt}:${visitorId}`).digest("hex").slice(0, 24);
}

function isSmokeTestRequest(req, body = {}) {
  const headerValue = String(req.headers["x-culinary-smoke-test"] || "").toLowerCase();
  return headerValue === "true" || body.isSmokeTest === true;
}

function isAutomatedTrafficRow(row, columnMap) {
  const notesColumnId = columnMap.get(TRAFFIC_COLUMNS.notes);
  const notes = String(getCellValue(row, notesColumnId));
  return /HeadlessChrome|Playwright|browser-smoke|smoke-test/i.test(notes);
}

async function loadTrafficSheet() {
  const sheetId = getSheetId();
  if (!sheetId) {
    const error = new Error("Missing SMARTSHEET_TRAFFIC_SHEET_ID or SMARTSHEET_SHEET_ID environment variable");
    error.statusCode = 500;
    throw error;
  }

  const sheet = await smartsheetFetch(`/sheets/${sheetId}`);
  return { sheetId, ...(await ensureTrafficColumns(sheetId, sheet)) };
}

async function recordDailyVisitor(req) {
  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  if (isSmokeTestRequest(req, body)) {
    return { recorded: false, reason: "smoke test traffic ignored" };
  }
  const visitorId = String(body.visitorId || "").trim();
  if (!visitorId || visitorId.length < 12) {
    return { recorded: false, reason: "missing visitor id" };
  }

  const { sheetId, sheet, columnMap } = await loadTrafficSheet();
  const { date, dayOfWeek } = zonedDateParts();
  const visitorHash = hashVisitorId(visitorId);
  const recordId = `traffic|daily-visitor|${date}|${visitorHash}`;
  const recordIdColumnId = columnMap.get(TRAFFIC_COLUMNS.recordId);
  const now = new Date().toISOString();
  const safePath = String(body.path || "/").slice(0, 180);
  const userAgent = String(req.headers["user-agent"] || "").slice(0, 140);

  const existingRow = (sheet.rows || []).find((row) => String(getCellValue(row, recordIdColumnId)) === recordId);
  const record = {
    [TRAFFIC_COLUMNS.recordId]: recordId,
    [TRAFFIC_COLUMNS.recordType]: TRAFFIC_RECORD_TYPE,
    [TRAFFIC_COLUMNS.status]: "Active",
    [TRAFFIC_COLUMNS.businessDate]: date,
    [TRAFFIC_COLUMNS.dayOfWeek]: dayOfWeek,
    [TRAFFIC_COLUMNS.submittedAt]: existingRow ? getCellValue(existingRow, columnMap.get(TRAFFIC_COLUMNS.submittedAt)) || now : now,
    [TRAFFIC_COLUMNS.updatedAt]: now,
    [TRAFFIC_COLUMNS.visibleInDashboard]: "TRUE",
    [TRAFFIC_COLUMNS.isTestRecord]: "FALSE",
    [TRAFFIC_COLUMNS.notes]: `Path: ${safePath}; Browser: ${userAgent}`,
  };

  const row = { cells: buildCells(record, columnMap) };
  if (existingRow) {
    await smartsheetFetch(`/sheets/${sheetId}/rows`, {
      method: "PUT",
      body: JSON.stringify([{ ...row, id: existingRow.id }]),
    });
  } else {
    await smartsheetFetch(`/sheets/${sheetId}/rows`, {
      method: "POST",
      body: JSON.stringify([{ ...row, toBottom: true }]),
    });
  }

  return { recorded: true, date };
}

async function getWeeklyTraffic() {
  const { sheet, columnMap } = await loadTrafficSheet();
  const { date: today } = zonedDateParts();
  const weekDays = getWeekDays(today);
  const weekDates = new Set(weekDays.map((day) => day.date));
  const countsByDate = new Map(weekDays.map((day) => [day.date, new Set()]));
  const recordTypeColumnId = columnMap.get(TRAFFIC_COLUMNS.recordType);
  const recordIdColumnId = columnMap.get(TRAFFIC_COLUMNS.recordId);
  const businessDateColumnId = columnMap.get(TRAFFIC_COLUMNS.businessDate);
  const visibleColumnId = columnMap.get(TRAFFIC_COLUMNS.visibleInDashboard);
  const testColumnId = columnMap.get(TRAFFIC_COLUMNS.isTestRecord);

  for (const row of sheet.rows || []) {
    if (String(getCellValue(row, recordTypeColumnId)) !== TRAFFIC_RECORD_TYPE) continue;
    if (String(getCellValue(row, visibleColumnId)).toUpperCase() === "FALSE") continue;
    if (String(getCellValue(row, testColumnId)).toUpperCase() === "TRUE") continue;
    if (isAutomatedTrafficRow(row, columnMap)) continue;

    const businessDate = String(getCellValue(row, businessDateColumnId)).slice(0, 10);
    if (!weekDates.has(businessDate)) continue;

    const recordId = String(getCellValue(row, recordIdColumnId) || row.id);
    countsByDate.get(businessDate)?.add(recordId);
  }

  const days = weekDays.map((day) => ({
    ...day,
    visitors: countsByDate.get(day.date)?.size || 0,
  }));

  return {
    ok: true,
    status: "live",
    source: "smartsheet-secure-endpoint",
    timeZone: TRAFFIC_TIME_ZONE,
    days,
    totalVisitors: days.reduce((sum, day) => sum + day.visitors, 0),
    generatedAt: new Date().toISOString(),
  };
}

export default async function handler(req, res) {
  const start = Date.now();
  console.log(JSON.stringify({ level: "info", msg: "start", route: "/api/traffic/weekly", method: req.method, requestId: req.headers["x-vercel-id"] }));

  try {
    if (req.method === "POST") {
      const recorded = await recordDailyVisitor(req);
      const weekly = await getWeeklyTraffic();
      console.log(JSON.stringify({ level: "info", msg: "done", route: "/api/traffic/weekly", action: "record", ms: Date.now() - start }));
      return res.status(200).json({ ...weekly, recorded });
    }

    if (req.method === "GET") {
      const weekly = await getWeeklyTraffic();
      console.log(JSON.stringify({ level: "info", msg: "done", route: "/api/traffic/weekly", action: "read", ms: Date.now() - start }));
      return res.status(200).json(weekly);
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  } catch (error) {
    console.error(JSON.stringify({ level: "error", msg: "failed", route: "/api/traffic/weekly", error: error.message, ms: Date.now() - start }));
    return res.status(error.statusCode || 500).json({
      ok: false,
      status: "error",
      message: error.message || "Weekly traffic endpoint failed",
      details: error.payload || null,
    });
  }
}
