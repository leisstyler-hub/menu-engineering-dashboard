// Pure SSMT reuse/naming rules. Never mutate a source or infer missing recipe facts.
const clone = (value) => structuredClone(value);
const text = (value) => String(value ?? "").trim();
const key = (value) => text(value).toLocaleLowerCase("en-US");
const newId = (prefix) => `${prefix}-${globalThis.crypto.randomUUID()}`;
export const FOOD_TYPES = {
  FSK: "Baked",
  FKB: "Breakfast Plate",
  FKS: "Breakfast Side",
  FBB: "Burger",
  FSB: "Burrito",
  FSC: "Candy",
  FSX: "Chips",
  FBC: "Cookie",
  FFF: "Fries",
  FSF: "Fruit",
  FSG: "Grain",
  FGB: "Grain Bar",
  FLH: "Hot Dog",
  FSI: "Ice Cream",
  FNN: "Nachos",
  FSN: "Nuts/Seeds",
  FFA: "Other Finger Food",
  FSO: "Other Food",
  FSA: "Pasta/Noodle",
  FPZ: "Pizza",
  FSP: "Platter",
  FPC: "Popcorn",
  FPP: "Pretzel",
  FBP: "Protein Bar",
  FSQ: "Quesadilla",
  FSR: "Rice",
  FFR: "Rings",
  FSS: "Salad",
  FBS: "Sandwich",
  FSW: "Sandwich Wrap",
  FLS: "Sausage",
  FSL: "Soup/Chili",
  FFS: "Sticks",
  FSZ: "Sushi",
  FST: "Tacos",
  FTT: "Tenders",
  FFT: "Tots",
  FSV: "Veggies",
  FTW: "Wings",
  FSY: "Yogurt",
};
export const PROTEINS = {
  "": "None (confirmed)",
  LAM: "Lamb",
  VEG: "Meat Alternative",
  MLT: "Multiple",
  PRK: "Pork",
  SAU: "Sausage",
  SHF: "Shellfish",
  BF: "Beef",
  CHK: "Chicken",
};
export function replaceConcept(fixy, designation) {
  if (!text(designation) || /[|\r\n]/.test(designation))
    throw new Error("Enter a valid destination FIXY designation.");
  const parts = text(fixy).split("|").map(text);
  if (
    parts.length !== 3 ||
    !/^[RCMV] [A-Z]{3}$/.test(parts[0]) ||
    !parts[1] ||
    !parts[2]
  )
    throw new Error(
      "Source FIXY is missing or malformed. Review it before importing.",
    );
  return `${parts[0]} | ${text(designation).toUpperCase()} | ${parts[2]}`;
}
export function groupsForItem(item, groups, menu) {
  return (item.modifierGroups || [])
    .map((ref) => {
      if (typeof ref === "object") return ref;
      const exact = groups.find((g) => g.id === ref);
      if (exact) return exact;
      const candidates = groups.filter(
        (g) => !g.independentCopy && key(g.name) === key(ref),
      );
      if (candidates.length === 1) return candidates[0];
      const scoped = menu
        ? candidates.filter(
            (g) => key(g.menuName || g.sourceSheet) === key(menu.name),
          )
        : [];
      return scoped.length === 1 ? scoped[0] : undefined;
    })
    .filter(Boolean);
}
export function loadGroups(groups, existing = [], allowCopies = false) {
  return groups
    .filter(
      (g) => allowCopies || !existing.some((e) => key(e.name) === key(g.name)),
    )
    .map((group) => {
      const copy = clone(group);
      copy.id = newId("modifier");
      copy.independentCopy = true;
      copy.sourceGroupId = group.id;
      copy.lockedForCentric = false;
      copy.choices = (copy.choices || []).map((c) => ({
        ...c,
        id: newId("choice"),
      }));
      return copy;
    });
}
export function isDuplicateItem(item, destination) {
  return destination.items.some(
    (existing) =>
      (item.mrn && text(existing.mrn) === text(item.mrn)) ||
      key(existing.label || existing.name) === key(item.label || item.name),
  );
}
export function importItems(
  source,
  destination,
  itemIds,
  groups,
  allowCopies = false,
) {
  if (!text(destination.fixyDesignation))
    throw new Error("Enter the destination FIXY designation first.");
  const items = [],
    copies = [];
  for (const original of source.items.filter(
    (i) => i.rowType !== "divider" && itemIds.includes(i.id),
  )) {
    if (
      !allowCopies &&
      isDuplicateItem(original, {
        ...destination,
        items: [...destination.items, ...items],
      })
    )
      continue;
    const item = clone(original);
    item.fohColumn = replaceConcept(
      item.fohColumn,
      destination.fixyDesignation,
    );
    item.id = newId("item");
    item.lockedForCentric = false;
    item.additionalSubmenuIds = [];
    const refs = original.modifierGroups || [];
    const matched = groupsForItem(original, groups, source);
    if (matched.length !== refs.length)
      throw new Error(
        `Missing or ambiguous modifier reference for ${original.label || original.name}. No items were imported.`,
      );
    const attached = loadGroups(matched, [], true);
    item.modifierGroups = attached.map((g) => g.id);
    item.importSource = { menuId: source.id, itemId: original.id };
    items.push(item);
    copies.push(...attached);
  }
  return { items, groups: copies };
}
export function approvedMatches(item, menus) {
  return menus
    .filter((m) => m.phase === "IT complete")
    .flatMap((menu) =>
      (menu.items || [])
        .filter(
          (i) =>
            i.rowType !== "divider" &&
            text(i.fohColumn) &&
            ((item.mrn && text(i.mrn) === text(item.mrn)) ||
              key(i.label || i.name) === key(item.label || item.name)),
        )
        .map((candidate) => ({
          menuId: menu.id,
          menuName: menu.name,
          item: candidate,
          status: "POSSIBLE MATCH",
        })),
    );
}
export function generateFixy(item, menu, facts) {
  if (!text(menu.fixyDesignation) || /[|\r\n]/.test(menu.fixyDesignation))
    throw new Error("Enter this menu’s FIXY designation before generating.");
  if (!(menu.items || []).some((i) => i.rowType !== "divider"))
    throw new Error(
      "This menu has zero items. Add an item before generating FIXY.",
    );
  if (!FOOD_TYPES[facts.type]) throw new Error("Select an approved food type.");
  if (!["ENT", "SNK"].includes(facts.service))
    throw new Error("Confirm entrée or side/snack.");
  if (!Object.hasOwn(PROTEINS, facts.protein))
    throw new Error("Confirm the protein classification; unknown is not None.");
  if (!["R", "C", "M", "V"].includes(facts.business || "R"))
    throw new Error("Select an approved business.");
  let name = text(item.label || item.name).toUpperCase();
  if (!name || /[|\r\n]/.test(name))
    throw new Error("Review the item label before generating.");
  const concept = text(menu.fixyDesignation).toUpperCase();
  if (facts.cafeSoup12Fo) {
    if (
      concept !== "CAFE EXPRESS" ||
      facts.type !== "FSL" ||
      facts.service !== "SNK" ||
      (facts.business || "R") !== "R"
    )
      throw new Error(
        "12 FO soup convention requires Restaurant / CAFE EXPRESS / Soup / SNK.",
      );
    name = name.replace(/\s+12 FO$/, "");
    return `R FSL | CAFE EXPRESS | ${name} 12 FO SNK`;
  }
  return `${facts.business || "R"} ${facts.type} | ${concept} | ${name} ${facts.service}${facts.protein ? ` ${facts.protein}` : ""}`;
}
