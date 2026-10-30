import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

const root = resolve(import.meta.dirname, "..");
const menuItemsPath = resolve(root, "src/data/menuItems.json");
const catalogPath = resolve(root, "src/features/commissary-ordering/deliCycleCatalog.js");
const menu = "AMZ: Deli Core";

const recipePages = new Map([
  ["174951", 2], ["37311.43", 6], ["76623.4", 8], ["190990", 9], ["34303.46", 10],
  ["37001.21", 11], ["148838.3", 12], ["142803", 13], ["16392", 15], ["104208.27", 18],
  ["85656.3", 22], ["129693.5", 28], ["37154.1", 30], ["9282.7", 33], ["108987", 37],
  ["161945", 49], ["37394.7", 50], ["134036.4", 51], ["37007.1", 52], ["144636", 56],
]);

const cycleMrns = [
  ["190990", "37311.43", "76623.4", "37154.1", "16392"],
  ["148838.3", "37001.21", "37007.1", "34303.46", "142803"],
  ["37007.1", "190990", "161945", "144636", "37394.7", "108987"],
  ["129693.5", "85656.3", "9282.7", "174951", "104208.27", "134036.4"],
];

const text = (value) => String(value ?? "").normalize("NFKC").trim();
const slug = (value) => text(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const round = (value) => Number(Number(value).toFixed(6));

function parseQuantity(value) {
  const source = text(value).toLowerCase().replace(/½/g, "1/2").replace(/¼/g, "1/4").replace(/¾/g, "3/4");
  const amount = (token) => {
    if (!token) return 0;
    if (token.includes("/")) {
      const [numerator, denominator] = token.split("/").map(Number);
      return denominator ? numerator / denominator : 0;
    }
    return Number(token) || 0;
  };
  const parts = [...source.matchAll(/(\d+(?:\.\d+)?|\d+\/\d+)\s*([a-z]+)/g)].map((match) => ({ value: amount(match[1]), unit: match[2] }));
  if (!parts.length) throw new Error(`Unsupported Deli ingredient quantity: ${value}`);
  const weight = { lb: 16, lbs: 16, oz: 1 };
  const volume = { gal: 16, gallon: 16, qt: 4, quart: 4, cup: 1, cups: 1, tbsp: 1 / 16, tsp: 1 / 48 };
  if (parts.every(({ unit }) => unit in weight)) return { quantity: round(parts.reduce((sum, row) => sum + row.value * weight[row.unit], 0)), unit: "ounce" };
  if (parts.every(({ unit }) => unit in volume)) return { quantity: round(parts.reduce((sum, row) => sum + row.value * volume[row.unit], 0)), unit: "cup" };
  if (parts.length === 1) {
    const aliases = { ea: "each", each: "each", slice: "slice", slices: "slice", leaf: "leaf", leaves: "leaf", piece: "each", pieces: "each" };
    return { quantity: round(parts[0].value), unit: aliases[parts[0].unit] || parts[0].unit };
  }
  throw new Error(`Mixed Deli ingredient units are unsupported: ${value}`);
}

async function parseRecipes(path) {
  const document = await pdfjs.getDocument({ data: new Uint8Array(readFileSync(path)), disableWorker: true }).promise;
  const results = {};
  for (const [mrn, pageNumber] of recipePages) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    const items = content.items.filter((item) => text(item.str)).map((item) => ({
      value: text(item.str), x: item.transform[4], y: item.transform[5],
    }));
    const pageText = items.map(({ value }) => value).join(" ");
    if (!pageText.includes(`(${mrn})`)) throw new Error(`Recipe MRN ${mrn} was not found on page ${pageNumber}.`);
    const servingsMatch = pageText.match(/Total to Produce:\s*(\d+(?:\.\d+)?)/i);
    const servings = Number(servingsMatch?.[1]);
    if (!(servings > 0)) throw new Error(`Recipe MRN ${mrn} is missing a valid yield.`);
    const ingredientHeader = items.find((item) => item.value === "Ingredients");
    const methodHeader = items.find((item) => item.value === "Method");
    if (!ingredientHeader || !methodHeader) throw new Error(`Recipe MRN ${mrn} is missing its ingredient table.`);
    const candidates = items.filter((item) => item.y < ingredientHeader.y - 4 && item.y > methodHeader.y + 4 && item.x >= 48 && item.x < 440);
    const components = candidates.map((candidate) => {
      const quantityCell = items.find((item) => item.x >= 490 && Math.abs(item.y - candidate.y) <= 4);
      if (!quantityCell) return null;
      const parsed = parseQuantity(quantityCell.value);
      const type = /^(amz|eur|ra):/i.test(candidate.value) ? "subrecipe" : "ingredient";
      return {
        id: `deli-prep|${type}|${slug(candidate.value)}|${parsed.unit}`,
        name: candidate.value,
        mrn: "",
        type,
        quantity: round(parsed.quantity / servings),
        unit: parsed.unit,
      };
    }).filter(Boolean);
    if (components.length < 3) throw new Error(`Recipe MRN ${mrn} produced only ${components.length} prep components.`);
    results[mrn] = components;
  }
  return results;
}

