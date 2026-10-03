import * as XLSX from "xlsx";

import { buildS4Workbook, transferExportFileName } from "../transfer-tool/transferExport.js";
import { COMMISSARY_DEPARTING_UNIT, COMMISSARY_RECEIVING_CAFES } from "./commissaryCatalog.js";
import { orderLinesForCafe, rolledUpItems, transferPeriod, weekLabel } from "./commissaryModel.js";

const S4_TEMPLATE_URL = "/templates/ExpenseTransfer_Between_PC_Template.xlsx";
const PREPARED_FOODS_GL = "4111011";

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

const moneyFormat = "$#,##0.00";

export function buildCommissaryBomWorkbook(records, weekStart) {
  const rows = rolledUpItems(records);
  const worksheetRows = [
    ["Ingredient Technique BOM Tree", "", "", "", "", "", "Portion Plan — Power Automate input area", "", "", "Calculation rows — maintain for Power Automate", "", "", "", ""],
    [`Commissary salad bar · Week ${weekLabel(weekStart)}`, "", "", "", "", "", "", "", "", "", "", "", "", ""],
    ["Received ingredient / item", "Prep technique", "Subrecipe / component", "Finished dish", "Total quantity", "Order unit", "Finished dish", "Planned portions", "Current status", "Technique key", "Finished dish", "Normalized unit", "Required qty", "Planning quantity"],
    ...rows.map((row) => [
      row.name,
      row.notes || row.category,
      row.category,
      row.name,
      row.total,
      row.orderUnit,
      row.name,
      row.total,
      "Locked order",
      `${row.category}|${row.id}`,
      row.name,
      row.orderUnit,
      row.total,
      row.total,
    ]),
    [],
    ["Per-unit delivery breakdown"],
    ["Cafe", "Delivery", "Item", "MRN", "Quantity", "Order unit", "Unit cost", "Extended cost"],
    ...records.flatMap((record) => orderLinesForCafe(record).flatMap((line) => [
      [record.cafe, "Monday delivery (Mon–Wed service)", line.name, line.mrn, line.monday, line.orderUnit, line.orderUnitCost, line.monday * line.orderUnitCost],
      [record.cafe, "Wednesday delivery (Thu–Fri service)", line.name, line.mrn, line.wednesday, line.orderUnit, line.orderUnitCost, line.wednesday * line.orderUnitCost],
    ].filter((row) => row[4] > 0))),
  ];
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetRows);
  worksheet["!merges"] = [XLSX.utils.decode_range("A1:F1"), XLSX.utils.decode_range("G1:I1"), XLSX.utils.decode_range("J1:N1"), XLSX.utils.decode_range("A2:N2")];
  worksheet["!cols"] = [30, 24, 22, 28, 14, 18, 28, 16, 18, 30, 28, 18, 14, 18].map((wch) => ({ wch }));
  worksheet["!freeze"] = { xSplit: 0, ySplit: 3, topLeftCell: "A4", activePane: "bottomLeft", state: "frozen" };
  Object.keys(worksheet).filter((cell) => !cell.startsWith("!")).forEach((cell) => {
    const row = XLSX.utils.decode_cell(cell).r;
    worksheet[cell].s = row <= 2
      ? { font: { bold: true, color: { rgb: row === 0 ? "FFFFFF" : "0F172A" } }, fill: { fgColor: { rgb: row === 0 ? "071125" : "E0F2FE" } }, alignment: { wrapText: true, vertical: "center" } }
      : { alignment: { vertical: "top", wrapText: true } };
    if (row > 2 && [6, 7].includes(XLSX.utils.decode_cell(cell).c)) worksheet[cell].z = moneyFormat;
  });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Ingredient Technique BOM");
  return workbook;
}

export function exportCommissaryBom(records, weekStart) {
  const bytes = XLSX.write(buildCommissaryBomWorkbook(records, weekStart), { type: "array", bookType: "xlsx", cellStyles: true });
  downloadBytes(bytes, `Commissary Salad Bar BOM ${weekStart}.xlsx`, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
}

export function buildCommissaryTransfer(record) {
  const receiver = COMMISSARY_RECEIVING_CAFES.find(({ name }) => name === record.cafe);
  const period = transferPeriod(record.weekStart);
  return {
    title: `Commissary Salad Bar ${record.cafe} ${period.start} to ${period.end}`,
    departingUnit: COMMISSARY_DEPARTING_UNIT.name,
    departingProfitCenter: COMMISSARY_DEPARTING_UNIT.profitCenter,
    receivingUnit: record.cafe,
    receivingProfitCenter: receiver?.profitCenter || "",
    transferDate: period.end,
    eventId: "",
    s4ExportVersion: 1,
    items: orderLinesForCafe(record).map((line) => ({
      catalogId: line.id,
      menu: "Commissary Salad Bar",
      item: `${line.name} (${line.total} ${line.orderUnit}${line.total === 1 ? "" : "s"})`,
      mrn: line.mrn,
      quantity: line.total,
      itemWasteCost: line.orderUnitCost,
      ingredientAllocations: [{
        ingredientName: "Prepared Foods",
        ingredientMrn: line.mrn,
        glCode: PREPARED_FOODS_GL,
        allocationPerPortion: line.orderUnitCost,
      }],
    })),
  };
}

export async function exportCommissaryTransfer(record) {
  const response = await fetch(S4_TEMPLATE_URL);
  if (!response.ok) throw new Error("The required S4 transfer template is unavailable.");
  const transfer = buildCommissaryTransfer(record);
  const bytes = await buildS4Workbook(await response.arrayBuffer(), transfer);
  downloadBytes(bytes, transferExportFileName(transfer.title), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
}
