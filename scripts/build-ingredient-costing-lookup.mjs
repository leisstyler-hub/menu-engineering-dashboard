import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import XLSX from "xlsx";

import CATALOG from "../src/data/transferToolCatalog.json" with { type: "json" };

const root = process.cwd();
const sourcePath = resolve(root, "public/resources/Ingredient_Costing_9.19.26.xlsx");
const outputPath = resolve(root, "api/data/ingredientCosting91926.json");
const excludedIngredients = new Set(["water", "ice"]);
const volumeUnitsInTablespoons = new Map([["cup", 16], ["floz", 2], ["tbsp", 1], ["tsp", 1 / 3]]);
const weightUnitsInOunces = new Map([["pound", 16], ["ounce", 1]]);
// These descriptors do not distinguish the food or its usable form. They are
// intentionally narrow: a form such as chopped, shredded, sliced, or diced
// remains part of the signature and must agree before a cross-MRN reference is
// accepted.
const nonCanonicalDescriptors = new Set([
  "ingredient", "fresh", "frozen", "bulk", "fancy", "pre", "each", "brand",
  "sales", "foodservice", "food", "product", "pack", "case", "bag", "box",
  "can", "bottle", "jar", "pouch", "rtb", "rte", "ap", "ep",
]);
const signatureTokenAliases = new Map([
  ["tomatoes", "tomato"], ["potatoes", "potato"], ["berries", "berry"],
  ["cheeses", "cheese"], ["leaves", "leaf"], ["onions", "onion"],
  ["peppers", "pepper"], ["chiles", "chile"], ["chilies", "chile"],
]);

