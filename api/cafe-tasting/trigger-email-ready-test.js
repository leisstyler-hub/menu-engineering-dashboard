const SMARTSHEET_API_BASE = "https://api.smartsheet.com/2.0";
const APPROVED_TEST_ROW_ID = "8314742691594116";

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

function getCell(row, columnId) {
  return (row.cells || []).find((entry) => String(entry.columnId) === String(columnId));
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }
  const sheetId = process.env.SMARTSHEET_CAFE_TASTING_SHEET_ID;
  if (!sheetId) return res.status(500).json({ ok: false, message: "Missing SMARTSHEET_CAFE_TASTING_SHEET_ID" });
  try {
    const sheet = await smartsheetFetch(`/sheets/${sheetId}?include=objectValue`);
    const columns = new Map((sheet.columns || []).map((column) => [column.title, column.id]));
    const required = ["Dish Name", "Email Ready", "Chef/Director Alert Sent"];
    const missingColumns = required.filter((title) => !columns.has(title));
    if (missingColumns.length) return res.status(400).json({ ok: false, message: "Missing test columns", missingColumns });
    const row = (sheet.rows || []).find((entry) => String(entry.id) === APPROVED_TEST_ROW_ID);
    const dishName = String(getCell(row, columns.get("Dish Name"))?.displayValue || getCell(row, columns.get("Dish Name"))?.value || "");
    const emailReady = getCell(row, columns.get("Email Ready"))?.value === true;
    const alertSent = getCell(row, columns.get("Chef/Director Alert Sent"))?.value === true;
    if (!dishName.startsWith("DIRECT EMAIL TEST ") || emailReady || !alertSent) {
      return res.status(409).json({ ok: false, message: "The approved test row is not in its one-time trigger state" });
    }
    await smartsheetFetch(`/sheets/${sheetId}/rows`, {
      method: "PUT",
      body: JSON.stringify([{
        id: row.id,
        cells: [
          { columnId: columns.get("Chef/Director Alert Sent"), value: false, strict: false },
          { columnId: columns.get("Email Ready"), value: true, strict: false },
        ],
      }]),
    });
    return res.status(200).json({ ok: true, rowId: row.id });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ ok: false, message: error.message });
  }
}
