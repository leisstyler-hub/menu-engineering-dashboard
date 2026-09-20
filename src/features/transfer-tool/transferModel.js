export const normalizeTransferTitle = (value = "") => String(value)
  .normalize("NFKC")
  .trim()
  .replace(/\s+/g, " ")
  .toLocaleLowerCase("en-US");

export const transferRecordId = (title) => `transfer|${encodeURIComponent(normalizeTransferTitle(title))}`;

export const S4_EXPORT_VERSION = 1;
export const S4_MAX_ROWS = 450;
export const PREPARED_FOODS_GL_CODE = "4111011";

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
  // The menu card's current Item + Waste Cost is the transfer value. Ingredient
  // allocations explain how that value is distributed across G/L accounts.
  const cost = Number(item.itemWasteCost);
  return sum + (Number.isFinite(quantity) && Number.isFinite(cost) ? quantity * cost : 0);
}, 0);

const rounded = (value) => Number(Number(value).toFixed(4));

export function balanceIngredientAllocations({ components = [], unpricedComponents = [], itemWasteCost, residualGlCode = "" }) {
  const pricedComponents = components.filter((component) => Number(component?.allocationPerPortion) > 0);
  const mappedAllocationPerPortion = rounded(pricedComponents.reduce((sum, component) => sum + Number(component.allocationPerPortion), 0));
  const targetCost = Number(itemWasteCost);
  const residualCost = Number.isFinite(targetCost) && targetCost > mappedAllocationPerPortion
    ? rounded(targetCost - mappedAllocationPerPortion)
    : 0;
  const allocationExceedsItemCost = Number.isFinite(targetCost) && mappedAllocationPerPortion > targetCost;
  const residualAllocation = residualCost > 0 && residualGlCode ? {
    ingredientMrn: "chef-reviewed-cost-balance",
    ingredientName: "Chef-reviewed cost balance",
    quantity: 1,
    unit: "portion",
    recipeYield: 1,
    unitPrice: residualCost,
    glCode: residualGlCode,
    allocationPerPortion: residualCost,
    isResidualCostBalance: true,
    priceSourceNote: "Chef-selected G/L allocation for the portion of the current Item + Waste Cost not covered by mapped ingredient prices.",
  } : null;
  const ingredientAllocations = residualAllocation ? [...pricedComponents, residualAllocation] : pricedComponents;
  const allocationPerPortion = rounded(ingredientAllocations.reduce((sum, component) => sum + Number(component.allocationPerPortion), 0));
  return {
    ingredientAllocations,
    unpricedComponents,
    allocationPerPortion,
    mappedAllocationPerPortion,
    pricingComplete: pricedComponents.length > 0 && !allocationExceedsItemCost && (residualCost === 0 || Boolean(residualAllocation)),
    residualCost,
    residualGlCode,
    allocationExceedsItemCost,
    targetCost: Number.isFinite(targetCost) ? targetCost : null,
  };
}

export function refreshCopiedItems(items = [], catalogItems = []) {
  const catalogById = new Map(catalogItems.map((item) => [item.id, item]));
  return items.map((item) => {
    const { glGroups: _ignoredGlGroups, fromGlAccount: _fromGlAccount, toGlAccount: _toGlAccount, ...itemWithoutGl } = item;
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
  const allocations = items.flatMap((item) => Array.isArray(item.ingredientAllocations) ? item.ingredientAllocations : []);
  if (allocations.length > S4_MAX_ROWS) errors.items = `S4 exports support up to ${S4_MAX_ROWS} ingredient lines.`;
  if (items.some((item) => !Array.isArray(item.ingredientAllocations) || !item.ingredientAllocations.length)) errors.s4Lines = "Every selected item needs a priced ingredient allocation before it can export.";
  if (allocations.some((allocation) => !/^\d{7}$/.test(String(allocation.glCode || "")) || !(Number(allocation.allocationPerPortion) > 0))) {
    errors.s4Lines = "Every ingredient allocation needs an approved G/L code and amount greater than zero.";
  }
  if (items.some((item) => Number(item.residualCost) > 0 && !item.residualGlCode)) {
    errors.s4Lines = "Choose one chef-reviewed G/L code for every remaining Item + Waste Cost before export.";
  }
  if (items.some((item) => Number(item.mappedAllocationPerPortion) > Number(item.itemWasteCost))) {
    errors.s4Lines = "A mapped ingredient allocation exceeds its current Item + Waste Cost and needs source review before export.";
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
  if (completeItems.some((item) => item.itemWasteCost == null || !Number.isFinite(Number(item.itemWasteCost)))) errors.items = "Every selected item needs an Item + Waste Cost before this transfer can be saved.";
  if (completeItems.some((item) => Number(item.residualCost) > 0 && !item.residualGlCode)) errors.items = "Choose one chef-reviewed G/L code for every remaining Item + Waste Cost before saving.";
  if (completeItems.some((item) => Number(item.mappedAllocationPerPortion) > Number(item.itemWasteCost))) errors.items = "A mapped ingredient allocation exceeds its current Item + Waste Cost and needs source review before saving.";
  if (completeItems.some((item) => !Number.isInteger(Number(item.quantity)) || Number(item.quantity) < 1)) {
    errors.items = "Every item count must be a whole number of 1 or more.";
  }
  if (draft.s4ExportVersion) Object.assign(errors, validateS4Transfer(draft));
  return errors;
}
