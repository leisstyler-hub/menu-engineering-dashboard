import {
  buildBackboneRows,
  getBackboneDatabaseToolFromContext,
  getBackboneToolFromContext,
  normalizeBackboneRows,
} from "../../src/integrations/storage/backboneRecords.js";
import { gzipSync, gunzipSync } from "node:zlib";

const DEFAULT_SUPABASE_URL = "https://pzilyzqhatthctgsjwtt.supabase.co";
const DEFAULT_SUPABASE_TIMEOUT_MS = 8000;
const DEFAULT_SUPABASE_WRITE_TIMEOUT_MS = 25000;
const SSMT_LEGACY_WORKSPACE_RECORD_ID = "ssmt|workspace|current";
const SSMT_WORKSPACE_RECORD_ID = "ssmt|workspace|current-v2";
const SSMT_WORKSPACE_ENCODING = "gzip-base64-json-v1";

function cleanUrl(value = "") {
  return String(value || "").trim().replace(/\/+$/, "");
}

function getSupabaseServerConfig() {
  const url = cleanUrl(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL);
  const serviceKey = String(
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    ""
  ).trim();

  return {
    url,
    serviceKey,
    configured: Boolean(url && serviceKey),
  };
}

function supabaseTimeoutMs(fallback = DEFAULT_SUPABASE_TIMEOUT_MS) {
  const value = Number(process.env.SUPABASE_API_TIMEOUT_MS || fallback);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

async function supabaseFetch(path, options = {}, timeoutMs = DEFAULT_SUPABASE_TIMEOUT_MS) {
  const config = getSupabaseServerConfig();
  if (!config.configured) {
    const error = new Error("Supabase server key is not configured yet.");
    error.statusCode = 503;
    error.fallbackRecommended = true;
    throw error;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), supabaseTimeoutMs(timeoutMs));
  let response;
  try {
    response = await fetch(`${config.url}/rest/v1/${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        apikey: config.serviceKey,
        Authorization: `Bearer ${config.serviceKey}`,
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      const timeoutError = new Error("Supabase storage request timed out.");
      timeoutError.statusCode = 504;
      timeoutError.fallbackRecommended = true;
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }

  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = { raw: text };
  }

  if (!response.ok) {
    const error = new Error(payload?.message || payload?.error || `Supabase API error ${response.status}`);
    error.statusCode = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

function queryString(params) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") search.set(key, value);
  });
  return search.toString();
}

function ssmtWorkspaceRecordId(record = {}) {
  return String(record["Record ID"] || record.record_id || record.__supabaseRecordId || "").trim();
}

function compressSsmtWorkspaceRecord(record = {}) {
  if (![SSMT_WORKSPACE_RECORD_ID, SSMT_LEGACY_WORKSPACE_RECORD_ID].includes(ssmtWorkspaceRecordId(record))) return record;
  if (record.ssmtPayloadEncoding === SSMT_WORKSPACE_ENCODING && record.compressedWorkspace) return record;

  const json = JSON.stringify(record);
  const compressedWorkspace = gzipSync(Buffer.from(json, "utf8")).toString("base64");
  return {
    "Record ID": SSMT_WORKSPACE_RECORD_ID,
    "Record Type": record["Record Type"] || "SSMT Workspace",
    "Status": record.Status || record.status || "Draft",
    "Visible In Dashboard": record["Visible In Dashboard"] ?? true,
    ssmtPayloadEncoding: SSMT_WORKSPACE_ENCODING,
    compressedWorkspace,
    compressedWorkspaceBytes: Buffer.byteLength(compressedWorkspace, "utf8"),
    uncompressedWorkspaceBytes: Buffer.byteLength(json, "utf8"),
    updatedAt: record.updatedAt || new Date().toISOString(),
  };
}

function expandSsmtWorkspaceRecord(record = {}) {
  if (record.ssmtPayloadEncoding !== SSMT_WORKSPACE_ENCODING || !record.compressedWorkspace) return record;
  try {
    const {
      ssmtPayloadEncoding,
      compressedWorkspace,
      compressedWorkspaceBytes,
      uncompressedWorkspaceBytes,
      ...metadata
    } = record;
    const inflated = JSON.parse(gunzipSync(Buffer.from(record.compressedWorkspace, "base64")).toString("utf8"));
    return {
      ...metadata,
      ...inflated,
      __supabaseRecordId: record.__supabaseRecordId,
      __supabaseUpdatedAt: record.__supabaseUpdatedAt,
      __supabaseRetainUntil: record.__supabaseRetainUntil,
    };
  } catch {
    return record;
  }
}

async function findStaleRowIds(parentRecordIds = [], nextRecordIds = []) {
  const nextIds = new Set(nextRecordIds.map(String));
  const staleIds = [];

  for (const parentId of parentRecordIds.map(String).filter(Boolean)) {
    const rows = await findRecordFamilyRows(parentId);
    for (const row of rows || []) {
      if (row.record_id && !nextIds.has(String(row.record_id))) staleIds.push(String(row.record_id));
    }
  }

  return Array.from(new Set(staleIds));
}

async function findRecordFamilyRows(recordId = "") {
  const trimmedRecordId = String(recordId || "").trim();
  if (!trimmedRecordId) return [];
  const directParams = queryString({
    select: "record_id",
    record_id: `eq.${trimmedRecordId}`,
  });
  const childParams = queryString({
    select: "record_id",
    parent_record_id: `eq.${trimmedRecordId}`,
  });
  const prefixParams = queryString({
    select: "record_id",
    record_id: `like.${trimmedRecordId}|*`,
  });
  const rows = [
    ...((await supabaseFetch(`app_records?${directParams}`)) || []),
    ...((await supabaseFetch(`app_records?${childParams}`)) || []),
    ...((await supabaseFetch(`app_records?${prefixParams}`)) || []),
  ];
  return dedupeRowsByRecordId(rows);
}

async function findRecordFamilyIds(recordIds = []) {
  const ids = [];
  for (const recordId of recordIds.map(String).filter(Boolean)) {
    const rows = await findRecordFamilyRows(recordId);
    rows.forEach((row) => {
      if (row.record_id) ids.push(String(row.record_id));
    });
  }
  return Array.from(new Set(ids));
}

async function deleteRecordIds(recordIds = []) {
  let deleted = 0;
  for (const recordId of recordIds.map(String).filter(Boolean)) {
    await supabaseFetch(`app_records?${queryString({ record_id: `eq.${recordId}` })}`, { method: "DELETE" });
    deleted += 1;
  }
  return deleted;
}

async function updateSingleExistingRecord(row) {
  const inserted = await supabaseFetch("app_records?on_conflict=record_id", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify([row]),
  }, DEFAULT_SUPABASE_TIMEOUT_MS);
  return inserted;
}

function dedupeRowsByRecordId(rows = []) {
  const byRecordId = new Map();
  rows.forEach((row) => {
    const recordId = String(row?.record_id || "").trim();
    if (!recordId) return;
    byRecordId.set(recordId, row);
  });
  return Array.from(byRecordId.values());
}

async function loadAllSupabaseRows(basePath, params = {}, { pageSize = 1000, maxRows = 25000 } = {}) {
  const rows = [];
  let offset = 0;

  while (offset < maxRows) {
    const page = await supabaseFetch(`${basePath}?${queryString({
      ...params,
      limit: pageSize,
      offset,
    })}`);
    rows.push(...(page || []));
    if (!Array.isArray(page) || page.length < pageSize) break;
    offset += pageSize;
  }

  return rows;
}

async function loadRecords(req, res) {
  const tool = getBackboneToolFromContext({ tool: req.query?.tool || "" });
  const databaseTool = getBackboneDatabaseToolFromContext({ tool });
  const healthOnly = String(req.query?.health || "") === "1";
  const includeHidden = String(req.query?.includeHidden || "") === "1";
  const params = {
    select: "record_id,updated_at,retain_until,record_payload",
    tool: `eq.${databaseTool}`,
    record_id: tool === "ssmt" ? `eq.${SSMT_WORKSPACE_RECORD_ID}` : undefined,
    visible_in_dashboard: includeHidden ? undefined : "eq.true",
    order: "updated_at.desc",
  };
  const rows = healthOnly
    ? await supabaseFetch(`app_records?${queryString({ ...params, limit: "1" })}`)
    : await loadAllSupabaseRows("app_records", params);
  const records = normalizeBackboneRows(rows || []).map(expandSsmtWorkspaceRecord).filter((record) => {
    if (tool === "menuProjects") {
      return String(record["Record Type"] || "") === "Menu Project" || String(record["Record ID"] || "").startsWith("menuProject|");
    }
    if (tool === "ssmt") {
      return String(record["Record Type"] || "") === "SSMT Workspace" || String(record["Record ID"] || "").startsWith("ssmt|");
    }
    return true;
  });
  const toolLabel = tool === "lean" ? "Lean" : tool === "menuProjects" ? "Menu Project" : tool === "ssmt" ? "SSMT" : "rotation";

  return res.status(200).json({
    ok: true,
    source: "supabase",
    healthOnly,
    includeHidden,
    tool,
    databaseTool,
    records,
    count: records.length,
    message: healthOnly
      ? "Supabase secure storage endpoint is ready."
      : `Loaded ${records.length} ${toolLabel} record${records.length === 1 ? "" : "s"} from Supabase.`,
  });
}

async function upsertRecords(req, res) {
  const { records = [], context = {} } = req.body || {};
  if (!Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ ok: false, message: "No records supplied." });
  }

  const packedRecords = getBackboneToolFromContext(context) === "ssmt"
    ? records.map(compressSsmtWorkspaceRecord)
    : records;
  const rawRows = buildBackboneRows(packedRecords, context);
  const rows = dedupeRowsByRecordId(rawRows);
  if (!rows.length) {
    return res.status(400).json({ ok: false, message: "No records had a Record ID." });
  }

  const replaceParentRecordIds = Array.isArray(context.replaceParentRecordIds) ? context.replaceParentRecordIds : [];
  const staleRowIds = replaceParentRecordIds.length
    ? await findStaleRowIds(replaceParentRecordIds, rows.map((row) => row.record_id))
    : [];

  if (rows.length === 1 && rows[0]?.record_id === SSMT_WORKSPACE_RECORD_ID) {
    await updateSingleExistingRecord(rows[0]);
  } else {
    await supabaseFetch("app_records?on_conflict=record_id", {
      method: "POST",
      headers: {
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(rows),
    }, DEFAULT_SUPABASE_WRITE_TIMEOUT_MS);
  }

  const deletedStale = await deleteRecordIds(staleRowIds);

  return res.status(200).json({
    ok: true,
    source: "supabase",
    tool: rows[0]?.tool || "records",
    synced: rows.length,
    duplicateRowsSkipped: rawRows.length - rows.length,
    deletedStale,
    message: `Saved ${rows.length} row${rows.length === 1 ? "" : "s"} to Supabase${rawRows.length - rows.length ? ` after skipping ${rawRows.length - rows.length} duplicate row instance${rawRows.length - rows.length === 1 ? "" : "s"}` : ""}${deletedStale ? ` and removed ${deletedStale} stale row${deletedStale === 1 ? "" : "s"}` : ""}.`,
  });
}

async function deleteRecords(req, res) {
  const requestedIds = Array.isArray(req.body?.recordIds) ? req.body.recordIds.map(String).filter(Boolean) : [];
  if (!requestedIds.length) {
    return res.status(400).json({ ok: false, message: "No record IDs supplied for delete." });
  }

  const recordFamilyIds = await findRecordFamilyIds(requestedIds);
  const deleted = await deleteRecordIds(recordFamilyIds.length ? recordFamilyIds : requestedIds);

  return res.status(200).json({
    ok: true,
    source: "supabase",
    action: "deleteRecords",
    requested: requestedIds.length,
    deleted,
    recordIds: recordFamilyIds,
    message: `Deleted ${deleted} Supabase row${deleted === 1 ? "" : "s"} for ${requestedIds.length} requested record${requestedIds.length === 1 ? "" : "s"}.`,
  });
}

async function cleanupExpiredRecords(res) {
  const payload = await supabaseFetch("rpc/cleanup_expired_app_records", {
    method: "POST",
    body: JSON.stringify({}),
  });
  return res.status(200).json({
    ok: true,
    source: "supabase",
    cleanup: payload,
    message: "Supabase retention cleanup completed.",
  });
}

export default async function handler(req, res) {
  try {
    if (req.method === "GET") return await loadRecords(req, res);
    if (req.method !== "POST") {
      res.setHeader("Allow", "GET, POST");
      return res.status(405).json({ ok: false, message: "Method not allowed" });
    }

    if (req.body?.action === "cleanupExpiredRecords") return await cleanupExpiredRecords(res);
    if (req.body?.action === "deleteRecords") return await deleteRecords(req, res);
    if (req.body?.action !== "upsertRecords") {
      return res.status(400).json({ ok: false, message: "Unsupported action." });
    }
    return await upsertRecords(req, res);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      ok: false,
      source: "supabase",
      fallbackRecommended: Boolean(error.fallbackRecommended || error.statusCode === 503),
      message: error.message || "Supabase storage failed.",
      details: error.payload || null,
    });
  }
}
