import JSZip from "jszip";

import { S4_MAX_ROWS, defaultTransferDescription, trimToLength, validateS4Transfer } from "./transferModel.js";

export const S4_TEMPLATE_URL = "/templates/ExpenseTransfer_Between_PC_Template.xlsx";
export const S4_TEMPLATE_SHA256 = "AD2AAA07280553F0FBB2B1F1A3DCE94101F478BB5A27AC7891A70F4BF80AE8E0";

const xmlEscape = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&apos;");

const stringCell = (column, row, value) => `<c r="${column}${row}" t="inlineStr"><is><t xml:space="preserve">${xmlEscape(value)}</t></is></c>`;
const numberCell = (column, row, value) => `<c r="${column}${row}" t="n"><v>${Number(Number(value).toFixed(2))}</v></c>`;

export function transferExportFileName(title = "Transfer") {
  const safe = String(title).trim().replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, " ").slice(0, 90) || "Transfer";
  return `${safe} Expense Transfer.xlsx`;
}

export function transferZipFileName() {
  return `S4 Expense Transfers ${new Date().toISOString().slice(0, 10)}.zip`;
}

export function buildS4Rows(transfer = {}) {
  const errors = validateS4Transfer(transfer);
  if (Object.keys(errors).length) throw new Error(Object.values(errors)[0]);
  return (transfer.items || []).filter((item) => item.catalogId).flatMap((line) => (
    reconcileLineAmounts(line).map(({ allocation, transferAmount }) => ({
      fromGlAccount: String(allocation.glCode),
      receivingProfitCenter: String(transfer.receivingProfitCenter),
      toGlAccount: String(allocation.glCode),
      description: defaultTransferDescription(`${line.item} ${allocation.ingredientName}`, transfer.title),
      transferAmount,
      eventId: trimToLength(transfer.eventId, 18),
    }))
  )).slice(0, S4_MAX_ROWS);
}

function reconcileLineAmounts(line) {
  const targetCents = Math.round(Number(line.quantity) * Number(line.itemWasteCost) * 100);
  const amounts = line.ingredientAllocations.map((allocation) => ({
    allocation,
    cents: Math.round(Number(line.quantity) * Number(allocation.allocationPerPortion) * 100),
  }));
  let difference = targetCents - amounts.reduce((sum, amount) => sum + amount.cents, 0);
  const adjustmentOrder = amounts
    .map((amount, index) => ({ index, cents: amount.cents }))
    .sort((left, right) => right.cents - left.cents);
  let cursor = 0;
  while (difference !== 0 && adjustmentOrder.length) {
    const target = amounts[adjustmentOrder[cursor % adjustmentOrder.length].index];
    const step = difference > 0 ? 1 : -1;
    if (target.cents + step >= 0) {
      target.cents += step;
      difference -= step;
    }
    cursor += 1;
  }
  return amounts.map(({ allocation, cents }) => ({ allocation, transferAmount: cents / 100 }));
}

export async function buildS4Workbook(templateBytes, transfer) {
  const rows = buildS4Rows(transfer);
  const zip = await JSZip.loadAsync(templateBytes);
  const sheetPath = "xl/worksheets/sheet1.xml";
  const worksheet = await zip.file(sheetPath)?.async("string");
  if (!worksheet) throw new Error("The S4 template is missing its Template worksheet.");
  const header = worksheet.match(/<row r="1"[\s\S]*?<\/row>/)?.[0];
  if (!header) throw new Error("The S4 template header row could not be read.");
  const dataRows = rows.map((line, index) => {
    const row = index + 2;
    return `<row r="${row}" spans="1:6">${stringCell("A", row, line.fromGlAccount)}${stringCell("B", row, line.receivingProfitCenter)}${stringCell("C", row, line.toGlAccount)}${stringCell("D", row, line.description)}${numberCell("E", row, line.transferAmount)}${stringCell("F", row, line.eventId)}</row>`;
  });
  const lastRow = Math.max(1, rows.length + 1);
  const patched = worksheet
    .replace(/<dimension ref="[^"]*"\/>/, `<dimension ref="A1:F${lastRow}"/>`)
    .replace(/<sheetData>[\s\S]*?<\/sheetData>/, `<sheetData>${header}${dataRows.join("")}</sheetData>`);
  zip.file(sheetPath, patched);
  return zip.generateAsync({ type: "uint8array", compression: "DEFLATE", compressionOptions: { level: 6 } });
}

async function fetchTemplate() {
  const response = await fetch(S4_TEMPLATE_URL);
  if (!response.ok) throw new Error("The S4 expense-transfer template is unavailable.");
  return response.arrayBuffer();
}

function downloadBytes(bytes, fileName, mimeType) {
  const url = URL.createObjectURL(new Blob([bytes], { type: mimeType }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export async function exportTransferWorkbook(transfer) {
  const templateBytes = await fetchTemplate();
  const workbookBytes = await buildS4Workbook(templateBytes, transfer);
  downloadBytes(workbookBytes, transferExportFileName(transfer.title), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
}

export async function exportTransferZip(transfers = []) {
  if (!transfers.length) throw new Error("Select at least one saved transfer.");
  const templateBytes = await fetchTemplate();
  const archive = new JSZip();
  const usedNames = new Set();
  for (const transfer of transfers) {
    let fileName = transferExportFileName(transfer.title);
    let suffix = 2;
    while (usedNames.has(fileName.toLocaleLowerCase("en-US"))) {
      fileName = transferExportFileName(`${transfer.title} ${suffix}`);
      suffix += 1;
    }
    usedNames.add(fileName.toLocaleLowerCase("en-US"));
    archive.file(fileName, await buildS4Workbook(templateBytes, transfer));
  }
  const zipBytes = await archive.generateAsync({ type: "uint8array", compression: "DEFLATE", compressionOptions: { level: 6 } });
  downloadBytes(zipBytes, transferZipFileName(), "application/zip");
}
