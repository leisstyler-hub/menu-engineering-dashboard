import assert from "node:assert/strict";
import { gzipSync } from "node:zlib";

import recipeLibraryHandler from "../api/recipe-library.js";
import storageRecordsHandler from "../api/storage/records.js";

process.env.SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
process.env.SUPABASE_API_TIMEOUT_MS = "100";

const originalFetch = globalThis.fetch;

function neverCompletesUntilAbort(signal) {
  return new Promise((_, reject) => {
    if (signal?.aborted) {
      reject(Object.assign(new Error("The operation was aborted."), { name: "AbortError" }));
      return;
    }
    signal?.addEventListener("abort", () => {
      reject(Object.assign(new Error("The operation was aborted."), { name: "AbortError" }));
    }, { once: true });
  });
}

globalThis.fetch = async (url, options = {}) => {
  const href = String(url);
  if (href.includes("/rest/v1/recipe_items?")) {
    return neverCompletesUntilAbort(options.signal);
  }
  if (href.includes("/rest/v1/recipe_item_documents?")) {
    return { ok: true, status: 200, text: async () => "[]" };
  }
  if (href.includes("/rest/v1/app_records?")) {
    return neverCompletesUntilAbort(options.signal);
  }
  throw new Error(`Unexpected fetch: ${href}`);
};

async function invokeRecipeLibrary(query) {
  let statusCode = 0;
  let body = null;
  await recipeLibraryHandler(
    { method: "GET", query, headers: {} },
    {
      setHeader() {},
      status(code) {
        statusCode = code;
        return {
          json(payload) {
            body = payload;
          },
        };
      },
    }
  );
  return { statusCode, body };
}

async function invokeStorageRecords({ method = "GET", query = {}, body = {} } = {}) {
  let statusCode = 0;
  let bodyPayload = null;
  await storageRecordsHandler(
    { method, query, body, headers: {} },
    {
      setHeader() {},
      status(code) {
        statusCode = code;
        return {
          json(payload) {
            bodyPayload = payload;
          },
        };
      },
    }
  );
  return { statusCode, body: bodyPayload };
}

try {
  const result = await Promise.race([
    invokeRecipeLibrary({ scope: "summary" }),
    new Promise((_, reject) => setTimeout(() => reject(new Error("Recipe Library serialized slow Supabase reads instead of recovering in parallel.")), 160)),
  ]);

  assert.equal(result.statusCode, 200);
  assert.equal(result.body.ok, true);
  assert.equal(result.body.source, "server-menuworks-json");
  assert.equal(result.body.ssmtDerivedRows, 0);
  assert.match(result.body.fallbackMessage, /Supabase API request timed out|aborted/i);
  assert.match(result.body.fallbackMessage, /SSMT operating rows could not be loaded|aborted|timed out/i);
  assert(result.body.menus.some((entry) => entry.menu === "AMZ: Ohana"));

  const oversizedWorkspace = {
    "Record ID": "ssmt|workspace|current",
    "Record Type": "SSMT Workspace",
    menus: Array.from({ length: 80 }, (_, index) => ({
      id: `menu-${index}`,
      name: `Menu ${index}`,
      type: "Core",
      phase: "Culinary draft",
      items: Array.from({ length: 25 }, (__, itemIndex) => ({
        id: `item-${index}-${itemIndex}`,
        label: `Item ${index}-${itemIndex}`,
        description: "large workspace row".repeat(8),
      })),
    })),
    priceBook: [],
    modifierGroups: [],
    selectedMenuId: "menu-1",
    seedMenuTypeCorrectionsApplied: true,
  };
  let compressedPayload = null;
  globalThis.fetch = async (url, options = {}) => {
    const href = String(url);
    if (href.includes("/rest/v1/app_records?on_conflict=record_id")) {
      const rows = JSON.parse(options.body || "[]");
      compressedPayload = rows[0]?.record_payload;
      return { ok: true, status: 200, text: async () => "" };
    }
    throw new Error(`Unexpected storage fetch: ${href}`);
  };
  const saveResult = await invokeStorageRecords({
    method: "POST",
    body: {
      action: "upsertRecords",
      context: { tool: "SSMT" },
      records: [oversizedWorkspace],
    },
  });
  assert.equal(saveResult.statusCode, 200);
  assert.equal(compressedPayload?.ssmtPayloadEncoding, "gzip-base64-json-v1");
  assert.equal(compressedPayload.menus, undefined);
  assert.match(compressedPayload.compressedWorkspace, /^[A-Za-z0-9+/=]+$/);
  assert(compressedPayload.compressedWorkspace.length < JSON.stringify(oversizedWorkspace).length);

  const storedPayload = {
    "Record ID": "ssmt|workspace|current",
    "Record Type": "SSMT Workspace",
    ssmtPayloadEncoding: "gzip-base64-json-v1",
    compressedWorkspace: gzipSync(Buffer.from(JSON.stringify({
      menus: [{ id: "stored-menu", name: "Stored Compressed Menu", type: "Core", items: [] }],
      priceBook: [],
      modifierGroups: [],
      selectedMenuId: "stored-menu",
      seedMenuTypeCorrectionsApplied: true,
    }), "utf8")).toString("base64"),
  };
  globalThis.fetch = async (url) => {
    const href = String(url);
    if (href.includes("/rest/v1/app_records?")) {
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify([{
          record_id: "ssmt|workspace|current",
          updated_at: "2026-09-03T00:00:00.000Z",
          retain_until: "2028-09-03T00:00:00.000Z",
          record_payload: storedPayload,
        }]),
      };
    }
    throw new Error(`Unexpected storage fetch: ${href}`);
  };
  const loadResult = await invokeStorageRecords({
    method: "GET",
    query: { tool: "SSMT", includeHidden: "1" },
  });
  assert.equal(loadResult.statusCode, 200);
  assert.equal(loadResult.body.records[0].menus[0].name, "Stored Compressed Menu");
} finally {
  globalThis.fetch = originalFetch;
}

console.log("SSMT load resilience verification passed.");
