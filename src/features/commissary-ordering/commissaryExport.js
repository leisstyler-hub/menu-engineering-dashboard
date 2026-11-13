import XLSX from "xlsx-js-style";

import { buildS4Workbook, transferExportFileName } from "../transfer-tool/transferExport.js";
import { COMMISSARY_DEPARTING_UNIT } from "./commissaryCatalog.js";
import { DEFAULT_COMMISSARY_METADATA } from "./commissaryMetadata.js";
import { breakfastOrderLinesForCafe, breakfastPrepLinesForCafe, deliOrderLinesForCafe, deliveryDateForWeek, formatShortDate, globalPrepLinesForCafe, globalTransferLinesForCafe, grillPrepLinesForCafe, grillTransferLinesForCafe, orderLinesForCafe, prepDisplayQuantity, rolledUpPrepItems, transferPeriod, weekLabel } from "./commissaryModel.js";

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

const GRILL_UNIT_SUPPLIED_BUN = /\bbun\b/i;
const PREP_LIST_COLORS = {
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

const border = (color = PREP_LIST_COLORS.border, style = "thin") => ({
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
    font: { name: "Arial", sz: size, bold: true, color: { rgb: PREP_LIST_COLORS.white } },
    fill: { patternType: "solid", fgColor: { rgb: PREP_LIST_COLORS.navy } },
    alignment: { wrapText: true, vertical: "center" },
    border: border(PREP_LIST_COLORS.navy),
  };
}

const headerStyle = {
  font: { name: "Arial", sz: 10, bold: true, color: { rgb: PREP_LIST_COLORS.white } },
  fill: { patternType: "solid", fgColor: { rgb: PREP_LIST_COLORS.navy } },
  alignment: { wrapText: true, vertical: "center", horizontal: "center" },
  border: border(PREP_LIST_COLORS.white),
};

function bodyStyle(fill, isGroupStart = false) {
  return {
    font: { name: "Arial", sz: 10, color: { rgb: PREP_LIST_COLORS.text } },
    fill: { patternType: "solid", fgColor: { rgb: fill } },
    alignment: { vertical: "top", wrapText: true },
    border: {
      ...border(),
      ...(isGroupStart ? { top: { style: "medium", color: { rgb: PREP_LIST_COLORS.blue } } } : {}),
    },
  };
}

function buildDeliveryMapWorksheet(records, delivery, weekStart) {
  const prepLine = (line) => {
    const display = prepDisplayQuantity({ ...line, total: line.quantity, [delivery.key]: line.quantity, cafes: {} });
    return { cafe: line.cafe, station: line.station, name: display.name, mrn: display.mrn, quantity: display[delivery.key], unit: display.orderUnit, finishedDish: display.finishedDish };
  };
  const deliveryLines = records.flatMap((record) => [
    ...orderLinesForCafe(record).filter((line) => Number(line[delivery.key]) > 0).map((line) => ({ cafe: record.cafe, station: "Salad Bar", name: line.name, mrn: line.mrn, quantity: line[delivery.key], unit: line.orderUnit, finishedDish: line.name })),
    ...grillPrepLinesForCafe(record).filter((line) => line.delivery === delivery.key && !GRILL_UNIT_SUPPLIED_BUN.test(line.name)).map(prepLine),
    ...deliOrderLinesForCafe(record).filter((line) => Number(line[delivery.key]) > 0).map((line) => ({ cafe: record.cafe, station: "Deli", name: line.name, mrn: line.mrn, quantity: line[delivery.key], unit: "sandwich", finishedDish: line.name })),
    ...globalPrepLinesForCafe(record).filter((line) => line.delivery === delivery.key).map(prepLine),
    ...breakfastPrepLinesForCafe(record).filter((line) => line.delivery === delivery.key).map(prepLine),
  ]).sort((a, b) => a.cafe.localeCompare(b.cafe) || a.station.localeCompare(b.station) || a.name.localeCompare(b.name) || String(a.mrn).localeCompare(String(b.mrn)));
  const rows = [
    [`${delivery.day} ${formatShortDate(deliveryDateForWeek(weekStart, delivery.key))} Cafe Delivery Map`, "", "", "", "", "", ""],
    [delivery.detail, "", "", "", "", "", ""],
    ["Cafe", "Station", "Ingredient / item", "MRN", "Quantity", "Order unit", "Finished dish"],
    ...deliveryLines.map((line) => [line.cafe, line.station, line.name, line.mrn, line.quantity, line.unit, line.finishedDish]),
  ];
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  worksheet["!merges"] = [XLSX.utils.decode_range("A1:G1"), XLSX.utils.decode_range("A2:G2")];
  worksheet["!cols"] = [18, 16, 30, 14, 12, 20, 30].map((wch) => ({ wch }));
  worksheet["!freeze"] = { xSplit: 0, ySplit: 3, topLeftCell: "A4", activePane: "bottomLeft", state: "frozen" };
  worksheet["!autofilter"] = { ref: `A3:H${Math.max(rows.length, 3)}` };
  worksheet["!margins"] = { left: 0.3, right: 0.3, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 };
  worksheet["!rows"] = rows.map((_, row) => ({ hpt: row === 0 ? 26 : row === 1 ? 21 : row === 2 ? 30 : 23 }));

  let previousGroup = null;
  let cafeBand = -1;
  for (let row = 0; row < rows.length; row += 1) {
    const group = row > 2 ? `${rows[row][0]}|${rows[row][1]}` : null;
    const isGroupStart = row > 2 && group !== previousGroup;
    if (isGroupStart) cafeBand += 1;
    const fill = isGroupStart ? PREP_LIST_COLORS.section : cafeBand % 2 === 0 ? PREP_LIST_COLORS.detailAlt : PREP_LIST_COLORS.detail;
    for (let column = 0; column < 7; column += 1) {
      let style;
      if (row === 0) style = titleStyle();
      else if (row === 1) style = {
        font: { name: "Arial", sz: 10, italic: true, color: { rgb: PREP_LIST_COLORS.muted } },
        fill: { patternType: "solid", fgColor: { rgb: PREP_LIST_COLORS.detail } },
        alignment: { vertical: "center" },
        border: border(PREP_LIST_COLORS.section),
      };
      else if (row === 2) style = headerStyle;
      else style = bodyStyle(fill, isGroupStart);
      if (row > 2 && isGroupStart && [0, 1].includes(column)) style = { ...style, font: { ...style.font, bold: true, color: { rgb: PREP_LIST_COLORS.navy } } };
      setCellStyle(worksheet, row, column, style);
    }
    if (row > 2) previousGroup = group;
  }
  return worksheet;
}

function buildPrepListWorksheet(rows, delivery, weekStart) {
  const dayRows = rows.filter((row) => Number(row[delivery.key]) > 0);
  const worksheetRows = [
    [`${delivery.day} Prep List`, "", "", "", "", ""],
    [`${delivery.detail} · ${delivery.day} ${formatShortDate(deliveryDateForWeek(weekStart, delivery.key))}`, "", "", "", "", ""],
    ["Ingredient / item", "Total quantity", "Order unit", "Production type", "Production family", "Finished dish"],
    ...dayRows.map((row) => [row.name, row[delivery.key], row.orderUnit, row.productionType, row.productionFamily, row.finishedDish || row.name]),
  ];
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetRows);
  worksheet["!merges"] = [XLSX.utils.decode_range("A1:F1"), XLSX.utils.decode_range("A2:F2")];
  worksheet["!cols"] = [30, 14, 18, 24, 22, 28].map((wch) => ({ wch }));
  worksheet["!freeze"] = { xSplit: 0, ySplit: 3, topLeftCell: "A4", activePane: "bottomLeft", state: "frozen" };
  worksheet["!autofilter"] = { ref: `A3:F${Math.max(worksheetRows.length, 3)}` };
  worksheet["!margins"] = { left: 0.25, right: 0.25, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 };
  worksheet["!rows"] = worksheetRows.map((_, row) => ({ hpt: row === 0 ? 28 : row === 1 ? 22 : row === 2 ? 34 : 25 }));
  let previousCategory = null;
  let categoryBand = -1;
  for (let row = 0; row < worksheetRows.length; row += 1) {
    const category = row > 2 ? worksheetRows[row][3] : null;
    const isGroupStart = row > 2 && category !== previousCategory;
    if (isGroupStart) categoryBand += 1;
    const fill = isGroupStart ? PREP_LIST_COLORS.section : categoryBand % 2 === 0 ? PREP_LIST_COLORS.detailAlt : PREP_LIST_COLORS.detail;
    for (let column = 0; column < 6; column += 1) {
      let style;
      if (row === 0) style = titleStyle();
      else if (row === 1) style = { font: { name: "Arial", sz: 10, italic: true, color: { rgb: PREP_LIST_COLORS.muted } }, fill: { patternType: "solid", fgColor: { rgb: PREP_LIST_COLORS.detail } }, alignment: { vertical: "center" }, border: border(PREP_LIST_COLORS.section) };
      else if (row === 2) style = headerStyle;
      else style = bodyStyle(fill, isGroupStart);
      if (row > 2 && isGroupStart && [0, 3].includes(column)) style = { ...style, font: { ...style.font, bold: true, color: { rgb: PREP_LIST_COLORS.navy } } };
      setCellStyle(worksheet, row, column, style);
    }
    if (row > 2) previousCategory = category;
  }
  return worksheet;
}

