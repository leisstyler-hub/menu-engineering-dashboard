import test from "node:test";
import assert from "node:assert/strict";
import handler from "../../api/ssmt.js";
import { guardLegacySsmtWrite } from "../../lib/ssmtServer.js";
function response() {
  return {
    headers: {},
    setHeader(k, v) {
      this.headers[k] = v;
    },
    status(code) {
      this.code = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

test("member listing exposes only sign-in metadata to verified admins", async () => {
  const keys = ["SSMT_ACCOUNTS_ENABLED", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
  const old = keys.map(k => process.env[k]);
  const originalFetch = globalThis.fetch;
  let admin = true, authReads = 0, unavailable = false;
  Object.assign(process.env, { SSMT_ACCOUNTS_ENABLED: "true", SUPABASE_URL: "https://example.test", SUPABASE_SERVICE_ROLE_KEY: "test-key" });
  globalThis.fetch = async url => {
    const path = String(url);
    let data;
    if (path.endsWith("/auth/v1/user")) data = { id: "one" };
    else if (path.includes("/auth/v1/admin/users/")) {
      authReads++;
      if (unavailable) return { ok: false, status: 503, json: async () => ({}) };
      data = { id: "one", last_sign_in_at: "2026-10-21T04:00:00Z", secret_metadata: "must not escape" };
    } else if (path.includes("ssmt_members?")) data = [{ user_id: "one", email: "one@example.test", active: true, is_admin: admin, work_role: "Chef" }];
    else throw Error(`Unexpected URL ${path}`);
    return { ok: true, json: async () => data };
  };
  try {
    const req = { method: "GET", headers: { cookie: "__Host-ssmt=verified.token" }, query: { action: "members" } };
    let res = response();
    await handler(req, res);
    assert.equal(res.code, 200);
    assert.equal(res.body.members[0].last_sign_in_at, "2026-10-21T04:00:00Z");
    assert.equal(JSON.stringify(res.body).includes("secret_metadata"), false);
    assert.equal(authReads, 1);
    unavailable = true;
    res = response();
    await handler(req, res);
    assert.equal(res.code, 200);
    assert.equal(res.body.members[0].last_sign_in_unavailable, true);
    admin = false;
    res = response();
    await handler(req, res);
    assert.equal(res.code, 403);
    assert.equal(authReads, 2);
  } finally {
    globalThis.fetch = originalFetch;
    keys.forEach((k, i) => old[i] === undefined ? delete process.env[k] : process.env[k] = old[i]);
  }
});
test("SSMT API fails closed when inactive and never reads storage", async () => {
  const previous = process.env.SSMT_ACCOUNTS_ENABLED;
  delete process.env.SSMT_ACCOUNTS_ENABLED;
  const res = response();
  await handler({ method: "POST", body: { action: "save" }, headers: {} }, res);
  assert.equal(res.code, 503);
  if (previous) process.env.SSMT_ACCOUNTS_ENABLED = previous;
});
test("legacy write guards detect SSMT identity independent of claimed context", () => {
  assert.equal(
    guardLegacySsmtWrite({
      records: [{ "Record ID": "ssmt|workspace|current" }],
      context: { tool: "rotation" },
    }),
    true,
  );
  assert.equal(
    guardLegacySsmtWrite({ recordIds: ["ssmt|workspace|current"] }),
    true,
  );
  assert.equal(
    guardLegacySsmtWrite({
      context: { replaceParentRecordIds: ["ssmt|workspace|current"] },
    }),
    true,
  );
  assert.equal(
    guardLegacySsmtWrite({ records: [{ "Record ID": "rotation|safe" }] }),
    false,
  );
});

test("verified identity ignores a forged actor and rejects revoked users, stale saves and forbidden edits", async () => {
  const envKeys = [
    "SSMT_ACCOUNTS_ENABLED",
    "SSMT_APP_ORIGIN",
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
  ];
  const old = Object.fromEntries(envKeys.map((k) => [k, process.env[k]])),
    originalFetch = globalThis.fetch;
  Object.assign(process.env, {
    SSMT_ACCOUNTS_ENABLED: "true",
    SSMT_APP_ORIGIN: "https://app.test",
    SUPABASE_URL: "https://example.test",
    SUPABASE_SERVICE_ROLE_KEY: "test-key",
  });
  const { revision } = await import("../../lib/ssmtServer.js");
  const workspace = {
    "Record ID": "ssmt|workspace|current",
    "Record Type": "SSMT Workspace",
    menus: [
      {
        id: "m",
        name: "Menu",
        phase: "Experience review",
        items: [{ id: "i", mrn: "0001.10", description: "Old" }],
      },
    ],
    modifierGroups: [],
  };
  let active = true,
    role = "Chef",
    rpc = [];
  globalThis.fetch = async (url, options = {}) => {
    const path = String(url);
    let payload;
    if (path.endsWith("/auth/v1/user"))
      payload = { id: "11111111-1111-4111-8111-111111111111" };
    else if (path.includes("/ssmt_members?"))
      payload = [
        {
          user_id: "11111111-1111-4111-8111-111111111111",
          email: "verified@example.test",
          display_name: "Verified",
          work_role: role,
          is_admin: false,
          active,
        },
      ];
    else if (path.includes("/app_records?"))
      payload = [{ record_payload: workspace }];
    else if (path.includes("/rpc/")) {
      rpc.push(JSON.parse(options.body));
      payload = null;
    } else throw new Error(`Unexpected test URL ${path}`);
    return { ok: true, status: 200, json: async () => payload };
  };
  const req = (body) => ({
    method: "POST",
    headers: {
      origin: "https://app.test",
      cookie: "__Host-ssmt=verified.token",
    },
    body,
  });
  try {
    let res = response();
    await handler(req({ action: "save", revision: "stale", workspace }), res);
    assert.equal(res.code, 409);
    assert.equal(rpc.length, 0);
    active = false;
    res = response();
    await handler(
      {
        method: "GET",
        headers: { cookie: "__Host-ssmt=verified.token" },
        query: { action: "workspace" },
      },
      res,
    );
    assert.equal(res.code, 403);
    active = true;
    role = "Experience";
    const forbidden = structuredClone(workspace);
    forbidden.menus[0].items[0].mrn = "999";
    res = response();
    await handler(
      req({
        action: "save",
        revision: revision(workspace),
        workspace: forbidden,
      }),
      res,
    );
    assert.equal(res.code, 403);
    assert.equal(rpc.length, 0);
    role = "Chef";
    const changed = structuredClone(workspace);
    changed.menus[0].items[0].description = "New";
    res = response();
    await handler(
      req({
        action: "save",
        revision: revision(workspace),
        workspace: changed,
        actor: "forged",
      }),
      res,
    );
    assert.equal(res.code, 200);
    assert.equal(rpc[0].p_actor, "11111111-1111-4111-8111-111111111111");
    assert.equal(rpc[0].p_events[0].changes.description.after, "New");
    assert.equal(rpc[0].p_role, "Chef");
    res = response();
    await handler(
      { ...req({ action: "save" }), headers: { origin: "https://evil.test" } },
      res,
    );
    assert.equal(res.code, 403);
    res = response();
    await handler(
      { method: "GET", headers: {}, query: { action: "workspace" } },
      res,
    );
    assert.equal(res.code, 401);
    res = response();
    await handler(
      req({
        action: "invite",
        role: "IT",
        isAdmin: false,
        email: "x@example.test",
      }),
      res,
    );
    assert.equal(res.code, 403);
  } finally {
    globalThis.fetch = originalFetch;
    for (const key of envKeys) {
      if (old[key] === undefined) delete process.env[key];
      else process.env[key] = old[key];
    }
  }
});

test("revision hashes survive PostgreSQL JSONB key ordering", async () => {
  const { revision } = await import("../../lib/ssmtServer.js");
  assert.equal(
    revision({
      updatedAt: "now",
      compressedWorkspace: "same",
      "Record ID": "ssmt|workspace|current",
    }),
    revision({
      "Record ID": "ssmt|workspace|current",
      compressedWorkspace: "same",
      updatedAt: "now",
    }),
  );
});
