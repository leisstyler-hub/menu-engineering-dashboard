export const MENU_AUDIT_STORAGE_KEY = "culinaryToolsMenuAuditFiles_v1";

export function preserveSpreadsheetText(value) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/^'/, "").replace(/\r?\n+/g, " ").replace(/\s+/g, " ").trim();
}

export function cellDisplayText(sheet, address) {
  const cell = sheet?.[address];
  if (!cell) return "";
  const display = preserveSpreadsheetText(cell.w);
  if (display) return display;
  return preserveSpreadsheetText(cell.v);
}

function decodeRange(ref = "A1:A1") {
  const [start, end = start] = ref.split(":");
  return { start: decodeCell(start), end: decodeCell(end) };
}

function decodeCell(address = "A1") {
  const match = String(address).match(/^([A-Z]+)(\d+)$/i);
  if (!match) return { row: 1, col: 1 };
  let col = 0;
  for (const letter of match[1].toUpperCase()) col = col * 26 + (letter.charCodeAt(0) - 64);
  return { row: Number(match[2]), col };
}

export function columnLetterToNumber(letter) {
  return decodeCell(`${letter}1`).col;
}

function columnNumberToLetter(number) {
  let value = Number(number);
  let output = "";
  while (value > 0) {
    const remainder = (value - 1) % 26;
    output = String.fromCharCode(65 + remainder) + output;
    value = Math.floor((value - 1) / 26);
  }
  return output || "A";
}

function rowCell(sheet, row, column) {
  const col = typeof column === "number" ? columnNumberToLetter(column) : column;
  return cellDisplayText(sheet, `${col}${row}`);
}

function cleanName(value) {
  return preserveSpreadsheetText(value).replace(/^(EURNA|EUR|AMZ|RA):\s*/i, "").trim();
}

function findHeaderColumn(sheet, headerRow, candidates = []) {
  const range = decodeRange(sheet?.["!ref"]);
  const wanted = candidates.map((value) => String(value).toLowerCase());
  for (let col = range.start.col; col <= range.end.col; col += 1) {
    const text = rowCell(sheet, headerRow, col).toLowerCase();
    if (wanted.includes(text)) return col;
  }
  return null;
}

function makeRawFields(sheet, row, headerRow = 1) {
  const range = decodeRange(sheet?.["!ref"]);
  const rawFields = {};
  for (let col = range.start.col; col <= range.end.col; col += 1) {
    const header = rowCell(sheet, headerRow, col) || columnNumberToLetter(col);
    const value = rowCell(sheet, row, col);
    if (value) rawFields[header] = value;
  }
  return rawFields;
}

function rowField(sheet, row, headerRow, candidates = [], fallbackColumn = null) {
  const column = findHeaderColumn(sheet, headerRow, candidates) || fallbackColumn;
  return column ? rowCell(sheet, row, column) : "";
}

function fileDisplayDate(uploadedAt) {
  const date = uploadedAt ? new Date(uploadedAt) : new Date();
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10);
  return date.toISOString().slice(0, 10);
}

function uploadedFileId(sourceType, brandName, uploadedAt) {
  return `${sourceType}:${preserveSpreadsheetText(brandName || "active").toLowerCase()}:${uploadedAt || Date.now()}`;
}

