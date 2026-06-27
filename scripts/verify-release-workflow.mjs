import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(path) {
  return readFileSync(join(root, path), "utf8");
}

function assertIncludes(file, expected) {
  const text = read(file);
  if (!text.includes(expected)) {
    throw new Error(`${file} is missing expected release workflow marker: ${expected}`);
  }
}

assertIncludes("package.json", "\"release:health\": \"node scripts/release-health.mjs\"");
assertIncludes("package.json", "\"release:live\": \"node scripts/release-live.mjs\"");
assertIncludes("package.json", "\"verify:release\": \"node scripts/verify-release-workflow.mjs\"");

assertIncludes("scripts/release-health.mjs", "Release Health");
assertIncludes("scripts/release-health.mjs", "GitHub source sync");
assertIncludes("scripts/release-health.mjs", "Vercel deploy");
assertIncludes("scripts/release-health.mjs", "No secret values are printed");

assertIncludes("scripts/release-live.mjs", "runPackageScript(\"verify\")");
assertIncludes("scripts/release-live.mjs", "deployToVercel");
assertIncludes("scripts/release-live.mjs", "syncSourceToGitHub");
assertIncludes("scripts/release-live.mjs", "verifyLiveBundle");
assertIncludes("scripts/release-live.mjs", "Release complete");

console.log("Release workflow verification passed.");
