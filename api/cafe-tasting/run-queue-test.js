import { findRowsReadyForEmail } from "./email-ready-queue.js";

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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }
  const sheetId = process.env.SMARTSHEET_CAFE_TASTING_SHEET_ID;
  if (!sheetId) return res.status(500).json({ ok: false, message: "Missing SMARTSHEET_CAFE_TASTING_SHEET_ID" });
  try {
    const sheet = await smartsheetFetch(`/sheets/${sheetId}?include=objectValue`);
    const { rows, emailReadyColumnId } = findRowsReadyForEmail(sheet);
    if (rows.length !== 1) {
      return res.status(409).json({ ok: false, eligibleRows: rows.length, message: "The controlled queue test requires exactly one eligible row" });
    }
    await smartsheetFetch(`/sheets/${sheetId}/rows`, {
      method: "PUT",
      body: JSON.stringify([{ id: rows[0].id, cells: [{ columnId: emailReadyColumnId, value: true, strict: false }] }]),
    });
    return res.status(200).json({ ok: true, queued: 1, rowId: rows[0].id });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ ok: false, message: error.message });
  }
}