export function parseCentricBrandWorkbook(workbook, { originalFileName = "Brand Report.xlsx", uploadedAt = new Date().toISOString() } = {}) {
  const brandSheet = workbook?.Sheets?.Brand;
  const itemsSheet = workbook?.Sheets?.Items;
  const modifiersSheet = workbook?.Sheets?.Modifiers;
  if (!brandSheet) throw new Error("Brand Report is missing the Brand tab.");
  if (!itemsSheet) throw new Error("Brand Report is missing the Items tab.");
  if (!modifiersSheet) throw new Error("Brand Report is missing the Modifiers tab.");

  const brandName = cellDisplayText(brandSheet, "B2") || cellDisplayText(brandSheet, "A2");
  if (!brandName) throw new Error("Brand Report Brand tab did not include a brand/menu name.");

  const displayFileName = `Centric Brand Report - ${brandName} - ${fileDisplayDate(uploadedAt)}`;
  const uploadedFile = {
    id: uploadedFileId("centric_brand", brandName, uploadedAt),
    sourceType: "centric_brand",
    originalFileName,
    displayFileName,
    brandName,
    menuName: brandName,
    uploadedAt,
    parsedAt: new Date().toISOString(),
    active: true,
  };

  const records = [
    ...parseCentricItems(itemsSheet, brandName, uploadedFile),
    ...parseCentricModifiers(modifiersSheet, brandName, uploadedFile),
  ];
  return { uploadedFile, brandName, records };
}

function parseCentricItems(sheet, brandName, uploadedFile) {
  const range = decodeRange(sheet["!ref"]);
  const mrnCol = findHeaderColumn(sheet, 1, ["mrn"]) || columnLetterToNumber("Z");
  const nameCol = findHeaderColumn(sheet, 1, ["name"]) || columnLetterToNumber("D");
  const labelCol = findHeaderColumn(sheet, 1, ["label"]) || columnLetterToNumber("E");
  const descriptionCol = findHeaderColumn(sheet, 1, ["description"]) || columnLetterToNumber("I");
  const reportingPrimaryCol = findHeaderColumn(sheet, 1, ["reporting_category_primary"]);
  const reportingSecondaryCol = findHeaderColumn(sheet, 1, ["reporting_category_secondary", "line_route"]);
  const categoryCol = reportingPrimaryCol || reportingSecondaryCol || columnLetterToNumber("R");
  const priceCol = findHeaderColumn(sheet, 1, ["price", "base_price", "retail_price"]);
  const caloriesCol = findHeaderColumn(sheet, 1, ["calories", "kcal", "cal"]);
  const rows = [];
  for (let row = 2; row <= range.end.row; row += 1) {
    const name = rowCell(sheet, row, nameCol) || rowCell(sheet, row, labelCol);
    const mrn = rowCell(sheet, row, mrnCol);
    if (!name && !mrn) continue;
    const reportingCategoryPrimary = reportingPrimaryCol ? rowCell(sheet, row, reportingPrimaryCol) : "";
    const reportingCategorySecondary = reportingSecondaryCol ? rowCell(sheet, row, reportingSecondaryCol) : "";
    rows.push({
      id: `${uploadedFile.id}:item:${row}`,
      source: "centric_brand",
      brandName,
      menuName: brandName,
      recordType: "item",
      name: preserveSpreadsheetText(name),
      displayName: cleanName(name || rowCell(sheet, row, labelCol)),
      mrn,
      category: rowCell(sheet, row, categoryCol),
      reportingCategoryPrimary,
      reportingCategorySecondary,
      price: priceCol ? rowCell(sheet, row, priceCol) : "",
      calories: caloriesCol ? rowCell(sheet, row, caloriesCol) : "",
      description: rowCell(sheet, row, descriptionCol),
      sourceTab: "Items",
      sourceRowNumber: row,
      sourceColumnMap: { name: columnNumberToLetter(nameCol), mrn: columnNumberToLetter(mrnCol), category: columnNumberToLetter(categoryCol), description: columnNumberToLetter(descriptionCol) },
      rawFields: makeRawFields(sheet, row, 1),
      uploadedFileId: uploadedFile.id,
      uploadedAt: uploadedFile.uploadedAt,
      parsedAt: uploadedFile.parsedAt,
    });
  }
  return rows;
}

