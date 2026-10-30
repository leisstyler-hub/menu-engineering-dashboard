import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildOperationalMetadataRecord } from "../src/shared/operationalMetadata.js";
import { DELI_CORE_SELECTED_CATALOG } from "../src/features/commissary-ordering/deliCoreCatalog.js";

const root = resolve(import.meta.dirname, "..");
const menu = DELI_CORE_SELECTED_CATALOG.menu;
const baseUrl = String(process.env.CULINARY_PLATFORM_URL || "").replace(/\/$/, "");
const adminCode = String(process.env.RECIPE_LIBRARY_ADMIN_CODE || "").trim();
const pagesDir = resolve(process.env.DELI_RECIPE_PAGES_DIR || "");
const evidenceDir = resolve(process.env.DELI_RELEASE_EVIDENCE_DIR || resolve(root, "tmp/deli-core-selected-refresh"));

if (!baseUrl) throw new Error("Set CULINARY_PLATFORM_URL to the deployed Culinary Platform URL.");
if (!adminCode) throw new Error("Set RECIPE_LIBRARY_ADMIN_CODE for the protected Deli import.");
if (!process.env.DELI_RECIPE_PAGES_DIR) throw new Error("Set DELI_RECIPE_PAGES_DIR to the private per-item PDF directory.");

mkdirSync(evidenceDir, { recursive: true });

async function jsonFetch(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.ok === false) throw new Error(payload.message || `${path} failed with HTTP ${response.status}.`);
  return payload;
}

function writeEvidence(name, payload) {
  writeFileSync(resolve(evidenceDir, name), `${JSON.stringify(payload, null, 2)}\n`);
}

function deliRows(payload) {
  return (payload.rows || []).filter((row) => row.menu === menu);
}

function exactRow(rows, mrn) {
  const itemKey = `mrn:${menu.toLowerCase()}:${mrn}`;
  return rows.find((row) => row.item_key === itemKey)
    || rows.find((row) => String(row.mrn || "") === mrn && row.sourceDataVersion === "deli-core-selected-refresh-2026-10-29")
    || rows.find((row) => String(row.mrn || "") === mrn);
}

