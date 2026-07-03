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
const smartsheetApi = readFileSync(join(root, "api/smartsheet/records.js"), "utf8");
const backboneClient = readFileSync(join(root, "src/integrations/storage/backboneClient.js"), "utf8");
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
  "DEFAULT_SSMT_OWNER",
  "DEFAULT_SSMT_OWNERS",
  "defaultSsmtOwner",
  "defaultSsmtOwners",
  "Alex Neuse",
  "forceReturnToFirstStage",
  "reconcileProjectAfterFileDelete",
  "Menu project file deleted",
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
  "Concept brief uploaded; Chandon final approval ready",
  "Email Draft",
  "VersionStamp compact",
  "syncMenuProjectsToBackbone",
  "loadRecordsFromBackbone",
  "Menu Projects Database",
  "MENU_PROJECT_DELETED_IDS_KEY",
  "rememberDeletedMenuProject",
  "filterDeletedMenuProjects",
  "deleteRecordsFromBackbone",
  "downloadStoredFile",
  "nextFileVersion",
  "EmailHandoffModal",
  "Attach file before sending",
  "Return to Concept Brief",
  "Upcoming Due Dates",
  "Upcoming Tastings",
  "tyler.leiss@compass-usa.com",
  "alex.neuse@compass-usa.com",
  "District Chef / SSMT Owners are hard-wired to Tyler and Alex",
  "Hard wired",
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

if (ui.includes("const DEFAULT_PROJECT_OWNERS") || ui.includes("defaultProjectOwners()")) {
  throw new Error("Menu Projects create flow still auto-fills Project Owner / Chef names.");
}

if (ui.includes("Tyler and Alex start as project owners")) {
  throw new Error("Menu Projects still tells users Tyler and Alex start as project owners.");
}

if (!model.includes("districtChefOwner: ssmtOwners[0] || defaultSsmtOwner()") || !ui.includes("project.districtChefOwner || defaultSsmtOwner()")) {
  throw new Error("Menu Projects must keep the legacy single SSMT owner field compatible.");
}

if (!ui.includes("districtChefOwners: defaultSsmtOwners()")) {
  throw new Error("Menu Projects create flow must default SSMT owners to Tyler and Alex.");
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
  "findRecordFamilyIds",
  "deleteRecords",
  "action === \"deleteRecords\"",
  "Loaded ${records.length} ${tool === \"lean\" ? \"Lean\" : tool === \"menuProjects\" ? \"Menu Project\" : \"rotation\"}",
].forEach((needle) => {
  if (!storageApi.includes(needle)) throw new Error(`Storage API Menu Projects source handling is missing ${needle}`);
});

[
  "deleteRecordsFromBackbone",
  "deleteRecordsFromSupabase",
  "deleteRecordsFromSmartsheet",
].forEach((needle) => {
  if (!backboneClient.includes(needle)) throw new Error(`Backbone delete handling is missing ${needle}`);
});

[
  "deleteRowsByRecordFamily",
  "action === \"deleteRecords\"",
  "Deleted ${deleted} Smartsheet row",
].forEach((needle) => {
  if (!smartsheetApi.includes(needle)) throw new Error(`Smartsheet delete handling is missing ${needle}`);
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

