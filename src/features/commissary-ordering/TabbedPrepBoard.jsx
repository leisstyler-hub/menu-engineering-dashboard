import React, { useEffect, useMemo, useState } from "react";
import { Boxes, Factory, PackageCheck } from "lucide-react";

import { COMMISSARY_STATION_ORDER, PRODUCTION_SECTION_ORDER, buildTabbedPrepBoard, weekLabel } from "./commissaryModel.js";
import { PrepCheck } from "./PrepListView.jsx";

const PHASES = Object.freeze([
  { key: "production", label: "Production", icon: Factory, description: "Consolidated prep shared across every station." },
  { key: "assembly", label: "Assembly", icon: Boxes, description: "Build finished components from completed production work." },
  { key: "packout", label: "Pack Out", icon: PackageCheck, description: "Pack clean cafe and station allocations for delivery." },
]);

const quantityText = (value) => Number(value).toLocaleString("en-US", { maximumFractionDigits: 2 });
const stationIndex = (station) => {
  const index = COMMISSARY_STATION_ORDER.indexOf(station);
  return index < 0 ? COMMISSARY_STATION_ORDER.length : index;
};

function CafeBreakdown({ cafes = {}, delivery }) {
  const text = Object.entries(cafes)
    .filter(([, values]) => Number(values?.[delivery]) > 0)
    .map(([cafe, values]) => `${cafe} ${quantityText(values[delivery])}`)
    .join(" · ");
  return text ? <p className="mt-1 text-sm font-bold leading-tight text-slate-500">{text}</p> : null;
}

function BoardRow({ row, delivery, checked, disabled, onToggle, productionById, completedIds }) {
  const dependencyIds = row.dependencyIds || [];
  const completeDependencies = dependencyIds.filter((id) => completedIds.has(id)).length;
  const dependencyState = dependencyIds.length === 0 ? "ready" : completeDependencies === dependencyIds.length ? "ready" : completeDependencies > 0 ? "partial" : "waiting";
  const badge = checked
    ? { label: "Complete", style: "bg-sky-100 text-sky-900" }
    : dependencyState === "ready"
      ? { label: "Ready", style: "bg-emerald-100 text-emerald-900" }
      : dependencyState === "partial"
        ? { label: `${completeDependencies}/${dependencyIds.length} inputs ready`, style: "bg-amber-100 text-amber-950" }
        : { label: "Waiting on production", style: "bg-rose-100 text-rose-900" };
  const uses = row.uses || [];
  return (
    <article className={`grid min-h-28 grid-cols-[3.5rem_minmax(0,1fr)] items-center gap-x-4 gap-y-3 px-4 py-4 transition sm:grid-cols-[3.5rem_minmax(0,1fr)_auto] md:px-6 ${checked ? "bg-emerald-50" : "bg-white"}`} data-testid={`prep-board-row-${row.id}`}>
      <PrepCheck checked={checked} disabled={disabled} label={`Touch and hold to change: ${row.name}`} onToggle={onToggle} />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-sky-700">{row.cafe ? `${row.cafe} · ${row.station}` : row.station}</p>
          {row.phase === "assembly" && <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em] ${badge.style}`}>{badge.label}</span>}
        </div>
        <p className={`mt-1 break-words text-lg font-black leading-tight sm:text-xl ${checked ? "text-emerald-900 line-through decoration-2" : "text-slate-950"}`}>{row.name}</p>
        {uses.length > 0 && <p className="mt-1 text-xs font-bold text-slate-500">Used by: {uses.join(" · ")}</p>}
        {dependencyIds.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{dependencyIds.map((id) => {
          const dependency = productionById.get(id);
          const ready = completedIds.has(id);
          return <span key={id} className={`rounded-full border px-2 py-1 text-[11px] font-bold ${ready ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-slate-300 bg-slate-50 text-slate-600"}`}>{ready ? "✓" : "○"} {dependency?.name || "Production input"}</span>;
        })}</div>}
      </div>
      <div className="col-start-2 min-w-0 text-left sm:col-start-3 sm:row-start-1 sm:max-w-[22rem] sm:text-right">
        <p className="flex flex-wrap items-baseline gap-x-1 text-3xl font-black tabular-nums text-slate-950 sm:justify-end">{quantityText(row[delivery])} <span className="text-xl">{row.orderUnit}</span></p>
        <CafeBreakdown cafes={row.cafes} delivery={delivery} />
      </div>
    </article>
  );
}

