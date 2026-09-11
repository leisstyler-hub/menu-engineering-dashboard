import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const menuItemsPath = join(root, "src", "data", "menuItems.json");
const outputPath = join(root, "src", "data", "transferToolCatalog.json");
const checkOnly = process.argv.includes("--check");

const normalize = (value) => String(value ?? "").normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("en-US");
const text = (value) => String(value ?? "").trim();

const menuRows = JSON.parse(readFileSync(menuItemsPath, "utf8"));
const seen = new Set();
const items = [];

for (const row of menuRows) {
  const menu = text(row.menu);
  const item = text(row.item || row.displayName || row.recipeName);
  const mrn = text(row.mrn);
  const portion = text(row.portion);
  if (!menu || !item) continue;
  const identity = [normalize(menu), normalize(item), normalize(mrn), normalize(portion)].join("|");
  if (seen.has(identity)) continue;
  seen.add(identity);

  const trueCost = row.trueCost === null || row.trueCost === undefined || row.trueCost === "" ? null : Number(row.trueCost);
  const fallbackCost = row.itemCost === null || row.itemCost === undefined || row.itemCost === "" ? null : Number(row.itemCost) * (1 + Number(row.wastePct || 0));
  const itemWasteCost = Number.isFinite(trueCost) ? trueCost : Number.isFinite(fallbackCost) ? fallbackCost : null;
  items.push({ id: identity, menu, item, mrn, portion, itemWasteCost: itemWasteCost == null ? null : Number(itemWasteCost.toFixed(4)) });
}

items.sort((a, b) => a.menu.localeCompare(b.menu) || a.item.localeCompare(b.item) || a.mrn.localeCompare(b.mrn));
const menus = Array.from(new Set(items.map((row) => row.menu))).sort((a, b) => a.localeCompare(b));
const output = `${JSON.stringify({
  source: "src/data/menuItems.json",
  costSource: "src/data/menuItems.json trueCost (Item + Waste Cost)",
  generatedAt: "source-controlled",
  menus,
  items,
}, null, 2)}\n`;

if (checkOnly) {
  const current = readFileSync(outputPath, "utf8");
  if (current !== output) {
    console.error("Transfer Tool catalog is stale. Run node scripts/build-transfer-tool-catalog.mjs.");
    process.exit(1);
  }
  console.log(`Transfer Tool catalog verified: ${menus.length} menus, ${items.length} menu-scoped item records.`);
} else {
  writeFileSync(outputPath, output);
  console.log(`Transfer Tool catalog generated: ${menus.length} menus, ${items.length} menu-scoped item records.`);
}
