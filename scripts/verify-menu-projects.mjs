import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const requiredFiles = [
  "public/templates/new-menu-concept-brief.xlsx",
  "public/templates/new-menu-multi-station-concept-brief.xlsx",
  "src/features/menu-projects/MenuProjects.jsx",
  "src/features/menu-projects/menuProjectModel.js",
];

const missing = requiredFiles.filter((file) => !existsSync(join(root, file)));
if (missing.length) {
  throw new Error(`Menu Projects required files missing: ${missing.join(", ")}`);
}

const model = readFileSync(join(root, "src/features/menu-projects/menuProjectModel.js"), "utf8");
const ui = readFileSync(join(root, "src/features/menu-projects/MenuProjects.jsx"), "utf8");
const app = readFileSync(join(root, "src/app/CulinaryToolsPlatformApp.jsx"), "utf8");
const landing = readFileSync(join(root, "src/app/LandingPage.jsx"), "utf8");

[
  "Promotional Menu",
  "Microconcept",
  "New Unit Opening",
  "Director of Culinary Review",
  "Microconcept Deliverables",
  "IT / Centric Programming",
  "businessDaysBetween",
  "Compressed Timeline",
].forEach((needle) => {
  if (!model.includes(needle) && !ui.includes(needle)) {
    throw new Error(`Menu Projects workflow is missing ${needle}`);
  }
});

[
  "downloadTemplate",
  "New Menu Concept Brief",
  "New Menu Multi Station Concept Brief",
  "Submit Review Decision",
  "Snags / Blockers",
  "Notification Log",
  "Menu Type Buckets",
  "Menus in the Works",
  "TrashProjectModal",
  "Trash Project",
].forEach((needle) => {
  if (!ui.includes(needle)) throw new Error(`Menu Projects UI is missing ${needle}`);
});

if (!app.includes("MenuProjects") || !landing.includes("onOpenMenuProjects")) {
  throw new Error("Menu Projects is not wired into the platform shell and landing page.");
}

console.log("Menu Projects verification passed.");

