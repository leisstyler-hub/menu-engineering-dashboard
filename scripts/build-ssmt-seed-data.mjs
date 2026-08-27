import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import JSZip from "jszip";
import XLSX from "xlsx";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = path.join(ROOT, "docs", "ssmt", "SEA Standard Menu Template (1).xlsx");
const OUTPUT = path.join(ROOT, "public", "data", "ssmtSeedData.json");
const CHECK_MODE = process.argv.includes("--check");

const AREA_ORDER = ["AUS", "BNA", "BOS", "BWI", "DEN", "IAD", "JFK", "LAX", "SAN", "SNA", "SEA", "SJC", "WAS", "YVR", "YYZ", "MCO"];
const IGNORED_SHEET_PATTERNS = [
  /navigation ui/i,
  /template/i,
  /overview/i,
  /^blank/i,
  /^sheet\d*$/i,
];
const PROMOTION_SHEET_PATTERNS = /promo|promotion|world cup|mlb|breakfast promo|hispanic heritage|oktoberfest|football|picnic|summer crop/i;
const RECENT_UNLINKED_SHEET_PATTERNS = /the daily|fall menu 26|balti pilot|thompson sept 26|soft serve/i;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function cellText(cell) {
  if (!cell) return "";
  const value = cell.w ?? cell.v ?? "";
  return String(value).replace(/\u00a0/g, " ").trim();
}

function worksheetRows(sheet) {
  return XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: "" })
    .map((row) => row.map((value) => String(value ?? "").replace(/\u00a0/g, " ").trim()));
}

function visibleSheetNames(workbook) {
  const sheetMeta = workbook.Workbook?.Sheets || [];
  return workbook.SheetNames.filter((name, index) => !sheetMeta[index]?.Hidden);
}

function slug(value) {
  return String(value || "record")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    || "record";
}

function normalizedHeader(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function headerIndex(headers, matchers) {
  return headers.findIndex((header) => matchers.some((matcher) => matcher.test(header)));
}

function valueAt(row, index) {
  return index >= 0 ? String(row[index] ?? "").trim() : "";
}

function menuTypeForSheet(sheetName) {
  if (/thompson/i.test(sheetName)) return "Thompson Hospitality";
  if (PROMOTION_SHEET_PATTERNS.test(sheetName)) return "Promotion";
  if (/global/i.test(sheetName)) return "Global";
  return "Core";
}

function isModifierSheet(sheetName) {
  return /modifier/i.test(sheetName);
}

function isCandidateMenuSheet(sheetName) {
  return !isModifierSheet(sheetName) && !IGNORED_SHEET_PATTERNS.some((pattern) => pattern.test(sheetName));
}

function findHeaderRow(rows) {
  return rows.findIndex((row) => {
    const headers = row.map(normalizedHeader);
    return headerIndex(headers, [/^label$/, /label/]) >= 0
      && headerIndex(headers, [/description/]) >= 0
      && headerIndex(headers, [/mrn|recipe number|pos id/]) >= 0;
  });
}

function findPriceHeaderRow(rows) {
  return rows.findIndex((row) => {
    const headers = row.map((value) => value.toUpperCase());
    const areaHits = AREA_ORDER.filter((area) => headers.includes(area)).length;
    return areaHits >= 6 && row.some((value) => /category|item|price/i.test(value));
  });
}

function parsePriceBook(workbook) {
  const priceSheetName = workbook.SheetNames.find((name) => /navigation ui price update/i.test(name))
    || workbook.SheetNames.find((name) => /navigation ui/i.test(name));
  const rows = worksheetRows(workbook.Sheets[priceSheetName]);
  const headerRowIndex = findPriceHeaderRow(rows);
  assert(headerRowIndex >= 0, "SSMT pricing structure header row was not found.");

  const headerRow = rows[headerRowIndex];
  const upperHeaders = headerRow.map((value) => value.toUpperCase());
  const categoryIndex = headerRow.findIndex((value) => /category/i.test(value));
  const exampleIndex = headerRow.findIndex((value) => /example|description|item/i.test(value));
  const areaIndexes = Object.fromEntries(AREA_ORDER.map((area) => [area, upperHeaders.indexOf(area)]));

  return rows.slice(headerRowIndex + 1)
    .map((row, index) => {
      const areaPrices = Object.fromEntries(AREA_ORDER.map((area) => [area, valueAt(row, areaIndexes[area])]));
      const category = valueAt(row, categoryIndex);
      const example = valueAt(row, exampleIndex);
      return {
        id: `price-${index + 1}-${slug(category || example || areaPrices.SEA)}`,
        category,
        example,
        selectorLabel: `${areaPrices.SEA || "SEA TBD"} - ${category || example || "Uncategorized"}`,
        areas: areaPrices,
      };
    })
    .filter((row) => row.category || row.example || Object.values(row.areas).some(Boolean))
    .slice(0, 120);
}

function decodeXml(value) {
  return String(value || "")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, "\"")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function xmlAttributes(tag) {
  const attributes = {};
  const pattern = /([\w:]+)="([^"]*)"/g;
  let match;
  while ((match = pattern.exec(tag))) {
    attributes[match[1]] = decodeXml(match[2]);
  }
  return attributes;
}

