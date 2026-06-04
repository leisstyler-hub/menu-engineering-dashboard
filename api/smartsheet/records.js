// Vercel Serverless Function: /api/smartsheet/records
// Required environment variables:
// - SMARTSHEET_ACCESS_TOKEN
// - SMARTSHEET_SHEET_ID
// This route upserts rows by the app's "Record ID" column so Save Draft / Submit Rotation can update the same café/week instead of duplicating rows.

const SMARTSHEET_API_BASE = "https://api.smartsheet.com/2.0";

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

function columnMapByTitle(sheet) {
  const map = new Map();
  for (const column of sheet.columns || []) {
    map.set(column.title, column.id);
  }
  return map;
}

function getCellValue(row, columnId) {
  const cell = (row.cells || []).find((entry) => String(entry.columnId) === String(columnId));
  return cell?.displayValue ?? cell?.value ?? "";
}

function buildSmartsheetCells(record, columnMap) {
  return Object.entries(record)
    .filter(([columnName]) => columnMap.has(columnName))
    .map(([columnName, value]) => ({
      columnId: columnMap.get(columnName),
      value: value === undefined || value === null ? "" : value,
      strict: false,
    }));
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }

  const sheetId = process.env.SMARTSHEET_SHEET_ID;
  if (!sheetId) {
    return res.status(500).json({ ok: false, message: "Missing SMARTSHEET_SHEET_ID environment variable" });
  }

  try {
    const {
      action,
      records = [],
      requiredColumns = [],
      recordIdColumn = "Record ID",
      context = {},
    } = req.body || {};

    if (action !== "upsertRecords") {
      return res.status(400).json({ ok: false, message: "Unsupported action" });
    }

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ ok: false, message: "No records supplied" });
    }

    const sheet = await smartsheetFetch(`/sheets/${sheetId}`);
    const columnMap = columnMapByTitle(sheet);

    const missingColumns = requiredColumns.filter((columnName) => !columnMap.has(columnName));
    if (missingColumns.length) {
      return res.status(400).json({
        ok: false,
        message: `Smartsheet is missing ${missingColumns.length} required column${missingColumns.length === 1 ? "" : "s"}.`,
        missingColumns,
      });
    }

    const recordIdColumnId = columnMap.get(recordIdColumn);
    if (!recordIdColumnId) {
      return res.status(400).json({
        ok: false,
        message: `Missing required Record ID column: ${recordIdColumn}`,
      });
    }

    const existingByRecordId = new Map();
    for (const row of sheet.rows || []) {
      const recordId = getCellValue(row, recordIdColumnId);
      if (recordId) existingByRecordId.set(String(recordId), row.id);
    }

    const toUpdate = [];
    const toAdd = [];

    for (const record of records) {
      const recordId = String(record[recordIdColumn] || "");
      if (!recordId) continue;

      const row = { cells: buildSmartsheetCells(record, columnMap) };

      if (existingByRecordId.has(recordId)) {
        toUpdate.push({ ...row, id: existingByRecordId.get(recordId) });
      } else {
        toAdd.push({ ...row, toBottom: true });
      }
    }

    if (toUpdate.length) {
      await smartsheetFetch(`/sheets/${sheetId}/rows`, {
        method: "PUT",
        body: JSON.stringify(toUpdate),
      });
    }

    if (toAdd.length) {
      await smartsheetFetch(`/sheets/${sheetId}/rows`, {
        method: "POST",
        body: JSON.stringify(toAdd),
      });
    }

    return res.status(200).json({
      ok: true,
      action,
      context,
      synced: toUpdate.length + toAdd.length,
      updated: toUpdate.length,
      added: toAdd.length,
      message: `Synced ${toUpdate.length + toAdd.length} row${toUpdate.length + toAdd.length === 1 ? "" : "s"} to Smartsheet.`,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      ok: false,
      message: error.message || "Smartsheet sync failed",
      details: error.payload || null,
    });
  }
}
