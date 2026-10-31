import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { buildPackoutPdfBytes } from "../src/features/commissary-ordering/commissaryPackout.js";

const outputDirectory = resolve("tmp/pdfs");
const outputPath = resolve(outputDirectory, "commissary-packout-sample.pdf");
const lines = (station, prefix, count) => Array.from({ length: count }, (_, index) => ({
  id: `${station}-${index}`,
  station,
  name: `${prefix} ${index + 1}${index === 1 ? " with a deliberately long operational item name" : ""}`,
  mrn: String(10000 + index),
  orderUnit: index % 3 === 0 ? "gallon" : index % 3 === 1 ? "quart" : "each",
  quantity: Number((index + 1.25).toFixed(2)),
  finishedDish: `${station} service item ${index + 1}`,
}));

const packet = {
  version: 1,
  weekStart: "2026-11-16",
  weekLabel: "11/16-11/20",
  packingChecks: ["Labels and date dots", "Lidded food containers", "Transport cart", "Towels and sanitizer", "Serving utensils", "Thermometer"],
  pages: [{
    cafe: "Nessie",
    deliveryKey: "monday",
    deliveryDay: "Monday",
    deliveryDate: "2026-11-16",
    deliveryDetail: "Tuesday-Wednesday service",
    stations: [
      { station: "Salad Bar", lines: lines("Salad Bar", "Salad component", 5) },
      { station: "Deli", lines: lines("Deli", "Deli component", 5) },
      { station: "Grill", lines: lines("Grill", "Grill component", 5) },
      { station: "Global", lines: lines("Global", "Global component", 7) },
    ],
  }],
};

await mkdir(outputDirectory, { recursive: true });
await writeFile(outputPath, buildPackoutPdfBytes(packet));
console.log(outputPath);
