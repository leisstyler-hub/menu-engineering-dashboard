import { readFileSync } from "node:fs";

const changelog = readFileSync(new URL("../CHANGELOG.md", import.meta.url), "utf8");
const lines = changelog.split(/\r?\n/);
const entryLines = lines.filter((line) => line.startsWith("- ["));
const timestampPattern =
  /^- \[(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) ([1-9]|[12][0-9]|3[01]), (1[0-2]|[1-9]):([0-5][0-9]) (AM|PM)\] .+/;

const invalidEntries = entryLines.filter((line) => !timestampPattern.test(line));

if (invalidEntries.length > 0) {
  console.error("Changelog entries must use exact local timestamp format like [Jul 18, 1:54 PM]:");
  for (const entry of invalidEntries) {
    console.error(`- ${entry}`);
  }
  process.exit(1);
}

const helper = readFileSync(new URL("./changelog-stamp.mjs", import.meta.url), "utf8");
if (!helper.includes("America/Los_Angeles")) {
  console.error("scripts/changelog-stamp.mjs must generate timestamps in America/Los_Angeles.");
  process.exit(1);
}

console.log(`Changelog timestamp verification passed for ${entryLines.length} entries.`);
