import React from "react";
import { ArrowRight, BarChart3, CalendarRange, ClipboardCheck, Database, Home, ListChecks, PieChart, Settings, ShieldCheck, Smartphone, Sparkles, TrendingUp, Utensils, Wrench } from "lucide-react";

import CHANGELOG_TEXT from "../../CHANGELOG.md?raw";
import MENUWORKS_ITEMS from "../data/menuItems.json";
import CompassOneLogo from "../shared/ui/CompassOneLogo.jsx";
import PlatformSettings from "../shared/ui/PlatformSettings.jsx";
import VersionStamp from "../shared/ui/VersionStamp.jsx";
import { money, pct } from "../shared/formatting.js";

const getDietType = (item) => {
  const vegan = String(item.veganTag || item.dietTags || "").toLowerCase().includes("vegan");
  const vegetarian = String(item.vegetarianTag || item.dietTags || "").toLowerCase().includes("vegetarian");
  if (vegan) return "Vegan";
  if (vegetarian) return "Vegetarian";
  return "Regular";
};

const CHANGELOG_ENTRIES = (() => {
  let currentDate = "";
  return CHANGELOG_TEXT
    .split("\n")
    .reduce((entries, line) => {
      const dateMatch = line.match(/^##\s+(.+)/);
      if (dateMatch) currentDate = dateMatch[1].trim();
      if (line.startsWith("- ")) entries.push({ text: line.replace(/^- /, ""), date: currentDate });
      return entries;
    }, []);
})();

const firstTenChangelogItems = CHANGELOG_ENTRIES.slice(0, 10);
const WEEKLY_TRAFFIC_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => ({
  day,
  visitors: null,
  placeholderLevel: 24 + ((index + 1) % 4) * 14,
}));
const TRAFFIC_VISITOR_STORAGE_KEY = "culinaryToolsAnonymousVisitorId_v1";

