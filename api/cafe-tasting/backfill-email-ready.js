const SMARTSHEET_API_BASE = "https://api.smartsheet.com/2.0";

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
  return (row.cells || []).find((cell) => String(cell.columnId) === String(columnId));
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }
  const sheetId = process.env.SMARTSHEET_CAFE_TASTING_SHEET_ID;
  if (!sheetId) return res.status(500).json({ ok: false, message: "Missing SMARTSHEET_CAFE_TASTING_SHEET_ID" });
  try {
    const sheet = await smartsheetFetch(`/sheets/${sheetId}`);
    const columns = new Map((sheet.columns || []).map((column) => [column.title, column.id]));
    const emailReadyColumnId = columns.get("Email Ready");
    const alertSentColumnId = columns.get("Chef/Director Alert Sent");
    if (!emailReadyColumnId || !alertSentColumnId) {
      return res.status(400).json({ ok: false, message: "Required email tracking columns are missing" });
    }
    const rows = (sheet.rows || []).filter((row) =>
      getCell(row, alertSentColumnId)?.value === true && getCell(row, emailReadyColumnId)?.value !== true);
    for (let index = 0; index < rows.length; index += 400) {
      const updates = rows.slice(index, index + 400).map((row) => ({
        id: row.id,
        cells: [{ columnId: emailReadyColumnId, value: true, strict: false }],
      }));
      await smartsheetFetch(`/sheets/${sheetId}/rows`, { method: "PUT", body: JSON.stringify(updates) });
    }
    return res.status(200).json({ ok: true, updatedRows: rows.length, totalRows: (sheet.rows || []).length });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ ok: false, message: error.message });
  }
}
