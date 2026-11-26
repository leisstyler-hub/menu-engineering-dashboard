import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, Cloud, Download, FileDown, FileSpreadsheet, LoaderCircle, LockKeyhole, PackageCheck, Truck } from "lucide-react";

import { money } from "../../shared/formatting.js";
import { loadOperationalMetadata } from "../../shared/operationalMetadataStorage.js";
import { loadRecordsFromBackbone } from "../../integrations/storage/backboneClient.js";
import { refreshTransferCatalogCosts } from "../transfer-tool/transferStorage.js";
import PlatformSettings from "../../shared/ui/PlatformSettings.jsx";
import VersionStamp from "../../shared/ui/VersionStamp.jsx";
import PrepListView from "./PrepListView.jsx";
import TabbedPrepBoard from "./TabbedPrepBoard.jsx";
import { SALAD_BAR_CATEGORY_ORDER, commissaryItemMapForWeek } from "./commissaryCatalog.js";
import { exportCommissaryBom, exportCommissaryTransfer } from "./commissaryExport.js";
import { DEFAULT_COMMISSARY_METADATA, resolveCommissaryMetadata } from "./commissaryMetadata.js";
import {
  addDays,
  buildOrderRecord,
  cutoffLabelForWeek,
  emptyQuantities,
  emptyGrillOrder,
  emptyDeliOrder,
  emptyGlobalOrder,
  emptyBreakfastOrder,
  emptyDailyGlobalOrder,
  emptyFreshFiveOrder,
  firstOpenWeek,
  formatShortDate,
  isWeekLocked,
  latestPrepWeek,
  normalizeQuantities,
  normalizeGrillOrder,
  normalizeDeliOrder,
  normalizeGlobalOrder,
  normalizeBreakfastOrder,
  normalizeDailyGlobalOrder,
  normalizeFreshFiveOrder,
  normalizePrepCompleted,
  orderValue,
  selectableWeeks,
  transferPeriod,
  weekLabel,
  buildPrepProgressRecord,
  togglePrepCompleted,
  buildPackoutPacketRecord,
  isTabbedPrepBoardWeek,
  grillCycleForWeek,
  isGrillEligibleCafe,
  isGrillCoreAvailable,
  deliCycleForWeek,
  isDeliEligibleCafe,
  globalCycleForWeek,
  isGlobalEligibleCafe,
  isBreakfastEligibleCafe,
  dailyGlobalCycleForWeek,
  isDailyGlobalEligibleCafe,
  deliveriesForWeek,
  hasCommissaryOrder,
  standingOrderReductions,
  GLOBAL_UNIT_PREPARATION_NOTES,
  DELIVERY_KEYS,
} from "./commissaryModel.js";
import { loadCommissaryRecords, mergePendingPrepProgress, prepProgressKey, saveCommissaryOrder, saveCommissaryPackoutPacket, saveCommissaryPrepProgress } from "./commissaryStorage.js";
import { COMMISSARY_HUBS, COMMISSARY_STATIONS, isCafeStationEnabled, isCommissaryHub } from "./commissaryRouting.js";
import { buildPackoutPacket, buildPackoutPdfBytes, downloadPackoutPdf } from "./commissaryPackout.js";
import { BREAKFAST_ORDERING_PROGRAM } from "./breakfastCatalog.js";
import { GRILL_LTO_PROGRAM } from "./grillLtoCatalog.js";
import { buildRoxanneDawsonProjection, emptyRoxanneDawsonOrder, hasRoxanneDawsonProjection, normalizeRoxanneDawsonOrder, resolveRoxannePopUpLegacyFriday, roxanneDawsonDeliveryKeysForItem, roxannePopUpLegacyFridayQuantities } from "./roxanneDawsonProjection.js";
import { ROXANNE_CRICKET_EFFECTIVE_WEEK, buildRoxanneCricketSoupProjection, emptyRoxanneFlatbreadOrder, emptyRoxanneSoupOrder, normalizeRoxanneFlatbreadOrder, normalizeRoxanneSoupOrder, roxanneFlatbreadCycleForWeek } from "./roxanneCricketPrograms.js";
import { FRESH_FIVE_ITEMS } from "./freshFiveCatalog.js";
import { SELECTABLE_DAILY_GLOBAL_CAFES } from "./dailyGlobalCatalog.js";

const recordKey = (cafe, weekStart) => `${cafe}|${weekStart}`;

