import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const sourcePath = path.join(root, "docs", "FOOD_COST_PLATE_COSTING_REFERENCE.md");
const outputPath = path.join(root, "src", "data", "foodCostPlateReference.json");
const source = fs.readFileSync(sourcePath, "utf8");
if (/\bPlate Adds?\b/.test(source)) {
  throw new Error("Legacy Plate Add terminology found. Normalize plate components to Sub Recipe in the Markdown authority.");
}
const fullIndex = source.split(/^## Full item cost index\s*$/m)[1];
const conceptGuide = source.split(/^## Concept guide\s*$/m)[1]?.split(/^## Full item cost index\s*$/m)[0] || "";

if (!fullIndex) throw new Error("Full item cost index was not found in the food-cost reference.");

const numberOrNull = (value) => {
  const parsed = Number(String(value || "").trim());
  return String(value || "").trim() && Number.isFinite(parsed) ? parsed : null;
};

const concepts = conceptGuide.split(/\r?\n/).flatMap((line) => {
  if (!line.startsWith("| AMZ")) return [];
  const cells = line.slice(1, -1).split("|").map((cell) => cell.trim());
  if (cells.length !== 6) throw new Error(`Expected 6 concept-guide columns, received ${cells.length}: ${line}`);
  const [menu, stations, plateBuild, componentTypes, itemCount, status] = cells;
  return [{ menu, stations, plateBuild, componentTypes, itemCount: Number(itemCount), status }];
});

const sourceIds = new Map();
const rows = fullIndex.split(/\r?\n/).flatMap((line) => {
  if (!line.startsWith("| ") || line.startsWith("| ---") || line.includes("| Menu Name |")) return [];
  const cells = line.slice(1, -1).split("|").map((cell) => cell.trim());
  if (cells.length !== 14) throw new Error(`Expected 14 columns, received ${cells.length}: ${line}`);
  const [menu, station, item, mrn, portion, componentType, sellPrice, , , itemWasteCost, , , , plateBuild] = cells;
  const sourceId = [menu, station, mrn, portion].join("\u241f");
  const occurrence = (sourceIds.get(sourceId) || 0) + 1;
  sourceIds.set(sourceId, occurrence);
  return [{
    id: `${sourceId}\u241f${occurrence}`,
    menu,
    station,
    item,
    mrn,
    portion,
    componentType,
    sellPrice: numberOrNull(sellPrice),
    itemWasteCost: numberOrNull(itemWasteCost),
    plateBuild,
  }];
});

if (rows.length < 1000) throw new Error(`Food-cost reference unexpectedly contains only ${rows.length} rows.`);
if (new Set(rows.map((row) => row.id)).size !== rows.length) throw new Error("Food-cost reference IDs are not unique.");

const output = `${JSON.stringify({ source: "docs/FOOD_COST_PLATE_COSTING_REFERENCE.md", concepts, rows }, null, 2)}\n`;
if (process.argv.includes("--check")) {
  if (!fs.existsSync(outputPath) || fs.readFileSync(outputPath, "utf8") !== output) {
    throw new Error("Generated food-cost reference is stale. Run node scripts/build-food-cost-plate-reference.mjs.");
  }
  console.log(`Verified ${rows.length} menu-isolated food-cost rows against the Markdown authority.`);
} else {
  fs.writeFileSync(outputPath, output);
  console.log(`Wrote ${rows.length} menu-isolated food-cost rows to ${path.relative(root, outputPath)}.`);
}
