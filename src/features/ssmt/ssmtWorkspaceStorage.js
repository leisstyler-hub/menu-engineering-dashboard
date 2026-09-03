export const SSMT_WORKSPACE_RECORD_ID = "ssmt|workspace|current";
export const SSMT_WORKSPACE_RECORD_TYPE = "SSMT Workspace";
const SHARED_LOAD_TIMEOUT_MS = 3000;
const SHARED_SAVE_TIMEOUT_MS = 15000;

async function readJson(response) {
  return response.json().catch(() => ({}));
}

async function fetchWithTimeout(url, options = {}, timeoutMs = SHARED_LOAD_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("Shared SSMT workspace request timed out.");
    }
    throw error;
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

export function buildSsmtWorkspaceRecord(workspace = {}, updatedAt = new Date().toISOString()) {
  return {
    "Record ID": SSMT_WORKSPACE_RECORD_ID,
    "Parent Record ID": "",
    "Record Type": SSMT_WORKSPACE_RECORD_TYPE,
    Status: "Shared",
    "Updated At": updatedAt,
    "Visible In Dashboard": true,
    menus: Array.isArray(workspace.menus) ? workspace.menus : [],
    priceBook: Array.isArray(workspace.priceBook) ? workspace.priceBook : [],
    modifierGroups: Array.isArray(workspace.modifierGroups) ? workspace.modifierGroups : [],
    modifierClipboardSlots: Array.isArray(workspace.modifierClipboardSlots) ? workspace.modifierClipboardSlots : [],
    selectedMenuId: workspace.selectedMenuId || "",
    seedMenuTypeCorrectionsApplied: Boolean(workspace.seedMenuTypeCorrectionsApplied),
    updatedAt,
  };
}

export function workspaceFromRecord(record = null) {
  if (!record || record["Record ID"] !== SSMT_WORKSPACE_RECORD_ID) return null;
  return {
    menus: Array.isArray(record.menus) ? record.menus : [],
    priceBook: Array.isArray(record.priceBook) ? record.priceBook : [],
    modifierGroups: Array.isArray(record.modifierGroups) ? record.modifierGroups : [],
    modifierClipboardSlots: Array.isArray(record.modifierClipboardSlots) ? record.modifierClipboardSlots : [],
    selectedMenuId: record.selectedMenuId || "",
    seedMenuTypeCorrectionsApplied: Boolean(record.seedMenuTypeCorrectionsApplied),
    updatedAt: record.updatedAt || record["Updated At"] || record.__supabaseUpdatedAt || "",
  };
}

export async function loadSsmtWorkspaceFromSharedStorage() {
  const response = await fetchWithTimeout("/api/storage/records?tool=SSMT&includeHidden=1", {}, SHARED_LOAD_TIMEOUT_MS);
  const payload = await readJson(response);
  if (!response.ok || payload.ok === false) {
    const error = new Error(payload.message || "Shared SSMT workspace could not be loaded.");
    error.payload = payload;
    throw error;
  }
  const record = (payload.records || []).find((candidate) => candidate?.["Record ID"] === SSMT_WORKSPACE_RECORD_ID);
  return {
    ok: true,
    source: payload.source || "supabase",
    workspace: workspaceFromRecord(record),
    message: payload.message || "Loaded shared SSMT workspace.",
  };
}

export async function saveSsmtWorkspaceToSharedStorage(workspace = {}) {
  const record = buildSsmtWorkspaceRecord(workspace);
  const response = await fetchWithTimeout("/api/storage/records", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "upsertRecords",
      records: [record],
      context: { tool: "SSMT" },
    }),
  }, SHARED_SAVE_TIMEOUT_MS);
  const payload = await readJson(response);
  if (!response.ok || payload.ok === false) {
    const error = new Error(payload.message || "Shared SSMT workspace could not be saved.");
    error.payload = payload;
    throw error;
  }
  return {
    ...payload,
    record,
  };
}