async function main() {
  const localRows = JSON.parse(readFileSync(resolve(root, "src/data/menuItems.json"), "utf8")).filter((row) => row.menu === menu);
  if (localRows.length !== 41) throw new Error(`Expected 41 local ${menu} rows, found ${localRows.length}.`);
  if (DELI_CORE_SELECTED_CATALOG.items.some(({ mrn }) => !exactRow(localRows, mrn))) throw new Error("A selected Deli MRN is missing from the local 41-row import scope.");

  const before = await jsonFetch("/api/recipe-library?scope=all");
  const beforeRows = deliRows(before);
  if (beforeRows.length < 41) throw new Error(`Production projection expected at least 41 visible ${menu} rows, found ${beforeRows.length}.`);
  writeEvidence("before-visible-menu.json", { source: before.source, rows: beforeRows });

  const auditBefore = await jsonFetch("/api/recipe-library", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-admin-code": adminCode },
    body: JSON.stringify({ action: "auditRecipeMenuScope", menu }),
  });
  if (auditBefore.count !== 41 || auditBefore.visibleCount !== 41 || auditBefore.hiddenCount !== 0) {
    throw new Error(`Production exact-menu preflight expected 41 visible and 0 hidden ${menu} rows, found ${auditBefore.visibleCount} visible and ${auditBefore.hiddenCount} hidden.`);
  }
  writeEvidence("before-audit.json", auditBefore);

  const accepted = await jsonFetch("/api/recipe-library", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-admin-code": adminCode },
    body: JSON.stringify({
      action: "acceptMenuWorksImport",
      rows: localRows,
      importedMenuNames: [menu],
      importBatch: {
        id: "deli-core-selected-refresh-2026-10-29",
        source: "Deli Core Item Cost.xlsx + Deli Core Recipe PAck.pdf",
        approvedBy: "Alex Neuse",
      },
    }),
  });
  if (accepted.rowsWritten !== 41 || accepted.rowsHidden !== 0) throw new Error(`Unexpected import result: wrote ${accepted.rowsWritten}, hid ${accepted.rowsHidden}.`);
  writeEvidence("import-response.json", accepted);

  const uploads = [];
  for (const item of DELI_CORE_SELECTED_CATALOG.items) {
    const fileName = `Deli Core Recipe - MRN ${item.mrn}.pdf`;
    const file = readFileSync(resolve(pagesDir, `${item.mrn}.pdf`));
    const uploaded = await jsonFetch("/api/recipe-library", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "uploadRecipeDocument",
        itemKey: `mrn:${menu.toLowerCase()}:${item.mrn}`,
        documentType: "recipe-file",
        fileName,
        mimeType: "application/pdf",
        fileBase64: file.toString("base64"),
        uploadedBy: "Alex Neuse",
        notes: `Exact-MRN source page ${item.recipePage} from the reviewed 2026-10-29 Deli Core recipe pack. SHA-256 ${DELI_CORE_SELECTED_CATALOG.source.recipePackSha256}.`,
      }),
    });
    uploads.push({ mrn: item.mrn, fileName, document: uploaded.document });
  }
  writeEvidence("recipe-document-uploads.json", uploads);

  const metadataWrite = await jsonFetch("/api/storage/records", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "upsertRecords",
      records: [buildOperationalMetadataRecord()],
      context: { tool: "operationalMetadata" },
    }),
  });
  writeEvidence("operational-metadata-write.json", metadataWrite);

  const metadataRead = await jsonFetch("/api/storage/records?tool=operationalMetadata&includeHidden=1");
  if (metadataRead.count !== 1 || metadataRead.records?.[0]?.metadataVersion !== 5) throw new Error("Operational metadata readback did not return approved version 5.");
  if (metadataRead.records[0].commissaryOrdering?.deliCatalog?.items?.length !== 20) throw new Error("Operational metadata readback did not return the 20-item Deli catalog.");
  writeEvidence("operational-metadata-readback.json", metadataRead);

  const after = await jsonFetch("/api/recipe-library?scope=all");
  const afterRows = deliRows(after);
  if (afterRows.length < 41) throw new Error(`Production projection readback expected at least 41 visible ${menu} rows, found ${afterRows.length}.`);
  for (const item of DELI_CORE_SELECTED_CATALOG.items) {
    const row = exactRow(afterRows, item.mrn);
    if (row?.sourceDataVersion !== "deli-core-selected-refresh-2026-10-29") throw new Error(`MRN ${item.mrn} did not read back with refreshed provenance.`);
    if (!(Number(row?.itemCost) > 0) || !(Number(row?.trueCost) > 0) || !(Number(row?.price) > 0)) throw new Error(`MRN ${item.mrn} did not read back with complete costs.`);
    const recipeFile = (row.recipeDocuments || []).find((document) => document.document_type === "recipe-file" && document.is_active !== false);
    if (!recipeFile || recipeFile.file_name !== `Deli Core Recipe - MRN ${item.mrn}.pdf`) throw new Error(`MRN ${item.mrn} did not read back with its active recipe file.`);
  }
  writeEvidence("after-visible-menu.json", { source: after.source, rows: afterRows });

  const auditAfter = await jsonFetch("/api/recipe-library", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-admin-code": adminCode },
    body: JSON.stringify({ action: "auditRecipeMenuScope", menu }),
  });
  if (auditAfter.count !== 41 || auditAfter.visibleCount !== 41 || auditAfter.hiddenCount !== 0) throw new Error("Final exact-menu audit did not preserve the 41-row visible Deli Core scope.");
  writeEvidence("after-audit.json", auditAfter);

  console.log(JSON.stringify({
    menu,
    importedRows: accepted.rowsWritten,
    hiddenRows: accepted.rowsHidden,
    recipeFilesUploaded: uploads.length,
    visibleRows: auditAfter.visibleCount,
    metadataVersion: metadataRead.records[0].metadataVersion,
    evidenceDir,
  }, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
