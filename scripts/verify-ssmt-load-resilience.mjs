import assert from "node:assert/strict";

import recipeLibraryHandler from "../api/recipe-library.js";

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
} finally {
  globalThis.fetch = originalFetch;
}

console.log("SSMT load resilience verification passed.");
