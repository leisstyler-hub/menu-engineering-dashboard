const DEFAULT_SUPABASE_URL = "https://pzilyzqhatthctgsjwtt.supabase.co";
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_1DF7BJ2J-6fBFPkafsfF5w_6HlCyve6";

function cleanUrl(value = "") {
  return String(value || "").trim().replace(/\/+$/, "");
}

export function getSupabaseConfig() {
  const env = import.meta.env || {};
  const envUrl = cleanUrl(env.VITE_SUPABASE_URL);
  const envKey = String(env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY || "").trim();
  const url = envUrl || DEFAULT_SUPABASE_URL;
  const publishableKey = envKey || DEFAULT_SUPABASE_PUBLISHABLE_KEY;

  return {
    url,
    publishableKey,
    projectRef: url.replace(/^https?:\/\//, "").split(".")[0] || "not configured",
    configured: Boolean(url && publishableKey),
    usingFallbackConfig: !envUrl || !envKey,
  };
}

export async function loadSupabaseHealth() {
  const config = getSupabaseConfig();

  if (!config.configured) {
    return {
      ok: false,
      state: "not-configured",
      ...config,
      message: "Supabase URL or publishable key is missing.",
    };
  }

  const startedAt = Date.now();
  const response = await fetch(`${config.url}/rest/v1/`, {
    method: "GET",
    headers: {
      apikey: config.publishableKey,
      Authorization: `Bearer ${config.publishableKey}`,
    },
  });
  const latencyMs = Date.now() - startedAt;

  if (!response.ok) {
    return {
      ok: false,
      state: "error",
      ...config,
      latencyMs,
      statusCode: response.status,
      message: `Supabase answered with ${response.status}.`,
    };
  }

  return {
    ok: true,
    state: "connected",
    ...config,
    latencyMs,
    statusCode: response.status,
    checkedAt: new Date().toISOString(),
    message: "Supabase backbone is reachable.",
  };
}
