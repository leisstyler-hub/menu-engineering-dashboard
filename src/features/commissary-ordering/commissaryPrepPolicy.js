export const COMMISSARY_COMPONENT_SCOPE_EFFECTIVE_DATE = "2026-11-16";

const excludedLoosePrepItem = /\b(canola(?: oil)?|kosher salt|black pepper)\b|^spice,/i;
const PORTO_POTATO_WEDGE_ID = "global|amz-porto|121015|4-oz-portion";

const animalProtein = /\b(chicken|beef|steak|brisket|pork|bacon|ham|turkey|lamb|duck|goat|salmon|tuna|shrimp|prawn|cod|steelhead|fish|seafood|crab|lobster|tilapia|mahi|pollock|trout|anchov|sausage|pepperoni|salami|mortadella|prosciutto|patty)\b/i;
const explicitlyPrepared = /\b(pre[- ]?cooked|fully cooked|cooked|roasted|grilled|braised|smoked|cured|canned|pouch|deli|rotisserie|confit|pulled)\b/i;
const plantBased = /\b(plant[- ]?based|meatless|vegan|tofu|tempeh|bean|lentil)\b/i;
const preparedFlavorComponent = /\b(sauce|broth|stock|bouillon|base|seasoning|extract|gelatin)\b/i;
const rawCut = /\b(breast|thigh|fillet|ground|patty|tenderloin|loin|shoulder|chop|rib|wing|drumstick)\b/i;

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

export function isExcludedLoosePrepItem(name = "") {
  return excludedLoosePrepItem.test(String(name || ""));
}
