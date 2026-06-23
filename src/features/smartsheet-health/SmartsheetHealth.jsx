import React, { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, ArrowLeft, CheckCircle2, Cloud, Columns3, Database, RefreshCcw, ShieldCheck, Table2 } from "lucide-react";

import { ensureSmartsheetColumns, loadSmartsheetHealth } from "../../integrations/smartsheet/client.js";
import { SMARTSHEET_COLUMNS, SMARTSHEET_RECORD_TYPES } from "../../integrations/smartsheet/contract.js";
import { loadSupabaseHealth } from "../../integrations/supabase/client.js";
import CompassOneLogo from "../../shared/ui/CompassOneLogo.jsx";
import PlatformSettings from "../../shared/ui/PlatformSettings.jsx";
import VersionStamp from "../../shared/ui/VersionStamp.jsx";

const nowStamp = () => new Date().toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const MENU_SELECTION_RECORD_TYPES = new Set([
  SMARTSHEET_RECORD_TYPES.rotationHeader,
  SMARTSHEET_RECORD_TYPES.globalBlock,
  SMARTSHEET_RECORD_TYPES.globalSelection,
  SMARTSHEET_RECORD_TYPES.stationSelection,
  SMARTSHEET_RECORD_TYPES.grillSelection,
  SMARTSHEET_RECORD_TYPES.carverySelection,
  SMARTSHEET_RECORD_TYPES.wokSelection,
  SMARTSHEET_RECORD_TYPES.weekAtGlanceUpload,
  SMARTSHEET_RECORD_TYPES.uploadedItem,
]);
const LEAN_RECORD_TYPES = new Set([
  SMARTSHEET_RECORD_TYPES.leanObservationResult,
  SMARTSHEET_RECORD_TYPES.leanObservationMark,
]);
const MENU_SELECTION_EXPECTED_COLUMNS = [
  SMARTSHEET_COLUMNS.recordId,
  SMARTSHEET_COLUMNS.parentRecordId,
  SMARTSHEET_COLUMNS.recordType,
  SMARTSHEET_COLUMNS.status,
  SMARTSHEET_COLUMNS.district,
  SMARTSHEET_COLUMNS.cafeUnit,
  SMARTSHEET_COLUMNS.dateRangeLabel,
  SMARTSHEET_COLUMNS.station,
  SMARTSHEET_COLUMNS.selectionType,
  SMARTSHEET_COLUMNS.menuItemSelection,
  SMARTSHEET_COLUMNS.trueCost,
  SMARTSHEET_COLUMNS.foodCostPct,
  SMARTSHEET_COLUMNS.submittedAt,
  SMARTSHEET_COLUMNS.updatedAt,
];
const LEAN_EXPECTED_COLUMNS = [
  SMARTSHEET_COLUMNS.recordId,
  SMARTSHEET_COLUMNS.parentRecordId,
  SMARTSHEET_COLUMNS.recordType,
  SMARTSHEET_COLUMNS.status,
  SMARTSHEET_COLUMNS.district,
  SMARTSHEET_COLUMNS.cafeUnit,
  SMARTSHEET_COLUMNS.station,
  SMARTSHEET_COLUMNS.businessDate,
  SMARTSHEET_COLUMNS.leanSessionId,
  SMARTSHEET_COLUMNS.leanObservedSeconds,
  SMARTSHEET_COLUMNS.leanTotalMarks,
  SMARTSHEET_COLUMNS.leanTopWaste,
  SMARTSHEET_COLUMNS.leanActivity,
  SMARTSHEET_COLUMNS.leanWaste,
  SMARTSHEET_COLUMNS.voidReason,
  SMARTSHEET_COLUMNS.visibleInDashboard,
];

function maskedSheetId(value = "") {
  const text = String(value || "");
  if (!text) return "not shown";
  return `...${text.slice(-6)}`;
}

