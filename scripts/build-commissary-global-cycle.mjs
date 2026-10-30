import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import COSTING from "../api/data/ingredientCosting91926.json" with { type: "json" };

const root = resolve(import.meta.dirname, "..");
const menuItemsPath = resolve(root, "src/data/menuItems.json");
const catalogPath = resolve(root, "src/features/commissary-ordering/globalCycleCatalog.js");

const cycleScopes = [
  [{ menu: "AMZ: Porto", label: "Porto" }, { menu: "AMZ: Taco Total", label: "Taco Total" }],
  [{ menu: "AMZ: Lemongrass + Lime", label: "Lemongrass + Lime" }, { menu: "AMZ: Chiang Mai", label: "Chiang Mai" }],
  [{ menu: "AMZ: Anisa", label: "Anisa" }, { menu: "AMZ: Cypress", label: "Cypress" }],
  [{ menu: "AMZ: Balti", label: "Balti" }, { menu: "AMZ: Street Eats", station: "Naan Nomad", label: "Naan Nomad" }],
  [{ menu: "AMZ: Lotus", label: "Lotus" }, { menu: "AMZ: House of Teriyaki", label: "House of Teriyaki" }],
  [{ menu: "AMZ: Smokehouse BBQ", label: "Smokehouse BBQ" }, { menu: "AMZ: Roam BBQ", label: "Roam BBQ" }],
];

const supplementalMrns = {
  balti: [
    "165741.111", "212486.1", "212486.4", "212486.7", "212486.6", "212486.10", "212486.2", "212486.8",
    "212486.3", "212486.9", "212486.19", "212486.21", "212486.20", "212486.12", "212486.13", "212486",
    "212486.22", "212486.15", "212486.17", "212486.5", "212486.14", "212486.18", "212486.16", "212486.11",
  ],
  teriyaki: ["83251.2", "107142.158", "80766.4"],
  bbq: ["201508", "36688.2", "170726", "183070.5"],
};