export function buildCommissaryBomWorkbook(records, weekStart, metadata = DEFAULT_COMMISSARY_METADATA) {
  const rows = rolledUpPrepItems(records, { consolidateAcrossStations: true });

  const automationRows = [
    ["Portion Plan — Power Automate input area", "", "", "Calculation rows — maintain for Power Automate", "", "", "", ""],
    [`Commissary production · Week ${weekLabel(weekStart)}`, "", "", "", "", "", "", ""],
    ["Finished dish", "Planned portions", "Current status", "Technique key", "Finished dish", "Normalized unit", "Required qty", "Planning quantity"],
    ...rows.map((row) => [
      row.finishedDish || row.name,
      row.total,
      "Locked order",
      `${row.productionType}|${row.id}`,
      row.name,
      row.orderUnit,
      row.total,
      row.total,
    ]),
  ];
  const automationWorksheet = XLSX.utils.aoa_to_sheet(automationRows);
  automationWorksheet["!merges"] = [XLSX.utils.decode_range("A1:C1"), XLSX.utils.decode_range("D1:H1"), XLSX.utils.decode_range("A2:H2")];
  automationWorksheet["!cols"] = [28, 16, 18, 30, 28, 18, 14, 18].map((wch) => ({ wch }));
  automationWorksheet["!freeze"] = { xSplit: 0, ySplit: 3, topLeftCell: "A4", activePane: "bottomLeft", state: "frozen" };
  automationWorksheet["!autofilter"] = { ref: `A3:H${Math.max(automationRows.length, 3)}` };
  automationWorksheet["!margins"] = { left: 0.25, right: 0.25, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 };
  automationWorksheet["!rows"] = automationRows.map((_, row) => ({ hpt: row === 0 ? 28 : row === 1 ? 22 : row === 2 ? 34 : 25 }));

  let previousAutomationCategory = null;
  let automationBand = -1;
  for (let row = 0; row < automationRows.length; row += 1) {
    const category = row > 2 ? String(automationRows[row][3]).split("|")[0] : null;
    const isGroupStart = row > 2 && category !== previousAutomationCategory;
    if (isGroupStart) automationBand += 1;
    const fill = isGroupStart ? PREP_LIST_COLORS.section : automationBand % 2 === 0 ? PREP_LIST_COLORS.detailAlt : PREP_LIST_COLORS.detail;
    for (let column = 0; column < 8; column += 1) {
      let style;
      if (row === 0) style = titleStyle();
      else if (row === 1) style = {
        font: { name: "Arial", sz: 10, italic: true, color: { rgb: PREP_LIST_COLORS.muted } },
        fill: { patternType: "solid", fgColor: { rgb: PREP_LIST_COLORS.detail } },
        alignment: { vertical: "center" },
        border: border(PREP_LIST_COLORS.section),
      };
      else if (row === 2) style = headerStyle;
      else style = bodyStyle(fill, isGroupStart);
      if (row > 2 && isGroupStart && [0, 3].includes(column)) style = { ...style, font: { ...style.font, bold: true, color: { rgb: PREP_LIST_COLORS.navy } } };
      setCellStyle(automationWorksheet, row, column, style);
    }
    if (row > 2) previousAutomationCategory = category;
  }

  const workbook = XLSX.utils.book_new();
  metadata.deliveries.forEach((delivery) => XLSX.utils.book_append_sheet(workbook, buildPrepListWorksheet(rows, delivery, weekStart), `${delivery.day} Prep List`));
  metadata.deliveries.forEach((delivery) => XLSX.utils.book_append_sheet(workbook, buildDeliveryMapWorksheet(records, delivery, weekStart), `${delivery.day} Delivery Map`));
  XLSX.utils.book_append_sheet(workbook, automationWorksheet, "Power Automate");
  workbook.Workbook ||= {};
  workbook.Workbook.Sheets = workbook.SheetNames.map((name) => ({ name, Hidden: name === "Power Automate" ? 1 : 0 }));
  return workbook;
}

