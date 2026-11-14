export const COMMISSARY_COMPONENT_SCOPE_EFFECTIVE_DATE = "2026-11-16";

import { GLOBAL_COMMISSARY_PRODUCTION } from "./globalProductionCatalog.js";

const excludedLoosePrepItem = /\b(canola(?: oil)?|kosher salt|black pepper)\b|^spice,/i;
const PORTO_POTATO_WEDGE_ID = "global|amz-porto|121015|4-oz-portion";

export const GRILL_UNIT_SUPPLIED_COMPONENTS = Object.freeze([
  Object.freeze({ mrn: "170538", name: "Burger, Meatless, Black Bean" }),
  Object.freeze({ mrn: "144591.1", name: "AMZ: Grilled Chicken Breast" }),
  Object.freeze({ mrn: "7411", name: "Salt, Kosher" }),
]);

const grillUnitSuppliedMrns = new Set(GRILL_UNIT_SUPPLIED_COMPONENTS.map(({ mrn }) => mrn));
const grillUnitSuppliedNames = /\b(?:black bean burger|grilled chicken breast|salt,?\s*kosher|kosher salt)\b/i;

const animalProtein = /\b(chicken|beef|steak|brisket|pork|bacon|ham|turkey|lamb|duck|goat|salmon|tuna|shrimp|prawn|cod|steelhead|fish|seafood|crab|lobster|tilapia|mahi|pollock|trout|anchov|sausage|pepperoni|salami|mortadella|prosciutto|patty)\b/i;
const explicitlyPrepared = /\b(pre[- ]?cooked|fully cooked|cooked|roasted|grilled|braised|smoked|cured|canned|pouch|deli|rotisserie|confit|pulled)\b/i;
const plantBased = /\b(plant[- ]?based|meatless|vegan|tofu|tempeh|bean|lentil)\b/i;
const preparedFlavorComponent = /\b(sauce|broth|stock|bouillon|base|seasoning|extract|gelatin)\b/i;
const rawCut = /\b(breast|thigh|fillet|ground|patty|tenderloin|loin|shoulder|chop|rib|wing|drumstick)\b/i;
const unitPlantProtein = /\b(plant[- ]?based|meatless|tofu|tempeh|paneer|jackfruit|portobello|eggplant)\b/i;

export function isRawAnimalProteinComponent(name = "") {
  const value = String(name || "");
  return animalProtein.test(value)
    && !explicitlyPrepared.test(value)
    && !plantBased.test(value)
    && (!preparedFlavorComponent.test(value) || rawCut.test(value));
}

export function filterCommissaryComponents(components = [], weekStart = "") {
  if (!weekStart || weekStart < COMMISSARY_COMPONENT_SCOPE_EFFECTIVE_DATE) return components;
  return components.filter(({ name }) => !isRawAnimalProteinComponent(name));
}

export function filterGrillCommissaryComponents(components = [], weekStart = "") {
  const scoped = filterCommissaryComponents(components, weekStart);
  if (!weekStart || weekStart < COMMISSARY_COMPONENT_SCOPE_EFFECTIVE_DATE) return scoped;
  return scoped.filter(({ mrn, name }) => !grillUnitSuppliedMrns.has(String(mrn || "")) && !grillUnitSuppliedNames.test(String(name || "")));
}

export function prepareCommissaryComponents(components = [], weekStart = "", sourceId = "") {
  const scoped = filterCommissaryComponents(components, weekStart);
  if (!weekStart || weekStart < COMMISSARY_COMPONENT_SCOPE_EFFECTIVE_DATE) return scoped;

  const retained = scoped.filter(({ name }) => !excludedLoosePrepItem.test(String(name || "")));
  if (sourceId !== PORTO_POTATO_WEDGE_ID) return retained;

  const seasoningTablespoons = scoped
    .filter(({ name }) => excludedLoosePrepItem.test(String(name || "")) && !/canola/i.test(String(name || "")))
    .reduce((sum, component) => sum + (Number(component.quantity || 0) * (/^tsp$/i.test(component.unit) ? 1 / 3 : 1)), 0);
  if (!(seasoningTablespoons > 0)) return retained;
  return [...retained, {
    id: "global-prep|recipe|porto-piri-piri-potato-wedge-spice-mix|tbsp",
    type: "subrecipe",
    mrn: "",
    name: "Piri Piri Potato Wedge Spice Mix",
    quantity: Number(seasoningTablespoons.toFixed(6)),
    unit: "tbsp",
  }];
}

function globalRule(sourceId = "") {
  return GLOBAL_COMMISSARY_PRODUCTION.rules[sourceId] || null;
}

function sourceUsesPlantProtein(sourceId = "") {
  return unitPlantProtein.test(String(globalRule(sourceId)?.itemName || ""));
}

function isUnitProteinComponent(name = "", sourceId = "") {
  return isRawAnimalProteinComponent(name) || (sourceUsesPlantProtein(sourceId) && unitPlantProtein.test(String(name || "")));
}

export function prepareGlobalCommissaryComponents(components = [], weekStart = "", sourceId = "") {
  if (!weekStart || weekStart < GLOBAL_COMMISSARY_PRODUCTION.effectiveDate) return components;
  const rule = globalRule(sourceId);
  if (rule?.mode === "in-unit") return [];
  if (rule?.outputs?.length) return rule.outputs;
  if (!rule) return prepareCommissaryComponents(components, weekStart, sourceId);
  return components.filter(({ name }) => !isUnitProteinComponent(name, sourceId) && !excludedLoosePrepItem.test(String(name || "")));
}

export function prepareGlobalTransferComponents(components = [], weekStart = "", sourceId = "") {
  if (!weekStart || weekStart < GLOBAL_COMMISSARY_PRODUCTION.effectiveDate) return components;
  const rule = globalRule(sourceId);
  if (rule?.mode === "in-unit") return [];
  if (rule?.outputs?.length) return rule.outputs.map((output) => ({
    id: `global-transfer|production|${output.mrn || output.id}`,
    mrn: output.mrn,
    name: output.name,
    quantity: output.quantity,
    unit: output.unit,
    costPerPortion: output.costPerPortion,
    glCode: output.glCode || "4111011",
  }));
  return components.filter(({ name }) => !isUnitProteinComponent(name, sourceId));
}

export function isExcludedLoosePrepItem(name = "") {
  return excludedLoosePrepItem.test(String(name || ""));
}
