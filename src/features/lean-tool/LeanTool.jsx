import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BarChart3, CheckCircle2, ClipboardList, Clock3, Mail, Play, RotateCcw, Send, Smartphone, Timer, Trash2, UserCheck } from "lucide-react";

import CompassOneLogo from "../../shared/ui/CompassOneLogo.jsx";
import VersionStamp from "../../shared/ui/VersionStamp.jsx";

const STORAGE_KEY = "culinaryToolsLeanObservations_v1";

const RECIPIENTS = [
  { name: "Shane James", email: "shane.james@compass-usa.com" },
  { name: "Lynn Wu", email: "lynn-wu@compass-usa.com" },
  { name: "Tyler Leiss", email: "tyler.leiss@compass-usa.com" },
  { name: "Alex Neuse", email: "alex.neuse@compass-usa.com" },
  { name: "Jeremy Slagle", email: "jeremy.slagle@compass-usa.com" },
  { name: "DJ Bauer", email: "dj.bauer@compass-usa.com" },
  { name: "Bil Smith", email: "bil.smith@compass-usa.com" },
  { name: "Summer Hinshaw", email: "summer.hinshaw@compass-usa.com" },
];

const WASTE_TYPES = [
  { key: "Defects", letter: "D", label: "Defects", color: "rose", examples: "redo, wrong item, correction" },
  { key: "Overproduction", letter: "O", label: "Overproduction", color: "amber", examples: "too much, too early" },
  { key: "Waiting", letter: "W", label: "Waiting", color: "sky", examples: "blocked, idle, queue" },
  { key: "Non-utilized talent", letter: "N", label: "Talent", color: "violet", examples: "skills not used" },
  { key: "Transportation", letter: "T", label: "Transport", color: "cyan", examples: "moving product" },
  { key: "Inventory", letter: "I", label: "Inventory", color: "slate", examples: "excess stock" },
  { key: "Motion", letter: "M", label: "Motion", color: "emerald", examples: "walking, reaching, searching" },
  { key: "Extra-processing", letter: "E", label: "Extra Process", color: "orange", examples: "extra steps" },
];

const ACTIVITIES = [
  "Walking",
  "Waiting",
  "Searching",
  "Prep",
  "Cooking",
  "Serving",
  "Cleaning",
  "Rework",
  "Handoff",
  "Stocking",
  "Talking",
  "Other",
];

const CAFE_OPTIONS = ["Doppler", "Day 1", "Nitro", "Re:Invent", "Dawson", "Nessie", "Cricket", "Moby", "Atlas"];
const AREA_OPTIONS = ["Expo", "Grill", "Wok", "Salad", "Deli", "Pizza", "Dish", "Storage", "Line", "Other"];
const OBSERVER_OPTIONS = ["DC", "DM", "RDO", "VPO", "EC", "DR", "GM"];

const colorClasses = {
  rose: "border-rose-300 bg-rose-50 text-rose-900",
  amber: "border-amber-300 bg-amber-50 text-amber-900",
  sky: "border-sky-300 bg-sky-50 text-sky-900",
  violet: "border-violet-300 bg-violet-50 text-violet-900",
  cyan: "border-cyan-300 bg-cyan-50 text-cyan-900",
  slate: "border-slate-300 bg-slate-50 text-slate-900",
  emerald: "border-emerald-300 bg-emerald-50 text-emerald-900",
  orange: "border-orange-300 bg-orange-50 text-orange-900",
};

const nowTime = () => new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
const today = () => new Date().toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
const formatSeconds = (value) => `${Number(value || 0).toFixed(1)}s`;
const formatClock = (value) => {
  const totalTenths = Math.max(0, Math.round(Number(value || 0) * 10));
  const minutes = Math.floor(totalTenths / 600);
  const seconds = Math.floor((totalTenths % 600) / 10);
  const tenths = totalTenths % 10;
  return `${minutes}:${String(seconds).padStart(2, "0")}.${tenths}`;
};

