import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import ANALYSIS from "../src/data/allMenusWpAnalysis.json" with { type: "json" };
import { GLOBAL_ORDERING_PROGRAM } from "../src/features/commissary-ordering/globalCycleCatalog.js";

const root = resolve(import.meta.dirname, "..");
const outputPath = resolve(root, "src/features/commissary-ordering/globalProductionCatalog.js");
const round = (value) => Number(Number(value).toFixed(6));
const clean = (value) => String(value ?? "").normalize("NFKC").trim().replace(/\s+/g, " ");
const stripPrefix = (value) => clean(value).replace(/^(?:AMZ|EURNA|EUR|THJV|THS|RA|EXC|SUB):\s*/i, "");

const inUnitOnlyMrns = new Set(["5365.6"]); // Kielbasa Sausage — Alex review, 2026-11-05.
const excludedRecipeMrns = new Set(["60487"]); // Pork Brine is excluded from Week 3 production.
const reviewedSupplementalOutputs = Object.freeze({
  "global|amz-balti|212486.1|1-serving-s": [{
    id: "global-production|reviewed|butter-chicken-sauce",
    type: "subrecipe",
    mrn: "165741.16-sauce",
    name: "Butter Chicken Sauce",
    quantity: 1,
    unit: "portion",
    // EUR Butter Chicken cost $2.13 - 16 lb / 77 portions of chicken at $6.72/lb - Tikka Marinade $0.346667.
    costPerPortion: 0.38697,
    glCode: "4111011",
    sourceRecipeId: "BOOK_2-page-119",
  }],
});
const proteinName = /\b(chicken|beef|steak|brisket|pork|bacon|ham|turkey|lamb|duck|goat|salmon|tuna|shrimp|prawn|cod|steelhead|fish|seafood|crab|lobster|tilapia|mahi|pollock|trout|sausage|tofu|tempeh|paneer|jackfruit|portobello|eggplant)\b/i;
const unitPreparedName = /\b(rice|naan)\b/i;

function numberToken(value) {
  const token = clean(value).replace(/½/g, "1/2").replace(/¼/g, "1/4").replace(/¾/g, "3/4");
  if (/^\d+-\d+\/\d+$/.test(token)) {
    const [whole, fraction] = token.split("-");
    const [numerator, denominator] = fraction.split("/").map(Number);
    return Number(whole) + numerator / denominator;
  }
  if (/^\d+\/\d+$/.test(token)) {
    const [numerator, denominator] = token.split("/").map(Number);
    return numerator / denominator;
  }
  return Number(token);
}

function measurement(value) {
  const source = clean(value).toLowerCase().replace(/½/g, "1/2").replace(/¼/g, "1/4").replace(/¾/g, "3/4");
  const parts = [...source.matchAll(/(\d+(?:\.\d+)?(?:-\d+\/\d+)?|\d+\/\d+)\s*([a-z]+)/g)]
    .map((match) => ({ value: numberToken(match[1]), unit: match[2] }));
  if (!parts.length || parts.some(({ value: amount }) => !Number.isFinite(amount))) return null;
  const weight = { lb: 16, lbs: 16, pound: 16, pounds: 16, oz: 1, ounce: 1, ounces: 1 };
  const volume = { gal: 128, gallon: 128, gallons: 128, qt: 32, quart: 32, quarts: 32, cup: 8, cups: 8, floz: 1, tbsp: 0.5, tsp: 1 / 6 };
  if (parts.every(({ unit }) => unit in weight)) return { value: parts.reduce((sum, part) => sum + part.value * weight[part.unit], 0), unit: "ounce", family: "weight" };
  if (parts.every(({ unit }) => unit in volume)) return { value: parts.reduce((sum, part) => sum + part.value * volume[part.unit], 0), unit: "fluid ounce", family: "volume" };
  if (parts.length === 1) {
    const unit = { ea: "each", each: "each", piece: "each", pieces: "each", serving: "serving", servings: "serving" }[parts[0].unit] || parts[0].unit;
    return { value: parts[0].value, unit, family: unit };
  }
  return null;
}

const recipesById = new Map(ANALYSIS.recipes.map((recipe) => [recipe.id, recipe]));
const recipesByMrn = new Map();
for (const recipe of ANALYSIS.recipes) {
  const list = recipesByMrn.get(String(recipe.mrn)) || [];
  list.push(recipe);
  recipesByMrn.set(String(recipe.mrn), list);
}

function rootRecipe(item) {
  return (recipesByMrn.get(String(item.mrn)) || [])
    .sort((left, right) => (right.components?.length || 0) - (left.components?.length || 0))[0] || null;
}

