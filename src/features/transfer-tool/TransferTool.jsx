import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRightLeft, Copy, Download, Plus, Save, Search, Trash2 } from "lucide-react";

import CATALOG from "../../data/transferToolCatalog.json";
import { CAFE_UNITS } from "../../shared/cafeUnits.js";
import { money } from "../../shared/formatting.js";
import CompassOneLogo from "../../shared/ui/CompassOneLogo.jsx";
import PlatformSettings from "../../shared/ui/PlatformSettings.jsx";
import VersionStamp from "../../shared/ui/VersionStamp.jsx";
import { cafeProfitCenter } from "./cafeProfitCenters.js";
import { exportTransferWorkbook, exportTransferZip } from "./transferExport.js";
import { normalizeTransferTitle, refreshCopiedItems, S4_EXPORT_VERSION, transferRecordId, transferTotal, validateS4Transfer, validateTransfer } from "./transferModel.js";
import { deleteTransfer, loadIngredientAllocations, loadTransfers, refreshTransferCatalogCosts, saveTransfer } from "./transferStorage.js";

const today = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
};

const lineId = () => globalThis.crypto?.randomUUID?.() || `line-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const blankLine = () => ({ lineId: lineId(), menu: "", catalogId: "", item: "", mrn: "", portion: "", itemWasteCost: null, allocationPerPortion: null, ingredientAllocations: [], allocationStatus: "", allocationMessage: "", quantity: 1 });
const blankDraft = () => ({ recordId: "", title: "", departingUnit: "", receivingUnit: "", departingProfitCenter: "", receivingProfitCenter: "", transferDate: today(), eventId: "", s4ExportVersion: S4_EXPORT_VERSION, items: [blankLine()], createdAt: "" });

function recordDate(record) {
  return record.updatedAt || record["Updated At"] || record.createdAt || "";
}

function toDraft(record) {
  const title = record.title || "";
  return {
    recordId: record["Record ID"] || record.recordId || "",
    title,
    departingUnit: record.departingUnit || "",
    receivingUnit: record.receivingUnit || "",
    departingProfitCenter: record.departingProfitCenter || cafeProfitCenter(record.departingUnit),
    receivingProfitCenter: record.receivingProfitCenter || cafeProfitCenter(record.receivingUnit),
    transferDate: record.transferDate || today(),
    eventId: record.eventId || "",
    s4ExportVersion: record.s4ExportVersion || "",
    createdAt: record.createdAt || "",
    items: Array.isArray(record.items) && record.items.length ? record.items.map(({ glGroups: _ignoredGlGroups, fromGlAccount: _fromGlAccount, toGlAccount: _toGlAccount, description: _description, descriptionIsAuto: _descriptionIsAuto, ...item }) => ({
      ...item,
      lineId: lineId(),
      allocationPerPortion: Number(item.allocationPerPortion),
      ingredientAllocations: Array.isArray(item.ingredientAllocations) ? item.ingredientAllocations : [],
      allocationStatus: Array.isArray(item.ingredientAllocations) && item.ingredientAllocations.length ? "ready" : "missing",
      allocationMessage: Array.isArray(item.ingredientAllocations) && item.ingredientAllocations.length ? "" : "This saved transfer predates automatic ingredient allocations. Copy it and reselect the menu item.",
    })) : [blankLine()],
  };
}

export default function TransferTool({ onBackToPlatform, onOpenSmartsheetHealth }) {
  const [transfers, setTransfers] = useState([]);
  const [catalogItems, setCatalogItems] = useState(CATALOG.items);
  const [draft, setDraft] = useState(blankDraft);
  const [query, setQuery] = useState("");
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ tone: "loading", message: "Loading shared transfers…" });
  const [costStatus, setCostStatus] = useState({ state: "loading", message: "Verifying live Item + Waste Costs…" });
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deletingTransferId, setDeletingTransferId] = useState("");
  const [batchDrafts, setBatchDrafts] = useState({});
  const [batchError, setBatchError] = useState("");
  const costsReady = costStatus.state === "ready";

  const catalogByMenu = useMemo(() => {
    const grouped = new Map(CATALOG.menus.map((menu) => [menu, []]));
    catalogItems.forEach((item) => grouped.get(item.menu)?.push(item));
    return grouped;
  }, [catalogItems]);
  const catalogById = useMemo(() => new Map(catalogItems.map((item) => [item.id, item])), [catalogItems]);

  useEffect(() => {
    let active = true;
    loadTransfers()
      .then((records) => {
        if (!active) return;
        const sorted = [...records].sort((a, b) => String(recordDate(b)).localeCompare(String(recordDate(a))));
        setTransfers(sorted);
        setStatus({ tone: "ready", message: `${sorted.length} shared transfer${sorted.length === 1 ? "" : "s"} available.` });
      })
      .catch((error) => active && setStatus({ tone: "error", message: error.message }));
    refreshTransferCatalogCosts(CATALOG.items)
      .then((result) => {
        if (!active) return;
        setCatalogItems(result.items);
        setDraft((current) => ({ ...current, items: refreshCopiedItems(current.items, result.items) }));
        setCostStatus({ state: "ready", message: `Live Item + Waste Costs verified from ${result.source} for ${result.refreshed.toLocaleString()} of ${result.items.length.toLocaleString()} catalog entries. Unmatched items remain unavailable.` });
      })
      .catch((error) => {
        if (!active) return;
        setCatalogItems(CATALOG.items.map((item) => ({ ...item, itemWasteCost: null })));
        setDraft((current) => ({ ...current, items: current.items.map((item) => item.catalogId ? { ...item, itemWasteCost: null } : item) }));
        setCostStatus({ state: "error", message: error.message || "Live Item + Waste Cost refresh is unavailable. Saving, copying, and export are blocked." });
      });
    return () => { active = false; };
  }, []);

  const filteredTransfers = useMemo(() => {
    const normalized = normalizeTransferTitle(query);
    if (!normalized) return transfers;
    return transfers.filter((record) => [record.title, record.departingUnit, record.receivingUnit, ...(record.items || []).flatMap((item) => [item.menu, item.item])]
      .some((value) => normalizeTransferTitle(value).includes(normalized)));
  }, [query, transfers]);

  const setField = (field, value) => {
    setDraft((current) => ({
      ...current,
      [field]: value,
      items: current.items,
    }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const setUnit = (field, value) => {
    const profitCenterField = field === "departingUnit" ? "departingProfitCenter" : "receivingProfitCenter";
    setDraft((current) => ({ ...current, [field]: value, [profitCenterField]: cafeProfitCenter(value) }));
    setErrors((current) => ({ ...current, [field]: undefined, [profitCenterField]: undefined }));
  };

  const updateLine = (lineIdValue, patch) => {
    setDraft((current) => ({
      ...current,
      items: current.items.map((line) => line.lineId === lineIdValue ? { ...line, ...patch } : line),
    }));
    setErrors((current) => ({ ...current, items: undefined, s4Lines: undefined }));
  };

  const chooseMenu = (line, menu) => updateLine(line.lineId, { ...blankLine(), lineId: line.lineId, menu });
  const chooseItem = async (line, catalogId) => {
    if (!costsReady) return;
    const selected = catalogById.get(catalogId);
    updateLine(line.lineId, selected ? {
      catalogId: selected.id,
      menu: selected.menu,
      item: selected.item,
      mrn: selected.mrn,
      portion: selected.portion,
      itemWasteCost: selected.itemWasteCost,
      allocationPerPortion: null,
      ingredientAllocations: [],
      allocationStatus: "loading",
      allocationMessage: "Loading ingredient allocation…",
    } : { ...blankLine(), lineId: line.lineId, menu: line.menu });
    setErrors((current) => ({ ...current, items: undefined }));
    if (!selected) return;
    try {
      const allocation = await loadIngredientAllocations(selected.mrn);
      updateLine(line.lineId, {
        allocationPerPortion: allocation.allocationPerPortion,
        ingredientAllocations: allocation.components,
        allocationStatus: "ready",
        allocationMessage: "",
      });
    } catch (error) {
      updateLine(line.lineId, { allocationPerPortion: null, ingredientAllocations: [], allocationStatus: "error", allocationMessage: error.message });
    }
  };

  const copyTransfer = (source) => {
    if (!costsReady) {
      setCostStatus((current) => ({ ...current, message: "Live Item + Waste Costs must be available before copying a transfer." }));
      return;
    }
    const refreshedItems = refreshCopiedItems(source.items || [], catalogItems).map((item) => ({
      ...item,
      lineId: lineId(),
      allocationStatus: Array.isArray(item.ingredientAllocations) && item.ingredientAllocations.length ? "ready" : "missing",
      allocationMessage: Array.isArray(item.ingredientAllocations) && item.ingredientAllocations.length ? "" : "Reselect this menu item to load its current ingredient allocation.",
    }));
    setDraft({
      recordId: "",
      title: "",
      departingUnit: source.departingUnit || "",
      receivingUnit: source.receivingUnit || "",
      departingProfitCenter: cafeProfitCenter(source.departingUnit),
      receivingProfitCenter: cafeProfitCenter(source.receivingUnit),
      transferDate: today(),
      eventId: "",
      s4ExportVersion: S4_EXPORT_VERSION,
      createdAt: "",
      items: refreshedItems.length ? refreshedItems : [blankLine()],
    });
    setErrors({});
    setStatus({ tone: "ready", message: "Copied into a new draft with current Item + Waste Costs. Enter a unique title before saving." });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const persist = async () => {
    if (!costsReady) {
      setCostStatus((current) => ({ ...current, message: "Live Item + Waste Costs must be verified before saving." }));
      return;
    }
    const validation = validateTransfer(draft, transfers);
    setErrors(validation);
    if (Object.keys(validation).length) return;
    setSaving(true);
    const now = new Date().toISOString();
    const completeItems = draft.items.filter((item) => item.catalogId).map(({ lineId: _, glGroups: _ignoredGlGroups, ...item }) => ({ ...item, quantity: Number(item.quantity) }));
    const recordId = draft.recordId || transferRecordId(draft.title);
    const record = {
      "Record ID": recordId,
      "Record Type": "Transfer",
      Status: "Draft",
      "Café / Unit": draft.departingUnit,
      "Date Range Label": draft.transferDate,
      "Station Key": "transfer-tool",
      "Updated At": now,
      "Visible In Dashboard": true,
      recordId,
      title: draft.title.trim(),
      normalizedTitle: normalizeTransferTitle(draft.title),
      departingUnit: draft.departingUnit,
      receivingUnit: draft.receivingUnit,
      departingProfitCenter: draft.departingProfitCenter,
      receivingProfitCenter: draft.receivingProfitCenter,
      transferDate: draft.transferDate,
      eventId: draft.eventId,
      s4ExportVersion: draft.s4ExportVersion || undefined,
      items: completeItems,
      totalValue: transferTotal(completeItems),
      createdAt: draft.createdAt || now,
      updatedAt: now,
    };
    try {
      await saveTransfer(record, { createOnly: !draft.recordId });
      setTransfers((current) => [record, ...current.filter((item) => (item["Record ID"] || item.recordId) !== recordId)]);
      setDraft(toDraft(record));
      setStatus({ tone: "saved", message: "Saved to shared storage. This draft is visible to all Culinary Platform users." });
    } catch (error) {
      setStatus({ tone: "error", message: error.status === 409 ? "That transfer title already exists. Choose a globally unique title." : error.message });
      if (error.status === 409) setErrors((current) => ({ ...current, title: "That transfer title already exists." }));
    } finally {
      setSaving(false);
    }
  };

  const exportCurrent = async () => {
    if (!costsReady) {
      setCostStatus((current) => ({ ...current, message: "Live Item + Waste Costs must be verified before export." }));
      return;
    }
    const validation = {
      ...validateTransfer(draft, draft.recordId ? transfers.filter((record) => (record["Record ID"] || record.recordId) !== draft.recordId) : transfers),
      ...validateS4Transfer(draft),
    };
    setErrors(validation);
    if (Object.keys(validation).length) return;
    setExporting(true);
    try {
      await exportTransferWorkbook({ ...draft, items: draft.items.filter((item) => item.catalogId) });
      setStatus({ tone: "saved", message: "Downloaded the current transfer in the S4 expense-transfer format." });
    } catch (error) {
      setStatus({ tone: "error", message: error.message || "Unable to export the S4 workbook." });
    } finally {
      setExporting(false);
    }
  };

  const toggleBatch = (record) => {
    const id = record["Record ID"] || record.recordId;
    setBatchDrafts((current) => {
      if (current[id]) {
        const next = { ...current };
        delete next[id];
        return next;
      }
      return { ...current, [id]: toDraft(record) };
    });
    setBatchError("");
  };

  const removeSavedTransfer = async (record) => {
    const id = record["Record ID"] || record.recordId;
    if (!id || deletingTransferId) return;
    if (!window.confirm(`Delete saved transfer "${record.title}"? This cannot be undone.`)) return;
    setDeletingTransferId(id);
    try {
      await deleteTransfer(id);
      setTransfers((current) => current.filter((item) => (item["Record ID"] || item.recordId) !== id));
      setBatchDrafts((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
      if (draft.recordId === id) {
        setDraft(blankDraft());
        setErrors({});
      }
      setStatus({ tone: "saved", message: `Deleted ${record.title} from shared saved transfers.` });
    } catch (error) {
      setStatus({ tone: "error", message: error.message || "Unable to delete the saved transfer." });
    } finally {
      setDeletingTransferId("");
    }
  };

  const updateBatch = (recordId, updater) => setBatchDrafts((current) => ({ ...current, [recordId]: updater(current[recordId]) }));

  const exportBatch = async () => {
    const selected = Object.values(batchDrafts);
    const invalid = selected.map((transfer) => ({ transfer, errors: validateS4Transfer(transfer) })).filter(({ errors: batchErrors }) => Object.keys(batchErrors).length);
    if (!selected.length) return setBatchError("Select at least one saved transfer.");
    if (invalid.length) return setBatchError(`Complete S4 fields for ${invalid.map(({ transfer }) => transfer.title).join(", ")}.`);
    setExporting(true);
    setBatchError("");
    try {
      await exportTransferZip(selected);
      setStatus({ tone: "saved", message: `Downloaded ${selected.length} S4 workbook${selected.length === 1 ? "" : "s"} in one ZIP. Saved transfers were not changed.` });
    } catch (error) {
      setBatchError(error.message || "Unable to export the selected transfers.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 px-4 py-5 text-slate-950">
      <div className="mx-auto max-w-[112rem] space-y-5">
        <header className="rounded-lg border border-sky-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <button type="button" onClick={onBackToPlatform} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100">
                <ArrowLeft size={16} /> Back to Platform
              </button>
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-600">Transfer Builder</p>
                <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-black text-amber-900">DRAFT</span>
              </div>
              <h1 className="mt-2 text-3xl font-black md:text-5xl">Transfer Tool</h1>
              <p className="mt-3 max-w-4xl text-sm font-semibold leading-6 text-slate-600">
                Build and save a reference transfer, then export it to Excel for separate entry in S4. Ingredient Costing 9.19.26 automatically assigns the per-portion G/L allocation.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <PlatformSettings onOpenSmartsheetHealth={onOpenSmartsheetHealth} />
              <CompassOneLogo />
              <VersionStamp />
            </div>
          </div>
        </header>

        <div className="grid w-full min-w-0 max-w-full gap-5 overflow-hidden xl:grid-cols-[minmax(0,1fr)_360px]">
          <main className="w-full min-w-0 max-w-[calc(100vw-2rem)] space-y-5 xl:max-w-none">
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p role="status" className={`mb-4 rounded-lg border p-3 text-sm font-bold ${costStatus.state === "ready" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : costStatus.state === "error" ? "border-rose-200 bg-rose-50 text-rose-800" : "border-amber-200 bg-amber-50 text-amber-900"}`}>{costStatus.message}</p>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Transfer draft</p>
                  <h2 className="mt-1 text-2xl font-black">{draft.recordId ? draft.title : "New transfer"}</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => { setDraft(blankDraft()); setErrors({}); }} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-black hover:bg-slate-50"><Plus size={16} /> New</button>
                  <button type="button" disabled={!costsReady} onClick={() => copyTransfer(draft)} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-black hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"><Copy size={16} /> Copy Transfer</button>
                  <button type="button" disabled={!costsReady || exporting} onClick={exportCurrent} className="inline-flex items-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-black text-sky-900 hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-50"><Download size={16} /> Export S4 Excel</button>
                  <button type="button" disabled={saving || !costsReady} onClick={persist} className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-sm font-black text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"><Save size={16} /> {saving ? "Saving…" : "Save Draft"}</button>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <Field label="Globally unique title" error={errors.title}>
                  <input aria-label="Globally unique title" value={draft.title} disabled={Boolean(draft.recordId)} onChange={(event) => setField("title", event.target.value)} placeholder="Example: Dawson to Nessie 9-14" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-semibold disabled:bg-slate-100" />
                </Field>
                <UnitField label="Departing unit" value={draft.departingUnit} onChange={(value) => setUnit("departingUnit", value)} error={errors.departingUnit} />
                <UnitField label="Receiving unit" value={draft.receivingUnit} onChange={(value) => setUnit("receivingUnit", value)} error={errors.receivingUnit} />
                <Field label="Transfer date" error={errors.transferDate}>
                  <input aria-label="Transfer date" type="date" value={draft.transferDate} onChange={(event) => setField("transferDate", event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-semibold" />
                </Field>
                <Field label="Receiving profit center" error={errors.receivingProfitCenter}>
                  <input aria-label="Receiving profit center" inputMode="numeric" maxLength={5} value={draft.receivingProfitCenter} readOnly={Boolean(cafeProfitCenter(draft.receivingUnit))} onChange={(event) => setField("receivingProfitCenter", event.target.value.replace(/\D/g, "").slice(0, 5))} placeholder={draft.receivingUnit ? "Enter 5 digits" : "Choose receiving unit"} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-semibold read-only:bg-slate-100" />
                  <span className="mt-1 block text-xs font-semibold text-slate-500">Current cafés are mapped and locked. A future unmapped café requires manual entry.</span>
                </Field>
                <Field label="Event ID (optional)" error={errors.eventId}>
                  <input aria-label="Event ID" maxLength={18} value={draft.eventId} onChange={(event) => setField("eventId", event.target.value)} placeholder="Applied to every line" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-semibold" />
                </Field>
              </div>
              {draft.departingUnit && <p className="mt-3 text-xs font-semibold text-slate-500">Internal departing profit center: {draft.departingProfitCenter || "not mapped"}. S4 uses the signed-in unit for departure.</p>}
              {draft.recordId && <p className="mt-3 text-xs font-semibold text-slate-500">Saved titles stay locked to preserve global uniqueness. Use Copy Transfer to create a separately titled draft.</p>}
            </section>

            <section className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-black">Transfer lines</h2>
                  <p className="mt-1 text-sm font-semibold text-slate-500">Select within a menu to keep duplicate item names isolated by menu, MRN, and portion.</p>
                </div>
                <button type="button" onClick={() => setDraft((current) => ({ ...current, items: [...current.items, blankLine()] }))} className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-900 hover:bg-emerald-100"><Plus size={16} /> Add item</button>
              </div>
              {errors.items && <p role="alert" className="mx-5 mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-800">{errors.items}</p>}
              {errors.s4Lines && <p role="alert" className="mx-5 mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-800">{errors.s4Lines}</p>}
              <div className="space-y-3 p-4 md:hidden">
                {draft.items.map((line, index) => {
                  const choices = catalogByMenu.get(line.menu) || [];
                  const lineValue = line.allocationPerPortion == null ? null : Number(line.quantity) * Number(line.allocationPerPortion);
                  return (
                    <article key={line.lineId} className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-2"><h3 className="font-black">Item {index + 1}</h3><button type="button" aria-label={`Remove mobile item ${index + 1}`} onClick={() => setDraft((current) => ({ ...current, items: current.items.length === 1 ? [blankLine()] : current.items.filter((item) => item.lineId !== line.lineId) }))} className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-rose-700"><Trash2 size={16} /></button></div>
                      <Field label="Menu"><select aria-label={`Mobile menu ${index + 1}`} value={line.menu} onChange={(event) => chooseMenu(line, event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 font-semibold"><option value="">Select menu</option>{CATALOG.menus.map((menu) => <option key={menu} value={menu}>{menu}</option>)}</select></Field>
                      <Field label="Item"><select aria-label={`Mobile item ${index + 1}`} value={line.catalogId} disabled={!line.menu || !costsReady} onChange={(event) => chooseItem(line, event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 font-semibold disabled:bg-slate-100"><option value="">{costsReady ? "Select item" : "Waiting for live costs"}</option>{choices.map((item) => <option key={item.id} value={item.id}>{item.item}{item.mrn ? ` · ${item.mrn}` : ""}{item.portion ? ` · ${item.portion}` : ""}</option>)}</select></Field>
                      <div className="grid grid-cols-2 gap-3"><div><p className="text-xs font-black uppercase text-slate-500">G/L allocation / portion</p><p className="mt-1 text-lg font-black">{line.allocationPerPortion == null ? "Loading…" : money(line.allocationPerPortion)}</p></div><Field label="Item count"><input aria-label={`Mobile item count ${index + 1}`} type="number" min="1" step="1" value={line.quantity} onChange={(event) => updateLine(line.lineId, { quantity: event.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 font-semibold" /></Field></div>
                      {line.catalogId && <IngredientAllocationList line={line} />}
                      <p className="text-sm font-black text-emerald-700">Line value {Number.isFinite(lineValue) ? money(lineValue) : "—"}</p>
                    </article>
                  );
                })}
              </div>
              <div className="hidden max-w-full overflow-x-auto md:block">
                <table className="min-w-[780px] w-full text-left text-sm">
                  <thead className="bg-slate-950 text-white">
                    <tr><th className="p-3">Menu</th><th className="p-3">Item</th><th className="p-3">G/L allocation / portion</th><th className="p-3">Item Count</th><th className="p-3"><span className="sr-only">Remove</span></th></tr>
                  </thead>
                  <tbody>
                    {draft.items.map((line, index) => {
                      const choices = catalogByMenu.get(line.menu) || [];
                  const lineValue = line.allocationPerPortion == null ? null : Number(line.quantity) * Number(line.allocationPerPortion);
                      return (
                        <React.Fragment key={line.lineId}>
                        <tr className="align-top">
                          <td className="w-[220px] p-3"><select aria-label={`Menu ${index + 1}`} value={line.menu} onChange={(event) => chooseMenu(line, event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 font-semibold"><option value="">Select menu</option>{CATALOG.menus.map((menu) => <option key={menu} value={menu}>{menu}</option>)}</select></td>
                          <td className="w-[290px] p-3"><select aria-label={`Item ${index + 1}`} value={line.catalogId} disabled={!line.menu || !costsReady} onChange={(event) => chooseItem(line, event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 font-semibold disabled:bg-slate-100"><option value="">{costsReady ? "Select item" : "Waiting for live costs"}</option>{choices.map((item) => <option key={item.id} value={item.id}>{item.item}{item.mrn ? ` · ${item.mrn}` : ""}{item.portion ? ` · ${item.portion}` : ""}</option>)}</select>{line.catalogId && <p className="mt-2 text-xs font-semibold text-slate-500">MRN {line.mrn || "unavailable"} · {line.portion || "portion unavailable"}</p>}</td>
                          <td className="w-[150px] p-3"><p className="text-lg font-black">{line.allocationPerPortion == null ? "Loading…" : money(line.allocationPerPortion)}</p><p className="mt-1 text-xs font-semibold text-slate-500">G/L allocation / portion</p></td>
                          <td className="w-[150px] p-3"><input aria-label={`Item count ${index + 1}`} type="number" min="1" step="1" value={line.quantity} onChange={(event) => updateLine(line.lineId, { quantity: event.target.value })} className="w-24 rounded-lg border border-slate-300 px-3 py-2 font-semibold" /><p className="mt-2 text-xs font-black text-emerald-700">Line value {Number.isFinite(lineValue) ? money(lineValue) : "—"}</p></td>
                          <td className="p-3"><button type="button" aria-label={`Remove item ${index + 1}`} onClick={() => setDraft((current) => ({ ...current, items: current.items.length === 1 ? [blankLine()] : current.items.filter((item) => item.lineId !== line.lineId) }))} className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-rose-700 hover:bg-rose-100"><Trash2 size={16} /></button></td>
                        </tr>
                        {line.catalogId && <tr className="border-b border-slate-200 bg-slate-50 last:border-b-0"><td colSpan={5} className="px-3 pb-4"><IngredientAllocationList line={line} /></td></tr>}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-col gap-2 border-t border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-end sm:justify-between">
                <p className="max-w-2xl text-xs font-semibold leading-5 text-slate-500">Each selected item expands into its priced ingredient allocation. S4 receives one row per ingredient, with the mapped category automatically applied as both G/L accounts.</p>
                <div className="text-right"><p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Transfer value</p><p data-testid="transfer-total" className="text-3xl font-black">{money(transferTotal(draft.items))}</p></div>
              </div>
            </section>
          </main>

          <aside className="h-fit rounded-lg border border-slate-200 bg-white p-5 shadow-sm xl:sticky xl:top-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Shared history</p>
            <h2 className="mt-1 text-2xl font-black">Saved transfers</h2>
            <div className="mt-3 rounded-lg border border-sky-200 bg-sky-50 p-3">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-sky-900">Batch Excel export</p>
              <p className="mt-1 text-xs font-semibold leading-5 text-sky-800">Use each card’s “Include in batch export” checkbox to combine multiple saved transfers into one ZIP.</p>
              <button type="button" disabled={exporting || !Object.keys(batchDrafts).length} onClick={exportBatch} className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-sky-300 bg-white px-3 py-2 text-xs font-black text-sky-950 disabled:cursor-not-allowed disabled:opacity-50"><Download size={15} /> Download selected transfers ({Object.keys(batchDrafts).length})</button>
            </div>
            {batchError && <p role="alert" className="mt-2 rounded-lg border border-rose-200 bg-rose-50 p-2 text-xs font-bold text-rose-800">{batchError}</p>}
            <label className="mt-4 flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2"><Search size={16} className="text-slate-400" /><span className="sr-only">Search transfers</span><input aria-label="Search transfers" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Title, unit, menu, item" className="min-w-0 flex-1 border-0 p-0 text-sm font-semibold outline-none" /></label>
            <p className={`mt-3 rounded-lg border p-3 text-xs font-bold ${status.tone === "error" ? "border-rose-200 bg-rose-50 text-rose-800" : status.tone === "saved" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-slate-50 text-slate-600"}`}>{status.message}</p>
            <div className="mt-4 max-h-[65vh] space-y-3 overflow-y-auto pr-1">
              {filteredTransfers.map((record) => {
                const id = record["Record ID"] || record.recordId;
                return (
                  <article key={id} className="rounded-lg border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-2"><span className="min-w-0 font-black">{record.title}</span><span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-black text-amber-800">DRAFT</span></div>
                    <p className="mt-2 flex items-center gap-2 text-xs font-bold text-slate-600"><ArrowRightLeft size={14} /> {record.departingUnit} → {record.receivingUnit}</p>
                    <p className="mt-2 text-xs font-semibold text-slate-500">{record.transferDate} · {(record.items || []).length} item{(record.items || []).length === 1 ? "" : "s"} · {money(transferTotal(record.items))}</p>
                    <label className={`mt-3 flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs font-black ${batchDrafts[id] ? "border-sky-400 bg-sky-50 text-sky-950" : "border-slate-200 bg-slate-50 text-slate-700"}`}><input aria-label={`Include ${record.title} in batch export`} type="checkbox" checked={Boolean(batchDrafts[id])} onChange={() => toggleBatch(record)} className="h-4 w-4 shrink-0 accent-sky-700" /><span>Include in batch export</span></label>
                    <div className="mt-3 grid grid-cols-3 gap-2"><button type="button" onClick={() => { const opened = toDraft(record); setDraft(costsReady ? { ...opened, items: refreshCopiedItems(opened.items, catalogItems) } : opened); setErrors({}); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-black text-white">Open</button><button type="button" disabled={!costsReady} onClick={() => copyTransfer(record)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-black disabled:cursor-not-allowed disabled:opacity-50">Copy</button><button type="button" aria-label={`Delete ${record.title}`} disabled={Boolean(deletingTransferId)} onClick={() => removeSavedTransfer(record)} className="inline-flex items-center justify-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-black text-rose-800 disabled:cursor-not-allowed disabled:opacity-50"><Trash2 size={14} /> Delete</button></div>
                  </article>
                );
              })}
              {!filteredTransfers.length && <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm font-semibold text-slate-500">No transfers match this search.</p>}
            </div>
          </aside>
        </div>
        {Object.keys(batchDrafts).length > 0 && (
          <section className="rounded-lg border border-sky-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-700">Batch export staging</p>
            <h2 className="mt-1 text-2xl font-black">Review ingredient allocations</h2>
            <p className="mt-2 text-sm font-semibold text-slate-600">Each saved transfer exports one S4 row per priced ingredient. These staging edits only allow an Event ID for this ZIP.</p>
            <div className="mt-4 space-y-4">
              {Object.entries(batchDrafts).map(([recordId, transfer]) => (
                <BatchTransferEditor key={recordId} transfer={transfer} onChange={(updater) => updateBatch(recordId, updater)} />
              ))}
            </div>
            <button type="button" disabled={exporting} onClick={exportBatch} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-black text-white disabled:opacity-50"><Download size={16} /> Export {Object.keys(batchDrafts).length} as ZIP</button>
          </section>
        )}
      </div>
    </div>
  );
}

function Field({ label, error, children }) {
  return <label className="block"><span className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</span><span className="mt-2 block">{children}</span>{error && <span role="alert" className="mt-1 block text-xs font-bold text-rose-700">{error}</span>}</label>;
}

function UnitField({ label, value, onChange, error }) {
  return <Field label={label} error={error}><select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-semibold"><option value="">Choose unit</option>{Object.entries(CAFE_UNITS.reduce((groups, unit) => ({ ...groups, [unit.district]: [...(groups[unit.district] || []), unit.cafe] }), {})).map(([district, cafes]) => <optgroup key={district} label={district}>{cafes.map((cafe) => <option key={cafe} value={cafe}>{cafe}</option>)}</optgroup>)}</select></Field>;
}

function IngredientAllocationList({ line }) {
  if (line.allocationStatus === "loading") return <p className="pt-3 text-xs font-bold text-amber-800">Loading Ingredient Costing 9.19.26 allocation…</p>;
  if (!line.ingredientAllocations?.length) return <p role="alert" className="pt-3 text-xs font-bold text-rose-800">{line.allocationMessage || "No priced ingredient allocation is available for this menu item."}</p>;
  return <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white"><p className="border-b border-slate-200 bg-slate-100 px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-slate-600">Automatic ingredient G/L allocation</p><div className="divide-y divide-slate-100">{line.ingredientAllocations.map((allocation) => <div key={`${allocation.ingredientMrn}-${allocation.unit}`} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 px-3 py-2 text-xs"><div><p className="font-black">{allocation.ingredientName}</p><p className="text-slate-500">MRN {allocation.ingredientMrn} · {allocation.quantity} {allocation.unit} / {allocation.recipeYield} yield · {allocation.glCode}</p></div><p className="font-black text-slate-800">{money(allocation.allocationPerPortion)}</p></div>)}</div></div>;
}

