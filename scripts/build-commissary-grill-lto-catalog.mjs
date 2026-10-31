import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import XLSX from "xlsx";

const root = resolve(import.meta.dirname, "..");
const sourcePath = resolve(root, "public/resources/Ingredient_Costing_9.19.26.xlsx");
const outputPath = resolve(root, "src/features/commissary-ordering/grillLtoCatalog.js");

const cycleGroups = [
  { key: "atx", items: [{ mrn: "77139.72", name: "ATX Burger" }, { mrn: "13773.6", name: "Mushroom Swiss Burger" }] },
  { key: "diablo", items: [{ mrn: "77139.68", name: "Diablo Burger" }, { mrn: "64908.6", name: "Southwest Burger" }] },
  { key: "brunch", items: [{ mrn: "107045.1", name: "Brunch Burger" }, { mrn: "91861.2", name: "BBQ Brisket Smashburger" }] },
  { key: "teriyaki", items: [{ mrn: "63517.3", name: "Teriyaki Bacon Burger" }, { mrn: "63329.3", name: "Carolina BBQ Burger" }] },
  { key: "fish", items: [{ mrn: "78211.2", name: "Blackened Steelhead Sandwich" }, { mrn: "165740.2", name: "Spicy Fried Cod Sandwich on Brioche" }] },
  { key: "chesapeake", items: [{ mrn: "77139.70", name: "Chesapeake Chicken Sandwich" }, { mrn: "77139.69", name: "Haystack Burger" }] },
];

const text = (value) => String(value ?? "").normalize("NFKC").trim().replace(/^'/, "");
const mrn = (value) => text(value).replace(/\.0+$/, "");
const parseNumber = (value) => {
  const source = text(value).replace(/-/g, " ").replace(/\s+/g, " ");
  const mixed = source.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
  const fraction = source.match(/^(\d+)\/(\d+)$/);
  if (fraction) return Number(fraction[1]) / Number(fraction[2]);
  const number = Number(source);
  return Number.isFinite(number) ? number : null;
};
const parseAmount = (value) => {
  const match = text(value).match(/^(.+?)\s+x\s+(.+)$/i);
  if (!match) return null;
  const quantity = parseNumber(match[1]);
  const unit = text(match[2]).toLocaleLowerCase("en-US");
  return quantity != null && unit ? { quantity, unit } : null;
};

const targets = new Set(cycleGroups.flatMap(({ items }) => items.map(({ mrn: value }) => value)));
const componentsByRecipe = new Map([...targets].map((value) => [value, new Map()]));
const workbook = XLSX.readFile(sourcePath, { raw: false });

for (const sheetName of workbook.SheetNames) {
  if (sheetName === "_Source Map") continue;
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "", raw: false });
  for (const row of rows) {
    const recipeMrn = mrn(row["Recipe MRN"]);
    if (!targets.has(recipeMrn)) continue;
    const level = text(row.Level);
    const usage = text(row["Usage Type"]).toLocaleLowerCase("en-US");
    const amount = parseAmount(row["Ingredient Amount"]);
    const recipeYield = parseNumber(row["Recipe Yield"]);
    if (!amount || !(recipeYield > 0)) continue;
    let component;
    if (level === "1" && usage === "ingredient") {
      component = {
        type: "ingredient",
        mrn: mrn(row["Ingredient MRN"]),
        name: text(row["Ingredient Name"]),
        quantity: Number((amount.quantity / recipeYield).toFixed(6)),
        unit: amount.unit,
      };
    } else if (level === "2" && usage === "sub-recipe") {
      component = {
        type: "subrecipe",
        mrn: mrn(row["Item MRN"]),
        name: text(row["Item Name"]),
        quantity: Number((amount.quantity / recipeYield).toFixed(6)),
        unit: amount.unit,
      };
    }
    if (!component?.mrn || !component.name || !(component.quantity > 0)) continue;
    const key = `${component.type}|${component.mrn}|${component.quantity}|${component.unit}`;
    componentsByRecipe.get(recipeMrn).set(key, {
      id: `grill-prep|${component.type}|${component.mrn}|${component.unit.replace(/[^a-z0-9]+/g, "-")}`,
      ...component,
    });
  }
}

for (const [recipeMrn, components] of componentsByRecipe) {
  if (!components.size) throw new Error(`No Grill prep components found for MRN ${recipeMrn}.`);
}

const cycleWeeks = cycleGroups.map((group, index) => ({
  week: index + 1,
  setA: group.items,
  setB: cycleGroups[(index + 1) % cycleGroups.length].items,
}));
const itemPrepComponents = Object.fromEntries([...componentsByRecipe].map(([recipeMrn, components]) => [
  recipeMrn,
  [...components.values()].sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name)),
]));

const rendered = `// Generated from public/resources/Ingredient_Costing_9.19.26.xlsx.\n// Run node scripts/build-commissary-grill-lto-catalog.mjs after the source workbook changes.\n\nexport const GRILL_LTO_PROGRAM = Object.freeze(${JSON.stringify({
  version: 1,
  menu: "AMZ: Grill Core",
  station: "Spotlights",
  anchorWeekStart: "2026-11-16",
  cycleLengthWeeks: 6,
  eligibleCafes: ["Cricket", "Nessie", "Dawson", "Bingo", "Grace", "Blueshift", "Sonic", "Astra", "Day 1", "Nitro", "Re:Invent"],
  quantityIncrement: 1,
  orderUnit: "sandwich",
  source: "Supabase recipe_items + Ingredient Costing 9.19.26",
  cycleWeeks,
  itemPrepComponents,
}, null, 2)});\n\nexport const GRILL_LTO_ITEM_MRNS = Object.freeze([...new Set(GRILL_LTO_PROGRAM.cycleWeeks.flatMap((week) => [...week.setA, ...week.setB]).map((item) => item.mrn))]);\nexport const GRILL_LTO_PREP_ITEM_IDS = Object.freeze([...new Set(Object.values(GRILL_LTO_PROGRAM.itemPrepComponents).flat().map((item) => item.id))]);\n`;

if (process.argv.includes("--check")) {
  if (readFileSync(outputPath, "utf8").replace(/\r\n/g, "\n") !== rendered) throw new Error("Commissary Grill LTO catalog is stale. Run node scripts/build-commissary-grill-lto-catalog.mjs.");
  console.log(`Commissary Grill LTO catalog is current: ${targets.size} sandwiches, ${Object.values(itemPrepComponents).flat().length} prep components.`);
} else {
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, rendered);
  console.log(`Built Commissary Grill LTO catalog: ${targets.size} sandwiches, ${Object.values(itemPrepComponents).flat().length} prep components.`);
}
