export function summarizeSupabaseHealth({ project = {}, storage = {} } = {}) {
  const storageReady = Boolean(storage.ok);
  const state = storageReady ? "connected" : "error";
  const message = storageReady
    ? (storage.message || "Supabase secure storage endpoint is ready.")
    : (storage.message || project.message || "Supabase secure storage endpoint needs attention.");

  return {
    state,
    message,
    data: {
      ...project,
      storage,
      publicProbeWarning: storageReady && !project.ok ? project.message || "Public project probe needs attention." : "",
    },
  };
}

