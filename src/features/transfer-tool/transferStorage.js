const readJson = (response) => response.json().catch(() => ({}));
const normalize = (value) => String(value ?? "").normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("en-US");
const catalogId = (row) => [row.menu, row.item || row.displayName || row.recipeName, row.mrn, row.portion].map(normalize).join("|");

export async function refreshTransferCatalogCosts(catalogItems = []) {
  const response = await fetch("/api/recipe-library?scope=all");
  const payload = await readJson(response);
  if (!response.ok || payload.ok === false || !Array.isArray(payload.rows)) throw new Error(payload.message || "Live Item + Waste Cost refresh is unavailable.");
  const currentCosts = new Map();
  payload.rows.forEach((row) => {
    const value = row.trueCost;
    if (value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value))) currentCosts.set(catalogId(row), Number(value));
  });
  let refreshed = 0;
  const items = catalogItems.map((item) => {
    if (!currentCosts.has(item.id)) return { ...item, itemWasteCost: null };
    refreshed += 1;
    return { ...item, itemWasteCost: currentCosts.get(item.id) };
  });
  return { items, refreshed, source: payload.source || "Menu Library API" };
}

export async function loadIngredientAllocations(mrn) {
  const response = await fetch(`/api/transfer-breakdown?mrn=${encodeURIComponent(String(mrn || ""))}`);
  const payload = await readJson(response);
  if (!response.ok || payload.ok === false || (!Array.isArray(payload.components) && !Array.isArray(payload.unpricedComponents))) {
    throw new Error(payload.message || "No ingredient mapping is available for this menu item.");
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