function childPortions(edgeMeasure, child, parent, currentPortions) {
  const childPortion = measurement(child.portion);
  if (edgeMeasure && childPortion && edgeMeasure.family === childPortion.family && childPortion.value > 0) {
    return currentPortions * edgeMeasure.value / Number(parent.batchServings || 1) / childPortion.value;
  }
  if (Number(child.batchServings) > 0 && Number(parent.batchServings) > 0) {
    return currentPortions * Number(child.batchServings) / Number(parent.batchServings);
  }
  return currentPortions;
}

function collectOutputs(recipe, currentPortions = 1, seen = new Set()) {
  if (!recipe || seen.has(recipe.id)) return [];
  const nextSeen = new Set(seen).add(recipe.id);
  return (recipe.components || []).flatMap((edge) => {
    const child = recipesById.get(edge.childId);
    if (!child || excludedRecipeMrns.has(String(child.mrn)) || unitPreparedName.test(child.name)) return [];
    const edgeMeasure = measurement(edge.quantity);
    const quantity = edgeMeasure ? currentPortions * edgeMeasure.value / Number(recipe.batchServings || 1) : null;
    const portions = childPortions(edgeMeasure, child, recipe, currentPortions);
    if (proteinName.test(child.name)) return collectOutputs(child, portions, nextSeen);
    if (!(quantity > 0)) return [];
    return [{
      id: `global-production|${child.mrn || child.id}`,
      type: "subrecipe",
      mrn: String(child.mrn || ""),
      name: stripPrefix(child.name),
      quantity: round(quantity),
      unit: edgeMeasure.unit,
      costPerPortion: Number.isFinite(Number(child.cost)) ? round(Number(child.cost) * portions) : null,
      glCode: "4111011",
      sourceRecipeId: child.id,
    }];
  });
}

const rules = {};
for (const item of GLOBAL_ORDERING_PROGRAM.cycleWeeks.flatMap(({ menus }) => menus.flatMap(({ items }) => items)).filter(({ category }) => category === "entree")) {
  if (inUnitOnlyMrns.has(String(item.mrn))) {
    rules[item.id] = { mode: "in-unit", itemName: item.name, outputs: [] };
    continue;
  }
  const outputs = collectOutputs(rootRecipe(item));
  const combined = [...outputs, ...(reviewedSupplementalOutputs[item.id] || [])];
  const aggregated = new Map();
  for (const output of combined) {
    const key = `${output.mrn}|${output.name}|${output.unit}`;
    const prior = aggregated.get(key);
    aggregated.set(key, prior ? {
      ...prior,
      quantity: round(prior.quantity + output.quantity),
      costPerPortion: Number.isFinite(Number(prior.costPerPortion)) && Number.isFinite(Number(output.costPerPortion))
        ? round(Number(prior.costPerPortion) + Number(output.costPerPortion))
        : prior.costPerPortion ?? output.costPerPortion,
    } : output);
  }
  const deduped = [...aggregated.values()];
  rules[item.id] = { mode: deduped.length ? "recipe-tree" : "direct-components", itemName: item.name, outputs: deduped };
}

const payload = {
  version: 1,
  effectiveDate: "2026-11-16",
  source: {
    recipeGraph: ANALYSIS.basis,
    sourceSha256: ANALYSIS.sourceSha256,
    review: "Alex week-by-week Global commissary production review, 2026-11-05",
  },
  excludedRecipeMrns: [...excludedRecipeMrns],
  inUnitOnlyMrns: [...inUnitOnlyMrns],
  rules,
};

const output = `// Generated by scripts/build-global-commissary-production.mjs.\n// Reviewed recipe-output policy only; proprietary methods are not projected.\n\nexport const GLOBAL_COMMISSARY_PRODUCTION = Object.freeze(${JSON.stringify(payload, null, 2)});\n`;
if (process.argv.includes("--check")) {
  if (readFileSync(outputPath, "utf8").replace(/\r\n/g, "\n") !== output) throw new Error("Global commissary production catalog is stale.");
} else writeFileSync(outputPath, output);

console.log(JSON.stringify({
  rules: Object.keys(rules).length,
  recipeTree: Object.values(rules).filter(({ mode }) => mode === "recipe-tree").length,
  directComponents: Object.values(rules).filter(({ mode }) => mode === "direct-components").length,
  inUnit: Object.values(rules).filter(({ mode }) => mode === "in-unit").length,
  outputs: Object.values(rules).reduce((sum, rule) => sum + rule.outputs.length, 0),
}, null, 2));