function BatchTransferEditor({ transfer, onChange }) {
  const mappedProfitCenter = cafeProfitCenter(transfer.receivingUnit);
  const validation = validateS4Transfer(transfer);
  return (
    <details className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <summary className="cursor-pointer font-black">{transfer.title} <span className={`ml-2 text-xs ${Object.keys(validation).length ? "text-amber-700" : "text-emerald-700"}`}>{Object.keys(validation).length ? "needs ingredient allocations" : "ready"}</span></summary>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <Field label="Receiving profit center" error={validation.receivingProfitCenter}>
          <input aria-label={`${transfer.title} receiving profit center`} inputMode="numeric" maxLength={5} value={transfer.receivingProfitCenter || ""} readOnly={Boolean(mappedProfitCenter)} onChange={(event) => onChange((current) => ({ ...current, receivingProfitCenter: event.target.value.replace(/\D/g, "").slice(0, 5) }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 font-semibold read-only:bg-slate-200" />
        </Field>
        <Field label="Event ID (optional)" error={validation.eventId}>
          <input aria-label={`${transfer.title} event ID`} maxLength={18} value={transfer.eventId || ""} onChange={(event) => onChange((current) => ({ ...current, eventId: event.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 font-semibold" />
        </Field>
      </div>
      {validation.s4Lines && <p role="alert" className="mt-3 text-xs font-bold text-amber-800">{validation.s4Lines}</p>}
      <div className="mt-3 space-y-3">
        {(transfer.items || []).map((line, sourceIndex) => ({ line, sourceIndex })).filter(({ line }) => line.catalogId).map(({ line, sourceIndex }, displayIndex) => (
          <div key={line.lineId || `${line.catalogId}-${sourceIndex}`} className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="font-black">{line.item} <span className="text-xs text-slate-500">{money(Number(line.quantity) * Number(line.allocationPerPortion))}</span></p>
            <IngredientAllocationList line={line} />
          </div>
        ))}
      </div>
    </details>
  );
}
