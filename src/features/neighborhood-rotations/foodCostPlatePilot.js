import reference from "../../data/foodCostPlateReference.json";

const PILOT_WEEK_START = "2026-08-17";
export const REFERENCE_CALCULATION_PROFILES = Object.freeze({
  fishMarketAutomatic: "fish-market-automatic",
  grillSideExtremes: "grill-side-extremes",
});
const FISH_MARKET_NON_SAUCE_MRNS = new Set(["1261"]);
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

export function isFoodCostReferenceMenu(menu) {
  return FOOD_COST_REFERENCE_ROWS.some((row) => normalize(row.menu) === normalize(menu) && isPrimary(row));
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
  const menuRows = FOOD_COST_REFERENCE_ROWS.filter((row) => normalize(row.menu) === normalize(menu));
  const stationRows = station ? menuRows.filter((row) => normalize(row.station) === normalize(station)) : menuRows;
  const identityMatches = (rows) => {
    const mrnRows = mrn ? rows.filter((row) => normalize(row.mrn) === normalize(mrn)) : [];
    return mrnRows.find((row) => normalize(row.portion) === normalize(portion) && normalize(row.displayName) === normalize(itemName))
      || mrnRows.find((row) => normalize(row.displayName) === normalize(itemName))
      || mrnRows[0]
      || rows.find((row) => normalize(row.portion) === normalize(portion) && normalize(row.displayName) === normalize(itemName))
      || rows.find((row) => normalize(row.displayName) === normalize(itemName));
  };
  return (identityMatches(stationRows) || identityMatches(menuRows))?.id || "";
}

const plural = (label, count) => count === 1 ? label : `${label}s`;
const requirement = (label, count, rows, predicate) => ({
  key: normalize(label).replace(/[^a-z0-9]+/g, "-"),
  label,
  count,
  rows: rows.filter(predicate),
  storageGroup: normalize(label).startsWith("sub recipe") ? "subRecipes" : "sides",
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

const referenceIdentityKey = (row) => [normalize(row.displayName), normalize(row.mrn), normalize(row.portion), row.itemWasteCost].join("|");
const uniqueCostedRows = (rows) => [...new Map(rows
  .filter((row) => row.itemWasteCost != null)
  .map((row) => [referenceIdentityKey(row), row])).values()];
const sortedByReferenceCost = (rows) => uniqueCostedRows(rows).sort((left, right) => left.itemWasteCost - right.itemWasteCost
  || left.displayName.localeCompare(right.displayName)
  || left.id.localeCompare(right.id));
const grillExtremeSideRows = (rows) => {
  const sorted = sortedByReferenceCost(rows);
  return [...new Map([...sorted.slice(0, 2), ...sorted.slice(-2)].map((row) => [referenceIdentityKey(row), row])).values()];
};

export function calculateReferencePlateRanges(menu, station, selectedIds = [], { profile = "" } = {}) {
  const normalizedMenu = normalize(menu);
  const calculationProfile = profile === REFERENCE_CALCULATION_PROFILES.fishMarketAutomatic && normalizedMenu === "amz: fish market"
    ? profile
    : profile === REFERENCE_CALCULATION_PROFILES.grillSideExtremes && normalizedMenu === "amz: grill core"
      ? profile
      : "";
  const selected = [...new Map(selectedIds.map(foodCostReferenceRow).filter(Boolean).map((row) => [row.id, row])).values()];
  const selectedEntrees = selected.filter((row) => normalize(row.menu) === normalize(menu) && isPrimary(row));
  return selectedEntrees.map((entree) => {
    const allMenuRows = FOOD_COST_REFERENCE_ROWS.filter((row) => normalize(row.menu) === normalize(menu));
    const primaryStationRows = foodCostReferenceRows(menu, entree.station || station);
    const allMenuRequirements = parsePlateBuild(entree.plateBuild, allMenuRows);
    const requirements = parsePlateBuild(entree.plateBuild, primaryStationRows).map((group) => {
      const fallback = allMenuRequirements.find((candidate) => candidate.key === group.key);
      if (normalize(menu) === "amz: anisa") return fallback || group;
      return group.rows.length ? group : (fallback || group);
    });
    const missing = [];
    const automaticTiers = new Map();
    const choices = requirements.map((group) => {
      let candidates = selected.filter((row) => group.rows.some((option) => option.id === row.id));
      if (calculationProfile === REFERENCE_CALCULATION_PROFILES.fishMarketAutomatic) {
        candidates = sortedByReferenceCost(group.rows.filter((row) => group.storageGroup !== "subRecipes" || !FISH_MARKET_NON_SAUCE_MRNS.has(row.mrn)));
      }
      if (calculationProfile === REFERENCE_CALCULATION_PROFILES.grillSideExtremes && group.storageGroup === "sides") {
        candidates = grillExtremeSideRows(group.rows);
        candidates.forEach((row, index) => automaticTiers.set(row.id, index < 2 ? "Lowest-cost side" : "Highest-cost side"));
        if (candidates.length < 4) missing.push("reference cost for 4 unique Grill Core sides");
      }
      if (candidates.length < group.count) missing.push(calculationProfile ? `reference cost for ${group.count} ${group.label}` : `${group.count} ${group.label}`);
      return combinations(candidates, group.count);
    });
    const relevantSelected = selected.filter((row) => row.id === entree.id || requirements.some((group) => group.rows.some((option) => option.id === row.id)));
    const missingCosts = relevantSelected.filter((row) => row.itemWasteCost == null).map((row) => row.displayName);
    if (entree.sellPrice == null) missing.push("entrée sell price");
    if (missingCosts.length) missing.push(`cost for ${missingCosts.join(", ")}`);
    if (missing.length) return { entree, missing, requirements };
    const products = choices.reduce((sets, next) => sets.flatMap((set) => next.map((items) => [...set, ...items])), [[]]);
    const outcomes = products.map((items) => {
      const cost = entree.itemWasteCost + items.reduce((sum, row) => sum + row.itemWasteCost, 0);
      return { items, cost, foodCostPct: cost / entree.sellPrice, tier: items.length === 1 ? automaticTiers.get(items[0].id) || "" : "" };
    });
    const orderedOutcomes = [...outcomes].sort((left, right) => left.cost - right.cost);
    const lowOutcome = orderedOutcomes[0];
    const highOutcome = orderedOutcomes.at(-1);
    return {
      entree,
      requirements,
      low: lowOutcome.cost,
      high: highOutcome.cost,
      lowPct: lowOutcome.foodCostPct,
      highPct: highOutcome.foodCostPct,
      profile: calculationProfile,
      lowOutcome,
      highOutcome,
      automaticOptions: calculationProfile === REFERENCE_CALCULATION_PROFILES.grillSideExtremes ? outcomes : [],
    };
  });
}

export function extensionFoodCost(row) {
  return row?.sellPrice && row?.itemWasteCost != null ? row.itemWasteCost / row.sellPrice : null;
}
