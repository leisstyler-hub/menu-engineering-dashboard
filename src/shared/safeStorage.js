export function readLocalStorageJson(key, fallback) {
  if (typeof window === "undefined" || !window.localStorage) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function writeLocalStorageJson(key, value, { clearOnQuota = false } = {}) {
  if (typeof window === "undefined" || !window.localStorage) return true;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    const isQuotaError =
      error?.name === "QuotaExceededError" ||
      error?.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
      /quota/i.test(error?.message || "");

    if (clearOnQuota && isQuotaError) {
      try {
        window.localStorage.removeItem(key);
      } catch {
        // The browser cache is optional; live app state should keep working.
      }
    }

    return false;
  }
}
