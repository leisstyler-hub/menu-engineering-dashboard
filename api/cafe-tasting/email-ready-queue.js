const SMARTSHEET_API_BASE = "https://api.smartsheet.com/2.0";
const TARGET_TIME_ZONE = "America/Los_Angeles";
const TARGET_HOURS = new Set([13, 17]);

function localScheduleParts(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TARGET_TIME_ZONE,
    weekday: "short",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  return Object.fromEntries(parts.map(({ type, value }) => [type, value]));
}

export function isScheduledQueueTime(now = new Date()) {
  const { weekday, hour } = localScheduleParts(now);
  return ["Mon", "Tue", "Wed", "Thu", "Fri"].includes(weekday)
    && TARGET_HOURS.has(Number(hour));
}

function getCell(row, columnId) {
  return (row.cells || []).find((cell) => String(cell.columnId) === String(columnId));
}

function hasValue(cell) {
  if (cell?.objectValue?.email) return true;
  if (Array.isArray(cell?.objectValue?.values)) {
    return cell.objectValue.values.some((value) => String(value?.email || value || "").trim());
  }
  return Boolean(String(cell?.displayValue ?? cell?.value ?? "").trim());
}

export function findRowsReadyForEmail(sheet) {
  const columns = new Map((sheet.columns || []).map((column) => [column.title, column.id]));
  const requiredTitles = [
    "Cafe Name", "Dish Name", "Chef Contact", "Director Contact", "Email Ready", "Chef/Director Alert Sent",
  ];
  const missingColumns = requiredTitles.filter((title) => !columns.has(title));
  if (missingColumns.length) {
    const error = new Error(`Cafe Tasting sheet is missing required queue columns: ${missingColumns.join(", ")}`);
    error.statusCode = 500;
    throw error;
  }

  const emailReadyColumnId = columns.get("Email Ready");
  const alertSentColumnId = columns.get("Chef/Director Alert Sent");
  const cafeColumnId = columns.get("Cafe Name");
  const dishColumnId = columns.get("Dish Name");
  const chefColumnId = columns.get("Chef Contact");
  const directorColumnId = columns.get("Director Contact");
  const rows = (sheet.rows || []).filter((row) => {
    if (getCell(row, emailReadyColumnId)?.value === true) return false;
    if (getCell(row, alertSentColumnId)?.value === true) return false;
    if (!hasValue(getCell(row, cafeColumnId)) || !hasValue(getCell(row, dishColumnId))) return false;
    return hasValue(getCell(row, chefColumnId)) || hasValue(getCell(row, directorColumnId));
  });
  return { rows, emailReadyColumnId };
}

async function smartsheetFetch(path, options = {}) {
  const token = process.env.SMARTSHEET_ACCESS_TOKEN;
  if (!token) throw new Error("Missing SMARTSHEET_ACCESS_TOKEN environment variable");
  const response = await fetch(`${SMARTSHEET_API_BASE}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.message || `Smartsheet API error ${response.status}`);
    error.statusCode = response.status;
    throw error;
  }
  return payload;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }
  if (req.headers?.["user-agent"] !== "vercel-cron/1.0") {
    return res.status(401).json({ ok: false, message: "Unauthorized" });
  }
  if (!isScheduledQueueTime(new Date())) {
    return res.status(200).json({ ok: true, scheduledWindow: false, queued: 0 });
  }

  const sheetId = process.env.SMARTSHEET_CAFE_TASTING_SHEET_ID;
  if (!sheetId) return res.status(500).json({ ok: false, message: "Missing SMARTSHEET_CAFE_TASTING_SHEET_ID" });
  try {
    const sheet = await smartsheetFetch(`/sheets/${sheetId}?include=objectValue`);
    const { rows, emailReadyColumnId } = findRowsReadyForEmail(sheet);
    for (let index = 0; index < rows.length; index += 400) {
      const updates = rows.slice(index, index + 400).map((row) => ({
        id: row.id,
        cells: [{ columnId: emailReadyColumnId, value: true, strict: false }],
      }));
      await smartsheetFetch(`/sheets/${sheetId}/rows`, { method: "PUT", body: JSON.stringify(updates) });
    }
    return res.status(200).json({ ok: true, scheduledWindow: true, queued: rows.length });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ ok: false, message: error.message });
  }
}
