import { createHash } from "crypto";

const DEFAULT_SUPABASE_URL = "https://pzilyzqhatthctgsjwtt.supabase.co";
const TRAFFIC_RECORD_TYPE = "Traffic Daily Visitor";
const TRAFFIC_DATABASE_TOOL = "rotation";
const TRAFFIC_SOURCE_SYSTEM = "culinary-tools-traffic";
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

function cleanUrl(value = "") {
  return String(value || "").trim().replace(/\/+$/, "");
}

function getSupabaseServerConfig() {
  const url = cleanUrl(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL);
  const serviceKey = String(
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    ""
  ).trim();

  return {
    url,
    serviceKey,
    configured: Boolean(url && serviceKey),
  };
}

async function supabaseFetch(path, options = {}) {
  const config = getSupabaseServerConfig();
  if (!config.configured) {
    const error = new Error("Supabase server key is not configured yet.");
    error.statusCode = 503;
    throw error;
  }

  const response = await fetch(`${config.url}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: config.serviceKey,
      Authorization: `Bearer ${config.serviceKey}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = { raw: text };
  }

  if (!response.ok) {
    const error = new Error(payload?.message || payload?.error || `Supabase API error ${response.status}`);
    error.statusCode = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

function queryString(params) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") search.set(key, value);
  });
  return search.toString();
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

function hashVisitorId(visitorId) {
  const salt = process.env.ANALYTICS_HASH_SALT || process.env.VERCEL_GIT_COMMIT_SHA || "culinary-tools-platform";
  return createHash("sha256").update(`${salt}:${visitorId}`).digest("hex").slice(0, 24);
}

function isSmokeTestRequest(req, body = {}) {
  const headerValue = String(req.headers["x-culinary-smoke-test"] || "").toLowerCase();
  return headerValue === "true" || body.isSmokeTest === true;
}

function isAutomatedTrafficRow(payload = {}) {
  const notes = String(payload[TRAFFIC_COLUMNS.notes] || payload.notes || "");
  return /HeadlessChrome|Playwright|browser-smoke|smoke-test|codex-live-traffic-check|codex-release-verify/i.test(notes);
}

function trafficRetainUntilForWeek(businessDate) {
  const weekDays = getWeekDays(businessDate);
  const mondayAfterWeek = addDays(weekDays[6].date, 1);
  return `${mondayAfterWeek}T00:00:00.000Z`;
}

function buildTrafficRecordRow(record) {
  const businessDate = String(record[TRAFFIC_COLUMNS.businessDate] || "");
  return {
    record_id: String(record[TRAFFIC_COLUMNS.recordId] || "").trim(),
    parent_record_id: "",
    tool: TRAFFIC_DATABASE_TOOL,
    record_type: TRAFFIC_RECORD_TYPE,
    status: String(record[TRAFFIC_COLUMNS.status] || "Active"),
    district: "",
    cafe_unit: "",
    date_range_label: String(record[TRAFFIC_COLUMNS.businessDate] || ""),
    station_key: "weekly-traffic",
    submitted_at_text: String(record[TRAFFIC_COLUMNS.submittedAt] || ""),
    updated_at_text: String(record[TRAFFIC_COLUMNS.updatedAt] || ""),
    visible_in_dashboard: String(record[TRAFFIC_COLUMNS.visibleInDashboard] || "TRUE").toUpperCase() !== "FALSE",
    is_test_record: String(record[TRAFFIC_COLUMNS.isTestRecord] || "FALSE").toUpperCase() === "TRUE",
    source_system: TRAFFIC_SOURCE_SYSTEM,
    retain_until: trafficRetainUntilForWeek(businessDate),
    record_payload: record,
  };
}

function normalizeTrafficRow(row = {}) {
  return {
    ...(row.record_payload || {}),
    [TRAFFIC_COLUMNS.recordId]: row.record_id || row.record_payload?.[TRAFFIC_COLUMNS.recordId] || "",
    [TRAFFIC_COLUMNS.businessDate]: row.date_range_label || row.record_payload?.[TRAFFIC_COLUMNS.businessDate] || "",
    [TRAFFIC_COLUMNS.visibleInDashboard]: row.visible_in_dashboard === false ? "FALSE" : "TRUE",
    [TRAFFIC_COLUMNS.isTestRecord]: row.is_test_record === true ? "TRUE" : "FALSE",
  };
}

async function loadAllTrafficRows() {
  const rows = [];
  const pageSize = 1000;
  for (let offset = 0; offset < 25000; offset += pageSize) {
    const page = await supabaseFetch(`app_records?${queryString({
      select: "record_id,date_range_label,visible_in_dashboard,is_test_record,record_payload,updated_at",
      tool: `eq.${TRAFFIC_DATABASE_TOOL}`,
      record_type: `eq.${TRAFFIC_RECORD_TYPE}`,
      order: "updated_at.desc",
      limit: pageSize,
      offset,
    })}`);
    rows.push(...(page || []));
    if (!Array.isArray(page) || page.length < pageSize) break;
  }
  return rows.map(normalizeTrafficRow);
}

