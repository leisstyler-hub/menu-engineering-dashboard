export const FREE_MODIFIER_PRICE_ID = 'ssmt-modifier-zero';
const emptyAreas = (areas, value = '') => Object.fromEntries(areas.map(area => [area, value]));
const freeChoice = (choice, areas) => ({ ...choice, priceSelectorId: FREE_MODIFIER_PRICE_ID, price: '0.00', areaPrices: emptyAreas(areas, '0.00') });

// Apply only on an explicit type selection, never while loading historical groups.
export function selectModifierType(group, type, itemName, areas) {
  if (type === 'Custom') return {
    ...group, modifierType: type, name: '', minQty: '', maxQty: '',
    choices: (group.choices || []).map(choice => ({ ...choice, priceSelectorId: '', price: '', areaPrices: emptyAreas(areas) })),
  };
  if (type !== 'Remove' && type !== 'Addition') return { ...group, modifierType: type };
  return resizeModifierGroup({
    ...group, modifierType: type,
    name: `${type === 'Remove' ? 'Customize' : 'Make It Better'} (${itemName})`, minQty: '0',
    choices: type === 'Remove' ? (group.choices || []).map(choice => freeChoice(choice, areas)) : group.choices,
  }, areas);
}

export function resizeModifierGroup(group, areas) {
  if (!['Remove', 'Addition'].includes(group.modifierType)) return group;
  return { ...group, maxQty: String((group.choices || []).length * (group.modifierType === 'Addition' ? 2 : 1)),
    choices: group.modifierType === 'Remove' ? (group.choices || []).map(choice => choice.priceSelectorId ? choice : freeChoice(choice, areas)) : group.choices,
  };
}