const text = (value) => String(value ?? "").normalize("NFKC").trim().replace(/\s+/g, " ");
const mrn = (value) => text(value).replace(/^'/, "");
const slug = (value) => text(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const round = (value) => Number(Number(value).toFixed(6));
const hashFile = (path) => createHash("sha256").update(readFileSync(path)).digest("hex");

function numberToken(value) {
  const token = text(value).replace(/½/g, "1/2").replace(/¼/g, "1/4").replace(/¾/g, "3/4");
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

function parseQuantity(value) {
  const source = text(value).toLowerCase().replace(/½/g, "1/2").replace(/¼/g, "1/4").replace(/¾/g, "3/4");
  const parts = [...source.matchAll(/(\d+(?:\.\d+)?(?:-\d+\/\d+)?|\d+\/\d+)\s*([a-z]+)/g)]
    .map((match) => ({ value: numberToken(match[1]), unit: match[2] }));
  if (!parts.length || parts.some(({ value: amount }) => !Number.isFinite(amount))) throw new Error(`Unsupported Global ingredient quantity: ${value}`);
  const weight = { lb: 16, lbs: 16, pound: 16, pounds: 16, oz: 1, ounce: 1, ounces: 1 };
  const volume = { gal: 16, gallon: 16, gallons: 16, qt: 4, quart: 4, quarts: 4, cup: 1, cups: 1, floz: 1 / 8, tbsp: 1 / 16, tsp: 1 / 48 };
  if (parts.every(({ unit }) => unit in weight)) return { quantity: round(parts.reduce((sum, row) => sum + row.value * weight[row.unit], 0)), unit: "ounce" };
  if (parts.every(({ unit }) => unit in volume)) return { quantity: round(parts.reduce((sum, row) => sum + row.value * volume[row.unit], 0)), unit: "cup" };
  if (parts.length === 1) {
    const aliases = { ea: "each", each: "each", piece: "each", pieces: "each", slice: "slice", slices: "slice", spray: "spray", sprays: "spray", bunch: "bunch", bunches: "bunch" };
    return { quantity: round(parts[0].value), unit: aliases[parts[0].unit] || parts[0].unit };
  }
  throw new Error(`Mixed Global ingredient units are unsupported: ${value}`);
}

function prepComponent({ name, componentMrn = "", type = "ingredient", quantity, unit, servings }) {
  const cleanName = text(name).replace(/^\s*\u2615\s*/, "");
  const cleanMrn = mrn(componentMrn);
  return {
    id: `global-prep|${type}|${cleanMrn || slug(cleanName)}|${unit}`,
    type,
    mrn: cleanMrn,
    name: cleanName,
    quantity: round(Number(quantity) / Number(servings)),
    unit,
  };
}

function lookupComponents(recipeMrn) {
  const recipe = COSTING.recipes[mrn(recipeMrn)];
  if (!recipe) return null;
  const rows = [...(recipe.components || []), ...(recipe.unpricedComponents || [])];
  if (!rows.length) return null;
  return rows.map((component) => prepComponent({
    name: component.ingredientName,
    componentMrn: component.ingredientMrn,
    type: /^(amz|eur|eurna|ra|sub|thjv|exc):/i.test(text(component.ingredientName)) ? "subrecipe" : "ingredient",
    quantity: component.quantity,
    unit: component.unit,
    servings: component.recipeYield,
  }));
}

async function pdfComponents(path, requiredMrns) {
  const document = await pdfjs.getDocument({ data: new Uint8Array(readFileSync(path)), disableWorker: true }).promise;
  const wanted = new Set(requiredMrns);
  const result = {};
  for (let pageNumber = 1; pageNumber <= document.numPages && wanted.size; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    const items = content.items.filter((item) => text(item.str)).map((item) => ({ value: text(item.str), x: item.transform[4], y: item.transform[5] }));
    const pageText = items.map(({ value }) => value).join(" ");
    const recipeMrn = [...wanted].find((candidate) => pageText.includes(`(${candidate})`));
    if (!recipeMrn) continue;
    const ingredientHeader = items.find((item) => item.value === "Ingredients");
    const methodHeader = items.find((item) => item.value === "Method");
    if (!ingredientHeader || !methodHeader) continue;
    const livePortions = Number(pageText.match(/;\s*(\d+(?:\.\d+)?)\s*\([^)]*\)\s*Maximum Production/i)?.[1]
      || pageText.match(/Total to Produce:\s*(\d+(?:\.\d+)?)/i)?.[1]);
    if (!(livePortions > 0)) throw new Error(`Recipe MRN ${recipeMrn} is missing a usable live-portion yield.`);
    const candidates = items.filter((item) => item.y < ingredientHeader.y - 4
      && item.y > methodHeader.y + 4
      && item.x >= 48
      && item.x < 490
      && !/^(?:AP|EP)$/i.test(item.value));
    const components = candidates.map((candidate) => {
      const quantityCell = items.find((item) => item.x >= 490 && Math.abs(item.y - candidate.y) <= 4);
      if (!quantityCell) return null;
      const parsed = parseQuantity(quantityCell.value);
      return prepComponent({
        name: candidate.value,
        type: /^(amz|eur|eurna|ra|sub|thjv|exc):/i.test(candidate.value) ? "subrecipe" : "ingredient",
        quantity: parsed.quantity,
        unit: parsed.unit,
        servings: livePortions,
      });
    }).filter(Boolean);
    if (!components.length) throw new Error(`Recipe MRN ${recipeMrn} did not produce prep components.`);
    result[recipeMrn] = components;
    wanted.delete(recipeMrn);
  }
  if (wanted.size) throw new Error(`Recipe source is missing exact MRNs: ${[...wanted].join(", ")}`);
  return result;
}

function itemId(row) {
  return `global|${slug(row.menu)}|${mrn(row.mrn)}|${slug(row.portion)}`;
}

async function main() {
  const arg = (name) => process.argv.find((value) => value.startsWith(`--${name}=`))?.slice(name.length + 3);
  const sources = {
    balti: resolve(arg("balti-source") || ""),
    teriyaki: resolve(arg("teriyaki-source") || ""),
    bbq: resolve(arg("bbq-source") || ""),
  };
  if (Object.values(sources).some((path) => !path)) throw new Error("Pass --balti-source, --teriyaki-source and --bbq-source PDF paths.");
  const supplemental = {
    ...(await pdfComponents(sources.balti, supplementalMrns.balti)),
    ...(await pdfComponents(sources.teriyaki, supplementalMrns.teriyaki)),
    ...(await pdfComponents(sources.bbq, supplementalMrns.bbq)),
  };
  const catalogUrl = arg("catalog-url");
  const catalogPayload = catalogUrl ? await (await fetch(catalogUrl)).json() : null;
  if (catalogUrl && (!String(catalogPayload?.source || "").startsWith("supabase-recipe-items") || !Array.isArray(catalogPayload?.rows))) {
    throw new Error("The Global catalog URL did not return the authoritative Supabase recipe catalog.");
  }
  const rows = catalogPayload?.rows || JSON.parse(readFileSync(menuItemsPath, "utf8").replace(/^\uFEFF/, ""));
  const cycleWeeks = cycleScopes.map((scopes, weekIndex) => ({
    week: weekIndex + 1,
    menus: scopes.map((scope) => {
      const deduped = new Map();
      rows.filter((row) => row.menu === scope.menu && (!scope.station || row.station === scope.station) && row.category !== "extension").forEach((row) => {
        const id = itemId(row);
        if (!deduped.has(id)) deduped.set(id, { id, menu: row.menu, station: row.station || "", mrn: mrn(row.mrn), name: text(row.item), portion: text(row.portion), category: row.category });
      });
      const items = [...deduped.values()].sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
      if (!items.length) throw new Error(`Global scope ${scope.menu}/${scope.station || "all"} is empty.`);
      return { ...scope, items };
    }),
  }));
  const allItems = cycleWeeks.flatMap(({ menus }) => menus.flatMap(({ items }) => items));
  const itemPrepComponents = Object.fromEntries(allItems.map((item) => {
    const components = supplemental[item.mrn] || lookupComponents(item.mrn);
    if (!components?.length) throw new Error(`Global item ${item.menu} / ${item.name} / ${item.mrn} lacks an exact recipe projection.`);
    return [item.id, components];
  }));
  const payload = {
    version: 1,
    anchorWeekStart: "2026-11-16",
    cycleLengthWeeks: 6,
    eligibleCafes: ["Cricket", "Nessie", "Dawson", "Bingo", "Grace", "Sonic", "Blueshift", "Everest", "Gemini", "Astra"],
    quantityIncrement: 1,
    orderUnit: "portion",
    extensionsIncluded: false,
    cycleWeeks,
    itemPrepComponents,
    source: {
      catalog: "supabase.recipe_items",
      catalogRosterSha256: createHash("sha256").update(JSON.stringify(allItems)).digest("hex"),
      baseRecipeProjection: COSTING.resource,
      supplementalRecipeHashes: { balti: hashFile(sources.balti), teriyaki: hashFile(sources.teriyaki), bbq: hashFile(sources.bbq) },
    },
  };
  const output = `// Generated by scripts/build-commissary-global-cycle.mjs.\n// Contains prep quantities only; proprietary recipe methods are never projected.\n\nexport const GLOBAL_ORDERING_PROGRAM = Object.freeze(${JSON.stringify(payload, null, 2)});\n\nexport const GLOBAL_ORDERING_ITEM_IDS = Object.freeze(GLOBAL_ORDERING_PROGRAM.cycleWeeks.flatMap(({ menus }) => menus.flatMap(({ items }) => items.map(({ id }) => id))));\nexport const GLOBAL_ORDERING_PREP_ITEM_IDS = Object.freeze([...new Set(Object.values(GLOBAL_ORDERING_PROGRAM.itemPrepComponents).flat().map(({ id }) => id))]);\n`;
  if (process.argv.includes("--check")) {
    if (readFileSync(catalogPath, "utf8").replace(/\r\n/g, "\n") !== output) throw new Error("Global ordering catalog is stale.");
  } else writeFileSync(catalogPath, output);
  console.log(JSON.stringify({ weeks: cycleWeeks.map(({ week, menus }) => ({ week, menus: menus.map(({ label, items }) => ({ label, items: items.length })) })), items: allItems.length, prepIds: new Set(Object.values(itemPrepComponents).flat().map(({ id }) => id)).size }, null, 2));
}

main().catch((error) => { console.error(error.message); process.exit(1); });
