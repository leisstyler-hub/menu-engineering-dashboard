import { REQUIRED_SMARTSHEET_COLUMNS_FOR_CURRENT_BUILD, SMARTSHEET_COLUMNS } from "./contract.js";

export function missingRequiredDatabaseColumns(availableColumns = []) {
  const available = new Set(availableColumns);
  return REQUIRED_SMARTSHEET_COLUMNS_FOR_CURRENT_BUILD.filter((column) => !available.has(column));
}

export function getColumnsUsedByRecords(records = []) {
  const used = new Set([SMARTSHEET_COLUMNS.recordId]);
  records.forEach((record) => {
    Object.entries(record || {}).forEach(([columnName, value]) => {
      if (columnName.startsWith("__")) return;
      if (value === undefined || value === null || value === "") return;
      used.add(columnName);
    });
  });
  return Array.from(used);
}

export async function syncRecordsToSmartsheet(records = [], context = {}) {
  const requiredColumns = getColumnsUsedByRecords(records);
  const response = await fetch("/api/smartsheet/records", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "upsertRecords",
      records,
      requiredColumns,
      recordIdColumn: SMARTSHEET_COLUMNS.recordId,
      context: { ...context, requiredColumnMode: "used-columns-only", requiredColumnCount: requiredColumns.length },
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.ok === false) {
    const error = new Error(payload.message || "Smartsheet sync failed");
    error.payload = payload;
    throw error;
  }
  return payload;
}

export async function loadRecordsFromSmartsheet(context = {}) {
  const params = new URLSearchParams();
  if (context.tool) params.set("tool", context.tool);
  const response = await fetch(`/api/smartsheet/records${params.toString() ? `?${params.toString()}` : ""}`);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.ok === false) {
    const error = new Error(payload.message || "Smartsheet load failed");
    error.payload = payload;
    throw error;
  }
  return Array.isArray(payload.records) ? payload.records : [];
}

export async function loadSmartsheetHealth(context = {}) {
  const params = new URLSearchParams();
  if (context.tool) params.set("tool", context.tool);
  const response = await fetch(`/api/smartsheet/records${params.toString() ? `?${params.toString()}` : ""}`);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.ok === false) {
    const error = new Error(payload.message || "Smartsheet health check failed");
    error.payload = payload;
    throw error;
  }
  return payload;
}

