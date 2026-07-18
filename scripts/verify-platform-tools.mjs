import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(path) {
  return readFileSync(join(root, path), "utf8");
}

function fail(message) {
  console.error(`Platform tools verification failed: ${message}`);
  process.exit(1);
}

const landing = read("src/app/LandingPage.jsx");
const css = read("src/index.css");
const logoPath = join(root, "public", "webtrition-logo.png");

[
  "Webtrition",
  "https://www.webtrition.com/ui/#/",
  "Open Webtrition",
  "/webtrition-logo.png",
  "window.open",
].forEach((needle) => {
  if (!landing.includes(needle)) fail(`Landing page is missing ${needle}`);
});

if (!existsSync(logoPath)) {
  fail("public/webtrition-logo.png is missing.");
}

if (!css.includes(".tool-card-logo")) {
  fail("Webtrition/tool logo styling is missing.");
}

console.log("Platform tools verification passed.");
