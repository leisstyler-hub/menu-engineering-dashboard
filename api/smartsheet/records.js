// Vercel Serverless Function: /api/smartsheet/records
// Required environment variables:
// - SMARTSHEET_ACCESS_TOKEN
// - SMARTSHEET_SHEET_ID
// - SMARTSHEET_CAFE_TASTING_SHEET_ID (read-only Cafe Tasting access)
// - SMARTSHEET_CAFE_TASTING_ROUTING_SHEET_ID (read-only routing-table access)
// Supports:
// - GET: load rows from Smartsheet for app read/Executive View
// - POST action=upsertRecords: add/update rows by Record ID
// - POST action=ensureColumns: add missing expected columns without creating rows
// - POST action=deleteEmptyColumns: remove named columns only when every row is blank
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

function tastingCell(column, value) {
  if (column.type === "MULTI_PICKLIST" || (column.type === "PICKLIST" && column.version === 2)) {
    const values = Array.isArray(value) ? value : [value];
    return {
      columnId: column.id,
      objectValue: { objectType: "MULTI_PICKLIST", values: values.filter((entry) => String(entry ?? "").trim()) },
    };
  }

  if (column.type === "MULTI_CONTACT_LIST" || (column.type === "CONTACT_LIST" && column.version === 2)) {
    const values = (Array.isArray(value) ? value : [value])
      .map((entry) => String(entry ?? "").trim())
      .filter(Boolean)
      .map((email) => ({ objectType: "CONTACT", email }));
    return {
      columnId: column.id,
      objectValue: { objectType: "MULTI_CONTACT_LIST", values },
    };
  }

  return { columnId: column.id, value: value ?? "", strict: false };
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

async function addMissingColumns(sheetId, sheet, missingColumns = []) {
  if (!missingColumns.length) return sheet;
  let latestSheet = sheet;
  for (const title of missingColumns) {
    await smartsheetFetch(`/sheets/${sheetId}/columns`, {
      method: "POST",
      body: JSON.stringify([{
        title,
        type: "TEXT_NUMBER",
        index: (latestSheet.columns || []).length,
      }]),
    });
    latestSheet = await smartsheetFetch(`/sheets/${sheetId}`);
  }

  return latestSheet;
}

async function deleteEmptyColumnsByTitle(sheetId, sheet, columnTitles = []) {
  const deletedColumns = [];
  const skippedColumns = [];
  let latestSheet = sheet;

  for (const title of columnTitles) {
    const column = (latestSheet.columns || []).find((entry) => entry.title === title);
    if (!column) {
      skippedColumns.push({ title, reason: "not found" });
      continue;
    }

    const hasValues = (latestSheet.rows || []).some((row) => String(getCellValue(row, column.id) || "").trim() !== "");
    if (hasValues) {
      skippedColumns.push({ title, reason: "column has data" });
      continue;
    }

    await smartsheetFetch(`/sheets/${sheetId}/columns/${column.id}`, {
      method: "DELETE",
    });
    deletedColumns.push(title);
    latestSheet = await smartsheetFetch(`/sheets/${sheetId}`);
  }

  return { sheet: latestSheet, deletedColumns, skippedColumns };
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

function dedupeRecordsByRecordId(records = [], recordIdColumn = "Record ID") {
  const byRecordId = new Map();
  for (const record of records) {
    const recordId = String(record?.[recordIdColumn] || "").trim();
    if (!recordId) continue;
    byRecordId.set(recordId, record);
  }
  return Array.from(byRecordId.values());
}

async function deleteRowsByRecordFamily(sheetId, sheet, recordIds = [], recordIdColumn = "Record ID") {
  const columnMap = columnMapByTitle(sheet);
  const recordIdColumnId = columnMap.get(recordIdColumn);
  if (!recordIdColumnId) {
    const error = new Error(`Missing required Record ID column: ${recordIdColumn}`);
    error.statusCode = 400;
    error.payload = { missingColumns: [recordIdColumn] };
    throw error;
  }

  const parentRecordIdColumnId = columnMap.get("Parent Record ID");
  const requestedIds = new Set(recordIds.map(String).filter(Boolean));
  const rowsToDelete = [];

  for (const row of sheet.rows || []) {
    const recordId = String(getCellValue(row, recordIdColumnId) || "");
    const parentId = parentRecordIdColumnId ? String(getCellValue(row, parentRecordIdColumnId) || "") : "";
    if (requestedIds.has(recordId) || requestedIds.has(parentId)) {
      rowsToDelete.push(row.id);
    }
  }

  for (let index = 0; index < rowsToDelete.length; index += 400) {
    const chunk = rowsToDelete.slice(index, index + 400);
    await smartsheetFetch(`/sheets/${sheetId}/rows?ids=${chunk.join(",")}`, {
      method: "DELETE",
    });
  }

  return rowsToDelete.length;
}

export default async function handler(req, res) {
  const requestedTool = req.query?.tool || req.body?.context?.tool || "";
  const requestedDataset = String(req.query?.dataset || "").trim().toLowerCase();
  const useCafeTastingSheet = requestedDataset === "cafe-tasting";
  const useCafeTastingRoutingSheet = requestedDataset === "cafe-tasting-routing";
  const useLeanSheet = String(requestedTool).toLowerCase().includes("lean") && process.env.SMARTSHEET_LEAN_SHEET_ID;
  const sheetId = useCafeTastingRoutingSheet
    ? process.env.SMARTSHEET_CAFE_TASTING_ROUTING_SHEET_ID
    : useCafeTastingSheet
      ? process.env.SMARTSHEET_CAFE_TASTING_SHEET_ID
    : useLeanSheet
      ? process.env.SMARTSHEET_LEAN_SHEET_ID
      : process.env.SMARTSHEET_SHEET_ID;
  if (!sheetId) {
    const missingVariable = useCafeTastingRoutingSheet
      ? "SMARTSHEET_CAFE_TASTING_ROUTING_SHEET_ID"
      : useCafeTastingSheet
        ? "SMARTSHEET_CAFE_TASTING_SHEET_ID"
      : useLeanSheet
        ? "SMARTSHEET_LEAN_SHEET_ID"
        : "SMARTSHEET_SHEET_ID";
    return res.status(500).json({ ok: false, message: `Missing ${missingVariable} environment variable` });
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
        columnDetails: (sheet.columns || []).map(({ id, title, type, version, systemColumnType }) => ({ id, title, type, version, systemColumnType })),
        records,
        count: records.length,
        message: `Loaded ${records.length} row${records.length === 1 ? "" : "s"} from Smartsheet.`,
      });
    }

    if (useCafeTastingRoutingSheet && req.method === "POST") {
      const { action, cafe = "", chefContact = "", directorContact = "" } = req.body || {};
      if (action !== "addRoutingRoute") {
        return res.status(400).json({ ok: false, message: "Unsupported routing-table action" });
      }

      const normalizedCafe = String(cafe).trim();
      const normalizedChefContact = String(chefContact).trim();
      const normalizedDirectorContact = String(directorContact).trim();
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!normalizedCafe) {
        return res.status(400).json({ ok: false, message: "Cafe is required" });
      }
      if (normalizedChefContact && !emailPattern.test(normalizedChefContact)) {
        return res.status(400).json({ ok: false, message: "Chef Contact must be a valid email address" });
      }
      if (normalizedDirectorContact && !emailPattern.test(normalizedDirectorContact)) {
        return res.status(400).json({ ok: false, message: "Director Contact must be a valid email address" });
      }

      const routingSheet = await smartsheetFetch(`/sheets/${sheetId}`);
      const routingColumns = columnMapByTitle(routingSheet);
      const requiredRoutingColumns = ["Cafe", "Chef Contact", "Director Contact"];
      const missingRoutingColumns = requiredRoutingColumns.filter((title) => !routingColumns.has(title));
      if (missingRoutingColumns.length) {
        return res.status(400).json({ ok: false, message: "Routing table is missing required columns", missingColumns: missingRoutingColumns });
      }

      const cafeColumnId = routingColumns.get("Cafe");
      const duplicate = (routingSheet.rows || []).some((row) => String(getCellValue(row, cafeColumnId)).trim().toLowerCase() === normalizedCafe.toLowerCase());
      if (duplicate) {
        return res.status(409).json({ ok: false, message: `Routing already exists for ${normalizedCafe}` });
      }

      const created = await smartsheetFetch(`/sheets/${sheetId}/rows`, {
        method: "POST",
        body: JSON.stringify([{ toBottom: true, cells: [
          { columnId: cafeColumnId, value: normalizedCafe, strict: false },
          { columnId: routingColumns.get("Chef Contact"), value: normalizedChefContact, strict: false },
          { columnId: routingColumns.get("Director Contact"), value: normalizedDirectorContact, strict: false },
        ] }]),
      });

      return res.status(201).json({
        ok: true,
        action,
        sheetId,
        cafe: normalizedCafe,
        chefContact: normalizedChefContact,
        directorContact: normalizedDirectorContact,
        rowId: created?.result?.[0]?.id || created?.[0]?.id || null,
        message: `Added routing row for ${normalizedCafe}.`,
      });
    }

    if (useCafeTastingSheet && req.method === "POST") {
      const { action, record = {} } = req.body || {};
      if (action !== "addTastingSubmission") {
        return res.status(400).json({ ok: false, message: "Unsupported Cafe Tasting action" });
      }

      const allowedColumns = [
        "Date", "Cafe Name", "Station Name", "Dish Name", "Taster",
        "1. Plate Appeal", "1. Plate Arrangement", "1. Plate Edges", "1. Garnish", "1. Plating Notes",
        "2.Target_Portion", "2.Actual_Portion", "2. Protein Portion", "2. Side 1 Portion", "2. Side 2 Portion", "2. Sauce Portion", "2. Portion Notes",
        "3. Temperature", "3. Doneness", "3. Seasoning", "3. Flavor Balance", "3. Texture", "3. Overall Taste", "3. Taste Notes",
        "4. Cooking Method", "4. Ingredients", "4. Correct Sides", "4. Substitutions", "4. Recipe Notes",
        "5. Strengths", "5. Opportunities",
      ];
      const requiredColumns = ["Date", "Cafe Name", "Station Name", "Dish Name", "Taster"];
      const normalizedRecord = Object.fromEntries(allowedColumns
        .filter((columnName) => Object.hasOwn(record, columnName))
        .map((columnName) => [columnName, record[columnName]]));
      const missingValues = requiredColumns.filter((columnName) => !String(normalizedRecord[columnName] ?? "").trim());
      if (missingValues.length) {
        return res.status(400).json({ ok: false, message: "Missing required tasting values", missingColumns: missingValues });
      }

      const tastingSheet = await smartsheetFetch(`/sheets/${sheetId}?include=objectValue`);
      const tastingColumns = columnMapByTitle(tastingSheet);
      const tastingColumnDefinitions = new Map((tastingSheet.columns || []).map((column) => [column.title, column]));
      const missingColumns = Object.keys(normalizedRecord).filter((columnName) => !tastingColumns.has(columnName));
      if (missingColumns.length) {
        return res.status(400).json({ ok: false, message: "Cafe Tasting sheet is missing submitted columns", missingColumns });
      }

      const cafeColumnId = tastingColumns.get("Cafe Name");
      const dishColumnId = tastingColumns.get("Dish Name");
      const duplicate = (tastingSheet.rows || []).some((row) =>
        String(getCellValue(row, cafeColumnId)).trim().toLowerCase() === String(normalizedRecord["Cafe Name"]).trim().toLowerCase()
        && String(getCellValue(row, dishColumnId)).trim().toLowerCase() === String(normalizedRecord["Dish Name"]).trim().toLowerCase());
      if (duplicate) {
        return res.status(409).json({ ok: false, message: "This Cafe Tasting test submission already exists" });
      }

      const cells = Object.entries(normalizedRecord).map(([columnName, value]) =>
        tastingCell(tastingColumnDefinitions.get(columnName), value));
      const created = await smartsheetFetch(`/sheets/${sheetId}/rows`, {
        method: "POST",
        body: JSON.stringify([{ toBottom: true, cells }]),
      });

      return res.status(201).json({
        ok: true,
        action,
        sheetId,
        cafe: normalizedRecord["Cafe Name"],
        dish: normalizedRecord["Dish Name"],
        rowId: created?.result?.[0]?.id || created?.[0]?.id || null,
        message: `Added Cafe Tasting submission for ${normalizedRecord["Cafe Name"]}.`,
      });
    }

    if (useCafeTastingSheet || useCafeTastingRoutingSheet) {
      res.setHeader("Allow", "GET");
      return res.status(405).json({ ok: false, message: "Cafe Tasting access is read-only" });
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

    let sheet = await smartsheetFetch(`/sheets/${sheetId}`);
    let columnMap = columnMapByTitle(sheet);

    if (action === "ensureColumns") {
      if (!Array.isArray(requiredColumns) || requiredColumns.length === 0) {
        return res.status(400).json({ ok: false, message: "No columns supplied for repair" });
      }

      const missingColumns = requiredColumns.filter((columnName) => !columnMap.has(columnName));
      if (missingColumns.length) {
        sheet = await addMissingColumns(sheetId, sheet, missingColumns);
        columnMap = columnMapByTitle(sheet);
      }

      return res.status(200).json({
        ok: true,
        action,
        context,
        sheetId,
        sheetName: sheet.name || "",
        autoCreatedColumns: missingColumns,
        columns: (sheet.columns || []).map((column) => column.title),
        columnDetails: (sheet.columns || []).map(({ id, title, type, version, systemColumnType }) => ({ id, title, type, version, systemColumnType })),
        message: missingColumns.length
          ? `Added ${missingColumns.length} missing Smartsheet column${missingColumns.length === 1 ? "" : "s"}.`
          : "Smartsheet already has the expected columns.",
      });
    }

    if (action === "deleteEmptyColumns") {
      const columnTitles = Array.isArray(req.body?.columnTitles) ? req.body.columnTitles : [];
      if (!columnTitles.length) {
        return res.status(400).json({ ok: false, message: "No column titles supplied for cleanup" });
      }

      const cleanup = await deleteEmptyColumnsByTitle(sheetId, sheet, columnTitles);
      sheet = cleanup.sheet;

      return res.status(200).json({
        ok: true,
        action,
        context,
        sheetId,
        sheetName: sheet.name || "",
        deletedColumns: cleanup.deletedColumns,
        skippedColumns: cleanup.skippedColumns,
        columns: (sheet.columns || []).map((column) => column.title),
        columnDetails: (sheet.columns || []).map(({ id, title, type, version, systemColumnType }) => ({ id, title, type, version, systemColumnType })),
        message: cleanup.deletedColumns.length
          ? `Deleted ${cleanup.deletedColumns.length} empty Smartsheet column${cleanup.deletedColumns.length === 1 ? "" : "s"}.`
          : "No empty Smartsheet columns were deleted.",
      });
    }

    if (action === "deleteRecords") {
      const recordIds = Array.isArray(req.body?.recordIds) ? req.body.recordIds.map(String).filter(Boolean) : [];
      if (!recordIds.length) {
        return res.status(400).json({ ok: false, message: "No record IDs supplied for delete" });
      }

      const deleted = await deleteRowsByRecordFamily(sheetId, sheet, recordIds, recordIdColumn);
      return res.status(200).json({
        ok: true,
        action,
        context,
        sheetId,
        sheetName: sheet.name || "",
        requested: recordIds.length,
        deleted,
        message: `Deleted ${deleted} Smartsheet row${deleted === 1 ? "" : "s"} for ${recordIds.length} requested record${recordIds.length === 1 ? "" : "s"}.`,
      });
    }

    if (action !== "upsertRecords") {
      return res.status(400).json({ ok: false, message: "Unsupported action" });
    }

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ ok: false, message: "No records supplied" });
    }

    const uniqueRecords = dedupeRecordsByRecordId(records, recordIdColumn);
    if (!uniqueRecords.length) {
      return res.status(400).json({ ok: false, message: "No records supplied with a Record ID" });
    }
    const duplicateRowsSkipped = records.length - uniqueRecords.length;

    const requiredForThisPayload = requiredColumns.length
      ? requiredColumns
      : usedColumnsFromRecords(uniqueRecords, recordIdColumn);

    const missingColumns = requiredForThisPayload.filter((columnName) => !columnMap.has(columnName));
    if (missingColumns.length) {
      if (context.autoCreateMissingColumns) {
        sheet = await addMissingColumns(sheetId, sheet, missingColumns);
        columnMap = columnMapByTitle(sheet);
      } else {
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

    const nextRecordIds = new Set(uniqueRecords.map((record) => String(record[recordIdColumn] || "")).filter(Boolean));
    const replaceParentRecordIds = new Set((Array.isArray(context.replaceParentRecordIds) ? context.replaceParentRecordIds : []).map(String).filter(Boolean));
    const parentRecordIdColumnId = columnMap.get("Parent Record ID");
    const rowsToDelete = [];
    if (replaceParentRecordIds.size && parentRecordIdColumnId) {
      for (const row of sheet.rows || []) {
        const recordId = String(getCellValue(row, recordIdColumnId) || "");
        const parentId = String(getCellValue(row, parentRecordIdColumnId) || "");
        const belongsToReplaceParent = replaceParentRecordIds.has(recordId) || replaceParentRecordIds.has(parentId);
        if (belongsToReplaceParent && !nextRecordIds.has(recordId)) {
          rowsToDelete.push(row.id);
        }
      }
    }

    if (rowsToDelete.length) {
      for (let index = 0; index < rowsToDelete.length; index += 400) {
        const chunk = rowsToDelete.slice(index, index + 400);
        await smartsheetFetch(`/sheets/${sheetId}/rows?ids=${chunk.join(",")}`, {
          method: "DELETE",
        });
      }
    }

    const toUpdate = [];
    const toAdd = [];

    for (const record of uniqueRecords) {
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
      autoCreatedColumns: missingColumns.length && context.autoCreateMissingColumns ? missingColumns : [],
      synced: toUpdate.length + toAdd.length,
      updated: toUpdate.length,
      added: toAdd.length,
      duplicateRowsSkipped,
      deletedStale: rowsToDelete.length,
      message: `Synced ${toUpdate.length + toAdd.length} row${toUpdate.length + toAdd.length === 1 ? "" : "s"} to Smartsheet${duplicateRowsSkipped ? ` after skipping ${duplicateRowsSkipped} duplicate row instance${duplicateRowsSkipped === 1 ? "" : "s"}` : ""}${rowsToDelete.length ? ` and removed ${rowsToDelete.length} stale row${rowsToDelete.length === 1 ? "" : "s"}` : ""}.`,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      ok: false,
      message: error.message || "Smartsheet sync failed",
      details: error.payload || null,
    });
  }
}
