import fs from "node:fs";
import path from "node:path";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import {
  SCOPE,
  PILLARS,
  canonicalMenuNameFromFilename,
  matchKeyFor,
  isPantryExcluded,
  pillarForMenu,
  buildPairwiseMatrix,
  portfolioCrossUseStats,
} from "../src/features/menu-cross-utilization/menuCrossUtilizationModel.js";

const root = process.cwd();
const sourceDir = path.join(root, "docs", "menu-cross-utilization", "shopping-lists");
const outputPath = path.join(root, "src", "data", "menuCrossUtilization.json");

// Report page header/footer band (report title, run-by/run-date, page number, copyright) is
// excluded by y-position; the repeated column-header row ("MIT / Quantity Needed / Amount/Unit
// / On-Hand / Order") sits at y >= 695 on every content page and is excluded the same way.
const CONTENT_Y_MIN = 61;
const CONTENT_Y_MAX = 694;
// Fixed column boundaries confirmed identical across every sampled PDF in this report template.
const COLUMN_DESCRIPTION_MAX_X = 140;
const COLUMN_MIT_MAX_X = 200;

function isHeaderFont(fontName) {
  return /_f1$/.test(fontName);
}
function isBodyFont(fontName) {
  return /_f3$/.test(fontName);
}

async function parseShoppingListPdf(filePath) {
  const data = new Uint8Array(fs.readFileSync(filePath));
  const doc = await pdfjsLib.getDocument({ data, useSystemFonts: true, disableFontFace: true }).promise;
  const rows = [];
  let currentCategory = "";

  for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
    const page = await doc.getPage(pageNumber);
    const content = await page.getTextContent();

    const lines = new Map();
    for (const item of content.items) {
      const y = Math.round(item.transform[5] * 100) / 100;
      const x = Math.round(item.transform[4] * 100) / 100;
      if (y < CONTENT_Y_MIN || y > CONTENT_Y_MAX) continue;
      if (!item.str.trim()) continue;
      if (!lines.has(y)) lines.set(y, []);
      lines.get(y).push({ x, str: item.str.trim(), fontName: item.fontName });
    }

    const orderedYs = [...lines.keys()].sort((a, b) => b - a);
    let pendingRow = null;

    const flushPendingRow = () => {
      if (pendingRow) rows.push(pendingRow);
      pendingRow = null;
    };

    for (const y of orderedYs) {
      const items = lines.get(y).sort((a, b) => a.x - b.x);
      const first = items[0];

      if (isHeaderFont(first.fontName) && items.every((item) => item.x < COLUMN_DESCRIPTION_MAX_X)) {
        flushPendingRow();
        currentCategory = items.map((item) => item.str).join(" ");
        continue;
      }

      if (!isBodyFont(first.fontName)) continue;

      const hasAnchorData = items.some((item) => item.x >= COLUMN_MIT_MAX_X);
      if (hasAnchorData) {
        flushPendingRow();
        const description = items.filter((item) => item.x < COLUMN_DESCRIPTION_MAX_X).map((item) => item.str).join(" ");
        const mit = items.find((item) => item.x >= COLUMN_DESCRIPTION_MAX_X && item.x < COLUMN_MIT_MAX_X)?.str || "";
        pendingRow = { category: currentCategory, description, mit };
      } else if (pendingRow && items.every((item) => item.x < COLUMN_DESCRIPTION_MAX_X)) {
        pendingRow.description += ` ${items.map((item) => item.str).join(" ")}`;
      }
    }
    flushPendingRow();
  }

  return rows;
}

function buildMenuFromRows(name, sourceFile, rows) {
  const eligibleRows = rows.filter((row) => !isPantryExcluded(row.description));
  const labelByKey = new Map();
  for (const row of eligibleRows) {
    const key = matchKeyFor(row);
    if (!labelByKey.has(key)) labelByKey.set(key, { description: row.description, category: row.category });
  }
  const matchKeys = [...labelByKey.keys()].sort();
  const pillar = pillarForMenu(name);
  return {
    name,
    pillar: pillar?.name || null,
    isCoreStation: pillar?.name === "Base Station Infrastructure",
    sourceFile,
    hasIngredientData: matchKeys.length > 0,
    extractedRowCount: rows.length,
    eligibleRowCount: eligibleRows.length,
    matchKeys,
    labels: Object.fromEntries(labelByKey),
  };
}

async function build() {
  if (!fs.existsSync(sourceDir)) throw new Error(`Missing source directory: ${path.relative(root, sourceDir)}`);
  const fileNames = fs.readdirSync(sourceDir).filter((name) => name.toLowerCase().endsWith(".pdf")).sort();
  if (fileNames.length !== 55) throw new Error(`Expected 55 shopping-list PDFs, found ${fileNames.length}.`);

  const menus = [];
  for (const fileName of fileNames) {
    const menuName = canonicalMenuNameFromFilename(fileName);
    const rows = await parseShoppingListPdf(path.join(sourceDir, fileName));
    menus.push(buildMenuFromRows(menuName, fileName, rows));
  }
  menus.sort((a, b) => a.name.localeCompare(b.name));

  const namesWithData = new Set(menus.filter((menu) => menu.hasIngredientData).map((menu) => menu.name));
  for (const pillar of PILLARS) {
    for (const menuName of pillar.menus) {
      if (!menus.some((menu) => menu.name === menuName)) throw new Error(`Pillar "${pillar.name}" references unknown menu "${menuName}".`);
    }
  }
  if (namesWithData.size < 50) throw new Error(`Only ${namesWithData.size} menus produced ingredient rows; expected around 54.`);

  const ingredientLabels = {};
  for (const menu of menus) {
    for (const [key, value] of Object.entries(menu.labels)) {
      if (!ingredientLabels[key]) ingredientLabels[key] = value.description;
    }
    delete menu.labels;
  }

  const menuSummaries = menus.map((menu) => ({
    ...menu,
    portfolio: portfolioCrossUseStats(menu, menus),
  }));

  const pairs = buildPairwiseMatrix(menuSummaries);

  const output = {
    generatedAt: new Date().toISOString().slice(0, 10),
    scope: SCOPE,
    pillars: PILLARS,
    menus: menuSummaries,
    ingredientLabels,
    pairs,
  };
  const json = `${JSON.stringify(output, null, 2)}\n`;

  if (process.argv.includes("--check")) {
    if (!fs.existsSync(outputPath) || fs.readFileSync(outputPath, "utf8") !== json) {
      throw new Error("Generated menuCrossUtilization.json is stale. Run node scripts/build-menu-cross-utilization-data.mjs.");
    }
    console.log(`Verified menu cross-utilization data for ${menus.length} menus (${namesWithData.size} with ingredient data).`);
  } else {
    fs.writeFileSync(outputPath, json);
    console.log(`Wrote menu cross-utilization data for ${menus.length} menus (${namesWithData.size} with ingredient data) to ${path.relative(root, outputPath)}.`);
  }
}

await build();
