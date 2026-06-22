import React, { useMemo, useState } from "react";
import { ArrowLeft, ChefHat, Database, DollarSign, FileDown, Flame, ListChecks, Search, ShieldCheck, Sparkles, Utensils } from "lucide-react";

import MENUWORKS_ITEMS from "../../data/menuItems.json";
import { money, pct, priceLabel, titleCase } from "../../shared/formatting.js";
import CompassOneLogo from "../../shared/ui/CompassOneLogo.jsx";
import PlatformSettings from "../../shared/ui/PlatformSettings.jsx";
import VersionStamp from "../../shared/ui/VersionStamp.jsx";

const MENU_ENGINEERING_OVERRIDE_STORAGE_KEY = "culinaryToolsMenuEngineeringItems_v2";

function readMenuRows() {
  if (typeof window === "undefined") return MENUWORKS_ITEMS;
  try {
    const stored = JSON.parse(window.localStorage.getItem(MENU_ENGINEERING_OVERRIDE_STORAGE_KEY) || "null");
    return Array.isArray(stored) && stored.length ? stored : MENUWORKS_ITEMS;
  } catch {
    return MENUWORKS_ITEMS;
  }
}

function textValue(row, ...keys) {
  for (const key of keys) {
    const value = row?.[key];
    if (value !== null && value !== undefined && String(value).trim()) return String(value).trim();
  }
  return "";
}

function itemName(row) {
  return textValue(row, "displayName", "item", "shortName", "recipeName") || "Unnamed item";
}

function itemDescription(row) {
  return textValue(row, "enticingDescription", "ingredientsCommonName", "ingredients") || "No description loaded yet.";
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

function caloriesLabel(value) {
  if (value === null || value === undefined || value === "") return "Calories not loaded";
  const rounded = Math.round(Number(value) / 5) * 5;
  return Number.isFinite(rounded) ? `${rounded.toLocaleString()} cal` : "Calories not loaded";
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
  const [rows] = useState(() => readMenuRows());
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

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f6f7f9_0%,#eef7f2_100%)] p-4 text-slate-950 md:p-8">
      <div className="mx-auto max-w-[96rem] space-y-5">
        <header className="rounded-[2rem] border border-sky-200 bg-white p-5 shadow-xl md:p-7">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <button type="button" onClick={onBackToPlatform} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100">
                <ArrowLeft size={16} />
                Back to Platform
              </button>
              <div className="mt-5">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-600">Recipe Database</p>
                <h1 className="mt-2 text-4xl font-black tracking-normal md:text-5xl">Recipe Database</h1>
                <p className="mt-2 max-w-3xl text-base font-semibold leading-7 text-slate-600">
                  Browse menus and the items inside them with pricing, cost, calories, allergens, descriptions, portions, and item signals. Recipe instructions are not loaded yet.
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
          <MetricCard icon={ChefHat} label="Recipe Instructions" value="0" detail="not loaded yet" tone="amber" />
        </section>

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

            <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <ReadoutCard icon={Sparkles} title="Data Read" value={`${descriptionCoverage}%`} detail="description coverage for this menu" tone="emerald" />
              <ReadoutCard icon={ShieldCheck} title="Safety Signal" value={`${allergenCoverage}%`} detail="allergen coverage for this menu" tone="sky" />
              <ReadoutCard icon={ChefHat} title="Recipe Status" value="Item data only" detail="instructions will show once recipes are loaded" tone="amber" />
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
                  <MenuSection key={category} category={category} items={items} />
                ))
            )}
          </section>
        </main>
      </div>
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

function MenuSection({ category, items }) {
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
          <ItemCard key={`${row.id || row.mrn || itemName(row)}-${index}`} row={row} />
        ))}
      </div>
    </section>
  );
}

function ItemCard({ row }) {
  const diet = dietLabel(row);
  const fc = foodCost(row);
  return (
    <article className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-lg font-black leading-6 text-slate-950">{itemName(row)}</h4>
            {diet && <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-black text-emerald-800">{diet}</span>}
          </div>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{itemDescription(row)}</p>
        </div>
        <div className="flex shrink-0 flex-row gap-2 sm:flex-col sm:items-end">
          <InfoPill icon={DollarSign} label={priceLabel(row.price)} tone="green" />
          <InfoPill icon={Flame} label={caloriesLabel(row.calories)} tone="amber" />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-bold text-slate-600 md:grid-cols-4">
        <Property label="True cost" value={row.trueCost == null ? "Not loaded" : money(row.trueCost)} />
        <Property label="Food cost" value={pct(fc)} />
        <Property label="Portion" value={row.portion || row.Portion || "Not loaded" } />
        <Property label="MRN" value={row.mrn || row.MRN || "Not loaded"} />
      </div>

      <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Allergens</p>
        <p className="mt-1 text-sm font-bold leading-6 text-slate-700">{allergenLabel(row)}</p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black text-slate-600">{row.station || "No station"}</span>
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black text-slate-600">{row.recipeCategory || "No recipe category"}</span>
        <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-black text-amber-900">Recipe instructions not loaded</span>
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
  const toneClass = tone === "amber" ? "border-amber-200 bg-amber-50 text-amber-900" : "border-emerald-200 bg-emerald-50 text-emerald-900";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-black ${toneClass}`}>
      <Icon size={13} />
      {label}
    </span>
  );
}
