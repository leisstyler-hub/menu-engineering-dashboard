import React, { useEffect, useMemo, useRef, useState } from "react";
import { Check, Languages } from "lucide-react";

import { rolledUpPrepItems, weekLabel } from "./commissaryModel.js";
import { DEFAULT_COMMISSARY_METADATA } from "./commissaryMetadata.js";
import {
  commissarySpanishCategory,
  commissarySpanishItem,
  commissarySpanishUnit,
} from "./commissaryTranslations.js";

const HOLD_MS = 600;

function PrepCheck({ checked, disabled, label, onToggle }) {
  const timerRef = useRef(null);
  const pointerTypeRef = useRef("");
  const suppressClickRef = useRef(false);

  const clearTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  };

  useEffect(() => clearTimer, []);

  const startHold = (event) => {
    pointerTypeRef.current = event.pointerType;
    suppressClickRef.current = false;
    if (disabled || event.pointerType === "mouse") return;
    clearTimer();
    timerRef.current = setTimeout(() => {
      suppressClickRef.current = true;
      onToggle();
      if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(20);
    }, HOLD_MS);
  };

  const handleClick = (event) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      event.preventDefault();
      return;
    }
    if (event.detail === 0 || pointerTypeRef.current === "mouse") onToggle();
  };

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={checked}
      disabled={disabled}
      onClick={handleClick}
      onContextMenu={(event) => event.preventDefault()}
      onPointerDown={startHold}
      onPointerUp={clearTimer}
      onPointerCancel={clearTimer}
      onPointerLeave={clearTimer}
      className={`flex h-14 w-14 shrink-0 touch-manipulation items-center justify-center rounded-xl border-2 transition ${checked ? "border-emerald-700 bg-emerald-600 text-white" : "border-slate-300 bg-white text-transparent"} disabled:opacity-50`}
    >
      <Check size={30} strokeWidth={3} />
    </button>
  );
}

const quantityText = (value) => Number(value).toLocaleString("en-US", { maximumFractionDigits: 2 });
const compactUnit = (unit, spanish) => {
  if (unit === "gallon") return "gal";
  if (unit === "quart") return spanish ? "cto" : "qt";
  if (unit === "5-liter container") return "5 L";
  if (unit === "32-ounce bottle") return spanish ? "botella 32 oz" : "32 oz bottle";
  return spanish ? commissarySpanishUnit(unit) : unit;
};

