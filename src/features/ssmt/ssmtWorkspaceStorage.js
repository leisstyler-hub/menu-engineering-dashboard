export const SSMT_WORKSPACE_RECORD_ID = "ssmt|workspace|current";
export const SSMT_WORKSPACE_RECORD_TYPE = "SSMT Workspace";

async function readJson(response) {
  return response.json().catch(() => ({}));
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
    selectedMenuId: record.selectedMenuId || "",
    seedMenuTypeCorrectionsApplied: Boolean(record.seedMenuTypeCorrectionsApplied),
    updatedAt: record.updatedAt || record["Updated At"] || record.__supabaseUpdatedAt || "",
  };
}

export async function loadSsmtWorkspaceFromSharedStorage() {
  const response = await fetch("/api/storage/records?tool=SSMT&includeHidden=1");
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
  const response = await fetch("/api/storage/records", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "upsertRecords",
      records: [record],
      context: { tool: "SSMT" },
    }),
  });
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
