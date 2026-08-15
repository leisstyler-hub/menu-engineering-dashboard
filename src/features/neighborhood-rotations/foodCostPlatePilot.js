import reference from "../../data/foodCostPlateReference.json";

const PILOT_WEEK_START = "2026-08-17";
const normalize = (value) => String(value || "").trim().toLowerCase();
const title = (value) => String(value || "").replace(/\b\w/g, (letter) => letter.toUpperCase());
const conceptBuild = (menu) => {
  const guide = reference.concepts?.find((concept) => normalize(concept.menu) === normalize(menu))?.plateBuild || "";
  if (/^(Unknown|Varies)/i.test(guide)) return "";
  return guide.split(";").map((value) => value.trim()).find((value) => value && !/NOT FOR INDIVIDUAL/i.test(value)) || "";
};

export const FOOD_COST_REFERENCE_ROWS = reference.rows
  .filter((row) => !row.menu.startsWith("AMZ+RA:"))
  .map((row) => ({
    ...row,
    plateBuild: row.plateBuild || conceptBuild(row.menu),
    item: row.id,
    displayName: row.item,
    trueCost: row.itemWasteCost,
    price: row.sellPrice,
    recipeCategory: row.componentType,
  }));

const ROWS_BY_ID = new Map(FOOD_COST_REFERENCE_ROWS.map((row) => [row.id, row]));
const isPrimary = (row) => ["entree", "plate"].includes(normalize(row.componentType))
  && row.sellPrice != null
  && row.plateBuild
  && !/NOT FOR INDIVIDUAL/i.test(row.plateBuild);

export function isFoodCostPlatePilot(district, cafe, weekStart) {
  return district === "North" && cafe === "Nessie" && weekStart === PILOT_WEEK_START;
}

export function foodCostReferenceRow(id) {
  return ROWS_BY_ID.get(String(id || "")) || null;
}

export function foodCostReferenceRows(menu, station = "") {
  const menuRows = FOOD_COST_REFERENCE_ROWS.filter((row) => normalize(row.menu) === normalize(menu));
  const stations = [...new Set(menuRows.map((row) => row.station))];
  if (!station && stations.length === 1) return menuRows;
  return menuRows.filter((row) => normalize(row.station) === normalize(station));
}

export function foodCostReferenceMenus() {
  return [...new Set(FOOD_COST_REFERENCE_ROWS.filter(isPrimary).map((row) => row.menu))].sort();
}

export function foodCostReferenceStations(menu) {
  const stations = [...new Set(FOOD_COST_REFERENCE_ROWS.filter((row) => normalize(row.menu) === normalize(menu) && isPrimary(row)).map((row) => row.station))];
  return stations.length > 1 ? stations.sort() : [];
}

export function referenceIdForLoadedSelection({ menu, station, mrn, portion, itemName }) {
  const candidates = foodCostReferenceRows(menu, station).filter((row) => normalize(row.mrn) === normalize(mrn));
  return (candidates.find((row) => normalize(row.portion) === normalize(portion) && normalize(row.displayName) === normalize(itemName))
    || candidates.find((row) => normalize(row.displayName) === normalize(itemName))
    || candidates[0])?.id || "";
}

const plural = (label, count) => count === 1 ? label : `${label}s`;
const requirement = (label, count, rows, predicate) => ({
  key: normalize(label).replace(/[^a-z0-9]+/g, "-"),
  label,
  count,
  rows: rows.filter(predicate),
});

export function parsePlateBuild(plateBuild, rows) {
  const build = String(plateBuild || "").trim();
  if (!build || /NOT FOR INDIVIDUAL/i.test(build)) return [];
  if (/^Choice of beans/i.test(build)) {
    const beanMrns = new Set(["76908.2", "20064.4"]);
    const proteinMrns = new Set(["175362.1", "174049.2", "85478.1", "175489", "41742.6", "57451.2", "76680.1", "143119", "65814.2"]);
    return [
      requirement("Bean Choice", 1, rows, (row) => beanMrns.has(row.mrn)),
      requirement("Protein Choice", 1, rows, (row) => proteinMrns.has(row.mrn)),
    ];
  }
  return build.split("+").map((part) => part.trim()).flatMap((part) => {
    const match = part.match(/^(\d+)\s+(.+?)s?$/i);
    const count = match ? Number(match[1]) : 1;
    const rawLabel = (match ? match[2] : part).trim().replace(/s$/i, "");
    if (/^(entree|plate)$/i.test(rawLabel)) return [];
    const label = plural(title(rawLabel), count);
    const normalizedLabel = normalize(rawLabel);
    const exactItemRows = rows.filter((row) => normalize(row.displayName) === normalizedLabel);
    if (exactItemRows.length) return [requirement(label, count, rows, (row) => exactItemRows.includes(row))];
    const typeMatches = (row, names) => names.includes(normalize(row.componentType));
    const predicates = {
      base: (row) => typeMatches(row, ["base", "side + base"]),
      side: (row) => typeMatches(row, ["side"]),
      rice: (row) => typeMatches(row, ["rice"]) || (/rice/i.test(row.displayName) && typeMatches(row, ["side", "base", "side + base"])),
      "plate add": (row) => typeMatches(row, ["plate add"]),
      topping: (row) => typeMatches(row, ["topping"]),
      chips: (row) => typeMatches(row, ["chips"]),
      cornbread: (row) => typeMatches(row, ["cornbread"]),
      "garlic bread": (row) => typeMatches(row, ["garlic bread"]),
      naan: (row) => typeMatches(row, ["naan"]),
    };
    const predicate = predicates[normalizedLabel] || ((row) => normalize(row.componentType) === normalizedLabel);
    return [requirement(label, count, rows, predicate)];
  });
}