function readStoredObservations() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function buildReport({ cafe, area, observer, observationDate, observations, summary, note, completedAt }) {
  const topWaste = summary.byWasteSeconds[0];
  const topActivity = summary.byActivitySeconds[0];
  const wasteLines = summary.byWasteSeconds.map(([name, seconds]) => `- ${name}: ${formatSeconds(seconds)} (${summary.seconds ? ((seconds / summary.seconds) * 100).toFixed(0) : 0}%)`).join("\n") || "- No waste time captured";
  const activityLines = summary.byActivitySeconds.map(([name, seconds]) => `- ${name}: ${formatSeconds(seconds)} (${summary.seconds ? ((seconds / summary.seconds) * 100).toFixed(0) : 0}%)`).join("\n") || "- No activity time captured";
  const latest = observations.slice().reverse().map((entry) => `- +${formatSeconds(entry.timestampSeconds)}: ${entry.activity} / ${entry.waste} for ${formatSeconds(entry.seconds)}${entry.note ? ` - ${entry.note}` : ""}`).join("\n") || "- No observations captured";
  const recommendation = topWaste
    ? topWaste[0] === "Motion"
      ? "Primary opportunity: reduce walking/searching by staging tools, ingredients, or labels closer to the point of use."
      : topWaste[0] === "Waiting"
        ? "Primary opportunity: identify the constraint causing idle time and rebalance handoffs, prep readiness, or equipment access."
        : topWaste[0] === "Defects"
          ? "Primary opportunity: reduce rework by clarifying standards, recipes, tickets, or quality checks before service."
          : `Primary opportunity: focus first on ${topWaste[0]} because it consumed the largest observed time block.`
    : "Primary opportunity: complete an observation session to generate a recommendation.";

  return [
    "Lean Tool Observation Report",
    "",
    `Cafe / Unit: ${cafe}`,
    `Area: ${area}`,
    `Date: ${observationDate}`,
    `Observer: ${observer}`,
    `Completed: ${completedAt || nowTime()}`,
    "",
    "Summary",
    `Total marks: ${summary.total}`,
    `Observed time: ${formatSeconds(summary.seconds)}`,
    `Top waste: ${topWaste ? `${topWaste[0]} (${formatSeconds(topWaste[1])})` : "n/a"}`,
    `Top activity: ${topActivity ? `${topActivity[0]} (${formatSeconds(topActivity[1])})` : "n/a"}`,
    recommendation,
    "",
    "DOWNTIME Time Breakdown",
    wasteLines,
    "",
    "Activity Time Breakdown",
    activityLines,
    "",
    "Timestamped Marks",
    latest,
    "",
    "Leader Notes",
    note || "No notes added.",
  ].join("\n");
}

function tally(rows, key) {
  return Object.entries(rows.reduce((acc, row) => {
    acc[row[key]] = (acc[row[key]] || 0) + 1;
    return acc;
  }, {})).sort((a, b) => b[1] - a[1]);
}

function tallySeconds(rows, key) {
  return Object.entries(rows.reduce((acc, row) => {
    acc[row[key]] = (acc[row[key]] || 0) + Number(row.seconds || 0);
    return acc;
  }, {})).sort((a, b) => b[1] - a[1]);
}

function summarizeRows(rows) {
  return {
    total: rows.length,
    seconds: rows.reduce((sum, row) => sum + Number(row.seconds || 0), 0),
    byWaste: tally(rows, "waste"),
    byActivity: tally(rows, "activity"),
    byWasteSeconds: tallySeconds(rows, "waste"),
    byActivitySeconds: tallySeconds(rows, "activity"),
  };
}