export default function TabbedPrepBoard({ records, weekStart, hub, completed, saving, onToggle, deliveries }) {
  const [delivery, setDelivery] = useState("friday");
  const [phase, setPhase] = useState("production");
  const [station, setStation] = useState("all");
  const board = useMemo(() => buildTabbedPrepBoard(records, { hub }), [hub, records]);
  const completedIds = useMemo(() => new Set(completed?.[delivery] || []), [completed, delivery]);
  const productionById = useMemo(() => new Map(board.production.map((row) => [row.id, row])), [board.production]);
  const sourceRows = useMemo(() => board[phase].filter((row) => Number(row[delivery]) > 0), [board, delivery, phase]);
  const stations = useMemo(() => [...new Set(sourceRows.flatMap((row) => String(row.station || "").split(";").map((value) => value.trim()).filter(Boolean)))].sort((a, b) => stationIndex(a) - stationIndex(b)), [sourceRows]);
  const rows = useMemo(() => station === "all" ? sourceRows : sourceRows.filter((row) => String(row.station || "").split(";").map((value) => value.trim()).includes(station)), [sourceRows, station]);
  const completedCount = rows.filter((row) => completedIds.has(row.id)).length;

  useEffect(() => {
    if (!deliveries.some(({ key }) => key === delivery)) setDelivery(deliveries[0]?.key || "friday");
  }, [deliveries, delivery]);
  useEffect(() => {
    if (station !== "all" && !stations.includes(station)) setStation("all");
  }, [station, stations]);

  const groupedRows = useMemo(() => {
    if (phase === "production") return PRODUCTION_SECTION_ORDER.flatMap((section) => {
      const items = rows.filter((row) => row.productionType === section);
      return items.length ? [{ label: section, rows: items }] : [];
    });
    if (phase === "assembly") return COMMISSARY_STATION_ORDER.flatMap((stationName) => {
      const items = rows.filter((row) => row.station === stationName);
      return items.length ? [{ label: stationName, rows: items }] : [];
    });
    const groups = new Map();
    rows.forEach((row) => {
      const key = `${row.cafe} · ${row.station}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(row);
    });
    return [...groups].map(([label, items]) => ({ label, rows: items }));
  }, [phase, rows]);

  return (
    <section className="overflow-hidden rounded-2xl border-2 border-violet-300 bg-white shadow-sm" data-testid="tabbed-prep-board">
      <header className="bg-slate-950 px-4 py-5 text-white md:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><div className="flex flex-wrap items-center gap-2"><p className="text-xs font-black uppercase tracking-[0.16em] text-violet-300">Week {weekLabel(weekStart)}</p><span className="rounded-full bg-amber-300 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-950">Draft pilot</span></div><h2 className="mt-1 text-3xl font-black">Tabbed Commissary Board</h2><p className="mt-1 text-sm font-semibold text-slate-300">Production → Assembly → Pack Out. This draft is isolated to January 4–8.</p></div>
          <div className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-right"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Commissary hub</p><p className="text-lg font-black">{hub}</p></div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-1 border-b border-slate-200 bg-slate-100 p-2 sm:grid-cols-3">{deliveries.map((option) => <button key={option.key} type="button" aria-pressed={delivery === option.key} onClick={() => setDelivery(option.key)} className={`min-h-16 rounded-xl px-3 py-2 text-left ${delivery === option.key ? "bg-white shadow-sm ring-2 ring-violet-400" : "text-slate-600"}`}><span className="block text-base font-black">{option.title}</span><span className="block text-xs font-semibold">{option.detail}</span></button>)}</div>

      <nav className="grid grid-cols-3 gap-2 border-b border-slate-200 bg-white p-2" aria-label="Prep board phases">{PHASES.map(({ key, label, icon: Icon, description }) => <button key={key} type="button" aria-pressed={phase === key} onClick={() => { setPhase(key); setStation("all"); }} className={`min-h-20 rounded-xl border px-2 py-3 text-center transition ${phase === key ? "border-violet-700 bg-violet-700 text-white shadow-sm" : "border-slate-200 bg-slate-50 text-slate-700"}`}><Icon className="mx-auto" size={21} /><span className="mt-1 block text-sm font-black">{label}</span><span className={`mt-1 hidden text-[10px] font-semibold leading-tight md:block ${phase === key ? "text-violet-100" : "text-slate-500"}`}>{description}</span></button>)}</nav>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 text-sm font-black md:px-6"><span>{completedCount} / {rows.length} complete</span><span className="text-slate-500">Touch and hold to change</span></div>
      {stations.length > 1 && <nav aria-label="Filter board station" className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-white px-4 py-3 md:px-6">{["all", ...stations].map((stationName) => <button key={stationName} type="button" aria-pressed={station === stationName} onClick={() => setStation(stationName)} className={`min-h-10 whitespace-nowrap rounded-full border px-4 py-2 text-xs font-black ${station === stationName ? "border-slate-950 bg-slate-950 text-white" : "border-slate-300 bg-white text-slate-700"}`}>{stationName === "all" ? "All stations" : stationName}</button>)}</nav>}

      {rows.length === 0 ? <div className="p-10 text-center"><p className="text-xl font-black text-slate-700">No draft work is loaded yet</p><p className="mt-2 text-sm font-semibold text-slate-500">Save January 4–8 cafe orders, then return to this hub board to populate all three phases.</p></div> : <div>{groupedRows.map((group) => <section key={group.label}><div className="border-b border-violet-200 bg-violet-50 px-4 py-3 md:px-6"><p className="text-xs font-black uppercase tracking-[0.16em] text-violet-900">{group.label}</p></div><div className="divide-y divide-slate-200">{group.rows.map((row) => <BoardRow key={row.id} row={row} delivery={delivery} checked={completedIds.has(row.id)} disabled={saving} onToggle={() => onToggle(delivery, row.id)} productionById={productionById} completedIds={completedIds} />)}</div></section>)}</div>}
    </section>
  );
}