function parseCentricModifiers(sheet, brandName, uploadedFile) {
  const range = decodeRange(sheet["!ref"]);
  const mrnCol = findHeaderColumn(sheet, 1, ["mrn"]) || columnLetterToNumber("AZ");
  const nameCol = findHeaderColumn(sheet, 1, ["name"]) || columnLetterToNumber("D");
  const labelCol = findHeaderColumn(sheet, 1, ["label"]) || columnLetterToNumber("E");
  const descriptionCol = findHeaderColumn(sheet, 1, ["description"]) || columnLetterToNumber("I");
  const reportingPrimaryCol = findHeaderColumn(sheet, 1, ["reporting_category_primary"]);
  const reportingSecondaryCol = findHeaderColumn(sheet, 1, ["reporting_category_secondary"]);
  const categoryCol = reportingPrimaryCol || reportingSecondaryCol || columnLetterToNumber("R");
  const priceCol = findHeaderColumn(sheet, 1, ["price", "base_price", "retail_price"]);
  const caloriesCol = findHeaderColumn(sheet, 1, ["calories", "kcal", "cal"]);
  const rows = [];
  for (let row = 2; row <= range.end.row; row += 1) {
    const name = rowCell(sheet, row, nameCol) || rowCell(sheet, row, labelCol);
    const mrn = rowCell(sheet, row, mrnCol);
    if (!name && !mrn) continue;
    const reportingCategoryPrimary = reportingPrimaryCol ? rowCell(sheet, row, reportingPrimaryCol) : "";
    const reportingCategorySecondary = reportingSecondaryCol ? rowCell(sheet, row, reportingSecondaryCol) : "";
    rows.push({
      id: `${uploadedFile.id}:modifier:${row}`,
      source: "centric_brand",
      brandName,
      menuName: brandName,
      recordType: "modifier",
      name: preserveSpreadsheetText(name),
      displayName: cleanName(name || rowCell(sheet, row, labelCol)),
      mrn,
      category: "Modifier",
      reportingCategoryPrimary,
      reportingCategorySecondary,
      price: priceCol ? rowCell(sheet, row, priceCol) : "",
      calories: caloriesCol ? rowCell(sheet, row, caloriesCol) : "",
      description: rowCell(sheet, row, descriptionCol),
      sourceTab: "Modifiers",
      sourceRowNumber: row,
      sourceColumnMap: { name: columnNumberToLetter(nameCol), mrn: columnNumberToLetter(mrnCol), category: columnNumberToLetter(categoryCol), description: columnNumberToLetter(descriptionCol) },
      rawFields: makeRawFields(sheet, row, 1),
      uploadedFileId: uploadedFile.id,
      uploadedAt: uploadedFile.uploadedAt,
      parsedAt: uploadedFile.parsedAt,
    });
  }
  return rows;
}

export function parseSsmtWorkbook(workbook, { originalFileName = "SEA Standard Menu Template.xlsx", uploadedAt = new Date().toISOString() } = {}) {
  const uploadedFile = {
    id: uploadedFileId("ssmt", "active", uploadedAt),
    sourceType: "ssmt",
    originalFileName,
    displayFileName: "Active SSMT Data",
    uploadedAt,
    parsedAt: new Date().toISOString(),
    active: true,
  };
  const records = [];
  for (const sheetName of workbook?.SheetNames || []) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet?.["!ref"]) continue;
    if (/modifier/i.test(sheetName)) records.push(...parseSsmtModifierSheet(sheet, sheetName, uploadedFile));
    else records.push(...parseSsmtItemSheet(sheet, sheetName, uploadedFile));
  }
  return { uploadedFile, records };
}