async function pruneTrafficOutsideWeek(weekDates) {
  const keepDates = Array.from(weekDates);
  if (!keepDates.length) return { pruned: false };

  await supabaseFetch(`app_records?${queryString({
    tool: `eq.${TRAFFIC_DATABASE_TOOL}`,
    record_type: `eq.${TRAFFIC_RECORD_TYPE}`,
    date_range_label: `not.in.(${keepDates.join(",")})`,
  })}`, {
    method: "DELETE",
    headers: {
      Prefer: "return=minimal",
    },
  });

  return { pruned: true, keepDates };
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

  const { date, dayOfWeek } = zonedDateParts();
  const visitorHash = hashVisitorId(visitorId);
  const recordId = `traffic|daily-visitor|${date}|${visitorHash}`;
  const now = new Date().toISOString();
  const safePath = String(body.path || "/").slice(0, 180);
  const userAgent = String(req.headers["user-agent"] || "").slice(0, 140);
  const existingRows = await supabaseFetch(`app_records?${queryString({
    select: "record_id,record_payload",
    record_id: `eq.${recordId}`,
    limit: "1",
  })}`);
  const existingRecord = Array.isArray(existingRows) && existingRows[0]?.record_payload ? existingRows[0].record_payload : null;
  const record = {
    [TRAFFIC_COLUMNS.recordId]: recordId,
    [TRAFFIC_COLUMNS.recordType]: TRAFFIC_RECORD_TYPE,
    [TRAFFIC_COLUMNS.status]: "Active",
    [TRAFFIC_COLUMNS.businessDate]: date,
    [TRAFFIC_COLUMNS.dayOfWeek]: dayOfWeek,
    [TRAFFIC_COLUMNS.submittedAt]: existingRecord?.[TRAFFIC_COLUMNS.submittedAt] || now,
    [TRAFFIC_COLUMNS.updatedAt]: now,
    [TRAFFIC_COLUMNS.visibleInDashboard]: "TRUE",
    [TRAFFIC_COLUMNS.isTestRecord]: "FALSE",
    [TRAFFIC_COLUMNS.notes]: `Path: ${safePath}; Browser: ${userAgent}`,
  };

  await supabaseFetch("app_records?on_conflict=record_id", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify([buildTrafficRecordRow(record)]),
  });

  return { recorded: true, date };
}

async function getWeeklyTraffic() {
  const { date: today } = zonedDateParts();
  const weekDays = getWeekDays(today);
  const weekDates = new Set(weekDays.map((day) => day.date));
  const countsByDate = new Map(weekDays.map((day) => [day.date, new Set()]));

  await pruneTrafficOutsideWeek(weekDates);
  const rows = await loadAllTrafficRows();
  for (const row of rows) {
    if (String(row[TRAFFIC_COLUMNS.recordType]) !== TRAFFIC_RECORD_TYPE) continue;
    if (String(row[TRAFFIC_COLUMNS.visibleInDashboard]).toUpperCase() === "FALSE") continue;
    if (String(row[TRAFFIC_COLUMNS.isTestRecord]).toUpperCase() === "TRUE") continue;
    if (isAutomatedTrafficRow(row)) continue;

    const businessDate = String(row[TRAFFIC_COLUMNS.businessDate]).slice(0, 10);
    if (!weekDates.has(businessDate)) continue;

    const recordId = String(row[TRAFFIC_COLUMNS.recordId] || "");
    if (recordId) countsByDate.get(businessDate)?.add(recordId);
  }

  const days = weekDays.map((day) => ({
    ...day,
    visitors: countsByDate.get(day.date)?.size || 0,
  }));

  return {
    ok: true,
    status: "live",
    source: "supabase-secure-endpoint",
    timeZone: TRAFFIC_TIME_ZONE,
    days,
    totalVisitors: days.reduce((sum, day) => sum + day.visitors, 0),
    message: "Secure endpoint connected",
    generatedAt: new Date().toISOString(),
  };
}

function fallbackWeeklyTraffic(error) {
  const { date: today } = zonedDateParts();
  const days = getWeekDays(today);
  return {
    ok: true,
    status: "degraded",
    source: "traffic-safe-fallback",
    timeZone: TRAFFIC_TIME_ZONE,
    days,
    totalVisitors: 0,
    message: "Traffic storage is temporarily unavailable; showing a safe zero baseline.",
    storageError: error?.message || "",
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
      console.log(JSON.stringify({ level: "info", msg: "done", route: "/api/traffic/weekly", action: "record", source: weekly.source, ms: Date.now() - start }));
      return res.status(200).json({ ...weekly, recorded });
    }

    if (req.method === "GET") {
      const weekly = await getWeeklyTraffic();
      console.log(JSON.stringify({ level: "info", msg: "done", route: "/api/traffic/weekly", action: "read", source: weekly.source, ms: Date.now() - start }));
      return res.status(200).json(weekly);
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  } catch (error) {
    console.error(JSON.stringify({ level: "error", msg: "failed", route: "/api/traffic/weekly", error: error.message, ms: Date.now() - start }));
    if (req.method === "GET" || req.method === "POST") {
      const weekly = fallbackWeeklyTraffic(error);
      return res.status(200).json({
        ...weekly,
        recorded: req.method === "POST" ? { recorded: false, reason: "traffic storage unavailable" } : undefined,
      });
    }
    return res.status(error.statusCode || 500).json({
      ok: false,
      status: "error",
      message: "Weekly traffic endpoint failed",
      details: error.payload || null,
    });
  }
}