export default function PrepListView({ records, weekStart, hub, hubs = [], onHubChange, completed, saving, onToggle, deliveries = DEFAULT_COMMISSARY_METADATA.deliveries }) {
  const [delivery, setDelivery] = useState(() => deliveries[0]?.key || "friday");
  const [spanish, setSpanish] = useState(false);
  const rows = useMemo(() => rolledUpPrepItems(records, { hub }).filter((row) => Number(row[delivery]) > 0), [delivery, hub, records]);
  const completedIds = new Set(completed?.[delivery] || []);
  const completedCount = rows.filter((row) => completedIds.has(row.id)).length;

  useEffect(() => {
    if (!deliveries.some(({ key }) => key === delivery)) setDelivery(deliveries[0]?.key || "friday");
  }, [deliveries, delivery]);

  const text = spanish ? {
    title: "Lista de preparación",
    instructions: "Mantenga presionada la casilla para marcar o desmarcar un artículo.",
    translated: "Traducción al español",
    complete: "completados",
    empty: "No hay artículos guardados para esta entrega.",
    hold: "Mantenga presionado para cambiar",
  } : {
    title: "Prep List View",
    instructions: "Touch and hold the checkbox to mark or unmark an item.",
    translated: "Spanish translation",
    complete: "complete",
    empty: "No saved items are ordered for this delivery.",
    hold: "Touch and hold to change",
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-sky-200 bg-white shadow-sm" data-testid="commissary-prep-list-view">
      <div className="border-b border-sky-200 bg-slate-950 px-4 py-5 text-white md:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-sky-300">{spanish ? `Semana ${weekLabel(weekStart)}` : `Week ${weekLabel(weekStart)}`}</p>
            <h2 className="mt-1 text-3xl font-black">{text.title}</h2>
            <p className="mt-1 text-sm font-semibold text-slate-300">{text.instructions}</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={spanish}
            aria-label="Spanish translation"
            onClick={() => setSpanish((value) => !value)}
            className="inline-flex min-h-12 items-center gap-3 rounded-full border border-slate-600 bg-slate-900 px-4 py-2 text-sm font-black"
          >
            <Languages size={20} />
            <span>{text.translated}</span>
            <span className={`relative h-7 w-12 rounded-full transition ${spanish ? "bg-emerald-500" : "bg-slate-600"}`} aria-hidden="true">
              <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${spanish ? "left-6" : "left-1"}`} />
            </span>
          </button>
        </div>
      </div>

      <div className="border-b border-slate-200 bg-white p-3 md:px-6">
        <p className="mb-2 text-xs font-black uppercase tracking-[0.12em] text-slate-500">{spanish ? "Seleccione su centro de comisaría" : "Select your commissary hub"}</p>
        <div role="group" aria-label="Select your commissary hub" className="grid grid-cols-3 gap-2">{hubs.map((option) => <button key={option.key} type="button" aria-pressed={hub === option.key} disabled={saving} onClick={() => onHubChange(option.key)} className={`min-h-12 rounded-xl px-3 py-2 text-sm font-black transition disabled:opacity-50 ${hub === option.key ? "bg-sky-600 text-white shadow-sm" : "border border-slate-300 bg-slate-50 text-slate-700"}`}>{option.label}</button>)}</div>
      </div>

      <div className="grid grid-cols-1 gap-1 border-b border-slate-200 bg-slate-100 p-2 sm:grid-cols-3">
        {deliveries.map((option) => (
          <button
            key={option.key}
            type="button"
            aria-pressed={delivery === option.key}
            onClick={() => setDelivery(option.key)}
            className={`min-h-16 rounded-xl px-3 py-2 text-left transition ${delivery === option.key ? "bg-white text-slate-950 shadow-sm ring-2 ring-sky-400" : "text-slate-600"}`}
          >
            <span className="block text-base font-black">{spanish ? option.titleEs : option.title}</span>
            <span className="block text-xs font-semibold">{spanish ? option.detailEs : option.detail}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 text-sm font-black md:px-6">
        <span>{completedCount} / {rows.length} {text.complete}</span>
        <span className="text-slate-500">{text.hold}</span>
      </div>

      {rows.length === 0 ? (
        <p className="p-10 text-center text-lg font-bold text-slate-500">{text.empty}</p>
      ) : (
        <div className="divide-y divide-slate-200">
          {rows.map((row) => {
            const checked = completedIds.has(row.id);
            const cafes = Object.entries(row.cafes)
              .filter(([, quantities]) => Number(quantities[delivery]) > 0)
              .map(([cafe, quantities]) => `${cafe} ${quantityText(quantities[delivery])}`)
              .join(" · ");
            const isGrill = String(row.category).startsWith("Grill");
            const itemName = isGrill ? row.name : (spanish ? commissarySpanishItem(row.name) : row.name);
            const category = isGrill ? (spanish ? "Parrilla LTO" : row.category) : (spanish ? commissarySpanishCategory(row.category) : row.category);
            const unit = compactUnit(row.orderUnit, spanish);
            return (
              <article key={row.id} className={`flex min-h-24 items-center gap-4 px-4 py-4 transition md:px-6 ${checked ? "bg-emerald-50" : "bg-white"}`}>
                <PrepCheck
                  checked={checked}
                  disabled={saving}
                  label={`${text.hold}: ${itemName}`}
                  onToggle={() => onToggle(delivery, row.id)}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-sky-700">{category}</p>
                  <p className={`mt-0.5 text-xl font-black leading-tight ${checked ? "text-emerald-900 line-through decoration-2" : "text-slate-950"}`}>{itemName}</p>
                  {row.finishedDish && <p className="mt-1 text-xs font-bold text-slate-500">{spanish ? "Para" : "For"}: {row.finishedDish}</p>}
                </div>
                <div className="max-w-[45%] shrink-0 text-right" data-testid={`prep-quantity-${row.id}`}>
                  <p className="whitespace-nowrap text-3xl font-black tabular-nums text-slate-950">{quantityText(row[delivery])} <span className="text-xl">{unit}</span></p>
                  <p className="mt-1 text-sm font-bold leading-tight text-slate-500" data-testid={`prep-cafes-${row.id}`}>{cafes}</p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
