const DEFAULT_RETENTION_YEARS = 2;

const COLUMNS = Object.freeze({
  recordId: ["Record ID"],
  parentRecordId: ["Parent Record ID"],
  recordType: ["Record Type"],
  status: ["Status"],
  district: ["District"],
  cafeUnit: ["Café / Unit", "CafÃ© / Unit"],
  dateRangeLabel: ["Date Range Label"],
  stationKey: ["Station Key"],
  submittedAt: ["Submitted At"],
  updatedAt: ["Updated At"],
  visibleInDashboard: ["Visible In Dashboard"],
  isTestRecord: ["Is Test Record"],
});

function firstValue(record, names) {
  for (const name of names) {
    if (record[name] !== undefined && record[name] !== null) return record[name];
  }
  return "";
}

function asText(value) {
  return String(value ?? "").trim();
}

function asBoolean(value, fallback = false) {
  if (value === true || value === false) return value;
  const text = asText(value).toLowerCase();
  if (!text) return fallback;
  return ["true", "yes", "y", "1"].includes(text);
}

export function retentionDateFor(date = new Date(), years = DEFAULT_RETENTION_YEARS) {
  const retained = new Date(date);
  retained.setUTCFullYear(retained.getUTCFullYear() + years);
  return retained;
}

export function getBackboneToolFromContext(context = {}) {
  const text = [context.tool, context.recordType, context.source, context.cafe, context.week]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (text.includes("lean")) return "lean";
  return "rotation";
}

export function buildBackboneRows(records = [], context = {}, options = {}) {
  const now = options.now || new Date();
  const retainUntil = retentionDateFor(now).toISOString();
  const tool = getBackboneToolFromContext(context);

  return records
    .filter((record) => asText(firstValue(record, COLUMNS.recordId)))
    .map((record) => ({
      record_id: asText(firstValue(record, COLUMNS.recordId)),
      parent_record_id: asText(firstValue(record, COLUMNS.parentRecordId)),
      tool,
      record_type: asText(firstValue(record, COLUMNS.recordType)),
      status: asText(firstValue(record, COLUMNS.status)) || "Draft",
      district: asText(firstValue(record, COLUMNS.district)),
      cafe_unit: asText(firstValue(record, COLUMNS.cafeUnit)),
      date_range_label: asText(firstValue(record, COLUMNS.dateRangeLabel)),
      station_key: asText(firstValue(record, COLUMNS.stationKey)),
      submitted_at_text: asText(firstValue(record, COLUMNS.submittedAt)),
      updated_at_text: asText(firstValue(record, COLUMNS.updatedAt)),
      visible_in_dashboard: asBoolean(firstValue(record, COLUMNS.visibleInDashboard), true),
      is_test_record: asBoolean(firstValue(record, COLUMNS.isTestRecord), false),
      source_system: "culinary-tools-app",
      retain_until: retainUntil,
      record_payload: record,
    }));
}

export function normalizeBackboneRows(rows = []) {
  return rows.map((row) => ({
    ...(row.record_payload || {}),
    __supabaseRecordId: row.record_id,
    __supabaseUpdatedAt: row.updated_at || "",
    __supabaseRetainUntil: row.retain_until || "",
  }));
}
