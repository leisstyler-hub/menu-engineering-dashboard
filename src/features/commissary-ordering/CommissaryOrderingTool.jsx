import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Download, FileSpreadsheet, LockKeyhole, PackageCheck, Save, Truck } from "lucide-react";

import { money } from "../../shared/formatting.js";
import PlatformSettings from "../../shared/ui/PlatformSettings.jsx";
import VersionStamp from "../../shared/ui/VersionStamp.jsx";
import { COMMISSARY_ORDER_ITEMS, COMMISSARY_RECEIVING_CAFES } from "./commissaryCatalog.js";
import { exportCommissaryBom, exportCommissaryTransfer } from "./commissaryExport.js";
import {
  addDays,
  buildOrderRecord,
  cutoffDateForWeek,
  emptyQuantities,
  firstOpenWeek,
  formatShortDate,
  isWeekLocked,
  normalizeQuantities,
  orderValue,
  selectableWeeks,
  transferPeriod,
  weekLabel,
} from "./commissaryModel.js";
import { loadCommissaryOrders, saveCommissaryOrder } from "./commissaryStorage.js";

const DELIVERY_ROWS = [
  { key: "monday", title: "Monday delivery", detail: "Monday–Wednesday service" },
  { key: "wednesday", title: "Wednesday delivery", detail: "Thursday–Friday service" },
];

const recordKey = (cafe, weekStart) => `${cafe}|${weekStart}`;

function weekOptions(now = new Date()) {
  const open = firstOpenWeek(now);
  const earlier = Array.from({ length: 8 }, (_, index) => addDays(open, -(8 - index) * 7));
  return [...earlier, ...selectableWeeks(now, 16)];
}

