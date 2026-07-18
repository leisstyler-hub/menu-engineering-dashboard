import React, { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, ArrowLeft, Camera, Copy, Database, DollarSign, ExternalLink, FileDown, FileText, Flame, ListChecks, Pencil, Save, Search, ShieldCheck, Sparkles, Upload, Utensils, X } from "lucide-react";

import { MENU_HEADER_ASSETS, getRecipeLibraryPhoto } from "../../data/recipeLibraryAssets.js";
import { money, pct, priceLabel, titleCase } from "../../shared/formatting.js";
import CompassOneLogo from "../../shared/ui/CompassOneLogo.jsx";
import PlatformSettings from "../../shared/ui/PlatformSettings.jsx";
import VersionStamp from "../../shared/ui/VersionStamp.jsx";
import {
  MENUWORKS_IMPORT_CODE_HINT,
  MENUWORKS_IMPORT_INITIATION_CODE,
  buildMenuWorksImportReview,
  getMenuDataQuality,
} from "./menuWorksImport.js";
import {
  MENU_ENGINEERING_OVERRIDE_STORAGE_KEY,
  applyRecipeLibraryEdit,
  caloriesLabel,
  itemTrustFlags,
  itemTrustStatus,
  itemDescription,
  itemName,
  normalizeRecipeLibraryItem,
  proteinLabel,
  recipeLibraryItemKey,
  recipeLibraryCategoryGroup,
  textValue,
} from "./recipeLibraryModel.js";

function readStoredMenuRows() {
  if (typeof window === "undefined") return null;
  try {
    const stored = JSON.parse(window.localStorage.getItem(MENU_ENGINEERING_OVERRIDE_STORAGE_KEY) || "null");
    return Array.isArray(stored) && stored.length ? stored : null;
  } catch {
    return null;
  }
}

async function fetchRecipeLibraryPayload(scope, params = {}) {
  const query = new URLSearchParams({ scope, ...params });
  const response = await fetch(`/api/recipe-library?${query.toString()}`);
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.message || "Unable to load Menu Library data.");
  }
  return payload;
}

async function postRecipeLibraryAction(action, body = {}) {
  const response = await fetch("/api/recipe-library", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...body }),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.message || "Menu Library update failed.");
  }
  return payload;
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Unable to read the selected file."));
    reader.readAsDataURL(file);
  });
}

function activeDocument(rowOrItem, type) {
  const documents = rowOrItem?.recipe_documents || rowOrItem?.recipeDocuments || rowOrItem?.raw?.recipeDocuments || [];
  return Array.isArray(documents) ? documents.find((document) => document?.document_type === type && document?.is_active !== false) : null;
}

function recipePhoto(rowOrItem) {
  const photoDocument = activeDocument(rowOrItem, "item-photo");
  if (photoDocument?.signed_url) {
    return {
      src: photoDocument.signed_url,
      alt: photoDocument.file_name || `${itemName(rowOrItem?.raw || rowOrItem)} photo`,
      source: "supabase",
    };
  }
  const localPhoto = getRecipeLibraryPhoto(rowOrItem?.raw || rowOrItem);
  return localPhoto ? { ...localPhoto, source: "asset" } : null;
}

function cleanMrn(value) {
  const text = String(value ?? "").trim();
  return text && text !== "-" ? text : "";
}

function buildWebtritionRecipeSearchUrl(item) {
  const mrn = cleanMrn(item?.mrn || item?.MRN || item?.raw?.mrn || item?.raw?.MRN);
  if (!mrn) return "";
  const params = new URLSearchParams({
    q: mrn,
    p: "1",
    l: "100",
    productType: "2",
    template: "standard",
    preview: "sidePanel",
    view: "Standard",
    sort: "relevance",
    type: "keyword",
  });
  return `https://www.webtrition.com/ui/#/recipes/search?${params.toString()}`;
}

function openWebtritionRecipe(item) {
  const url = buildWebtritionRecipeSearchUrl(item);
  if (!url || typeof window === "undefined") return;
  window.open(url, "_blank", "noopener,noreferrer");
}

async function copyMrnToClipboard(item) {
  const mrn = cleanMrn(item?.mrn || item?.MRN || item?.raw?.mrn || item?.raw?.MRN);
  if (!mrn || typeof navigator === "undefined") return false;
  try {
    await navigator.clipboard?.writeText(mrn);
    return true;
  } catch {
    return false;
  }
}

function hasRecipePhoto(rowOrItem) {
  return Boolean(recipePhoto(rowOrItem));
}

function recipeLibrarySourceLabel(source = "", usesLocalRows = false) {
  if (usesLocalRows || source === "local-override") return "Local override";
  if (source === "supabase-recipe-items") return "Supabase";
  if (source === "server-menuworks-json") return "Server fallback";
  return "Database checking";
}

function webtritionWeightOzLabel(rowOrItem) {
  const value = rowOrItem?.portion_oz ?? rowOrItem?.portionOz ?? rowOrItem?.raw?.portionOz ?? rowOrItem?.raw?.portion_oz;
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return "Weight oz not loaded";
  const formatted = Number.isInteger(number) ? String(number) : number.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  return `${formatted} oz`;
}

function replaceRowByItemKey(rows = [], updatedRow) {
  if (!updatedRow) return rows;
  const updatedKey = recipeLibraryItemKey(updatedRow);
  return rows.map((row) => (recipeLibraryItemKey(row) === updatedKey ? { ...row, ...updatedRow } : row));
}

function attachDocumentToRows(rows = [], itemKey, document) {
  if (!itemKey || !document) return rows;
  return rows.map((row) => {
    if (recipeLibraryItemKey(row) !== itemKey) return row;
    const currentDocuments = Array.isArray(row.recipeDocuments) ? row.recipeDocuments : [];
    const nextDocuments = [
      document,
      ...currentDocuments.filter((entry) => entry.document_type !== document.document_type),
    ];
    return { ...row, recipeDocuments: nextDocuments };
  });
}

function dietLabel(row) {
  const vegan = String(row.veganTag || row.dietTags || "").toLowerCase().includes("vegan");
  const vegetarian = String(row.vegetarianTag || row.dietTags || "").toLowerCase().includes("vegetarian");
  if (vegan) return "VN";
  if (vegetarian) return "V";
  return "";
}

function dietFilterLabel(row) {
  const label = dietLabel(row);
  if (label === "VN") return "Vegan";
  if (label === "V") return "Vegetarian";
  return "Regular";
}

function allergenLabel(row) {
  if (Array.isArray(row.allergens) && row.allergens.length) return row.allergens.join(", ");
  return textValue(row, "allergenSummary") || "No allergens listed";
}

function categoryLabel(row) {
  return titleCase(recipeLibraryCategoryGroup(row));
}

function categoryRank(category = "") {
  const normalized = String(category).toLowerCase();
  if (normalized.includes("entree")) return 1;
  if (normalized.includes("vegetable carvery")) return 2;
  if (normalized.includes("side")) return 3;
  if (normalized.includes("sub")) return 4;
  if (normalized.includes("extension")) return 5;
  return 5;
}

