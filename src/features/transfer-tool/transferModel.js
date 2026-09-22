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
const allocationRounded = (value) => Number(Number(value).toFixed(8));
const allocationTotal = (allocations = []) => rounded(allocations.reduce((sum, allocation) => sum + Number(allocation?.allocationPerPortion || 0), 0));
const hasChefResidualAllocation = (item = {}) => Array.isArray(item.ingredientAllocations)
  && item.ingredientAllocations.some((allocation) => allocation?.isResidualCostBalance && Number(allocation.allocationPerPortion) > 0);
const hasUncoveredRecipeComponents = (item = {}) => Array.isArray(item.unpricedComponents)
  && item.unpricedComponents.length > 0
  && !hasChefResidualAllocation(item);

function scaleAllocationsToCost(components, targetCost, sourceTotal) {
  if (!(targetCost > 0) || !(sourceTotal > targetCost)) {
    return {
      components: components.map(({ allocationScaleFactor: _oldFactor, isProportionallyAdjusted: _oldFlag, ...component }) => component),
      allocationScaleFactor: 1,
      allocationWasScaled: false,
    };
  }

  const allocationScaleFactor = targetCost / sourceTotal;
  const scaled = components.map((component) => ({
    ...component,
    sourceAllocationPerPortion: Number(component.allocationPerPortion),
    // Keep enough precision that real catalog spices and seasonings remain
    // positive after the shared proportional reduction.
    allocationPerPortion: allocationRounded(Number(component.allocationPerPortion) * allocationScaleFactor),
    allocationScaleFactor,
    isProportionallyAdjusted: true,
  }));
  const roundingDifference = allocationRounded(targetCost - scaled.reduce((sum, component) => sum + Number(component.allocationPerPortion), 0));
  if (roundingDifference) {
    const adjustmentIndex = scaled.reduce((bestIndex, component, index, list) => (
      Number(component.allocationPerPortion) > Number(list[bestIndex]?.allocationPerPortion || 0) ? index : bestIndex
    ), 0);
    scaled[adjustmentIndex] = {
      ...scaled[adjustmentIndex],
      allocationPerPortion: allocationRounded(Number(scaled[adjustmentIndex].allocationPerPortion) + roundingDifference),
    };
  }
  return { components: scaled, allocationScaleFactor, allocationWasScaled: true };
}

export function balanceIngredientAllocations({ components = [], unpricedComponents = [], itemWasteCost, residualGlCode = "" }) {
  const pricedComponents = components.filter((component) => Number(component?.allocationPerPortion) > 0);
  const sourceMappedAllocationPerPortion = allocationTotal(pricedComponents);
  const targetCost = Number(itemWasteCost);
  const scaled = scaleAllocationsToCost(pricedComponents, targetCost, sourceMappedAllocationPerPortion);
  const mappedComponents = scaled.components;
  const mappedAllocationPerPortion = allocationTotal(mappedComponents);
  let residualCost = Number.isFinite(targetCost) && targetCost > mappedAllocationPerPortion
    ? rounded(targetCost - mappedAllocationPerPortion)
    : 0;
  let remainingUnpricedComponents = unpricedComponents;
  let itemCostResidualAttribution = null;
  const soleUnpricedComponent = unpricedComponents.length === 1 ? unpricedComponents[0] : null;
  if (residualCost > 0 && soleUnpricedComponent?.residualAttributionEligible && /^\d{7}$/.test(String(soleUnpricedComponent.glCode || ""))) {
    const quantityPerPortion = Number(soleUnpricedComponent.quantity) / Number(soleUnpricedComponent.recipeYield);
    itemCostResidualAttribution = {
      ...soleUnpricedComponent,
      unitPrice: quantityPerPortion > 0 ? rounded(residualCost / quantityPerPortion) : residualCost,
      allocationPerPortion: residualCost,
      isItemCostResidualAttribution: true,
      priceSourceNote: "Item + Waste Cost residual attribution: this was the recipe's only unresolved priced component, so it receives the exact remaining item cost on its existing mapped G/L.",
    };
    remainingUnpricedComponents = [];
    residualCost = 0;
  }
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
  const ingredientAllocations = [
    ...mappedComponents,
    ...(itemCostResidualAttribution ? [itemCostResidualAttribution] : []),
    ...(residualAllocation ? [residualAllocation] : []),
  ];
  const allocationPerPortion = allocationTotal(ingredientAllocations);
  return {
    ingredientAllocations,
    unpricedComponents: remainingUnpricedComponents,
    allocationPerPortion,
    mappedAllocationPerPortion,
    sourceMappedAllocationPerPortion,
    allocationScaleFactor: scaled.allocationScaleFactor,
    allocationWasScaled: scaled.allocationWasScaled,
    pricingComplete: ingredientAllocations.length > 0
      && targetCost > 0
      && (remainingUnpricedComponents.length === 0 || Boolean(residualAllocation))
      && (residualCost === 0 || Boolean(residualAllocation))
      && Math.abs(allocationPerPortion - targetCost) < 0.0001,
    residualCost,
    residualGlCode,
    itemCostResidualAttribution: itemCostResidualAttribution?.allocationPerPortion || 0,
    allocationExceedsItemCost: false,
    targetCost: Number.isFinite(targetCost) ? targetCost : null,
  };
}

