export const normalizeTransferTitle = (value = "") => String(value)
  .normalize("NFKC")
  .trim()
  .replace(/\s+/g, " ")
  .toLocaleLowerCase("en-US");

export const transferRecordId = (title) => `transfer|${encodeURIComponent(normalizeTransferTitle(title))}`;

export const S4_EXPORT_VERSION = 1;
export const S4_MAX_ROWS = 450;

export const trimToLength = (value = "", maxLength = 50) => String(value ?? "").normalize("NFKC").trim().slice(0, maxLength);

export const defaultTransferDescription = (itemName = "", reference = "") => {
  const item = trimToLength(itemName, 50);
  const suffix = trimToLength(reference, 24);
  if (!suffix) return item;
  const itemLimit = Math.max(1, 50 - suffix.length - 3);
  return `${trimToLength(item, itemLimit)} - ${suffix}`;
};

export const transferTotal = (items = []) => items.reduce((sum, item) => {
  const quantity = Number(item.quantity);
  const cost = Number(item.itemWasteCost);
  return sum + (Number.isFinite(quantity) && Number.isFinite(cost) ? quantity * cost : 0);
}, 0);

export function refreshCopiedItems(items = [], catalogItems = []) {
  const catalogById = new Map(catalogItems.map((item) => [item.id, item]));
  return items.map((item) => {
    const { glGroups: _ignoredGlGroups, ...itemWithoutGl } = item;
    const latest = catalogById.get(item.catalogId);
    return latest ? {
      ...itemWithoutGl,
      menu: latest.menu,
      item: latest.item,
      mrn: latest.mrn,
      portion: latest.portion,
      itemWasteCost: latest.itemWasteCost,
    } : itemWithoutGl;
  });
}

export function validateS4Transfer(transfer = {}) {
  const errors = {};
  const items = (transfer.items || []).filter((item) => item.catalogId);
  if (!/^\d{5}$/.test(String(transfer.receivingProfitCenter || ""))) {
    errors.receivingProfitCenter = "Enter a 5-digit receiving profit center.";
  }
  if (String(transfer.eventId || "").length > 18) errors.eventId = "Event ID cannot exceed 18 characters.";
  if (items.length > S4_MAX_ROWS) errors.items = `S4 exports support up to ${S4_MAX_ROWS} item lines.`;
  if (items.some((item) => !/^\d{7}$/.test(String(item.fromGlAccount || "")) || !/^\d{7}$/.test(String(item.toGlAccount || "")))) {
    errors.s4Lines = "Every selected item needs 7-digit From G/L and To G/L accounts.";
  }
  if (items.some((item) => {
    const description = String(item.description || "").trim();
    return !description || description.length > 50;
  })) errors.s4Lines = "Every selected item needs a description of 50 characters or fewer.";
  if (items.some((item) => !(Number(item.quantity) * Number(item.itemWasteCost) > 0))) {
    errors.s4Lines = "Every S4 line needs a transfer amount greater than zero.";
  }
  return errors;
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
  if (draft.s4ExportVersion) Object.assign(errors, validateS4Transfer(draft));
  return errors;
}