async function main() {
  const recipeArg = process.argv.find((arg) => arg.startsWith("--recipe-source="))?.slice("--recipe-source=".length);
  if (!recipeArg) throw new Error("Pass --recipe-source=<pdf>.");
  const rows = JSON.parse(readFileSync(menuItemsPath, "utf8").replace(/^\uFEFF/, ""));
  const byMrn = new Map(rows.filter((row) => row.menu === menu).map((row) => [text(row.mrn), row]));
  const prep = await parseRecipes(resolve(recipeArg));
  const cycleWeeks = cycleMrns.map((mrns, index) => ({
    week: index + 1,
    items: mrns.map((mrn) => {
      const row = byMrn.get(mrn);
      if (!row || !(Number(row.trueCost) > 0)) throw new Error(`Deli cycle MRN ${mrn} lacks an authoritative Item + Waste Cost.`);
      return { mrn, name: row.item };
    }),
  }));
  const payload = {
    version: 1,
    menu,
    anchorWeekStart: "2026-11-16",
    cycleLengthWeeks: 4,
    eligibleCafes: ["Cricket", "Nessie", "Dawson", "Blueshift", "Sonic", "Dynamo", "Gemini", "Eclipse", "Odyssey"],
    quantityIncrement: 1,
    orderUnit: "sandwich",
    cycleWeeks,
    itemPrepComponents: prep,
  };
  const output = `// Generated by scripts/build-commissary-deli-cycle.mjs from the reviewed Deli Core recipe pack.\n// This operational projection intentionally excludes recipe methods and the two unsupported exact MRNs.\n\nexport const DELI_ORDERING_PROGRAM = Object.freeze(${JSON.stringify(payload, null, 2)});\n\nexport const DELI_ORDERING_ITEM_MRNS = Object.freeze([...new Set(DELI_ORDERING_PROGRAM.cycleWeeks.flatMap(({ items }) => items.map(({ mrn }) => mrn)))]);\nexport const DELI_ORDERING_PREP_ITEM_IDS = Object.freeze([...new Set(Object.values(DELI_ORDERING_PROGRAM.itemPrepComponents).flat().map(({ id }) => id))]);\n`;
  if (process.argv.includes("--check")) {
    if (readFileSync(catalogPath, "utf8").replace(/\r\n/g, "\n") !== output) throw new Error("Deli ordering catalog is stale.");
  } else {
    writeFileSync(catalogPath, output);
  }
  console.log(JSON.stringify({ weeks: cycleWeeks.map(({ week, items }) => ({ week, count: items.length })), sandwiches: Object.keys(prep).length, prepIds: new Set(Object.values(prep).flat().map(({ id }) => id)).size }, null, 2));
}

main().catch((error) => { console.error(error.message); process.exit(1); });
