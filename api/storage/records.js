import {
  buildBackboneRows,
  getBackboneToolFromContext,
  normalizeBackboneRows,
} from "../../src/integrations/storage/backboneRecords.js";

const DEFAULT_SUPABASE_URL = "https://pzilyzqhatthctgsjwtt.supabase.co";

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

async function supabaseFetch(path, options = {}) {
  const config = getSupabaseServerConfig();
  if (!config.configured) {
    const error = new Error("Supabase server key is not configured yet.");
    error.statusCode = 503;
    error.fallbackRecommended = true;
    throw error;
  }

  const response = await fetch(`${config.url}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: config.serviceKey,
      Authorization: `Bearer ${config.serviceKey}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

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

async function deleteStaleRows(parentRecordIds = [], nextRecordIds = []) {
  const nextIds = new Set(nextRecordIds.map(String));
  const staleIds = [];

  for (const parentId of parentRecordIds.map(String).filter(Boolean)) {
    const params = queryString({
      select: "record_id",
      or: `(record_id.eq.${parentId},parent_record_id.eq.${parentId})`,
    });
    const rows = await supabaseFetch(`app_records?${params}`);
    for (const row of rows || []) {
      if (row.record_id && !nextIds.has(String(row.record_id))) staleIds.push(String(row.record_id));
    }
  }

  for (const staleId of staleIds) {
    await supabaseFetch(`app_records?record_id=eq.${encodeURIComponent(staleId)}`, { method: "DELETE" });
  }

  return staleIds.length;
}

async function loadRecords(req, res) {
  const tool = getBackboneToolFromContext({ tool: req.query?.tool || "" });
  const healthOnly = String(req.query?.health || "") === "1";
  const includeHidden = String(req.query?.includeHidden || "") === "1";
  const params = queryString({
    select: "record_id,updated_at,retain_until,record_payload",
    tool: `eq.${tool}`,
    visible_in_dashboard: includeHidden ? undefined : "eq.true",
    order: "updated_at.desc",
    limit: healthOnly ? "1" : "5000",
  });
  const rows = await supabaseFetch(`app_records?${params}`);
  const records = normalizeBackboneRows(rows || []);

  return res.status(200).json({
    ok: true,
    source: "supabase",
    healthOnly,
    includeHidden,
    tool,
    records,
    count: records.length,
    message: healthOnly
      ? "Supabase secure storage endpoint is ready."
      : `Loaded ${records.length} ${tool === "lean" ? "Lean" : "rotation"} record${records.length === 1 ? "" : "s"} from Supabase.`,
  });
}

async function upsertRecords(req, res) {
  const { records = [], context = {} } = req.body || {};
  if (!Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ ok: false, message: "No records supplied." });
  }

  const rows = buildBackboneRows(records, context);
  if (!rows.length) {
    return res.status(400).json({ ok: false, message: "No records had a Record ID." });
  }

  const replaceParentRecordIds = Array.isArray(context.replaceParentRecordIds) ? context.replaceParentRecordIds : [];
  const deletedStale = replaceParentRecordIds.length
    ? await deleteStaleRows(replaceParentRecordIds, rows.map((row) => row.record_id))
    : 0;

  await supabaseFetch("app_records?on_conflict=record_id", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(rows),
  });

  return res.status(200).json({
    ok: true,
    source: "supabase",
    tool: rows[0]?.tool || "records",
    synced: rows.length,
    deletedStale,
    message: `Saved ${rows.length} row${rows.length === 1 ? "" : "s"} to Supabase${deletedStale ? ` and removed ${deletedStale} stale row${deletedStale === 1 ? "" : "s"}` : ""}.`,
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
