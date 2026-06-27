import { readFileSync } from "node:fs";

const changelog = readFileSync(new URL("../CHANGELOG.md", import.meta.url), "utf8");
const june26Block = changelog.split("## 2026-06-23")[0] ?? "";

const wrongAmEntries = june26Block
  .split("\n")
  .filter((line) => line.includes("[Jun 26,") && line.includes(" AM]"));

if (wrongAmEntries.length > 0) {
  console.error("Jun 26 changelog entries should use PM timestamps:");
  for (const entry of wrongAmEntries) {
    console.error(`- ${entry}`);
  }
  process.exit(1);
}

const requiredPmEntries = ["Jun 26, 7:10 PM", "Jun 26, 7:44 PM"];
const missing = requiredPmEntries.filter((timestamp) => !june26Block.includes(timestamp));

if (missing.length > 0) {
  console.error(`Missing expected PM changelog timestamps: ${missing.join(", ")}`);
  process.exit(1);
}

console.log("Changelog timestamps are PM for the current Jun 26 release block.");
