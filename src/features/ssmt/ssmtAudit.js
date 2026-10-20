const stable = (value) => JSON.stringify(canonical(value));
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((k) => [k, canonical(value[k])]),
    );
  return value;
}
const without = (object, keys) =>
  Object.fromEntries(
    Object.entries(object || {}).filter(([k]) => !keys.includes(k)),
  );
function entities(workspace) {
  const result = new Map();
  for (const menu of workspace.menus || []) {
    result.set(`menu/${menu.id}`, {
      kind: "menu",
      menuId: menu.id,
      menuNames: [menu.name],
      label: menu.name,
      value: without(menu, ["items"]),
    });
    for (const item of menu.items || [])
      result.set(`menu/${menu.id}/item/${item.id}`, {
        kind: "item",
        menuId: menu.id,
        menuNames: [menu.name],
        label: item.label || item.name || item.title,
        value: item,
      });
  }
  for (const group of workspace.modifierGroups || []) {
    const menuNames = (workspace.menus || [])
      .filter((menu) =>
        (menu.items || []).some((item) =>
          (item.modifierGroups || []).some(
            (ref) =>
              ref === group.id ||
              (!group.independentCopy && ref === group.name),
          ),
        ),
      )
      .map((menu) => menu.name);
    result.set(`modifier/${group.id}`, {
      kind: "modifier",
      label: group.name,
      menuNames,
      value: without(group, ["choices"]),
    });
    for (const choice of group.choices || [])
      result.set(`modifier/${group.id}/choice/${choice.id}`, {
        kind: "modifier option",
        label: choice.label || choice.name,
        menuNames,
        value: choice,
      });
  }
  result.set("pricing", {
    kind: "pricing",
    label: "Pricing structure",
    value: {
      priceBook: workspace.priceBook || [],
      plannedPriceBook: workspace.plannedPriceBook || null,
      priceBookArchives: workspace.priceBookArchives || [],
      priceBookEffectiveFrom: workspace.priceBookEffectiveFrom || "",
    },
  });
  result.set("deletedMenuKeys", {
    kind: "workspace",
    label: "Deleted menu references",
    value: workspace.deletedMenuKeys || [],
  });
  return result;
}
export function auditChanges(before, after) {
  const old = entities(before),
    next = entities(after),
    events = [];
  for (const id of new Set([...old.keys(), ...next.keys()])) {
    const a = old.get(id),
      b = next.get(id);
    if (stable(a?.value) === stable(b?.value)) continue;
    const info = b || a;
    const event = {
      entityId: id,
      kind: info.kind,
      menuId: info.menuId || "",
      label: info.label || "",
      menuNames: info.menuNames || [],
      action: !a ? "created" : !b ? "deleted" : "edited",
    };
    if (!a) event.after = b.value;
    else if (!b) event.before = a.value;
    else {
      event.changes = {};
      for (const field of new Set([
        ...Object.keys(a.value),
        ...Object.keys(b.value),
      ])) {
        if (stable(a.value[field]) !== stable(b.value[field]))
          event.changes[field] = {
            before: a.value[field] ?? null,
            after: b.value[field] ?? null,
          };
      }
      if (event.changes.phase) event.action = "workflow changed";
    }
    events.push(event);
  }
  return events;
}
export function validateExperienceChange(before, after) {
  const allowedMenu = ["phase", "status", "phaseTimestamps"];
  const clean = (workspace) => ({
    priceBook: [],
    deletedMenuKeys: [],
    plannedPriceBook: null,
    priceBookArchives: [],
    priceBookEffectiveFrom: "",
    ...without(workspace, [
      "updatedAt",
      "selectedMenuId",
      "menus",
      "modifierClipboardSlots",
    ]),
    menus: (workspace.menus || []).map((menu) => ({
      ...without(menu, allowedMenu),
      items: (menu.items || []).map((item) => without(item, ["description"])),
    })),
  });
  if (stable(clean(before)) !== stable(clean(after)))
    return "Experience can edit descriptions and advance menus only.";
  const phases = [
    "Culinary draft",
    "Experience review",
    "IT programming",
    "IT complete",
  ];
  for (const menu of after.menus || []) {
    const previous = before.menus.find((m) => m.id === menu.id);
    if (
      menu.phase === previous.phase &&
      (stable(menu.status) !== stable(previous.status) ||
        stable(menu.phaseTimestamps) !== stable(previous.phaseTimestamps))
    )
      return "Experience can change workflow metadata only when advancing a menu.";
    if (
      menu.phase !== previous.phase &&
      !(
        phases.indexOf(menu.phase) === phases.indexOf(previous.phase) + 1 &&
        menu.phase !== "IT complete"
      )
    )
      return "Experience can advance one step, up to IT programming.";
  }
  return "";
}

export function validateWorkspaceShape(workspace) {
  if (
    !workspace ||
    !Array.isArray(workspace.menus) ||
    !workspace.menus.length ||
    !Array.isArray(workspace.modifierGroups)
  )
    return "Refusing an empty or malformed workspace.";
  const unique = (rows) =>
    rows.every((row) => row && typeof row.id === "string" && row.id) &&
    new Set(rows.map((row) => row.id)).size === rows.length;
  if (!unique(workspace.menus) || !unique(workspace.modifierGroups))
    return "Menu and modifier IDs must be present and unique.";
  for (const menu of workspace.menus) {
    if (!Array.isArray(menu.items) || !unique(menu.items))
      return "Item IDs must be present and unique within each menu.";
    if (
      menu.items.some(
        (item) => item.mrn !== undefined && typeof item.mrn !== "string",
      )
    )
      return "MRNs must remain exact text.";
  }
  for (const group of workspace.modifierGroups) {
    if (!Array.isArray(group.choices) || !unique(group.choices))
      return "Modifier choices require unique IDs.";
    if (
      group.choices.some(
        (choice) => choice.mrn !== undefined && typeof choice.mrn !== "string",
      )
    )
      return "Modifier MRNs must remain exact text.";
  }
  return "";
}
