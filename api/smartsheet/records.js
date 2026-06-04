// Vercel Serverless Function: /api/smartsheet/records
// Required environment variables:
// - SMARTSHEET_ACCESS_TOKEN
// - SMARTSHEET_SHEET_ID
// Supports:
// - GET: load rows from Smartsheet for app read/Executive View
// - POST action=upsertRecords: add/update rows by Record ID
// Required-column validation is intentionally limited to columns used by the submitted payload,
// so future/optional database fields do not block current Neighborhood Rotation writes.

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
    .filter(([columnName]) => !columnName.startsWith("__") && columnMap.has(columnName))
    .map(([columnName, value]) => ({
      columnId: columnMap.get(columnName),
      value: value === undefined || value === null ? "" : value,
      strict: false,
    }));
}

function rowToRecord(row, columnsById) {
  const record = {};
  for (const cell of row.cells || []) {
    const title = columnsById.get(String(cell.columnId));
    if (!title) continue;
    record[title] = cell.displayValue ?? cell.value ?? "";
  }
  record.__smartsheetRowId = row.id;
  return record;
}

function usedColumnsFromRecords(records = [], recordIdColumn = "Record ID") {
  const used = new Set([recordIdColumn]);
  for (const record of records) {
    for (const [columnName, value] of Object.entries(record || {})) {
      if (columnName.startsWith("__")) continue;
      if (value === undefined || value === null || value === "") continue;
      used.add(columnName);
    }
  }
  return Array.from(used);
}

export default async function handler(req, res) {
  const sheetId = process.env.SMARTSHEET_SHEET_ID;
  if (!sheetId) {
    return res.status(500).json({ ok: false, message: "Missing SMARTSHEET_SHEET_ID environment variable" });
  }

  try {
    if (req.method === "GET") {
      const sheet = await smartsheetFetch(`/sheets/${sheetId}`);
      const columnsById = new Map((sheet.columns || []).map((column) => [String(column.id), column.title]));
      const records = (sheet.rows || []).map((row) => rowToRecord(row, columnsById));

      return res.status(200).json({
        ok: true,
        sheetId,
        sheetName: sheet.name || "",
        columns: (sheet.columns || []).map((column) => column.title),
        records,
        count: records.length,
        message: `Loaded ${records.length} row${records.length === 1 ? "" : "s"} from Smartsheet.`,
      });
    }

    if (req.method !== "POST") {
      res.setHeader("Allow", "GET, POST");
      return res.status(405).json({ ok: false, message: "Method not allowed" });
    }

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

    const requiredForThisPayload = requiredColumns.length
      ? requiredColumns
      : usedColumnsFromRecords(records, recordIdColumn);

    const missingColumns = requiredForThisPayload.filter((columnName) => !columnMap.has(columnName));
    if (missingColumns.length) {
      return res.status(400).json({
        ok: false,
        message: `Smartsheet is missing ${missingColumns.length} required column${missingColumns.length === 1 ? "" : "s"} used by this submission.`,
        missingColumns,
        requiredColumnMode: context.requiredColumnMode || "used-columns-only",
        sheetId,
        sheetName: sheet.name || "",
        availableColumns: (sheet.columns || []).map((column) => column.title),
      });
    }

    const recordIdColumnId = columnMap.get(recordIdColumn);
    if (!recordIdColumnId) {
      return res.status(400).json({
        ok: false,
        message: `Missing required Record ID column: ${recordIdColumn}`,
        missingColumns: [recordIdColumn],
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
      sheetId,
      sheetName: sheet.name || "",
      requiredColumnMode: context.requiredColumnMode || "used-columns-only",
      requiredColumnCount: requiredForThisPayload.length,
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
