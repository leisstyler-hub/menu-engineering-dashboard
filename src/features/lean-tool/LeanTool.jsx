import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, BarChart3, CheckCircle2, ClipboardList, Clock3, Mail, Play, RotateCcw, Send, Smartphone, Timer, Trash2, UserCheck } from "lucide-react";

import CompassOneLogo from "../../shared/ui/CompassOneLogo.jsx";
import VersionStamp from "../../shared/ui/VersionStamp.jsx";

const STORAGE_KEY = "culinaryToolsLeanObservations_v1";
const RESULTS_STORAGE_KEY = "culinaryToolsLeanResults_v1";

const DISTRICTS = {
  South: ["Doppler", "Day 1", "Nitro", "Re:Invent"],
  North: ["Dawson", "Nessie", "Cricket", "Moby", "Commissary", "Atlas"],
  East: ["East Cafe 1", "East Cafe 2", "East Cafe 3"],
  LAX: ["LAX22", "LAX35", "LAX75", "LAX78", "SNA3"],
};

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

function readStoredResults() {
  try {
    return JSON.parse(localStorage.getItem(RESULTS_STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function getDistrictForCafe(cafe = "") {
  return Object.entries(DISTRICTS).find(([, cafes]) => cafes.includes(cafe))?.[0] || "South";
}

function normalizeResult(result) {
  const summary = result.summary || summarizeRows(result.observations || []);
  return {
    ...result,
    district: result.district || getDistrictForCafe(result.cafe),
    summary,
    totalMarks: result.totalMarks ?? summary.total,
    observedSeconds: result.observedSeconds ?? summary.seconds,
    topWaste: result.topWaste || summary.byWasteSeconds[0]?.[0] || "",
    topActivity: result.topActivity || summary.byActivitySeconds[0]?.[0] || "",
  };
}

function saveLeanResult(nextResult, existingResults = []) {
  const normalized = normalizeResult(nextResult);
  const nextResults = [
    normalized,
    ...existingResults.filter((result) => result.id !== normalized.id),
  ].slice(0, 100);
  localStorage.setItem(RESULTS_STORAGE_KEY, JSON.stringify(nextResults));
  return nextResults;
}

function getRecommendation(summary) {
  const topWaste = summary.byWasteSeconds[0];
  if (!topWaste) return "Primary opportunity: complete an observation session to generate a recommendation.";
  if (topWaste[0] === "Motion") return "Primary opportunity: reduce walking/searching by staging tools, ingredients, or labels closer to the point of use.";
  if (topWaste[0] === "Waiting") return "Primary opportunity: identify the constraint causing idle time and rebalance handoffs, prep readiness, or equipment access.";
  if (topWaste[0] === "Defects") return "Primary opportunity: reduce rework by clarifying standards, recipes, tickets, or quality checks before service.";
  return `Primary opportunity: focus first on ${topWaste[0]} because it consumed the largest observed time block.`;
}

function buildReport({ cafe, area, observer, observationDate, observations, summary, note, completedAt }) {
  const topWaste = summary.byWasteSeconds[0];
  const topActivity = summary.byActivitySeconds[0];
  const wasteLines = summary.byWasteSeconds.map(([name, seconds]) => `- ${name}: ${formatSeconds(seconds)} (${summary.seconds ? ((seconds / summary.seconds) * 100).toFixed(0) : 0}%)`).join("\n") || "- No waste time captured";
  const activityLines = summary.byActivitySeconds.map(([name, seconds]) => `- ${name}: ${formatSeconds(seconds)} (${summary.seconds ? ((seconds / summary.seconds) * 100).toFixed(0) : 0}%)`).join("\n") || "- No activity time captured";
  const latest = observations.slice().reverse().map((entry) => `- +${formatSeconds(entry.timestampSeconds)}: ${entry.activity} / ${entry.waste} for ${formatSeconds(entry.seconds)}${entry.note ? ` - ${entry.note}` : ""}`).join("\n") || "- No observations captured";
  const recommendation = getRecommendation(summary);

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
  const emailSectionRef = useRef(null);
  const [viewMode, setViewMode] = useState("tracker");
  const [district, setDistrict] = useState("South");
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
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [emailHighlight, setEmailHighlight] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState(() => RECIPIENTS.map((person) => person.email));
  const [observations, setObservations] = useState(readStoredObservations);
  const [results, setResults] = useState(() => readStoredResults().map(normalizeResult));
  const [resultsDistrict, setResultsDistrict] = useState("All");
  const [resultsCafe, setResultsCafe] = useState("All");
  const [resultsArea, setResultsArea] = useState("All");

  const cafesForDistrict = DISTRICTS[district] || [];

  useEffect(() => {
    if (district && cafe && !cafesForDistrict.includes(cafe)) {
      setCafe(cafesForDistrict[0] || "");
    }
  }, [district, cafe, cafesForDistrict]);

  const scopedObservations = observations.filter((row) => (row.district || getDistrictForCafe(row.cafe)) === district && row.cafe === cafe && row.area === area && row.observationDate === observationDate);
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
    setShowCompletionModal(false);
    setEmailHighlight(false);
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
    setShowCompletionModal(false);
    setEmailHighlight(false);
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
    setShowCompletionModal(false);
    setEmailHighlight(false);
    const nextEntry = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      sessionId: activeSessionId,
      district,
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
          district,
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
    const finalSummary = summarizeRows(completedRows);
    const completedResult = {
      id: sessionId || `${now}-${Math.random().toString(16).slice(2)}`,
      sessionId: sessionId || "",
      district,
      cafe,
      area,
      observer,
      observationDate,
      completedAt: stamp,
      completedTimestamp: new Date(now).toISOString(),
      observations: completedRows,
      summary: finalSummary,
      totalMarks: finalSummary.total,
      observedSeconds: finalSummary.seconds,
      topWaste: finalSummary.byWasteSeconds[0]?.[0] || "",
      topActivity: finalSummary.byActivitySeconds[0]?.[0] || "",
      recommendation: getRecommendation(finalSummary),
    };
    setResults((prev) => saveLeanResult(completedResult, prev));
    setRunning(false);
    setCompletedAt(stamp);
    setCompletedSummary(finalSummary);
    setShowCompletionModal(true);
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

  const handleCompletionOk = () => {
    setShowCompletionModal(false);
    setEmailHighlight(true);
    window.setTimeout(() => {
      emailSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
    window.setTimeout(() => setEmailHighlight(false), 4500);
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

        <nav className="flex w-fit rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
          <button onClick={() => setViewMode("tracker")} className={`rounded-xl px-5 py-3 text-sm font-black ${viewMode === "tracker" ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-50"}`}>
            Tracker
          </button>
          <button onClick={() => setViewMode("results")} className={`rounded-xl px-5 py-3 text-sm font-black ${viewMode === "results" ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-50"}`}>
            Results
          </button>
        </nav>

        {viewMode === "tracker" ? (
        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[300px_1fr_360px]">
          <aside className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Observation Setup</p>
            <Segmented label="District" value={district} setValue={setDistrict} options={Object.keys(DISTRICTS)} />
            <Segmented label="Cafe / Unit" value={cafe} setValue={setCafe} options={cafesForDistrict} />
            <Segmented label="Area" value={area} setValue={setArea} options={AREA_OPTIONS} />
            <Segmented label="Observer" value={observer} setValue={setObserver} options={OBSERVER_OPTIONS} />
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-emerald-900">
                <UserCheck size={18} />
                Report Scope
              </div>
              <p className="mt-2 text-sm text-emerald-900">{district} / {cafe} / {area}</p>
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

            <section ref={emailSectionRef} className={`rounded-[2rem] border-2 bg-white p-4 shadow-sm transition-all duration-500 ${emailHighlight ? "border-emerald-400 shadow-[0_0_0_6px_rgba(16,185,129,0.18),0_20px_45px_rgba(15,23,42,0.12)]" : "border-emerald-200"}`}>
              <div className="flex items-center gap-2">
                <Mail className="text-emerald-600" size={20} />
                <p className="text-sm font-black text-slate-900">Email Report Out</p>
              </div>
              {emailHighlight && (
                <div className="mt-3 rounded-2xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-emerald-900">
                  Completed report is ready to send
                </div>
              )}
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
        ) : (
          <LeanResultsView
            results={results}
            resultsDistrict={resultsDistrict}
            setResultsDistrict={setResultsDistrict}
            resultsCafe={resultsCafe}
            setResultsCafe={setResultsCafe}
            resultsArea={resultsArea}
            setResultsArea={setResultsArea}
          />
        )}
      </div>
      {showCompletionModal && completedSummary && (
        <CompletionReportModal
          cafe={cafe}
          area={area}
          observer={observer}
          observationDate={observationDate}
          completedAt={completedAt}
          observations={activeRows}
          summary={completedSummary}
          onOk={handleCompletionOk}
        />
      )}
    </div>
  );
}

function LeanResultsView({ results, resultsDistrict, setResultsDistrict, resultsCafe, setResultsCafe, resultsArea, setResultsArea }) {
  const normalizedResults = useMemo(() => results.map(normalizeResult).sort((a, b) => String(b.completedTimestamp || "").localeCompare(String(a.completedTimestamp || ""))), [results]);
  const cafeOptions = Array.from(new Set(normalizedResults.map((result) => result.cafe).filter(Boolean))).sort();
  const areaOptions = Array.from(new Set(normalizedResults.map((result) => result.area).filter(Boolean))).sort();
  const filteredResults = normalizedResults.filter((result) =>
    (resultsDistrict === "All" || result.district === resultsDistrict) &&
    (resultsCafe === "All" || result.cafe === resultsCafe) &&
    (resultsArea === "All" || result.area === resultsArea)
  );
  const [selectedResultId, setSelectedResultId] = useState("");

  useEffect(() => {
    if (!filteredResults.length) {
      setSelectedResultId("");
      return;
    }
    if (!filteredResults.some((result) => result.id === selectedResultId)) {
      setSelectedResultId(filteredResults[0].id);
    }
  }, [filteredResults, selectedResultId]);

  const selectedResult = filteredResults.find((result) => result.id === selectedResultId) || filteredResults[0] || null;
  const totalObservedSeconds = filteredResults.reduce((sum, result) => sum + Number(result.observedSeconds || 0), 0);
  const totalMarks = filteredResults.reduce((sum, result) => sum + Number(result.totalMarks || 0), 0);
  const topWaste = tallySeconds(filteredResults.map((result) => ({ waste: result.topWaste || "Unclassified", seconds: result.observedSeconds || 0 })), "waste")[0];
  const cafeStationRows = filteredResults.reduce((acc, result) => {
    const key = `${result.district}|${result.cafe}|${result.area}`;
    if (!acc[key]) {
      acc[key] = {
        key,
        district: result.district,
        cafe: result.cafe,
        area: result.area,
        count: 0,
        seconds: 0,
        topWasteSeconds: {},
      };
    }
    acc[key].count += 1;
    acc[key].seconds += Number(result.observedSeconds || 0);
    acc[key].topWasteSeconds[result.topWaste || "Unclassified"] = (acc[key].topWasteSeconds[result.topWaste || "Unclassified"] || 0) + Number(result.observedSeconds || 0);
    return acc;
  }, {});
  const stationRows = Object.values(cafeStationRows).sort((a, b) => b.seconds - a.seconds);

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">Lean Results</p>
          <h2 className="mt-2 text-4xl font-black tracking-normal">Observation history</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Filter by district, cafe, and station. Click a cafe/station result to open the completed observation report.</p>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <ResultFilter label="District" value={resultsDistrict} setValue={setResultsDistrict} options={["All", ...Object.keys(DISTRICTS)]} />
          <ResultFilter label="Cafe" value={resultsCafe} setValue={setResultsCafe} options={["All", ...cafeOptions]} />
          <ResultFilter label="Station" value={resultsArea} setValue={setResultsArea} options={["All", ...areaOptions]} />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-4">
        <MiniMetric icon={ClipboardList} label="Results" value={filteredResults.length} />
        <MiniMetric icon={Timer} label="Observed" value={formatSeconds(totalObservedSeconds)} />
        <MiniMetric icon={CheckCircle2} label="Marks" value={totalMarks} />
        <MiniMetric icon={BarChart3} label="Top Waste" value={topWaste?.[0] || "-"} />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[420px_1fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Cafe / Station List</p>
          <div className="mt-3 space-y-3">
            {stationRows.length ? stationRows.map((row) => {
              const stationTopWaste = Object.entries(row.topWasteSeconds).sort((a, b) => b[1] - a[1])[0];
              const firstResult = filteredResults.find((result) => result.district === row.district && result.cafe === row.cafe && result.area === row.area);
              const active = firstResult && selectedResult?.district === row.district && selectedResult?.cafe === row.cafe && selectedResult?.area === row.area;
              return (
                <button key={row.key} onClick={() => firstResult && setSelectedResultId(firstResult.id)} className={`w-full rounded-3xl border-2 p-4 text-left transition ${active ? "border-emerald-400 bg-emerald-50 shadow-[0_0_0_4px_rgba(16,185,129,0.14)]" : "border-slate-200 bg-white hover:border-emerald-200"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">{row.district}</p>
                      <h3 className="mt-1 text-xl font-black text-slate-950">{row.cafe}</h3>
                      <p className="mt-1 text-sm font-bold text-slate-600">{row.area}</p>
                    </div>
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black text-slate-600">{row.count} result{row.count === 1 ? "" : "s"}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-slate-600">
                    <span className="rounded-full bg-slate-100 px-3 py-1">{formatSeconds(row.seconds)}</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1">Top: {stationTopWaste?.[0] || "-"}</span>
                  </div>
                </button>
              );
            }) : <p className="rounded-3xl border border-dashed border-slate-200 bg-white p-5 text-sm font-semibold text-slate-500">No completed Lean results match these filters yet.</p>}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
          {selectedResult ? (
            <LeanResultDetail result={selectedResult} sameScopeResults={filteredResults.filter((result) => result.district === selectedResult.district && result.cafe === selectedResult.cafe && result.area === selectedResult.area)} setSelectedResultId={setSelectedResultId} />
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <p className="text-lg font-black text-slate-900">Complete a Lean observation to create a result.</p>
              <p className="mt-2 text-sm text-slate-500">Results save in this app first. Smartsheet can become the shared source once we add the sheet or columns.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function LeanResultDetail({ result, sameScopeResults, setSelectedResultId }) {
  const summary = result.summary || summarizeRows(result.observations || []);
  const topWaste = summary.byWasteSeconds[0];
  const topActivity = summary.byActivitySeconds[0];
  return (
    <div>
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">Selected Result</p>
          <h3 className="mt-2 text-3xl font-black text-slate-950">{result.cafe} / {result.area}</h3>
          <p className="mt-2 text-sm font-semibold text-slate-600">{result.district} - {result.observationDate} - {result.observer} - Completed {result.completedAt || "n/a"}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">Observed</p>
          <p className="mt-1 font-mono text-3xl font-black text-emerald-950">{formatSeconds(summary.seconds)}</p>
        </div>
      </div>

      {sameScopeResults.length > 1 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {sameScopeResults.map((entry) => (
            <button key={entry.id} onClick={() => setSelectedResultId(entry.id)} className={`rounded-full border px-3 py-2 text-xs font-black ${entry.id === result.id ? "border-emerald-400 bg-emerald-50 text-emerald-900" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
              {entry.observationDate} - {entry.completedAt || "complete"}
            </button>
          ))}
        </div>
      )}

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
        <MiniMetric icon={ClipboardList} label="Marks" value={summary.total} />
        <MiniMetric icon={BarChart3} label="Top Waste" value={topWaste?.[0] || "-"} />
        <MiniMetric icon={Clock3} label="Top Activity" value={topActivity?.[0] || "-"} />
      </div>

      <div className="mt-5 rounded-3xl border border-emerald-200 bg-emerald-50 p-4">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Leadership Read</p>
        <p className="mt-2 text-lg font-black text-emerald-950">{topWaste ? `${topWaste[0]} is the largest observed opportunity.` : "No top waste captured yet."}</p>
        <p className="mt-2 text-sm leading-6 text-emerald-900">{result.recommendation || getRecommendation(summary)}</p>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ReportBreakdown title="DOWNTIME Breakdown" rows={summary.byWasteSeconds} totalSeconds={summary.seconds} />
        <ReportBreakdown title="Activity Breakdown" rows={summary.byActivitySeconds} totalSeconds={summary.seconds} />
      </div>

      <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Timestamped Marks</p>
        <div className="mt-3 space-y-2">
          {(result.observations || []).slice().reverse().map((entry) => (
            <div key={entry.id} className="rounded-2xl border border-slate-200 bg-white p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="font-black text-slate-950">+{formatSeconds(entry.timestampSeconds)} - {entry.activity}</p>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-600">{formatSeconds(entry.seconds)}</span>
              </div>
              <p className="mt-1 text-sm text-slate-600">{entry.waste}{entry.note ? ` - ${entry.note}` : ""}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ResultFilter({ label, value, setValue, options }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-black uppercase tracking-[0.14em] text-slate-500">{label}</span>
      <select value={value} onChange={(event) => setValue(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-900 outline-none focus:border-emerald-400">
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function CompletionReportModal({ cafe, area, observer, observationDate, completedAt, observations, summary, onOk }) {
  const topWaste = summary.byWasteSeconds[0];
  const topActivity = summary.byActivitySeconds[0];
  const latestMarks = observations.slice().reverse().slice(0, 5);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-auto rounded-[2rem] border border-emerald-200 bg-white p-5 shadow-2xl md:p-6">
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">Completed Lean Read</p>
            <h2 className="mt-2 text-3xl font-black text-slate-950">Observation report is ready</h2>
            <p className="mt-2 text-sm font-semibold text-slate-600">{cafe} / {area} • {observationDate} • {observer} • Completed {completedAt}</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">Observed</p>
            <p className="mt-1 font-mono text-3xl font-black tabular-nums text-emerald-950">{formatSeconds(summary.seconds)}</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
          <MiniMetric icon={ClipboardList} label="Marks" value={summary.total} />
          <MiniMetric icon={BarChart3} label="Top Waste" value={topWaste?.[0] || "-"} />
          <MiniMetric icon={Clock3} label="Top Activity" value={topActivity?.[0] || "-"} />
        </div>

        <div className="mt-5 rounded-3xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Smart Read</p>
          <p className="mt-2 text-lg font-black text-emerald-950">
            {topWaste ? `${topWaste[0]} led the observed waste at ${formatSeconds(topWaste[1])}.` : "No DOWNTIME pattern captured yet."}
          </p>
          <p className="mt-2 text-sm leading-6 text-emerald-900">{getRecommendation(summary)}</p>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <ReportBreakdown title="DOWNTIME Breakdown" rows={summary.byWasteSeconds} totalSeconds={summary.seconds} />
          <ReportBreakdown title="Activity Breakdown" rows={summary.byActivitySeconds} totalSeconds={summary.seconds} />
        </div>

        <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Timestamped Marks</p>
          <div className="mt-3 space-y-2">
            {latestMarks.length ? latestMarks.map((entry) => (
              <div key={entry.id} className="rounded-2xl border border-slate-200 bg-white p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-black text-slate-950">+{formatSeconds(entry.timestampSeconds)} • {entry.activity}</p>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-600">{formatSeconds(entry.seconds)}</span>
                </div>
                <p className="mt-1 text-sm text-slate-600">{entry.waste}{entry.note ? ` - ${entry.note}` : ""}</p>
              </div>
            )) : <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">No timestamped marks captured.</p>}
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm font-semibold text-slate-600">Click OK to return to the Lean Tool and send the email report out.</p>
          <button onClick={onOk} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 py-4 text-sm font-black text-white shadow-lg shadow-emerald-200 hover:bg-emerald-600">
            <CheckCircle2 size={20} />
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

function ReportBreakdown({ title, rows, totalSeconds }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{title}</p>
      <div className="mt-3 space-y-3">
        {rows.length ? rows.slice(0, 5).map(([name, seconds]) => {
          const percent = totalSeconds ? Math.round((seconds / totalSeconds) * 100) : 0;
          return (
            <div key={name}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <p className="font-black text-slate-900">{name}</p>
                <p className="font-mono font-black text-slate-600">{formatSeconds(seconds)} • {percent}%</p>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.max(4, Math.min(100, percent))}%` }} />
              </div>
            </div>
          );
        }) : <p className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">No time captured yet.</p>}
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
