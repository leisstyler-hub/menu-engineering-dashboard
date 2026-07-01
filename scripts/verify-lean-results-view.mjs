import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const source = fs.readFileSync(path.join(root, "src", "features", "lean-tool", "LeanTool.jsx"), "utf8");

function fail(message) {
  console.error(`Lean Results view check failed: ${message}`);
  process.exitCode = 1;
}

if (!/const \[selectedResultId, setSelectedResultId\] = useState\(""\);/.test(source)) {
  fail("Lean Results must track the selected result row.");
}

if (!/function LeanResultHistoryTable/.test(source) || !/Click a row to open the saved observation/.test(source)) {
  fail("Lean Results must use a clean clickable history table.");
}

if (!/onSelectResult/.test(source) || !/onClick=\{\(\) => onSelectResult\(result\.id\)\}/.test(source)) {
  fail("Lean Results rows must open their saved detail panel when clicked.");
}

if (!/Delete Record/.test(source) || !/onRequestVoid\(result\)/.test(source)) {
  fail("Lean Results rows must include a controlled Delete Record action.");
}

if (!/function LeanResultsSummary/.test(source) || !/Active Results/.test(source) || !/Hidden \/ Deleted/.test(source)) {
  fail("Lean Results must lead with compact summary cards instead of a noisy trend block.");
}

if (/Cafe \/ Station List/.test(source) || /function LeanTrendPanel/.test(source)) {
  fail("Lean Results should not show the old cafe/station list or trend panel in the main results view.");
}

if (!process.exitCode) {
  console.log("Lean Results view checks passed.");
}
