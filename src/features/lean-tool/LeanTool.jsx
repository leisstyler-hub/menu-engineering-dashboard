import React, { useMemo, useState } from "react";
import { ArrowLeft, BarChart3, CheckCircle2, ClipboardList, Clock3, Mail, Pause, Play, RotateCcw, Send, Smartphone, Timer, Trash2, UserCheck } from "lucide-react";

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
const OBSERVER_OPTIONS = ["Tyler Leiss", "Chef", "Manager", "Leader"];

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

function readStoredObservations() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function buildReport({ cafe, area, observer, observationDate, observations, summary, note }) {
  const topWaste = summary.byWaste[0];
  const topActivity = summary.byActivity[0];
  const wasteLines = summary.byWaste.map(([name, count]) => `- ${name}: ${count}`).join("\n") || "- No waste marks yet";
  const activityLines = summary.byActivity.map(([name, count]) => `- ${name}: ${count}`).join("\n") || "- No activity marks yet";
  const latest = observations.slice(0, 8).map((entry) => `- ${entry.time}: ${entry.activity} / ${entry.waste} (${entry.seconds}s)${entry.note ? ` - ${entry.note}` : ""}`).join("\n") || "- No observations captured";

  return [
    "Lean Tool Observation Report",
    "",
    `Cafe / Unit: ${cafe}`,
    `Area: ${area}`,
    `Date: ${observationDate}`,
    `Observer: ${observer}`,
    "",
    "Summary",
    `Total observations: ${summary.total}`,
    `Observed seconds: ${summary.seconds}`,
    `Top waste: ${topWaste ? `${topWaste[0]} (${topWaste[1]})` : "n/a"}`,
    `Top activity: ${topActivity ? `${topActivity[0]} (${topActivity[1]})` : "n/a"}`,
    "",
    "DOWNTIME Pattern",
    wasteLines,
    "",
    "Activity Pattern",
    activityLines,
    "",
    "Recent Marks",
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

export default function LeanTool({ onBackToPlatform }) {
  const [cafe, setCafe] = useState("Doppler");
  const [area, setArea] = useState("Line");
  const [observer, setObserver] = useState("Tyler Leiss");
  const [observationDate] = useState(today);
  const [selectedActivity, setSelectedActivity] = useState("Walking");
  const [selectedWaste, setSelectedWaste] = useState("Motion");
  const [seconds, setSeconds] = useState(30);
  const [note, setNote] = useState("");
  const [reportNote, setReportNote] = useState("");
  const [running, setRunning] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState(() => RECIPIENTS.map((person) => person.email));
  const [observations, setObservations] = useState(readStoredObservations);

  const scopedObservations = observations.filter((row) => row.cafe === cafe && row.area === area && row.observationDate === observationDate);
  const summary = useMemo(() => ({
    total: scopedObservations.length,
    seconds: scopedObservations.reduce((sum, row) => sum + Number(row.seconds || 0), 0),
    byWaste: tally(scopedObservations, "waste"),
    byActivity: tally(scopedObservations, "activity"),
  }), [scopedObservations]);

  const markObservation = () => {
    const nextEntry = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      cafe,
      area,
      observer,
      observationDate,
      activity: selectedActivity,
      waste: selectedWaste,
      seconds,
      note: note.trim(),
      time: nowTime(),
    };
    const nextRows = [nextEntry, ...observations].slice(0, 250);
    setObservations(nextRows);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextRows));
    setNote("");
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
    const body = buildReport({ cafe, area, observer, observationDate, observations: scopedObservations, summary, note: reportNote });
    const subject = `Lean Tool Report - ${cafe} ${area} - ${observationDate}`;
    const to = selectedRecipients.join(",");
    window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

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
                <button onClick={() => setRunning((value) => !value)} className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold ${running ? "bg-emerald-500 text-white" : "bg-slate-950 text-white"}`}>
                  {running ? <Pause size={18} /> : <Play size={18} />}
                  {running ? "Observing" : "Start"}
                </button>
                <button onClick={() => setSeconds(30)} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
                  <RotateCcw size={18} />
                  Reset
                </button>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              {[15, 30, 60].map((option) => (
                <button key={option} onClick={() => setSeconds(option)} className={`rounded-2xl border px-4 py-4 text-lg font-bold ${seconds === option ? "border-emerald-400 bg-emerald-50 text-emerald-900 shadow-[0_0_0_3px_rgba(16,185,129,0.16)]" : "border-slate-200 bg-white text-slate-700"}`}>
                  {option}s
                </button>
              ))}
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
          </main>

          <aside className="space-y-4">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Live Summary</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <MiniMetric icon={ClipboardList} label="Marks" value={summary.total} />
                <MiniMetric icon={Timer} label="Seconds" value={summary.seconds} />
                <MiniMetric icon={BarChart3} label="Top Waste" value={summary.byWaste[0]?.[0] || "-"} />
                <MiniMetric icon={Clock3} label="Top Activity" value={summary.byActivity[0]?.[0] || "-"} />
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
                {scopedObservations.length ? scopedObservations.slice(0, 12).map((entry) => (
                  <div key={entry.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-slate-900">{entry.activity}</p>
                      <span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-slate-500">{entry.seconds}s</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{entry.waste} at {entry.time}</p>
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