function parseSsmtItemSheet(sheet, sheetName, uploadedFile) {
  const range = decodeRange(sheet["!ref"]);
  const records = [];
  const mrnCol = findHeaderColumn(sheet, 1, ["mrn"]) || columnLetterToNumber("I");
  const nameCol = 1;
  const labelCol = 2;
  const descriptionCol = findHeaderColumn(sheet, 1, ["description"]) || 3;
  const brandCol = findHeaderColumn(sheet, 1, ["brand (menu)"]) || 15;
  const categoryCol = findHeaderColumn(sheet, 1, ["category"]) || 16;
  const reportingPrimaryCol = findHeaderColumn(sheet, 1, ["reporting_category_primary"]);
  const reportingSecondaryCol = findHeaderColumn(sheet, 1, ["reporting_category_secondary"]);
  const priceCol = findHeaderColumn(sheet, 1, ["price"]);
  const caloriesCol = findHeaderColumn(sheet, 1, ["calories", "kcal", "cal"]);
  for (let row = 2; row <= range.end.row; row += 1) {
    const name = rowCell(sheet, row, nameCol) || rowCell(sheet, row, labelCol);
    const mrn = rowCell(sheet, row, mrnCol);
    if (!name && !mrn) continue;
    if (/^(fixy|label|mrn)$/i.test(name) || /^mrn$/i.test(mrn)) continue;
    if (/^remove\b/i.test(name)) continue;
    records.push({
      id: `${uploadedFile.id}:${sheetName}:item:${row}`,
      source: "ssmt",
      brandName: rowCell(sheet, row, brandCol) || sheetName,
      menuName: rowCell(sheet, row, brandCol) || sheetName,
      recordType: "item",
      name,
      displayName: cleanName(name),
      mrn,
      category: rowField(sheet, row, 1, ["reporting_category_primary"], categoryCol),
      reportingCategoryPrimary: reportingPrimaryCol ? rowCell(sheet, row, reportingPrimaryCol) : "",
      reportingCategorySecondary: reportingSecondaryCol ? rowCell(sheet, row, reportingSecondaryCol) : "",
      price: priceCol ? rowCell(sheet, row, priceCol) : "",
      calories: caloriesCol ? rowCell(sheet, row, caloriesCol) : "",
      description: rowCell(sheet, row, descriptionCol),
      sourceTab: sheetName,
      sourceRowNumber: row,
      rawFields: makeRawFields(sheet, row, 1),
      uploadedFileId: uploadedFile.id,
      uploadedAt: uploadedFile.uploadedAt,
      parsedAt: uploadedFile.parsedAt,
    });
  }
  return records;
}

function parseSsmtModifierSheet(sheet, sheetName, uploadedFile) {
  const range = decodeRange(sheet["!ref"]);
  const records = [];
  let currentGroup = "";
  for (let row = 2; row <= range.end.row; row += 1) {
    const groupName = rowCell(sheet, row, 2);
    if (groupName && !/^modifier name$/i.test(groupName)) currentGroup = groupName;
    const name = rowCell(sheet, row, 6) || rowCell(sheet, row, 5);
    const mrn = rowCell(sheet, row, 7);
    if (!name && !mrn) continue;
    if (/^(choices|mrn|forced\/add\/remove\?)$/i.test(name) || /^mrn$/i.test(mrn)) continue;
    if (/^remove\b/i.test(name)) continue;
    records.push({
      id: `${uploadedFile.id}:${sheetName}:modifier:${row}`,
      source: "ssmt",
      brandName: sheetName.replace(/\s+Modifiers$/i, ""),
      menuName: sheetName.replace(/\s+Modifiers$/i, ""),
      recordType: "modifier",
      name,
      displayName: cleanName(name),
      mrn,
      category: "Modifier",
      reportingCategoryPrimary: "",
      reportingCategorySecondary: "Modifier",
      price: rowCell(sheet, row, 9),
      calories: "",
      description: rowCell(sheet, row, 8),
      sourceTab: sheetName,
      sourceRowNumber: row,
      sourceColumnMap: { group: "B", name: "F", mrn: "G", description: "H" },
      rawFields: { modifierGroup: currentGroup, ...makeRawFields(sheet, row, 1) },
      uploadedFileId: uploadedFile.id,
      uploadedAt: uploadedFile.uploadedAt,
      parsedAt: uploadedFile.parsedAt,
    });
  }
  return records;
}

