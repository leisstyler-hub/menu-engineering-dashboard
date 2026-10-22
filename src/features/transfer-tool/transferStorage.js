const readJson = (response) => response.json().catch(() => ({}));
const normalize = (value) => String(value ?? "").normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("en-US");
const catalogId = (row) => [row.menu, row.item || row.displayName || row.recipeName, row.mrn, row.portion].map(normalize).join("|");

export async function refreshTransferCatalogCosts() {
  const response = await fetch("/api/recipe-library?scope=all");
  const payload = await readJson(response);
  if (!response.ok || payload.ok === false || !Array.isArray(payload.rows)) throw new Error(payload.message || "Live Item + Waste Cost refresh is unavailable.");
  if (!String(payload.source || "").startsWith("supabase-recipe-items")) throw new Error("Shared Supabase menu catalog is unavailable. Retry before creating a transfer.");
  const unique = new Map();
  payload.rows.forEach((row) => {
    const menu = String(row.menu || "").trim(), item = String(row.item || row.displayName || row.recipeName || "").trim();
    if (!menu || !item) return;
    const value = row.trueCost;
    const cost = value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value)) && Number(value) >= 0 ? Number(value) : null;
    const id = catalogId(row);
    const entry = { id, menu, item, mrn: String(row.mrn ?? ""), portion: String(row.portion || ""), itemWasteCost: cost };
    const previous = unique.get(id);
    if (previous && previous.itemWasteCost !== cost) entry.itemWasteCost = null;
    unique.set(id, entry);
  });
  const items = [...unique.values()].sort((a,b) => a.menu.localeCompare(b.menu) || a.item.localeCompare(b.item));
  const refreshed = items.filter(item => item.itemWasteCost !== null).length;
  return { items, refreshed, source: payload.source || "Menu Library API" };
}

export async function loadIngredientAllocations(mrn) {
  const response = await fetch(`/api/transfer-breakdown?mrn=${encodeURIComponent(String(mrn || ""))}`);
  const payload = await readJson(response);
  if (!response.ok || payload.ok === false || (!Array.isArray(payload.components) && !Array.isArray(payload.unpricedComponents))) {
    const error = new Error(payload.message || (response.status === 404 ? "No ingredient mapping is available for this menu item." : "Ingredient mapping could not be verified."));
    error.status = response.status;
    error.code = response.status === 404 ? "TRANSFER_MAPPING_NOT_FOUND" : "TRANSFER_MAPPING_UNAVAILABLE";
    throw error;
  }
  return {
    components: payload.components,
    unpricedComponents: payload.unpricedComponents || [],
    pricingComplete: payload.pricingComplete === true,
    allocationPerPortion: Number(payload.allocationPerPortion),
    resource: payload.resource,
  };
}

export async function loadTransfers() {
  const response = await fetch("/api/storage/records?tool=transfers&includeHidden=1");
  const payload = await readJson(response);
  if (!response.ok || payload.ok === false) throw new Error(payload.message || "Unable to load shared transfers.");
  return Array.isArray(payload.records) ? payload.records : [];
}

export async function saveTransfer(record, { createOnly = false } = {}) {
  const response = await fetch("/api/storage/records", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: createOnly ? "createTransfer" : "upsertRecords",
      records: [record],
      context: { tool: "transfers" },
    }),
  });
  const payload = await readJson(response);
  if (!response.ok || payload.ok === false) {
    const error = new Error(payload.message || "Unable to save the transfer.");
    error.status = response.status;
    throw error;
  }
  return payload;
}

export async function deleteTransfer(recordId) {
  const response = await fetch("/api/storage/records", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "deleteTransfer",
      recordId,
      context: { tool: "transfers" },
    }),
  });
  const payload = await readJson(response);
  if (!response.ok || payload.ok === false) throw new Error(payload.message || "Unable to delete the saved transfer.");
  return payload;
}
