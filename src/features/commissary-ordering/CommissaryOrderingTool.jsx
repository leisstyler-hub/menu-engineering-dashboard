import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Download, FileSpreadsheet, LockKeyhole, PackageCheck, Save, Truck } from "lucide-react";

import { money } from "../../shared/formatting.js";
import { loadOperationalMetadata } from "../../shared/operationalMetadataStorage.js";
import { refreshTransferCatalogCosts } from "../transfer-tool/transferStorage.js";
import PlatformSettings from "../../shared/ui/PlatformSettings.jsx";
import VersionStamp from "../../shared/ui/VersionStamp.jsx";
import PrepListView from "./PrepListView.jsx";
import { COMMISSARY_ORDER_ITEMS } from "./commissaryCatalog.js";
import { exportCommissaryBom, exportCommissaryTransfer } from "./commissaryExport.js";
import { DEFAULT_COMMISSARY_METADATA, resolveCommissaryMetadata } from "./commissaryMetadata.js";
import {
  addDays,
  buildOrderRecord,
  cutoffLabelForWeek,
  emptyQuantities,
  emptyGrillOrder,
  firstOpenWeek,
  formatShortDate,
  isWeekLocked,
  latestPrepWeek,
  normalizeQuantities,
  normalizeGrillOrder,
  normalizePrepCompleted,
  orderValue,
  selectableWeeks,
  transferPeriod,
  weekLabel,
  buildPrepProgressRecord,
  togglePrepCompleted,
  grillCycleForWeek,
  isGrillEligibleCafe,
} from "./commissaryModel.js";
import { loadCommissaryRecords, saveCommissaryOrder, saveCommissaryPrepProgress } from "./commissaryStorage.js";

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

function weekOptions(now = new Date()) {
  const open = firstOpenWeek(now);
  const earlier = Array.from({ length: 8 }, (_, index) => addDays(open, -(8 - index) * 7));
  return [...earlier, ...selectableWeeks(now, 16)];
}

