import XLSX from "xlsx-js-style";

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
const BOM_COLORS = {
  navy: "17365D",
  blue: "5B9BD5",
  section: "D9EAF7",
  detail: "EAF2F8",
  detailAlt: "F3F8FC",
  border: "D7E1EA",
  text: "1F2937",
  muted: "4B5563",
  white: "FFFFFF",
};

const border = (color = BOM_COLORS.border, style = "thin") => ({
  top: { style, color: { rgb: color } },
  right: { style, color: { rgb: color } },
  bottom: { style, color: { rgb: color } },
  left: { style, color: { rgb: color } },
});

function setCellStyle(worksheet, row, column, style, valueFormat) {
  const address = XLSX.utils.encode_cell({ r: row, c: column });
  worksheet[address] ||= { t: "s", v: "" };
  worksheet[address].s = style;
  if (valueFormat) worksheet[address].z = valueFormat;
}

function titleStyle(size = 15) {
  return {
    font: { name: "Arial", sz: size, bold: true, color: { rgb: BOM_COLORS.white } },
    fill: { patternType: "solid", fgColor: { rgb: BOM_COLORS.navy } },
    alignment: { wrapText: true, vertical: "center" },
    border: border(BOM_COLORS.navy),
  };
}

const headerStyle = {
  font: { name: "Arial", sz: 10, bold: true, color: { rgb: BOM_COLORS.white } },
  fill: { patternType: "solid", fgColor: { rgb: BOM_COLORS.navy } },
  alignment: { wrapText: true, vertical: "center", horizontal: "center" },
  border: border(BOM_COLORS.white),
};

function bodyStyle(fill, isGroupStart = false) {
  return {
    font: { name: "Arial", sz: 10, color: { rgb: BOM_COLORS.text } },
    fill: { patternType: "solid", fgColor: { rgb: fill } },
    alignment: { vertical: "top", wrapText: true },
    border: {
      ...border(),
      ...(isGroupStart ? { top: { style: "medium", color: { rgb: BOM_COLORS.blue } } } : {}),
    },
  };
}

function buildDeliveryMapWorksheet(records, delivery) {
  const isMonday = delivery === "monday";
  const rows = [
    [`${isMonday ? "Monday" : "Wednesday"} Cafe Delivery Map`, "", "", "", "", "", ""],
    [isMonday ? "Monday–Wednesday service" : "Thursday–Friday service", "", "", "", "", "", ""],
    ["Cafe", "Item", "MRN", "Quantity", "Order unit", "Unit cost", "Extended cost"],
    ...records.flatMap((record) => orderLinesForCafe(record)
      .filter((line) => Number(line[delivery]) > 0)
      .map((line) => [record.cafe, line.name, line.mrn, line[delivery], line.orderUnit, line.orderUnitCost, line[delivery] * line.orderUnitCost])),
  ];
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  worksheet["!merges"] = [XLSX.utils.decode_range("A1:G1"), XLSX.utils.decode_range("A2:G2")];
  worksheet["!cols"] = [18, 30, 14, 12, 20, 14, 16].map((wch) => ({ wch }));
  worksheet["!freeze"] = { xSplit: 0, ySplit: 3, topLeftCell: "A4", activePane: "bottomLeft", state: "frozen" };
  worksheet["!autofilter"] = { ref: `A3:G${Math.max(rows.length, 3)}` };
  worksheet["!margins"] = { left: 0.3, right: 0.3, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 };
  worksheet["!rows"] = rows.map((_, row) => ({ hpt: row === 0 ? 26 : row === 1 ? 21 : row === 2 ? 30 : 23 }));

  let previousCafe = null;
  let cafeBand = -1;
  for (let row = 0; row < rows.length; row += 1) {
    const cafe = row > 2 ? rows[row][0] : null;
    const isGroupStart = row > 2 && cafe !== previousCafe;
    if (isGroupStart) cafeBand += 1;
    const fill = isGroupStart ? BOM_COLORS.section : cafeBand % 2 === 0 ? BOM_COLORS.detailAlt : BOM_COLORS.detail;
    for (let column = 0; column < 7; column += 1) {
      let style;
      if (row === 0) style = titleStyle();
      else if (row === 1) style = {
        font: { name: "Arial", sz: 10, italic: true, color: { rgb: BOM_COLORS.muted } },
        fill: { patternType: "solid", fgColor: { rgb: BOM_COLORS.detail } },
        alignment: { vertical: "center" },
        border: border(BOM_COLORS.section),
      };
      else if (row === 2) style = headerStyle;
      else style = bodyStyle(fill, isGroupStart);
      if (row > 2 && isGroupStart && column === 0) style = { ...style, font: { ...style.font, bold: true, color: { rgb: BOM_COLORS.navy } } };
      setCellStyle(worksheet, row, column, style, row > 2 && [5, 6].includes(column) ? moneyFormat : undefined);
    }
    if (row > 2) previousCafe = cafe;
  }
  return worksheet;
}

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
  ];
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetRows);
  worksheet["!merges"] = [XLSX.utils.decode_range("A1:F1"), XLSX.utils.decode_range("G1:I1"), XLSX.utils.decode_range("J1:N1"), XLSX.utils.decode_range("A2:N2")];
  worksheet["!cols"] = [30, 24, 22, 28, 14, 18, 28, 16, 18, 30, 28, 18, 14, 18].map((wch) => ({ wch }));
  worksheet["!freeze"] = { xSplit: 0, ySplit: 3, topLeftCell: "A4", activePane: "bottomLeft", state: "frozen" };
  worksheet["!autofilter"] = { ref: `A3:N${Math.max(worksheetRows.length, 3)}` };
  worksheet["!margins"] = { left: 0.25, right: 0.25, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 };
  worksheet["!rows"] = worksheetRows.map((_, row) => ({ hpt: row === 0 ? 28 : row === 1 ? 22 : row === 2 ? 34 : 25 }));

  let previousCategory = null;
  let categoryBand = -1;
  for (let row = 0; row < worksheetRows.length; row += 1) {
    const category = row > 2 ? worksheetRows[row][2] : null;
    const isGroupStart = row > 2 && category !== previousCategory;
    if (isGroupStart) categoryBand += 1;
    const fill = isGroupStart ? BOM_COLORS.section : categoryBand % 2 === 0 ? BOM_COLORS.detailAlt : BOM_COLORS.detail;
    for (let column = 0; column < 14; column += 1) {
      let style;
      if (row === 0) style = titleStyle();
      else if (row === 1) style = {
        font: { name: "Arial", sz: 10, italic: true, color: { rgb: BOM_COLORS.muted } },
        fill: { patternType: "solid", fgColor: { rgb: BOM_COLORS.detail } },
        alignment: { vertical: "center" },
        border: border(BOM_COLORS.section),
      };
      else if (row === 2) style = headerStyle;
      else style = bodyStyle(fill, isGroupStart);
      if (row > 2 && isGroupStart && [0, 2].includes(column)) style = { ...style, font: { ...style.font, bold: true, color: { rgb: BOM_COLORS.navy } } };
      setCellStyle(worksheet, row, column, style);
    }
    if (row > 2) previousCategory = category;
  }
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Consolidated Prep List");
  XLSX.utils.book_append_sheet(workbook, buildDeliveryMapWorksheet(records, "monday"), "Monday Delivery Map");
  XLSX.utils.book_append_sheet(workbook, buildDeliveryMapWorksheet(records, "wednesday"), "Wednesday Delivery Map");
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
