import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const rotationSource = fs.readFileSync(path.join(root, "src", "features", "neighborhood-rotations", "NeighborhoodRotations.jsx"), "utf8");
const leanSource = fs.readFileSync(path.join(root, "src", "features", "lean-tool", "LeanTool.jsx"), "utf8");
const backboneClient = fs.readFileSync(path.join(root, "src", "integrations", "storage", "backboneClient.js"), "utf8");
const storageEndpoint = fs.readFileSync(path.join(root, "api", "storage", "records.js"), "utf8");
const smartsheetEndpoint = fs.readFileSync(path.join(root, "api", "smartsheet", "records.js"), "utf8");

function fail(message) {
  console.error(`Submission health check failed: ${message}`);
  process.exitCode = 1;
}

if (!/await persistRotationToDatabase\?\.\(nextRotation, \{ optimistic: false, requirePrimary: true \}\)/.test(rotationSource)) {
  fail("rotation submit must wait for confirmed primary storage before locking the UI");
}

const submitFunction = rotationSource.match(/const submitRotation = async \(\) => \{[\s\S]*?\n  \};/)?.[0] || "";

if (/status: "Submitted"/.test(submitFunction) && /updateRotation\(nextRotation\);\s*persistRotationToDatabase\?\.\(nextRotation\)/.test(submitFunction)) {
  fail("rotation submit still has an optimistic submitted-state save path");
}

if (!/replaceParentRecordIds: \[rotationRecordParentId\(week, district, selectedCafe\)\]/.test(rotationSource)) {
  fail("rotation submits must replace stale child rows for the same cafe/week");
}

if (!/findStaleRowIds/.test(storageEndpoint) || !/deleteRecordIds\(staleRowIds\)/.test(storageEndpoint)) {
  fail("Supabase storage endpoint must remove stale child rows during resubmission");
}

if (!/loadAllSupabaseRows/.test(storageEndpoint) || !/offset \+= pageSize/.test(storageEndpoint)) {
  fail("Supabase storage endpoint must page through all matching rows instead of stopping at the 1,000-row REST cap");
}

if (!/dedupeRowsByRecordId/.test(storageEndpoint) || !/duplicateRowsSkipped/.test(storageEndpoint)) {
  fail("Supabase storage endpoint must dedupe duplicate Record IDs before upsert");
}

if (!/dedupeRecordsByRecordId/.test(smartsheetEndpoint) || !/duplicateRowsSkipped/.test(smartsheetEndpoint)) {
  fail("Smartsheet storage endpoint must dedupe duplicate Record IDs before row updates");
}

if (!/syncRecordsToSupabase/.test(backboneClient) || !/syncRecordsToSmartsheet/.test(backboneClient) || !/smartsheet-fallback/.test(backboneClient)) {
  fail("shared storage client must keep Supabase primary and Smartsheet fallback behavior");
}

if (!/mergeRecordsById/.test(backboneClient) || !/supabase\+smartsheet-read/.test(backboneClient)) {
  fail("rotation reads must support merged Supabase and Smartsheet mirror recall");
}

if (!/loadRecordsFromBackbone\(\{ tool: "rotation" \}\)/.test(rotationSource) || /loadRecordsFromBackbone\(\{ tool: "rotation", mergeFallback: true \}\)/.test(rotationSource)) {
  fail("Neighborhood Rotations must treat Supabase as authoritative and use Smartsheet only as fallback");
}

if (!/parentsWithSubmittedChildren/.test(rotationSource) || !/submittedParentIds/.test(rotationSource)) {
  fail("submitted rotation recall must exclude stale Draft children when confirmed Submitted children exist");
}

if (!/alignNitroBlockToMenu/.test(rotationSource) || !/nitroRotationKeys/.test(rotationSource)) {
  fail("Nitro recall and resubmission must keep both protein blocks aligned to the saved weekly Global Menu");
}

if (!/if \(requirePrimary && result\.source === "smartsheet-fallback"\)/.test(rotationSource)) {
  fail("submitted rotations must reject fallback-only saves so users retry instead of seeing a false lock");
}

if (!/const wasSubmitted = isSubmittedRotation\(rotation\)/.test(rotationSource) || !/status: wasSubmitted \? "Submitted" : "Draft"/.test(rotationSource)) {
  fail("save draft must not downgrade an already submitted shared rotation back to Draft");
}

if (!/SubmitSaveFailedModal/.test(rotationSource) || !/The app did not lock this rotation/.test(rotationSource)) {
  fail("failed submit confirmation must show a visible modal");
}

if (!/buildLeanSmartsheetRecords/.test(leanSource) || !/syncLeanResultToDatabase/.test(leanSource)) {
  fail("Lean completed results must still route through the shared storage layer");
}

if (!/visibleInDashboard: false/.test(leanSource) || !/VoidResultModal/.test(leanSource)) {
  fail("Lean result deletion must be controlled as a void/hide action with an audit modal");
}

if (!process.exitCode) {
  console.log("Submission health checks passed.");
}
