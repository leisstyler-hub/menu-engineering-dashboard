import {
  COMMISSARY_PACKOUT_PACKET_VERSION,
  COMMISSARY_STATION_ORDER,
  DELIVERY_KEYS,
  deliPrepLinesForCafe,
  deliveryDateForWeek,
  formatShortDate,
  globalPrepLinesForCafe,
  grillPrepLinesForCafe,
  orderLinesForCafe,
  prepDisplayQuantity,
  weekLabel,
} from "./commissaryModel.js";
import { DEFAULT_COMMISSARY_METADATA } from "./commissaryMetadata.js";

const PACKING_CHECKS = Object.freeze([
  "Labels and date dots",
  "Lidded food containers",
  "Transport cart",
  "Towels and sanitizer",
  "Serving utensils",
  "Thermometer",
]);

const ascii = (value = "") => String(value)
  .normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[–—]/g, "-")
  .replace(/[‘’]/g, "'")
  .replace(/[“”]/g, '"')
  .replace(/[^\x20-\x7E]/g, "");

const quantityText = (value) => Number(value).toLocaleString("en-US", { maximumFractionDigits: 2 });

function packoutSourceLines(record, delivery) {
  const salad = orderLinesForCafe(record)
    .filter((line) => Number(line[delivery]) > 0)
    .map((line) => ({
      id: `salad|${line.id}`,
      station: "Salad Bar",
      name: line.name,
      mrn: line.mrn,
      orderUnit: line.orderUnit,
      finishedDish: line.name,
      quantity: Number(line[delivery]),
    }));
  return [
    ...salad,
    ...deliPrepLinesForCafe(record).filter((line) => line.delivery === delivery),
    ...grillPrepLinesForCafe(record).filter((line) => line.delivery === delivery),
    ...globalPrepLinesForCafe(record).filter((line) => line.delivery === delivery),
  ];
}

function rollupPackoutLines(lines = [], delivery) {
  const map = new Map();
  lines.forEach((line) => {
    const key = `${line.station}|${line.id}|${line.orderUnit}`;
    const current = map.get(key) || {
      id: line.id,
      station: line.station,
      name: line.name,
      mrn: line.mrn || "",
      orderUnit: line.orderUnit,
      finishedDishes: new Set(),
      quantity: 0,
    };
    current.finishedDishes.add(line.finishedDish || line.name);
    current.quantity = Number((current.quantity + Number(line.quantity || 0)).toFixed(4));
    map.set(key, current);
  });
  return [...map.values()].map((line) => {
    const display = prepDisplayQuantity({
      ...line,
      finishedDish: [...line.finishedDishes].sort().join("; "),
      total: line.quantity,
      [delivery]: line.quantity,
      cafes: {},
    });
    return {
      id: display.id,
      station: display.station,
      name: display.name,
      mrn: display.mrn,
      orderUnit: display.orderUnit,
      quantity: display[delivery],
      finishedDish: display.finishedDish,
    };
  }).sort((a, b) => COMMISSARY_STATION_ORDER.indexOf(a.station) - COMMISSARY_STATION_ORDER.indexOf(b.station)
    || a.name.localeCompare(b.name));
}

export function buildPackoutPacket(records = [], weekStart, metadata = DEFAULT_COMMISSARY_METADATA) {
  const cafes = [...new Set(records.map(({ cafe }) => cafe).filter(Boolean))].sort();
  const pages = cafes.flatMap((cafe) => {
    const record = records.find((candidate) => candidate.cafe === cafe && candidate.weekStart === weekStart);
    if (!record) return [];
    return metadata.deliveries.flatMap((delivery) => {
      const lines = rollupPackoutLines(packoutSourceLines(record, delivery.key), delivery.key);
      if (!lines.length) return [];
      return [{
        cafe,
        deliveryKey: delivery.key,
        deliveryDay: delivery.day,
        deliveryDate: deliveryDateForWeek(weekStart, delivery.key),
        deliveryDetail: delivery.detail,
        stations: COMMISSARY_STATION_ORDER.flatMap((station) => {
          const stationLines = lines.filter((line) => line.station === station);
          return stationLines.length ? [{ station, lines: stationLines }] : [];
        }),
      }];
    });
  });
  return {
    version: COMMISSARY_PACKOUT_PACKET_VERSION,
    weekStart,
    weekLabel: weekLabel(weekStart),
    packingChecks: [...PACKING_CHECKS],
    pages,
  };
}

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 28;
const ROW_HEIGHT = 28;
const STATION_HEIGHT = 24;
const TABLE_TOP = 590;
const TABLE_BOTTOM = 52;

