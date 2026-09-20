import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import XLSX from "xlsx";

import CATALOG from "../src/data/transferToolCatalog.json" with { type: "json" };

const root = process.cwd();
const sourcePath = resolve(root, "public/resources/Ingredient_Costing_9.19.26.xlsx");
const outputPath = resolve(root, "api/data/ingredientCosting91926.json");
const excludedIngredients = new Set(["water", "ice"]);

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

function isDirectIngredient(row) {
  return text(row["Usage Type"]).toLocaleLowerCase("en-US") === "ingredient"
    && text(row.Level) === "1"
    && ["AP", "EP"].includes(text(row["AP/EP/Rec"]).toLocaleUpperCase("en-US"));
}

function isCanonicalIngredientPrice(row, ingredientAmount, recipeYield) {
  return text(row["Recipe Name"]).startsWith("Ingredient:")
    && ingredientAmount?.quantity === 1
    && Number(recipeYield) === 1;
}

function selectedUnitPrice(candidates = []) {
  // Only canonical Ingredient: recipes represent standardized ingredient prices.
  // A menu recipe's Recipe Portion Cost is its whole-portion cost, not the
  // price of the ingredient on that row.
  return candidates[0] || null;
}

function main() {
  const workbook = XLSX.readFile(sourcePath, { raw: false });
  const recipeRows = [];
  const unitPriceCandidates = new Map();

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
      if (isCanonicalIngredientPrice(row, ingredientAmount, base.recipeYield) && base.unitPrice != null && !base.excluded) {
        const key = `${ingredientMrn}|${ingredientAmount.unit}`;
        const candidates = unitPriceCandidates.get(key) || [];
        candidates.push(base);
        unitPriceCandidates.set(key, candidates);
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

  for (const row of recipeRows) {
    if (!catalogMrns.has(row.recipeMrn) || row.excluded || !Number.isFinite(row.recipeYield) || row.recipeYield <= 0 || !/^\d{7}$/.test(row.glCode)) continue;
    const priceBasis = selectedUnitPrice(unitPriceCandidates.get(`${row.ingredientMrn}|${row.unit}`));
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
    const allocation = Number((row.quantity / row.recipeYield * priceBasis.unitPrice).toFixed(4));
    if (!(allocation > 0)) continue;
    addComponent(row.recipeMrn, row, componentKey, {
      ingredientMrn: row.ingredientMrn,
      ingredientName: row.ingredientName,
      quantity: row.quantity,
      unit: row.unit,
      recipeYield: row.recipeYield,
      unitPrice: priceBasis.unitPrice,
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
      lookupMethod: "Canonical Ingredient: recipe with the same ingredient MRN and unit (one-unit, yield-one standard price).",
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
