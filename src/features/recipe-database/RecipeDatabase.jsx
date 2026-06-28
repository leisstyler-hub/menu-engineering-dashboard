import React, { useMemo, useState } from "react";
import { Activity, AlertTriangle, ArrowLeft, Camera, ChefHat, Database, DollarSign, FileDown, FileText, Flame, Image as ImageIcon, ListChecks, Pencil, Save, Search, ShieldCheck, Sparkles, Utensils, X } from "lucide-react";

import MENUWORKS_ITEMS from "../../data/menuItems.json";
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
  textValue,
} from "./recipeLibraryModel.js";

function readMenuRows() {
  if (typeof window === "undefined") return MENUWORKS_ITEMS;
  try {
    const stored = JSON.parse(window.localStorage.getItem(MENU_ENGINEERING_OVERRIDE_STORAGE_KEY) || "null");
    return Array.isArray(stored) && stored.length ? stored : MENUWORKS_ITEMS;
  } catch {
    return MENUWORKS_ITEMS;
  }
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
  return titleCase(String(row.category || "Unclassified"));
}

function categoryRank(category = "") {
  const normalized = String(category).toLowerCase();
  if (normalized.includes("entree")) return 1;
  if (normalized.includes("side")) return 2;
  if (normalized.includes("sub")) return 3;
  if (normalized.includes("extension")) return 4;
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

function csvEscape(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
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
  const csv = [headers, ...body].map((line) => line.map(csvEscape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${String(menu || "recipe-database").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase()}-items.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function RecipeDatabase({ onBackToPlatform, onOpenSmartsheetHealth }) {
  const [rows, setRows] = useState(() => readMenuRows());
  const menus = useMemo(() => {
    const grouped = Object.entries(countBy(rows, (row) => row.menu || "No menu assigned"))
      .map(([menu, count]) => ({ menu, count }))
      .sort((a, b) => a.menu.localeCompare(b.menu));
    return grouped;
  }, [rows]);
  const [selectedMenu, setSelectedMenu] = useState(() => menus[0]?.menu || "");
  const [menuSearch, setMenuSearch] = useState("");
  const [itemSearch, setItemSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [dietFilter, setDietFilter] = useState("All");
  const [selectedItemKey, setSelectedItemKey] = useState("");
  const [pendingImport, setPendingImport] = useState(null);
  const [uploadInitiationCode, setUploadInitiationCode] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");

  const selectedRows = useMemo(() => rows.filter((row) => (row.menu || "No menu assigned") === selectedMenu), [rows, selectedMenu]);
  const filteredMenuList = menus.filter((entry) => entry.menu.toLowerCase().includes(menuSearch.toLowerCase()));
  const categoryOptions = ["All", ...Array.from(new Set(selectedRows.map(categoryLabel))).sort((a, b) => categoryRank(a) - categoryRank(b) || a.localeCompare(b))];
  const filteredRows = selectedRows
    .filter((row) => {
      const haystack = [itemName(row), row.recipeName, row.station, row.category, itemDescription(row), allergenLabel(row)].join(" ").toLowerCase();
      return !itemSearch || haystack.includes(itemSearch.toLowerCase());
    })
    .filter((row) => categoryFilter === "All" || categoryLabel(row) === categoryFilter)
    .filter((row) => dietFilter === "All" || dietFilterLabel(row) === dietFilter)
    .sort((a, b) => categoryRank(a.category) - categoryRank(b.category) || itemName(a).localeCompare(itemName(b)));

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
  const reviewRows = useMemo(() => selectedRows.filter((row) => itemTrustStatus(row) === "Needs Review"), [selectedRows]);
  const watchRows = useMemo(() => selectedRows.filter((row) => itemTrustStatus(row) === "Watch"), [selectedRows]);
  const dataQuality = useMemo(() => getMenuDataQuality(rows), [rows]);
  const selectedMenuDataQuality = useMemo(() => getMenuDataQuality(selectedRows), [selectedRows]);
  const selectedLibraryItem = useMemo(() => {
    if (!selectedItemKey) return null;
    const row = rows.find((candidate) => normalizeRecipeLibraryItem(candidate).item_key === selectedItemKey);
    return row ? normalizeRecipeLibraryItem(row) : null;
  }, [rows, selectedItemKey]);

  const saveLibraryItem = (patch) => {
    if (!selectedLibraryItem) return;
    const nextRows = applyRecipeLibraryEdit(rows, selectedLibraryItem, patch);
    setRows(nextRows);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(MENU_ENGINEERING_OVERRIDE_STORAGE_KEY, JSON.stringify(nextRows));
    }
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
      const review = await buildMenuWorksImportReview(file, rows);
      setPendingImport(review);
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
    const retainedRows = rows.filter((row) => !importScope.has(row.menu));
    const nextRows = [...retainedRows, ...pendingImport.importedRows].map((row, index) => ({ ...row, id: index }));
    setRows(nextRows);
    setSelectedMenu(pendingImport.importedMenuNames[0] || selectedMenu);
    setSelectedItemKey("");
    setCategoryFilter("All");
    setDietFilter("All");
    if (typeof window !== "undefined") {
      window.localStorage.setItem(MENU_ENGINEERING_OVERRIDE_STORAGE_KEY, JSON.stringify(nextRows));
    }
    setUploadStatus(`Accepted ${pendingImport.importedRows.length.toLocaleString()} MenuWorks rows into Recipe Library.`);
    setPendingImport(null);
  };

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
                <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-600">Recipe Library</p>
                <h1 className="mt-2 text-4xl font-black tracking-normal md:text-5xl">Recipe Library</h1>
                <p className="mt-2 max-w-3xl text-base font-semibold leading-7 text-slate-600">
                  Browse menu item library cards with pricing, cost, calories, protein, allergens, descriptions, portions, and future file slots for recipes, photos, and plating guides.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <PlatformSettings onOpenSmartsheetHealth={onOpenSmartsheetHealth} />
              <CompassOneLogo compact />
              <VersionStamp />
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard icon={Database} label="Menus" value={menus.length.toLocaleString()} detail="indexed menu groups" />
          <MetricCard icon={Utensils} label="Menu Items" value={rows.length.toLocaleString()} detail="item property rows" />
          <MetricCard icon={ListChecks} label="Selected Menu" value={selectedRows.length.toLocaleString()} detail="items in view" />
          <MetricCard icon={ShieldCheck} label="Allergen Coverage" value={`${allergenCoverage}%`} detail="selected menu" />
          <MetricCard icon={ChefHat} label="File Slots" value="4" detail="per item library card" tone="amber" />
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
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600">Menu Detail</p>
                  <h2 className="mt-1 text-3xl font-black">{selectedMenu || "Select a menu"}</h2>
                  <p className="mt-2 text-sm font-semibold text-slate-500">
                    {filteredRows.length.toLocaleString()} visible of {selectedRows.length.toLocaleString()} items. Average priced food cost: {pct(avgFc)}.
                  </p>
                </div>
                <button type="button" onClick={() => downloadMenuCsv(selectedMenu, filteredRows)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-800">
                  <FileDown size={17} />
                  Download menu CSV
                </button>
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
              <ReadoutCard icon={ChefHat} title="Recipe Status" value="Slots ready" detail="recipes attach when source files are loaded" tone="amber" />
            </section>

            {Object.keys(groupedRows).length === 0 ? (
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
            This is the only place to update MenuWorks item rows. Accepted uploads replace matching menus across Recipe Library, Menu Engineering, and menu selectors.
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
  const trustFlags = itemTrustFlags(row);
  const trustStatus = itemTrustStatus(row);
  return (
    <button type="button" onClick={onOpen} className="recipe-library-card w-full rounded-3xl border border-slate-200 bg-slate-50/80 p-4 text-left transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-white hover:shadow-lg active:translate-y-0">
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

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-bold text-slate-600 md:grid-cols-4">
        <Property label="True cost" value={row.trueCost == null ? "Not loaded" : money(row.trueCost)} />
        <Property label="Food cost" value={pct(fc)} />
        <Property label="Protein" value={proteinLabel(libraryItem)} />
        <Property label="Portion" value={row.portion || row.Portion || "Not loaded" } />
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
        <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-black text-amber-900">Recipe instructions not attached yet</span>
      </div>
    </button>
  );
}

function LibraryCardDrawer({ item, onClose, onSave }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(() => ({
    display_name: item.display_name || "",
    description: item.description || "",
    allergen_summary: item.allergen_summary || allergenLabel(item.raw),
    calories: item.calories ?? "",
    protein_g: item.protein_g ?? "",
    price: item.price ?? "",
    true_cost: item.true_cost ?? "",
  }));

  const save = () => {
    onSave(draft);
    setIsEditing(false);
  };

  const nutritionRows = [
    ["Calories", caloriesLabel(item.calories)],
    ["Protein", proteinLabel(item)],
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
      <section className="recipe-library-drawer mx-auto flex max-h-[calc(100vh-1.5rem)] w-full max-w-3xl flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl md:mt-4 md:max-h-[calc(100vh-4rem)]">
        <div className="border-b border-slate-200 bg-slate-50 p-4 md:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600">Recipe Library Card</p>
              <h2 className="mt-2 text-2xl font-black leading-tight text-slate-950 md:text-3xl">{item.display_name}</h2>
              <p className="mt-2 text-sm font-bold text-slate-500">{item.menu || "No menu"} / {item.station || "No station"} / {item.category || "No category"}</p>
            </div>
            <button type="button" onClick={onClose} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100" aria-label="Close library card">
              <X size={19} />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <InfoPill icon={Flame} label={caloriesLabel(item.calories)} tone="amber" />
            <InfoPill icon={Activity} label={proteinLabel(item)} tone="sky" />
            <InfoPill icon={DollarSign} label={priceLabel(item.price)} tone="green" />
            <InfoPill icon={Database} label={item.mrn ? `MRN ${item.mrn}` : "MRN not loaded"} tone="slate" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 border-b border-slate-200 bg-white p-3">
          {["overview", "nutrition", "files"].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-2xl px-3 py-2 text-sm font-black capitalize ${activeTab === tab ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-auto p-4 md:p-5">
          {activeTab === "overview" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Chef-Facing Details</p>
                <button type="button" onClick={() => (isEditing ? save() : setIsEditing(true))} className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-800 hover:bg-emerald-100">
                  {isEditing ? <Save size={16} /> : <Pencil size={16} />}
                  {isEditing ? "Save card" : "Edit card"}
                </button>
              </div>

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
                  <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-800">Data Confidence</p>
                      <TrustBadge status={item.trust_status || "Trusted"} />
                    </div>
                    {item.trust_flags?.length ? (
                      <div className="mt-3 space-y-2">
                        {item.trust_flags.map((flag) => (
                          <div key={`${flag.label}-${flag.detail}`} className="rounded-2xl border border-white bg-white/80 px-3 py-2">
                            <p className="text-sm font-black text-slate-950">{flag.label}</p>
                            <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">{flag.detail}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm font-bold text-emerald-800">No pricing, category, allergen, description, or nutrition review flags.</p>
                    )}
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Description</p>
                    <p className="mt-2 text-base font-semibold leading-7 text-slate-700">{item.description}</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Allergens</p>
                    <p className="mt-2 text-base font-black leading-7 text-slate-800">{item.allergen_summary || allergenLabel(item.raw)}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Property label="Portion" value={item.portion || "Not loaded"} />
                    <Property label="Recipe category" value={item.recipe_category || "Not loaded"} />
                    <Property label="True cost" value={item.true_cost == null ? "Not loaded" : money(item.true_cost)} />
                    <Property label="Food cost" value={item.price && item.true_cost ? pct(item.true_cost / item.price) : "Not loaded"} />
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === "nutrition" && (
            <div className="space-y-4">
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-sm font-black text-emerald-900">Nutrition is stored deeper than we display.</p>
                <p className="mt-1 text-sm font-semibold leading-6 text-emerald-800">Calories and protein stay visible now. Sodium, carbs, fats, sugars, cholesterol, and serving data are reserved for recipe building and future reporting.</p>
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {nutritionRows.map(([label, value]) => (
                  <Property key={label} label={label} value={value} />
                ))}
              </div>
            </div>
          )}

          {activeTab === "files" && (
            <div className="grid gap-3 sm:grid-cols-2">
              {item.file_slots.map((slot) => (
                <FileSlot key={slot.type} slot={slot} />
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

function FileSlot({ slot }) {
  const Icon = slot.type === "item-photo" ? ImageIcon : slot.type === "plating-guide" ? Camera : FileText;
  return (
    <article className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start gap-3">
        <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-700">
          <Icon size={20} />
        </div>
        <div className="min-w-0">
          <p className="text-base font-black text-slate-950">{slot.label}</p>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">{slot.emptyText}</p>
          <p className="mt-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black text-slate-500">Bucket: {slot.bucket}</p>
        </div>
      </div>
    </article>
  );
}

function Property({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-black text-slate-900">{value}</p>
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
    <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-black ${toneClass}`}>
      <Icon size={13} />
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