function normalizeZipPath(baseFile, target) {
  const baseDir = path.posix.dirname(baseFile);
  return path.posix.normalize(path.posix.join(baseDir, target));
}

async function navigationTargetSheetNames(sourceBuffer) {
  const zip = await JSZip.loadAsync(sourceBuffer);
  const workbookXml = await zip.files["xl/workbook.xml"].async("string");
  const workbookRelsXml = await zip.files["xl/_rels/workbook.xml.rels"].async("string");
  const navSheetTag = [...workbookXml.matchAll(/<sheet\b[^>]*>/g)]
    .map((match) => xmlAttributes(match[0]))
    .find((attributes) => attributes.name === "Navigation UI");
  assert(navSheetTag?.["r:id"], "Navigation UI sheet relationship was not found.");

  const workbookRelationships = Object.fromEntries(
    [...workbookRelsXml.matchAll(/<Relationship\b[^>]*>/g)].map((match) => {
      const attributes = xmlAttributes(match[0]);
      return [attributes.Id, attributes.Target];
    })
  );
  const worksheetPath = `xl/${workbookRelationships[navSheetTag["r:id"]]}`;
  const worksheetRelsPath = normalizeZipPath(worksheetPath, `_rels/${path.posix.basename(worksheetPath)}.rels`);
  const worksheetRels = zip.files[worksheetRelsPath] ? await zip.files[worksheetRelsPath].async("string") : "";
  const drawingRelationship = [...worksheetRels.matchAll(/<Relationship\b[^>]*>/g)]
    .map((match) => xmlAttributes(match[0]))
    .find((attributes) => /\/drawing$/.test(attributes.Type || ""));
  assert(drawingRelationship?.Target, "Navigation UI drawing relationship was not found.");

  const drawingPath = normalizeZipPath(worksheetPath, drawingRelationship.Target);
  const drawingRelsPath = normalizeZipPath(drawingPath, `_rels/${path.posix.basename(drawingPath)}.rels`);
  const drawingRels = zip.files[drawingRelsPath] ? await zip.files[drawingRelsPath].async("string") : "";
  const targets = [...drawingRels.matchAll(/<Relationship\b[^>]*>/g)]
    .map((match) => xmlAttributes(match[0]))
    .filter((attributes) => /\/hyperlink$/.test(attributes.Type || "") && String(attributes.Target || "").startsWith("#"))
    .map((attributes) => {
      const target = attributes.Target.replace(/^#/, "");
      const sheetName = target.split("!")[0].replace(/^'/, "").replace(/'$/, "").trim();
      return decodeXml(sheetName);
    })
    .filter(Boolean);

  return [...new Set(targets)];
}

function includeReasonForSheet(sheetName, navigationTargets) {
  if (navigationTargets.has(sheetName)) return "Navigation UI button target";
  if (PROMOTION_SHEET_PATTERNS.test(sheetName) || RECENT_UNLINKED_SHEET_PATTERNS.test(sheetName)) return "Visible recent/promotion sheet";
  return "";
}

function parseMenuSheet(workbook, sheetName, priceBook, includeReason = "") {
  const rows = worksheetRows(workbook.Sheets[sheetName]);
  const headerRowIndex = findHeaderRow(rows);
  if (headerRowIndex < 0) return null;

  const headers = rows[headerRowIndex].map(normalizedHeader);
  const labelIndex = headerIndex(headers, [/^label$/, /label/]);
  const nameIndex = headerIndex(headers, [/^name$/, /item name/, /^name label$/]);
  const descriptionIndex = headerIndex(headers, [/description/]);
  const mrnIndex = headerIndex(headers, [/^mrn$/, /recipe number/, /pos id/]);
  const categoryIndex = headerIndex(headers, [/reporting category primary/, /^category$/]);
  const secondaryCategoryIndex = headerIndex(headers, [/reporting category secondary/]);
  const brandIndex = headerIndex(headers, [/brand.*menu/, /^brand$/]);
  const priceIndex = headerIndex(headers, [/sea price/, /^price$/, /price selector/]);
  const caloriesIndex = headerIndex(headers, [/calorie/]);
  const modifierIndexes = headers
    .map((header, index) => ({ header, index }))
    .filter(({ header }) => /modifier/.test(header))
    .map(({ index }) => index);

  const type = menuTypeForSheet(sheetName);
  const menuId = `menu-${slug(sheetName)}`;
  const items = rows.slice(headerRowIndex + 1)
    .map((row, index) => {
      const rawLabel = valueAt(row, labelIndex) || valueAt(row, nameIndex);
      const rawName = valueAt(row, nameIndex) || rawLabel;
      const description = valueAt(row, descriptionIndex);
      const seaPrice = valueAt(row, priceIndex);
      const priceRow = priceBook.find((price) => price.areas.SEA && seaPrice && price.areas.SEA === seaPrice);
      const blankAreaPrices = Object.fromEntries(AREA_ORDER.map((area) => [area, ""]));
      const modifierGroups = modifierIndexes.map((modifierIndex) => valueAt(row, modifierIndex)).filter(Boolean);
      return {
        id: `${menuId}-item-${index + 1}`,
        label: rawLabel.toUpperCase(),
        name: rawName,
        description: description.toLowerCase(),
        mrn: valueAt(row, mrnIndex),
        category: valueAt(row, categoryIndex),
        reportingCategorySecondary: valueAt(row, secondaryCategoryIndex),
        brandMenu: valueAt(row, brandIndex),
        calories: type === "Promotion" ? valueAt(row, caloriesIndex) : "",
        priceSelectorId: priceRow?.id || "",
        seaPrice: priceRow?.areas?.SEA || "",
        workbookSeaPrice: seaPrice,
        priceReviewStatus: seaPrice && !priceRow ? "Needs pricing structure match" : priceRow ? "Pricing structure match" : "Unpriced",
        areaPrices: priceRow?.areas || blankAreaPrices,
        modifierGroups,
      };
    })
    .filter((item) => item.label || item.name || item.mrn || item.description)
    .slice(0, 250);

  if (!items.length) return null;

  return {
    id: menuId,
    name: sheetName.trim(),
    sourceSheet: sheetName,
    includeReason,
    type,
    phase: "Culinary draft",
    status: "Draft",
    activeStart: "",
    activeEnd: "",
    completedAt: "",
    editSignal: false,
    downstreamEligibleAfter: type === "Core" || type === "Global" ? "IT complete" : "Excluded historical record",
    items,
  };
}

function parseModifierSheet(workbook, sheetName) {
  const rows = worksheetRows(workbook.Sheets[sheetName]);
  const groups = [];
  let currentGroup = null;

  rows.forEach((row, index) => {
    const groupName = valueAt(row, 1);
    const choiceName = valueAt(row, 5);
    const mrn = valueAt(row, 6);
    const description = valueAt(row, 7);
    const priceSelector = valueAt(row, 8);

    if (groupName && !/modifier group name/i.test(groupName) && !choiceName) {
      currentGroup = {
        id: `modifier-${slug(sheetName)}-${groups.length + 1}`,
        name: groupName,
        sourceSheet: sheetName,
        menuName: sheetName.replace(/\s*modifiers?\s*/i, "").trim() || sheetName,
        minQty: "",
        maxQty: "",
        copyBehavior: "Copy creates an independent modifier group",
        choices: [],
      };
      groups.push(currentGroup);
      return;
    }

    if (!currentGroup || !choiceName || /^remove\b/i.test(choiceName)) return;
    currentGroup.choices.push({
      id: `${currentGroup.id}-choice-${index + 1}`,
      label: choiceName,
      description: description.toLowerCase(),
      mrn,
      priceSelector,
    });
  });

  return groups.filter((group) => group.choices.length).slice(0, 200);
}

async function buildData() {
  assert(existsSync(SOURCE), `SSMT workbook not found at ${SOURCE}`);
  const sourceBuffer = readFileSync(SOURCE);
  const workbook = XLSX.read(sourceBuffer, { cellText: true, cellDates: false, raw: true });
  const visibleSheets = visibleSheetNames(workbook);
  const navigationTargets = new Set(await navigationTargetSheetNames(sourceBuffer));
  const priceBook = parsePriceBook(workbook);
  const menuSheetNames = workbook.SheetNames
    .filter((sheetName) => isCandidateMenuSheet(sheetName) && includeReasonForSheet(sheetName, navigationTargets));
  const includedMenuSheets = new Set(menuSheetNames);
  const menus = menuSheetNames
    .map((sheetName) => parseMenuSheet(workbook, sheetName, priceBook, includeReasonForSheet(sheetName, navigationTargets)))
    .filter(Boolean);
  const modifierGroups = workbook.SheetNames
    .filter((sheetName) => isModifierSheet(sheetName) && (
      visibleSheets.includes(sheetName)
      || [...includedMenuSheets].some((menuName) => sheetName.toLowerCase().includes(menuName.toLowerCase()) || menuName.toLowerCase().includes(sheetName.toLowerCase().replace(/\s*modifiers?\s*/i, "")))
    ))
    .flatMap((sheetName) => parseModifierSheet(workbook, sheetName));

  assert(priceBook.length > 0, "SSMT pricing book parsed no rows.");
  assert(menus.length > 0, "SSMT menu parser found no candidate menu sheets.");
  assert(modifierGroups.length > 0, "SSMT modifier parser found no modifier groups.");

  return {
    generatedAt: "2026-08-26T00:00:00.000Z",
    sourceWorkbook: "docs/ssmt/SEA Standard Menu Template (1).xlsx",
    sourceRules: {
      workbookRole: "Initial SSMT tool structure, pricing, modifiers, workflow seed, and candidate SSMT alignment flags.",
      deletionAuthority: "Webtrition Report Menu Index remains the removal authority for operational records.",
      ssmtWorkbookDeletionAuthority: false,
      reviewFlagRule: "SSMT-only and Webtrition-only differences are review flags until Webtrition removal authority is confirmed.",
    },
    areaOrder: AREA_ORDER,
    workflowPhases: ["Culinary draft", "Experience review", "IT programming", "IT complete"],
    menuTypes: ["Core", "Global", "Thompson Hospitality", "Promotion"],
    flagReasons: ["Description correction", "Missing / wrong modifier", "Price assignment question", "MRN / POS ID question", "Other"],
    reportRecipients: ["alexander.neuse@compass-usa.com", "tyler.leiss@compass-usa.com"],
    workbookStats: {
      sheetCount: workbook.SheetNames.length,
      visibleSheetCount: visibleSheets.length,
      hiddenSheetCount: workbook.SheetNames.length - visibleSheets.length,
      navigationTargetCount: navigationTargets.size,
      parsedMenuCount: menus.length,
      parsedModifierGroupCount: modifierGroups.length,
      parsedPricingRows: priceBook.length,
    },
    navigationTargets: [...navigationTargets],
    priceBook,
    menus,
    modifierGroups,
  };
}

const data = await buildData();
const serialized = `${JSON.stringify(data, null, 2)}\n`;

if (CHECK_MODE) {
  const current = readFileSync(OUTPUT, "utf8");
  assert(current === serialized, "public/data/ssmtSeedData.json is out of date. Run node scripts/build-ssmt-seed-data.mjs.");
  console.log("SSMT seed data is current.");
} else {
  mkdirSync(path.dirname(OUTPUT), { recursive: true });
  writeFileSync(OUTPUT, serialized);
  console.log(`Wrote ${path.relative(ROOT, OUTPUT)} from ${path.relative(ROOT, SOURCE)}.`);
}
