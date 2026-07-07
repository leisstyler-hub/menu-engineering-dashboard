import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { AlertTriangle, ArrowLeft, ClipboardCheck, Database, Download, FileSpreadsheet, Filter, RefreshCw, Search, ShieldCheck, UploadCloud } from "lucide-react";
import CompassOneLogo from "../../shared/ui/CompassOneLogo.jsx";
import PlatformSettings from "../../shared/ui/PlatformSettings.jsx";
import VersionStamp from "../../shared/ui/VersionStamp.jsx";
import {
  MENU_AUDIT_STORAGE_KEY,
  auditSummary,
  buildAuditComparison,
  exportAuditRowsToCsv,
  masterAppRowsToAuditRecords,
  parseCentricBrandWorkbook,
  parseSsmtWorkbook,
} from "./menuAuditModel.js";

function dateLabel(value) {
  if (!value) return "Not loaded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not loaded";
  return date.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function statusTone(status) {
  if (status === "Match") return "border-emerald-200 bg-emerald-50 text-emerald-900";
  if (/Missing|MRN/.test(status)) return "border-red-200 bg-red-50 text-red-800";
  if (/Category|Description/.test(status)) return "border-amber-200 bg-amber-50 text-amber-900";
  return "border-sky-200 bg-sky-50 text-sky-800";
}

async function fileToWorkbook(file) {
  const buffer = await file.arrayBuffer();
  return XLSX.read(buffer, { type: "array", cellText: true, cellDates: false, raw: true });
}

function saveMetadata(files) {
  try {
    window.localStorage.setItem(MENU_AUDIT_STORAGE_KEY, JSON.stringify(files));
  } catch {
    // Uploaded workbook row data can be large, so metadata persistence is best-effort.
  }
}

function loadMetadata() {
  try {
    return JSON.parse(window.localStorage.getItem(MENU_AUDIT_STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export default function MenuAuditTool({ onBackToPlatform, onOpenSmartsheetHealth }) {
  const [masterRows, setMasterRows] = useState([]);
  const [masterStatus, setMasterStatus] = useState({ state: "loading", message: "Loading Master App Data..." });
  const [ssmtRecords, setSsmtRecords] = useState([]);
  const [brandReports, setBrandReports] = useState([]);
  const [files, setFiles] = useState(() => (typeof window === "undefined" ? [] : loadMetadata()));
  const [selectedMenu, setSelectedMenu] = useState("All menus");
  const [recordType, setRecordType] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function loadMasterData() {
      try {
        const response = await fetch("/api/recipe-library?scope=all");
        const payload = await response.json();
        if (!response.ok || !payload.ok) throw new Error(payload.message || "Master App Data could not be loaded.");
        if (cancelled) return;
        setMasterRows(masterAppRowsToAuditRecords(payload.rows || []));
        setMasterStatus({ state: "ready", message: `${(payload.rows || []).length.toLocaleString()} Master App Data rows loaded from ${payload.source || "app data"}.` });
      } catch (error) {
        if (cancelled) return;
        setMasterStatus({ state: "error", message: error.message || "Master App Data could not be loaded." });
      }
    }
    loadMasterData();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    saveMetadata(files);
  }, [files]);

  const uploadSsmt = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const uploadedAt = new Date().toISOString();
      const workbook = await fileToWorkbook(file);
      const parsed = parseSsmtWorkbook(workbook, { originalFileName: file.name, uploadedAt });
      setSsmtRecords(parsed.records);
      setFiles((current) => [parsed.uploadedFile, ...current.filter((entry) => entry.sourceType !== "ssmt")]);
      setMessage(`Active SSMT loaded with ${parsed.records.length.toLocaleString()} audit rows. SSMT rows marked remove were ignored.`);
    } catch (error) {
      setMessage(error.message || "SSMT upload could not be parsed.");
    } finally {
      event.target.value = "";
    }
  };

  const uploadBrandReport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const uploadedAt = new Date().toISOString();
      const workbook = await fileToWorkbook(file);
      const parsed = parseCentricBrandWorkbook(workbook, { originalFileName: file.name, uploadedAt });
      setBrandReports((current) => [parsed, ...current.filter((entry) => entry.brandName !== parsed.brandName)]);
      setFiles((current) => [parsed.uploadedFile, ...current.filter((entry) => !(entry.sourceType === "centric_brand" && entry.brandName === parsed.brandName))]);
      setSelectedMenu(parsed.brandName);
      setMessage(`${parsed.uploadedFile.displayFileName} loaded with ${parsed.records.length.toLocaleString()} item and modifier rows.`);
    } catch (error) {
      setMessage(error.message || "Brand Report upload could not be parsed.");
    } finally {
      event.target.value = "";
    }
  };

  const masterFile = useMemo(() => ({
    id: "master-app-data",
    sourceType: "master_app",
    displayFileName: "Master App Data",
    uploadedAt: "",
    parsedAt: "",
    active: true,
  }), []);

  const allRecords = useMemo(() => [
    ...masterRows,
    ...ssmtRecords,
    ...brandReports.flatMap((report) => report.records),
  ], [brandReports, masterRows, ssmtRecords]);

  const menus = useMemo(() => {
    const values = new Set(["All menus"]);
    brandReports.forEach((report) => values.add(report.brandName));
    masterRows.slice(0, 4000).forEach((row) => {
      if (row.menuName) values.add(row.menuName);
    });
    return [...values].sort((a, b) => (a === "All menus" ? -1 : b === "All menus" ? 1 : a.localeCompare(b)));
  }, [brandReports, masterRows]);

  const comparisonRows = useMemo(() => {
    const selected = selectedMenu === "All menus" ? allRecords : allRecords.filter((row) => {
      const haystack = `${row.menuName || ""} ${row.brandName || ""} ${row.sourceTab || ""}`.toLowerCase();
      return haystack.includes(selectedMenu.toLowerCase());
    });
    return buildAuditComparison(selected).filter((row) => {
      if (recordType !== "all" && row.recordType !== recordType) return false;
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (search) {
        const haystack = [row.master, row.ssmt, row.brand].flatMap((source) => [source?.name, source?.mrn, source?.category, source?.description]).join(" ").toLowerCase();
        if (!haystack.includes(search.toLowerCase())) return false;
      }
      return true;
    });
  }, [allRecords, recordType, search, selectedMenu, statusFilter]);

  const summary = auditSummary(comparisonRows);
  const activeFiles = [masterFile, ...files].slice(0, 12);

  const exportCsv = () => {
    const csv = exportAuditRowsToCsv(comparisonRows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `menu-audit-${selectedMenu.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "all"}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-5 text-slate-950 md:px-8">
      <div className="mx-auto max-w-[110rem] space-y-5">
        <header className="rounded-lg border border-sky-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <button onClick={onBackToPlatform} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100">
                <ArrowLeft size={16} /> Back to Platform
              </button>
              <p className="mt-5 text-xs font-black uppercase tracking-[0.22em] text-emerald-600">IT Menu Tool</p>
              <h1 className="mt-2 text-3xl font-black md:text-5xl">Menu Audit Tool</h1>
              <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-600">Compare Master App Data, SSMT rows, and Centric Brand Reports without rounding MRNs or hiding missing records.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <PlatformSettings onOpenSmartsheetHealth={onOpenSmartsheetHealth} />
              <CompassOneLogo />
              <VersionStamp />
            </div>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-3">
          <UploadCard title="Active SSMT" icon={FileSpreadsheet} detail="One active SSMT at a time. Rows marked remove are ignored." onChange={uploadSsmt} />
          <UploadCard title="Centric Brand Report" icon={UploadCloud} detail="Brand/menu name is read from the Brand tab, not the file name." onChange={uploadBrandReport} />
          <SourceCard title="Master App Data" value={masterRows.length.toLocaleString()} detail={masterStatus.message} state={masterStatus.state} />
        </section>

        {message && (
          <div className="rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm font-bold text-sky-900">{message}</div>
        )}

        <section className="rounded-lg border border-sky-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">File Holding Area</p>
              <h2 className="mt-1 text-2xl font-black">Audit source files</h2>
            </div>
            <button onClick={() => setFiles([])} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100">
              <RefreshCw size={16} /> Clear uploaded metadata
            </button>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {activeFiles.map((file) => (
              <article key={file.id} className="rounded-lg border border-slate-300 bg-slate-50 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-600">{file.sourceType.replace(/_/g, " ")}</p>
                <h3 className="mt-2 break-words text-lg font-black">{file.displayFileName}</h3>
                {file.originalFileName && <p className="mt-2 break-words text-xs font-semibold text-slate-500">Original: {file.originalFileName}</p>}
                <p className="mt-3 text-xs font-bold text-slate-600">Uploaded: {dateLabel(file.uploadedAt)}</p>
                <p className="mt-1 text-xs font-bold text-slate-600">Parsed: {dateLabel(file.parsedAt)}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Metric label="Total audited" value={summary.total} icon={Database} />
          <Metric label="Matches" value={summary.matches} icon={ShieldCheck} tone="emerald" />
          <Metric label="Mismatches" value={summary.mismatches} icon={AlertTriangle} tone="amber" />
          <Metric label="Missing SSMT" value={summary.missingSsmt} icon={FileSpreadsheet} tone="red" />
          <Metric label="MRN mismatch" value={summary.mrnMismatches} icon={ClipboardCheck} tone="red" />
        </section>

        <section className="rounded-lg border border-sky-200 bg-white p-5 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[1.2fr_1fr_1fr_1fr_auto]">
            <label className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, MRN, category, description..." className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-10 pr-3 text-sm font-bold outline-none focus:border-sky-400" />
            </label>
            <select value={selectedMenu} onChange={(event) => setSelectedMenu(event.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm font-bold">
              {menus.map((menu) => <option key={menu}>{menu}</option>)}
            </select>
            <select value={recordType} onChange={(event) => setRecordType(event.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm font-bold">
              <option value="all">All record types</option>
              <option value="item">Items only</option>
              <option value="modifier">Modifiers only</option>
            </select>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm font-bold">
              <option value="all">All statuses</option>
              {["Match", "Missing from SSMT", "Missing from Master App Data", "Missing from Brand Report", "MRN Mismatch", "Category Mismatch", "Description Mismatch", "Name Difference Only"].map((status) => <option key={status}>{status}</option>)}
            </select>
            <button onClick={exportCsv} className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-3 text-sm font-black text-white hover:bg-slate-800">
              <Download size={18} /> Export
            </button>
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border border-sky-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 p-5">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Audit Comparison</p>
              <h2 className="mt-1 text-2xl font-black">Source alignment table</h2>
            </div>
            <Filter size={20} className="text-emerald-600" />
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[1300px] w-full border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  {["Status", "Type", "Menu", "Master App Name", "SSMT Name", "Brand Report Name", "Master MRN", "SSMT MRN", "Brand MRN", "Category"].map((header) => (
                    <th key={header} className="border-b border-slate-200 px-4 py-3">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonRows.slice(0, 350).map((row) => (
                  <tr key={row.id} className="align-top odd:bg-white even:bg-slate-50/70">
                    <td className="border-b border-slate-100 px-4 py-3"><span className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs font-black ${statusTone(row.status)}`}>{row.status}</span></td>
                    <td className="border-b border-slate-100 px-4 py-3 font-black capitalize">{row.recordType}</td>
                    <td className="border-b border-slate-100 px-4 py-3 font-bold text-slate-700">{row.menuName}</td>
                    <NameCell source={row.master} />
                    <NameCell source={row.ssmt} />
                    <NameCell source={row.brand} />
                    <MrnCell value={row.master?.mrn} />
                    <MrnCell value={row.ssmt?.mrn} />
                    <MrnCell value={row.brand?.mrn} />
                    <td className="border-b border-slate-100 px-4 py-3 text-xs font-bold text-slate-600">
                      <SourceLine label="Master" value={row.master?.category} />
                      <SourceLine label="SSMT" value={row.ssmt?.category} />
                      <SourceLine label="Brand" value={row.brand?.category} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!comparisonRows.length && (
              <div className="p-8 text-center text-sm font-bold text-slate-500">Upload the active SSMT and a Centric Brand Report, or adjust filters to see audit rows.</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function UploadCard({ title, detail, icon: Icon, onChange }) {
  return (
    <article className="rounded-lg border border-sky-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">Upload Source</p>
          <h2 className="mt-2 text-2xl font-black">{title}</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{detail}</p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-emerald-700"><Icon size={22} /></div>
      </div>
      <label className="mt-5 flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-3 text-sm font-black text-white hover:bg-slate-800">
        <UploadCloud size={18} /> Choose workbook
        <input type="file" accept=".xlsx,.xls,.csv" onChange={onChange} className="hidden" />
      </label>
    </article>
  );
}

function SourceCard({ title, value, detail, state }) {
  const tone = state === "ready" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : state === "error" ? "border-red-200 bg-red-50 text-red-800" : "border-sky-200 bg-sky-50 text-sky-800";
  return (
    <article className={`rounded-lg border p-5 shadow-sm ${tone}`}>
      <p className="text-xs font-black uppercase tracking-[0.2em]">Connected Source</p>
      <h2 className="mt-2 text-2xl font-black">{title}</h2>
      <p className="mt-4 text-4xl font-black">{value}</p>
      <p className="mt-2 text-sm font-semibold leading-6 opacity-80">{detail}</p>
    </article>
  );
}

function Metric({ label, value, icon: Icon, tone = "sky" }) {
  const tones = {
    sky: "border-sky-200 bg-white text-sky-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    red: "border-red-200 bg-red-50 text-red-700",
  };
  return (
    <article className={`rounded-lg border p-5 shadow-sm ${tones[tone]}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{label}</p>
        <Icon size={20} />
      </div>
      <p className="mt-4 text-4xl font-black text-slate-950">{Number(value || 0).toLocaleString()}</p>
    </article>
  );
}

function NameCell({ source }) {
  return (
    <td className="max-w-[260px] border-b border-slate-100 px-4 py-3">
      {source ? (
        <>
          <p className="font-black text-slate-950">{source.name}</p>
          {source.description && <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-slate-500">{source.description}</p>}
          <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">{source.sourceTab} row {source.sourceRowNumber}</p>
        </>
      ) : (
        <span className="text-xs font-black uppercase tracking-[0.12em] text-red-500">Missing</span>
      )}
    </td>
  );
}

function MrnCell({ value }) {
  return (
    <td className="border-b border-slate-100 px-4 py-3 font-mono text-sm font-black text-slate-900">
      {value || <span className="font-sans text-xs uppercase tracking-[0.12em] text-red-500">Missing</span>}
    </td>
  );
}

function SourceLine({ label, value }) {
  return <p><span className="text-slate-400">{label}:</span> {value || "Missing"}</p>;
}
