import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  dedupeRecipeLibraryRows,
  itemName,
  recipeLibraryCategoryGroup,
  textValue,
} from "../src/features/recipe-database/recipeLibraryModel.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const menuItemsPath = path.join(root, "src", "data", "menuItems.json");
const rotationSourcePath = path.join(root, "src", "features", "neighborhood-rotations", "NeighborhoodRotations.jsx");

function assert(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}

const rows = JSON.parse(fs.readFileSync(menuItemsPath, "utf8"));
const carveryRows = rows.filter((row) => textValue(row, "menu") === "AMZ: Carvery");
const scallopedRawRows = carveryRows.filter(
  (row) => itemName(row).toLowerCase() === "scalloped potatoes" && textValue(row, "mrn", "MRN") === "40929.5",
);
const carveryVisibleRows = dedupeRecipeLibraryRows(carveryRows);
const scallopedVisibleRows = carveryVisibleRows.filter(
  (row) => itemName(row).toLowerCase() === "scalloped potatoes" && textValue(row, "mrn", "MRN") === "40929.5",
);

assert(scallopedRawRows.length >= 2, "Expected source data to include duplicate Scalloped Potatoes rows for the regression case.");
assert(scallopedVisibleRows.length === 1, "Menu Library visible rows should collapse duplicate Scalloped Potatoes to one card.");

const duplicateVisibleGroups = new Map();
dedupeRecipeLibraryRows(rows).forEach((row) => {
  const key = [
    textValue(row, "menu"),
    textValue(row, "station"),
    recipeLibraryCategoryGroup(row),
    itemName(row).toLowerCase(),
    textValue(row, "mrn", "MRN"),
  ].join("|");
  duplicateVisibleGroups.set(key, (duplicateVisibleGroups.get(key) || 0) + 1);
});

const visibleDuplicates = Array.from(duplicateVisibleGroups.entries()).filter(([, count]) => count > 1);
assert(!visibleDuplicates.length, `Menu Library still has duplicate visible item groups: ${visibleDuplicates.slice(0, 5).map(([key, count]) => `${key} x${count}`).join("; ")}`);

const rotationSource = fs.readFileSync(rotationSourcePath, "utf8");
assert(rotationSource.includes("const optionItems = useMemo(() => uniqueOptionRows(items), [items]);"), "Neighborhood item picker should dedupe option rows before rendering.");
assert(rotationSource.includes("optionItems.map((row)"), "Neighborhood item picker should render deduped option rows.");
assert(!rotationSource.includes("{items.map((row) => <option"), "Neighborhood item picker should not render raw duplicate option rows.");

console.log(`Menu row dedupe verified: ${rows.length} raw rows render as ${dedupeRecipeLibraryRows(rows).length} visible rows.`);
