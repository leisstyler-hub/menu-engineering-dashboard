// Price selector IDs are the explicit link to active pricing. Saved snapshots remain intact.
function pricingIndex(priceBook) {
  const index = new Map();
  for (const row of priceBook || []) {
    if (!row?.id) continue;
    // Ambiguous IDs cannot establish an authoritative price.
    index.set(row.id, index.has(row.id) ? null : row);
  }
  return index;
}

function resolveChoice(choice, index, isModifier = false) {
  const row = index.get(choice.priceSelectorId);
  if (!row?.areas || choice.recordType === 'divider') return choice;
  const areaPrices = { ...(choice.areaPrices || {}), ...row.areas };
  const primaryKey = isModifier ? 'price' : 'seaPrice';
  return {
    ...choice,
    areaPrices,
    ...(Object.hasOwn(row.areas, 'SEA') ? { [primaryKey]: row.areas.SEA } : {}),
  };
}

export function resolveSsmtModifierPrices(groups = [], priceBook = []) {
  const index = pricingIndex(priceBook);
  return groups.map(group => ({
    ...group,
    choices: (group.choices || []).map(choice => resolveChoice(choice, index, true)),
  }));
}

export function resolveSsmtMenuPrices(menu = {}, priceBook = []) {
  const index = pricingIndex(priceBook);
  return {
    ...menu,
    items: (menu.items || []).map(item => ({
      ...resolveChoice(item, index),
      ...(Array.isArray(item.modifierGroups) ? {
        modifierGroups: item.modifierGroups.map(group => typeof group === 'object' && group !== null
          ? resolveSsmtModifierPrices([group], priceBook)[0] : group),
      } : {}),
    })),
  };
}

function clonePriceBook(priceBook = []) {
  return priceBook.map(price => ({ ...price, areas: { ...(price.areas || {}) } }));
}

export function activateDuePricing(workspace = {}, today) {
  if (!today) {
    const date = new Date();
    today = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
  const plan = workspace.plannedPriceBook;
  if (!plan?.effectiveDate || plan.effectiveDate > today || !Array.isArray(plan.priceBook)) return workspace;
  return {
    ...workspace,
    priceBook: clonePriceBook(plan.priceBook),
    priceBookEffectiveFrom: plan.effectiveDate,
    plannedPriceBook: null,
    priceBookArchives: [...(workspace.priceBookArchives || []), {
      id: `price-archive-${Date.now()}`,
      effectiveFrom: workspace.priceBookEffectiveFrom || 'Original SSMT pricing',
      effectiveTo: plan.effectiveDate,
      priceBook: clonePriceBook(workspace.priceBook),
    }],
  };
}

// Only exact saved selector IDs establish usage. Include historical/hidden menus
// and clipboard choices so deleting a row cannot revive an older price snapshot.
export function priceRowUsage(workspace = {}, priceId) {
  const result = { menuItems: 0, modifierChoices: 0, clipboardChoices: 0, total: 0, inPlannedBook: false };
  if (!priceId) return result;
  const countChoices = group => (group?.choices || []).filter(choice => choice.priceSelectorId === priceId).length;
  for (const menu of workspace.menus || []) {
    for (const item of menu.items || []) {
      if (item.priceSelectorId === priceId) result.menuItems += 1;
      for (const group of item.modifierGroups || []) {
        if (group && typeof group === 'object') result.modifierChoices += countChoices(group);
      }
    }
  }
  for (const group of workspace.modifierGroups || []) result.modifierChoices += countChoices(group);
  for (const slot of workspace.modifierClipboardSlots || []) result.clipboardChoices += countChoices(slot.group);
  result.total = result.menuItems + result.modifierChoices + result.clipboardChoices;
  result.inPlannedBook = (workspace.plannedPriceBook?.priceBook || []).some(row => row.id === priceId);
  return result;
}

export function deleteUnusedCurrentPriceRow(workspace = {}, priceId) {
  if (!priceId || (workspace.priceBook || []).filter(row => row.id === priceId).length !== 1) return workspace;
  if (priceRowUsage(workspace, priceId).total > 0) return workspace;
  return { ...workspace, priceBook: workspace.priceBook.filter(row => row.id !== priceId) };
}
