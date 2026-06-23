import { loadRecordsFromSmartsheet, syncRecordsToSmartsheet } from "../smartsheet/client.js";

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