function GrillSetOrder({ setKey, options, selectedMrn, quantities, deliveries, catalogByMrn, disabled, onSelect, onQuantity }) {
  const selected = catalogByMrn.get(selectedMrn);
  return (
    <section className="overflow-hidden rounded-xl border border-amber-300 bg-white shadow-sm">
      <div className="grid gap-2 border-b border-amber-200 bg-amber-50 px-3 py-2 sm:grid-cols-[6rem_minmax(0,1fr)] sm:items-center">
        <div><p className="text-[11px] font-black uppercase tracking-[0.14em] text-amber-800">Set {setKey}</p><h4 className="text-sm font-black">Choose one LTO</h4></div>
        <select aria-label={`Grill Set ${setKey} sandwich`} value={selectedMrn} disabled={disabled} onChange={(event) => onSelect(setKey, event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-black disabled:bg-slate-100">
          <option value="">Select sandwich</option>
          {options.map((option) => <option key={option.mrn} value={option.mrn}>{option.name}</option>)}
        </select>
      </div>
      <div className="space-y-2 p-3">
        {selected ? <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-lg bg-slate-950 px-3 py-2 text-white"><div className="min-w-0"><p className="truncate text-sm font-black">{selected.item}</p><p className="text-[11px] font-semibold text-slate-300">MRN {selected.mrn} · {selected.portion || "1 sandwich"}</p></div><p className="shrink-0 text-sm font-black text-emerald-300">Item + Waste {money(selected.itemWasteCost)} each</p></div> : <p className="rounded-lg border border-dashed border-slate-300 px-3 py-2 text-xs font-bold text-slate-500">Choose one sandwich before entering whole quantities.</p>}
        <div className="grid gap-2 sm:grid-cols-3">{deliveries.map((delivery) => <label key={delivery.key} className="grid grid-cols-[minmax(0,1fr)_4.5rem] items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs font-black text-slate-700 sm:block"><span className="block leading-tight">{delivery.title}</span><span className="block text-[11px] font-semibold leading-tight text-slate-500 sm:min-h-7">{delivery.detail}</span><input aria-label={`Set ${setKey} ${delivery.title} sandwich quantity`} type="number" min="0" step="1" disabled={disabled || !selectedMrn} value={quantities?.[delivery.key] ?? 0} onChange={(event) => onQuantity(setKey, delivery.key, event.target.value)} className="row-span-2 w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-center text-base font-black disabled:bg-slate-200 sm:mt-1" /></label>)}</div>
      </div>
    </section>
  );
}

function DeliItemOrder({ option, item, quantities, deliveries, disabled, onQuantity }) {
  return (
    <section className="overflow-hidden rounded-xl border border-sky-300 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-200 bg-sky-50 px-3 py-2">
        <div className="min-w-0">{option.standing && <p className="text-[10px] font-black uppercase tracking-wide text-amber-900">Standing order · retired from new ordering</p>}<h4 className="text-sm font-black">{option.name}</h4><p className="text-[11px] font-semibold text-slate-500">MRN {option.mrn} · {item?.portion || "1 sandwich"}</p></div>
        <p className="shrink-0 text-sm font-black text-emerald-700">Item + Waste {item ? money(item.itemWasteCost) : "Unavailable"} each</p>
      </div>
      <div className="grid gap-2 p-3 sm:grid-cols-3">{deliveries.map((delivery) => <label key={delivery.key} className="grid grid-cols-[minmax(0,1fr)_4.5rem] items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs font-black text-slate-700 sm:block"><span className="block leading-tight">{delivery.title}</span><span className="block text-[11px] font-semibold leading-tight text-slate-500 sm:min-h-7">{delivery.detail}</span><input aria-label={`${option.name} ${delivery.title} sandwich quantity`} type="number" min="0" step="1" disabled={disabled || !item} value={quantities?.[delivery.key] ?? 0} onChange={(event) => onQuantity(option.mrn, delivery.key, event.target.value)} className="row-span-2 w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-center text-base font-black disabled:bg-slate-200 sm:mt-1" /></label>)}</div>
    </section>
  );
}

function GrillCoreItemOrder({ option, item, quantities, deliveries, disabled, onQuantity }) {
  return <section className="overflow-hidden rounded-xl border border-amber-300 bg-white shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200 bg-amber-50 px-3 py-2"><div><h4 className="text-sm font-black">{option.name}</h4><p className="text-[11px] font-semibold text-slate-500">MRN {option.mrn} · optional {option.category}</p></div><p className="text-sm font-black text-emerald-700">Item + Waste {item ? money(item.itemWasteCost) : "Unavailable"}</p></div>
    <div className="grid gap-2 p-3 sm:grid-cols-3">{deliveries.map((delivery) => <label key={delivery.key} className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs font-black"><span className="block">{delivery.title}</span><span className="block min-h-7 text-[11px] font-semibold text-slate-500">{delivery.detail}</span><input aria-label={`${option.name} ${delivery.title} quantity`} type="number" min="0" step="1" disabled={disabled || !item} value={quantities?.[delivery.key] ?? 0} onChange={(event) => onQuantity(option.mrn, delivery.key, event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-center text-base font-black disabled:bg-slate-200" /></label>)}</div>
  </section>;
}

function GrillOrderingSection({ grillAvailable, grillCoreAvailable, grillCycle, grill, catalogByMrn, deliveries, disabled, density, onSelectLto, onLtoQuantity, onCoreQuantity }) {
  if (!grillAvailable && !grillCoreAvailable) return null;
  return (
    <div className="border-t-4 border-amber-400 bg-amber-50/40 p-3 md:p-4" data-testid="commissary-grill-order" data-density={density || "compact"}>
      {grillAvailable && <div data-testid="commissary-grill-lto"><div className="mb-3 grid gap-1 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-end lg:gap-x-4"><div><p className="text-[11px] font-black uppercase tracking-[0.16em] text-amber-800">Grill LTO · Cycle Week {grillCycle.week}</p><h3 className="text-xl font-black">Choose one sandwich from each set</h3></div><p className="text-xs font-semibold text-slate-600 lg:pb-0.5">Order whole finished sandwiches for Friday, Monday and Wednesday delivery. The Prep List rolls each count into its direct ingredients and immediate sub-recipes.</p></div><div className="grid gap-3 lg:grid-cols-2"><GrillSetOrder setKey="A" options={grillCycle.setA} selectedMrn={grill.selections.A} quantities={grill.quantities.A} deliveries={deliveries} catalogByMrn={catalogByMrn} disabled={disabled} onSelect={onSelectLto} onQuantity={onLtoQuantity} /><GrillSetOrder setKey="B" options={grillCycle.setB} selectedMrn={grill.selections.B} quantities={grill.quantities.B} deliveries={deliveries} catalogByMrn={catalogByMrn} disabled={disabled} onSelect={onSelectLto} onQuantity={onLtoQuantity} /></div></div>}
      {grillCoreAvailable && <div className={`${grillAvailable ? "mt-4 border-t border-amber-300 pt-4" : ""}`} data-testid="commissary-grill-core"><div className="mb-3"><p className="text-[11px] font-black uppercase tracking-[0.16em] text-amber-800">Grill Core · always available</p><h3 className="text-lg font-black">Optional core sandwiches and sides</h3><p className="text-xs font-semibold text-slate-600">Enter whole finished-item quantities only when needed. Core selections are not required to save.</p></div><div className="grid gap-3 xl:grid-cols-2">{GRILL_LTO_PROGRAM.coreItems.map((option) => <GrillCoreItemOrder key={option.mrn} option={option} item={grill.core.items[option.mrn]} quantities={grill.core.quantities[option.mrn]} deliveries={deliveries} disabled={disabled} onQuantity={onCoreQuantity} />)}</div></div>}
    </div>
  );
}

function BreakfastItemOrder({ option, item, quantities, deliveries, disabled, onQuantity, onRemove }) {
  return (
    <section className="overflow-hidden rounded-xl border border-orange-300 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-orange-200 bg-orange-50 px-3 py-2">
        <div className="min-w-0"><h4 className="text-sm font-black">{option.name}</h4><p className="text-[11px] font-semibold text-slate-500">MRN {option.mrn} · {option.portion}</p></div>
        <div className="flex items-center gap-2"><p className="text-sm font-black text-emerald-700">Item + Waste {item ? money(item.itemWasteCost) : "Unavailable"}</p><button type="button" disabled={disabled} onClick={onRemove} className="rounded-lg border border-red-200 px-2 py-1 text-xs font-black text-red-700 disabled:opacity-40">Remove</button></div>
      </div>
      <div className="grid gap-2 p-3 sm:grid-cols-3">{deliveries.map((delivery) => <label key={delivery.key} className="grid grid-cols-[minmax(0,1fr)_4.5rem] items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs font-black text-slate-700 sm:block"><span className="block leading-tight">{delivery.title}</span><span className="block text-[11px] font-semibold leading-tight text-slate-500 sm:min-h-7">{delivery.detail}</span><input aria-label={`${option.name} ${delivery.title} breakfast quantity`} type="number" min="0" step="1" disabled={disabled || !item} value={quantities?.[delivery.key] ?? 0} onChange={(event) => onQuantity(option.id, delivery.key, event.target.value)} className="row-span-2 w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-center text-base font-black disabled:bg-slate-200 sm:mt-1" /></label>)}</div>
    </section>
  );
}

function GlobalSelectionGroup({ title, slots, options, items, quantities, deliveries, disabled, onSelect, onQuantity }) {
  return (
    <section className="rounded-2xl border border-violet-200 bg-white p-3 shadow-sm">
      <div className="mb-3"><h4 className="text-base font-black">{title}</h4><p className="text-xs font-semibold text-slate-500">{slots.length} optional slots</p></div>
      <div className="space-y-3">{slots.map((selectedId, index) => {
        const option = options.find(({ id }) => id === selectedId);
        const item = items[selectedId];
        return <div key={`${title}-${index}`} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          <div className="grid gap-2 p-2 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"><select aria-label={`${title} ${index + 1}`} value={selectedId} disabled={disabled} onChange={(event) => onSelect(index, event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-black disabled:bg-slate-100"><option value="">Select {title.slice(0, -1).toLowerCase()}</option>{options.map((choice) => <option key={choice.id} value={choice.id}>{choice.name}</option>)}</select>{option && <p className="text-xs font-black text-emerald-700">MRN {option.mrn} · {item ? money(item.itemWasteCost) : "Cost unavailable"}</p>}</div>
          {option && <div className="grid gap-2 border-t border-slate-200 p-2 sm:grid-cols-3">{deliveries.map((delivery) => <label key={delivery.key} className="rounded-lg bg-white p-2 text-xs font-black text-slate-700"><span className="block leading-tight">{delivery.title}</span><span className="block min-h-7 text-[11px] font-semibold leading-tight text-slate-500">{delivery.detail}</span><input aria-label={`${option.name} ${delivery.title} portion quantity`} type="number" min="0" step="1" disabled={disabled || !item} value={quantities?.[selectedId]?.[delivery.key] ?? 0} onChange={(event) => onQuantity(selectedId, delivery.key, event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-center text-base font-black disabled:bg-slate-200" /></label>)}</div>}
        </div>;
      })}</div>
    </section>
  );
}

function DailyGlobalOrderingSection({ cafe, cycle, order, weekStart, disabled, onQuantity, onComponent }) {
  if (!cycle) return null;
  return <div className="border-b-4 border-fuchsia-500 bg-fuchsia-50/40 p-3 md:p-4" data-testid="commissary-daily-global-order">
    <div className="mb-3"><p className="text-[11px] font-black uppercase tracking-[0.16em] text-fuchsia-800">Global 2–2–2 · Cycle Week {cycle.week}</p><h3 className="text-xl font-black">Enter lunch and dinner plate forecasts</h3><p className="mt-1 text-xs font-semibold text-slate-600">Menus repeat in continuous two-day blocks, seven days a week. Prep and transfers consolidate both meals; Packout keeps Lunch and Dinner separate.</p></div>
    <div className="grid gap-3 xl:grid-cols-2">{cycle.days.map((dayDefinition, dayIndex) => <section key={dayDefinition.key} className="overflow-hidden rounded-xl border border-fuchsia-200 bg-white shadow-sm">
      <div className="border-b border-fuchsia-100 bg-fuchsia-50 px-3 py-2"><div className="flex flex-wrap items-center justify-between gap-2"><h4 className="font-black">{dayDefinition.label} {formatShortDate(addDays(weekStart, dayIndex))}</h4><span className="rounded-full bg-white px-2 py-1 text-[10px] font-black text-fuchsia-800">{dayDefinition.menu.replace(/^AMZ:\s*/, "")}</span></div></div>
      <div className="space-y-3 p-3">{SELECTABLE_DAILY_GLOBAL_CAFES.includes(cafe) && <div className="rounded-lg border border-violet-200 bg-violet-50 p-2"><p className="text-[10px] font-black uppercase tracking-wide text-violet-800">Sides and extensions</p><div className="mt-2 flex flex-wrap gap-2">{[...dayDefinition.components, dayDefinition.garnish].map((component) => <label key={component.id} className="flex items-center gap-2 rounded-lg border border-violet-200 bg-white px-2 py-1.5 text-xs font-bold"><input type="checkbox" disabled={disabled} checked={order.componentSelections?.[dayDefinition.key]?.includes(component.id) ?? true} onChange={(event) => onComponent(dayDefinition.key, component.id, event.target.checked)} />{component.name}</label>)}</div></div>}{["animal", "vegetarian"].map((proteinType) => { const option = dayDefinition[proteinType]; const item = order.items?.[`${dayDefinition.key}|${proteinType}`]; const selectedIds = new Set(order.componentSelections?.[dayDefinition.key] || []); const plateContents = [...dayDefinition.components, dayDefinition.garnish].filter(({ id }) => !SELECTABLE_DAILY_GLOBAL_CAFES.includes(cafe) || selectedIds.has(id)).map(({ name }) => name); return <div key={proteinType} className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs font-black"><span className="block text-[10px] uppercase tracking-wide text-slate-500">{proteinType === "animal" ? "Animal protein plate" : "Vegetarian protein plate"}</span><span className="mt-1 block text-sm text-slate-950">{option.name}</span><span className="block text-[11px] font-semibold text-slate-500">MRN {option.mrn} · {item ? money(item.itemWasteCost) : "Cost unavailable"}</span><span className="mt-2 block rounded-md border border-fuchsia-100 bg-white px-2 py-1.5 text-[11px] font-semibold leading-4 text-slate-700"><strong className="text-slate-950">Comes with:</strong> {plateContents.join(", ") || "Protein only"}</span><div className="mt-2 grid grid-cols-2 gap-2">{["lunch", "dinner"].map((meal) => <label key={meal} className={`rounded-lg border p-2 ${meal === "lunch" ? "border-amber-200 bg-amber-50" : "border-sky-200 bg-sky-50"}`}><span className="block text-[10px] uppercase tracking-wide">{meal}</span><input aria-label={`${dayDefinition.label} ${meal} ${proteinType} plate quantity`} type="number" min="0" step="1" disabled={disabled || !item} value={order.quantities?.[dayDefinition.key]?.[meal]?.[proteinType] ?? 0} onChange={(event) => onQuantity(dayDefinition.key, meal, proteinType, event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-center text-lg font-black disabled:bg-slate-200" /></label>)}</div></div>; })}</div>
    </section>)}</div>
  </div>;
}

function RoxanneDawsonOrderingSection({ projection, order, deliveries, disabled, onQuantity, onResolveLegacyFriday }) {
  const groups = [
    { key: "popUp", title: "Pop-Up", description: "Submitted Dawson Global and Carvery selections marked Roxanne Pop-Up." },
    { key: "composedSalad", title: "Composed Salad", description: "Submitted Dawson Salad LTO selections flow here automatically." },
  ];
  const legacyFriday = roxannePopUpLegacyFridayQuantities(order);
  return <div className="border-b-4 border-emerald-500 bg-emerald-50/40 p-3 md:p-4" data-testid="roxanne-dawson-order">
    <div className="mb-4"><p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-800">Dawson → Roxanne · submitted rotation</p><h3 className="text-xl font-black">Roxanne Pop-Up and Composed Salad</h3><p className="mt-1 text-xs font-semibold text-slate-600">Dawson controls the item roster. Roxanne enters whole-item delivery quantities under the normal commissary cutoff. These items transfer from SEA27 Dawson and never create a Dawson Prep List.</p></div>
    {!projection ? <p className="rounded-xl border border-dashed border-emerald-300 bg-white p-5 text-center text-sm font-bold text-slate-600">Dawson has not submitted this service week yet. Items will appear here after submission.</p> : <div className="space-y-4">{legacyFriday.length > 0 && <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950"><p className="font-black">Standing Pop-Up Friday quantities need one schedule decision</p><p className="mt-1 font-semibold">Pop-Up now runs Tuesday–Thursday, using Monday delivery for Tuesday/Wednesday and Wednesday delivery for Thursday. The saved Friday quantities are still preserved and remain in prep and transfers until you choose what to do.</p><ul className="mt-2 list-disc pl-5 text-xs font-bold">{legacyFriday.map(({ item, quantity }) => <li key={item.id}>{item.name}: {quantity}</li>)}</ul><div className="mt-3 flex flex-wrap gap-2"><button type="button" disabled={disabled} onClick={() => onResolveLegacyFriday("move-to-monday")} className="rounded-lg bg-amber-900 px-3 py-2 text-xs font-black text-white disabled:bg-slate-400">Move saved Friday amounts to Monday delivery</button><button type="button" disabled={disabled} onClick={() => onResolveLegacyFriday("clear")} className="rounded-lg border border-amber-500 bg-white px-3 py-2 text-xs font-black disabled:text-slate-400">Clear saved Friday amounts</button></div></div>}{groups.map((group) => {
      const items = Object.values(order.items || {}).filter((item) => group.key === "composedSalad" ? item.source === "composedSalad" : item.source !== "composedSalad");
      return <section key={group.key} className="overflow-hidden rounded-xl border border-emerald-200 bg-white shadow-sm"><div className="border-b border-emerald-200 bg-emerald-50 px-3 py-2"><h4 className="font-black">{group.title}</h4><p className="text-xs font-semibold text-slate-600">{group.description}</p>{group.key === "popUp" && <p className="mt-1 text-xs font-black text-emerald-800">Tuesday–Thursday · Monday delivery serves Tuesday/Wednesday · Wednesday delivery serves Thursday</p>}</div>{items.length ? <div className="divide-y divide-slate-200">{items.map((item) => { const itemDeliveries = deliveries.filter(({ key }) => roxanneDawsonDeliveryKeysForItem(item).includes(key)); return <article key={item.id} className="p-3"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-black">{item.name}</p><p className="text-[11px] font-semibold text-slate-500">{item.menu || item.station} · MRN {item.mrn || "Needs review"} · {item.portion || "portion not recorded"}</p></div><p className={`text-sm font-black ${item.itemWasteCost > 0 ? "text-emerald-700" : "text-amber-700"}`}>{item.itemWasteCost > 0 ? `Item + Waste ${money(item.itemWasteCost)}` : "Cost unavailable"}</p></div><div className={`mt-2 grid gap-2 ${itemDeliveries.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>{itemDeliveries.map((delivery) => <label key={delivery.key} className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs font-black"><span className="block">{delivery.title}</span><span className="block min-h-7 text-[11px] font-semibold text-slate-500">{item.source === "composedSalad" ? delivery.detail : delivery.key === "monday" ? "Tuesday–Wednesday service" : "Thursday service"}</span><input aria-label={`${item.name} ${delivery.title} Roxanne quantity`} type="number" min="0" step="1" disabled={disabled || !(item.itemWasteCost > 0)} value={order.quantities?.[item.id]?.[delivery.key] ?? 0} onChange={(event) => onQuantity(item.id, delivery.key, event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-center text-base font-black disabled:bg-slate-200" /></label>)}</div></article>; })}</div> : <p className="p-4 text-sm font-bold text-slate-500">No submitted {group.title.toLowerCase()} items for this week.</p>}</section>;
    })}</div>}
  </div>;
}

function RoxanneSoupOrderingSection({ cafe, projection, order, weekStart, disabled, onQuantity }) {
  const days = ["monday", "tuesday", "wednesday", "thursday", "friday"];
  return <div className="border-b-4 border-cyan-500 bg-cyan-50/40 p-3 md:p-4" data-testid="roxanne-soup-order">
    <div className="mb-3"><p className="text-[11px] font-black uppercase tracking-[0.16em] text-cyan-800">Cricket → {cafe} · submitted soup rotation</p><h3 className="text-xl font-black">Soups</h3><p className="mt-1 text-xs font-semibold text-slate-600">Cricket routes selected soups to this cafe. Order whole 6-qt bains (190 fl oz); the bain cost scales from the recipe-native Item + Waste portion.</p></div>
    {!projection ? <p className="rounded-xl border border-dashed border-cyan-300 bg-white p-5 text-center text-sm font-bold text-slate-600">Cricket has not submitted routed soups for week {weekLabel(weekStart)} yet.</p> : <div className="grid gap-3 xl:grid-cols-2">{days.map((day) => { const items = Object.values(order.items || {}).filter((item) => item.serviceDay === day); if (!items.length) return null; return <section key={day} className="overflow-hidden rounded-xl border border-cyan-200 bg-white shadow-sm"><div className="border-b border-cyan-100 bg-cyan-50 px-3 py-2"><h4 className="font-black">{items[0].serviceDayLabel}</h4></div><div className="divide-y divide-slate-200">{items.map((item) => <label key={item.id} className="grid grid-cols-[minmax(0,1fr)_5rem] items-center gap-3 p-3"><span><span className="block font-black">Soup {item.slot}: {item.name}</span><span className="block text-[11px] font-semibold text-slate-500">MRN {item.mrn} · 6 qt bain / 190 fl oz · {item.itemWasteCost > 0 ? `Item + Waste ${money(item.itemWasteCost)}` : "Cost unavailable"}</span></span><input aria-label={`${item.serviceDayLabel} Soup ${item.slot} bain quantity`} type="number" min="0" step="1" disabled={disabled || !(item.itemWasteCost > 0)} value={order.quantities?.[item.id]?.[item.delivery] ?? 0} onChange={(event) => onQuantity(item.id, item.delivery, event.target.value)} className="w-full rounded-lg border border-slate-300 px-2 py-2 text-center text-lg font-black disabled:bg-slate-200" /></label>)}</div></section>; })}</div>}
  </div>;
}

function RoxanneFlatbreadOrderingSection({ cycle, order, deliveries, disabled, onQuantity }) {
  if (!cycle) return null;
  return <div className="border-b-4 border-rose-500 bg-rose-50/40 p-3 md:p-4" data-testid="roxanne-flatbread-order"><div className="mb-3"><p className="text-[11px] font-black uppercase tracking-[0.16em] text-rose-800">Flatbreads · Cycle Week {cycle.week}</p><h3 className="text-xl font-black">Order weekly Flatbreads</h3><p className="mt-1 text-xs font-semibold text-slate-600">Enter whole finished-flatbread quantities. Cricket receives the counts on Prep and Pack Out and transfers the exact Item + Waste cost.</p></div><div className="grid gap-3 xl:grid-cols-2">{cycle.items.map((item) => <section key={item.id} className="overflow-hidden rounded-xl border border-rose-200 bg-white shadow-sm"><div className="flex flex-wrap items-center justify-between gap-2 border-b border-rose-100 bg-rose-50 px-3 py-2"><div><h4 className="font-black">{item.name}</h4><p className="text-[11px] font-semibold text-slate-500">MRN {item.mrn} · {item.portion}</p></div><p className="text-sm font-black text-emerald-700">Item + Waste {money(item.itemWasteCost)}</p></div><div className="grid gap-2 p-3 sm:grid-cols-3">{deliveries.map((delivery) => <label key={delivery.key} className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs font-black"><span className="block">{delivery.title}</span><span className="block min-h-7 text-[11px] font-semibold text-slate-500">{delivery.detail}</span><input aria-label={`${item.name} ${delivery.title} quantity`} type="number" min="0" step="1" disabled={disabled} value={order.quantities?.[item.id]?.[delivery.key] ?? 0} onChange={(event) => onQuantity(item.id, delivery.key, event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-center text-base font-black disabled:bg-slate-200" /></label>)}</div></section>)}</div></div>;
}

function FreshFiveOrderingSection({ order, deliveries, disabled, onQuantity }) {
  const groups = [{ family: "sandwich", title: "Fresh Five Sandwiches · Cricket Deli" }, { family: "salad", title: "Fresh Five Salads · Cricket Salad Bar" }];
  return <div className="border-b-4 border-lime-500 bg-lime-50/40 p-3 md:p-4" data-testid="roxanne-fresh-five-order"><div className="mb-3"><p className="text-[11px] font-black uppercase tracking-[0.16em] text-lime-800">Roxanne Fresh Five</p><h3 className="text-xl font-black">Order finished Fresh Five items</h3><p className="mt-1 text-xs font-semibold text-slate-600">Sandwiches route to Cricket Deli. Salads route to Cricket Salad Bar. Every line uses shared Item + Waste metadata.</p></div><div className="space-y-4">{groups.map((group) => <section key={group.family} className="overflow-hidden rounded-xl border border-lime-200 bg-white"><h4 className="border-b border-lime-100 bg-lime-50 px-3 py-2 font-black">{group.title}</h4><div className="divide-y divide-slate-200">{FRESH_FIVE_ITEMS.filter((item) => item.family === group.family).map((item) => <article key={item.id} className="p-3"><div className="flex flex-wrap justify-between gap-2"><div><p className="font-black">{item.name}</p><p className="text-[11px] font-semibold text-slate-500">MRN {item.mrn} · {item.portion}</p></div><p className="text-sm font-black text-emerald-700">Item + Waste {money(item.itemWasteCost)}</p></div><div className="mt-2 grid gap-2 sm:grid-cols-3">{deliveries.map((delivery) => <label key={delivery.key} className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs font-black"><span className="block">{delivery.title}</span><input aria-label={`${item.name} ${delivery.title} quantity`} type="number" min="0" step="1" disabled={disabled} value={order.quantities?.[item.id]?.[delivery.key] ?? 0} onChange={(event) => onQuantity(item.id, delivery.key, event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-center text-base font-black disabled:bg-slate-200" /></label>)}</div></article>)}</div></section>)}</div></div>;
}

function weekOptions(now = new Date()) {
  const open = firstOpenWeek(now);
  const earlier = Array.from({ length: 8 }, (_, index) => addDays(open, -(8 - index) * 7));
  return [...earlier, ...selectableWeeks(now, 16)];
}

export default function CommissaryOrderingTool({ onBackToPlatform, onOpenSmartsheetHealth }) {
  const [activeView, setActiveView] = useState("orders");
  const [prepHub, setPrepHub] = useState("Cricket");
  const [cafe, setCafe] = useState("");
  const [weekStart, setWeekStart] = useState(() => firstOpenWeek());
  const [orders, setOrders] = useState([]);
  const [prepProgressRecords, setPrepProgressRecords] = useState([]);
  const [metadata, setMetadata] = useState(() => ({ ...DEFAULT_COMMISSARY_METADATA, source: "fallback" }));
  const [quantities, setQuantities] = useState(() => emptyQuantities(firstOpenWeek()));
  const [grill, setGrill] = useState(() => emptyGrillOrder(firstOpenWeek()));
  const [deli, setDeli] = useState(() => emptyDeliOrder(firstOpenWeek()));
  const [global, setGlobal] = useState(() => emptyGlobalOrder(firstOpenWeek()));
  const [breakfast, setBreakfast] = useState(() => emptyBreakfastOrder());
  const [dailyGlobal, setDailyGlobal] = useState(() => emptyDailyGlobalOrder(firstOpenWeek()));
  const [freshFive, setFreshFive] = useState(() => emptyFreshFiveOrder());
  const [roxanneDawson, setRoxanneDawson] = useState(() => emptyRoxanneDawsonOrder());
  const [roxanneSoup, setRoxanneSoup] = useState(() => emptyRoxanneSoupOrder());
  const [roxanneFlatbreads, setRoxanneFlatbreads] = useState(() => emptyRoxanneFlatbreadOrder(firstOpenWeek()));
  const [rotationRecords, setRotationRecords] = useState([]);
  const [prepReloadedAt, setPrepReloadedAt] = useState("");
  const [breakfastAddId, setBreakfastAddId] = useState("");
  const [grillCatalog, setGrillCatalog] = useState([]);
  const [deliCatalog, setDeliCatalog] = useState([]);
  const [globalCatalog, setGlobalCatalog] = useState([]);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState({ state: "ready", message: "Autosave ready" });
  const [editRevision, setEditRevision] = useState(0);
  const [hydrationRevision, setHydrationRevision] = useState(0);
  const [prepSaving, setPrepSaving] = useState(false);
  const autosaveTimerRef = useRef(null);
  const pendingAutosaveRef = useRef(null);
  const autosaveQueueRef = useRef(Promise.resolve());
  const latestRevisionByOrderRef = useRef(new Map());
  const pendingPrepProgressRef = useRef(new Map());
  const mountedRef = useRef(true);
  const activeEditorKeyRef = useRef("");

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const weeks = useMemo(() => weekOptions(), []);
  const locked = isWeekLocked(weekStart, now);
  const prepBoardPilot = isTabbedPrepBoardWeek(weekStart);
  const currentRecord = useMemo(() => orders.find((row) => recordKey(row.cafe, row.weekStart) === recordKey(cafe, weekStart)), [cafe, orders, weekStart]);
  activeEditorKeyRef.current = recordKey(cafe, weekStart);
  const weekRecords = useMemo(() => orders.filter((row) => row.weekStart === weekStart && metadata.receivingCafes.some(({ name }) => name === row.cafe)), [metadata.receivingCafes, orders, weekStart]);
  const prepProgressRecord = useMemo(() => prepProgressRecords.find((row) => row.weekStart === weekStart && row.hub === prepHub)
    || (prepHub === "Cricket" ? prepProgressRecords.find((row) => row.weekStart === weekStart && !row.hub) : null), [prepHub, prepProgressRecords, weekStart]);
  const prepCompleted = useMemo(() => normalizePrepCompleted(prepProgressRecord?.completed), [prepProgressRecord]);
  const roxanneProjection = useMemo(() => buildRoxanneDawsonProjection(rotationRecords, weekStart), [rotationRecords, weekStart]);
  const roxanneSoupProjection = useMemo(() => buildRoxanneCricketSoupProjection(rotationRecords, weekStart, cafe), [cafe, rotationRecords, weekStart]);
  const roxanneFlatbreadCycle = useMemo(() => roxanneFlatbreadCycleForWeek(weekStart), [weekStart]);
  const saladBarItems = useMemo(() => [...commissaryItemMapForWeek(weekStart, currentRecord?.quantities).values()]
    .sort((left, right) => SALAD_BAR_CATEGORY_ORDER.indexOf(left.category) - SALAD_BAR_CATEGORY_ORDER.indexOf(right.category) || Number(Boolean(left.retired)) - Number(Boolean(right.retired)) || left.name.localeCompare(right.name)), [currentRecord, weekStart]);
  const currentValue = orderValue(quantities, grill, deli, global, cafe, breakfast, weekStart, dailyGlobal, roxanneDawson, roxanneSoup, roxanneFlatbreads, freshFive);
  const currentHasOrder = hasCommissaryOrder({ cafe, weekStart, quantities, grill, deli, global, breakfast, dailyGlobal, freshFive, roxanneDawson, roxanneSoup, roxanneFlatbreads });
  const period = transferPeriod(weekStart);
  const grillCycle = grillCycleForWeek(weekStart);
  const grillAvailable = Boolean(grillCycle && isGrillEligibleCafe(cafe));
  const grillCoreAvailable = isGrillCoreAvailable(cafe, weekStart);
  const saladBarAvailable = isCafeStationEnabled(cafe, COMMISSARY_STATIONS.SALAD_BAR);
  const grillCatalogByMrn = useMemo(() => new Map(grillCatalog.map((item) => [String(item.mrn), item])), [grillCatalog]);
  const deliCycle = deliCycleForWeek(weekStart);
  const deliAvailable = Boolean(deliCycle && isDeliEligibleCafe(cafe));
  const deliCatalogByMrn = useMemo(() => new Map(deliCatalog.map((item) => [String(item.mrn), item])), [deliCatalog]);
  const globalCycle = globalCycleForWeek(weekStart);
  const dailyGlobalCycle = dailyGlobalCycleForWeek(weekStart, cafe);
  const dailyGlobalAvailable = Boolean(dailyGlobalCycle && isDailyGlobalEligibleCafe(cafe));
  const savedGlobalQuantity = Object.values(currentRecord?.global?.quantities || {}).some((values) => DELIVERY_KEYS.some((delivery) => Number(values?.[delivery] || 0) > 0));
  const globalAvailable = Boolean(globalCycle && isGlobalEligibleCafe(cafe) && (!dailyGlobalAvailable || savedGlobalQuantity));
  const globalCatalogByKey = useMemo(() => new Map(globalCatalog.map((item) => [`${item.menu}|${String(item.mrn)}|${item.portion}`, item])), [globalCatalog]);
  const globalCatalogByMenuMrn = useMemo(() => new Map(globalCatalog.map((item) => [`${item.menu}|${String(item.mrn)}`, item])), [globalCatalog]);
  const breakfastAvailable = isBreakfastEligibleCafe(cafe);
  const roxanneDawsonAvailable = hasRoxanneDawsonProjection(cafe, weekStart);
  const roxanneCricketAvailable = ["Roxanne Coffee", "Brazil Coffee"].includes(cafe) && weekStart >= (cafe === "Brazil Coffee" ? "2026-12-07" : ROXANNE_CRICKET_EFFECTIVE_WEEK);
  const hubSiteSelected = isCommissaryHub(cafe);
  const breakfastCatalogByKey = useMemo(() => new Map(globalCatalog.filter(({ menu }) => menu === BREAKFAST_ORDERING_PROGRAM.menu).map((item) => [`${String(item.mrn)}|${item.portion}`, item])), [globalCatalog]);
  const datedDeliveries = useMemo(() => deliveriesForWeek(metadata.deliveries, weekStart), [metadata.deliveries, weekStart]);

  useEffect(() => {
    let mounted = true;
    const liveGrillCatalog = refreshTransferCatalogCosts().catch((catalogError) => ({ items: [], catalogError }));
    Promise.all([loadCommissaryRecords(), loadOperationalMetadata(), liveGrillCatalog, loadRecordsFromBackbone({ tool: "rotation" })]).then(([records, operationalMetadata, liveCatalog, rotationPayload]) => {
      if (mounted) {
        setOrders(records.filter((record) => record["Record Type"] === "Commissary Order"));
        setPrepProgressRecords(mergePendingPrepProgress(records.filter((record) => record["Record Type"] === "Commissary Prep Progress"), pendingPrepProgressRef.current));
        setRotationRecords(rotationPayload.records || []);
        const legacyMetadata = resolveCommissaryMetadata(records);
        const shared = operationalMetadata.commissaryOrdering;
        setMetadata({
          metadataVersion: operationalMetadata.metadataVersion,
          receivingCafes: shared.receivingCafes || legacyMetadata.receivingCafes,
          deliveries: shared.deliveries || legacyMetadata.deliveries,
          grillInterface: shared.grillInterface,
          source: operationalMetadata.source,
        });
        setGrillCatalog(liveCatalog.items.filter((item) => item.menu === "AMZ: Grill Core"));
        setDeliCatalog(liveCatalog.items.filter((item) => item.menu === "AMZ: Deli Core"));
        setGlobalCatalog(liveCatalog.items);
        if (liveCatalog.catalogError) setError(`Live Grill, Deli, Global and Breakfast costs are unavailable: ${liveCatalog.catalogError.message}`);
      }
    }).catch((loadError) => {
      if (mounted) setError(loadError.message);
    }).finally(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    setQuantities(saladBarAvailable ? normalizeQuantities(currentRecord?.quantities || {}, {
      orderUnitVersion: currentRecord ? currentRecord.orderUnitVersion ?? 1 : undefined,
      weekStart,
    }) : emptyQuantities(weekStart));
    const normalizedGrill = normalizeGrillOrder(currentRecord?.grill || {}, weekStart, cafe);
    normalizedGrill.core.items = Object.fromEntries(GRILL_LTO_PROGRAM.coreItems.flatMap(({ mrn }) => {
      const live = grillCatalogByMrn.get(mrn);
      const saved = normalizedGrill.core.items[mrn];
      const source = live || saved;
      return source ? [[mrn, { mrn, item: source.item, portion: source.portion, itemWasteCost: Number(source.itemWasteCost) }]] : [];
    }));
    setGrill(normalizedGrill);
    const normalizedDeli = normalizeDeliOrder(currentRecord?.deli || {}, weekStart, cafe);
    normalizedDeli.items = Object.fromEntries(Object.keys(normalizedDeli.quantities).flatMap((mrn) => {
      const live = deliCatalogByMrn.get(mrn);
      const saved = normalizedDeli.items[mrn];
      const source = live || saved;
      return source ? [[mrn, { mrn, item: source.item, portion: source.portion, itemWasteCost: Number(source.itemWasteCost) }]] : [];
    }));
    setDeli(normalizedDeli);
    const normalizedGlobal = normalizeGlobalOrder(currentRecord?.global || {}, weekStart, cafe);
    if (globalCycle) {
      normalizedGlobal.items = Object.fromEntries(globalCycle.menus.flatMap(({ items }) => items).flatMap((option) => {
        const live = globalCatalogByKey.get(`${option.menu}|${option.mrn}|${option.portion}`);
        const saved = normalizedGlobal.items[option.id];
        const source = live || saved;
        return source ? [[option.id, { id: option.id, menu: option.menu, mrn: option.mrn, item: source.item || option.name, portion: option.portion, category: option.category, itemWasteCost: Number(source.itemWasteCost) }]] : [];
      }));
    }
    setGlobal(normalizedGlobal);
    const normalizedBreakfast = normalizeBreakfastOrder(currentRecord?.breakfast || {}, cafe);
    normalizedBreakfast.items = Object.fromEntries(normalizedBreakfast.selections.flatMap((id) => {
      const option = BREAKFAST_ORDERING_PROGRAM.items.find((row) => row.id === id);
      const live = option ? breakfastCatalogByKey.get(`${option.mrn}|${option.portion}`) : null;
      const saved = normalizedBreakfast.items[id];
      const source = live || saved;
      return option && source ? [[id, { id, menu: BREAKFAST_ORDERING_PROGRAM.menu, mrn: option.mrn, item: source.item || option.name, portion: option.portion, itemWasteCost: Number(source.itemWasteCost) }]] : [];
    }));
    setBreakfast(normalizedBreakfast);
    const normalizedDailyGlobal = normalizeDailyGlobalOrder(currentRecord?.dailyGlobal || {}, weekStart, cafe);
    if (dailyGlobalCycle) {
      normalizedDailyGlobal.items = Object.fromEntries(dailyGlobalCycle.days.flatMap((dayDefinition) => ["animal", "vegetarian"].flatMap((proteinType) => {
        const option = dayDefinition[proteinType];
        const key = `${dayDefinition.key}|${proteinType}`;
        const live = globalCatalogByMenuMrn.get(`${dayDefinition.menu}|${option.mrn}`);
        const saved = normalizedDailyGlobal.items[key];
        const source = live || saved;
        return source ? [[key, { id: key, menu: dayDefinition.menu, mrn: option.mrn, item: source.item || option.name, portion: option.portion, proteinType, itemWasteCost: Number(source.itemWasteCost) }]] : [];
      })));
    }
    setDailyGlobal(normalizedDailyGlobal);
    setFreshFive(normalizeFreshFiveOrder(currentRecord?.freshFive, cafe, weekStart));
    setRoxanneDawson(normalizeRoxanneDawsonOrder(currentRecord?.roxanneDawson, roxanneDawsonAvailable ? roxanneProjection : null));
    setRoxanneSoup(normalizeRoxanneSoupOrder(currentRecord?.roxanneSoup, roxanneCricketAvailable ? roxanneSoupProjection : null));
    setRoxanneFlatbreads(normalizeRoxanneFlatbreadOrder(currentRecord?.roxanneFlatbreads, weekStart));
    setBreakfastAddId("");
  }, [breakfastCatalogByKey, cafe, currentRecord, dailyGlobalCycle, deliCatalogByMrn, globalCatalogByKey, globalCatalogByMenuMrn, globalCycle, grillCatalogByMrn, hydrationRevision, roxanneCricketAvailable, roxanneDawsonAvailable, roxanneProjection, roxanneSoupProjection, saladBarAvailable, weekStart]);

  useEffect(() => {
    if (activeView === "prep" && !hubSiteSelected) setActiveView("orders");
  }, [activeView, hubSiteSelected]);

  const markOrderEdited = () => {
    setAutosaveStatus({ state: "pending", message: "Changes pending…" });
    setEditRevision((revision) => revision + 1);
  };

  const updateQuantity = (itemId, delivery, value) => {
    const item = saladBarItems.find((row) => row.id === itemId);
    const normalized = value === "" ? "" : Math.max(0, item?.quantityIncrement === 1 ? Math.floor(Number(value)) : Number(value));
    setQuantities((current) => ({
      ...current,
      [itemId]: { ...current[itemId], [delivery]: normalized },
    }));
    markOrderEdited();
  };

  const selectGrillItem = (setKey, mrn) => {
    const item = grillCatalogByMrn.get(mrn);
    setGrill((current) => ({
      ...current,
      selections: { ...current.selections, [setKey]: mrn },
      items: { ...current.items, [setKey]: item ? { mrn, item: item.item, portion: item.portion, itemWasteCost: item.itemWasteCost } : null },
    }));
    markOrderEdited();
  };

  const updateGrillQuantity = (setKey, delivery, value) => {
    setGrill((current) => ({
      ...current,
      quantities: { ...current.quantities, [setKey]: { ...current.quantities[setKey], [delivery]: value === "" ? "" : Math.max(0, Math.floor(Number(value))) } },
    }));
    markOrderEdited();
  };

  const updateGrillCoreQuantity = (mrn, delivery, value) => {
    setGrill((current) => ({
      ...current,
      core: { ...current.core, quantities: { ...current.core.quantities, [mrn]: { ...current.core.quantities[mrn], [delivery]: value === "" ? "" : Math.max(0, Math.floor(Number(value))) } } },
    }));
    markOrderEdited();
  };

  const updateDeliQuantity = (mrn, delivery, value) => {
    setDeli((current) => ({
      ...current,
      quantities: { ...current.quantities, [mrn]: { ...current.quantities[mrn], [delivery]: value === "" ? "" : Math.max(0, Math.floor(Number(value))) } },
    }));
    markOrderEdited();
  };

  const updateGlobalQuantity = (id, delivery, value) => {
    setGlobal((current) => ({
      ...current,
      quantities: { ...current.quantities, [id]: { ...current.quantities[id], [delivery]: value === "" ? "" : Math.max(0, Math.floor(Number(value))) } },
    }));
    markOrderEdited();
  };

  const selectGlobalMenu = (menu) => {
    setGlobal((current) => ({
      ...emptyGlobalOrder(weekStart),
      items: current.items,
      menu,
    }));
    markOrderEdited();
  };

  const selectGlobalItem = (group, index, id) => {
    setGlobal((current) => {
      const previousId = current.selections[group][index];
      const nextSelections = {
        entrees: current.selections.entrees.map((value) => id && value === id ? "" : value),
        sides: current.selections.sides.map((value) => id && value === id ? "" : value),
        sauces: current.selections.sauces.map((value) => id && value === id ? "" : value),
      };
      nextSelections[group][index] = id;
      const stillSelected = new Set([...nextSelections.entrees, ...nextSelections.sides, ...nextSelections.sauces].filter(Boolean));
      const nextQuantities = { ...current.quantities };
      if (previousId && !stillSelected.has(previousId)) nextQuantities[previousId] = { friday: 0, monday: 0, wednesday: 0 };
      return { ...current, selections: nextSelections, quantities: nextQuantities, legacyReviewRequired: false };
    });
    markOrderEdited();
  };

  const addBreakfastItem = (id) => {
    if (!id) return;
    const option = BREAKFAST_ORDERING_PROGRAM.items.find((row) => row.id === id);
    const live = option ? breakfastCatalogByKey.get(`${option.mrn}|${option.portion}`) : null;
    setBreakfast((current) => ({
      ...current,
      selections: [...new Set([...current.selections, id])],
      items: live ? { ...current.items, [id]: { id, menu: BREAKFAST_ORDERING_PROGRAM.menu, mrn: option.mrn, item: live.item || option.name, portion: option.portion, itemWasteCost: Number(live.itemWasteCost) } } : current.items,
    }));
    setBreakfastAddId("");
    markOrderEdited();
  };

  const removeBreakfastItem = (id) => {
    setBreakfast((current) => ({
      ...current,
      selections: current.selections.filter((selected) => selected !== id),
      quantities: { ...current.quantities, [id]: Object.fromEntries(metadata.deliveries.map(({ key }) => [key, 0])) },
      items: Object.fromEntries(Object.entries(current.items).filter(([itemId]) => itemId !== id)),
    }));
    markOrderEdited();
  };

  const updateBreakfastQuantity = (id, delivery, value) => {
    setBreakfast((current) => ({
      ...current,
      quantities: { ...current.quantities, [id]: { ...current.quantities[id], [delivery]: value === "" ? "" : Math.max(0, Math.floor(Number(value))) } },
    }));
    markOrderEdited();
  };

  const updateDailyGlobalQuantity = (dayKey, meal, proteinType, value) => {
    setDailyGlobal((current) => ({ ...current, quantities: { ...current.quantities, [dayKey]: { ...current.quantities[dayKey], [meal]: { ...current.quantities[dayKey]?.[meal], [proteinType]: value === "" ? "" : Math.max(0, Math.floor(Number(value))) } } } }));
    markOrderEdited();
  };

  const updateDailyGlobalComponent = (dayKey, componentId, checked) => {
    setDailyGlobal((current) => { const selected = new Set(current.componentSelections?.[dayKey] || []); if (checked) selected.add(componentId); else selected.delete(componentId); return { ...current, componentSelections: { ...current.componentSelections, [dayKey]: [...selected] } }; });
    markOrderEdited();
  };

  const updateRoxanneDawsonQuantity = (itemId, delivery, value) => {
    setRoxanneDawson((current) => ({
      ...current,
      quantities: { ...current.quantities, [itemId]: { ...current.quantities[itemId], [delivery]: value === "" ? "" : Math.max(0, Math.floor(Number(value))) } },
    }));
    markOrderEdited();
  };

  const resolveRoxanneLegacyFriday = (strategy) => {
    setRoxanneDawson((current) => resolveRoxannePopUpLegacyFriday(current, strategy));
    markOrderEdited();
  };

  const updateRoxanneSoupQuantity = (itemId, delivery, value) => {
    setRoxanneSoup((current) => ({ ...current, quantities: { ...current.quantities, [itemId]: { ...current.quantities[itemId], [delivery]: value === "" ? "" : Math.max(0, Math.floor(Number(value))) } } }));
    markOrderEdited();
  };

  const updateRoxanneFlatbreadQuantity = (itemId, delivery, value) => {
    setRoxanneFlatbreads((current) => ({ ...current, quantities: { ...current.quantities, [itemId]: { ...current.quantities[itemId], [delivery]: value === "" ? "" : Math.max(0, Math.floor(Number(value))) } } }));
    markOrderEdited();
  };

  const updateFreshFiveQuantity = (itemId, delivery, value) => {
    setFreshFive((current) => ({ ...current, quantities: { ...current.quantities, [itemId]: { ...current.quantities[itemId], [delivery]: value === "" ? "" : Math.max(0, Math.floor(Number(value))) } } }));
    markOrderEdited();
  };

  const enqueueAutosave = (job) => {
    autosaveQueueRef.current = autosaveQueueRef.current.catch(() => {}).then(async () => {
      if (latestRevisionByOrderRef.current.get(job.key) !== job.revision) return;
      let record = job.record;
      const reductions = job.baseline ? standingOrderReductions(job.baseline, record) : [];
      if (reductions.length) {
        const approved = window.confirm(`This will reduce or remove ${reductions.length} saved standing-order quantit${reductions.length === 1 ? "y" : "ies"} for ${job.cafe}, week ${weekLabel(job.weekStart)}.\n\nOK: apply the changes.\nCancel: keep every standing order unchanged.`);
        if (!approved) {
          if (mountedRef.current && activeEditorKeyRef.current === job.key) {
            setHydrationRevision((revision) => revision + 1);
            setAutosaveStatus({ state: "ready", message: "Standing order kept unchanged" });
            setNotice("Standing orders were kept unchanged. The edited values were restored.");
          }
          return;
        }
        record = {
          ...record,
          standingOrderChangeApproval: {
            baselineUpdatedAt: job.baseline.updatedAt,
            reductionCount: reductions.length,
            confirmedAt: new Date().toISOString(),
          },
        };
      }
      const isActive = activeEditorKeyRef.current === job.key;
      if (mountedRef.current && isActive) {
        setSaving(true);
        setError("");
        setAutosaveStatus({ state: "saving", message: "Saving automatically…" });
      }
      try {
        await saveCommissaryOrder(record);
        if (latestRevisionByOrderRef.current.get(job.key) === job.revision && mountedRef.current) {
          setOrders((current) => [...current.filter((row) => recordKey(row.cafe, row.weekStart) !== job.key), record]);
          if (activeEditorKeyRef.current === job.key) setAutosaveStatus({ state: "saved", message: "Saved automatically" });
        }
      } catch (saveError) {
        if (mountedRef.current && activeEditorKeyRef.current === job.key) {
          setError(saveError.message);
          setAutosaveStatus({ state: "error", message: "Autosave needs attention" });
        }
      } finally {
        if (mountedRef.current && activeEditorKeyRef.current === job.key && latestRevisionByOrderRef.current.get(job.key) === job.revision) setSaving(false);
      }
    });
  };

  useEffect(() => {
    if (!editRevision || loading || !cafe || locked) return;
    if (global.legacyReviewRequired) {
      setAutosaveStatus({ state: "error", message: "Choose one Global menu to resume autosave" });
      return;
    }
    const key = recordKey(cafe, weekStart);
    const job = {
      key,
      cafe,
      weekStart,
      revision: editRevision,
      baseline: currentRecord,
      record: buildOrderRecord({ cafe, weekStart, quantities, grill, deli, global, breakfast, dailyGlobal, freshFive, roxanneDawson, roxanneSoup, roxanneFlatbreads }),
    };
    latestRevisionByOrderRef.current.set(key, editRevision);
    const previous = pendingAutosaveRef.current;
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    if (previous && previous.key !== key) enqueueAutosave(previous);
    pendingAutosaveRef.current = job;
    autosaveTimerRef.current = setTimeout(() => {
      if (pendingAutosaveRef.current === job) pendingAutosaveRef.current = null;
      enqueueAutosave(job);
    }, 500);
  }, [editRevision]);

  const runExport = async (work) => {
    setError("");
    try {
      await work();
    } catch (exportError) {
      setError(exportError.message);
    }
  };

  const generateCurrentTransfer = () => {
    if (!cafe) return setError("Select your cafe before generating a transfer.");
    const record = buildOrderRecord({ cafe, weekStart, quantities, grill, deli, global, breakfast, dailyGlobal, freshFive, roxanneDawson, roxanneSoup, roxanneFlatbreads });
    return runExport(() => exportCommissaryTransfer(record, metadata));
  };

  const generateCurrentBom = () => {
    if (!hubSiteSelected) return setError("Prep Lists are available only at Cricket, Sonic, and Blueshift commissary hubs.");
    const current = buildOrderRecord({ cafe, weekStart, quantities, grill, deli, global, breakfast, dailyGlobal, freshFive, roxanneDawson, roxanneSoup, roxanneFlatbreads });
    const records = [
      ...weekRecords.filter((record) => record.cafe !== cafe),
      current,
    ].filter((record) => orderValue(record.quantities, record.grill, record.deli, record.global, record.cafe, record.breakfast, record.weekStart, record.dailyGlobal, record.roxanneDawson, record.roxanneSoup, record.roxanneFlatbreads, record.freshFive) > 0);
    return runExport(() => exportCommissaryBom(records, weekStart, metadata, { hub: cafe }));
  };

  const generatePackoutPacket = () => runExport(async () => {
    if (!cafe) throw new Error("Select your cafe or commissary hub before generating the Packout Packet.");
    if (!weekRecords.length) throw new Error("Save at least one cafe order before generating the Packout Packet.");
    const packet = buildPackoutPacket(weekRecords, weekStart, metadata, { selectedCafe: cafe });
    const bytes = buildPackoutPdfBytes(packet);
    const record = buildPackoutPacketRecord({ weekStart, records: weekRecords, packet, metadataVersion: metadata.metadataVersion });
    await saveCommissaryPackoutPacket({ ...record, packet });
    downloadPackoutPdf(bytes, weekStart);
    setNotice(`${cafe} Packout Packet for week ${weekLabel(weekStart)} was saved and downloaded.`);
  });

  const openPrepView = () => {
    if (!hubSiteSelected) return setError("Select Cricket, Sonic, or Blueshift to open its routed Prep List.");
    setPrepHub(cafe);
    setActiveView("prep");
    if (!prepBoardPilot) setWeekStart(latestPrepWeek());
    setNotice("");
    setError("");
  };

  useEffect(() => {
    if (activeView !== "prep") return undefined;
    let cancelled = false;
    const reload = async () => {
      try {
        const records = await loadCommissaryRecords();
        if (cancelled) return;
        setOrders(records.filter((record) => record["Record Type"] === "Commissary Order"));
        setPrepProgressRecords(mergePendingPrepProgress(records.filter((record) => record["Record Type"] === "Commissary Prep Progress"), pendingPrepProgressRef.current));
        setPrepReloadedAt(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
      } catch (reloadError) {
        if (!cancelled) setError(`Prep List auto-refresh needs attention: ${reloadError.message}`);
      }
    };
    const interval = window.setInterval(reload, 15000);
    const onFocus = () => reload();
    const onVisibility = () => { if (document.visibilityState === "visible") reload(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [activeView]);

  const togglePrepItem = async (delivery, itemId) => {
    if ((!locked && !prepBoardPilot) || prepSaving) return;
    const previous = prepProgressRecord || buildPrepProgressRecord({ weekStart, hub: prepHub, completed: {} });
    const next = buildPrepProgressRecord({ weekStart, hub: prepHub, completed: togglePrepCompleted(previous.completed, delivery, itemId) });
    const progressKey = prepProgressKey(next);
    pendingPrepProgressRef.current.set(progressKey, next);
    setPrepProgressRecords((current) => [...current.filter((row) => !(row.weekStart === weekStart && (row.hub || "Cricket") === prepHub)), next]);
    setPrepSaving(true);
    setError("");
    try {
      await saveCommissaryPrepProgress(next);
    } catch (saveError) {
      pendingPrepProgressRef.current.delete(progressKey);
      setPrepProgressRecords((current) => [...current.filter((row) => !(row.weekStart === weekStart && (row.hub || "Cricket") === prepHub)), ...(prepProgressRecord ? [prepProgressRecord] : [])]);
      setError(saveError.message);
    } finally {
      setPrepSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[120rem] flex-wrap items-center justify-between gap-3 px-4 py-4 md:px-8">
          <button type="button" onClick={onBackToPlatform} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-black hover:bg-slate-50"><ArrowLeft size={17} /> Home</button>
          <div className="flex items-center gap-2"><PlatformSettings onOpenSmartsheetHealth={onOpenSmartsheetHealth} /><VersionStamp /></div>
        </div>
      </header>

      <main className="mx-auto w-full min-w-0 max-w-[120rem] space-y-5 px-4 py-6 md:px-8">
        <section className="rounded-2xl border border-sky-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2"><p className="text-xs font-black uppercase tracking-[0.18em] text-sky-700">Commissary production</p><span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-amber-900">Draft</span></div>
              <h1 className="mt-2 text-3xl font-black md:text-5xl">Commissary Ordering Tool</h1>
              <p className="mt-2 max-w-3xl text-sm font-semibold text-slate-600">Choose your cafe, then enter each delivery quantity. Every edit saves automatically. Orders lock at 5:00 PM local Pacific time on the Wednesday before service.</p>
            </div>
            <div className={`grid w-full grid-cols-1 gap-3 xl:w-auto ${activeView === "orders" ? "sm:grid-cols-2 xl:min-w-[30rem]" : "xl:min-w-[15rem]"}`}>
              {activeView === "orders" && <label className="min-w-0 text-xs font-black uppercase tracking-[0.12em] text-slate-600">Your cafe<select aria-label="Your cafe" value={cafe} onChange={(event) => { setCafe(event.target.value); setNotice(""); setError(""); setAutosaveStatus({ state: "ready", message: "Autosave ready" }); }} className="mt-1 block w-full min-w-0 max-w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-black text-slate-950"><option value="">Select cafe</option>{metadata.receivingCafes.map((row) => <option key={row.name} value={row.name}>{row.displayName} {row.profitCenter}</option>)}</select></label>}
              <label className="min-w-0 text-xs font-black uppercase tracking-[0.12em] text-slate-600">Service week<select aria-label="Service week" value={weekStart} onChange={(event) => { setWeekStart(event.target.value); setNotice(""); setError(""); setAutosaveStatus({ state: "ready", message: "Autosave ready" }); }} className="mt-1 block w-full min-w-0 max-w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-black text-slate-950">{weeks.map((week) => <option key={week} value={week}>Week {weekLabel(week)}{isWeekLocked(week) ? " · locked" : ""}</option>)}</select></label>
            </div>
          </div>
        </section>

        <nav className={`grid ${hubSiteSelected ? "grid-cols-2" : "grid-cols-1"} gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm`} aria-label="Commissary tool views">
          <button type="button" aria-pressed={activeView === "orders"} onClick={() => setActiveView("orders")} className={`min-h-12 rounded-xl px-4 py-3 text-sm font-black ${activeView === "orders" ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100"}`}>Cafe Orders</button>
          {hubSiteSelected && <button type="button" aria-pressed={activeView === "prep"} onClick={openPrepView} className={`min-h-12 rounded-xl px-4 py-3 text-sm font-black ${activeView === "prep" ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100"}`}>{prepBoardPilot ? "Prep Board" : "Prep List View"}</button>}
        </nav>

        <section className={`rounded-2xl border p-4 ${locked ? "border-slate-300 bg-slate-200 text-slate-700" : "border-emerald-200 bg-emerald-50 text-emerald-950"}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-3">{locked ? <LockKeyhole className="mt-0.5" size={21} /> : <PackageCheck className="mt-0.5" size={21} />}<div><p className="font-black">{activeView === "prep" ? (prepBoardPilot ? "Tabbed Prep Board ready" : locked ? "Prep list ready" : "Waiting for order cutoff") : (locked ? "Ordering closed" : `Ordering open for week ${weekLabel(weekStart)}`)}</p><p className="text-sm font-semibold">Cutoff: {cutoffLabelForWeek(weekStart)}.</p>{activeView === "prep" && prepBoardPilot && <p className="mt-1 font-black">Live Prep Board — active for service weeks beginning December 7.</p>}{activeView === "orders" && locked && <p className="mt-1 font-black">Please contact commissary executive chef to adjust pars.</p>}</div></div>
            <div className="text-right"><p className="text-xs font-black uppercase tracking-[0.12em]">{activeView === "prep" ? "Shared production view" : "Transfer period"}</p><p className="font-black">{activeView === "prep" ? datedDeliveries.map(({ title }) => title).join(" · ") : `Friday ${formatShortDate(period.start)} – Thursday ${formatShortDate(period.end)}`}</p>{activeView === "prep" && <p className="mt-1 text-xs font-bold opacity-70">Auto-refreshes every 15 seconds{prepReloadedAt ? ` · updated ${prepReloadedAt}` : ""}</p>}</div>
          </div>
        </section>

        {activeView === "prep" ? (
          prepBoardPilot
            ? <TabbedPrepBoard records={weekRecords} weekStart={weekStart} hub={prepHub} completed={prepCompleted} saving={prepSaving} onToggle={togglePrepItem} deliveries={datedDeliveries} />
            : <PrepListView records={weekRecords} weekStart={weekStart} hub={prepHub} hubs={COMMISSARY_HUBS.filter(({ key }) => key === prepHub)} onHubChange={setPrepHub} completed={prepCompleted} saving={prepSaving || !locked} onToggle={togglePrepItem} deliveries={datedDeliveries} />
        ) : !cafe ? (
          <section className="rounded-2xl border-2 border-dashed border-sky-200 bg-white p-10 text-center"><Truck className="mx-auto text-sky-600" size={34} /><h2 className="mt-3 text-2xl font-black">Select your cafe to begin</h2><p className="mt-1 text-sm font-semibold text-slate-600">The cafe-first step prevents an order from being entered on another unit’s line.</p></section>
        ) : (
          <section className={`min-w-0 max-w-full overflow-hidden rounded-2xl border border-sky-200 bg-white shadow-sm ${dailyGlobalAvailable ? "flex flex-col [&>*:first-child]:order-1 [&>*:nth-child(2)]:order-first [&>*:nth-child(n+3)]:order-2" : ""} ${locked ? "opacity-75" : ""}`}>
            {!loading && dailyGlobalAvailable && <DailyGlobalOrderingSection cafe={cafe} cycle={dailyGlobalCycle} order={dailyGlobal} weekStart={weekStart} disabled={locked} onQuantity={updateDailyGlobalQuantity} onComponent={updateDailyGlobalComponent} />}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sky-200 px-4 py-3"><div><p className="text-xs font-black uppercase tracking-[0.14em] text-sky-700">{cafe} Cafe</p><h2 className="text-xl font-black">Week {weekLabel(weekStart)} order</h2><p role="status" className={`mt-1 inline-flex items-center gap-1.5 text-xs font-black ${autosaveStatus.state === "error" ? "text-rose-700" : autosaveStatus.state === "saved" ? "text-emerald-700" : "text-slate-500"}`}>{autosaveStatus.state === "saving" ? <LoaderCircle className="animate-spin" size={14} /> : autosaveStatus.state === "saved" ? <CheckCircle2 size={14} /> : <Cloud size={14} />}{autosaveStatus.message}</p></div><div className="text-right"><p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Estimated transfer</p><p className="text-2xl font-black">{money(currentValue)}</p></div></div>
            {!loading && globalAvailable && <div className="border-b-4 border-violet-500 bg-violet-50/40 p-3 md:p-4" data-testid="commissary-global-order"><div className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,32rem)] lg:items-end"><div><p className="text-[11px] font-black uppercase tracking-[0.16em] text-violet-800">Global · Cycle Week {globalCycle.week}</p><h3 className="text-xl font-black">Build the weekly Global order</h3><p className="mt-1 text-xs font-semibold text-slate-600">Choose one menu, then up to three entrees, four sides and two optional sauces. Reviewed recipe preparations flow to the Prep List and transfers automatically.</p></div><label className="text-xs font-black uppercase tracking-[0.12em] text-violet-800">Global menu<select aria-label="Global menu" value={global.menu || ""} disabled={locked} onChange={(event) => selectGlobalMenu(event.target.value)} className="mt-1 block w-full rounded-xl border-2 border-violet-200 bg-white px-3 py-3 text-sm font-black normal-case tracking-normal text-slate-950 disabled:bg-slate-100"><option value="">Select menu</option>{globalCycle.menus.map((menu) => <option key={menu.menu} value={menu.menu}>{menu.label}</option>)}</select></label></div>{dailyGlobalAvailable && savedGlobalQuantity && <p role="alert" className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm font-black text-amber-950">Preserved standing Global order: this week was entered before the 2,2,2 transition. It remains active and editable so no saved quantities are lost.</p>}{global.legacyReviewRequired && <p role="alert" className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm font-black text-amber-950">This legacy order exceeds the new one-menu slot rules. Its quantities remain intact in value, prep, transfers and packout output. {locked ? "This locked order remains read-only." : "Choose one menu to replace its Global quantities before saving."}</p>}{GLOBAL_UNIT_PREPARATION_NOTES[global.menu] && <p className="mb-4 rounded-xl border border-violet-200 bg-white px-3 py-2 text-xs font-bold text-violet-950">{GLOBAL_UNIT_PREPARATION_NOTES[global.menu]}</p>}{global.menu ? (() => { const selectedMenu = globalCycle.menus.find((menu) => menu.menu === global.menu); const entreeOptions = selectedMenu?.items.filter(({ category }) => category === "entree") || []; const sideOptions = selectedMenu?.items.filter(({ category }) => category === "side") || []; const sauceOptions = selectedMenu?.items.filter(({ category }) => category === "subRecipe") || []; return <div className="grid gap-4 xl:grid-cols-2"><GlobalSelectionGroup title="Entrees" slots={global.selections.entrees} options={entreeOptions} items={global.items} quantities={global.quantities} deliveries={datedDeliveries} disabled={locked} onSelect={(index, id) => selectGlobalItem("entrees", index, id)} onQuantity={updateGlobalQuantity} /><GlobalSelectionGroup title="Sides" slots={global.selections.sides} options={sideOptions} items={global.items} quantities={global.quantities} deliveries={datedDeliveries} disabled={locked} onSelect={(index, id) => selectGlobalItem("sides", index, id)} onQuantity={updateGlobalQuantity} />{sauceOptions.length > 0 && <GlobalSelectionGroup title="Optional sauces" slots={global.selections.sauces} options={sauceOptions} items={global.items} quantities={global.quantities} deliveries={datedDeliveries} disabled={locked} onSelect={(index, id) => selectGlobalItem("sauces", index, id)} onQuantity={updateGlobalQuantity} />}</div>; })() : <p className="rounded-xl border border-dashed border-violet-300 bg-white p-5 text-center text-sm font-bold text-slate-500">Select the Global menu to reveal its entree, side and optional sauce slots.</p>}</div>}
            {!loading && roxanneDawsonAvailable && <RoxanneDawsonOrderingSection projection={roxanneProjection} order={roxanneDawson} deliveries={datedDeliveries} disabled={locked} onQuantity={updateRoxanneDawsonQuantity} onResolveLegacyFriday={resolveRoxanneLegacyFriday} />}
            {!loading && roxanneCricketAvailable && <RoxanneSoupOrderingSection cafe={cafe} projection={roxanneSoupProjection} order={roxanneSoup} weekStart={weekStart} disabled={locked} onQuantity={updateRoxanneSoupQuantity} />}
            {!loading && roxanneCricketAvailable && <RoxanneFlatbreadOrderingSection cycle={roxanneFlatbreadCycle} order={roxanneFlatbreads} deliveries={datedDeliveries} disabled={locked} onQuantity={updateRoxanneFlatbreadQuantity} />}
            {!loading && cafe === "Roxanne Coffee" && weekStart >= "2026-12-07" && <FreshFiveOrderingSection order={freshFive} deliveries={datedDeliveries} disabled={locked} onQuantity={updateFreshFiveQuantity} />}
            {!loading && breakfastAvailable && <div className="border-b-4 border-orange-500 bg-orange-50/40 p-3 md:p-4" data-testid="commissary-breakfast-order"><div className="mb-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,32rem)] lg:items-end"><div><p className="text-[11px] font-black uppercase tracking-[0.16em] text-orange-800">Breakfast · AMZ: Breakfast</p><h3 className="text-xl font-black">Order breakfast sandwiches, croissants, bagels and burritos</h3><p className="mt-1 text-xs font-semibold text-slate-600">Add only the items you need, enter whole finished-item quantities, and the Prep List will roll them into exact recipe components.</p></div><label className="text-xs font-black uppercase tracking-[0.12em] text-orange-800">Add breakfast item<select aria-label="Add breakfast item" value={breakfastAddId} disabled={locked} onChange={(event) => { setBreakfastAddId(event.target.value); addBreakfastItem(event.target.value); }} className="mt-1 block w-full rounded-xl border-2 border-orange-200 bg-white px-3 py-3 text-sm font-black normal-case tracking-normal text-slate-950 disabled:bg-slate-100"><option value="">Select an item</option>{BREAKFAST_ORDERING_PROGRAM.items.filter(({ id }) => !breakfast.selections.includes(id)).map((option) => <option key={option.id} value={option.id}>{option.name} · MRN {option.mrn}</option>)}</select></label></div>{breakfast.selections.length ? <div className="grid gap-3 xl:grid-cols-2">{breakfast.selections.map((id) => { const option = BREAKFAST_ORDERING_PROGRAM.items.find((row) => row.id === id); return option ? <BreakfastItemOrder key={id} option={option} item={breakfast.items[id]} quantities={breakfast.quantities[id]} deliveries={datedDeliveries} disabled={locked} onQuantity={updateBreakfastQuantity} onRemove={() => removeBreakfastItem(id)} /> : null; })}</div> : <p className="rounded-xl border border-dashed border-orange-300 bg-white p-4 text-center text-sm font-bold text-slate-500">Add a sandwich, croissant, bagel or burrito to begin. Plates, sides and cereals are excluded.</p>}</div>}
            {loading ? <p className="p-8 text-center font-bold text-slate-600">Loading shared order…</p> : <><div className={`${saladBarAvailable ? "" : "hidden"} border-b border-slate-200 px-4 py-3`}><p className="text-xs font-black uppercase tracking-[0.14em] text-sky-700">Salad bar</p><p className="text-sm font-semibold text-slate-600">Grouped as leafy greens, vegetables, proteins, cheeses, crunchy toppers and dressings. Whole-package items must be ordered as complete bags or containers.</p></div><div className={`${saladBarAvailable ? "" : "hidden"} w-full min-w-0 max-w-full overflow-x-auto overscroll-x-contain`}><table className="min-w-max border-collapse text-sm"><thead><tr><th className="sticky left-0 z-20 w-52 border-b border-r border-slate-200 bg-slate-950 px-4 py-3 text-left text-white">Delivery</th>{saladBarItems.map((row) => <th key={row.id} className="w-44 max-w-44 border-b border-r border-slate-700 bg-slate-950 px-3 py-3 align-top text-left text-white"><span className="block text-[10px] font-black uppercase tracking-[0.1em] text-sky-300">{row.category}</span><span className="mt-1 block leading-5">{row.name}</span><span className="mt-1 block text-[11px] font-semibold text-slate-300">MRN {row.mrn} · {row.orderUnit}</span><span className="block text-[11px] font-semibold text-emerald-300">{money(row.orderUnitCost)} / {row.orderUnit}</span>{row.retired && <span className="mt-1 block text-[10px] font-black uppercase tracking-wide text-amber-300">Saved standing unit</span>}</th>)}</tr></thead><tbody>{datedDeliveries.map((delivery) => <tr key={delivery.key}><th className="sticky left-0 z-10 border-b border-r border-slate-200 bg-sky-50 px-4 py-4 text-left"><span className="block font-black">{delivery.title}</span><span className="block text-xs font-semibold text-slate-500">{delivery.detail}</span></th>{saladBarItems.map((row) => <td key={row.id} className="border-b border-r border-slate-200 p-2"><input aria-label={`${delivery.title} ${row.name} quantity`} type="number" min="0" step={row.quantityIncrement || 0.25} disabled={locked} value={quantities[row.id]?.[delivery.key] ?? 0} onChange={(event) => updateQuantity(row.id, delivery.key, event.target.value)} className="w-full rounded-lg border border-slate-300 px-2 py-2 text-center font-black disabled:cursor-not-allowed disabled:bg-slate-200" /></td>)}</tr>)}</tbody></table></div><GrillOrderingSection grillAvailable={grillAvailable} grillCoreAvailable={grillCoreAvailable} grillCycle={grillCycle} grill={grill} catalogByMrn={grillCatalogByMrn} deliveries={datedDeliveries} disabled={locked} density={metadata.grillInterface?.density} onSelectLto={selectGrillItem} onLtoQuantity={updateGrillQuantity} onCoreQuantity={updateGrillCoreQuantity} />{deliAvailable && <div className="border-t-4 border-sky-500 bg-sky-50/40 p-3 md:p-4" data-testid="commissary-deli-order"><div className="mb-3 grid gap-1 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-end lg:gap-x-4"><div><p className="text-[11px] font-black uppercase tracking-[0.16em] text-sky-800">Deli Core · Cycle Week {deliCycle.week}</p><h3 className="text-xl font-black">Order weekly Deli sandwiches</h3></div><p className="text-xs font-semibold text-slate-600 lg:pb-0.5">Enter whole finished-sandwich quantities for each delivery. The Prep List converts them into direct recipe ingredients and immediate sub-recipes.</p></div><div className="grid gap-3 xl:grid-cols-2">{deliCycle.items.map((option) => <DeliItemOrder key={option.mrn} option={option} item={deli.items[option.mrn] || deliCatalogByMrn.get(option.mrn)} quantities={deli.quantities[option.mrn]} deliveries={datedDeliveries} disabled={locked} onQuantity={updateDeliQuantity} />)}</div></div>}</>}
            {!loading && deliAvailable && Boolean(deli.standingOrderMrns?.length) && <div className="border-t border-amber-300 bg-amber-50/60 p-3 md:p-4" data-testid="commissary-deli-standing-orders"><p className="mb-3 text-xs font-black text-amber-950">Saved standing orders are preserved. Change a quantity only if you intend to revise this week.</p><div className="grid gap-3 xl:grid-cols-2">{deli.standingOrderMrns.map((mrn) => <DeliItemOrder key={mrn} option={{ mrn, name: deli.items[mrn]?.item || `MRN ${mrn}`, standing: true }} item={deli.items[mrn]} quantities={deli.quantities[mrn]} deliveries={datedDeliveries} disabled={locked} onQuantity={updateDeliQuantity} />)}</div></div>}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 p-4"><div><p className="text-xs font-semibold text-slate-600">Most gallon items may be ordered in 0.25-gallon increments. Dressings, vinaigrettes, leafy-green bags and cheese containers are whole units only. Saved standing orders retain their original units and are never changed without confirmation.</p><p className="mt-1 inline-flex items-center gap-1.5 text-xs font-black text-emerald-700"><Cloud size={14} /> No Save button needed — every selection and quantity autosaves.</p></div><div className={`grid w-full gap-2 sm:grid-cols-2 xl:w-auto ${hubSiteSelected ? "xl:grid-cols-3" : "xl:grid-cols-1"}`}><button type="button" onClick={generateCurrentTransfer} disabled={loading || !currentHasOrder} className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-slate-400"><Download size={17} /> Generate transfers</button>{hubSiteSelected && <><button type="button" onClick={generateCurrentBom} disabled={loading || !currentHasOrder} className="inline-flex items-center justify-center gap-2 rounded-lg border border-sky-300 bg-sky-50 px-4 py-3 text-sm font-black text-sky-950 disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-200 disabled:text-slate-500"><FileSpreadsheet size={17} /> Prep List</button><button type="button" onClick={generatePackoutPacket} disabled={loading || !weekRecords.length} className="inline-flex items-center justify-center gap-2 rounded-lg border border-violet-300 bg-violet-50 px-4 py-3 text-sm font-black text-violet-950 disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-200 disabled:text-slate-500"><FileDown size={17} /> Packout Packet</button></>}</div></div>
          </section>
        )}

        {(notice || error) && <div role={error ? "alert" : "status"} className={`rounded-xl border p-4 text-sm font-black ${error ? "border-rose-300 bg-rose-50 text-rose-900" : "border-emerald-300 bg-emerald-50 text-emerald-900"}`}>{error || notice}</div>}

        {activeView === "orders" && locked && (
              <section className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Locked production package</p><h2 className="mt-1 text-2xl font-black">{hubSiteSelected ? "Prep List and accounting exports" : "Accounting export"}</h2><p className="mt-1 text-sm font-semibold text-slate-600">{hubSiteSelected ? "The Prep List rolls up only sites routed to this commissary hub and preserves a delivery-level unit breakdown. " : ""}The S4 transfer consolidates Friday, Monday and Wednesday into one line per item.</p></div><div className="flex flex-wrap gap-2">{hubSiteSelected && <button type="button" onClick={() => runExport(() => exportCommissaryBom(weekRecords, weekStart, metadata, { hub: cafe }))} disabled={!weekRecords.length} className="inline-flex items-center gap-2 rounded-lg border border-sky-300 bg-sky-50 px-4 py-3 text-sm font-black text-sky-950 disabled:opacity-40"><FileSpreadsheet size={18} /> Download combined Prep List</button>}<button type="button" onClick={() => runExport(() => exportCommissaryTransfer(currentRecord, metadata))} disabled={!currentRecord || !hasCommissaryOrder(currentRecord)} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-black text-white disabled:opacity-40"><Download size={18} /> Download {cafe || "cafe"} S4 transfer</button></div></div>
          </section>
        )}
      </main>
    </div>
  );
}
