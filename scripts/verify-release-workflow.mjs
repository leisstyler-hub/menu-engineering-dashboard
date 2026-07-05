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
assertIncludes("package.json", "\"release:check\": \"node scripts/release-health.mjs\"");
assertIncludes("package.json", "\"release:live\": \"node scripts/release-live.mjs\"");
assertIncludes("package.json", "\"verify:release\": \"node scripts/verify-release-workflow.mjs\"");
assertIncludes("package.json", "\"install:browser\": \"node scripts/install-playwright-browsers.mjs\"");
assertIncludes("package.json", "\"verify:browser\": \"node scripts/run-playwright.mjs\"");
assertIncludes("playwright.config.js", "testDir: \"./tests/browser\"");
assertIncludes("playwright.config.js", "PLAYWRIGHT_BROWSERS_PATH");
assertIncludes("playwright.config.js", "node scripts/start-playwright-preview-server.mjs");
assertIncludes("scripts/playwright-utils.mjs", "PLAYWRIGHT_BROWSERS_PATH");
assertIncludes("scripts/run-playwright.mjs", "PLAYWRIGHT_BASE_URL");
assertIncludes("scripts/run-playwright.mjs", "createServer");
assertIncludes("scripts/start-playwright-preview-server.mjs", "\"build\"");
assertIncludes("scripts/start-playwright-preview-server.mjs", "createServer");
assertIncludes("scripts/start-playwright-preview-server.mjs", "4174");
assertIncludes("tests/browser/recipe-library.spec.js", "databaseSource is not defined");
assertIncludes("tests/browser/recipe-library.spec.js", "Something broke in this view");

assertIncludes("scripts/release-health.mjs", "Release Health");
assertIncludes("scripts/release-health.mjs", "GitHub source sync");
assertIncludes("scripts/release-health.mjs", "Vercel deploy");
assertIncludes("scripts/release-health.mjs", "No secret values are printed");
assertIncludes("scripts/release-health.mjs", "Working tree");
assertIncludes("scripts/release-health.mjs", "Live app version");

assertIncludes("scripts/release-live.mjs", "runPackageScript(\"verify\")");
assertIncludes("scripts/release-live.mjs", "deployToVercel");
assertIncludes("scripts/release-live.mjs", "syncSourceToGitHub");
assertIncludes("scripts/release-live.mjs", "verifyLiveBundle");
assertIncludes("scripts/release-live.mjs", "preflightReleaseSource");
assertIncludes("scripts/release-live.mjs", "Release source guard");
assertIncludes("scripts/release-live.mjs", "GitHub source already deleted");
assertIncludes("scripts/release-live.mjs", "Release complete");

console.log("Release workflow verification passed.");
