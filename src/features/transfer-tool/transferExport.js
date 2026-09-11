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
    ["Menu", "Item", "MRN", "Portion", "Item + Waste Cost", "Item Count", "Line Value"],
    ...transfer.items.map((line) => [
      line.menu,
      line.item,
      line.mrn,
      line.portion,
      moneyNumber(line.itemWasteCost),
      Number(line.quantity),
      moneyNumber(Number(line.quantity) * Number(line.itemWasteCost)),
    ]),
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
  summarySheet["!cols"] = [{ wch: 28 }, { wch: 38 }, { wch: 16 }, { wch: 18 }, { wch: 20 }, { wch: 13 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Transfer");
  XLSX.writeFile(workbook, transferExportFileName(transfer.title));
}