export default function CommissaryOrderingTool({ onBackToPlatform, onOpenSmartsheetHealth }) {
  const [cafe, setCafe] = useState("");
  const [weekStart, setWeekStart] = useState(() => firstOpenWeek());
  const [orders, setOrders] = useState([]);
  const [quantities, setQuantities] = useState(() => emptyQuantities());
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const weeks = useMemo(() => weekOptions(), []);
  const locked = isWeekLocked(weekStart);
  const currentRecord = useMemo(() => orders.find((row) => recordKey(row.cafe, row.weekStart) === recordKey(cafe, weekStart)), [cafe, orders, weekStart]);
  const weekRecords = useMemo(() => orders.filter((row) => row.weekStart === weekStart && COMMISSARY_RECEIVING_CAFES.some(({ name }) => name === row.cafe)), [orders, weekStart]);
  const currentValue = orderValue(quantities);
  const period = transferPeriod(weekStart);

  useEffect(() => {
    let mounted = true;
    loadCommissaryOrders().then((records) => {
      if (mounted) setOrders(records);
    }).catch((loadError) => {
      if (mounted) setError(loadError.message);
    }).finally(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    setQuantities(normalizeQuantities(currentRecord?.quantities || {}));
  }, [cafe, currentRecord, weekStart]);

  const updateQuantity = (itemId, delivery, value) => {
    setQuantities((current) => ({
      ...current,
      [itemId]: { ...current[itemId], [delivery]: value === "" ? "" : Math.max(0, Number(value)) },
    }));
  };

  const saveOrder = async () => {
    if (!cafe) return setError("Select your cafe before entering an order.");
    if (locked) return setError("This order is locked. Please contact commissary executive chef to adjust pars.");
    setSaving(true);
    setError("");
    setNotice("");
    const record = buildOrderRecord({ cafe, weekStart, quantities });
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
    const record = buildOrderRecord({ cafe, weekStart, quantities });
    return runExport(() => exportCommissaryTransfer(record));
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[120rem] flex-wrap items-center justify-between gap-3 px-4 py-4 md:px-8">
          <button type="button" onClick={onBackToPlatform} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-black hover:bg-slate-50"><ArrowLeft size={17} /> Home</button>
          <div className="flex items-center gap-2"><PlatformSettings onOpenSmartsheetHealth={onOpenSmartsheetHealth} /><VersionStamp /></div>
        </div>
      </header>

      <main className="mx-auto max-w-[120rem] space-y-5 px-4 py-6 md:px-8">
        <section className="rounded-2xl border border-sky-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2"><p className="text-xs font-black uppercase tracking-[0.18em] text-sky-700">Commissary production</p><span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-amber-900">Draft</span></div>
              <h1 className="mt-2 text-3xl font-black md:text-5xl">Commissary Ordering Tool</h1>
              <p className="mt-2 max-w-3xl text-sm font-semibold text-slate-600">Choose your cafe, then enter each delivery quantity. Orders lock at 5:00 PM local Pacific time on the Wednesday before service.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-black uppercase tracking-[0.12em] text-slate-600">Your cafe<select aria-label="Your cafe" value={cafe} onChange={(event) => { setCafe(event.target.value); setNotice(""); setError(""); }} className="mt-1 block min-w-48 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-black text-slate-950"><option value="">Select cafe</option>{COMMISSARY_RECEIVING_CAFES.map((row) => <option key={row.name} value={row.name}>{row.name} Cafe · PC {row.profitCenter}</option>)}</select></label>
              <label className="text-xs font-black uppercase tracking-[0.12em] text-slate-600">Service week<select aria-label="Service week" value={weekStart} onChange={(event) => { setWeekStart(event.target.value); setNotice(""); setError(""); }} className="mt-1 block min-w-48 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-black text-slate-950">{weeks.map((week) => <option key={week} value={week}>Week {weekLabel(week)}{isWeekLocked(week) ? " · locked" : ""}</option>)}</select></label>
            </div>
          </div>
        </section>

        <section className={`rounded-2xl border p-4 ${locked ? "border-slate-300 bg-slate-200 text-slate-700" : "border-emerald-200 bg-emerald-50 text-emerald-950"}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-3">{locked ? <LockKeyhole className="mt-0.5" size={21} /> : <PackageCheck className="mt-0.5" size={21} />}<div><p className="font-black">{locked ? "Ordering closed" : `Ordering open for week ${weekLabel(weekStart)}`}</p><p className="text-sm font-semibold">Cutoff: Wednesday {formatShortDate(cutoffDateForWeek(weekStart))} at 5:00 PM Pacific.</p>{locked && <p className="mt-1 font-black">Please contact commissary executive chef to adjust pars.</p>}</div></div>
            <div className="text-right"><p className="text-xs font-black uppercase tracking-[0.12em]">Transfer period</p><p className="font-black">Friday {formatShortDate(period.start)} – Thursday {formatShortDate(period.end)}</p></div>
          </div>
        </section>

        {!cafe ? (
          <section className="rounded-2xl border-2 border-dashed border-sky-200 bg-white p-10 text-center"><Truck className="mx-auto text-sky-600" size={34} /><h2 className="mt-3 text-2xl font-black">Select your cafe to begin</h2><p className="mt-1 text-sm font-semibold text-slate-600">The cafe-first step prevents an order from being entered on another unit’s line.</p></section>
        ) : (
          <section className={`overflow-hidden rounded-2xl border border-sky-200 bg-white shadow-sm ${locked ? "opacity-75" : ""}`}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sky-200 px-4 py-3"><div><p className="text-xs font-black uppercase tracking-[0.14em] text-sky-700">{cafe} Cafe</p><h2 className="text-xl font-black">Week {weekLabel(weekStart)} order</h2></div><div className="text-right"><p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Estimated transfer</p><p className="text-2xl font-black">{money(currentValue)}</p></div></div>
            {loading ? <p className="p-8 text-center font-bold text-slate-600">Loading shared order…</p> : <div className="overflow-x-auto"><table className="min-w-max border-collapse text-sm"><thead><tr><th className="sticky left-0 z-20 w-52 border-b border-r border-slate-200 bg-slate-950 px-4 py-3 text-left text-white">Delivery</th>{COMMISSARY_ORDER_ITEMS.map((row) => <th key={row.id} className="w-44 max-w-44 border-b border-r border-slate-700 bg-slate-950 px-3 py-3 align-top text-left text-white"><span className="block text-[10px] font-black uppercase tracking-[0.1em] text-sky-300">{row.category}</span><span className="mt-1 block leading-5">{row.name}</span><span className="mt-1 block text-[11px] font-semibold text-slate-300">MRN {row.mrn} · {row.orderUnit}</span><span className="block text-[11px] font-semibold text-emerald-300">{money(row.orderUnitCost)} / {row.orderUnit}</span></th>)}</tr></thead><tbody>{DELIVERY_ROWS.map((delivery) => <tr key={delivery.key}><th className="sticky left-0 z-10 border-b border-r border-slate-200 bg-sky-50 px-4 py-4 text-left"><span className="block font-black">{delivery.title}</span><span className="block text-xs font-semibold text-slate-500">{delivery.detail}</span></th>{COMMISSARY_ORDER_ITEMS.map((row) => <td key={row.id} className="border-b border-r border-slate-200 p-2"><label className="sr-only">{delivery.title} {row.name} quantity in {row.orderUnit}s</label><input aria-label={`${delivery.title} ${row.name} quantity`} type="number" min="0" step="0.25" disabled={locked} value={quantities[row.id]?.[delivery.key] ?? 0} onChange={(event) => updateQuantity(row.id, delivery.key, event.target.value)} className="w-full rounded-lg border border-slate-300 px-2 py-2 text-center font-black disabled:cursor-not-allowed disabled:bg-slate-200" /></td>)}</tr>)}</tbody></table></div>}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 p-4"><p className="text-xs font-semibold text-slate-600">Quantities may be entered in quarter-unit increments. Dressings retain the container units specified in the costing source.</p><div className="flex flex-col gap-2"><button type="button" onClick={saveOrder} disabled={locked || saving || loading} className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-slate-400"><Save size={17} />{saving ? "Saving…" : "Save shared order"}</button><button type="button" onClick={generateCurrentTransfer} disabled={loading || currentValue <= 0} className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-slate-400"><Download size={17} /> Generate transfer</button></div></div>
          </section>
        )}

        {(notice || error) && <div role={error ? "alert" : "status"} className={`rounded-xl border p-4 text-sm font-black ${error ? "border-rose-300 bg-rose-50 text-rose-900" : "border-emerald-300 bg-emerald-50 text-emerald-900"}`}>{error || notice}</div>}

        {locked && (
          <section className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Locked production package</p><h2 className="mt-1 text-2xl font-black">Prep list and accounting exports</h2><p className="mt-1 text-sm font-semibold text-slate-600">The BOM rolls up all saved cafe quantities and preserves a delivery-level unit breakdown. The S4 transfer consolidates Monday and Wednesday into one line per item.</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => runExport(() => exportCommissaryBom(weekRecords, weekStart))} disabled={!weekRecords.length} className="inline-flex items-center gap-2 rounded-lg border border-sky-300 bg-sky-50 px-4 py-3 text-sm font-black text-sky-950 disabled:opacity-40"><FileSpreadsheet size={18} /> Download combined BOM</button><button type="button" onClick={() => runExport(() => exportCommissaryTransfer(currentRecord))} disabled={!currentRecord || orderValue(currentRecord.quantities) <= 0} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-black text-white disabled:opacity-40"><Download size={18} /> Download {cafe || "cafe"} S4 transfer</button></div></div>
          </section>
        )}
      </main>
    </div>
  );
}
