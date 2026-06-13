import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, BarChart3, CheckCircle2, ClipboardList, Clock3, Mail, Play, RotateCcw, Send, Smartphone, Timer, Trash2, UserCheck } from "lucide-react";

import { loadRecordsFromSmartsheet, syncRecordsToSmartsheet } from "../../integrations/smartsheet/client.js";
import { SMARTSHEET_COLUMNS, SMARTSHEET_RECORD_TYPES } from "../../integrations/smartsheet/contract.js";
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
const LEAN_AUDIENCE_ROLES = ["SVP", "VPO", "RDO", "DM", "DC", "EC", "DR", "GM", "Chef", "Manager"];
const VOID_REASONS = ["Test record", "Accident", "Duplicate", "Wrong cafe/station", "Training/demo", "Other"];
const VOIDED_STATUSES = new Set(["Void", "Voided", "Deleted", "Test / Void"]);

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
const yesNo = (value) => (value ? "Yes" : "No");
const isYes = (value) => ["true", "yes", "y", "1"].includes(String(value || "").trim().toLowerCase());
const isTestVoidReason = (value) => /test|training|demo/i.test(String(value || ""));
const isVoidedResult = (result = {}) => VOIDED_STATUSES.has(String(result.status || ""));
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
  const status = result.status || "Completed";
  const voidReason = result.voidReason || "";
  return {
    ...result,
    status,
    district: result.district || getDistrictForCafe(result.cafe),
    summary,
    totalMarks: result.totalMarks ?? summary.total,
    observedSeconds: result.observedSeconds ?? summary.seconds,
    topWaste: result.topWaste || summary.byWasteSeconds[0]?.[0] || "",
    topActivity: result.topActivity || summary.byActivitySeconds[0]?.[0] || "",
    visibleInDashboard: result.visibleInDashboard ?? !VOIDED_STATUSES.has(String(status || "")),
    voidReason,
    voidedBy: result.voidedBy || "",
    voidedAt: result.voidedAt || "",
    voidNotes: result.voidNotes || "",
    isTestRecord: Boolean(result.isTestRecord) || isTestVoidReason(voidReason),
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

function breakdownText(rows = []) {
  return rows.map(([name, seconds]) => `${name}: ${formatSeconds(seconds)}`).join("; ");
}

function leanParentRecordId(result) {
  return `lean|${result.sessionId || result.id}`;
}

function buildLeanSmartsheetRecords(result) {
  const normalized = normalizeResult(result);
  const parentId = leanParentRecordId(normalized);
  const summary = normalized.summary || summarizeRows(normalized.observations || []);
  const submittedAt = normalized.completedTimestamp || new Date().toISOString();
  const status = normalized.status || "Completed";
  const visibleInDashboard = normalized.visibleInDashboard !== false && !isVoidedResult(normalized);
  const base = {
    [SMARTSHEET_COLUMNS.parentRecordId]: parentId,
    [SMARTSHEET_COLUMNS.status]: status,
    [SMARTSHEET_COLUMNS.district]: normalized.district,
    [SMARTSHEET_COLUMNS.cafeUnit]: normalized.cafe,
    [SMARTSHEET_COLUMNS.businessDate]: normalized.observationDate,
    [SMARTSHEET_COLUMNS.station]: normalized.area,
    [SMARTSHEET_COLUMNS.stationDisplayName]: normalized.area,
    [SMARTSHEET_COLUMNS.stationKey]: normalized.area,
    [SMARTSHEET_COLUMNS.submittedBy]: normalized.observer,
    [SMARTSHEET_COLUMNS.submittedAt]: submittedAt,
    [SMARTSHEET_COLUMNS.updatedBy]: normalized.voidedBy || normalized.observer,
    [SMARTSHEET_COLUMNS.updatedAt]: normalized.voidedAt || submittedAt,
    [SMARTSHEET_COLUMNS.voidReason]: normalized.voidReason || "",
    [SMARTSHEET_COLUMNS.voidedBy]: normalized.voidedBy || "",
    [SMARTSHEET_COLUMNS.voidedAt]: normalized.voidedAt || "",
    [SMARTSHEET_COLUMNS.voidNotes]: normalized.voidNotes || "",
    [SMARTSHEET_COLUMNS.visibleInDashboard]: yesNo(visibleInDashboard),
    [SMARTSHEET_COLUMNS.isTestRecord]: yesNo(Boolean(normalized.isTestRecord)),
    [SMARTSHEET_COLUMNS.leanSessionId]: normalized.sessionId || normalized.id,
    [SMARTSHEET_COLUMNS.leanAudienceRoles]: LEAN_AUDIENCE_ROLES.join(", "),
    [SMARTSHEET_COLUMNS.leanObserverRole]: normalized.observer,
  };

  const header = {
    ...base,
    [SMARTSHEET_COLUMNS.recordId]: parentId,
    [SMARTSHEET_COLUMNS.parentRecordId]: "",
    [SMARTSHEET_COLUMNS.recordType]: SMARTSHEET_RECORD_TYPES.leanObservationResult,
    [SMARTSHEET_COLUMNS.savedEntryCount]: summary.total,
    [SMARTSHEET_COLUMNS.notes]: normalized.recommendation || getRecommendation(summary),
    [SMARTSHEET_COLUMNS.leanObservedSeconds]: Number(summary.seconds || 0).toFixed(1),
    [SMARTSHEET_COLUMNS.leanTotalMarks]: summary.total,
    [SMARTSHEET_COLUMNS.leanTopWaste]: summary.byWasteSeconds[0]?.[0] || "",
    [SMARTSHEET_COLUMNS.leanTopActivity]: summary.byActivitySeconds[0]?.[0] || "",
    [SMARTSHEET_COLUMNS.leanRecommendation]: normalized.recommendation || getRecommendation(summary),
    [SMARTSHEET_COLUMNS.leanWasteBreakdown]: breakdownText(summary.byWasteSeconds),
    [SMARTSHEET_COLUMNS.leanActivityBreakdown]: breakdownText(summary.byActivitySeconds),
  };

  const markRows = (normalized.observations || []).slice().reverse().map((entry, index) => ({
    ...base,
    [SMARTSHEET_COLUMNS.recordId]: `${parentId}|mark|${index + 1}`,
    [SMARTSHEET_COLUMNS.parentRecordId]: parentId,
    [SMARTSHEET_COLUMNS.recordType]: SMARTSHEET_RECORD_TYPES.leanObservationMark,
    [SMARTSHEET_COLUMNS.slotNumber]: index + 1,
    [SMARTSHEET_COLUMNS.notes]: entry.note || "",
    [SMARTSHEET_COLUMNS.leanActivity]: entry.activity || "",
    [SMARTSHEET_COLUMNS.leanWaste]: entry.waste || "",
    [SMARTSHEET_COLUMNS.leanTimestampSeconds]: Number(entry.timestampSeconds || 0).toFixed(1),
    [SMARTSHEET_COLUMNS.leanDurationSeconds]: Number(entry.seconds || 0).toFixed(1),
    [SMARTSHEET_COLUMNS.leanMarkTime]: entry.time || "",
  }));

  return [header, ...markRows];
}

function parseLeanResultsFromSmartsheet(records = []) {
  const leanHeaders = records.filter((record) => record[SMARTSHEET_COLUMNS.recordType] === SMARTSHEET_RECORD_TYPES.leanObservationResult);
  const leanMarks = records.filter((record) => record[SMARTSHEET_COLUMNS.recordType] === SMARTSHEET_RECORD_TYPES.leanObservationMark);
  const marksByParent = leanMarks.reduce((acc, record) => {
    const parentId = String(record[SMARTSHEET_COLUMNS.parentRecordId] || "");
    if (!parentId) return acc;
    if (!acc[parentId]) acc[parentId] = [];
    acc[parentId].push(record);
    return acc;
  }, {});

  return leanHeaders.map((record) => {
    const parentId = String(record[SMARTSHEET_COLUMNS.recordId] || "");
    const observations = (marksByParent[parentId] || [])
      .sort((a, b) => Number(a[SMARTSHEET_COLUMNS.slotNumber] || 0) - Number(b[SMARTSHEET_COLUMNS.slotNumber] || 0))
      .map((mark, index) => ({
        id: String(mark[SMARTSHEET_COLUMNS.recordId] || `${parentId}|mark|${index + 1}`),
        sessionId: String(record[SMARTSHEET_COLUMNS.leanSessionId] || parentId),
        district: String(mark[SMARTSHEET_COLUMNS.district] || record[SMARTSHEET_COLUMNS.district] || ""),
        cafe: String(mark[SMARTSHEET_COLUMNS.cafeUnit] || record[SMARTSHEET_COLUMNS.cafeUnit] || ""),
        area: String(mark[SMARTSHEET_COLUMNS.stationDisplayName] || mark[SMARTSHEET_COLUMNS.station] || record[SMARTSHEET_COLUMNS.stationDisplayName] || ""),
        observer: String(mark[SMARTSHEET_COLUMNS.leanObserverRole] || record[SMARTSHEET_COLUMNS.leanObserverRole] || ""),
        observationDate: String(mark[SMARTSHEET_COLUMNS.businessDate] || record[SMARTSHEET_COLUMNS.businessDate] || ""),
        activity: String(mark[SMARTSHEET_COLUMNS.leanActivity] || ""),
        waste: String(mark[SMARTSHEET_COLUMNS.leanWaste] || ""),
        seconds: Number(mark[SMARTSHEET_COLUMNS.leanDurationSeconds] || 0),
        timestampSeconds: Number(mark[SMARTSHEET_COLUMNS.leanTimestampSeconds] || 0),
        note: String(mark[SMARTSHEET_COLUMNS.notes] || ""),
        time: String(mark[SMARTSHEET_COLUMNS.leanMarkTime] || ""),
      }));
    const summary = summarizeRows(observations);
    return normalizeResult({
      id: parentId,
      sessionId: String(record[SMARTSHEET_COLUMNS.leanSessionId] || parentId),
      status: String(record[SMARTSHEET_COLUMNS.status] || "Completed"),
      district: String(record[SMARTSHEET_COLUMNS.district] || ""),
      cafe: String(record[SMARTSHEET_COLUMNS.cafeUnit] || ""),
      area: String(record[SMARTSHEET_COLUMNS.stationDisplayName] || record[SMARTSHEET_COLUMNS.station] || ""),
      observer: String(record[SMARTSHEET_COLUMNS.leanObserverRole] || record[SMARTSHEET_COLUMNS.submittedBy] || ""),
      observationDate: String(record[SMARTSHEET_COLUMNS.businessDate] || ""),
      completedAt: String(record[SMARTSHEET_COLUMNS.submittedAt] || ""),
      completedTimestamp: String(record[SMARTSHEET_COLUMNS.submittedAt] || ""),
      observations,
      summary,
      totalMarks: Number(record[SMARTSHEET_COLUMNS.leanTotalMarks] || summary.total),
      observedSeconds: Number(record[SMARTSHEET_COLUMNS.leanObservedSeconds] || summary.seconds),
      topWaste: String(record[SMARTSHEET_COLUMNS.leanTopWaste] || summary.byWasteSeconds[0]?.[0] || ""),
      topActivity: String(record[SMARTSHEET_COLUMNS.leanTopActivity] || summary.byActivitySeconds[0]?.[0] || ""),
      recommendation: String(record[SMARTSHEET_COLUMNS.leanRecommendation] || record[SMARTSHEET_COLUMNS.notes] || ""),
      visibleInDashboard: !record[SMARTSHEET_COLUMNS.visibleInDashboard] || isYes(record[SMARTSHEET_COLUMNS.visibleInDashboard]),
      voidReason: String(record[SMARTSHEET_COLUMNS.voidReason] || ""),
      voidedBy: String(record[SMARTSHEET_COLUMNS.voidedBy] || ""),
      voidedAt: String(record[SMARTSHEET_COLUMNS.voidedAt] || ""),
      voidNotes: String(record[SMARTSHEET_COLUMNS.voidNotes] || ""),
      isTestRecord: isYes(record[SMARTSHEET_COLUMNS.isTestRecord]),
    });
  });
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
  const [leanSyncStatus, setLeanSyncStatus] = useState({ state: "idle", message: "Smartsheet ready" });
  const [leanLoadStatus, setLeanLoadStatus] = useState({ state: "idle", message: "Local results loaded" });
  const [voidTarget, setVoidTarget] = useState(null);
  const [voidReason, setVoidReason] = useState("Test record");
  const [voidedBy, setVoidedBy] = useState("DM");
  const [voidNotes, setVoidNotes] = useState("");

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

  const syncLeanResultToSmartsheet = async (result) => {
    const records = buildLeanSmartsheetRecords(result);
    setLeanSyncStatus({ state: "syncing", message: "Syncing Lean result to Smartsheet..." });
    try {
      const payload = await syncRecordsToSmartsheet(records, {
        tool: "Lean Tool",
        recordType: SMARTSHEET_RECORD_TYPES.leanObservationResult,
        district: result.district,
        cafe: result.cafe,
        station: result.area,
        requiredColumnMode: "used-columns-only",
        autoCreateMissingColumns: true,
      });
      const created = payload.autoCreatedColumns?.length ? ` Added ${payload.autoCreatedColumns.length} Lean column${payload.autoCreatedColumns.length === 1 ? "" : "s"}.` : "";
      setLeanSyncStatus({ state: "synced", message: `${payload.message || "Lean result synced to Smartsheet."}${created}` });
    } catch (error) {
      setLeanSyncStatus({ state: "error", message: error?.payload?.message || error.message || "Lean Smartsheet sync failed." });
    }
  };

  const refreshLeanResultsFromSmartsheet = async () => {
    setLeanLoadStatus({ state: "loading", message: "Loading Lean results from Smartsheet..." });
    try {
      const records = await loadRecordsFromSmartsheet({ tool: "lean" });
      const sharedResults = parseLeanResultsFromSmartsheet(records);
      const merged = [
        ...sharedResults,
        ...results.filter((local) => !sharedResults.some((shared) => shared.id === local.id)),
      ].map(normalizeResult).slice(0, 100);
      setResults(merged);
      localStorage.setItem(RESULTS_STORAGE_KEY, JSON.stringify(merged));
      setLeanLoadStatus({ state: "loaded", message: `Loaded ${sharedResults.length} shared Lean result${sharedResults.length === 1 ? "" : "s"} from Smartsheet.` });
    } catch (error) {
      setLeanLoadStatus({ state: "error", message: error?.payload?.message || error.message || "Could not load Lean results from Smartsheet." });
    }
  };

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
    syncLeanResultToSmartsheet(completedResult);
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

  const requestVoidResult = (result) => {
    setVoidTarget(normalizeResult(result));
    setVoidReason("Test record");
    setVoidedBy(observer || "DM");
    setVoidNotes("");
  };

  const cancelVoidResult = () => {
    setVoidTarget(null);
    setVoidReason("Test record");
    setVoidedBy(observer || "DM");
    setVoidNotes("");
  };

  const confirmVoidResult = () => {
    if (!voidTarget) return;
    const voidedResult = normalizeResult({
      ...voidTarget,
      status: "Void",
      visibleInDashboard: false,
      voidReason,
      voidedBy,
      voidedAt: new Date().toISOString(),
      voidNotes: voidNotes.trim(),
      isTestRecord: isTestVoidReason(voidReason),
    });
    setResults((prev) => saveLeanResult(voidedResult, prev));
    syncLeanResultToSmartsheet(voidedResult);
    cancelVoidResult();
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
            <div className={`mt-3 rounded-2xl border p-3 text-xs font-bold ${leanSyncStatus.state === "synced" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : leanSyncStatus.state === "error" ? "border-amber-200 bg-amber-50 text-amber-900" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
              Smartsheet: {leanSyncStatus.message}
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
            leanLoadStatus={leanLoadStatus}
            leanSyncStatus={leanSyncStatus}
            onRefreshSmartsheet={refreshLeanResultsFromSmartsheet}
            onRequestVoid={requestVoidResult}
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
      {voidTarget && (
        <VoidResultModal
          result={voidTarget}
          reason={voidReason}
          setReason={setVoidReason}
          voidedBy={voidedBy}
          setVoidedBy={setVoidedBy}
          notes={voidNotes}
          setNotes={setVoidNotes}
          onCancel={cancelVoidResult}
          onConfirm={confirmVoidResult}
        />
      )}
    </div>
  );
}

function LeanResultsView({ results, resultsDistrict, setResultsDistrict, resultsCafe, setResultsCafe, resultsArea, setResultsArea, leanLoadStatus, leanSyncStatus, onRefreshSmartsheet, onRequestVoid }) {
  const [showVoided, setShowVoided] = useState(false);
  const normalizedResults = useMemo(() => results.map(normalizeResult).sort((a, b) => String(b.completedTimestamp || "").localeCompare(String(a.completedTimestamp || ""))), [results]);
  const dashboardResults = showVoided ? normalizedResults : normalizedResults.filter((result) => !isVoidedResult(result) && result.visibleInDashboard !== false);
  const voidedCount = normalizedResults.filter((result) => isVoidedResult(result) || result.visibleInDashboard === false).length;
  const cafeOptions = Array.from(new Set(dashboardResults.map((result) => result.cafe).filter(Boolean))).sort();
  const areaOptions = Array.from(new Set(dashboardResults.map((result) => result.area).filter(Boolean))).sort();
  const filteredResults = dashboardResults.filter((result) =>
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
  const trendRows = filteredResults.flatMap((result) => result.observations || []);
  const wasteTrendRows = tallySeconds(trendRows, "waste").slice(0, 5);
  const activityTrendRows = tallySeconds(trendRows, "activity").slice(0, 5);
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
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-900">Shared audience: {LEAN_AUDIENCE_ROLES.join(", ")}</span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-600">{voidedCount} voided hidden</span>
            <span className={`rounded-full border px-3 py-1 text-xs font-black ${leanLoadStatus.state === "loaded" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : leanLoadStatus.state === "error" ? "border-amber-200 bg-amber-50 text-amber-900" : "border-slate-200 bg-slate-50 text-slate-600"}`}>{leanLoadStatus.message}</span>
            <span className={`rounded-full border px-3 py-1 text-xs font-black ${leanSyncStatus.state === "synced" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : leanSyncStatus.state === "error" ? "border-amber-200 bg-amber-50 text-amber-900" : "border-slate-200 bg-slate-50 text-slate-600"}`}>Sync: {leanSyncStatus.message}</span>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <ResultFilter label="District" value={resultsDistrict} setValue={setResultsDistrict} options={["All", ...Object.keys(DISTRICTS)]} />
          <ResultFilter label="Cafe" value={resultsCafe} setValue={setResultsCafe} options={["All", ...cafeOptions]} />
          <ResultFilter label="Station" value={resultsArea} setValue={setResultsArea} options={["All", ...areaOptions]} />
          <button onClick={onRefreshSmartsheet} className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-900 hover:bg-emerald-100 sm:col-span-3">
            Sync Latest From Smartsheet
          </button>
          <button onClick={() => setShowVoided((value) => !value)} className={`rounded-2xl border px-4 py-3 text-sm font-black sm:col-span-3 ${showVoided ? "border-amber-300 bg-amber-50 text-amber-900" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}>
            {showVoided ? "Hide Voided Records" : "Show Voided Records"}
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-4">
        <MiniMetric icon={ClipboardList} label="Results" value={filteredResults.length} />
        <MiniMetric icon={Timer} label="Observed" value={formatSeconds(totalObservedSeconds)} />
        <MiniMetric icon={CheckCircle2} label="Marks" value={totalMarks} />
        <MiniMetric icon={BarChart3} label="Top Waste" value={topWaste?.[0] || "-"} />
      </div>

      <LeanTrendPanel results={filteredResults} wasteRows={wasteTrendRows} activityRows={activityTrendRows} stationRows={stationRows} totalSeconds={totalObservedSeconds} />

      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[420px_1fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Cafe / Station List</p>
          <div className="mt-3 space-y-3">
            {stationRows.length ? stationRows.map((row) => {
              const stationTopWaste = Object.entries(row.topWasteSeconds).sort((a, b) => b[1] - a[1])[0];
              const firstResult = filteredResults.find((result) => result.district === row.district && result.cafe === row.cafe && result.area === row.area);
              const active = firstResult && selectedResult?.district === row.district && selectedResult?.cafe === row.cafe && selectedResult?.area === row.area;
              const rowVoided = firstResult && isVoidedResult(firstResult);
              return (
                <button key={row.key} onClick={() => firstResult && setSelectedResultId(firstResult.id)} className={`w-full rounded-3xl border-2 p-4 text-left transition ${active ? "border-emerald-400 bg-emerald-50 shadow-[0_0_0_4px_rgba(16,185,129,0.14)]" : rowVoided ? "border-amber-200 bg-amber-50 hover:border-amber-300" : "border-slate-200 bg-white hover:border-emerald-200"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">{row.district}</p>
                      <h3 className="mt-1 text-xl font-black text-slate-950">{row.cafe}</h3>
                      <p className="mt-1 text-sm font-bold text-slate-600">{row.area}</p>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-xs font-black ${rowVoided ? "border-amber-300 bg-white text-amber-900" : "border-slate-200 bg-white text-slate-600"}`}>{rowVoided ? "Voided" : `${row.count} result${row.count === 1 ? "" : "s"}`}</span>
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
            <LeanResultDetail result={selectedResult} sameScopeResults={filteredResults.filter((result) => result.district === selectedResult.district && result.cafe === selectedResult.cafe && result.area === selectedResult.area)} setSelectedResultId={setSelectedResultId} onRequestVoid={onRequestVoid} />
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

function LeanTrendPanel({ results, wasteRows, activityRows, stationRows, totalSeconds }) {
  const latestResult = results[0] || null;
  const repeatStations = stationRows.filter((row) => row.count > 1).length;
  const opportunity = wasteRows[0]?.[0] || "No trend yet";
  return (
    <section className="mt-5 rounded-[2rem] border-2 border-emerald-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">Lean Trend Read</p>
          <h3 className="mt-1 text-2xl font-black text-slate-950">Waste, activity, and follow-up signal</h3>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-600">{results.length} visible result{results.length === 1 ? "" : "s"}</span>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1fr_360px]">
        <TrendBars title="Waste Trend" rows={wasteRows} totalSeconds={totalSeconds} tone="emerald" />
        <TrendBars title="Activity Trend" rows={activityRows} totalSeconds={totalSeconds} tone="sky" />
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Leader Follow-Up</p>
          <div className="mt-3 space-y-3">
            <TrendSignal label="Top opportunity" value={opportunity} detail={wasteRows[0] ? `${formatSeconds(wasteRows[0][1])} observed` : "complete observations to generate signal"} />
            <TrendSignal label="Repeat stations" value={repeatStations} detail="stations with more than one visible result" />
            <TrendSignal label="Latest result" value={latestResult ? latestResult.cafe : "-"} detail={latestResult ? `${latestResult.area} - ${latestResult.observationDate}` : "no result selected"} />
          </div>
        </div>
      </div>
    </section>
  );
}

function TrendBars({ title, rows, totalSeconds, tone }) {
  const fill = tone === "sky" ? "bg-sky-500" : "bg-emerald-500";
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{title}</p>
      <div className="mt-3 space-y-3">
        {rows.length ? rows.map(([name, seconds]) => {
          const percent = totalSeconds ? Math.round((seconds / totalSeconds) * 100) : 0;
          return (
            <div key={name}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <p className="font-black text-slate-900">{name || "Unclassified"}</p>
                <p className="font-mono font-black text-slate-600">{percent}%</p>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                <div className={`h-full rounded-full ${fill}`} style={{ width: `${Math.max(4, percent)}%` }} />
              </div>
            </div>
          );
        }) : <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm font-semibold text-slate-500">No trend data yet.</p>}
      </div>
    </div>
  );
}

function TrendSignal({ label, value, detail }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-1 truncate text-lg font-black text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-semibold text-slate-500">{detail}</p>
    </div>
  );
}

function LeanResultDetail({ result, sameScopeResults, setSelectedResultId, onRequestVoid }) {
  const summary = result.summary || summarizeRows(result.observations || []);
  const topWaste = summary.byWasteSeconds[0];
  const topActivity = summary.byActivitySeconds[0];
  const voided = isVoidedResult(result) || result.visibleInDashboard === false;
  return (
    <div>
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className={`text-xs font-black uppercase tracking-[0.2em] ${voided ? "text-amber-600" : "text-emerald-600"}`}>{voided ? "Voided Result" : "Selected Result"}</p>
          <h3 className="mt-2 text-3xl font-black text-slate-950">{result.cafe} / {result.area}</h3>
          <p className="mt-2 text-sm font-semibold text-slate-600">{result.district} - {result.observationDate} - {result.observer} - Completed {result.completedAt || "n/a"}</p>
          {voided && (
            <p className="mt-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-900">
              Hidden from dashboard: {result.voidReason || "Void reason not captured"}{result.voidedBy ? ` by ${result.voidedBy}` : ""}.
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
          <div className={`rounded-2xl border px-4 py-3 ${voided ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"}`}>
            <p className={`text-xs font-black uppercase tracking-[0.14em] ${voided ? "text-amber-700" : "text-emerald-700"}`}>Observed</p>
            <p className={`mt-1 font-mono text-3xl font-black ${voided ? "text-amber-950" : "text-emerald-950"}`}>{formatSeconds(summary.seconds)}</p>
          </div>
          {!voided && (
            <button onClick={() => onRequestVoid(result)} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-black text-rose-900 hover:bg-rose-100">
              <Trash2 size={17} />
              Void Result
            </button>
          )}
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

function VoidResultModal({ result, reason, setReason, voidedBy, setVoidedBy, notes, setNotes, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-[2rem] border border-rose-200 bg-white p-5 shadow-2xl md:p-6">
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-rose-700">Controlled Record Void</p>
            <h2 className="mt-2 text-3xl font-black text-slate-950">Hide this Lean result?</h2>
            <p className="mt-2 text-sm font-semibold text-slate-600">
              {result.cafe} / {result.area} - {result.observationDate} - {result.observer}
            </p>
          </div>
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-center">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-rose-700">Action</p>
            <p className="mt-1 text-xl font-black text-rose-950">Void</p>
          </div>
        </div>

        <div className="mt-5 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-950">
          This will hide the record from normal dashboards and keep the audit trail for review. It does not erase the result.
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Reason</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {VOID_REASONS.map((option) => (
                <button key={option} onClick={() => setReason(option)} className={`rounded-full border px-3 py-2 text-xs font-black ${reason === option ? "border-rose-400 bg-rose-50 text-rose-900 shadow-[0_0_0_3px_rgba(244,63,94,0.12)]" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
                  {option}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Voided By</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {OBSERVER_OPTIONS.map((option) => (
                <button key={option} onClick={() => setVoidedBy(option)} className={`rounded-full border px-3 py-2 text-xs font-black ${voidedBy === option ? "border-emerald-400 bg-emerald-50 text-emerald-900 shadow-[0_0_0_3px_rgba(16,185,129,0.12)]" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>

        <label className="mt-5 block">
          <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-500">Notes</span>
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Optional audit note" className="min-h-24 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-rose-300" />
        </label>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button onClick={onCancel} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-50">
            Cancel
          </button>
          <button onClick={onConfirm} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-600 px-5 py-3 text-sm font-black text-white hover:bg-rose-700">
            <Trash2 size={17} />
            Void Result
          </button>
        </div>
      </div>
    </div>
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
