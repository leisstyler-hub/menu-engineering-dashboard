import assert from "node:assert/strict";

import { summarizeSupabaseHealth } from "../src/integrations/supabase/healthStatus.js";

const readyWithPublicProbeWarning = summarizeSupabaseHealth({
  project: {
    ok: false,
    statusCode: 401,
    message: "Supabase answered with 401.",
  },
  storage: {
    ok: true,
    message: "Supabase secure storage endpoint is ready.",
  },
});

assert.equal(readyWithPublicProbeWarning.state, "connected");
assert.equal(readyWithPublicProbeWarning.message, "Supabase secure storage endpoint is ready.");
assert.equal(readyWithPublicProbeWarning.data.publicProbeWarning, "Supabase answered with 401.");

const missingServerKey = summarizeSupabaseHealth({
  project: {
    ok: true,
    message: "Supabase backbone is reachable.",
  },
  storage: {
    ok: false,
    message: "Supabase server key is not configured yet.",
  },
});

assert.equal(missingServerKey.state, "error");
assert.equal(missingServerKey.message, "Supabase server key is not configured yet.");

console.log("supabase health status tests passed");
