import React, { useEffect, useMemo, useState } from "react";
import { ArrowRight, BarChart3, BookOpen, CalendarRange, ClipboardCheck, Database, FolderKanban, Home, ListChecks, PieChart, Settings, ShieldCheck, Smartphone, Sparkles, TrendingUp, Utensils, Wrench } from "lucide-react";

import CHANGELOG_TEXT from "../../CHANGELOG.md?raw";
import DASHBOARD_SUMMARY from "../data/dashboardSummary.json";
import CompassOneLogo from "../shared/ui/CompassOneLogo.jsx";
import PlatformSettings from "../shared/ui/PlatformSettings.jsx";
import VersionStamp from "../shared/ui/VersionStamp.jsx";
import { money } from "../shared/formatting.js";

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

const VISITOR_STORAGE_KEY = "culinaryToolsAnonymousVisitorId";

function getAnonymousVisitorId() {
  if (typeof window === "undefined") return "server-render";
  const existing = window.localStorage.getItem(VISITOR_STORAGE_KEY);
  if (existing) return existing;
  const generated = `visitor-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  window.localStorage.setItem(VISITOR_STORAGE_KEY, generated);
  return generated;
}

const percentOf = (value, total) => total ? Math.round((value / total) * 100) : 0;

const PROTEIN_PATTERN = /\b(beef|chicken|pork|turkey|salmon|fish|cod|shrimp|tuna|meatballs?|steak|brisket|carnitas|chorizo|bacon|sausage|eggs?|tofu|tempeh|paneer|lentils?|beans?|chickpeas?|falafel|poultry|ham|lamb)\b/i;
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

function buildTrustGapRows(items) {
  const priceRequiredItems = items.filter((item) => !isComplimentaryItem(item));
  const priceGapRows = priceRequiredItems
    .filter((item) => !(item.price != null && item.price > 0))
    .map((item) => ({ ...item, gapType: hasProteinSignal(item) ? "Protein price gap" : "Price-required gap" }));

  return [
    ...priceGapRows,
    ...items.filter((item) => item.trueCost == null).map((item) => ({ ...item, gapType: "Missing true cost" })),
    ...items.filter((item) => !(item.allergens?.length || item.allergenSummary)).map((item) => ({ ...item, gapType: "Missing allergen detail" })),
    ...items.filter((item) => !(item.enticingDescription || item.ingredientsCommonName)).map((item) => ({ ...item, gapType: "Missing description" })),
  ];
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

export default function LandingPage({ onOpenMenuEngineering, onOpenNeighborhoodRotations, onOpenRecipeDatabase, onOpenMenuProjects, onOpenMenuAuditTool, onOpenLadleCompliance, onOpenLeanTool, onOpenSmartsheetHealth }) {
  const {
    totalItems,
    menuCount,
    costedItems,
    complimentaryItems: complimentaryItemCount,
    priceRequiredItems: priceRequiredItemCount,
    pricedRequiredItems: pricedRequiredItemCount,
    proteinPriceGaps: proteinPriceGapCount,
    allergenCoverage,
    detailCoverage,
    costCoverage,
    priceCoverage,
    dietCounts,
    categoryCounts,
    recentItems,
    topMenus,
  } = DASHBOARD_SUMMARY;

  const handleDownloadTrustLayerGapList = async () => {
    const response = await fetch("/api/recipe-library?scope=all");
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.ok) {
      throw new Error(payload?.message || "Unable to load Recipe Library rows for the trust action CSV.");
    }
    downloadTrustLayerGapList(buildTrustGapRows(payload.rows || []));
  };

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
      title: "Recipe Library",
      eyebrow: "New",
      description: "Open menu item library cards with costs, calories, protein, allergens, descriptions, and future recipe files.",
      action: "Open Library",
      onOpen: onOpenRecipeDatabase,
      icon: BookOpen,
      tone: "indigo",
      meta: "Item library"
    },
    {
      title: "Menu Projects",
      eyebrow: "New",
      description: "Track concept briefs, approvals, files, SSMT programming, Centric handoffs, blockers, and launch deadlines.",
      action: "Open Projects",
      onOpen: onOpenMenuProjects,
      icon: FolderKanban,
      tone: "violet",
      meta: "Launch pipeline"
    },
    {
      title: "Menu Audit Tool",
      eyebrow: "Phase 1",
      description: "Compare Master App Data, SSMT rows, and Centric Brand Reports with exact MRN preservation.",
      action: "Open Audit",
      onOpen: onOpenMenuAuditTool,
      icon: ClipboardCheck,
      tone: "sky",
      meta: "IT menu audit"
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
        dietCounts={dietCounts}
        categoryCounts={categoryCounts}
        recentItems={recentItems}
        onOpenMenuEngineering={onOpenMenuEngineering}
        onOpenNeighborhoodRotations={onOpenNeighborhoodRotations}
        onOpenRecipeDatabase={onOpenRecipeDatabase}
        onOpenMenuProjects={onOpenMenuProjects}
        onOpenMenuAuditTool={onOpenMenuAuditTool}
        onOpenLadleCompliance={onOpenLadleCompliance}
        onOpenLeanTool={onOpenLeanTool}
        onOpenSmartsheetHealth={onOpenSmartsheetHealth}
      />

      <div className="mx-auto hidden w-full max-w-[110rem] flex-col gap-5 px-5 py-5 md:flex md:px-8">
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

        <main className="grid grid-cols-1 gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Operations Console</p>
            <h2 className="mt-2 text-3xl font-bold">Plan, price, and audit menus from one workspace.</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Built for quick chef decisions: choose the workstream, check status, and move straight into the active tool.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Metric label="Tools" value="7" />
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
            <section className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
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
              <WeeklyTrafficChart days={WEEKLY_TRAFFIC_DAYS} />
            </DashboardPanel>

            <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
              <DashboardPanel icon={Database} eyebrow="Trust Layer" title="Data Confidence">
                <ConfidenceBars
                  rows={[
                    ["Recipe cost coverage", costCoverage, `${costedItems.toLocaleString()} rows with true cost`],
                    ["Price-required coverage", priceCoverage, `${pricedRequiredItemCount.toLocaleString()} of ${priceRequiredItemCount.toLocaleString()} required items priced`],
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
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1">{complimentaryItemCount.toLocaleString()} complimentary rows</span>
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-900">{proteinPriceGapCount.toLocaleString()} protein price gaps</span>
                  </div>
                  <button onClick={handleDownloadTrustLayerGapList} className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-800 hover:bg-slate-100">
                    Download trust action CSV
                  </button>
                </div>
              </DashboardPanel>

              <DashboardPanel icon={Sparkles} eyebrow="Executive Signal" title="Operational Read">
                <SignalStack
                  rows={[
                    { label: "Menu data trust is actively tracked", value: costCoverage, tone: "emerald", detail: `${costedItems.toLocaleString()} of ${totalItems.toLocaleString()} item rows have true cost.` },
                    { label: "Price-required items are separated", value: priceCoverage, tone: "sky", detail: `${pricedRequiredItemCount.toLocaleString()} of ${priceRequiredItemCount.toLocaleString()} required rows have a positive price.` },
                    { label: "Chef-facing detail is loaded", value: Math.round((detailCoverage + allergenCoverage) / 2), tone: "lime", detail: `${detailCoverage}% descriptions and ${allergenCoverage}% allergen coverage.` },
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
  dietCounts,
  categoryCounts,
  recentItems,
  onOpenMenuEngineering,
  onOpenNeighborhoodRotations,
  onOpenRecipeDatabase,
  onOpenMenuProjects,
  onOpenMenuAuditTool,
  onOpenLadleCompliance,
  onOpenLeanTool,
  onOpenSmartsheetHealth,
}) {
  const metricTiles = [
    { label: "Tools", value: "7", icon: Wrench, tone: "bg-[#fff7e7] text-[#8a621b]" },
    { label: "Menu Items", value: totalItems.toLocaleString(), icon: Utensils, tone: "bg-[#eaf8f2] text-emerald-700" },
    { label: "Menus", value: menuCount, icon: ListChecks, tone: "bg-[#edf5ff] text-sky-700" },
    { label: "Costed Items", value: costedItems.toLocaleString(), icon: Database, tone: "bg-[#f0eefb] text-indigo-700" },
  ];

  const navItems = [
    { label: "Home", icon: Home, onOpen: null, active: true },
    { label: "Engineering", icon: BarChart3, onOpen: onOpenMenuEngineering },
    { label: "Library", icon: BookOpen, onOpen: onOpenRecipeDatabase },
    { label: "Projects", icon: FolderKanban, onOpen: onOpenMenuProjects },
    { label: "Rotations", icon: CalendarRange, onOpen: onOpenNeighborhoodRotations },
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
            <WeeklyTrafficChart days={WEEKLY_TRAFFIC_DAYS} compact />
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
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-100",
    violet: "bg-violet-50 text-violet-700 border-violet-100",
    lime: "bg-lime-50 text-lime-700 border-lime-100",
  };
  const chipLabels = {
    "Menu Engineering": "Live",
    "Neighborhood Rotations": "Live",
    "Recipe Library": "New",
    "Menu Projects": "New",
    "Menu Audit Tool": "Phase 1",
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

function WeeklyTrafficChart({ days, compact = false }) {
  const [traffic, setTraffic] = useState({
    status: "loading",
    days,
    totalVisitors: null,
    message: "Connecting to secure endpoint...",
  });

  useEffect(() => {
    const controller = new AbortController();
    const loadTraffic = async () => {
      try {
        const response = await fetch("/api/traffic/weekly", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            visitorId: getAnonymousVisitorId(),
            path: typeof window === "undefined" ? "/" : `${window.location.pathname}${window.location.search}`,
          }),
          signal: controller.signal,
        });
        const payload = await response.json();
        if (!response.ok || !payload.ok) throw new Error(payload.message || "Traffic endpoint unavailable");
        const endpointDays = Array.isArray(payload.days) && payload.days.length ? payload.days : days;
        setTraffic({
          status: "live",
          days: endpointDays,
          totalVisitors: Number(payload.totalVisitors ?? endpointDays.reduce((sum, day) => sum + (Number(day.visitors) || 0), 0)),
          message: "Secure endpoint connected",
        });
      } catch (error) {
        if (error.name === "AbortError") return;
        setTraffic({
          status: "error",
          days,
          totalVisitors: null,
          message: error instanceof Error ? error.message : "Traffic endpoint unavailable",
        });
      }
    };

    loadTraffic();
    return () => controller.abort();
  }, [days]);

  const chart = useMemo(() => {
    const chartDays = traffic.days.map((day, index) => ({
      ...day,
      day: day.day || WEEKLY_TRAFFIC_DAYS[index]?.day || "",
      visitors: typeof day.visitors === "number" ? day.visitors : null,
    }));
    const connectedDays = chartDays.filter((day) => typeof day.visitors === "number");
    const hasTrafficData = connectedDays.length > 0;
    const totalVisitors = traffic.totalVisitors ?? connectedDays.reduce((sum, day) => sum + day.visitors, 0);
    const maxVisitors = Math.max(1, ...connectedDays.map((day) => day.visitors || 0));
    const width = 720;
    const height = compact ? 168 : 220;
    const left = 42;
    const right = 26;
    const top = 30;
    const bottom = 46;
    const plotWidth = width - left - right;
    const plotHeight = height - top - bottom;
    const points = chartDays.map((day, index) => {
      const x = left + (plotWidth / Math.max(1, chartDays.length - 1)) * index;
      const value = typeof day.visitors === "number" ? day.visitors : 0;
      const y = top + (1 - value / maxVisitors) * plotHeight;
      return { ...day, x, y, value };
    });
    const linePoints = points.map((point) => `${point.x},${point.y}`).join(" ");
    const areaPoints = `${points[0]?.x || left},${height - bottom} ${linePoints} ${points[points.length - 1]?.x || width - right},${height - bottom}`;

    return { chartDays, hasTrafficData, totalVisitors, width, height, left, right, top, bottom, points, linePoints, areaPoints };
  }, [compact, traffic]);

  const statusLabel = traffic.status === "live" ? "Live" : traffic.status === "loading" ? "Connecting" : "Needs data";
  const statusClass = traffic.status === "live"
    ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200"
    : traffic.status === "loading"
      ? "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-500/40 dark:bg-sky-500/10 dark:text-sky-200"
      : "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200";

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-black text-slate-500 dark:text-slate-300">Visitors this week</p>
          <p className="mt-1 text-4xl font-black text-slate-950 dark:text-white">
            {chart.hasTrafficData ? chart.totalVisitors.toLocaleString() : "--"}
          </p>
        </div>
        <span className={`w-fit rounded-full border px-3 py-1 text-xs font-black ${statusClass}`}>
          {statusLabel}
        </span>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-inner dark:border-slate-700 dark:bg-slate-950/50">
        <svg viewBox={`0 0 ${chart.width} ${chart.height}`} className="h-auto w-full" role="img" aria-label="Weekly visitor line chart">
          {[0.25, 0.5, 0.75].map((ratio) => {
            const y = chart.top + (chart.height - chart.top - chart.bottom) * ratio;
            return <line key={ratio} x1={chart.left} x2={chart.width - chart.right} y1={y} y2={y} stroke="currentColor" strokeDasharray="12 18" className="text-slate-200 dark:text-slate-700" />;
          })}
          <line x1={chart.left} x2={chart.width - chart.right} y1={chart.height - chart.bottom} y2={chart.height - chart.bottom} stroke="currentColor" className="text-slate-200 dark:text-slate-700" />
          {chart.hasTrafficData && (
            <>
              <polygon points={chart.areaPoints} fill="url(#trafficGradient)" />
              <polyline points={chart.linePoints} fill="none" stroke="#0f8f7f" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </>
          )}
          <defs>
            <linearGradient id="trafficGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.24" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.04" />
            </linearGradient>
          </defs>
          {chart.points.map((point) => (
            <g key={point.day}>
              <circle cx={point.x} cy={point.y} r="8" fill="#10b981" stroke="white" strokeWidth="4" className="dark:stroke-slate-950" />
              {point.value > 0 && (
                <g>
                  <rect x={point.x - 25} y={Math.max(2, point.y - 36)} width="50" height="24" rx="12" fill="#ecfdf5" stroke="#99f6e4" className="dark:fill-emerald-500/15 dark:stroke-emerald-400/40" />
                  <text x={point.x} y={Math.max(18, point.y - 19)} textAnchor="middle" className="fill-slate-950 text-[16px] font-black dark:fill-white">{point.value.toLocaleString()}</text>
                </g>
              )}
              <text x={point.x} y={chart.height - 18} textAnchor="middle" className="fill-slate-500 text-[12px] font-black uppercase tracking-wide dark:fill-slate-300">{point.day}</text>
              <text x={point.x} y={chart.height - 3} textAnchor="middle" className="fill-slate-950 text-[12px] font-black dark:fill-white">{point.value.toLocaleString()}</text>
            </g>
          ))}
        </svg>
      </div>

      <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900">
        <p className="text-sm font-bold text-slate-950 dark:text-white">{traffic.message}</p>
        <p className="mt-1 text-xs font-semibold leading-5 text-slate-500 dark:text-slate-300">
          Anonymous weekly visitors are counted through the secure app endpoint.
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
    indigo: "bg-indigo-50 text-indigo-800 border-indigo-200",
    violet: "bg-violet-50 text-violet-800 border-violet-200",
    lime: "bg-lime-50 text-lime-900 border-lime-200"
  };

  return (
    <article className="flex min-h-[292px] flex-col justify-between rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
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
