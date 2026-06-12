import React from "react";
import { ArrowRight, BarChart3, CalendarRange, ClipboardCheck, Database, LayoutDashboard } from "lucide-react";

import VersionStamp from "../shared/ui/VersionStamp.jsx";

export default function LandingPage({ onOpenMenuEngineering, onOpenNeighborhoodRotations, onOpenLadleCompliance }) {
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
    }
  ];

  return (
    <div className="min-h-screen bg-[#f6f7f9] text-slate-950">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 md:px-6">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-950 text-white">
              <LayoutDashboard size={22} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Compass culinary systems</p>
              <h1 className="text-2xl font-bold tracking-normal md:text-3xl">Culinary Tools Platform</h1>
            </div>
          </div>
          <VersionStamp />
        </header>

        <main className="grid grid-cols-1 gap-5 xl:grid-cols-[320px_1fr]">
          <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Operations Console</p>
            <h2 className="mt-2 text-3xl font-bold">Plan, price, and audit menus from one workspace.</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Built for quick chef decisions: choose the workstream, check status, and move straight into the active tool.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Metric label="Tools" value="3" />
              <Metric label="Menu items" value="1,325" />
              <Metric label="Menus" value="43" />
              <Metric label="Costed items" value="1,057" />
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

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {tools.map((tool) => (
              <ToolCard key={tool.title} {...tool} />
            ))}
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

function ToolCard({ title, eyebrow, description, action, onOpen, icon: Icon, tone, meta }) {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-800 border-emerald-200",
    sky: "bg-sky-50 text-sky-800 border-sky-200",
    amber: "bg-amber-50 text-amber-900 border-amber-200"
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
