import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import XLSX from "xlsx";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const workbookPath = join(root, "docs", "gl-mapping", "Alex_Transfer_Tool_GL_Mapping_Reviewed.xlsx");
const menuItemsPath = join(root, "src", "data", "menuItems.json");
const outputPath = join(root, "src", "data", "transferToolCatalog.json");
const checkOnly = process.argv.includes("--check");

const normalize = (value) => String(value ?? "").normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("en-US");
const sourceKey = (menu, item) => `${normalize(menu)}|${normalize(item)}`;
const text = (value) => String(value ?? "").trim();

const workbook = XLSX.readFile(workbookPath, { cellDates: false });
const sourceSheet = workbook.Sheets["Source Detail"];
if (!sourceSheet) throw new Error("Reviewed G/L workbook is missing the Source Detail sheet.");

const sourceRows = XLSX.utils.sheet_to_json(sourceSheet, { header: 1, defval: "", raw: false }).slice(3);
const glByItem = new Map();

for (const row of sourceRows) {
  const [menu, item, topLevelComponent, ingredient, , glCode, glCategory] = row;
  if (!text(menu) || !text(item)) continue;
  const key = sourceKey(menu, item);
  const entry = glByItem.get(key) || new Map();
  const code = text(glCode);
  const category = text(glCategory);
  if (code && category) {
    const glKey = `${code}|${normalize(category)}`;
    const group = entry.get(glKey) || { code, category, ingredients: new Set(), components: new Set() };
    if (text(ingredient)) group.ingredients.add(text(ingredient));
    if (text(topLevelComponent)) group.components.add(text(topLevelComponent));
    entry.set(glKey, group);
  }
  glByItem.set(key, entry);
}

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
  const glGroups = Array.from(glByItem.get(sourceKey(menu, item))?.values() || [])
    .map((group) => ({
      code: group.code,
      category: group.category,
      ingredients: Array.from(group.ingredients).sort((a, b) => a.localeCompare(b)),
      components: Array.from(group.components).sort((a, b) => a.localeCompare(b)),
    }))
    .sort((a, b) => a.code.localeCompare(b.code) || a.category.localeCompare(b.category));

  items.push({ id: identity, menu, item, mrn, portion, itemWasteCost: itemWasteCost == null ? null : Number(itemWasteCost.toFixed(4)), glGroups });
}

items.sort((a, b) => a.menu.localeCompare(b.menu) || a.item.localeCompare(b.item) || a.mrn.localeCompare(b.mrn));
const menus = Array.from(new Set(items.map((row) => row.menu))).sort((a, b) => a.localeCompare(b));
const output = `${JSON.stringify({
  source: "docs/gl-mapping/Alex_Transfer_Tool_GL_Mapping_Reviewed.xlsx",
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
