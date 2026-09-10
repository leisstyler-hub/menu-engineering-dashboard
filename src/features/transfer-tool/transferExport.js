import * as XLSX from "xlsx";
import { transferTotal } from "./transferModel.js";

const moneyNumber = (value) => Number(Number(value || 0).toFixed(4));

export function transferExportFileName(title = "Transfer") {
  const safe = String(title).trim().replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, " ").slice(0, 90) || "Transfer";
  return `${safe} Transfer.xlsx`;
}

export function exportTransferWorkbook(transfer) {
  const workbook = XLSX.utils.book_new();
  const summaryRows = [
    ["Transfer Title", transfer.title],
    ["Status", "DRAFT — reference only; submit separately in S4"],
    ["Transfer Date", transfer.transferDate],
    ["Departing Unit", transfer.departingUnit],
    ["Receiving Unit", transfer.receivingUnit],
    ["Total Transfer Value", moneyNumber(transferTotal(transfer.items))],
    [],
    ["Menu", "Item", "MRN", "Portion", "Item + Waste Cost", "Item Count", "Line Value", "G/L Breakdown"],
    ...transfer.items.map((line) => [
      line.menu,
      line.item,
      line.mrn,
      line.portion,
      moneyNumber(line.itemWasteCost),
      Number(line.quantity),
      moneyNumber(Number(line.quantity) * Number(line.itemWasteCost)),
      (line.glGroups || []).map((group) => `${group.code} ${group.category}`).join("; ") || "No mapped G/L beyond excluded water/ice",
    ]),
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
  summarySheet["!cols"] = [{ wch: 28 }, { wch: 38 }, { wch: 16 }, { wch: 18 }, { wch: 20 }, { wch: 13 }, { wch: 16 }, { wch: 52 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Transfer");

  const glRows = [["Line", "Menu", "Item", "MRN", "Item Count", "Item + Waste Cost", "Line Value", "G/L Code", "G/L Category", "Mapped Ingredients", "Allocation Status"]];
  transfer.items.forEach((line, index) => {
    const groups = line.glGroups?.length ? line.glGroups : [{ code: "", category: "", ingredients: [] }];
    groups.forEach((group) => glRows.push([
      index + 1,
      line.menu,
      line.item,
      line.mrn,
      Number(line.quantity),
      moneyNumber(line.itemWasteCost),
      moneyNumber(Number(line.quantity) * Number(line.itemWasteCost)),
      group.code,
      group.category,
      (group.ingredients || []).join("; "),
      "Not allocated — ingredient price index unavailable",
    ]));
  });
  const glSheet = XLSX.utils.aoa_to_sheet(glRows);
  glSheet["!cols"] = [{ wch: 8 }, { wch: 28 }, { wch: 38 }, { wch: 16 }, { wch: 12 }, { wch: 20 }, { wch: 16 }, { wch: 12 }, { wch: 26 }, { wch: 70 }, { wch: 58 }];
  XLSX.utils.book_append_sheet(workbook, glSheet, "G-L Reference");
  XLSX.writeFile(workbook, transferExportFileName(transfer.title));
}
