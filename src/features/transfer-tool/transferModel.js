export const normalizeTransferTitle = (value = "") => String(value)
  .normalize("NFKC")
  .trim()
  .replace(/\s+/g, " ")
  .toLocaleLowerCase("en-US");

export const transferRecordId = (title) => `transfer|${encodeURIComponent(normalizeTransferTitle(title))}`;

export const transferTotal = (items = []) => items.reduce((sum, item) => {
  const quantity = Number(item.quantity);
  const cost = Number(item.itemWasteCost);
  return sum + (Number.isFinite(quantity) && Number.isFinite(cost) ? quantity * cost : 0);
}, 0);

export function refreshCopiedItems(items = [], catalogItems = []) {
  const catalogById = new Map(catalogItems.map((item) => [item.id, item]));
  return items.map((item) => {
    const latest = catalogById.get(item.catalogId);
    return latest ? {
      ...item,
      menu: latest.menu,
      item: latest.item,
      mrn: latest.mrn,
      portion: latest.portion,
      itemWasteCost: latest.itemWasteCost,
      glGroups: latest.glGroups,
    } : item;
  });
}

export function validateTransfer(draft, transfers = []) {
  const errors = {};
  const title = String(draft.title || "").trim();
  if (title.length < 3 || title.length > 100) errors.title = "Enter a title between 3 and 100 characters.";
  const normalizedTitle = normalizeTransferTitle(title);
  if (!draft.recordId && transfers.some((record) => normalizeTransferTitle(record.title) === normalizedTitle)) {
    errors.title = "That transfer title already exists. Titles must be globally unique.";
  }
  if (!draft.departingUnit) errors.departingUnit = "Choose a departing unit.";
  if (!draft.receivingUnit) errors.receivingUnit = "Choose a receiving unit.";
  if (draft.departingUnit && draft.departingUnit === draft.receivingUnit) errors.receivingUnit = "Receiving unit must be different from departing unit.";
  if (!draft.transferDate) errors.transferDate = "Choose a transfer date.";
  const completeItems = (draft.items || []).filter((item) => item.catalogId);
  if (!completeItems.length) errors.items = "Add at least one menu item.";
  if (completeItems.some((item) => item.itemWasteCost == null || !Number.isFinite(Number(item.itemWasteCost)))) {
    errors.items = "Every selected item needs an Item + Waste Cost before this transfer can be saved.";
  }
  if (completeItems.some((item) => !Number.isInteger(Number(item.quantity)) || Number(item.quantity) < 1)) {
    errors.items = "Every item count must be a whole number of 1 or more.";
  }
  return errors;
}
