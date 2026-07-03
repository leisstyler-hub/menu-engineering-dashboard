import { loadRecordsFromSmartsheet, syncRecordsToSmartsheet } from "../smartsheet/client.js";
import { SMARTSHEET_COLUMNS } from "../smartsheet/contract.js";

async function readJson(response) {
  return response.json().catch(() => ({}));
}

async function syncRecordsToSupabase(records = [], context = {}) {
  const response = await fetch("/api/storage/records", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "upsertRecords",
      records,
      context,
    }),
  });
  const payload = await readJson(response);
  if (!response.ok || payload.ok === false) {
    const error = new Error(payload.message || "Supabase save failed.");
    error.payload = payload;
    throw error;
  }
  return payload;
}

async function loadRecordsFromSupabase(context = {}) {
  const params = new URLSearchParams();
  if (context.tool) params.set("tool", context.tool);
  const response = await fetch(`/api/storage/records${params.toString() ? `?${params.toString()}` : ""}`);
  const payload = await readJson(response);
  if (!response.ok || payload.ok === false) {
    const error = new Error(payload.message || "Supabase load failed.");
    error.payload = payload;
    throw error;
  }
  return payload;
}

function recordTimestampScore(record = {}) {
  const candidates = [
    record[SMARTSHEET_COLUMNS.updatedAt],
    record[SMARTSHEET_COLUMNS.submittedAt],
    record[SMARTSHEET_COLUMNS.createdAt],
  ];
  for (const value of candidates) {
    const parsed = Date.parse(String(value || ""));
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function mergeRecordsById(primaryRecords = [], mirrorRecords = []) {
  const byRecordId = new Map();
  const addRecord = (record, sourcePriority) => {
    const recordId = String(record?.[SMARTSHEET_COLUMNS.recordId] || "").trim();
    if (!recordId) return;
    const next = { record, score: recordTimestampScore(record), sourcePriority };
    const current = byRecordId.get(recordId);
    if (!current || next.score > current.score || (next.score === current.score && next.sourcePriority > current.sourcePriority)) {
      byRecordId.set(recordId, next);
    }
  };
  mirrorRecords.forEach((record) => addRecord(record, 1));
  primaryRecords.forEach((record) => addRecord(record, 2));
  return Array.from(byRecordId.values()).map((entry) => entry.record);
}

export async function syncRecordsToBackbone(records = [], context = {}) {
  let primary = null;
  let primaryError = null;

  try {
    primary = await syncRecordsToSupabase(records, context);
  } catch (error) {
    primaryError = error;
  }

  try {
    const mirror = await syncRecordsToSmartsheet(records, context);
    if (primary) {
      return {
        ok: true,
        state: "synced",
        source: "supabase+smartsheet",
        primary,
        mirror,
        autoCreatedColumns: mirror.autoCreatedColumns || [],
        message: `${primary.message || "Saved to Supabase."} Smartsheet mirror: ${mirror.message || "synced."}`,
      };
    }

    return {
      ok: true,
      state: "fallback",
      source: "smartsheet-fallback",
      primaryError: primaryError?.payload || { message: primaryError?.message },
      mirror,
      autoCreatedColumns: mirror.autoCreatedColumns || [],
      message: `${mirror.message || "Saved to Smartsheet fallback."} Supabase primary is not active yet: ${primaryError?.message || "not configured"}`,
    };
  } catch (mirrorError) {
    if (primary) {
      return {
        ok: true,
        state: "synced",
        source: "supabase",
        primary,
        mirrorError: mirrorError?.payload || { message: mirrorError?.message },
        message: `${primary.message || "Saved to Supabase."} Smartsheet mirror needs attention: ${mirrorError?.message || "mirror failed"}`,
      };
    }

    const error = new Error(`Supabase and Smartsheet saves both failed. Supabase: ${primaryError?.message || "unknown"}. Smartsheet: ${mirrorError?.message || "unknown"}.`);
    error.payload = {
      primary: primaryError?.payload || { message: primaryError?.message },
      mirror: mirrorError?.payload || { message: mirrorError?.message },
    };
    throw error;
  }
}

export async function loadRecordsFromBackbone(context = {}) {
  try {
    const primary = await loadRecordsFromSupabase(context);
    if ((primary.records || []).length && context.mergeFallback) {
      try {
        const mirror = await loadRecordsFromSmartsheet(context);
        const mergedRecords = mergeRecordsById(primary.records || [], mirror || []);
        return {
          ...primary,
          state: "synced",
          source: "supabase+smartsheet-read",
          records: mergedRecords,
          count: mergedRecords.length,
          primaryCount: primary.records?.length || 0,
          mirrorCount: mirror.length,
          message: `Loaded ${mergedRecords.length} merged rotation row${mergedRecords.length === 1 ? "" : "s"} from Supabase and Smartsheet mirror.`,
        };
      } catch (mirrorError) {
        return {
          ...primary,
          state: "synced",
          source: "supabase",
          mirrorError: mirrorError?.payload || { message: mirrorError?.message },
          message: `${primary.message || "Loaded Supabase records."} Smartsheet mirror read needs attention: ${mirrorError?.message || "mirror load failed"}`,
        };
      }
    }
    if ((primary.records || []).length || context.fallbackOnEmpty === false) {
      return {
        ...primary,
        state: "synced",
        source: "supabase",
      };
    }
    const mirror = await loadRecordsFromSmartsheet(context);
    return {
      ok: true,
      state: "fallback",
      source: "smartsheet-fallback",
      records: mirror,
      count: mirror.length,
      message: `Supabase is connected but empty for this scope, so ${mirror.length} Smartsheet fallback row${mirror.length === 1 ? "" : "s"} loaded.`,
    };
  } catch (primaryError) {
    const mirror = await loadRecordsFromSmartsheet(context);
    return {
      ok: true,
      state: "fallback",
      source: "smartsheet-fallback",
      records: mirror,
      count: mirror.length,
      primaryError: primaryError?.payload || { message: primaryError?.message },
      message: `${mirror.length} Smartsheet fallback row${mirror.length === 1 ? "" : "s"} loaded. Supabase primary is not active yet: ${primaryError?.message || "not configured"}`,
    };
  }
}