export function referencePickerModel(menu, station = "", selectedEntreeIds = []) {
  const rows = foodCostReferenceRows(menu, station);
  const allMenuRows = FOOD_COST_REFERENCE_ROWS.filter((row) => normalize(row.menu) === normalize(menu));
  const entrees = rows.filter(isPrimary);
  const selectedEntrees = selectedEntreeIds.map(foodCostReferenceRow).filter((row) => row && entrees.some((entree) => entree.id === row.id));
  const builds = [...new Set(selectedEntrees.map((row) => row.plateBuild))];
  const groups = builds.flatMap((build) => parsePlateBuild(build, rows).map((group) => group.rows.length
    ? group
    : (parsePlateBuild(build, allMenuRows).find((fallback) => fallback.key === group.key) || group)));
  const byKey = new Map();
  groups.forEach((group) => {
    const current = byKey.get(group.key);
    byKey.set(group.key, current ? { ...current, count: Math.max(current.count, group.count), rows: [...new Map([...current.rows, ...group.rows].map((row) => [row.id, row])).values()] } : group);
  });
  return {
    rows,
    entrees,
    groups: [...byKey.values()].filter((group) => group.rows.length),
    extensions: rows.filter((row) => normalize(row.componentType) === "extension"),
  };
}

const combinations = (rows, count, start = 0) => {
  if (count === 0) return [[]];
  const result = [];
  for (let index = start; index <= rows.length - count; index += 1) {
    combinations(rows, count - 1, index + 1).forEach((tail) => result.push([rows[index], ...tail]));
  }
  return result;
};

export function calculateReferencePlateRanges(menu, station, selectedIds = []) {
  const model = referencePickerModel(menu, station);
  const selected = [...new Map(selectedIds.map(foodCostReferenceRow).filter(Boolean).map((row) => [row.id, row])).values()];
  const selectedEntrees = selected.filter(isPrimary);
  return selectedEntrees.map((entree) => {
    const allMenuRows = FOOD_COST_REFERENCE_ROWS.filter((row) => normalize(row.menu) === normalize(menu));
    const requirements = parsePlateBuild(entree.plateBuild, model.rows).map((group) => group.rows.length
      ? group
      : (parsePlateBuild(entree.plateBuild, allMenuRows).find((fallback) => fallback.key === group.key) || group));
    const missing = [];
    const choices = requirements.map((group) => {
      const candidates = selected.filter((row) => group.rows.some((option) => option.id === row.id));
      if (candidates.length < group.count) missing.push(`${group.count} ${group.label}`);
      return combinations(candidates, group.count);
    });
    const relevantSelected = selected.filter((row) => row.id === entree.id || requirements.some((group) => group.rows.some((option) => option.id === row.id)));
    const missingCosts = relevantSelected.filter((row) => row.itemWasteCost == null).map((row) => row.displayName);
    if (entree.sellPrice == null) missing.push("entrée sell price");
    if (missingCosts.length) missing.push(`cost for ${missingCosts.join(", ")}`);
    if (missing.length) return { entree, missing, requirements };
    const products = choices.reduce((sets, next) => sets.flatMap((set) => next.map((items) => [...set, ...items])), [[]]);
    const costs = products.map((items) => entree.itemWasteCost + items.reduce((sum, row) => sum + row.itemWasteCost, 0));
    const low = Math.min(...costs);
    const high = Math.max(...costs);
    return { entree, requirements, low, high, lowPct: low / entree.sellPrice, highPct: high / entree.sellPrice };
  });
}

export function extensionFoodCost(row) {
  return row?.sellPrice && row?.itemWasteCost != null ? row.itemWasteCost / row.sellPrice : null;
}