export function exportCommissaryBom(records, weekStart, metadata = DEFAULT_COMMISSARY_METADATA) {
  const bytes = XLSX.write(buildCommissaryBomWorkbook(records, weekStart, metadata), { type: "array", bookType: "xlsx", cellStyles: true });
  downloadBytes(bytes, `Commissary Prep List ${weekStart}.xlsx`, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
}

export function buildCommissaryTransfer(record, metadata = DEFAULT_COMMISSARY_METADATA) {
  const receiver = metadata.receivingCafes.find(({ name }) => name === record.cafe);
  const period = transferPeriod(record.weekStart);
  return {
    title: `Commissary Order ${record.cafe} ${period.start} to ${period.end}`,
    departingUnit: COMMISSARY_DEPARTING_UNIT.name,
    departingProfitCenter: COMMISSARY_DEPARTING_UNIT.profitCenter,
    receivingUnit: record.cafe,
    receivingProfitCenter: receiver?.profitCenter || "",
    transferDate: period.end,
    eventId: "",
    s4ExportVersion: 1,
    items: [
      ...orderLinesForCafe(record).map((line) => ({
      catalogId: line.id,
      menu: "Commissary Salad Bar",
      item: `${line.name} (${line.total} ${line.orderUnit}${line.total === 1 ? "" : "s"})`,
      mrn: line.mrn,
      quantity: line.total,
      itemWasteCost: line.orderUnitCost,
      ingredientAllocations: [{
        ingredientName: line.transferGlCategory || "Prepared Foods",
        ingredientMrn: line.mrn,
        glCode: line.transferGlCode || PREPARED_FOODS_GL,
        allocationPerPortion: line.orderUnitCost,
      }],
      })),
      ...grillTransferLinesForCafe(record).map((line) => ({
        catalogId: line.id,
        menu: line.menu,
        item: `${line.name} for ${line.finishedDish}`,
        mrn: line.mrn,
        quantity: line.quantity,
        itemWasteCost: line.itemWasteCost,
        ingredientAllocations: [{
          ingredientName: line.name,
          ingredientMrn: line.mrn,
          glCode: line.glCode,
          allocationPerPortion: line.itemWasteCost,
        }],
      })),
      ...deliOrderLinesForCafe(record).map((line) => ({
        catalogId: line.id,
        menu: line.menu,
        item: `${line.name} (${line.total} sandwich${line.total === 1 ? "" : "es"})`,
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
      ...globalTransferLinesForCafe(record).map((line) => ({
        catalogId: line.id,
        menu: line.menu,
        item: `${line.name} for ${line.finishedDish}`,
        mrn: line.mrn,
        quantity: line.quantity,
        itemWasteCost: line.itemWasteCost,
        ingredientAllocations: [{
          ingredientName: line.name,
          ingredientMrn: line.mrn,
          glCode: line.glCode,
          allocationPerPortion: line.itemWasteCost,
        }],
      })),
      ...breakfastOrderLinesForCafe(record).map((line) => ({
        catalogId: line.id,
        menu: line.menu,
        item: `${line.name} (${line.total} item${line.total === 1 ? "" : "s"})`,
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
    ],
  };
}

export async function exportCommissaryTransfer(record, metadata = DEFAULT_COMMISSARY_METADATA) {
  const response = await fetch(S4_TEMPLATE_URL);
  if (!response.ok) throw new Error("The required S4 transfer template is unavailable.");
  const transfer = buildCommissaryTransfer(record, metadata);
  const bytes = await buildS4Workbook(await response.arrayBuffer(), transfer);
  downloadBytes(bytes, transferExportFileName(transfer.title), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
}
