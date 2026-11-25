export const FREE_MODIFIER_PRICE_ID = 'ssmt-modifier-zero';

// Changing type must not reset any values already entered in the group.
export function selectModifierType(group, type, itemName, areas) {
  return { ...group, modifierType: type };
}

export function resizeModifierGroup(group, areas) {
  if (!['Remove', 'Addition'].includes(group.modifierType)) return group;
  return { ...group, maxQty: String((group.choices || []).length * (group.modifierType === 'Addition' ? 2 : 1)) };
}