function countBy(records = [], column) {
  return Object.entries(records.reduce((acc, record) => {
    const key = String(record[column] || "Unclassified");
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {})).sort((a, b) => b[1] - a[1]);
}

function getLatestRecordTime(records = []) {
  const fields = [SMARTSHEET_COLUMNS.updatedAt, SMARTSHEET_COLUMNS.submittedAt, SMARTSHEET_COLUMNS.voidedAt];
  return records
    .flatMap((record) => fields.map((field) => String(record[field] || "")).filter(Boolean))
    .sort((a, b) => b.localeCompare(a))[0] || "";
}

function scopedRecords(records = [], scope = "all", search = "") {
  const typeSet = scope === "lean" ? LEAN_RECORD_TYPES : scope === "menuSelection" ? MENU_SELECTION_RECORD_TYPES : null;
  const query = search.trim().toLowerCase();
  return records.filter((record) => {
    const recordType = String(record[SMARTSHEET_COLUMNS.recordType] || "");
    if (typeSet && !typeSet.has(recordType)) return false;
    if (!query) return true;
    return Object.values(record).some((value) => String(value || "").toLowerCase().includes(query));
  });
}

export default function SmartsheetHealth({ onBackToPlatform }) {
  const [mainHealth, setMainHealth] = useState({ state: "idle", data: null, message: "Not checked yet" });
  const [leanHealth, setLeanHealth] = useState({ state: "idle", data: null, message: "Not checked yet" });
  const [supabaseHealth, setSupabaseHealth] = useState({ state: "idle", data: null, message: "Not checked yet" });
  const [lastChecked, setLastChecked] = useState("");

  const refreshOne = async (setter, context = {}) => {
    setter({ state: "loading", data: null, message: "Checking Smartsheet..." });
    try {
      const payload = await loadSmartsheetHealth(context);
      setter({ state: "connected", data: payload, message: payload.message || "Connected to Smartsheet." });
    } catch (error) {
      setter({ state: "error", data: error.payload || null, message: error.message || "Smartsheet check failed." });
    }
  };

  const refreshSupabase = async () => {
    setSupabaseHealth({ state: "loading", data: null, message: "Checking Supabase..." });
    try {
      const payload = await loadSupabaseHealth();
      setSupabaseHealth({ state: payload.ok ? "connected" : "error", data: payload, message: payload.message });
    } catch (error) {
      setSupabaseHealth({ state: "error", data: null, message: error.message || "Supabase check failed." });
    }
  };

  const refreshAll = async () => {
    await Promise.all([
      refreshOne(setMainHealth),
      refreshOne(setLeanHealth, { tool: "lean" }),
      refreshSupabase(),
    ]);
    setLastChecked(nowStamp());
  };

  const repairOne = async (setter, missingColumns = [], context = {}) => {
    if (!missingColumns.length) return;
    setter((prev) => ({ ...prev, state: "loading", message: "Adding missing Smartsheet columns..." }));
    try {
      const repairPayload = await ensureSmartsheetColumns(missingColumns, { ...context, source: "Smartsheet Health" });
      const healthPayload = await loadSmartsheetHealth(context);
      setter({ state: "connected", data: healthPayload, message: repairPayload.message || "Smartsheet columns repaired." });
      setLastChecked(nowStamp());
    } catch (error) {
      setter({ state: "error", data: error.payload || null, message: error.message || "Smartsheet column repair failed." });
    }
  };

  useEffect(() => {
    refreshAll();
  }, []);

  const combinedRecords = useMemo(() => [
    ...scopedRecords(mainHealth.data?.records || [], "menuSelection"),
    ...scopedRecords(leanHealth.data?.records || [], "lean"),
  ], [mainHealth.data, leanHealth.data]);
  const recordTypeRows = countBy(combinedRecords, SMARTSHEET_COLUMNS.recordType).slice(0, 8);
  const statusRows = countBy(combinedRecords, SMARTSHEET_COLUMNS.status).slice(0, 6);
  const districtRows = countBy(combinedRecords, SMARTSHEET_COLUMNS.district).filter(([name]) => name !== "Unclassified").slice(0, 6);

  return (
    <div className="min-h-screen bg-[#f6f7f9] text-slate-950">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 md:px-6">
        <header className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <button onClick={onBackToPlatform} className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-white">
              <ArrowLeft size={16} />
              Back to Platform
            </button>
            <div className="flex flex-wrap items-center gap-2">
              <PlatformSettings onRefresh={refreshAll} />
              <CompassOneLogo compact />
            </div>
          </div>
          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600">System Settings</p>
              <h1 className="mt-2 text-4xl font-black tracking-normal">Data Health</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                A safe read of the app's Supabase backbone, Smartsheet mirror, sheet structure, record counts, and sync readiness.
              </p>
            </div>
            <div className="flex flex-col gap-2 lg:items-end">
              <VersionStamp compact />
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-600">
                Last checked: {lastChecked || "checking..."}
              </span>
            </div>
          </div>
        </header>

        <SupabaseHealthCard health={supabaseHealth} onRefresh={refreshSupabase} />

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <SheetHealthCard
            title="Menu Rotation Smartsheet"
            scope="menuSelection"
            expectedColumns={MENU_SELECTION_EXPECTED_COLUMNS}
            health={mainHealth}
            onRefresh={() => refreshOne(setMainHealth)}
            onRepairMissing={(missingColumns) => repairOne(setMainHealth, missingColumns)}
          />
          <SheetHealthCard
            title="Lean Results Smartsheet"
            scope="lean"
            expectedColumns={LEAN_EXPECTED_COLUMNS}
            health={leanHealth}
            onRefresh={() => refreshOne(setLeanHealth, { tool: "lean" })}
            onRepairMissing={(missingColumns) => repairOne(setLeanHealth, missingColumns, { tool: "lean" })}
          />
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <SummaryPanel icon={Activity} title="Record Types" rows={recordTypeRows} empty="No records loaded yet." />
          <SummaryPanel icon={CheckCircle2} title="Statuses" rows={statusRows} empty="No statuses loaded yet." />
          <SummaryPanel icon={Database} title="District Signal" rows={districtRows} empty="No district rows loaded yet." />
        </section>

        <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 text-emerald-700" size={22} />
            <div>
              <p className="text-sm font-black text-emerald-950">Private key stays hidden</p>
              <p className="mt-1 text-sm leading-6 text-emerald-900">
                This page checks the connection through the app's server. It does not display the Smartsheet access token.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function SupabaseHealthCard({ health, onRefresh }) {
  const data = health.data || {};
  const connected = health.state === "connected";
  const error = health.state === "error";
  const checking = health.state === "loading";
  const stateLabel = connected ? "Connected" : error ? "Needs Attention" : checking ? "Checking" : "Not Checked";
  const projectLabel = data.projectRef || "pending";
  const latency = typeof data.latencyMs === "number" ? `${data.latencyMs} ms` : "-";
  const configSource = data.usingFallbackConfig ? "App fallback config" : "Vercel environment";

  return (
    <section className={`rounded-lg border bg-white p-5 shadow-sm ${connected ? "border-emerald-200" : error ? "border-amber-200" : "border-slate-200"}`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className={`text-xs font-black uppercase tracking-[0.18em] ${connected ? "text-emerald-600" : error ? "text-amber-600" : "text-slate-500"}`}>
            Supabase Backbone
          </p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">Primary App Database</h2>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
            Supabase is being introduced as the app's structured memory. Smartsheet remains the readable mirror and fallback while we migrate tools in controlled stages.
          </p>
        </div>
        <button onClick={onRefresh} className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-black text-slate-700 hover:bg-white">
          <RefreshCcw size={16} />
          Refresh
        </button>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <HealthMetric icon={Cloud} label="State" value={stateLabel} detail={health.message || "Waiting for check"} tone={connected ? "green" : error ? "amber" : "neutral"} />
        <HealthMetric icon={Database} label="Project" value={projectLabel} detail="Supabase project ref" />
        <HealthMetric icon={Activity} label="Response" value={latency} detail={data.statusCode ? `HTTP ${data.statusCode}` : "not checked"} />
        <HealthMetric icon={ShieldCheck} label="Storage Role" value="Primary" detail="Smartsheet remains mirror/fallback" tone="green" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-black text-slate-950">Connection Source</p>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">{configSource}</p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-black text-emerald-950">First Migration Target</p>
          <p className="mt-1 text-sm font-semibold leading-6 text-emerald-900">Lean results, marks, void controls, and audit history.</p>
        </div>
        <div className="rounded-lg border border-sky-200 bg-sky-50 p-4">
          <p className="text-sm font-black text-sky-950">Retention Plan</p>
          <p className="mt-1 text-sm font-semibold leading-6 text-sky-900">Keep records for two years; store files selectively and regenerate menus from saved selections.</p>
        </div>
      </div>
    </section>
  );
}

function SheetHealthCard({ title, health, onRefresh, onRepairMissing, scope = "all", expectedColumns = [] }) {
  const [search, setSearch] = useState("");
  const data = health.data || {};
  const allRecords = data.records || [];
  const records = scopedRecords(allRecords, scope, search);
  const columns = data.columns || [];
  const missing = data.ok ? expectedColumns.filter((column) => !columns.includes(column)) : [];
  const connected = health.state === "connected";
  const error = health.state === "error";
  const latest = getLatestRecordTime(records);
  const scopeLabel = scope === "lean" ? "Lean records" : scope === "menuSelection" ? "menu selection portion records" : "records";
  const repairing = health.state === "loading";

  return (
    <section className={`rounded-lg border bg-white p-5 shadow-sm ${connected ? "border-emerald-200" : error ? "border-amber-200" : "border-slate-200"}`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className={`text-xs font-black uppercase tracking-[0.18em] ${connected ? "text-emerald-600" : error ? "text-amber-600" : "text-slate-500"}`}>
            {connected ? "Connected" : error ? "Needs Attention" : "Checking"}
          </p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">{title}</h2>
          <p className="mt-2 text-sm font-semibold text-slate-600">
            Showing {records.length} {scopeLabel} from {allRecords.length} loaded Smartsheet row{allRecords.length === 1 ? "" : "s"}.
          </p>
        </div>
        <button onClick={onRefresh} className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-black text-slate-700 hover:bg-white">
          <RefreshCcw size={16} />
          Refresh
        </button>
      </div>

      <label className="mt-4 block">
        <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-500">Search This Scope</span>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={scope === "lean" ? "Search Lean waste, station, cafe..." : "Search rotation, cafe, menu, item..."}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-bold text-slate-900 outline-none focus:border-emerald-400"
        />
      </label>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <HealthMetric icon={Database} label="Sheet" value={data.sheetName || "-"} detail={maskedSheetId(data.sheetId)} />
        <HealthMetric icon={Table2} label="Scope Rows" value={records.length.toLocaleString()} detail={`${allRecords.length} sheet rows loaded`} />
        <HealthMetric icon={Columns3} label="Columns" value={columns.length} detail={`${missing.length} missing expected`} tone={missing.length ? "amber" : "green"} />
        <HealthMetric icon={Activity} label="Latest Signal" value={latest || "-"} detail="updated/submitted/voided" />
      </div>

      {missing.length > 0 && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 text-amber-700" size={18} />
            <div>
              <p className="text-sm font-black text-amber-950">Missing expected columns</p>
              <p className="mt-1 text-xs font-semibold text-amber-900">{missing.slice(0, 8).join(", ")}{missing.length > 8 ? `, and ${missing.length - 8} more` : ""}</p>
              {onRepairMissing && (
                <button
                  type="button"
                  onClick={() => onRepairMissing(missing)}
                  disabled={repairing}
                  className="mt-3 inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-black text-amber-950 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCcw size={14} />
                  {repairing ? "Repairing..." : "Add missing columns"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function HealthMetric({ icon: Icon, label, value, detail, tone = "neutral" }) {
  const toneClass = tone === "green" ? "border-emerald-200 bg-emerald-50" : tone === "amber" ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-slate-50";
  return (
    <div className={`min-w-0 rounded-lg border p-3 ${toneClass}`}>
      <div className="flex items-start gap-2 text-slate-500">
        <Icon className="mt-0.5 shrink-0" size={15} />
        <p className="text-xs font-black uppercase leading-4 tracking-[0.12em]">{label}</p>
      </div>
      <p className="mt-2 break-words text-lg font-black leading-6 text-slate-950">{value}</p>
      <p className="mt-1 break-words text-xs font-semibold leading-5 text-slate-500">{detail}</p>
    </div>
  );
}

function SummaryPanel({ icon: Icon, title, rows, empty }) {
  const total = rows.reduce((sum, [, count]) => sum + count, 0);
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Loaded Data</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">{title}</h2>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-emerald-700">
          <Icon size={20} />
        </div>
      </div>
      <div className="mt-4 space-y-3">
        {rows.length ? rows.map(([label, count]) => {
          const pct = total ? Math.round((count / total) * 100) : 0;
          return (
            <div key={label}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <p className="break-words font-black text-slate-900">{label}</p>
                <p className="font-mono font-black text-slate-600">{count}</p>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.max(4, pct)}%` }} />
              </div>
            </div>
          );
        }) : <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-500">{empty}</p>}
      </div>
    </section>
  );
}