const pdfText = (value) => `(${ascii(value).replace(/([\\()])/g, "\\$1")})`;
const text = (value, x, y, size = 10, bold = false, color = "0.12 0.18 0.27") => `${color} rg BT /${bold ? "F2" : "F1"} ${size} Tf 1 0 0 1 ${x} ${y} Tm ${pdfText(value)} Tj ET\n`;
const fillRect = (x, y, width, height, color) => `${color} rg ${x} ${y} ${width} ${height} re f\n`;
const strokeRect = (x, y, width, height, color = "0.75 0.82 0.88") => `${color} RG 0.8 w ${x} ${y} ${width} ${height} re S\n`;
const line = (x1, y1, x2, y2, color = "0.75 0.82 0.88") => `${color} RG 0.8 w ${x1} ${y1} m ${x2} ${y2} l S\n`;

function wrap(value, maxChars) {
  const words = ascii(value).split(/\s+/).filter(Boolean);
  const rows = [];
  words.forEach((word) => {
    if (!rows.length || `${rows.at(-1)} ${word}`.length > maxChars) rows.push(word);
    else rows[rows.length - 1] += ` ${word}`;
  });
  return rows.length ? rows : [""];
}

function drawHeader(packet, part, pageNumber, pageCount) {
  let commands = fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, "1 1 1");
  commands += fillRect(0, 700, PAGE_WIDTH, 92, "0.09 0.21 0.36");
  commands += text("COMMISSARY PACK-OUT CHECKLIST", MARGIN, 758, 17, true, "1 1 1");
  commands += text(part.cafe, MARGIN, 730, 25, true, "1 1 1");
  commands += text(`${part.deliveryDay} ${formatShortDate(part.deliveryDate)} delivery`, 364, 750, 12, true, "0.73 0.88 0.98");
  commands += text(`Service week ${packet.weekLabel}`, 364, 731, 10, false, "1 1 1");
  commands += text(`${part.deliveryDetail}  |  Page ${pageNumber} of ${pageCount}`, 364, 714, 8, false, "0.84 0.88 0.92");
  commands += fillRect(MARGIN, 620, PAGE_WIDTH - (MARGIN * 2), 62, "0.91 0.95 0.98");
  commands += text("PACKING CHECK", MARGIN + 8, 660, 8, true, "0.09 0.21 0.36");
  packet.packingChecks.forEach((label, index) => {
    const column = index % 3;
    const row = Math.floor(index / 3);
    const x = MARGIN + 105 + (column * 148);
    const y = 657 - (row * 24);
    commands += strokeRect(x, y, 9, 9, "0.35 0.61 0.82");
    commands += text(label, x + 14, y + 1, 6.8, index < 3, "0.18 0.25 0.35");
  });
  commands += fillRect(MARGIN, TABLE_TOP, PAGE_WIDTH - (MARGIN * 2), 25, "0.36 0.61 0.82");
  const columns = [MARGIN, MARGIN + 28, MARGIN + 100, MARGIN + 332, MARGIN + 472, PAGE_WIDTH - MARGIN];
  ["", "Station", "Item / Recipe Number", "Used In", "Qty"].forEach((label, index) => {
    commands += text(label, columns[index] + 5, TABLE_TOP + 8, 8, true, "1 1 1");
  });
  columns.forEach((column) => { commands += line(column, TABLE_BOTTOM, column, TABLE_TOP + 25, "0.78 0.84 0.89"); });
  commands += line(columns.at(-1), TABLE_BOTTOM, columns.at(-1), TABLE_TOP + 25, "0.78 0.84 0.89");
  commands += text("Completed by: ______________________________", MARGIN, 25, 8, false, "0.33 0.40 0.48");
  commands += text("Generated from saved Culinary Platform orders", 360, 25, 7, false, "0.44 0.50 0.58");
  return commands;
}