export default function CommissaryOrderingTool({ onBackToPlatform, onOpenSmartsheetHealth }) {
  const [activeView, setActiveView] = useState("orders");
  const [cafe, setCafe] = useState("");
  const [weekStart, setWeekStart] = useState(() => firstOpenWeek());
  const [orders, setOrders] = useState([]);
  const [prepProgressRecords, setPrepProgressRecords] = useState([]);
  const [metadata, setMetadata] = useState(() => ({ ...DEFAULT_COMMISSARY_METADATA, source: "fallback" }));
  const [quantities, setQuantities] = useState(() => emptyQuantities());
  const [grill, setGrill] = useState(() => emptyGrillOrder(firstOpenWeek()));
  const [grillCatalog, setGrillCatalog] = useState([]);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prepSaving, setPrepSaving] = useState(false);

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const weeks = useMemo(() => weekOptions(), []);
  const locked = isWeekLocked(weekStart, now);
  const currentRecord = useMemo(() => orders.find((row) => recordKey(row.cafe, row.weekStart) === recordKey(cafe, weekStart)), [cafe, orders, weekStart]);
  const weekRecords = useMemo(() => orders.filter((row) => row.weekStart === weekStart && metadata.receivingCafes.some(({ name }) => name === row.cafe)), [metadata.receivingCafes, orders, weekStart]);
  const prepProgressRecord = useMemo(() => prepProgressRecords.find((row) => row.weekStart === weekStart), [prepProgressRecords, weekStart]);
  const prepCompleted = useMemo(() => normalizePrepCompleted(prepProgressRecord?.completed), [prepProgressRecord]);
  const currentValue = orderValue(quantities, grill);
  const period = transferPeriod(weekStart);
  const grillCycle = grillCycleForWeek(weekStart);
  const grillAvailable = Boolean(grillCycle && isGrillEligibleCafe(cafe));
  const grillCatalogByMrn = useMemo(() => new Map(grillCatalog.map((item) => [String(item.mrn), item])), [grillCatalog]);

  useEffect(() => {
    let mounted = true;
    const liveGrillCatalog = refreshTransferCatalogCosts().catch((catalogError) => ({ items: [], catalogError }));
    Promise.all([loadCommissaryRecords(), loadOperationalMetadata(), liveGrillCatalog]).then(([records, operationalMetadata, liveCatalog]) => {
      if (mounted) {
        setOrders(records.filter((record) => record["Record Type"] === "Commissary Order"));
        setPrepProgressRecords(records.filter((record) => record["Record Type"] === "Commissary Prep Progress"));
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
        if (liveCatalog.catalogError) setError(`Grill LTO live costs are unavailable: ${liveCatalog.catalogError.message}`);
      }
    }).catch((loadError) => {
      if (mounted) setError(loadError.message);
    }).finally(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    setQuantities(normalizeQuantities(currentRecord?.quantities || {}, {
      orderUnitVersion: currentRecord ? currentRecord.orderUnitVersion ?? 1 : undefined,
    }));
    setGrill(normalizeGrillOrder(currentRecord?.grill || {}, weekStart, cafe));
  }, [cafe, currentRecord, weekStart]);

  const updateQuantity = (itemId, delivery, value) => {
    setQuantities((current) => ({
      ...current,
      [itemId]: { ...current[itemId], [delivery]: value === "" ? "" : Math.max(0, Number(value)) },
    }));
  };

  const selectGrillItem = (setKey, mrn) => {
    const item = grillCatalogByMrn.get(mrn);
    setGrill((current) => ({
      ...current,
      selections: { ...current.selections, [setKey]: mrn },
      items: { ...current.items, [setKey]: item ? { mrn, item: item.item, portion: item.portion, itemWasteCost: item.itemWasteCost } : null },
    }));
  };

  const updateGrillQuantity = (setKey, delivery, value) => {
    setGrill((current) => ({
      ...current,
      quantities: { ...current.quantities, [setKey]: { ...current.quantities[setKey], [delivery]: value === "" ? "" : Math.max(0, Math.floor(Number(value))) } },
    }));
  };

  const saveOrder = async () => {
    if (!cafe) return setError("Select your cafe before entering an order.");
    if (locked) return setError("This order is locked. Please contact commissary executive chef to adjust pars.");
    if (grillAvailable && (!grill.selections.A || !grill.selections.B)) return setError("Choose one Grill LTO sandwich from Set A and one from Set B before saving.");
    setSaving(true);
    setError("");
    setNotice("");
    const record = buildOrderRecord({ cafe, weekStart, quantities, grill });
    try {
      await saveCommissaryOrder(record);
      setOrders((current) => [...current.filter((row) => recordKey(row.cafe, row.weekStart) !== recordKey(cafe, weekStart)), record]);
      setNotice(`${cafe}'s order for week ${weekLabel(weekStart)} was saved.`);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

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
    const record = buildOrderRecord({ cafe, weekStart, quantities, grill });
    return runExport(() => exportCommissaryTransfer(record, metadata));
  };

  const generateCurrentBom = () => {
    if (!cafe) return setError("Select your cafe before generating the Prep List.");
    const current = buildOrderRecord({ cafe, weekStart, quantities, grill });
    const records = [
      ...weekRecords.filter((record) => record.cafe !== cafe),
      current,
    ].filter((record) => orderValue(record.quantities, record.grill) > 0);
    return runExport(() => exportCommissaryBom(records, weekStart, metadata));
  };

  const openPrepView = () => {
    setActiveView("prep");
    setWeekStart(latestPrepWeek());
    setNotice("");
    setError("");
  };

  const togglePrepItem = async (delivery, itemId) => {
    if (!locked || prepSaving) return;
    const previous = prepProgressRecord || buildPrepProgressRecord({ weekStart, completed: {} });
    const next = buildPrepProgressRecord({ weekStart, completed: togglePrepCompleted(previous.completed, delivery, itemId) });
    setPrepProgressRecords((current) => [...current.filter((row) => row.weekStart !== weekStart), next]);
    setPrepSaving(true);
    setError("");
    try {
      await saveCommissaryPrepProgress(next);
    } catch (saveError) {
      setPrepProgressRecords((current) => [...current.filter((row) => row.weekStart !== weekStart), ...(prepProgressRecord ? [prepProgressRecord] : [])]);
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
              <p className="mt-2 max-w-3xl text-sm font-semibold text-slate-600">Choose your cafe, then enter each delivery quantity. Orders lock at 5:00 PM local Pacific time on the Wednesday before service.</p>
            </div>
            <div className={`grid w-full grid-cols-1 gap-3 xl:w-auto ${activeView === "orders" ? "sm:grid-cols-2 xl:min-w-[30rem]" : "xl:min-w-[15rem]"}`}>
              {activeView === "orders" && <label className="min-w-0 text-xs font-black uppercase tracking-[0.12em] text-slate-600">Your cafe<select aria-label="Your cafe" value={cafe} onChange={(event) => { setCafe(event.target.value); setNotice(""); setError(""); }} className="mt-1 block w-full min-w-0 max-w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-black text-slate-950"><option value="">Select cafe</option>{metadata.receivingCafes.map((row) => <option key={row.name} value={row.name}>{row.displayName} · {row.profitCenter}</option>)}</select></label>}
              <label className="min-w-0 text-xs font-black uppercase tracking-[0.12em] text-slate-600">Service week<select aria-label="Service week" value={weekStart} onChange={(event) => { setWeekStart(event.target.value); setNotice(""); setError(""); }} className="mt-1 block w-full min-w-0 max-w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-black text-slate-950">{weeks.map((week) => <option key={week} value={week}>Week {weekLabel(week)}{isWeekLocked(week) ? " · locked" : ""}</option>)}</select></label>
            </div>
          </div>
        </section>

        <nav className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm" aria-label="Commissary tool views">
          <button type="button" aria-pressed={activeView === "orders"} onClick={() => setActiveView("orders")} className={`min-h-12 rounded-xl px-4 py-3 text-sm font-black ${activeView === "orders" ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100"}`}>Cafe Orders</button>
          <button type="button" aria-pressed={activeView === "prep"} onClick={openPrepView} className={`min-h-12 rounded-xl px-4 py-3 text-sm font-black ${activeView === "prep" ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100"}`}>Prep List View</button>
        </nav>

        <section className={`rounded-2xl border p-4 ${locked ? "border-slate-300 bg-slate-200 text-slate-700" : "border-emerald-200 bg-emerald-50 text-emerald-950"}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-3">{locked ? <LockKeyhole className="mt-0.5" size={21} /> : <PackageCheck className="mt-0.5" size={21} />}<div><p className="font-black">{activeView === "prep" ? (locked ? "Prep list ready" : "Waiting for order cutoff") : (locked ? "Ordering closed" : `Ordering open for week ${weekLabel(weekStart)}`)}</p><p className="text-sm font-semibold">Cutoff: {cutoffLabelForWeek(weekStart)}.</p>{activeView === "orders" && locked && <p className="mt-1 font-black">Please contact commissary executive chef to adjust pars.</p>}</div></div>
            <div className="text-right"><p className="text-xs font-black uppercase tracking-[0.12em]">{activeView === "prep" ? "Shared production view" : "Transfer period"}</p><p className="font-black">{activeView === "prep" ? "Friday, Monday and Wednesday deliveries" : `Friday ${formatShortDate(period.start)} – Thursday ${formatShortDate(period.end)}`}</p></div>
          </div>
        </section>

        {activeView === "prep" ? (
          <PrepListView records={weekRecords} weekStart={weekStart} completed={prepCompleted} saving={prepSaving || !locked} onToggle={togglePrepItem} deliveries={metadata.deliveries} />
        ) : !cafe ? (
          <section className="rounded-2xl border-2 border-dashed border-sky-200 bg-white p-10 text-center"><Truck className="mx-auto text-sky-600" size={34} /><h2 className="mt-3 text-2xl font-black">Select your cafe to begin</h2><p className="mt-1 text-sm font-semibold text-slate-600">The cafe-first step prevents an order from being entered on another unit’s line.</p></section>
        ) : (
          <section className={`min-w-0 max-w-full overflow-hidden rounded-2xl border border-sky-200 bg-white shadow-sm ${locked ? "opacity-75" : ""}`}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sky-200 px-4 py-3"><div><p className="text-xs font-black uppercase tracking-[0.14em] text-sky-700">{cafe} Cafe</p><h2 className="text-xl font-black">Week {weekLabel(weekStart)} order</h2></div><div className="text-right"><p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Estimated transfer</p><p className="text-2xl font-black">{money(currentValue)}</p></div></div>
            {loading ? <p className="p-8 text-center font-bold text-slate-600">Loading shared order…</p> : <><div className="border-b border-slate-200 px-4 py-3"><p className="text-xs font-black uppercase tracking-[0.14em] text-sky-700">Salad bar</p><p className="text-sm font-semibold text-slate-600">Order gallon bags and specialty containers by delivery.</p></div><div className="w-full min-w-0 max-w-full overflow-x-auto overscroll-x-contain"><table className="min-w-max border-collapse text-sm"><thead><tr><th className="sticky left-0 z-20 w-52 border-b border-r border-slate-200 bg-slate-950 px-4 py-3 text-left text-white">Delivery</th>{COMMISSARY_ORDER_ITEMS.map((row) => <th key={row.id} className="w-44 max-w-44 border-b border-r border-slate-700 bg-slate-950 px-3 py-3 align-top text-left text-white"><span className="block text-[10px] font-black uppercase tracking-[0.1em] text-sky-300">{row.category}</span><span className="mt-1 block leading-5">{row.name}</span><span className="mt-1 block text-[11px] font-semibold text-slate-300">MRN {row.mrn} · {row.orderUnit}</span><span className="block text-[11px] font-semibold text-emerald-300">{money(row.orderUnitCost)} / {row.orderUnit}</span></th>)}</tr></thead><tbody>{metadata.deliveries.map((delivery) => <tr key={delivery.key}><th className="sticky left-0 z-10 border-b border-r border-slate-200 bg-sky-50 px-4 py-4 text-left"><span className="block font-black">{delivery.title}</span><span className="block text-xs font-semibold text-slate-500">{delivery.detail}</span></th>{COMMISSARY_ORDER_ITEMS.map((row) => <td key={row.id} className="border-b border-r border-slate-200 p-2"><input aria-label={`${delivery.title} ${row.name} quantity`} type="number" min="0" step="0.25" disabled={locked} value={quantities[row.id]?.[delivery.key] ?? 0} onChange={(event) => updateQuantity(row.id, delivery.key, event.target.value)} className="w-full rounded-lg border border-slate-300 px-2 py-2 text-center font-black disabled:cursor-not-allowed disabled:bg-slate-200" /></td>)}</tr>)}</tbody></table></div>{grillAvailable && <div className="border-t-4 border-amber-400 bg-amber-50/40 p-3 md:p-4" data-testid="commissary-grill-order" data-density={metadata.grillInterface?.density || "compact"}><div className="mb-3 grid gap-1 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-end lg:gap-x-4"><div><p className="text-[11px] font-black uppercase tracking-[0.16em] text-amber-800">Grill LTO · Cycle Week {grillCycle.week}</p><h3 className="text-xl font-black">Choose one sandwich from each set</h3></div><p className="text-xs font-semibold text-slate-600 lg:pb-0.5">Order whole finished sandwiches for Friday, Monday and Wednesday delivery. The Prep List rolls each count into its direct ingredients and immediate sub-recipes.</p></div><div className="grid gap-3 lg:grid-cols-2"><GrillSetOrder setKey="A" options={grillCycle.setA} selectedMrn={grill.selections.A} quantities={grill.quantities.A} deliveries={metadata.deliveries} catalogByMrn={grillCatalogByMrn} disabled={locked} onSelect={selectGrillItem} onQuantity={updateGrillQuantity} /><GrillSetOrder setKey="B" options={grillCycle.setB} selectedMrn={grill.selections.B} quantities={grill.quantities.B} deliveries={metadata.deliveries} catalogByMrn={grillCatalogByMrn} disabled={locked} onSelect={selectGrillItem} onQuantity={updateGrillQuantity} /></div></div>}</>}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 p-4"><p className="text-xs font-semibold text-slate-600">Gallon bags may be ordered in 0.25-gallon increments. Specialty dressings retain the container units specified in the costing source.</p><div className="flex flex-col gap-2"><button type="button" onClick={saveOrder} disabled={locked || saving || loading} className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-slate-400"><Save size={17} />{saving ? "Saving…" : "Save shared order"}</button><button type="button" onClick={generateCurrentTransfer} disabled={loading || currentValue <= 0} className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-slate-400"><Download size={17} /> Generate transfer</button><button type="button" onClick={generateCurrentBom} disabled={loading || currentValue <= 0} className="inline-flex items-center justify-center gap-2 rounded-lg border border-sky-300 bg-sky-50 px-5 py-3 text-sm font-black text-sky-950 disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-200 disabled:text-slate-500"><FileSpreadsheet size={17} /> Generate Prep List</button></div></div>
          </section>
        )}

        {(notice || error) && <div role={error ? "alert" : "status"} className={`rounded-xl border p-4 text-sm font-black ${error ? "border-rose-300 bg-rose-50 text-rose-900" : "border-emerald-300 bg-emerald-50 text-emerald-900"}`}>{error || notice}</div>}

        {activeView === "orders" && locked && (
              <section className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Locked production package</p><h2 className="mt-1 text-2xl font-black">Prep List and accounting exports</h2><p className="mt-1 text-sm font-semibold text-slate-600">The Prep List rolls up all saved cafe quantities and preserves a delivery-level unit breakdown. The S4 transfer consolidates Friday, Monday and Wednesday into one line per item.</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => runExport(() => exportCommissaryBom(weekRecords, weekStart, metadata))} disabled={!weekRecords.length} className="inline-flex items-center gap-2 rounded-lg border border-sky-300 bg-sky-50 px-4 py-3 text-sm font-black text-sky-950 disabled:opacity-40"><FileSpreadsheet size={18} /> Download combined Prep List</button><button type="button" onClick={() => runExport(() => exportCommissaryTransfer(currentRecord, metadata))} disabled={!currentRecord || orderValue(currentRecord.quantities, currentRecord.grill) <= 0} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-black text-white disabled:opacity-40"><Download size={18} /> Download {cafe || "cafe"} S4 transfer</button></div></div>
          </section>
        )}
      </main>
    </div>
  );
}
