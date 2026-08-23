import React, { useMemo, useState } from "react";
import { ArrowLeft, Grid3x3, Info, LayoutList, Search } from "lucide-react";
import CompassOneLogo from "../../shared/ui/CompassOneLogo.jsx";
import PlatformSettings from "../../shared/ui/PlatformSettings.jsx";
import VersionStamp from "../../shared/ui/VersionStamp.jsx";
import DATA from "../../data/menuCrossUtilization.json";
import { findPair, sharedIngredients } from "./menuCrossUtilizationModel.js";

const percent = (value) => `${Math.round((value || 0) * 100)}%`;
const DATA_PAIRS = DATA.pairs;

function pillarCrossUseStats(pillar, menus) {
  const members = menus.filter((menu) => pillar.menus.includes(menu.name));
  const eligibleMembers = members.filter((menu) => menu.hasIngredientData);
  let total = 0;
  let count = 0;
  for (let i = 0; i < eligibleMembers.length; i += 1) {
    for (let j = i + 1; j < eligibleMembers.length; j += 1) {
      const pair = findPair(DATA_PAIRS, eligibleMembers[i].name, eligibleMembers[j].name);
      if (pair) {
        total += pair.overlapPercent;
        count += 1;
      }
    }
  }
  return { members, eligibleMembers, avgOverlap: count ? total / count : 0, pairCount: count };
}

