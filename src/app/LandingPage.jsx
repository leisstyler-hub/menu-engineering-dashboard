import React from "react";
import { ClipboardList } from "lucide-react";

import VersionStamp from "../shared/ui/VersionStamp.jsx";

export default function LandingPage({ onOpenMenuEngineering, onOpenNeighborhoodRotations, onOpenLadleCompliance }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="rounded-[2rem] bg-white border border-slate-200 p-6 md:p-10 shadow-2xl">
          <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Compass culinary systems</p>
          <h1 className="text-4xl md:text-6xl font-bold mt-3">Culinary Tools Platform</h1>
          <p className="mt-4 text-slate-600 max-w-3xl text-lg">
            A centralized workspace for culinary analytics, menu strategy, pricing review, and operational tools.
          </p>
          <div className="mt-5"><VersionStamp /></div>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-emerald-700 font-bold">Live</p>
                <h2 className="text-3xl font-bold mt-2">Menu Engineering Dashboard</h2>
                <p className="text-slate-600 mt-3">
                  Analyze MenuWorks price, true cost, food cost %, gross margin, financial fit, and portfolio health across stored menus.
                </p>
              </div>
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-700">
                Live
              </div>
            </div>
            <button
              onClick={onOpenMenuEngineering}
              className="mt-6 rounded-2xl bg-slate-900 text-white px-5 py-3 font-semibold hover:bg-slate-700"
            >
              Open Dashboard
            </button>
          </div>

          <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-amber-700 font-bold">Still in Development</p>
                <h2 className="text-3xl font-bold mt-2">Neighborhood Rotations</h2>
                <p className="text-slate-600 mt-3">
                  A planning tool for weekly café rotations, station LTOs, Fresh $5 selections, and leadership visibility.
                </p>
              </div>
              <div className="rounded-2xl bg-amber-50 border border-amber-200 px-3 py-2 text-xs font-bold text-amber-700">
                Still in Development
              </div>
            </div>
            <button
              onClick={onOpenNeighborhoodRotations}
              className="mt-6 rounded-2xl bg-slate-900 text-white px-5 py-3 font-semibold hover:bg-slate-700"
            >
              Open Rotations
            </button>
          </div>

          <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3 w-fit mb-5">
                  <ClipboardList size={22} className="text-slate-700" />
                </div>
                <p className="text-xs uppercase tracking-[0.18em] text-sky-700 font-bold">Test Concept</p>
                <h2 className="text-3xl font-bold mt-2">Ladle Compliance Dashboard</h2>
                <p className="text-slate-600 mt-3">
                  Track Ladle compliance by district, café, and week with executive summaries, heat-map tiles, and team-facing trends.
                </p>
              </div>
              <div className="rounded-2xl bg-sky-50 border border-sky-200 px-3 py-2 text-xs font-bold text-sky-700">
                Can Delete
              </div>
            </div>
            <button
              onClick={onOpenLadleCompliance}
              className="mt-6 rounded-2xl bg-slate-900 text-white px-5 py-3 font-semibold hover:bg-slate-700"
            >
              Open Ladle Dashboard
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