export default function LeanTool({ onBackToPlatform }) {
  const [cafe, setCafe] = useState("Doppler");
  const [area, setArea] = useState("Line");
  const [observer, setObserver] = useState("DC");
  const [observationDate] = useState(today);
  const [selectedActivity, setSelectedActivity] = useState("Walking");
  const [selectedWaste, setSelectedWaste] = useState("Motion");
  const [note, setNote] = useState("");
  const [reportNote, setReportNote] = useState("");
  const [running, setRunning] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [sessionStartMs, setSessionStartMs] = useState(null);
  const [lastMarkMs, setLastMarkMs] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [completedAt, setCompletedAt] = useState("");
  const [completedSummary, setCompletedSummary] = useState(null);
  const [selectedRecipients, setSelectedRecipients] = useState(() => RECIPIENTS.map((person) => person.email));
  const [observations, setObservations] = useState(readStoredObservations);

  const scopedObservations = observations.filter((row) => row.cafe === cafe && row.area === area && row.observationDate === observationDate);
  const sessionObservations = scopedObservations.filter((row) => row.sessionId === sessionId);
  const activeRows = sessionId ? sessionObservations : scopedObservations;
  const summary = useMemo(() => summarizeRows(activeRows), [activeRows]);

  useEffect(() => {
    if (!running || !sessionStartMs) return undefined;
    const update = () => setElapsedSeconds((Date.now() - sessionStartMs) / 1000);
    update();
    const timerId = window.setInterval(update, 100);
    return () => window.clearInterval(timerId);
  }, [running, sessionStartMs]);

  const startSession = () => {
    const now = Date.now();
    const nextSessionId = `${now}-${Math.random().toString(16).slice(2)}`;
    setSessionId(nextSessionId);
    setSessionStartMs(now);
    setLastMarkMs(now);
    setElapsedSeconds(0);
    setCompletedAt("");
    setCompletedSummary(null);
    setRunning(true);
  };

  const handleStart = () => {
    if (running) return;
    startSession();
  };

  const resetSession = () => {
    setRunning(false);
    setSessionId("");
    setSessionStartMs(null);
    setLastMarkMs(null);
    setElapsedSeconds(0);
    setCompletedAt("");
    setCompletedSummary(null);
  };

  const markObservation = () => {
    const now = Date.now();
    const activeSessionId = sessionId || `${now}-${Math.random().toString(16).slice(2)}`;
    const startMs = sessionStartMs || now;
    const priorMarkMs = lastMarkMs || startMs;
    const durationSeconds = Math.max(0.1, Number(((now - priorMarkMs) / 1000).toFixed(1)));
    const timestampSeconds = Number(((now - startMs) / 1000).toFixed(1));
    if (!sessionId) {
      setSessionId(activeSessionId);
      setSessionStartMs(startMs);
    }
    setCompletedAt("");
    setCompletedSummary(null);
    const nextEntry = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      sessionId: activeSessionId,
      cafe,
      area,
      observer,
      observationDate,
      activity: selectedActivity,
      waste: selectedWaste,
      seconds: durationSeconds,
      timestampSeconds,
      note: note.trim(),
      time: nowTime(),
    };
    const nextRows = [nextEntry, ...observations].slice(0, 250);
    setObservations(nextRows);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextRows));
    setLastMarkMs(now);
    setElapsedSeconds(timestampSeconds);
    setRunning(true);
    setNote("");
  };

  const completeSession = () => {
    const now = Date.now();
    let completedRows = activeRows;
    if (running && sessionId && sessionStartMs && lastMarkMs) {
      const durationSeconds = Number(((now - lastMarkMs) / 1000).toFixed(1));
      if (durationSeconds >= 0.2) {
        const timestampSeconds = Number(((now - sessionStartMs) / 1000).toFixed(1));
        const finalEntry = {
          id: `${now}-${Math.random().toString(16).slice(2)}`,
          sessionId,
          cafe,
          area,
          observer,
          observationDate,
          activity: selectedActivity,
          waste: selectedWaste,
          seconds: durationSeconds,
          timestampSeconds,
          note: note.trim() || "Final segment",
          time: nowTime(),
        };
        const nextRows = [finalEntry, ...observations].slice(0, 250);
        completedRows = [finalEntry, ...activeRows];
        setObservations(nextRows);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextRows));
        setLastMarkMs(now);
        setElapsedSeconds(timestampSeconds);
        setNote("");
      }
    }
    const stamp = nowTime();
    setRunning(false);
    setCompletedAt(stamp);
    setCompletedSummary(summarizeRows(completedRows));
  };

  const clearScope = () => {
    const nextRows = observations.filter((row) => !(row.cafe === cafe && row.area === area && row.observationDate === observationDate));
    setObservations(nextRows);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextRows));
  };

  const toggleRecipient = (email) => {
    setSelectedRecipients((prev) => prev.includes(email) ? prev.filter((item) => item !== email) : [...prev, email]);
  };

  const emailReport = () => {
    const body = buildReport({ cafe, area, observer, observationDate, observations: activeRows, summary: completedSummary || summary, note: reportNote, completedAt });
    const subject = `Lean Tool Report - ${cafe} ${area} - ${observationDate}`;
    const to = selectedRecipients.join(",");
    window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const reportSummary = completedSummary || summary;

  return (
    <div className="min-h-screen bg-[#f4f8f7] text-slate-950">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 md:px-6">
        <header className="rounded-[2rem] border border-emerald-200 bg-white p-5 shadow-xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <button onClick={onBackToPlatform} className="inline-flex w-fit items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
              <ArrowLeft size={18} />
              Back to Platform
            </button>
            <CompassOneLogo compact />
          </div>
          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">Lean Tool</p>
              <h1 className="mt-2 text-4xl font-bold tracking-normal md:text-5xl">Fast DOWNTIME observation tracker</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                Built for phone and tablet field walks: watch the work, tap what happened, and send a leader-ready report.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Mobile Mode</p>
                  <p className="mt-1 text-2xl font-bold">Tap, mark, report</p>
                </div>
                <Smartphone className="text-emerald-600" size={34} />
              </div>
              <VersionStamp compact />
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[300px_1fr_360px]">
          <aside className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Observation Setup</p>
            <Segmented label="Cafe / Unit" value={cafe} setValue={setCafe} options={CAFE_OPTIONS} />
            <Segmented label="Area" value={area} setValue={setArea} options={AREA_OPTIONS} />
            <Segmented label="Observer" value={observer} setValue={setObserver} options={OBSERVER_OPTIONS} />
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-emerald-900">
                <UserCheck size={18} />
                Report Scope
              </div>
              <p className="mt-2 text-sm text-emerald-900">{cafe} / {area}</p>
              <p className="text-xs text-emerald-800">{observationDate}</p>
            </div>
          </aside>

          <main className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Live Marking Board</p>
                <h2 className="mt-1 text-3xl font-bold">What are they doing?</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={handleStart} className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold ${running ? "bg-emerald-500 text-white" : "bg-slate-950 text-white"}`}>
                  {running ? <Timer size={18} /> : <Play size={18} />}
                  {running ? "Observing" : "Start"}
                </button>
                <button onClick={completeSession} disabled={!sessionId || !summary.total} className="inline-flex items-center gap-2 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-900 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50">
                  <CheckCircle2 size={18} />
                  Complete
                </button>
                <button onClick={resetSession} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
                  <RotateCcw size={18} />
                  Reset
                </button>
              </div>
            </div>

            <div className={`mt-5 rounded-[2rem] border-2 p-5 shadow-xl ${running ? "border-emerald-300 bg-slate-950 text-white shadow-emerald-200" : completedAt ? "border-emerald-200 bg-emerald-50 text-emerald-950" : "border-slate-200 bg-slate-950 text-white"}`}>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className={`text-xs font-black uppercase tracking-[0.24em] ${running ? "text-emerald-300" : completedAt ? "text-emerald-700" : "text-slate-300"}`}>Observation Timer</p>
                  <p className="mt-1 text-sm font-semibold opacity-70">{running ? "Session is live" : completedAt ? `Completed at ${completedAt}` : "Ready to start"}</p>
                </div>
                <div className={`inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.12em] ${running ? "border-emerald-300 bg-emerald-400/15 text-emerald-200" : completedAt ? "border-emerald-300 bg-white/70 text-emerald-900" : "border-slate-700 bg-white/10 text-slate-200"}`}>
                  <span className={`h-2.5 w-2.5 rounded-full ${running ? "bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.9)]" : completedAt ? "bg-emerald-500" : "bg-slate-400"}`} />
                  {running ? "running" : completedAt ? "complete" : "standby"}
                </div>
              </div>
              <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <p className="font-mono text-[4.6rem] font-black leading-none tracking-normal tabular-nums md:text-[6.4rem]">
                  {formatClock(elapsedSeconds)}
                </p>
                <div className={`grid min-w-[260px] grid-cols-2 gap-2 rounded-3xl border p-3 ${running || !completedAt ? "border-white/10 bg-white/10" : "border-emerald-200 bg-white/70"}`}>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] opacity-60">Last Mark</p>
                    <p className="mt-1 font-mono text-2xl font-black tabular-nums">{activeRows[0] ? `+${formatSeconds(activeRows[0].timestampSeconds)}` : "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] opacity-60">Timed</p>
                    <p className="mt-1 font-mono text-2xl font-black tabular-nums">{formatSeconds(summary.seconds)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5">
              <p className="text-sm font-bold text-slate-700">Activity</p>
              <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-3">
                {ACTIVITIES.map((activity) => (
                  <TapButton key={activity} active={selectedActivity === activity} onClick={() => setSelectedActivity(activity)}>
                    {activity}
                  </TapButton>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <p className="text-sm font-bold text-slate-700">DOWNTIME Waste</p>
              <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                {WASTE_TYPES.map((waste) => (
                  <button key={waste.key} onClick={() => setSelectedWaste(waste.key)} className={`flex items-center gap-3 rounded-2xl border-2 p-3 text-left transition ${selectedWaste === waste.key ? `${colorClasses[waste.color]} shadow-[0_0_0_3px_rgba(16,185,129,0.12)]` : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-lg font-black">{waste.letter}</span>
                    <span>
                      <span className="block font-bold">{waste.label}</span>
                      <span className="block text-xs opacity-70">{waste.examples}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px]">
              <input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Quick note, optional" className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base font-semibold outline-none focus:border-emerald-400" />
              <button onClick={markObservation} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-4 text-lg font-black text-white shadow-lg shadow-emerald-200 hover:bg-emerald-600">
                <CheckCircle2 size={22} />
                Mark
              </button>
            </div>
            {completedAt && (
              <div className="mt-5 rounded-3xl border-2 border-emerald-200 bg-emerald-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Completed Analysis</p>
                <h3 className="mt-2 text-2xl font-black text-emerald-950">{reportSummary.byWasteSeconds[0]?.[0] || "No waste"} led the observation</h3>
                <p className="mt-2 text-sm leading-6 text-emerald-900">
                  {reportSummary.byWasteSeconds[0]
                    ? `${formatSeconds(reportSummary.byWasteSeconds[0][1])} of ${formatSeconds(reportSummary.seconds)} was tied to ${reportSummary.byWasteSeconds[0][0]}. Email Report Out will include the full timestamped breakdown.`
                    : "Add marks to generate a completed Lean read."}
                </p>
              </div>
            )}
          </main>

          <aside className="space-y-4">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Live Summary</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <MiniMetric icon={ClipboardList} label="Marks" value={summary.total} />
                <MiniMetric icon={Timer} label="Timed" value={formatSeconds(summary.seconds)} />
                <MiniMetric icon={BarChart3} label="Top Waste" value={summary.byWasteSeconds[0]?.[0] || "-"} />
                <MiniMetric icon={Clock3} label="Top Activity" value={summary.byActivitySeconds[0]?.[0] || "-"} />
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Recent Marks</p>
                <button onClick={clearScope} className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-bold text-slate-600 hover:bg-slate-50">
                  <Trash2 size={14} />
                  Clear
                </button>
              </div>
              <div className="mt-3 max-h-[260px] space-y-2 overflow-auto pr-1">
                {activeRows.length ? activeRows.slice(0, 12).map((entry) => (
                  <div key={entry.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-slate-900">{entry.activity}</p>
                      <span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-slate-500">{formatSeconds(entry.seconds)}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{entry.waste} at +{formatSeconds(entry.timestampSeconds)} ({entry.time})</p>
                    {entry.note && <p className="mt-1 text-xs text-slate-500">{entry.note}</p>}
                  </div>
                )) : <p className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">No marks yet. Tap an activity, choose a DOWNTIME waste, then Mark.</p>}
              </div>
            </section>

            <section className="rounded-[2rem] border-2 border-emerald-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <Mail className="text-emerald-600" size={20} />
                <p className="text-sm font-black text-slate-900">Email Report Out</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {RECIPIENTS.map((person) => {
                  const active = selectedRecipients.includes(person.email);
                  return (
                    <button key={person.email} onClick={() => toggleRecipient(person.email)} className={`rounded-full border px-3 py-2 text-xs font-bold ${active ? "border-emerald-400 bg-emerald-50 text-emerald-900 shadow-[0_0_0_2px_rgba(16,185,129,0.14)]" : "border-slate-200 bg-white text-slate-600"}`}>
                      {person.name}
                    </button>
                  );
                })}
              </div>
              <textarea value={reportNote} onChange={(event) => setReportNote(event.target.value)} placeholder="Leader note for the report, optional" className="mt-3 min-h-20 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-emerald-400" />
              <button onClick={emailReport} disabled={!selectedRecipients.length || !summary.total} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">
                <Send size={18} />
                Email Report
              </button>
            </section>
          </aside>
        </section>
      </div>
    </div>
  );
}

function Segmented({ label, value, setValue, options }) {
  return (
    <div className="mt-4">
      <p className="text-sm font-bold text-slate-700">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => (
          <button key={option} onClick={() => setValue(option)} className={`rounded-full border px-3 py-2 text-xs font-bold ${value === option ? "border-emerald-400 bg-emerald-50 text-emerald-900 shadow-[0_0_0_2px_rgba(16,185,129,0.14)]" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function TapButton({ active, onClick, children }) {
  return (
    <button onClick={onClick} className={`rounded-2xl border-2 px-4 py-4 text-left text-base font-black transition ${active ? "border-emerald-400 bg-emerald-50 text-emerald-900 shadow-[0_0_0_3px_rgba(16,185,129,0.16)]" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}>
      {children}
    </button>
  );
}

function MiniMetric({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center gap-2 text-slate-500">
        <Icon size={16} />
        <p className="text-xs font-bold uppercase tracking-[0.12em]">{label}</p>
      </div>
      <p className="mt-2 truncate text-xl font-black text-slate-950">{value}</p>
    </div>
  );
}