export default function MenuCrossUtilizationTool({ onBackToPlatform, onOpenSmartsheetHealth }) {
  const [view, setView] = useState("overview");
  const [search, setSearch] = useState("");
  const [pillarFilter, setPillarFilter] = useState("All pillars");
  const [selectedPair, setSelectedPair] = useState(null);

  const menus = DATA.menus;
  const eligibleMenus = useMemo(() => menus.filter((menu) => menu.hasIngredientData), [menus]);
  const maxOverlap = useMemo(() => DATA.pairs.reduce((max, pair) => Math.max(max, pair.overlapPercent), 0), []);

  const filteredMenus = useMemo(() => {
    const query = search.trim().toLowerCase();
    return menus.filter((menu) => {
      if (pillarFilter !== "All pillars" && menu.pillar !== pillarFilter) return false;
      if (query && !menu.name.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [menus, search, pillarFilter]);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-5 text-slate-950 md:px-8">
      <div className="mx-auto max-w-[110rem] space-y-5">
        <header className="rounded-lg border border-sky-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <button onClick={onBackToPlatform} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100">
                <ArrowLeft size={16} /> Back to Platform
              </button>
              <p className="mt-5 text-xs font-black uppercase tracking-[0.22em] text-emerald-600">Menu Planning Tool</p>
              <h1 className="mt-2 text-3xl font-black md:text-5xl">Menu Cross Utilization Tool</h1>
              <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
                Ingredient/purchasing overlap guidance for menu planning, built from shopping-list data. This is guidance only, not an automatic rotation rule, and not proof of shared prep, recipes, labor, cost, or waste reduction.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <PlatformSettings onOpenSmartsheetHealth={onOpenSmartsheetHealth} />
              <CompassOneLogo />
              <VersionStamp />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-600">
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1">{DATA.scope.account}</span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1">Report date {DATA.scope.reportDate}</span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1">{DATA.scope.mealPeriod}</span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1">{DATA.scope.source}</span>
          </div>
        </header>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setView("overview")}
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-bold ${view === "overview" ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"}`}
          >
            <LayoutList size={16} /> Pillar Strategy &amp; Menus
          </button>
          <button
            type="button"
            onClick={() => setView("matrix")}
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-bold ${view === "matrix" ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"}`}
          >
            <Grid3x3 size={16} /> Open Pairwise Matrix
          </button>
        </div>

        {view === "overview" ? (
          <>
            <PillarStrategy pillars={DATA.pillars} menus={menus} />
            <MenuTable
              menus={filteredMenus}
              search={search}
              setSearch={setSearch}
              pillarFilter={pillarFilter}
              setPillarFilter={setPillarFilter}
              pillars={DATA.pillars}
            />
          </>
        ) : (
          <PairwiseMatrix
            menus={eligibleMenus}
            pairs={DATA.pairs}
            maxOverlap={maxOverlap}
            selectedPair={selectedPair}
            setSelectedPair={setSelectedPair}
          />
        )}
      </div>
    </div>
  );
}

function PillarStrategy({ pillars, menus }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Pillar Strategy</p>
      <h2 className="mt-1 text-2xl font-black">Cuisine pillar groupings</h2>
      <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
        Pillars are set by the source document as a strategic cuisine grouping, not computed from ingredient data. Avg overlap below is this tool's own ingredient/purchasing Jaccard overlap among menus inside each pillar.
      </p>
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {pillars.map((pillar) => (
          <PillarCard key={pillar.name} pillar={pillar} menus={menus} />
        ))}
      </div>
    </section>
  );
}

function PillarCard({ pillar, menus }) {
  const { members, avgOverlap } = useMemo(() => pillarCrossUseStats(pillar, menus), [pillar, menus]);

  return (
    <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-2">
        <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: pillar.color }} />
        <h3 className="text-sm font-black text-slate-950">{pillar.name}</h3>
      </div>
      <p className="mt-2 text-xs font-semibold text-slate-500">{members.length} menus</p>
      <p className="mt-1 text-lg font-black text-slate-950">{percent(avgOverlap)} <span className="text-xs font-bold text-slate-500">avg pairwise overlap</span></p>
      <div className="mt-3 flex flex-wrap gap-1">
        {members.map((menu) => (
          <span key={menu.name} className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-600">{menu.name}</span>
        ))}
      </div>
    </article>
  );
}

function MenuTable({ menus, search, setSearch, pillarFilter, setPillarFilter, pillars }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">All Menus</p>
          <h2 className="mt-1 text-2xl font-black">Menu cross-utilization list</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search menu"
              className="rounded-lg border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-sm font-semibold text-slate-800"
            />
          </div>
          <select
            value={pillarFilter}
            onChange={(event) => setPillarFilter(event.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700"
          >
            <option>All pillars</option>
            {pillars.map((pillar) => (
              <option key={pillar.name}>{pillar.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs font-black uppercase tracking-[0.08em] text-slate-500">
              <th className="py-2 pr-3">Menu</th>
              <th className="py-2 pr-3">Pillar</th>
              <th className="py-2 pr-3">Eligible SKUs</th>
              <th className="py-2 pr-3">Portfolio Shared SKUs</th>
              <th className="py-2 pr-3">Portfolio Cross-Use %</th>
              <th className="py-2 pr-3">Unique SKUs</th>
            </tr>
          </thead>
          <tbody>
            {menus.map((menu) => (
              <tr key={menu.name} className="border-b border-slate-100">
                <td className="py-2 pr-3 font-bold text-slate-950">{menu.name}</td>
                <td className="py-2 pr-3 text-slate-600">{menu.pillar || "—"}</td>
                {menu.hasIngredientData ? (
                  <>
                    <td className="py-2 pr-3 text-slate-700">{menu.portfolio.eligibleCount.toLocaleString()}</td>
                    <td className="py-2 pr-3 text-slate-700">{menu.portfolio.sharedWithAny.toLocaleString()}</td>
                    <td className="py-2 pr-3 font-bold text-slate-950">{percent(menu.portfolio.crossUsePercent)}</td>
                    <td className="py-2 pr-3 text-slate-700">{menu.portfolio.uniqueCount.toLocaleString()}</td>
                  </>
                ) : (
                  <td className="py-2 pr-3 text-amber-800" colSpan={4}>
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-black">no ingredient data</span>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function overlapColor(value, max) {
  const ratio = max ? Math.min(1, value / max) : 0;
  const alpha = 0.08 + ratio * 0.72;
  return `rgba(185, 28, 28, ${alpha.toFixed(3)})`;
}

function PairwiseMatrix({ menus, pairs, maxOverlap, selectedPair, setSelectedPair }) {
  const cellFor = (a, b) => {
    if (a === b) return null;
    return findPair(pairs, a, b);
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Pairwise Matrix</p>
      <h2 className="mt-1 text-2xl font-black">Ingredient overlap by menu pair</h2>
      <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
        Hover a cell for a quick read, or click it for the full pair detail. Overlap is plain Jaccard on shared match keys (shared ingredients divided by union of ingredients). Chickle has no ingredient data and is excluded from this grid.
      </p>

      <PillarCrossUseStrip pillars={DATA.pillars} menus={menus} />

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div data-testid="pairwise-matrix-grid" className="overflow-auto rounded-lg border border-slate-200" style={{ maxHeight: 780 }}>
          <table className="border-collapse text-[11px]">
            <thead>
              <tr>
                <th className="sticky left-0 top-0 z-20 bg-white p-1" />
                {menus.map((menu) => (
                  <th key={menu.name} className="sticky top-0 z-10 bg-white p-1 font-bold text-slate-600" style={{ writingMode: "vertical-rl", height: 110 }}>
                    {menu.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {menus.map((rowMenu) => (
                <tr key={rowMenu.name}>
                  <th className="sticky left-0 z-10 whitespace-nowrap bg-white p-1 text-right font-bold text-slate-600">{rowMenu.name}</th>
                  {menus.map((colMenu) => {
                    const pair = cellFor(rowMenu.name, colMenu.name);
                    if (!pair) {
                      return <td key={colMenu.name} className="border border-slate-100 bg-slate-50" style={{ height: 38, minWidth: 38, width: 38 }} />;
                    }
                    const isSelected = selectedPair && ((selectedPair.a === pair.a && selectedPair.b === pair.b));
                    const intensity = maxOverlap ? pair.overlapPercent / maxOverlap : 0;
                    return (
                      <td
                        key={colMenu.name}
                        title={`${rowMenu.name} × ${colMenu.name}: ${percent(pair.overlapPercent)} overlap, ${pair.sharedCount} shared ingredients`}
                        onClick={() => setSelectedPair(pair)}
                        className={`cursor-pointer border p-0 text-center align-middle text-[10px] font-black leading-none ${isSelected ? "border-2 border-slate-950" : "border-red-100"} ${intensity > 0.45 ? "text-white" : "text-red-950"}`}
                        style={{ backgroundColor: overlapColor(pair.overlapPercent, maxOverlap) }}
                      >
                        {percent(pair.overlapPercent)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <PairDetail pair={selectedPair} menus={menus} />
      </div>
    </section>
  );
}

function PillarCrossUseStrip({ pillars, menus }) {
  return (
    <div className="mt-4 rounded-lg border border-red-100 bg-red-50 p-3">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-red-700">Pillar cross-utilization %</p>
      <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
        {pillars.map((pillar) => {
          const { members, eligibleMembers, avgOverlap, pairCount } = pillarCrossUseStats(pillar, menus);
          return (
            <div key={pillar.name} data-testid={`pillar-cross-use-${pillar.name}`} className="rounded-lg border border-red-100 bg-white p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-black text-slate-950">{pillar.name}</span>
                <span className="text-lg font-black text-red-700">{percent(avgOverlap)}</span>
              </div>
              <p className="mt-1 text-[11px] font-bold text-slate-500">
                {eligibleMembers.length}/{members.length} menus with ingredient data, {pairCount} menu pairs
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PairDetail({ pair, menus }) {
  if (!pair) {
    return (
      <aside className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm font-semibold text-slate-500">
        <Info size={16} className="mb-2" />
        Click any matrix cell to see % overlap, shared ingredients, and purchasing reuse notes for that menu pair.
      </aside>
    );
  }

  const menuA = menus.find((menu) => menu.name === pair.a);
  const menuB = menus.find((menu) => menu.name === pair.b);
  const shared = sharedIngredients(menus, pair.a, pair.b).map((key) => DATA.ingredientLabels[key]).sort();

  return (
    <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Pair Detail</p>
      <h3 className="mt-1 text-xl font-black">{pair.a} × {pair.b}</h3>

      <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-700">% Overlap</p>
        <p className="text-3xl font-black text-emerald-900">{percent(pair.overlapPercent)}</p>
        <p className="mt-1 text-xs font-semibold text-emerald-800">{pair.sharedCount} shared ingredients (ingredient/purchasing overlap only)</p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-bold text-slate-600">
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">{pair.a}: {menuA?.portfolio.eligibleCount ?? "—"} eligible SKUs</span>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">{pair.b}: {menuB?.portfolio.eligibleCount ?? "—"} eligible SKUs</span>
      </div>
      <p className="mt-2 text-[11px] font-semibold text-slate-500">Small menus can show noisier percentages against large menus — check eligible SKU counts above before over-reading a big-looking percentage.</p>

      <div className="mt-4">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Shared ingredients ({shared.length})</p>
        <div className="mt-2 max-h-48 space-y-1 overflow-y-auto">
          {shared.map((label) => (
            <p key={label} className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700">{label}</p>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-sky-200 bg-sky-50 p-3">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-sky-700">Ordering / reuse opportunity</p>
        <p className="mt-1 text-xs font-semibold leading-5 text-sky-900">
          {pair.sharedCount} ingredients purchased by both menus is a purchasing/ordering reuse signal, not proof of a shared recipe. Use this as a data-based starting point for menu-planning conversations, not an automatic rotation decision.
        </p>
      </div>
    </aside>
  );
}