export function normalizeTransferItemAllocations(item = {}, nextItemWasteCost = item.itemWasteCost) {
  const allocations = Array.isArray(item.ingredientAllocations) ? item.ingredientAllocations : [];
  if (!allocations.length) return { ...item, itemWasteCost: nextItemWasteCost };
  const attributedComponents = allocations.filter((allocation) => allocation.isItemCostResidualAttribution).map((allocation) => {
    const {
      allocationPerPortion: _oldAllocation,
      isItemCostResidualAttribution: _oldAttribution,
      priceSourceNote: _oldNote,
      unitPrice: _oldUnitPrice,
      ...sourceComponent
    } = allocation;
    return { ...sourceComponent, residualAttributionEligible: true, allocationPerPortion: null };
  });
  const balanced = balanceIngredientAllocations({
    components: allocations.filter((allocation) => !allocation.isResidualCostBalance && !allocation.isItemCostResidualAttribution).map((allocation) => {
      const {
        allocationScaleFactor: _oldFactor,
        isProportionallyAdjusted: _oldFlag,
        sourceAllocationPerPortion,
        ...sourceAllocation
      } = allocation;
      return {
        ...sourceAllocation,
        allocationPerPortion: Number(sourceAllocationPerPortion ?? allocation.allocationPerPortion),
      };
    }),
    unpricedComponents: [...(Array.isArray(item.unpricedComponents) ? item.unpricedComponents : []), ...attributedComponents],
    itemWasteCost: nextItemWasteCost,
    residualGlCode: item.residualGlCode || "",
  });
  return {
    ...item,
    itemWasteCost: nextItemWasteCost,
    ...balanced,
    allocationStatus: balanced.pricingComplete ? "ready" : "review",
  };
}

export function refreshCopiedItems(items = [], catalogItems = []) {
  const catalogById = new Map(catalogItems.map((item) => [item.id, item]));
  return items.map((item) => {
    const { glGroups: _ignoredGlGroups, fromGlAccount: _fromGlAccount, toGlAccount: _toGlAccount, ...itemWithoutGl } = item;
    const latest = catalogById.get(item.catalogId);
    return latest ? normalizeTransferItemAllocations({
      ...itemWithoutGl,
      menu: latest.menu,
      item: latest.item,
      mrn: latest.mrn,
      portion: latest.portion,
    }, latest.itemWasteCost) : normalizeTransferItemAllocations(itemWithoutGl);
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
  if (!errors.s4Lines && items.some(hasUncoveredRecipeComponents)) {
    errors.s4Lines = "Every unresolved recipe component must be covered by a chef-reviewed G/L allocation before export.";
  }
  if (!errors.s4Lines && items.some((item) => Math.abs(allocationTotal(item.ingredientAllocations) - Number(item.itemWasteCost)) >= 0.0001)) {
    errors.s4Lines = "Every ingredient allocation must equal its current Item + Waste Cost before export.";
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
  if (!errors.items && completeItems.some(hasUncoveredRecipeComponents)) errors.items = "Every unresolved recipe component must be covered by a chef-reviewed G/L allocation before saving.";
  if (!errors.items && completeItems.some((item) => Math.abs(allocationTotal(item.ingredientAllocations) - Number(item.itemWasteCost)) >= 0.0001)) errors.items = "Every ingredient allocation must equal its current Item + Waste Cost before saving.";
  if (completeItems.some((item) => !Number.isInteger(Number(item.quantity)) || Number(item.quantity) < 1)) {
    errors.items = "Every item count must be a whole number of 1 or more.";
  }
  if (draft.s4ExportVersion) Object.assign(errors, validateS4Transfer(draft));
  return errors;
}