function parseCsvRows(text) {
  const rows = [];
  let field = "";
  let row = [];
  let quoted = false;
  const input = String(text || "");
  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];
    if (char === "\"" && quoted && next === "\"") {
      field += "\"";
      index += 1;
      continue;
    }
    if (char === "\"") {
      quoted = !quoted;
      continue;
    }
    if (char === "," && !quoted) {
      row.push(field);
      field = "";
      continue;
    }
    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(field);
      if (row.some((cell) => preserveSpreadsheetText(cell))) rows.push(row);
      row = [];
      field = "";
      continue;
    }
    field += char;
  }
  row.push(field);
  if (row.some((cell) => preserveSpreadsheetText(cell))) rows.push(row);
  return rows;
}

export function parseMenuWorksCsvText(csvText, { uploadedAt = new Date().toISOString() } = {}) {
  const rows = parseCsvRows(csvText);
  const headers = rows[0] || [];
  const headerIndex = new Map(headers.map((header, index) => [preserveSpreadsheetText(header).toLowerCase(), index]));
  const value = (row, header) => preserveSpreadsheetText(row[headerIndex.get(header.toLowerCase())]);
  return rows.slice(1).map((row, index) => ({
    id: `master-app:${index + 2}`,
    source: "master_app",
    brandName: value(row, "Menu Name"),
    menuName: value(row, "Menu Name"),
    recordType: "item",
    name: value(row, "Recipe Name") || value(row, "Short Name"),
    displayName: cleanName(value(row, "Short Name") || value(row, "Recipe Name")),
    mrn: value(row, "Recipe Number"),
    category: value(row, "Recipe Category.") || value(row, "Menu Item Notes"),
    reportingCategoryPrimary: value(row, "Reporting Category Primary") || value(row, "Reporting Category") || "",
    reportingCategorySecondary: value(row, "Reporting Category Secondary") || "",
    price: value(row, "Sell Price"),
    calories: value(row, "KCAL") || value(row, "Calories"),
    description: value(row, "Enticing Description"),
    sourceTab: "Master App Data",
    sourceRowNumber: index + 2,
    rawFields: Object.fromEntries(headers.map((header, headerIndexValue) => [preserveSpreadsheetText(header), preserveSpreadsheetText(row[headerIndexValue])])),
    uploadedAt,
    parsedAt: new Date().toISOString(),
  })).filter((row) => row.name || row.mrn);
}

export function masterAppRowsToAuditRecords(rows = []) {
  return rows.map((row, index) => ({
    id: `master-app:${row.id || index}`,
    source: "master_app",
    brandName: row.menu || row.menuName,
    menuName: row.menu || row.menuName,
    recordType: "item",
    name: row.recipeName || row.displayName || row.item || row.shortName,
    displayName: cleanName(row.displayName || row.item || row.recipeName || row.shortName),
    mrn: preserveSpreadsheetText(row.mrn || row.MRN),
    category: row.category || row.recipeCategory,
    reportingCategoryPrimary: row.reportingCategoryPrimary || row.rawFields?.reporting_category_primary || row.rawFields?.["Reporting Category Primary"] || "",
    reportingCategorySecondary: row.reportingCategorySecondary || row.rawFields?.reporting_category_secondary || row.rawFields?.["Reporting Category Secondary"] || "",
    price: preserveSpreadsheetText(row.suggestedRetailPrice || row.sellPrice || row.price),
    calories: preserveSpreadsheetText(row.calories),
    description: row.enticingDescription || row.menuWorksDescription || row.ingredientsCommonName,
    sourceTab: "Master App Data",
    sourceRowNumber: row.id || index + 1,
    rawFields: row,
  })).filter((row) => row.name || row.mrn);
}

function compareKey(record) {
  const mrn = preserveSpreadsheetText(record.mrn);
  if (mrn) return `${record.recordType}:mrn:${mrn}`;
  return `${record.recordType}:name:${preserveSpreadsheetText(record.displayName || record.name).toLowerCase()}`;
}