const text = (value) => String(value ?? "").trim();
const mrn = (value) => text(value).replace(/^'/, "");
const money = (value) => Number(text(value).replace(/[$,]/g, ""));

function amountNumber(value) {
  const normalized = text(value).replace(/\s+/g, " ");
  if (!normalized) return null;
  const mixed = normalized.match(/^(\d+)-(\d+)\/(\d+)$/);
  if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
  const fraction = normalized.match(/^(\d+)\/(\d+)$/);
  if (fraction) return Number(fraction[1]) / Number(fraction[2]);
  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? numeric : null;
}

function parseIngredientAmount(value) {
  const matched = text(value).match(/^(.+?)\s*x\s+(.+)$/i);
  if (!matched) return null;
  const quantity = amountNumber(matched[1]);
  const unit = text(matched[2]).toLocaleLowerCase("en-US");
  return Number.isFinite(quantity) && quantity > 0 && unit ? { quantity, unit } : null;
}

function unitKey(value) {
  const unit = text(value).toLocaleLowerCase("en-US");
  return new Map([["cups", "cup"], ["ounces", "ounce"], ["pounds", "pound"], ["tablespoon", "tbsp"], ["tablespoons", "tbsp"], ["teaspoon", "tsp"], ["teaspoons", "tsp"], ["fl oz", "floz"], ["fluid ounce", "floz"], ["fluid ounces", "floz"]]).get(unit) || unit;
}

function ingredientSignature(value) {
  const tokens = text(value)
    .toLocaleLowerCase("en-US")
    .replace(/\bpre[-\s]/g, "")
    .replace(/[^a-z0-9/]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => signatureTokenAliases.get(token) || token)
    .filter((token) => !nonCanonicalDescriptors.has(token));
  return [...new Set(tokens)].sort().join("|");
}

function signatureTokens(signature) {
  return signature ? signature.split("|") : [];
}

function matchingIngredientForm(targetSignature, candidateSignature) {
  if (!targetSignature || !candidateSignature) return false;
  if (targetSignature === candidateSignature) return true;
  const target = new Set(signatureTokens(targetSignature));
  const candidate = signatureTokens(candidateSignature);
  // A longer, form-specific canonical reference may be embedded in an
  // ingredient name that adds a supplier or packaging descriptor. Do not use
  // a generic one-token match (for example, just "tomato").
  return candidate.length >= 2 && candidate.every((token) => target.has(token));
}

function supportsShreddedCheeseDensity(signature) {
  const tokens = new Set(signatureTokens(signature));
  return tokens.has("cheese") && (tokens.has("shredded") || tokens.has("grated"));
}

function convertAmount(amount, fromUnit, toUnit, { allowSliceEach = false, ingredientForm = "" } = {}) {
  const from = unitKey(fromUnit);
  const to = unitKey(toUnit);
  if (from === to) return amount;
  if (volumeUnitsInTablespoons.has(from) && volumeUnitsInTablespoons.has(to)) return amount * volumeUnitsInTablespoons.get(from) / volumeUnitsInTablespoons.get(to);
  if (weightUnitsInOunces.has(from) && weightUnitsInOunces.has(to)) return amount * weightUnitsInOunces.get(from) / weightUnitsInOunces.get(to);
  // Culinary standard for loose shredded/grated cheese: 1 ounce = 1/4 cup
  // (4 tablespoons). It is applied only when the food-form signature retains
  // both "cheese" and "shredded" or "grated".
  if (supportsShreddedCheeseDensity(ingredientForm)) {
    if (weightUnitsInOunces.has(from) && volumeUnitsInTablespoons.has(to)) return amount * weightUnitsInOunces.get(from) * 4 / volumeUnitsInTablespoons.get(to);
    if (volumeUnitsInTablespoons.has(from) && weightUnitsInOunces.has(to)) return amount * volumeUnitsInTablespoons.get(from) / 4 / weightUnitsInOunces.get(to);
  }
  if (allowSliceEach && ((from === "slice" && to === "each") || (from === "each" && to === "slice"))) return amount;
  return null;
}

function isDirectIngredient(row) {
  return text(row["Usage Type"]).toLocaleLowerCase("en-US") === "ingredient"
    && text(row.Level) === "1"
    && ["AP", "EP"].includes(text(row["AP/EP/Rec"]).toLocaleUpperCase("en-US"));
}

function isCanonicalIngredientPrice(row, recipeYield) {
  return text(row["Recipe Name"]).startsWith("Ingredient:")
    && Number.isFinite(Number(recipeYield))
    && Number(recipeYield) > 0;
}

function selectedUnitPrice(candidates = [], requestedUnit, { allowSliceEach = false, ingredientForm = "" } = {}) {
  // Only canonical Ingredient: recipes represent standardized ingredient prices.
  // A menu recipe's Recipe Portion Cost is its whole-portion cost, not the
  // price of the ingredient on that row.
  const exact = candidates.find((candidate) => unitKey(candidate.unit) === unitKey(requestedUnit));
  if (exact) return exact;
  return candidates.find((candidate) => convertAmount(1, requestedUnit, candidate.unit, { allowSliceEach, ingredientForm }) != null) || null;
}

function main() {
  const workbook = XLSX.readFile(sourcePath, { raw: false });
  const recipeRows = [];
  const unitPriceCandidates = new Map();
  const canonicalPriceCandidates = [];

  for (const sheetName of workbook.SheetNames) {
    if (sheetName === "_Source Map") continue;
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "", raw: false });
    for (const row of rows) {
      const ingredientMrn = mrn(row["Ingredient MRN"]);
      const recipeMrn = mrn(row["Recipe MRN"]);
      const ingredientAmount = parseIngredientAmount(row["Ingredient Amount"]);
      if (!ingredientMrn || !recipeMrn || !ingredientAmount || !isDirectIngredient(row)) continue;
      const ingredientName = text(row["Ingredient Name"]);
      const normalizedName = ingredientName.toLocaleLowerCase("en-US");
      const cost = money(row["Recipe Portion Cost"]);
      const glCode = text(row["S4 G/L Code"]);
      const base = {
        ingredientMrn,
        ingredientName,
        recipeMrn,
        recipeName: text(row["Recipe Name"]),
        recipeYield: amountNumber(row["Recipe Yield"]),
        quantity: ingredientAmount.quantity,
        unit: ingredientAmount.unit,
        unitPrice: Number.isFinite(cost) && cost > 0 ? cost : null,
        glCode,
        excluded: excludedIngredients.has(normalizedName),
      };
      recipeRows.push(base);
      if (isCanonicalIngredientPrice(row, base.recipeYield) && base.unitPrice != null && !base.excluded) {
        const candidates = unitPriceCandidates.get(ingredientMrn) || [];
        candidates.push(base);
        unitPriceCandidates.set(ingredientMrn, candidates);
        canonicalPriceCandidates.push({
          ...base,
          canonicalSignature: ingredientSignature(base.recipeName.replace(/^Ingredient:\s*/i, "")),
          ingredientSignature: ingredientSignature(base.ingredientName),
        });
      }
    }
  }

  const catalogMrns = new Set(CATALOG.items.map((item) => mrn(item.mrn)).filter(Boolean));
  const recipes = {};
  const addComponent = (recipeMrn, row, key, component) => {
    const current = recipes[recipeMrn] || { recipeName: row.recipeName, components: [], unpricedComponents: [], seen: new Set() };
    if (!current.seen.has(key)) {
      current.seen.add(key);
      component.allocationPerPortion == null ? current.unpricedComponents.push(component) : current.components.push(component);
    }
    recipes[recipeMrn] = current;
  };

  const priceBasisFor = (row) => {
    const targetSignature = ingredientSignature(row.ingredientName);
    const direct = selectedUnitPrice(unitPriceCandidates.get(row.ingredientMrn), row.unit, { ingredientForm: targetSignature });
    if (direct) return { priceBasis: direct, source: "exact MRN" };

    const formMatches = canonicalPriceCandidates.filter((candidate) => (
      matchingIngredientForm(targetSignature, candidate.canonicalSignature)
      || matchingIngredientForm(targetSignature, candidate.ingredientSignature)
    ));
    const allowsSliceEach = targetSignature.includes("slice") && formMatches.some((candidate) => candidate.canonicalSignature.includes("slice") || candidate.ingredientSignature.includes("slice"));
    const matched = selectedUnitPrice(formMatches, row.unit, { allowSliceEach: allowsSliceEach, ingredientForm: targetSignature });
    return matched ? { priceBasis: matched, source: "normalized ingredient form", allowsSliceEach } : null;
  };

  for (const row of recipeRows) {
    if (!catalogMrns.has(row.recipeMrn) || row.excluded || !Number.isFinite(row.recipeYield) || row.recipeYield <= 0 || !/^\d{7}$/.test(row.glCode)) continue;
    const source = priceBasisFor(row);
    const priceBasis = source?.priceBasis;
    const componentKey = [row.ingredientMrn, row.quantity, row.unit, row.recipeYield, row.glCode].join("|");
    if (!priceBasis) {
      addComponent(row.recipeMrn, row, componentKey, {
        ingredientMrn: row.ingredientMrn,
        ingredientName: row.ingredientName,
        quantity: row.quantity,
        unit: row.unit,
        recipeYield: row.recipeYield,
        glCode: row.glCode,
        allocationPerPortion: null,
      });
      continue;
    }
    const requestedQuantity = row.quantity / row.recipeYield;
    const sourceQuantity = convertAmount(requestedQuantity, row.unit, priceBasis.unit, { allowSliceEach: Boolean(source.allowsSliceEach), ingredientForm: ingredientSignature(row.ingredientName) });
    const sourceUnitCost = priceBasis.unitPrice * priceBasis.recipeYield / priceBasis.quantity;
    const allocation = Number((sourceQuantity / priceBasis.quantity * priceBasis.unitPrice * priceBasis.recipeYield).toFixed(4));
    const oneRequestedUnitInSource = convertAmount(1, row.unit, priceBasis.unit, { allowSliceEach: Boolean(source.allowsSliceEach), ingredientForm: ingredientSignature(row.ingredientName) });
    const unitPrice = Number((oneRequestedUnitInSource * sourceUnitCost).toFixed(4));
    if (!(allocation > 0)) continue;
    addComponent(row.recipeMrn, row, componentKey, {
      ingredientMrn: row.ingredientMrn,
      ingredientName: row.ingredientName,
      quantity: row.quantity,
      unit: row.unit,
      recipeYield: row.recipeYield,
      unitPrice,
      priceSourceMrn: priceBasis.ingredientMrn,
      priceSourceUnit: priceBasis.unit,
      priceSourceNote: `${source.source === "exact MRN"
        ? "Canonical Ingredient: price reference."
        : "Canonical normalized ingredient-form price reference."}${supportsShreddedCheeseDensity(ingredientSignature(row.ingredientName)) && unitKey(row.unit) !== unitKey(priceBasis.unit)
        ? " Shredded/grated cheese uses 4 tablespoons per ounce."
        : ""}`,
      glCode: row.glCode,
      allocationPerPortion: allocation,
    });
  }

  const compactRecipes = Object.fromEntries(Object.entries(recipes).map(([recipeMrn, recipe]) => [recipeMrn, {
    recipeName: recipe.recipeName,
    components: recipe.components.sort((a, b) => a.ingredientName.localeCompare(b.ingredientName)),
    unpricedComponents: recipe.unpricedComponents.sort((a, b) => a.ingredientName.localeCompare(b.ingredientName)),
  }]));
  const payload = {
    resource: {
      title: "Ingredient Costing 9.19.26",
      file: "/resources/Ingredient_Costing_9.19.26.xlsx",
      lookupMethod: "Canonical Ingredient: price references, using exact MRN first and then high-confidence normalized ingredient-form matching. Includes cup/tablespoon/teaspoon/fluid-ounce, pound/ounce, slice/each conversions when the matched ingredient form explicitly identifies a slice, and the standard 4-tablespoons-per-ounce conversion for shredded/grated cheese.",
    },
    recipes: compactRecipes,
  };
  const rendered = `${JSON.stringify(payload, null, 2)}\n`;
  if (process.argv.includes("--check")) {
    if (readFileSync(outputPath, "utf8") !== rendered) throw new Error("Ingredient Costing lookup is stale. Run node scripts/build-ingredient-costing-lookup.mjs.");
    console.log(`Ingredient Costing lookup is current: ${Object.keys(compactRecipes).length} recipes.`);
    return;
  }
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, rendered);
  console.log(`Built Ingredient Costing lookup: ${Object.keys(compactRecipes).length} recipes.`);
}

main();
