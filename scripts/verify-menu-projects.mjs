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
const backbone = readFileSync(join(root, "src/integrations/storage/backboneRecords.js"), "utf8");
const storageApi = readFileSync(join(root, "api/storage/records.js"), "utf8");
const supabaseSchema = readFileSync(join(root, "supabase/lean-results-schema.sql"), "utf8");

[
  "Promotional Menu",
  "Microconcept",
  "New Unit Opening",
  "Director of Culinary Review",
  "Microconcept Deliverables",
  "IT / Centric Programming",
  "businessDaysBetween",
  "subtractBusinessDays",
  "centricCompleteBy",
  "5 business days",
  "Compressed Timeline",
  "projectOwners",
  "delayProject",
  "Schedule Tasting",
  "Manager's Guide",
  "Photography Scheduled",
  "Webtrition Entry",
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
  "PeopleListEditor",
  "Add owner",
  "Menu Launch Date",
  "IT / Centric complete by",
  "Delay Project",
  "Work ahead",
  "Current gate must advance first",
  "notificationRecipientsForUpload",
  "Concept brief uploaded; Director of Culinary review ready",
  "Email Draft",
  "VersionStamp compact",
  "syncMenuProjectsToBackbone",
  "loadRecordsFromBackbone",
  "Menu Projects Database",
  "downloadStoredFile",
  "nextFileVersion",
  "Menu project file deleted",
  "Upcoming Due Dates",
  "Upcoming Tastings",
  "DEFAULT_PROJECT_OWNERS",
  "Alex Neuse",
  "alex.neuse@compass-usa.com",
  "tyler.leiss@compass-usa.com",
  "SAMPLE_PROJECT_NAMES",
  "savableMenuProjects",
  "Sample Menu Projects are local only",
  "setProjects(remoteProjects.map(normalizeMenuProject))",
  "<main className=\"grid grid-cols-1 gap-5\">",
].forEach((needle) => {
  if (!ui.includes(needle)) throw new Error(`Menu Projects UI is missing ${needle}`);
});

if (ui.includes("Project owner(s) / chef(s), comma separated")) {
  throw new Error("Menu Projects create flow still uses the old name-only owner field.");
}

if (ui.includes("mergeProjectsByNewest(current, remoteProjects)")) {
  throw new Error("Menu Projects still merges browser-local records over Supabase records.");
}

if (ui.includes("2xl:grid-cols-[minmax(0,1.2fr)_minmax(520px,0.8fr)]")) {
  throw new Error("Menu Projects still uses the squeezed split project-list/detail layout.");
}

if (!model.includes("__sampleProject: true")) {
  throw new Error("Menu Projects samples are not marked as local-only demo records.");
}

[
  "getBackboneDatabaseToolFromContext",
  "if (tool === \"menuProjects\") return \"rotation\"",
].forEach((needle) => {
  if (!backbone.includes(needle)) throw new Error(`Backbone compatibility layer is missing ${needle}`);
});

[
  "databaseTool",
  "Loaded ${records.length} ${tool === \"lean\" ? \"Lean\" : tool === \"menuProjects\" ? \"Menu Project\" : \"rotation\"}",
].forEach((needle) => {
  if (!storageApi.includes(needle)) throw new Error(`Storage API Menu Projects source handling is missing ${needle}`);
});

if (!supabaseSchema.includes("'menuProjects'")) {
  throw new Error("Supabase schema does not allow Menu Projects records as a first-class app_records tool.");
}

if (!backbone.includes("menuProjects")) {
  throw new Error("Backbone tool routing is missing the Menu Projects storage scope.");
}

if (!app.includes("MenuProjects") || !landing.includes("onOpenMenuProjects")) {
  throw new Error("Menu Projects is not wired into the platform shell and landing page.");
}

[
  "lazyWithStaleBundleReload",
  "Failed to fetch dynamically imported module",
  "culinaryToolsChunkReloaded",
].forEach((needle) => {
  if (!app.includes(needle)) throw new Error(`Platform lazy loading is missing stale bundle protection: ${needle}`);
});

console.log("Menu Projects verification passed.");