function paginate(page) {
  const capacity = (TABLE_TOP - TABLE_BOTTOM) / ROW_HEIGHT;
  const chunks = [];
  let current = [];
  let used = 0;
  const stationUnits = STATION_HEIGHT / ROW_HEIGHT;
  const pushChunk = () => {
    if (current.length) chunks.push(current);
    current = [];
    used = 0;
  };
  page.stations.forEach(({ station, lines }) => {
    const minimumStationBlock = stationUnits + Math.min(2, lines.length);
    if (current.length && (capacity - used) < minimumStationBlock) pushChunk();
    current.push({ type: "station", station });
    used += stationUnits;
    lines.forEach((row) => {
      if (used + 1 > capacity) {
        pushChunk();
        current.push({ type: "station", station: `${station} - continued` });
        used += stationUnits;
      }
      current.push({ type: "item", ...row });
      used += 1;
    });
  });
  if (current.length) chunks.push(current);
  return chunks;
}

function drawRows(commands, rows) {
  let y = TABLE_TOP;
  rows.forEach((row, index) => {
    if (row.type === "station") {
      y -= STATION_HEIGHT;
      commands += fillRect(MARGIN, y, PAGE_WIDTH - (MARGIN * 2), STATION_HEIGHT, "0.85 0.92 0.97");
      commands += text(row.station, MARGIN + 8, y + 8, 10, true, "0.09 0.34 0.55");
      commands += line(MARGIN, y, PAGE_WIDTH - MARGIN, y, "0.36 0.61 0.82");
      return;
    }
    y -= ROW_HEIGHT;
    if (index % 2) commands += fillRect(MARGIN, y, PAGE_WIDTH - (MARGIN * 2), ROW_HEIGHT, "0.97 0.98 0.99");
    commands += strokeRect(MARGIN + 8, y + 9, 10, 10, "0.35 0.45 0.55");
    const itemLines = wrap(`${row.name}${row.mrn ? ` - ${row.mrn}` : ""}`, 40).slice(0, 2);
    const usedIn = wrap(row.finishedDish || row.name, 24).slice(0, 2);
    itemLines.forEach((value, lineIndex) => { commands += text(value, MARGIN + 105, y + 17 - (lineIndex * 10), 7.5, lineIndex === 0, "0.12 0.18 0.27"); });
    usedIn.forEach((value, lineIndex) => { commands += text(value, MARGIN + 337, y + 17 - (lineIndex * 10), 7, false, "0.27 0.34 0.42"); });
    commands += text(`${quantityText(row.quantity)} ${row.orderUnit}`, MARGIN + 477, y + 11, 8, true, "0.03 0.40 0.30");
    commands += line(MARGIN, y, PAGE_WIDTH - MARGIN, y, "0.82 0.86 0.90");
  });
  return commands;
}

function serializePdf(pageStreams) {
  const objects = [];
  const add = (body) => { objects.push(body); return objects.length; };
  const catalogId = add("");
  const pagesId = add("");
  const regularFontId = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const boldFontId = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
  const pageIds = [];
  pageStreams.forEach((stream) => {
    const contentLength = new TextEncoder().encode(stream).length;
    const contentId = add(`<< /Length ${contentLength} >>\nstream\n${stream}endstream`);
    const pageId = add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 ${regularFontId} 0 R /F2 ${boldFontId} 0 R >> >> /Contents ${contentId} 0 R >>`);
    pageIds.push(pageId);
  });
  objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
  objects[pagesId - 1] = `<< /Type /Pages /Count ${pageIds.length} /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] >>`;
  let output = "%PDF-1.4\n% Culinary Platform Packout\n";
  const offsets = [0];
  objects.forEach((body, index) => {
    offsets.push(new TextEncoder().encode(output).length);
    output += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = new TextEncoder().encode(output).length;
  output += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  output += offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("");
  output += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new TextEncoder().encode(output);
}

export function buildPackoutPdfBytes(packet) {
  if (!packet?.pages?.length) throw new Error("No saved commissary quantities are available for this packout packet.");
  const streams = packet.pages.flatMap((page) => {
    const chunks = paginate(page);
    return chunks.map((rows, index) => drawRows(drawHeader(packet, page, index + 1, chunks.length), rows));
  });
  return serializePdf(streams);
}

export function downloadPackoutPdf(bytes, weekStart) {
  const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `Commissary Packout Packet ${weekStart}.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export const PACKOUT_DELIVERY_KEYS = DELIVERY_KEYS;