function foodCost(row) {
  if (row.price == null || row.price <= 0 || row.trueCost == null) return null;
  return row.trueCost / row.price;
}

function countBy(rows, getKey) {
  return rows.reduce((acc, row) => {
    const key = getKey(row) || "Unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function deriveMenuEntries(rows = []) {
  return Object.entries(countBy(rows, (row) => row.menu || "No menu assigned"))
    .map(([menu, count]) => ({ menu, count }))
    .sort((a, b) => a.menu.localeCompare(b.menu));
}

function csvEscape(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function downloadCsvFile(filename, headers, body) {
  const csv = [headers, ...body].map((line) => line.map(csvEscape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function csvSlug(value, fallback = "menu-library") {
  return `${String(value || fallback).replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || fallback}`;
}

function downloadMenuCsv(menu, rows) {
  const headers = [
    "Menu",
    "Item",
    "Category",
    "Station",
    "MRN",
    "Portion",
    "Calories",
    "Price",
    "True Cost",
    "Food Cost %",
    "Diet",
    "Allergens",
    "Description",
    "Recipe Status"
  ];
  const body = rows.map((row) => [
    row.menu,
    itemName(row),
    categoryLabel(row),
    row.station || "",
    row.mrn || row.MRN || "",
    row.portion || row.Portion || "",
    row.calories ?? "",
    row.price ?? "",
    row.trueCost ?? "",
    foodCost(row) == null ? "" : (foodCost(row) * 100).toFixed(1),
    dietFilterLabel(row),
    allergenLabel(row),
    itemDescription(row),
    "Recipe instructions not loaded"
  ]);
  downloadCsvFile(`${csvSlug(menu, "menu-library")}-items.csv`, headers, body);
}

function downloadAllMenusCsv(rows) {
  const headers = [
    "Menu",
    "Recipe Name",
    "MRN",
    "Category",
    "Description",
    "Calories",
    "Sell Price",
    "True Cost"
  ];
  const body = rows
    .slice()
    .sort((a, b) => String(a.menu || "").localeCompare(String(b.menu || "")) || itemName(a).localeCompare(itemName(b)))
    .map((row) => [
      row.menu,
      itemName(row),
      row.mrn || row.MRN || "",
      categoryLabel(row),
      itemDescription(row),
      row.calories ?? "",
      row.price ?? "",
      row.trueCost ?? "",
    ]);
  downloadCsvFile("all-menu-library-items.csv", headers, body);
}

function RecipeLibraryStatus({ title, detail, onBackToPlatform, onOpenSmartsheetHealth, tone = "loading" }) {
  return (
    <div className="recipe-library-page min-h-screen bg-[linear-gradient(180deg,#f6f7f9_0%,#eef7f2_100%)] p-4 text-slate-950 md:p-8">
      <div className="mx-auto max-w-5xl space-y-5">
        <header className="rounded-[2rem] border border-sky-200 bg-white p-5 shadow-xl md:p-7">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <button type="button" onClick={onBackToPlatform} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100">
                <ArrowLeft size={16} />
                Back to Platform
              </button>
              <div className="mt-5">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-600">Menu Library</p>
                <h1 className="mt-2 text-4xl font-black tracking-normal md:text-5xl">Menu Library</h1>
                <p className="mt-2 max-w-3xl text-base font-semibold leading-7 text-slate-600">{detail}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <PlatformSettings onOpenSmartsheetHealth={onOpenSmartsheetHealth} />
              <CompassOneLogo compact />
              <VersionStamp />
            </div>
          </div>
        </header>
        <section className="rounded-[2rem] border border-sky-200 bg-white p-8 text-center shadow-xl">
          {tone === "error" ? (
            <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-800">
              <AlertTriangle size={24} />
            </div>
          ) : (
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-500" />
          )}
          <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-emerald-600">Library status</p>
          <h2 className="mt-2 text-2xl font-black">{title}</h2>
        </section>
      </div>
    </div>
  );
}

export default function RecipeDatabase({ onBackToPlatform, onOpenSmartsheetHealth }) {
  const [rowState, setRowState] = useState(() => {
    const storedRows = readStoredMenuRows();
    return {
      rows: storedRows || [],
      menuSummaries: storedRows ? deriveMenuEntries(storedRows) : [],
      librarySummary: storedRows ? getMenuDataQuality(storedRows) : null,
      usesLocalRows: Boolean(storedRows),
      source: storedRows ? "local-override" : "",
      isMenuRowsLoading: !storedRows,
      isSelectedMenuLoading: false,
    };
  });
  const [menuRowsLoadError, setMenuRowsLoadError] = useState("");
  const { rows, menuSummaries, librarySummary, usesLocalRows, source: databaseSource, isMenuRowsLoading, isSelectedMenuLoading } = rowState;
  const setRows = (nextRows) => {
    setRowState((current) => {
      const resolvedRows = typeof nextRows === "function" ? nextRows(current.rows) : nextRows;
      return {
        ...current,
        rows: resolvedRows,
        menuSummaries: deriveMenuEntries(resolvedRows),
        librarySummary: getMenuDataQuality(resolvedRows),
        usesLocalRows: true,
        source: "local-override",
        isMenuRowsLoading: false,
        isSelectedMenuLoading: false,
      };
    });
  };

  useEffect(() => {
    if (!isMenuRowsLoading) return undefined;
    let isActive = true;
    fetchRecipeLibraryPayload("summary")
      .then((payload) => {
        if (!isActive) return;
        setMenuRowsLoadError("");
        setRowState({
          rows: [],
          menuSummaries: payload.menus || [],
          librarySummary: payload.summary || null,
          usesLocalRows: false,
          source: payload.source || "server-menuworks-json",
          isMenuRowsLoading: false,
          isSelectedMenuLoading: false,
        });
      })
      .catch((error) => {
        if (!isActive) return;
        setMenuRowsLoadError(error instanceof Error ? error.message : "Unable to load the MenuWorks item library.");
        setRowState({
          rows: [],
          menuSummaries: [],
          librarySummary: null,
          usesLocalRows: false,
          source: "error",
          isMenuRowsLoading: false,
          isSelectedMenuLoading: false,
        });
      });
    return () => {
      isActive = false;
    };
  }, [isMenuRowsLoading]);

  const menus = useMemo(() => (menuSummaries?.length ? menuSummaries : deriveMenuEntries(rows)), [menuSummaries, rows]);
  const [selectedMenu, setSelectedMenu] = useState(() => menus[0]?.menu || "");
  const [menuSearch, setMenuSearch] = useState("");
  const [itemSearch, setItemSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [dietFilter, setDietFilter] = useState("All");
  const [selectedItemKey, setSelectedItemKey] = useState("");
  const [pendingImport, setPendingImport] = useState(null);
  const [uploadInitiationCode, setUploadInitiationCode] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");
  const [isAllMenusCsvDownloading, setIsAllMenusCsvDownloading] = useState(false);

  const selectedRows = useMemo(() => {
    if (!usesLocalRows) return rows;
    return rows.filter((row) => (row.menu || "No menu assigned") === selectedMenu);
  }, [rows, selectedMenu, usesLocalRows]);
  const filteredMenuList = menus.filter((entry) => entry.menu.toLowerCase().includes(menuSearch.toLowerCase()));
  const categoryOptions = ["All", ...Array.from(new Set(selectedRows.map(categoryLabel))).sort((a, b) => categoryRank(a) - categoryRank(b) || a.localeCompare(b))];
  const filteredRows = selectedRows
    .filter((row) => {
      const haystack = [itemName(row), row.recipeName, row.station, categoryLabel(row), row.category, itemDescription(row), allergenLabel(row)].join(" ").toLowerCase();
      return !itemSearch || haystack.includes(itemSearch.toLowerCase());
    })
    .filter((row) => categoryFilter === "All" || categoryLabel(row) === categoryFilter)
    .filter((row) => dietFilter === "All" || dietFilterLabel(row) === dietFilter)
    .sort((a, b) => categoryRank(categoryLabel(a)) - categoryRank(categoryLabel(b)) || itemName(a).localeCompare(itemName(b)));

  const groupedRows = useMemo(() => {
    return filteredRows.reduce((acc, row) => {
      const key = categoryLabel(row);
      acc[key] = acc[key] || [];
      acc[key].push(row);
      return acc;
    }, {});
  }, [filteredRows]);

  const pricedRows = selectedRows.filter((row) => row.price != null && row.price > 0 && row.trueCost != null);
  const avgFc = pricedRows.length ? pricedRows.reduce((sum, row) => sum + foodCost(row), 0) / pricedRows.length : null;
  const allergenCoverage = selectedRows.length ? Math.round((selectedRows.filter((row) => allergenLabel(row) !== "No allergens listed").length / selectedRows.length) * 100) : 0;
  const descriptionCoverage = selectedRows.length ? Math.round((selectedRows.filter((row) => itemDescription(row) !== "No description loaded yet.").length / selectedRows.length) * 100) : 0;
  const allPhotoRows = useMemo(() => rows.filter(hasRecipePhoto), [rows]);
  const missingPhotoRows = Math.max(0, (librarySummary?.total ?? rows.length) - (librarySummary?.photoRows ?? allPhotoRows.length));
  const selectedPhotoRows = useMemo(() => selectedRows.filter(hasRecipePhoto), [selectedRows]);
  const selectedMissingPhotoRows = Math.max(0, selectedRows.length - selectedPhotoRows.length);
  const reviewRows = useMemo(() => selectedRows.filter((row) => itemTrustStatus(row) === "Needs Review"), [selectedRows]);
  const watchRows = useMemo(() => selectedRows.filter((row) => itemTrustStatus(row) === "Watch"), [selectedRows]);
  const dataQuality = useMemo(() => librarySummary || getMenuDataQuality(rows), [librarySummary, rows]);
  const selectedMenuDataQuality = useMemo(() => getMenuDataQuality(selectedRows), [selectedRows]);
  const selectedMenuHeaderAsset = MENU_HEADER_ASSETS[selectedMenu] || null;
  const selectedLibraryItem = useMemo(() => {
    if (!selectedItemKey) return null;
    const row = rows.find((candidate) => normalizeRecipeLibraryItem(candidate).item_key === selectedItemKey);
    return row ? normalizeRecipeLibraryItem(row) : null;
  }, [rows, selectedItemKey]);

  useEffect(() => {
    if (!selectedMenu && menus[0]?.menu) setSelectedMenu(menus[0].menu);
  }, [menus, selectedMenu]);

  useEffect(() => {
    if (usesLocalRows || isMenuRowsLoading || !selectedMenu) return undefined;
    let isActive = true;
    setSelectedItemKey("");
    setRowState((current) => ({ ...current, rows: [], isSelectedMenuLoading: true }));
    fetchRecipeLibraryPayload("menu", { menu: selectedMenu })
      .then((payload) => {
        if (!isActive) return;
        setMenuRowsLoadError("");
        setRowState((current) => ({
          ...current,
          rows: payload.rows || [],
          menuSummaries: payload.menus || current.menuSummaries,
          librarySummary: payload.summary || current.librarySummary,
          usesLocalRows: false,
          source: payload.source || current.source || "server-menuworks-json",
          isMenuRowsLoading: false,
          isSelectedMenuLoading: false,
        }));
        setSelectedItemKey("");
        setCategoryFilter("All");
        setDietFilter("All");
      })
      .catch((error) => {
        if (!isActive) return;
        setMenuRowsLoadError(error instanceof Error ? error.message : "Unable to load this menu.");
        setRowState((current) => ({ ...current, rows: [], isSelectedMenuLoading: false }));
      });
    return () => {
      isActive = false;
    };
  }, [selectedMenu, usesLocalRows, isMenuRowsLoading]);

  const ensureFullRecipeRows = async () => {
    if (usesLocalRows) return rows;
    const payload = await fetchRecipeLibraryPayload("all");
    return payload.rows || [];
  };

  const handleDownloadAllMenusCsv = async () => {
    try {
      setIsAllMenusCsvDownloading(true);
      const fullRows = await ensureFullRecipeRows();
      downloadAllMenusCsv(fullRows);
    } catch (error) {
      setMenuRowsLoadError(error instanceof Error ? error.message : "Unable to prepare the all-menu CSV export.");
    } finally {
      setIsAllMenusCsvDownloading(false);
    }
  };

  const saveLibraryItem = async (patch) => {
    if (!selectedLibraryItem) return;
    if (!usesLocalRows) {
      const payload = await postRecipeLibraryAction("updateRecipeItem", {
        itemKey: selectedLibraryItem.item_key,
        patch,
      });
      if (payload.row) {
        setRowState((current) => ({
          ...current,
          rows: replaceRowByItemKey(current.rows, payload.row),
          source: payload.source || current.source || "supabase-recipe-items",
          usesLocalRows: false,
        }));
      }
      return payload;
    }
    const currentRows = await ensureFullRecipeRows();
    const nextRows = applyRecipeLibraryEdit(currentRows, selectedLibraryItem, patch);
    setRows(nextRows);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(MENU_ENGINEERING_OVERRIDE_STORAGE_KEY, JSON.stringify(nextRows));
    }
    return { ok: true, source: "local-override", message: "Saved to this browser's local Menu Library override." };
  };

  const uploadRecipeDocument = async ({ item, documentType, file }) => {
    if (!item?.item_key || !file) return null;
    const fileBase64 = await readFileAsBase64(file);
    const payload = await postRecipeLibraryAction("uploadRecipeDocument", {
      itemKey: item.item_key,
      documentType,
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      fileBase64,
      uploadedBy: "Menu Library",
    });
    if (payload.document) {
      setRowState((current) => ({
        ...current,
        rows: attachDocumentToRows(current.rows, item.item_key, payload.document),
        source: current.source === "local-override" ? current.source : "supabase-recipe-items",
      }));
    }
    return payload;
  };

  const parseMenuWorksFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (uploadInitiationCode.trim() !== MENUWORKS_IMPORT_INITIATION_CODE) {
      setUploadStatus(`Enter initiation code ${MENUWORKS_IMPORT_CODE_HINT} before uploading a MenuWorks truth file.`);
      event.target.value = "";
      return;
    }

    try {
      setUploadStatus("Reading MenuWorks truth file...");
      const currentRows = await ensureFullRecipeRows();
      const review = await buildMenuWorksImportReview(file, currentRows);
      setPendingImport({ ...review, currentRows });
      setUploadStatus(`${review.importedRows.length.toLocaleString()} rows are ready for review from ${review.importedMenuNames.length.toLocaleString()} menus.`);
    } catch (error) {
      setUploadStatus(error instanceof Error ? error.message : "Unable to read this MenuWorks file.");
    } finally {
      event.target.value = "";
    }
  };

  const acceptImport = () => {
    if (!pendingImport || uploadInitiationCode.trim() !== MENUWORKS_IMPORT_INITIATION_CODE) return;
    const importScope = new Set(pendingImport.importedMenuNames);
    const retainedRows = (pendingImport.currentRows || rows).filter((row) => !importScope.has(row.menu));
    const nextRows = [...retainedRows, ...pendingImport.importedRows].map((row, index) => ({ ...row, id: index }));
    setRows(nextRows);
    setSelectedMenu(pendingImport.importedMenuNames[0] || selectedMenu);
    setSelectedItemKey("");
    setCategoryFilter("All");
    setDietFilter("All");
    if (typeof window !== "undefined") {
      window.localStorage.setItem(MENU_ENGINEERING_OVERRIDE_STORAGE_KEY, JSON.stringify(nextRows));
    }
    setUploadStatus(`Accepted ${pendingImport.importedRows.length.toLocaleString()} MenuWorks rows into Menu Library.`);
    setPendingImport(null);
  };

  if (isMenuRowsLoading) {
    return <RecipeLibraryStatus title="Loading Menu Library" detail="Opening the MenuWorks item library on demand so the platform home screen stays lighter." onBackToPlatform={onBackToPlatform} onOpenSmartsheetHealth={onOpenSmartsheetHealth} />;
  }

  if (menuRowsLoadError) {
    return <RecipeLibraryStatus title="Menu Library could not load" detail={menuRowsLoadError} onBackToPlatform={onBackToPlatform} onOpenSmartsheetHealth={onOpenSmartsheetHealth} tone="error" />;
  }

  return (
    <div className="recipe-library-page min-h-screen bg-[linear-gradient(180deg,#f6f7f9_0%,#eef7f2_100%)] p-4 text-slate-950 md:p-8">
      <div className="mx-auto max-w-[96rem] space-y-5">
        <header className="rounded-[2rem] border border-sky-200 bg-white p-5 shadow-xl md:p-7">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <button type="button" onClick={onBackToPlatform} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100">
                <ArrowLeft size={16} />
                Back to Platform
              </button>
              <div className="mt-5">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-600">Menu Library</p>
                <h1 className="mt-2 text-4xl font-black tracking-normal md:text-5xl">Menu Library</h1>
                <p className="mt-2 max-w-3xl text-base font-semibold leading-7 text-slate-600">
                  Browse menu item library cards with pricing, cost, calories, protein, allergens, descriptions, portions, and future file slots for recipes, photos, and plating guides.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <PlatformSettings onOpenSmartsheetHealth={onOpenSmartsheetHealth} />
              <CompassOneLogo compact />
              <DatabaseSourceChip source={databaseSource} usesLocalRows={usesLocalRows} />
              <VersionStamp />
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard icon={Database} label="Menus" value={menus.length.toLocaleString()} detail="indexed menu groups" />
          <MetricCard icon={Utensils} label="Menu Items" value={(librarySummary?.total ?? rows.length).toLocaleString()} detail={usesLocalRows ? "local item property rows" : "server-indexed rows"} />
          <MetricCard icon={ListChecks} label="Selected Menu" value={selectedRows.length.toLocaleString()} detail="items in view" />
          <MetricCard icon={ShieldCheck} label="Allergen Coverage" value={`${allergenCoverage}%`} detail="selected menu" />
          <MetricCard icon={Camera} label="Photos" value={(librarySummary?.photoRows ?? allPhotoRows.length).toLocaleString()} detail={`${missingPhotoRows.toLocaleString()} missing photos`} tone={missingPhotoRows ? "amber" : "green"} />
        </section>

        <MenuWorksRefreshPanel
          dataQuality={dataQuality}
          selectedMenuDataQuality={selectedMenuDataQuality}
          pendingImport={pendingImport}
          uploadInitiationCode={uploadInitiationCode}
          uploadStatus={uploadStatus}
          onCodeChange={setUploadInitiationCode}
          onFileChange={parseMenuWorksFile}
          onOpenReview={() => setPendingImport((current) => current)}
        />

        <main className="grid grid-cols-1 gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Menu Index</p>
                <h2 className="mt-1 text-2xl font-black">Menus</h2>
              </div>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800">{filteredMenuList.length}</span>
            </div>
            <label className="mt-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
              <Search size={16} className="text-slate-400" />
              <input value={menuSearch} onChange={(event) => setMenuSearch(event.target.value)} placeholder="Search menus..." className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400" />
            </label>
            <div className="mt-4 max-h-[720px] space-y-2 overflow-auto pr-1">
              {filteredMenuList.map((entry) => (
                <button
                  key={entry.menu}
                  type="button"
                  onClick={() => setSelectedMenu(entry.menu)}
                  className={`w-full rounded-2xl border p-3 text-left transition ${entry.menu === selectedMenu ? "border-emerald-300 bg-emerald-50 shadow-sm" : "border-slate-200 bg-white hover:border-sky-200 hover:bg-sky-50"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-black leading-5 text-slate-950">{entry.menu}</p>
                    <span className="rounded-full border border-white bg-white/80 px-2 py-1 text-xs font-black text-slate-600">{entry.count}</span>
                  </div>
                </button>
              ))}
            </div>
          </aside>

          <section className="space-y-5">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl">
              {selectedMenuHeaderAsset && (
              <div className="mb-5 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-100">
                <img src={selectedMenuHeaderAsset.src} alt={selectedMenuHeaderAsset.alt} className="h-56 w-full object-contain md:h-80" loading="lazy" />
              </div>
              )}
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600">Menu Detail</p>
                  <h2 className="mt-1 text-3xl font-black">{selectedMenu || "Select a menu"}</h2>
                  <p className="mt-2 text-sm font-semibold text-slate-500">
                    {filteredRows.length.toLocaleString()} visible of {selectedRows.length.toLocaleString()} items. Average priced food cost: {pct(avgFc)}.
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button type="button" onClick={handleDownloadAllMenusCsv} disabled={isAllMenusCsvDownloading} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-sm hover:border-emerald-200 hover:bg-emerald-50 disabled:cursor-wait disabled:opacity-70">
                    <FileDown size={17} />
                    {isAllMenusCsvDownloading ? "Preparing..." : "Download All Menus CSV"}
                  </button>
                  <button type="button" onClick={() => downloadMenuCsv(selectedMenu, filteredRows)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-800">
                    <FileDown size={17} />
                    Download menu CSV
                  </button>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_220px_180px]">
                <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <Search size={17} className="text-slate-400" />
                  <input value={itemSearch} onChange={(event) => setItemSearch(event.target.value)} placeholder="Search item, ingredient, allergen..." className="w-full bg-transparent text-sm font-bold outline-none placeholder:text-slate-400" />
                </label>
                <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none">
                  {categoryOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
                <select value={dietFilter} onChange={(event) => setDietFilter(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none">
                  {["All", "Vegan", "Vegetarian", "Regular"].map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-4 lg:grid-cols-4">
              <ReadoutCard icon={Sparkles} title="Data Read" value={`${descriptionCoverage}%`} detail="description coverage for this menu" tone="emerald" />
              <ReadoutCard icon={ShieldCheck} title="Safety Signal" value={`${allergenCoverage}%`} detail="allergen coverage for this menu" tone="sky" />
              <ReadoutCard icon={AlertTriangle} title="Data Confidence" value={`${reviewRows.length}`} detail={`${watchRows.length} watch rows; Needs Review rows are flagged on cards`} tone="amber" />
              <ReadoutCard icon={Camera} title="Photo Signal" value={`${selectedPhotoRows.length}/${selectedRows.length}`} detail={`${selectedMissingPhotoRows} missing photos in this menu`} tone={selectedMissingPhotoRows ? "amber" : "emerald"} />
            </section>

            {isSelectedMenuLoading ? (
              <section className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-xl">
                <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-500" />
                <p className="mt-4 text-xl font-black text-slate-950">Loading selected menu</p>
                <p className="mt-2 text-sm font-semibold text-slate-500">Pulling only the rows needed for this menu.</p>
              </section>
            ) : Object.keys(groupedRows).length === 0 ? (
              <section className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-xl">
                <p className="text-xl font-black text-slate-950">No items match this filter.</p>
                <p className="mt-2 text-sm font-semibold text-slate-500">Clear search or filters to widen the view.</p>
              </section>
            ) : (
              Object.entries(groupedRows)
                .sort(([a], [b]) => categoryRank(a) - categoryRank(b) || a.localeCompare(b))
                .map(([category, items]) => (
                  <MenuSection key={category} category={category} items={items} onOpenItem={(row) => setSelectedItemKey(normalizeRecipeLibraryItem(row).item_key)} />
                ))
            )}
          </section>
        </main>
      </div>
      {selectedLibraryItem && (
        <LibraryCardDrawer
          item={selectedLibraryItem}
          onClose={() => setSelectedItemKey("")}
          onSave={saveLibraryItem}
          onUploadDocument={uploadRecipeDocument}
        />
      )}
      {pendingImport && (
        <MenuWorksImportReviewModal
          review={pendingImport}
          onCancel={() => setPendingImport(null)}
          onAccept={acceptImport}
        />
      )}
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, detail, tone = "green" }) {
  const toneClass = tone === "amber" ? "border-amber-200 bg-amber-50 text-amber-900" : "border-sky-200 bg-white text-slate-950";
  return (
    <article className={`rounded-[1.5rem] border p-4 shadow-sm ${toneClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] opacity-70">{label}</p>
          <p className="mt-2 text-3xl font-black">{value}</p>
          <p className="mt-1 text-xs font-semibold opacity-70">{detail}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-700">
          <Icon size={20} />
        </div>
      </div>
    </article>
  );
}

function DatabaseSourceChip({ source, usesLocalRows }) {
  const label = recipeLibrarySourceLabel(source, usesLocalRows);
  const toneClass = label === "Supabase"
    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
    : label === "Local override"
      ? "border-amber-200 bg-amber-50 text-amber-900"
      : "border-sky-200 bg-sky-50 text-sky-900";
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-black ${toneClass}`}>
      <Database size={14} />
      {label}
    </span>
  );
}

function ReadoutCard({ icon: Icon, title, value, detail, tone }) {
  const toneClass = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-900",
    sky: "border-sky-200 bg-sky-50 text-sky-900",
    amber: "border-amber-200 bg-amber-50 text-amber-900",
  }[tone];
  return (
    <article className={`rounded-[1.5rem] border p-4 shadow-sm ${toneClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black">{title}</p>
          <p className="mt-2 text-2xl font-black">{value}</p>
          <p className="mt-1 text-xs font-semibold opacity-75">{detail}</p>
        </div>
        <Icon size={20} />
      </div>
    </article>
  );
}

function MenuWorksRefreshPanel({
  dataQuality,
  selectedMenuDataQuality,
  pendingImport,
  uploadInitiationCode,
  uploadStatus,
  onCodeChange,
  onFileChange,
}) {
  const unlocked = uploadInitiationCode.trim() === MENUWORKS_IMPORT_INITIATION_CODE;
  return (
    <section className="rounded-[2rem] border border-sky-200 bg-white p-5 shadow-xl">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">Library Refresh</p>
          <h2 className="mt-1 text-2xl font-black">MenuWorks Truth Upload</h2>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
              This is the only place to update MenuWorks item rows. Accepted uploads replace matching menus across Menu Library, Menu Engineering, and menu selectors.
          </p>
          {uploadStatus && (
            <p className="mt-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-black text-sky-900">{uploadStatus}</p>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <label className="block text-xs font-black uppercase tracking-[0.14em] text-slate-400">Initiate upload</label>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-[132px_minmax(0,1fr)]">
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={uploadInitiationCode}
              onChange={(event) => onCodeChange(event.target.value)}
              placeholder={MENUWORKS_IMPORT_CODE_HINT}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-900 outline-none focus:border-emerald-300"
            />
            <input
              disabled={!unlocked}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={onFileChange}
              className="block w-full text-sm font-bold text-slate-600 file:mr-3 file:rounded-2xl file:border-0 file:bg-slate-950 file:px-4 file:py-3 file:text-sm file:font-black file:text-white hover:file:bg-slate-800 disabled:opacity-50"
            />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <QualityMini label="All data" value={dataQuality.costCoverage} detail={`${dataQuality.costed}/${dataQuality.total} costed`} />
            <QualityMini label="This menu" value={selectedMenuDataQuality.descriptionCoverage} detail={`${selectedMenuDataQuality.described}/${selectedMenuDataQuality.total} detailed`} />
          </div>
          {pendingImport && (
            <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-black text-amber-900">
              Review is open for {pendingImport.importedRows.length.toLocaleString()} rows from {pendingImport.fileName}.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function QualityMini({ label, value, detail }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <div className="mt-1 flex items-end justify-between gap-3">
        <p className="text-xl font-black text-slate-950">{value}%</p>
        <span className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
          <span className="block h-full rounded-full bg-emerald-500" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
        </span>
      </div>
      <p className="mt-1 text-xs font-semibold text-slate-500">{detail}</p>
    </div>
  );
}

function importPercentLabel(value) {
  if (value == null || !Number.isFinite(value)) return "No comparable cost history";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

function MenuWorksImportReviewModal({ review, onCancel, onAccept }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-slate-950/50 p-3 backdrop-blur-sm md:p-8" role="dialog" aria-modal="true">
      <section className="mx-auto w-full max-w-5xl rounded-[2rem] border border-slate-200 bg-white shadow-2xl">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">MenuWorks Review</p>
            <h2 className="mt-1 text-3xl font-black text-slate-950">Accept library refresh?</h2>
            <p className="mt-2 text-sm font-semibold text-slate-600">
              {review.fileName} has {review.importedRows.length.toLocaleString()} rows across {review.importedMenuNames.length.toLocaleString()} menus.
            </p>
          </div>
          <button type="button" onClick={onCancel} className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100" aria-label="Close import review">
            <X size={19} />
          </button>
        </div>

        <div className="grid gap-4 p-5 lg:grid-cols-4">
          <ImportMetric label="New items" value={review.newItems.length} tone="emerald" />
          <ImportMetric label="Changed items" value={review.changedItems.length} tone="sky" />
          <ImportMetric label="Removed items" value={review.removedItems.length} tone="amber" />
          <ImportMetric label="Cost movement" value={importPercentLabel(review.totalCostChangePct)} tone="slate" />
        </div>

        <div className="grid gap-4 px-5 pb-5 lg:grid-cols-2">
          <ImportChangeList title="Cost increases" items={review.costIncreases} getLabel={(change) => `${itemName(change.after)} - ${money(change.before.trueCost)} to ${money(change.after.trueCost)}`} />
          <ImportChangeList title="Price changes" items={review.priceChanges} getLabel={(change) => `${itemName(change.after)} - ${priceLabel(change.before.price)} to ${priceLabel(change.after.price)}`} />
          <ImportChangeList title="New menu items" items={review.newItems} getLabel={(row) => `${row.menu} - ${itemName(row)}`} />
          <ImportChangeList title="Removed from refreshed menus" items={review.removedItems} getLabel={(row) => `${row.menu} - ${itemName(row)}`} />
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
          <p className="text-sm font-semibold leading-6 text-slate-600">
            Accepting replaces only the menus included in this upload and keeps all other menus in place.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button type="button" onClick={onCancel} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-50">
              Cancel
            </button>
            <button type="button" onClick={onAccept} className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-800">
              Accept Update + Replace Library Data
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function ImportMetric({ label, value, tone }) {
  const toneClass = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-900",
    sky: "border-sky-200 bg-sky-50 text-sky-900",
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    slate: "border-slate-200 bg-slate-50 text-slate-900",
  }[tone];
  return (
    <article className={`rounded-3xl border p-4 ${toneClass}`}>
      <p className="text-xs font-black uppercase tracking-[0.14em] opacity-70">{label}</p>
      <p className="mt-2 text-2xl font-black">{typeof value === "number" ? value.toLocaleString() : value}</p>
    </article>
  );
}

function ImportChangeList({ title, items, getLabel }) {
  const visible = items.slice(0, 6);
  return (
    <section className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-black text-slate-950">{title}</h3>
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black text-slate-600">{items.length.toLocaleString()}</span>
      </div>
      {visible.length ? (
        <div className="mt-3 space-y-2">
          {visible.map((item, index) => (
            <p key={`${title}-${index}`} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold leading-5 text-slate-700">
              {getLabel(item)}
            </p>
          ))}
          {items.length > visible.length && (
            <p className="px-1 text-xs font-black uppercase tracking-[0.12em] text-slate-400">+{items.length - visible.length} more</p>
          )}
        </div>
      ) : (
        <p className="mt-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-500">No changes in this group.</p>
      )}
    </section>
  );
}

function MenuSection({ category, items, onOpenItem }) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Item Group</p>
          <h3 className="mt-1 text-2xl font-black">{category}</h3>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-600">{items.length} items</span>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-2">
        {items.map((row, index) => (
          <ItemCard key={`${row.id || row.mrn || itemName(row)}-${index}`} row={row} onOpen={() => onOpenItem(row)} />
        ))}
      </div>
    </section>
  );
}

function ItemCard({ row, onOpen }) {
  const diet = dietLabel(row);
  const fc = foodCost(row);
  const libraryItem = normalizeRecipeLibraryItem(row);
  const photo = recipePhoto(row);
  const trustFlags = itemTrustFlags(row);
  const trustStatus = itemTrustStatus(row);
  const mrn = cleanMrn(row.mrn || row.MRN);
  return (
    <button type="button" onClick={onOpen} className="recipe-library-card w-full rounded-3xl border border-slate-200 bg-slate-50/80 p-4 text-left transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-white hover:shadow-lg active:translate-y-0">
      {photo && (
        <div className="mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <img src={photo.src} alt={photo.alt} className="h-40 w-full object-cover" loading="lazy" />
        </div>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-lg font-black leading-6 text-slate-950">{itemName(row)}</h4>
            {diet && <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-black text-emerald-800">{diet}</span>}
            <TrustBadge status={trustStatus} />
          </div>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{itemDescription(row)}</p>
        </div>
        <div className="flex shrink-0 flex-row gap-2 sm:flex-col sm:items-end">
          <InfoPill icon={DollarSign} label={priceLabel(row.price)} tone="green" />
          <InfoPill icon={Flame} label={caloriesLabel(row.calories)} tone="amber" />
          <InfoPill icon={Activity} label={proteinLabel(libraryItem)} tone="sky" />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(7rem,1fr))] gap-2 text-xs font-bold text-slate-600">
        <Property label="True cost" value={row.trueCost == null ? "Not loaded" : money(row.trueCost)} />
        <Property label="Food cost" value={pct(fc)} />
        <Property label="Protein" value={proteinLabel(libraryItem)} />
        <Property label="Portion" value={row.portion || row.Portion || "Not loaded" } />
        <Property label="MRN" value={mrn || "Not loaded"} />
        <Property label="WebT OZ" value={webtritionWeightOzLabel(libraryItem)} />
      </div>

      <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Allergens</p>
        <p className="mt-1 text-sm font-bold leading-6 text-slate-700">{allergenLabel(row)}</p>
      </div>
      {trustFlags.length > 0 && (
        <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-800">Data Confidence</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {trustFlags.slice(0, 3).map((flag) => (
              <span key={`${flag.label}-${flag.detail}`} className="rounded-full border border-white bg-white/80 px-3 py-1 text-xs font-black text-amber-900" title={flag.detail}>
                {flag.label}
              </span>
            ))}
            {trustFlags.length > 3 && (
              <span className="rounded-full border border-white bg-white/80 px-3 py-1 text-xs font-black text-amber-900">+{trustFlags.length - 3} more</span>
            )}
          </div>
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black text-slate-600">{row.station || "No station"}</span>
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black text-slate-600">{row.recipeCategory || "No recipe category"}</span>
      </div>
    </button>
  );
}

function LibraryCardDrawer({ item, onClose, onSave, onUploadDocument }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const photo = recipePhoto(item);
  const photoSlot = item.file_slots.find((slot) => slot.type === "item-photo");
  const mrn = cleanMrn(item.mrn);
  const webtritionRecipeUrl = buildWebtritionRecipeSearchUrl(item);
  const [draft, setDraft] = useState(() => ({
    display_name: item.display_name || "",
    description: item.description || "",
    allergen_summary: item.allergen_summary || allergenLabel(item.raw),
    calories: item.calories ?? "",
    protein_g: item.protein_g ?? "",
    price: item.price ?? "",
    true_cost: item.true_cost ?? "",
  }));

  const save = async () => {
    setIsSaving(true);
    setSaveStatus("");
    try {
      const payload = await onSave(draft);
      setIsEditing(false);
      setSaveStatus(payload?.message || "Menu Library card saved.");
    } catch (error) {
      setSaveStatus(error instanceof Error ? error.message : "Menu Library card could not save.");
    } finally {
      setIsSaving(false);
    }
  };

  const nutritionRows = [
    ["Calories", caloriesLabel(item.calories)],
    ["Protein", proteinLabel(item)],
    ["WebT weight", webtritionWeightOzLabel(item)],
    ["Sodium", item.sodium_mg == null ? "Stored when loaded" : `${item.sodium_mg} mg`],
    ["Carbs", item.carbs_g == null ? "Stored when loaded" : `${item.carbs_g} g`],
    ["Fiber", item.fiber_g == null ? "Stored when loaded" : `${item.fiber_g} g`],
    ["Sugars", item.sugars_g == null ? "Stored when loaded" : `${item.sugars_g} g`],
    ["Saturated fat", item.saturated_fat_g == null ? "Stored when loaded" : `${item.saturated_fat_g} g`],
    ["Trans fat", item.trans_fat_g == null ? "Stored when loaded" : `${item.trans_fat_g} g`],
    ["Cholesterol", item.cholesterol_mg == null ? "Stored when loaded" : `${item.cholesterol_mg} mg`],
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/40 p-3 backdrop-blur-sm md:p-8" role="dialog" aria-modal="true">
      <section className="recipe-library-drawer mx-auto flex max-h-[calc(100vh-1.5rem)] w-full max-w-5xl flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl md:mt-4 md:max-h-[calc(100vh-4rem)]">
        <div className="border-b border-slate-200 bg-slate-50 p-5 md:p-6">
          <div className={`grid gap-5 ${photo ? "lg:grid-cols-[minmax(0,1.15fr)_minmax(21rem,0.85fr)]" : ""}`}>
            {photo && (
              <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
                <img src={photo.src} alt={photo.alt} className="max-h-[30rem] min-h-72 w-full object-contain md:min-h-96" />
              </div>
            )}
            <div className="flex min-w-0 flex-col justify-between gap-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600">Menu Library Card</p>
                  <h2 className="mt-2 text-3xl font-black leading-tight text-slate-950 md:text-5xl">{item.display_name}</h2>
                  <p className="mt-3 text-base font-bold leading-7 text-slate-500">{item.menu || "No menu"} / {item.station || "No station"} / {item.category_group || item.category || "No category"}</p>
                </div>
                <button type="button" onClick={onClose} className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100" aria-label="Close library card">
                  <X size={21} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <InfoPill icon={Flame} label={caloriesLabel(item.calories)} tone="amber" />
                <InfoPill icon={Activity} label={proteinLabel(item)} tone="sky" />
                <InfoPill icon={DollarSign} label={priceLabel(item.price)} tone="green" />
                <InfoPill icon={Database} label={item.mrn ? `MRN ${item.mrn}` : "MRN not loaded"} tone="slate" />
                <InfoPill icon={Utensils} label={webtritionWeightOzLabel(item)} tone="slate" />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={!webtritionRecipeUrl}
                  onClick={() => openWebtritionRecipe(item)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-base font-black text-sky-900 hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-50"
                  title="Opens Webtrition in a new tab by MRN. If Webtrition resets after login, paste the copied MRN into its search."
                >
                  <ExternalLink size={18} />
                  Open Webtrition
                </button>
                <button
                  type="button"
                  disabled={!mrn}
                  onClick={async () => {
                    const copied = await copyMrnToClipboard(item);
                    setCopyStatus(copied ? `Copied MRN ${mrn}` : "MRN copy unavailable");
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-black text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Copy size={18} />
                  Copy MRN
                </button>
              </div>
              {copyStatus && <p className="text-sm font-bold text-slate-500">{copyStatus}</p>}
              <InlineDocumentUpload
                item={item}
                slot={photoSlot}
                documentType="item-photo"
                label={photo ? "Replace food photo" : "Upload food photo"}
                onUploadDocument={onUploadDocument}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 border-b border-slate-200 bg-white p-4">
          {["overview", "nutrition", "files"].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-2xl px-4 py-3 text-base font-black capitalize ${activeTab === tab ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-auto p-5 md:p-6">
          {activeTab === "overview" && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-400">Chef-Facing Details</p>
                <button type="button" disabled={isSaving} onClick={() => (isEditing ? save() : setIsEditing(true))} className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-base font-black text-emerald-800 hover:bg-emerald-100 disabled:opacity-60">
                  {isEditing ? <Save size={18} /> : <Pencil size={18} />}
                  {isSaving ? "Saving..." : isEditing ? "Save card" : "Edit card"}
                </button>
              </div>
              {saveStatus && (
                <p className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-black text-sky-900">{saveStatus}</p>
              )}

              {isEditing ? (
                <div className="grid gap-3">
                  <LibraryInput label="Item name" value={draft.display_name} onChange={(value) => setDraft((next) => ({ ...next, display_name: value }))} />
                  <LibraryTextArea label="Description" value={draft.description} onChange={(value) => setDraft((next) => ({ ...next, description: value }))} />
                  <LibraryInput label="Allergen summary" value={draft.allergen_summary} onChange={(value) => setDraft((next) => ({ ...next, allergen_summary: value }))} />
                  <div className="grid grid-cols-2 gap-3">
                    <LibraryInput label="Calories" value={draft.calories} onChange={(value) => setDraft((next) => ({ ...next, calories: value }))} inputMode="decimal" />
                    <LibraryInput label="Protein g" value={draft.protein_g} onChange={(value) => setDraft((next) => ({ ...next, protein_g: value }))} inputMode="decimal" />
                    <LibraryInput label="Retail price" value={draft.price} onChange={(value) => setDraft((next) => ({ ...next, price: value }))} inputMode="decimal" />
                    <LibraryInput label="True cost" value={draft.true_cost} onChange={(value) => setDraft((next) => ({ ...next, true_cost: value }))} inputMode="decimal" />
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 md:p-6">
                      <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-400">Description</p>
                      <p className="mt-3 text-lg font-semibold leading-8 text-slate-700">{item.description}</p>
                    </div>
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 md:p-6">
                      <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-400">Allergens</p>
                      <p className="mt-3 break-words text-lg font-black leading-8 text-slate-800">{item.allergen_summary || allergenLabel(item.raw)}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    <Property label="Portion" value={item.portion || "Not loaded"} />
                    <Property label="WebT OZ" value={webtritionWeightOzLabel(item)} />
                    <Property label="Recipe category" value={item.recipe_category || "Not loaded"} />
                    <Property label="True cost" value={item.true_cost == null ? "Not loaded" : money(item.true_cost)} />
                    <Property label="Food cost" value={item.price && item.true_cost ? pct(item.true_cost / item.price) : "Not loaded"} />
                  </div>
                  <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 md:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-black uppercase tracking-[0.14em] text-amber-800">Data Confidence</p>
                        <p className="mt-1 text-base font-bold text-amber-900">Review signal for pricing, categories, allergens, descriptions, and nutrition.</p>
                      </div>
                      <TrustBadge status={item.trust_status || "Trusted"} />
                    </div>
                    {item.trust_flags?.length ? (
                      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                        {item.trust_flags.map((flag) => (
                          <div key={`${flag.label}-${flag.detail}`} className="rounded-2xl border border-white bg-white/80 px-4 py-3">
                            <p className="text-base font-black text-slate-950">{flag.label}</p>
                            <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">{flag.detail}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-4 rounded-2xl border border-emerald-200 bg-white/80 px-4 py-3 text-base font-black text-emerald-800">No pricing, category, allergen, description, or nutrition review flags.</p>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === "nutrition" && (
            <div className="space-y-4">
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
                <p className="text-base font-black text-emerald-900">Nutrition is stored deeper than we display.</p>
                <p className="mt-2 text-base font-semibold leading-7 text-emerald-800">Calories and protein stay visible now. Sodium, carbs, fats, sugars, cholesterol, and serving data are reserved for recipe building and future reporting.</p>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                {nutritionRows.map(([label, value]) => (
                  <Property key={label} label={label} value={value} />
                ))}
              </div>
            </div>
          )}

          {activeTab === "files" && (
            <div className="grid gap-3 sm:grid-cols-2">
              {item.file_slots.filter((slot) => ["plating-guide", "recipe-file"].includes(slot.type)).map((slot) => (
                <FileSlot key={slot.type} item={item} slot={slot} onUploadDocument={onUploadDocument} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function LibraryInput({ label, value, onChange, inputMode = "text" }) {
  return (
    <label className="block rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} inputMode={inputMode} className="mt-2 w-full border-0 bg-transparent text-base font-bold text-slate-900 outline-none" />
    </label>
  );
}

function LibraryTextArea({ label, value, onChange }) {
  return (
    <label className="block rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={4} className="mt-2 w-full resize-none border-0 bg-transparent text-base font-bold leading-7 text-slate-900 outline-none" />
    </label>
  );
}

function InlineDocumentUpload({ item, slot, documentType, label, onUploadDocument }) {
  const [status, setStatus] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const upload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setIsUploading(true);
    setStatus("");
    try {
      const payload = await onUploadDocument({ item, documentType, file });
      setStatus(payload?.message || "Saved to Supabase Storage.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <label className="inline-flex cursor-pointer flex-col gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-50">
      <span className="inline-flex items-center gap-2">
        <Upload size={16} />
        {isUploading ? "Uploading..." : label}
      </span>
      {slot?.attached && (
        <span className="text-xs font-bold text-emerald-700">{slot.fileName || "Photo attached"} {slot.versionLabel ? `(${slot.versionLabel})` : ""}</span>
      )}
      {status && <span className="text-xs font-bold text-sky-700">{status}</span>}
      <input type="file" accept="image/png,image/jpeg,image/webp" onChange={upload} disabled={isUploading} className="hidden" />
    </label>
  );
}

function FileSlot({ item, slot, onUploadDocument }) {
  const Icon = slot.type === "plating-guide" ? Camera : FileText;
  const [status, setStatus] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const accept = slot.type === "plating-guide" ? ".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx" : ".pdf,.doc,.docx,.xlsx,.xls";
  const upload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setIsUploading(true);
    setStatus("");
    try {
      const payload = await onUploadDocument({ item, documentType: slot.type, file });
      setStatus(payload?.message || "Saved to Supabase Storage.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <article className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start gap-3">
        <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-700">
          <Icon size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-base font-black text-slate-950">{slot.label}</p>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
            {slot.attached ? `${slot.fileName || "File attached"} ${slot.versionLabel ? `(${slot.versionLabel})` : ""}` : slot.emptyText}
          </p>
          <p className="mt-2 w-fit rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black text-slate-500">Bucket: {slot.bucket}</p>
          {status && <p className="mt-2 rounded-2xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-black text-sky-900">{status}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2 text-sm font-black text-white hover:bg-slate-800">
              <Upload size={16} />
              {isUploading ? "Uploading..." : slot.attached ? "Replace" : "Upload"}
              <input type="file" accept={accept} onChange={upload} disabled={isUploading} className="hidden" />
            </label>
            {slot.signedUrl && (
              <a href={slot.signedUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-100">
                <FileDown size={16} />
                Download
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function Property({ label, value }) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3 sm:p-4">
      <p data-library-property-label className="max-w-full whitespace-normal text-xs font-black uppercase tracking-[0.04em] text-slate-400 [overflow-wrap:normal] [word-break:normal]">{label}</p>
      <p className="mt-2 break-words text-base font-black text-slate-900">{value}</p>
    </div>
  );
}

function InfoPill({ icon: Icon, label, tone }) {
  const toneClass = {
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    sky: "border-sky-200 bg-sky-50 text-sky-900",
    slate: "border-slate-200 bg-white text-slate-700",
    green: "border-emerald-200 bg-emerald-50 text-emerald-900",
  }[tone] || "border-emerald-200 bg-emerald-50 text-emerald-900";
  return (
    <span className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-2 text-sm font-black ${toneClass}`}>
      <Icon size={16} />
      {label}
    </span>
  );
}

function TrustBadge({ status }) {
  const styles = {
    "Needs Review": "border-amber-200 bg-amber-50 text-amber-900",
    Watch: "border-sky-200 bg-sky-50 text-sky-900",
    Trusted: "border-emerald-200 bg-emerald-50 text-emerald-800",
  };
  return (
    <span className={`rounded-full border px-2 py-1 text-xs font-black ${styles[status] || styles.Trusted}`}>
      {status}
    </span>
  );
}
