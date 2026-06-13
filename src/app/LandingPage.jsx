import React from "react";
import { ArrowRight, BarChart3, CalendarRange, ClipboardCheck, Database, ListChecks, PieChart, Smartphone, Sparkles, TrendingUp } from "lucide-react";

import CHANGELOG_TEXT from "../../CHANGELOG.md?raw";
import MENUWORKS_ITEMS from "../data/menuItems.json";
import CompassOneLogo from "../shared/ui/CompassOneLogo.jsx";
import VersionStamp from "../shared/ui/VersionStamp.jsx";
import { money, pct } from "../shared/formatting.js";

const getDietType = (item) => {
  const vegan = String(item.veganTag || item.dietTags || "").toLowerCase().includes("vegan");
  const vegetarian = String(item.vegetarianTag || item.dietTags || "").toLowerCase().includes("vegetarian");
  if (vegan) return "Vegan";
  if (vegetarian) return "Vegetarian";
  return "Regular";
};

const firstTenChangelogItems = CHANGELOG_TEXT
  .split("\n")
  .filter((line) => line.startsWith("- "))
  .slice(0, 10)
  .map((line) => line.replace(/^- /, ""));

const countBy = (rows, getKey) =>
  rows.reduce((acc, row) => {
    const key = getKey(row) || "Unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

const percentOf = (value, total) => total ? Math.round((value / total) * 100) : 0;

export default function LandingPage({ onOpenMenuEngineering, onOpenNeighborhoodRotations, onOpenLadleCompliance, onOpenLeanTool }) {
  const totalItems = MENUWORKS_ITEMS.length;
  const menuCount = new Set(MENUWORKS_ITEMS.map((item) => item.menu).filter(Boolean)).size;
  const costedItems = MENUWORKS_ITEMS.filter((item) => item.trueCost != null).length;
  const pricedItems = MENUWORKS_ITEMS.filter((item) => item.price != null && item.trueCost != null).length;
  const avgFoodCost = pricedItems
    ? MENUWORKS_ITEMS.filter((item) => item.price && item.trueCost != null).reduce((sum, item) => sum + (item.trueCost / item.price), 0) / pricedItems
    : null;
  const dietCounts = countBy(MENUWORKS_ITEMS, getDietType);
  const categoryCounts = countBy(MENUWORKS_ITEMS, (item) => item.category || "Unclassified");
  const allergenCoverage = percentOf(MENUWORKS_ITEMS.filter((item) => item.allergens?.length || item.allergenSummary).length, totalItems);
  const detailCoverage = percentOf(MENUWORKS_ITEMS.filter((item) => item.enticingDescription || item.ingredientsCommonName).length, totalItems);
  const costCoverage = percentOf(MENUWORKS_ITEMS.filter((item) => item.trueCost != null).length, totalItems);
  const priceCoverage = percentOf(MENUWORKS_ITEMS.filter((item) => item.price != null).length, totalItems);
  const recentItems = [...MENUWORKS_ITEMS].sort((a, b) => Number(b.id || 0) - Number(a.id || 0)).slice(0, 10);
  const topMenus = Object.entries(countBy(MENUWORKS_ITEMS, (item) => item.menu))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

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
      eyebrow: "In development",
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
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 md:px-6">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div>
              <CompassOneLogo />
              <h1 className="text-2xl font-bold tracking-normal md:text-3xl">Culinary Tools Platform</h1>
            </div>
          </div>
          <VersionStamp />
        </header>

        <main className="grid grid-cols-1 gap-5 xl:grid-cols-[340px_1fr]">
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
            <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-emerald-950">
                <Sparkles size={16} />
                Smart read
              </div>
              <p className="mt-2 text-sm leading-6 text-emerald-900">
                {allergenCoverage}% allergen coverage, {detailCoverage}% description coverage, and average priced item food cost at {pct(avgFoodCost)}.
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

            <section className="grid grid-cols-1 gap-4 xl:grid-cols-[0.9fr_1.1fr]">
              <DashboardPanel icon={Database} eyebrow="Trust Layer" title="Data Confidence">
                <ConfidenceBars
                  rows={[
                    ["True cost coverage", costCoverage, `${costedItems.toLocaleString()} costed rows`],
                    ["Price coverage", priceCoverage, `${MENUWORKS_ITEMS.filter((item) => item.price != null).length.toLocaleString()} priced rows`],
                    ["Allergen coverage", allergenCoverage, "item safety detail signal"],
                    ["Description coverage", detailCoverage, "chef-facing detail signal"],
                  ]}
                />
              </DashboardPanel>

              <DashboardPanel icon={Sparkles} eyebrow="Executive Signal" title="Operational Read">
                <SignalStack
                  rows={[
                    { label: "Menu truth is the strongest data layer", value: costCoverage, tone: "emerald", detail: "Menu Engineering can carry the most credible story right now." },
                    { label: "Rotation planning is ready for workflow adoption", value: 72, tone: "sky", detail: "Submission health, cost ranges, and station completion are now visible." },
                    { label: "Lean result history is becoming auditable", value: 64, tone: "lime", detail: "Stored results, Smartsheet sync, and void controls are in place." },
                  ]}
                />
              </DashboardPanel>
            </section>

            <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1fr]">
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
                  {firstTenChangelogItems.map((item, index) => (
                    <div key={`${item}-${index}`} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <p className="text-sm font-semibold leading-5 text-slate-700">{item}</p>
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
    background: `conic-gradient(#16a34a 0deg ${veganDeg}deg, #84cc16 ${veganDeg}deg ${veganDeg + vegetarianDeg}deg, #0f172a ${veganDeg + vegetarianDeg}deg 360deg)`,
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
        <LegendRow color="bg-slate-950" label="Regular" value={regular} total={total} />
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