export function normalizeMenuScope(value) {
  return preserveSpreadsheetText(value)
    .replace(/^(AMZ|RA|EURNA|EUR):\s*/i, "")
    .replace(/\bamazon\b/gi, "")
    .replace(/\(v\d+\)/gi, "")
    .replace(/[^a-z0-9]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function menuScopeMatches(menuValue, brandValue) {
  const menu = normalizeMenuScope(menuValue);
  const brand = normalizeMenuScope(brandValue);
  if (!menu || !brand) return false;
  if (menu === brand || menu.includes(brand) || brand.includes(menu)) return true;
  const menuTokens = new Set(menu.split(" ").filter((token) => token.length > 2));
  const brandTokens = brand.split(" ").filter((token) => token.length > 2);
  if (!brandTokens.length) return false;
  const overlap = brandTokens.filter((token) => menuTokens.has(token)).length;
  return overlap >= Math.min(2, brandTokens.length);
}

function recordMatchesBrandScope(record, brandName) {
  return [
    record?.menuName,
    record?.brandName,
    record?.sourceTab,
  ].some((value) => menuScopeMatches(value, brandName));
}

export function filterRecordsForBrandAudit({ baseRecords = [], brandReports = [], selectedMenu = "All menus" } = {}) {
  const selected = selectedMenu || "All menus";
  const selectedReports = selected === "All menus"
    ? brandReports
    : brandReports.filter((report) => menuScopeMatches(selected, report.brandName));
  const selectedBrandRecords = selectedReports.flatMap((report) => report.records || []);
  const selectedBrandKeys = new Set(selectedBrandRecords.map((record) => compareKey(record)));
  const matchingBrandNames = selectedReports.map((report) => report.brandName);
  const scopedBaseRecords = baseRecords.filter((record) => {
    if (selectedBrandKeys.has(compareKey(record))) return true;
    return matchingBrandNames.some((brandName) => recordMatchesBrandScope(record, brandName));
  });
  return {
    records: selectedReports.length ? [...scopedBaseRecords, ...selectedBrandRecords] : [],
    hasUploadedBrandForScope: selectedReports.length > 0,
    uploadedBrandNames: brandReports.map((report) => report.brandName),
    matchingBrandNames,
  };
}

function severityFor(status) {
  if (/Missing|MRN|Remove|Programming/.test(status)) return "High";
  if (/Category|Description/.test(status)) return "Medium";
  if (/Name/.test(status)) return "Low";
  return "Clear";
}

function comparableCategory(row) {
  if (row?.recordType === "modifier") return preserveSpreadsheetText(row?.category || "Modifier").toLowerCase();
  return preserveSpreadsheetText(row?.reportingCategoryPrimary || row?.category).toLowerCase();
}

function statusForSources({ expected, master, ssmt, brand, recordType }) {
  if (recordType === "modifier") {
    if (expected.has("centric_brand") && brand && !ssmt) return "Remove from Centric Brand";
    if (expected.has("centric_brand") && ssmt && !brand) return "Needs Centric Programming";
    if (expected.has("ssmt") && !ssmt) return "Missing from SSMT";
    return "Match";
  }
  if (expected.has("centric_brand") && brand && !master && !ssmt) return "Remove from Centric Brand";
  if (expected.has("centric_brand") && (master || ssmt) && !brand) return "Needs Centric Programming";
  if (expected.has("ssmt") && !ssmt) return "Missing from SSMT";
  if (expected.has("master_app") && !master) return "Missing from Culinary App";
  if (expected.has("centric_brand") && !brand) return "Missing from Brand Report";
  return "Match";
}

export function buildAuditComparison(records = [], { expectedSources = ["master_app", "ssmt", "centric_brand"] } = {}) {
  const expected = new Set(expectedSources);
  const grouped = new Map();
  records.forEach((record) => {
    const key = compareKey(record);
    if (!grouped.has(key)) grouped.set(key, {});
    grouped.get(key)[record.source] = record;
  });
  return Array.from(grouped.values()).map((sources, index) => {
    const master = sources.master_app || null;
    const ssmt = sources.ssmt || null;
    const brand = sources.centric_brand || null;
    const present = [
      expected.has("master_app") ? master : null,
      expected.has("ssmt") ? ssmt : null,
      expected.has("centric_brand") ? brand : null,
    ].filter(Boolean);
    const recordType = present[0]?.recordType || master?.recordType || ssmt?.recordType || brand?.recordType || "item";
    let status = statusForSources({ expected, master, ssmt, brand, recordType });
    if (status !== "Match") {
      return {
        id: `audit:${index}`,
        status,
        severity: severityFor(status),
        recordType,
        menuName: brand?.menuName || ssmt?.menuName || master?.menuName || "",
        master,
        ssmt,
        brand,
      };
    }
    else if (new Set(present.map((row) => preserveSpreadsheetText(row.mrn)).filter(Boolean)).size > 1) status = "MRN Mismatch";
    else if (new Set(present.map((row) => comparableCategory(row)).filter(Boolean)).size > 1) status = "Category Mismatch";
    else if (new Set(present.map((row) => preserveSpreadsheetText(row.description).toLowerCase()).filter(Boolean)).size > 1) status = "Description Mismatch";
    else if (new Set(present.map((row) => preserveSpreadsheetText(row.displayName || row.name).toLowerCase()).filter(Boolean)).size > 1) status = "Name Difference Only";
    return {
      id: `audit:${index}`,
      status,
      severity: severityFor(status),
      recordType,
      menuName: brand?.menuName || ssmt?.menuName || master?.menuName || "",
      master,
      ssmt,
      brand,
    };
  }).sort((a, b) => a.status.localeCompare(b.status) || a.recordType.localeCompare(b.recordType));
}

export function auditSummary(rows = []) {
  const count = (label) => rows.filter((row) => row.status === label).length;
  return {
    total: rows.length,
    matches: count("Match"),
    mismatches: rows.filter((row) => row.status !== "Match").length,
    missingSsmt: count("Missing from SSMT"),
    missingMaster: count("Missing from Culinary App"),
    missingBrand: count("Missing from Brand Report"),
    removeFromBrand: count("Remove from Centric Brand"),
    needsCentricProgramming: count("Needs Centric Programming"),
    mrnMismatches: count("MRN Mismatch"),
    categoryMismatches: count("Category Mismatch"),
    descriptionMismatches: count("Description Mismatch"),
    nameDifferences: count("Name Difference Only"),
  };
}

export function exportAuditRowsToCsv(rows = []) {
  const headers = [
    "Status",
    "Severity",
    "Record Type",
    "Menu/Brand",
    "Master App Name",
    "SSMT Name",
    "Brand Report Name",
    "Master App MRN",
    "SSMT MRN",
    "Brand Report MRN",
    "Master App Category",
    "SSMT Category",
    "Brand Report Category",
    "Master App Price",
    "SSMT Price",
    "Brand Report Price",
    "Master App Calories",
    "SSMT Calories",
    "Brand Report Calories",
    "Master App Description",
    "SSMT Description",
    "Brand Report Description",
  ];
  const csvEscape = (value) => `"${preserveSpreadsheetText(value).replace(/"/g, "\"\"")}"`;
  const body = rows.map((row) => [
    row.status,
    row.severity,
    row.recordType,
    row.menuName,
    row.master?.name,
    row.ssmt?.name,
    row.brand?.name,
    row.master?.mrn,
    row.ssmt?.mrn,
    row.brand?.mrn,
    row.master?.category,
    row.ssmt?.category,
    row.brand?.category,
    row.master?.price,
    row.ssmt?.price,
    row.brand?.price,
    row.master?.calories,
    row.ssmt?.calories,
    row.brand?.calories,
    row.master?.description,
    row.ssmt?.description,
    row.brand?.description,
  ]);
  return [headers, ...body].map((line) => line.map(csvEscape).join(",")).join("\n");
}
