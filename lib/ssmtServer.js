// Server-only SSMT security/storage boundary. No client-provided actor is trusted.
import { createHash } from "node:crypto";
import { gzipSync, gunzipSync } from "node:zlib";
export const WORKSPACE_ID = "ssmt|workspace|current";
export const enabled = () => process.env.SSMT_ACCOUNTS_ENABLED === "true";
export function failure(message, status = 400) {
  return Object.assign(new Error(message), { statusCode: status });
}
export async function service(path, options = {}, auth = false) {
  const url = String(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "",
  ).replace(/\/+$/, "");
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_KEY;
  if (!url.startsWith("https://") || !key)
    throw failure("SSMT account service is unavailable.", 503);
  const response = await fetch(
    `${url}/${auth ? "auth/v1" : "rest/v1"}/${path}`,
    {
      ...options,
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
      signal: AbortSignal.timeout(25000),
    },
  );
  const data = await response.json().catch(() => null);
  if (!response.ok)
    throw failure(
      response.status === 409
        ? "The shared workspace changed. Reload and reconcile your draft before saving."
        : "SSMT service could not complete the request.",
      response.status >= 500 ? 503 : response.status,
    );
  return data;
}
export function guardLegacySsmtWrite(body = {}) {
  const records = Array.isArray(body.records) ? body.records : [];
  const ids = [
    body.recordId,
    ...(Array.isArray(body.recordIds) ? body.recordIds : []),
    ...(Array.isArray(body.context?.replaceParentRecordIds)
      ? body.context.replaceParentRecordIds
      : []),
    ...records.flatMap((r) => [
      r?.["Record ID"],
      r?.record_id,
      r?.["Parent Record ID"],
      r?.parent_record_id,
    ]),
  ];
  return (
    /ssmt|sea standard menu template/i.test(String(body.context?.tool || "")) ||
    ids.some((id) => {
      const value = String(id || "")
        .trim()
        .toLowerCase();
      return value === "ssmt" || value.startsWith("ssmt|");
    }) ||
    records.some((r) =>
      String(r?.["Record Type"] || r?.record_type || "").includes("SSMT"),
    )
  );
}
export function assertOrigin(req) {
  const origin = String(req.headers?.origin || "");
  if (!origin || origin !== process.env.SSMT_APP_ORIGIN)
    throw failure("Open SSMT from its configured application address.", 403);
}
export function cookieToken(req) {
  const cookie = String(req.headers?.cookie || "")
    .split(";")
    .map((v) => v.trim())
    .find((v) => v.startsWith("__Host-ssmt="));
  return cookie ? decodeURIComponent(cookie.slice("__Host-ssmt=".length)) : "";
}
export function sessionCookie(res, token, expires = 3600) {
  res.setHeader(
    "Set-Cookie",
    `__Host-ssmt=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${Math.max(0, Math.min(3600, expires))}`,
  );
}
export async function identity(req, token = cookieToken(req)) {
  if (!token || !/^[A-Za-z0-9._-]+$/.test(token))
    throw failure("Sign in to SSMT.", 401);
  const user = await service(
    "user",
    { headers: { Authorization: `Bearer ${token}` } },
    true,
  ).catch(() => {
    throw failure("Your SSMT session expired. Sign in again.", 401);
  });
  if (!user?.id) throw failure("Sign in to SSMT.", 401);
  const [member] = await service(
    `ssmt_members?user_id=eq.${encodeURIComponent(user.id)}&select=user_id,email,display_name,work_role,is_admin,active&limit=1`,
  );
  if (!member?.active)
    throw failure("Your SSMT access is not active. Contact an admin.", 403);
  return { ...member, token };
}
export const publicMember = (member) => ({
  id: member.user_id,
  email: member.email,
  name: member.display_name,
  role: member.work_role,
  isAdmin: member.is_admin,
});
export function unpack(payload) {
  if (payload?.ssmtPayloadEncoding === "gzip-base64-json-v1") {
    try {
      return JSON.parse(
        gunzipSync(Buffer.from(payload.compressedWorkspace, "base64"), {
          maxOutputLength: 40000000,
        }).toString("utf8"),
      );
    } catch {
      throw failure(
        "Shared workspace could not be decoded. No save is permitted.",
        503,
      );
    }
  }
  return payload;
}
export function pack(workspace) {
  const json = JSON.stringify(workspace),
    compressedWorkspace = gzipSync(Buffer.from(json)).toString("base64");
  return {
    "Record ID": WORKSPACE_ID,
    "Record Type": "SSMT Workspace",
    Status: "Shared",
    "Visible In Dashboard": true,
    ssmtPayloadEncoding: "gzip-base64-json-v1",
    compressedWorkspace,
    compressedWorkspaceBytes: Buffer.byteLength(compressedWorkspace),
    uncompressedWorkspaceBytes: Buffer.byteLength(json),
    updatedAt: workspace.updatedAt,
  };
}
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonical(value[key])]),
    );
  return value;
}
export const revision = (payload) =>
  createHash("sha256")
    .update(JSON.stringify(canonical(payload)))
    .digest("hex");
export async function storedWorkspace() {
  const [row] = await service(
    `app_records?record_id=eq.${encodeURIComponent(WORKSPACE_ID)}&select=record_payload&limit=1`,
  );
  if (!row?.record_payload)
    throw failure(
      "The shared SSMT workspace is missing. Loading seed data cannot replace it.",
      409,
    );
  const workspace = unpack(row.record_payload);
  if (
    !Array.isArray(workspace?.menus) ||
    !Array.isArray(workspace?.modifierGroups)
  )
    throw failure(
      "The shared SSMT workspace is invalid. No save is permitted.",
      503,
    );
  return {
    payload: row.record_payload,
    workspace,
    revision: revision(row.record_payload),
  };
}
