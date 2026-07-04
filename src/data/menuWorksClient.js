import { MENU_ENGINEERING_OVERRIDE_STORAGE_KEY } from "../features/recipe-database/recipeLibraryModel.js";

export function readStoredMenuWorksItems() {
  if (typeof window === "undefined") return null;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(MENU_ENGINEERING_OVERRIDE_STORAGE_KEY) || "null");
    return Array.isArray(parsed) && parsed.length ? parsed : null;
  } catch {
    return null;
  }
}

export async function loadMenuWorksItemsFromApi() {
  const stored = readStoredMenuWorksItems();
  if (stored) return { rows: stored, source: "local-override" };

  const response = await fetch("/api/recipe-library?scope=all");
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.message || "Unable to load MenuWorks items.");
  }
  return { rows: payload.rows || [], source: payload.source || "server-menuworks-json" };
}