const countBy = (rows, getKey) =>
  rows.reduce((acc, row) => {
    const key = getKey(row) || "Unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

const percentOf = (value, total) => total ? Math.round((value / total) * 100) : 0;

function getOrCreateTrafficVisitorId() {
  if (typeof window === "undefined") return "";
  try {
    const existing = window.localStorage.getItem(TRAFFIC_VISITOR_STORAGE_KEY);
    if (existing) return existing;
    const nextId = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    window.localStorage.setItem(TRAFFIC_VISITOR_STORAGE_KEY, nextId);
    return nextId;
  } catch {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

const PROTEIN_PATTERN = /beef|chicken|pork|turkey|salmon|fish|cod|shrimp|tuna|meatball|steak|brisket|carnitas|chorizo|bacon|sausage|egg|tofu|tempeh|paneer|lentil|bean|chickpea|falafel/i;
const COMPLIMENTARY_PATTERN = /sauce|dressing|dip|salsa|aioli|chutney|relish|gravy|marinade|vinaigrette|condiment|garnish|pickle|seasoning|spice|rub/i;

const itemText = (item) => [
  item.item,
  item.displayName,
  item.recipeName,
  item.recipeCategory,
  item.category,
  item.menuItemNotes,
  item.ingredientsCommonName,
].filter(Boolean).join(" ");

const hasProteinSignal = (item) => PROTEIN_PATTERN.test(itemText(item));
const isComplimentaryItem = (item) => {
  const category = String(item.category || "").toLowerCase();
  if (category === "subrecipe") return true;
  return category === "extension" || COMPLIMENTARY_PATTERN.test(itemText(item));
};

const csvEscape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

function trustGapInstruction(gapType) {
  if (gapType === "Protein price gap") {
    return {
      reason: "This item appears to contain protein and does not have a positive selling price.",
      field: "Price",
      acceptableInput: "Enter menu selling price, for example 11.75.",
      where: "Fill the ENTER VALUE HERE cell, then send this CSV back or update the MenuWorks source file."
    };
  }
  if (gapType === "Price-required gap") {
    return {
      reason: "This item does not look complimentary and does not have a positive selling price.",
      field: "Price or Complimentary Confirmation",
      acceptableInput: "Enter price, or write COMPLIMENTARY if this should not count against price coverage.",
      where: "Fill the ENTER VALUE HERE cell, then send this CSV back or update the MenuWorks source file."
    };
  }
  if (gapType === "Missing true cost") {
    return {
      reason: "This row is missing true cost, so food cost and margin reads may be incomplete.",
      field: "True Cost",
      acceptableInput: "Enter true cost as a number, for example 2.57.",
      where: "Fill the ENTER VALUE HERE cell, then send this CSV back or update the MenuWorks source file."
    };
  }
  if (gapType === "Missing allergen detail") {
    return {
      reason: "This row has no allergen signal for chef-facing safety review.",
      field: "Allergen Summary / Allergen Details",
      acceptableInput: "Enter allergens, or write NONE if reviewed and no allergens apply.",
      where: "Fill the ENTER VALUE HERE cell, then send this CSV back or update the MenuWorks source file."
    };
  }
  return {
    reason: "This row is missing chef-facing description or ingredient detail.",
    field: "Enticing Description / Ingredients Common Name",
    acceptableInput: "Enter a short menu description or ingredient detail.",
    where: "Fill the ENTER VALUE HERE cell, then send this CSV back or update the MenuWorks source file."
  };
}

function downloadTrustLayerGapList(rows) {
  const headers = ["REVIEW STATUS", "WHY THIS ROW IS LISTED", "FIELD TO FILL IN", "ENTER VALUE HERE", "ACCEPTABLE INPUT", "WHERE TO PUT IT", "GAP TYPE", "PRIORITY", "ITEM", "MENU", "STATION", "CATEGORY", "MRN", "RECIPE CATEGORY", "CURRENT PRICE", "TRUE COST", "CURRENT NOTES"];
  const body = rows.map((row) => {
    const instruction = trustGapInstruction(row.gapType);
    return [
      "NEEDS REVIEW",
      instruction.reason,
      instruction.field,
      "FILL THIS IN",
      instruction.acceptableInput,
      instruction.where,
      row.gapType,
      row.gapType === "Protein price gap" ? "HIGH" : row.gapType === "Price-required gap" ? "MEDIUM" : "STANDARD",
      row.item || row.displayName,
      row.menu,
      row.station,
      row.category,
      row.mrn,
      row.recipeCategory,
      row.price ?? "",
      row.trueCost ?? "",
      row.menuItemNotes || "",
    ];
  });
  const csv = [headers, ...body].map((line) => line.map(csvEscape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "culinary-tools-trust-layer-gaps.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function LandingPage({ onOpenMenuEngineering, onOpenNeighborhoodRotations, onOpenLadleCompliance, onOpenLeanTool, onOpenSmartsheetHealth }) {
  const [weeklyTraffic, setWeeklyTraffic] = React.useState({
    days: WEEKLY_TRAFFIC_DAYS,
    status: "loading",
    message: "Connecting secure traffic endpoint...",
  });
  const totalItems = MENUWORKS_ITEMS.length;
  const menuCount = new Set(MENUWORKS_ITEMS.map((item) => item.menu).filter(Boolean)).size;
  const costedItems = MENUWORKS_ITEMS.filter((item) => item.trueCost != null).length;
  const foodCostRows = MENUWORKS_ITEMS.filter((item) => item.price != null && item.price > 0 && item.trueCost != null);
  const complimentaryItems = MENUWORKS_ITEMS.filter(isComplimentaryItem);
  const priceRequiredItems = MENUWORKS_ITEMS.filter((item) => !isComplimentaryItem(item));
  const pricedRequiredItems = priceRequiredItems.filter((item) => item.price != null && item.price > 0);
  const proteinPriceGaps = priceRequiredItems.filter((item) => hasProteinSignal(item) && !(item.price != null && item.price > 0));
  const priceGapRows = priceRequiredItems
    .filter((item) => !(item.price != null && item.price > 0))
    .map((item) => ({ ...item, gapType: hasProteinSignal(item) ? "Protein price gap" : "Price-required gap" }));
  const trustGapRows = [
    ...priceGapRows,
    ...MENUWORKS_ITEMS.filter((item) => item.trueCost == null).map((item) => ({ ...item, gapType: "Missing true cost" })),
    ...MENUWORKS_ITEMS.filter((item) => !(item.allergens?.length || item.allergenSummary)).map((item) => ({ ...item, gapType: "Missing allergen detail" })),
    ...MENUWORKS_ITEMS.filter((item) => !(item.enticingDescription || item.ingredientsCommonName)).map((item) => ({ ...item, gapType: "Missing description" })),
  ];
  const avgFoodCost = foodCostRows.length
    ? foodCostRows.reduce((sum, item) => sum + (item.trueCost / item.price), 0) / foodCostRows.length
    : null;
  const dietCounts = countBy(MENUWORKS_ITEMS, getDietType);
  const categoryCounts = countBy(MENUWORKS_ITEMS, (item) => item.category || "Unclassified");
  const allergenCoverage = percentOf(MENUWORKS_ITEMS.filter((item) => item.allergens?.length || item.allergenSummary).length, totalItems);
  const detailCoverage = percentOf(MENUWORKS_ITEMS.filter((item) => item.enticingDescription || item.ingredientsCommonName).length, totalItems);
  const costCoverage = percentOf(MENUWORKS_ITEMS.filter((item) => item.trueCost != null).length, totalItems);
  const priceCoverage = percentOf(pricedRequiredItems.length, priceRequiredItems.length);
  const recentItems = [...MENUWORKS_ITEMS].sort((a, b) => Number(b.id || 0) - Number(a.id || 0)).slice(0, 10);
  const topMenus = Object.entries(countBy(MENUWORKS_ITEMS, (item) => item.menu))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  React.useEffect(() => {
    let cancelled = false;

    async function syncWeeklyTraffic() {
      try {
        const visitorId = getOrCreateTrafficVisitorId();
        const response = await fetch("/api/traffic/weekly", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            visitorId,
            path: `${window.location.pathname}${window.location.search}`,
          }),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || payload.ok === false) {
          throw new Error(payload.message || "Traffic endpoint unavailable");
        }
        if (!cancelled) {
          setWeeklyTraffic({
            days: Array.isArray(payload.days) && payload.days.length ? payload.days : WEEKLY_TRAFFIC_DAYS,
            status: "live",
            message: "Anonymous weekly visitors from the secure app endpoint.",
            generatedAt: payload.generatedAt,
          });
        }
      } catch (error) {
        if (!cancelled) {
          setWeeklyTraffic({
            days: WEEKLY_TRAFFIC_DAYS,
            status: "error",
            message: error.message || "Traffic endpoint unavailable",
          });
        }
      }
    }

    syncWeeklyTraffic();
    return () => {
      cancelled = true;
    };
  }, []);

  const tools = [
    {
      title: "Menu Engineering",
      eyebrow: "Live",
      description: "Review price, true cost, food cost %, margin, and portfolio health across MenuWorks items.",
      action: "Open Dashboard",
      onOpen: onOpenMenuEngineering,
      icon: BarChart3,
      tone: "emerald",
      meta: "Financial read"
    },
    {
      title: "Neighborhood Rotations",
      eyebrow: "Pilot in Place",
      description: "Declare weekly global rotations, station LTOs, Fresh $5 selections, and district status.",
      action: "Open Rotations",
      onOpen: onOpenNeighborhoodRotations,
      icon: CalendarRange,
      tone: "sky",
      meta: "Chef planner"
    },
    {
      title: "Ladle Compliance",
      eyebrow: "Test concept",
      description: "Track compliance by district, cafe, and week with executive summaries and follow-up cues.",
      action: "Open Compliance",
      onOpen: onOpenLadleCompliance,
      icon: ClipboardCheck,
      tone: "amber",
      meta: "Prototype"
    },
    {
      title: "Lean Tool",
      eyebrow: "New",
      description: "Run fast phone or tablet observations using DOWNTIME waste categories, live marks, and report-out email.",
      action: "Open Lean Tool",
      onOpen: onOpenLeanTool,
      icon: Smartphone,
      tone: "lime",
      meta: "Field tracker"
    }
  ];

  return (
    <div className="min-h-screen bg-[#f6f7f9] text-slate-950">
      <MobileLanding
        tools={tools}
        totalItems={totalItems}
        menuCount={menuCount}
        costedItems={costedItems}
        allergenCoverage={allergenCoverage}
        detailCoverage={detailCoverage}
        costCoverage={costCoverage}
        priceCoverage={priceCoverage}
        avgFoodCost={avgFoodCost}
        dietCounts={dietCounts}
        categoryCounts={categoryCounts}
        recentItems={recentItems}
        onOpenMenuEngineering={onOpenMenuEngineering}
        onOpenNeighborhoodRotations={onOpenNeighborhoodRotations}
        onOpenLadleCompliance={onOpenLadleCompliance}
        onOpenLeanTool={onOpenLeanTool}
        onOpenSmartsheetHealth={onOpenSmartsheetHealth}
      />

      <div className="mx-auto hidden w-full max-w-[96rem] flex-col gap-5 px-5 py-5 md:flex md:px-8">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div>
              <CompassOneLogo />
              <h1 className="text-2xl font-bold tracking-normal md:text-3xl">Culinary Tools Platform</h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <PlatformSettings onOpenSmartsheetHealth={onOpenSmartsheetHealth} />
            <VersionStamp />
          </div>
        </header>

        <main className="grid grid-cols-1 gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
          <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Operations Console</p>
            <h2 className="mt-2 text-3xl font-bold">Plan, price, and audit menus from one workspace.</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Built for quick chef decisions: choose the workstream, check status, and move straight into the active tool.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Metric label="Tools" value="4" />
              <Metric label="Menu items" value={totalItems.toLocaleString()} />
              <Metric label="Menus" value={menuCount} />
              <Metric label="Costed items" value={costedItems.toLocaleString()} />
            </div>
            <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Database size={16} />
                MenuWorks dataset
              </div>
              <p className="mt-2 text-sm text-slate-600">
                Item details, pricing, allergens, and review warnings are surfaced where they affect selections.
              </p>
            </div>
          </aside>

          <section className="space-y-5">
            <section className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
              {tools.map((tool) => (
                <ToolCard key={tool.title} {...tool} />
              ))}
            </section>

            <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
              <DashboardPanel icon={PieChart} eyebrow="Menu Intelligence" title="Diet Mix">
                <DietDonut counts={dietCounts} total={totalItems} />
              </DashboardPanel>

              <DashboardPanel icon={TrendingUp} eyebrow="Cost Signal" title="Menu Category Spread">
                <CategoryBars counts={categoryCounts} total={totalItems} />
              </DashboardPanel>
            </section>

            <DashboardPanel icon={BarChart3} eyebrow="Usage Signal" title="Weekly Traffic">
              <WeeklyTrafficChart traffic={weeklyTraffic} />
            </DashboardPanel>

            <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
              <DashboardPanel icon={Database} eyebrow="Trust Layer" title="Data Confidence">
                <ConfidenceBars
                  rows={[
                    ["Recipe cost coverage", costCoverage, `${costedItems.toLocaleString()} rows with true cost`],
                    ["Price-required coverage", priceCoverage, `${pricedRequiredItems.length.toLocaleString()} of ${priceRequiredItems.length.toLocaleString()} required items priced`],
                    ["Allergen coverage", allergenCoverage, "item safety detail signal"],
                    ["Description coverage", detailCoverage, "chef-facing detail signal"],
                  ]}
                />
                <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm font-black text-slate-950">Trust rule</p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    Complimentary sauces/sub recipes are excluded from price-required coverage. Protein-bearing items without a positive price are treated as gaps.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-slate-600">
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1">{complimentaryItems.length.toLocaleString()} complimentary rows</span>
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-900">{proteinPriceGaps.length.toLocaleString()} protein price gaps</span>
                  </div>
                  <button onClick={() => downloadTrustLayerGapList(trustGapRows)} className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-800 hover:bg-slate-100">
                    Download trust action CSV
                  </button>
                </div>
              </DashboardPanel>

              <DashboardPanel icon={Sparkles} eyebrow="Executive Signal" title="Operational Read">
                <SignalStack
                  rows={[
                    { label: "Menu data trust is actively tracked", value: costCoverage, tone: "emerald", detail: "Trust coverage now separates complimentary rows from protein price gaps." },
                    { label: "Rotation health reads submitted truth", value: 84, tone: "sky", detail: "Executive views count locked menus, selected items, duplicates, and cost health from submitted rotations." },
                    { label: "Lean results are ready for leader review", value: 70, tone: "lime", detail: "Stored results, filters, email reporting, and void controls are in place." },
                  ]}
                />
              </DashboardPanel>
            </section>

            <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(420px,0.75fr)]">
              <DashboardPanel icon={ListChecks} eyebrow="Newest Data Signal" title="Recently Added Items">
                <div className="space-y-2">
                  {recentItems.map((item) => (
                    <div key={item.id} className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-950">{item.item}</p>
                        <p className="mt-1 truncate text-xs font-semibold text-slate-500">{item.menu} / {item.station || "No station"}</p>
                      </div>
                      <span className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-600">
                        {item.price == null ? "Comp" : money(item.price)}
                      </span>
                    </div>
                  ))}
                </div>
              </DashboardPanel>

              <DashboardPanel icon={Database} eyebrow="Release Signal" title="Latest Changelog">
                <div className="space-y-2">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-sm font-black text-slate-950">{CHANGELOG_ENTRIES.length.toLocaleString()} total logged changes</p>
                  </div>
                  {firstTenChangelogItems.map((item, index) => (
                    <div key={`${item.text}-${index}`} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold leading-5 text-slate-700">{item.text}</p>
                        <span className="shrink-0 rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] font-black text-slate-500">#{CHANGELOG_ENTRIES.length - index}</span>
                      </div>
                      <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">{item.date}</p>
                    </div>
                  ))}
                </div>
              </DashboardPanel>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Portfolio Watch</p>
                  <h2 className="mt-1 text-2xl font-bold tracking-normal">Largest menu libraries</h2>
                </div>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600">Top {topMenus.length}</span>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {topMenus.map(([menu, count]) => (
                  <div key={menu} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-bold text-slate-950">{menu}</p>
                      <p className="text-sm font-black text-emerald-700">{count}</p>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.max(8, percentOf(count, totalItems) * 5)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </section>
        </main>
      </div>
    </div>
  );
}

function MobileLanding({
  tools,
  totalItems,
  menuCount,
  costedItems,
  allergenCoverage,
  detailCoverage,
  costCoverage,
  priceCoverage,
  avgFoodCost,
  dietCounts,
  categoryCounts,
  recentItems,
  onOpenMenuEngineering,
  onOpenNeighborhoodRotations,
  onOpenLadleCompliance,
  onOpenLeanTool,
  onOpenSmartsheetHealth,
}) {
  const metricTiles = [
    { label: "Tools", value: "4", icon: Wrench, tone: "bg-[#fff7e7] text-[#8a621b]" },
    { label: "Menu Items", value: totalItems.toLocaleString(), icon: Utensils, tone: "bg-[#eaf8f2] text-emerald-700" },
    { label: "Menus", value: menuCount, icon: ListChecks, tone: "bg-[#edf5ff] text-sky-700" },
    { label: "Costed Items", value: costedItems.toLocaleString(), icon: Database, tone: "bg-[#f0eefb] text-indigo-700" },
  ];

  const navItems = [
    { label: "Home", icon: Home, onOpen: null, active: true },
    { label: "Engineering", icon: BarChart3, onOpen: onOpenMenuEngineering },
    { label: "Rotations", icon: CalendarRange, onOpen: onOpenNeighborhoodRotations },
    { label: "Compliance", icon: ShieldCheck, onOpen: onOpenLadleCompliance },
  ];

  return (
    <div className="mobile-app-shell md:hidden">
      <header className="mobile-app-header">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CompassOneLogo compact />
            <div className="mt-3">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#b99b55]">Culinary Tools</p>
              <h1 className="mt-1 text-[30px] font-black leading-none text-slate-950">Culinary Tools</h1>
              <p className="mt-2 text-sm font-semibold text-slate-500">Plan, price, and audit menus</p>
            </div>
          </div>
          <PlatformSettings onOpenSmartsheetHealth={onOpenSmartsheetHealth} label={<Settings size={18} />} />
        </div>
      </header>

      <main className="mobile-app-content">
        <section className="mobile-kpi-grid" aria-label="Platform summary">
          {metricTiles.map((tile) => (
            <MobileMetricTile key={tile.label} {...tile} />
          ))}
        </section>

        <section className="mobile-smart-read">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700">Smart Read</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                {allergenCoverage}% allergen coverage, {detailCoverage}% description coverage, average priced item food cost at {pct(avgFoodCost)}.
              </p>
            </div>
            <div className="mobile-smart-icon">
              <Sparkles size={19} />
            </div>
          </div>
        </section>

        <section className="space-y-3" aria-label="Tools">
          {tools.map((tool) => (
            <MobileToolCard key={tool.title} {...tool} />
          ))}
        </section>

        <section className="mobile-data-stack" aria-label="Platform intelligence">
          <MobileDataPanel icon={Database} eyebrow="Trust Layer" title="Data Confidence">
            <MobileProgressRow label="Recipe cost" value={costCoverage} tone="emerald" />
            <MobileProgressRow label="Price-required" value={priceCoverage} tone="sky" />
            <MobileProgressRow label="Allergens" value={allergenCoverage} tone="amber" />
            <MobileProgressRow label="Descriptions" value={detailCoverage} tone="indigo" />
          </MobileDataPanel>

          <MobileDataPanel icon={PieChart} eyebrow="Menu Intelligence" title="Diet Mix">
            <div className="grid grid-cols-3 gap-2">
              {["Vegan", "Vegetarian", "Regular"].map((label) => (
                <div key={label} className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-center">
                  <p className="text-lg font-black text-slate-950">{(dietCounts[label] || 0).toLocaleString()}</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-[0.08em] text-slate-500">{label}</p>
                </div>
              ))}
            </div>
          </MobileDataPanel>

          <MobileDataPanel icon={BarChart3} eyebrow="Usage Signal" title="Weekly Traffic">
            <WeeklyTrafficChart traffic={weeklyTraffic} compact />
          </MobileDataPanel>

          <MobileDataPanel icon={ListChecks} eyebrow="Newest Data Signal" title="Recently Added">
            <div className="space-y-2">
              {recentItems.slice(0, 4).map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-950">{item.item}</p>
                    <p className="truncate text-[11px] font-semibold text-slate-500">{item.menu}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-white px-2 py-1 text-[11px] font-black text-slate-600">
                    {item.price == null ? "Comp" : money(item.price)}
                  </span>
                </div>
              ))}
            </div>
          </MobileDataPanel>

          <MobileDataPanel icon={Sparkles} eyebrow="Release Signal" title="Changelog">
            <div className="mb-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-sm font-black text-slate-950">{CHANGELOG_ENTRIES.length.toLocaleString()} total logged changes</p>
            </div>
            <div className="space-y-2">
              {firstTenChangelogItems.slice(0, 4).map((item, index) => (
                <div key={`${item.text}-${index}`} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                  <p className="line-clamp-2 text-xs font-bold leading-5 text-slate-700">{item.text}</p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">{item.date}</p>
                    <span className="rounded-full bg-white px-2 py-1 text-[10px] font-black text-slate-500">#{CHANGELOG_ENTRIES.length - index}</span>
                  </div>
                </div>
              ))}
            </div>
          </MobileDataPanel>
        </section>
      </main>

      <nav className="mobile-bottom-nav" aria-label="Mobile tools navigation">
        {navItems.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={item.onOpen || undefined}
            className={item.active ? "active" : ""}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

function MobileDataPanel({ icon: Icon, eyebrow, title, children }) {
  return (
    <section className="mobile-data-panel">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{eyebrow}</p>
          <h2 className="mt-1 text-lg font-black text-slate-950">{title}</h2>
        </div>
        <div className="mobile-data-icon">
          <Icon size={18} />
        </div>
      </div>
      {children}
    </section>
  );
}

function MobileProgressRow({ label, value, tone }) {
  const fill = {
    emerald: "bg-emerald-500",
    sky: "bg-sky-500",
    amber: "bg-amber-400",
    indigo: "bg-indigo-500",
  }[tone] || "bg-emerald-500";

  return (
    <div className="mb-3 last:mb-0">
      <div className="flex items-center justify-between gap-3 text-xs">
        <p className="font-black text-slate-700">{label}</p>
        <p className="font-black text-slate-950">{value}%</p>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${fill}`} style={{ width: `${Math.max(4, value)}%` }} />
      </div>
    </div>
  );
}

function MobileMetricTile({ label, value, icon: Icon, tone }) {
  return (
    <article className="mobile-kpi-tile">
      <div className={`mobile-kpi-icon ${tone}`}>
        <Icon size={18} />
      </div>
      <p className="mt-4 text-[12px] font-black uppercase tracking-[0.1em] text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-black text-slate-950">{value}</p>
    </article>
  );
}

function MobileToolCard({ title, eyebrow, description, action, onOpen, icon: Icon, tone, meta }) {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    sky: "bg-sky-50 text-sky-700 border-sky-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    lime: "bg-lime-50 text-lime-700 border-lime-100",
  };
  const chipLabels = {
    "Menu Engineering": "Live",
    "Neighborhood Rotations": "Live",
    "Ladle Compliance": "Test concept",
    "Lean Tool": "New",
  };

  return (
    <button type="button" onClick={onOpen} className="mobile-tool-card">
      <div className={`mobile-tool-icon ${tones[tone]}`}>
        <Icon size={21} />
      </div>
      <div className="min-w-0 flex-1 text-left">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{meta}</p>
            <h2 className="mt-1 truncate text-lg font-black text-slate-950">{title}</h2>
          </div>
          <span className="mobile-status-chip">{chipLabels[title] || eyebrow}</span>
        </div>
        <p className="mt-2 line-clamp-2 text-sm font-semibold leading-5 text-slate-500">{description}</p>
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-sm font-black text-slate-950">
          <span>{action}</span>
          <ArrowRight size={18} />
        </div>
      </div>
    </button>
  );
}

function WeeklyTrafficChart({ traffic, compact = false }) {
  const days = traffic?.days?.length ? traffic.days : WEEKLY_TRAFFIC_DAYS;
  const connectedDays = days.filter((day) => typeof day.visitors === "number");
  const hasTrafficData = traffic?.status === "live" && connectedDays.length > 0;
  const totalVisitors = connectedDays.reduce((sum, day) => sum + day.visitors, 0);
  const maxVisitors = Math.max(...connectedDays.map((day) => day.visitors), 0);
  const statusLabel = hasTrafficData ? "Live" : traffic?.status === "loading" ? "Connecting" : "Needs data";
  const statusClass = hasTrafficData
    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
    : "border-amber-200 bg-amber-50 text-amber-900";
  const graphValues = days.map((day) => hasTrafficData ? Number(day.visitors || 0) : Number(day.placeholderLevel || 24));
  const graphMax = Math.max(...graphValues, 1);
  const graphPoints = graphValues.map((value, index) => {
    const x = 6 + (index * 88) / Math.max(days.length - 1, 1);
    const y = 86 - (value / graphMax) * 66;
    return { x, y, value };
  });
  const linePoints = graphPoints.map((point) => `${point.x},${point.y}`).join(" ");
  const areaPoints = graphPoints.length
    ? `6,92 ${linePoints} 94,92`
    : "";

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Visitors this week</p>
          <p className="mt-1 text-4xl font-black tracking-normal text-slate-950">
            {hasTrafficData ? totalVisitors.toLocaleString() : "--"}
          </p>
        </div>
        <span className={`w-fit rounded-full border px-3 py-1 text-xs font-black ${statusClass}`}>
          {statusLabel}
        </span>
      </div>

      <div className={`relative mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 px-3 pb-3 pt-4 shadow-inner ${compact ? "h-40" : "h-52"}`}>
        <svg className="h-[calc(100%-2.5rem)] w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Visitors by day this week">
          <line x1="4" x2="96" y1="20" y2="20" stroke="#e2e8f0" strokeWidth="0.6" strokeDasharray="2 2" />
          <line x1="4" x2="96" y1="53" y2="53" stroke="#e2e8f0" strokeWidth="0.6" strokeDasharray="2 2" />
          <line x1="4" x2="96" y1="86" y2="86" stroke="#cbd5e1" strokeWidth="0.8" />
          {areaPoints && (
            <polygon
              points={areaPoints}
              fill={hasTrafficData ? "rgba(16, 185, 129, 0.16)" : "rgba(148, 163, 184, 0.14)"}
            />
          )}
          <polyline
            points={linePoints}
            fill="none"
            stroke={hasTrafficData ? "#0f766e" : "#94a3b8"}
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          {graphPoints.map((point, index) => (
            <circle
              key={`${days[index]?.day}-${index}`}
              cx={point.x}
              cy={point.y}
              r="2.5"
              fill={hasTrafficData ? "#10b981" : "#cbd5e1"}
              stroke="#ffffff"
              strokeWidth="1.2"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => (
            <div key={day.day} className="min-w-0 text-center">
              <span className="block text-[10px] font-black uppercase tracking-[0.08em] text-slate-500">{day.day}</span>
              {hasTrafficData && <span className="mt-0.5 block text-[10px] font-black text-slate-900">{Number(day.visitors || 0).toLocaleString()}</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <p className="text-sm font-bold text-slate-950">
          {hasTrafficData ? "Secure endpoint connected" : traffic?.status === "loading" ? "Connecting traffic endpoint" : "Traffic endpoint needs attention"}
        </p>
        <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
          {traffic?.message || "Anonymous weekly visitor totals will appear here after the endpoint responds."}
        </p>
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-slate-950">{value}</p>
    </div>
  );
}

function DashboardPanel({ icon: Icon, eyebrow, title, children }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{eyebrow}</p>
          <h2 className="mt-1 text-2xl font-bold tracking-normal">{title}</h2>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-emerald-700">
          <Icon size={20} />
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function DietDonut({ counts, total }) {
  const vegan = counts.Vegan || 0;
  const vegetarian = counts.Vegetarian || 0;
  const regular = counts.Regular || 0;
  const veganDeg = total ? (vegan / total) * 360 : 0;
  const vegetarianDeg = total ? (vegetarian / total) * 360 : 0;
  const donut = {
    background: `conic-gradient(#16a34a 0deg ${veganDeg}deg, #84cc16 ${veganDeg}deg ${veganDeg + vegetarianDeg}deg, #64748b ${veganDeg + vegetarianDeg}deg 360deg)`,
  };

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-[220px_1fr] md:items-center">
      <div className="relative mx-auto h-48 w-48 rounded-full shadow-inner" style={donut}>
        <div className="absolute inset-8 flex flex-col items-center justify-center rounded-full bg-white text-center">
          <p className="text-3xl font-black text-slate-950">{total.toLocaleString()}</p>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">items</p>
        </div>
      </div>
      <div className="space-y-3">
        <LegendRow color="bg-emerald-600" label="Vegan" value={vegan} total={total} />
        <LegendRow color="bg-lime-500" label="Vegetarian" value={vegetarian} total={total} />
        <LegendRow color="bg-slate-500" label="Regular" value={regular} total={total} />
      </div>
    </div>
  );
}

function LegendRow({ color, label, value, total }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={`h-3 w-3 rounded-full ${color}`} />
          <p className="text-sm font-bold text-slate-900">{label}</p>
        </div>
        <p className="text-sm font-black text-slate-950">{value.toLocaleString()}</p>
      </div>
      <p className="mt-1 text-xs font-semibold text-slate-500">{percentOf(value, total)}% of indexed items</p>
    </div>
  );
}

function ConfidenceBars({ rows }) {
  return (
    <div className="space-y-3">
      {rows.map(([label, value, detail]) => {
        const tone = value >= 80 ? "bg-emerald-500" : value >= 60 ? "bg-sky-500" : "bg-amber-500";
        return (
          <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-slate-950">{label}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">{detail}</p>
              </div>
              <p className="text-lg font-black text-slate-950">{value}%</p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
              <div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.max(4, value)}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SignalStack({ rows }) {
  const toneClass = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-900",
    sky: "border-sky-200 bg-sky-50 text-sky-900",
    lime: "border-lime-200 bg-lime-50 text-lime-900",
  };
  const fillClass = {
    emerald: "bg-emerald-500",
    sky: "bg-sky-500",
    lime: "bg-lime-500",
  };
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.label} className={`rounded-lg border p-4 ${toneClass[row.tone] || toneClass.emerald}`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-black">{row.label}</p>
              <p className="mt-1 text-xs font-semibold opacity-75">{row.detail}</p>
            </div>
            <span className="rounded-full border border-white/70 bg-white/70 px-3 py-1 text-xs font-black">{row.value}%</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/70">
            <div className={`h-full rounded-full ${fillClass[row.tone] || fillClass.emerald}`} style={{ width: `${row.value}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function CategoryBars({ counts, total }) {
  const rows = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7);

  return (
    <div className="space-y-3">
      {rows.map(([category, count]) => {
        const percent = percentOf(count, total);
        return (
          <div key={category}>
            <div className="flex items-center justify-between gap-3 text-sm">
              <p className="font-bold capitalize text-slate-900">{category}</p>
              <p className="font-black text-slate-600">{count.toLocaleString()} / {percent}%</p>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-sky-500" style={{ width: `${Math.max(4, percent)}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ToolCard({ title, eyebrow, description, action, onOpen, icon: Icon, tone, meta }) {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-800 border-emerald-200",
    sky: "bg-sky-50 text-sky-800 border-sky-200",
    amber: "bg-amber-50 text-amber-900 border-amber-200",
    lime: "bg-lime-50 text-lime-900 border-lime-200"
  };

  return (
    <article className="flex min-h-[360px] flex-col justify-between rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className={`flex h-11 w-11 items-center justify-center rounded-lg border ${tones[tone]}`}>
            <Icon size={21} />
          </div>
          <span className={`rounded-full border px-3 py-1 text-xs font-bold ${tones[tone]}`}>{eyebrow}</span>
        </div>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{meta}</p>
        <h2 className="mt-2 text-2xl font-bold tracking-normal">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
      </div>
      <button
        onClick={onOpen}
        className="mt-6 inline-flex w-full items-center justify-between rounded-lg bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
      >
        {action}
        <ArrowRight size={18} />
      </button>
    </article>
  );
}
