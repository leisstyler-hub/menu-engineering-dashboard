import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bell,
  CalendarDays,
  CheckCircle2,
  Clock,
  Download,
  FileSpreadsheet,
  FolderKanban,
  Mail,
  Paperclip,
  PieChart,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";

import CompassOneLogo from "../../shared/ui/CompassOneLogo.jsx";
import PlatformSettings from "../../shared/ui/PlatformSettings.jsx";
import VersionStamp from "../../shared/ui/VersionStamp.jsx";
import { loadRecordsFromBackbone, syncRecordsToBackbone } from "../../integrations/storage/backboneClient.js";
import {
  MENU_PROJECT_STORAGE_KEY,
  MENU_TYPES,
  TEMPLATE_FILES,
  advanceProject,
  createProject,
  currentStageCanComplete,
  delayProject,
  formatDate,
  formatDateTime,
  getCurrentStage,
  getProjectStatus,
  makeNotification,
  sampleProjects,
  sendBackForRevision,
  todayIso,
} from "./menuProjectModel.js";

const FILE_CATEGORIES = [
  "Completed New Menu Concept Brief",
  "Completed New Menu Multi Station Concept Brief",
  "Completed SSMT file",
  "Manager's Guide",
  "Tasting Notes",
  "Webtrition / MRN support",
  "Other Attachments",
];

const TEAM_PRESETS = [
  { name: "Shane James", email: "shane.james@compass-usa.com" },
  { name: "Lynn Wu", email: "lynn-wu@compass-usa.com" },
  { name: "Tyler Leiss", email: "tyler.leiss@compass-usa.com" },
  { name: "Alex Neuse", email: "alex.neuse@compass-usa.com" },
  { name: "Jeremy Slagle", email: "jeremy.slagle@compass-usa.com" },
  { name: "DJ Bauer", email: "dj.bauer@compass-usa.com" },
  { name: "Bil Smith", email: "bil.smith@compass-usa.com" },
  { name: "Summer Hinshaw", email: "summer.hinshaw@compass-usa.com" },
];

const DIRECTOR_OF_CULINARY = { name: "Chandon Clenard", email: "chandon.clenard@compass-usa.com" };
const MENU_PROJECT_BACKBONE_TOOL = "menuProjects";
const MAX_ATTACHMENT_BYTES = 1_800_000;

const statusTone = {
  "On Track": "border-emerald-200 bg-emerald-50 text-emerald-800",
  "At Risk": "border-amber-200 bg-amber-50 text-amber-900",
  Late: "border-rose-200 bg-rose-50 text-rose-800",
  "Compressed Timeline": "border-orange-200 bg-orange-50 text-orange-900",
  "Needs Revision": "border-violet-200 bg-violet-50 text-violet-800",
  "Waiting on Experience": "border-sky-200 bg-sky-50 text-sky-800",
  "Waiting on Director": "border-indigo-200 bg-indigo-50 text-indigo-800",
  "Waiting on District Chef": "border-lime-200 bg-lime-50 text-lime-900",
  "Waiting on IT": "border-slate-200 bg-slate-100 text-slate-800",
  Complete: "border-emerald-200 bg-emerald-100 text-emerald-900",
  Blocked: "border-red-200 bg-red-50 text-red-800",
};

const MICROCONCEPT_DELIVERABLE_NAMES = ["Schedule Tasting", "Manager's Guide", "Photography Scheduled", "Webtrition Entry"];

function normalizeDeliverableTask(existingTasks, name) {
  const aliases = {
    "Schedule Tasting": ["Schedule Tasting", "Scheduled Tasting"],
    "Manager's Guide": ["Manager's Guide", "Station Handbook"],
    "Photography Scheduled": ["Photography Scheduled"],
    "Webtrition Entry": ["Webtrition Entry", "Webtrition Recipe Entry / MRNs"],
  };
  const found = existingTasks.find((task) => (aliases[name] || [name]).includes(task.name));
  const defaultFields = name === "Schedule Tasting"
    ? { tastingDate: "", tastingLocation: "", attendees: "", notes: "" }
    : name === "Photography Scheduled"
      ? { shootDate: "", photographer: "", notes: "" }
      : name === "Webtrition Entry"
        ? { recipeName: "", mrn: "", notes: "" }
        : { notes: "" };
  return {
    id: found?.id || `task-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    name,
    status: found?.status || "Not Started",
    fields: { ...defaultFields, ...(found?.fields || {}) },
  };
}

function normalizeMenuProject(project) {
  if (project.menuType !== MENU_TYPES.MICROCONCEPT) return project;
  return {
    ...project,
    stages: project.stages.map((stage) => {
      if (stage.id !== "microconcept-deliverables") return stage;
      return {
        ...stage,
        requiredFiles: ["Manager's Guide"],
        requiredTasks: MICROCONCEPT_DELIVERABLE_NAMES.map((name) => normalizeDeliverableTask(stage.requiredTasks || [], name)),
      };
    }),
  };
}

function loadProjects() {
  if (typeof window === "undefined") return sampleProjects();
  try {
    const stored = window.localStorage.getItem(MENU_PROJECT_STORAGE_KEY);
    if (!stored) return sampleProjects();
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) && parsed.length ? parsed.map(normalizeMenuProject) : sampleProjects();
  } catch {
    return sampleProjects();
  }
}

function saveProjects(projects) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(MENU_PROJECT_STORAGE_KEY, JSON.stringify(projects));
}

function safeFileName(value) {
  return String(value || "menu-project")
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function downloadTemplate(templateKey, menuName) {
  const template = TEMPLATE_FILES[templateKey];
  if (!template) return;
  const response = await fetch(template.path);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${safeFileName(menuName)} - ${template.baseFileName}`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function notificationRecipientsForUpload(project, category) {
  const informList = project.peopleToInform || [];
  if (project.menuType === MENU_TYPES.MICROCONCEPT && category === "Completed New Menu Concept Brief") {
    return [DIRECTOR_OF_CULINARY, ...informList];
  }
  if (category === "Completed New Menu Concept Brief" || category === "Completed New Menu Multi Station Concept Brief") {
    return [
      { name: "Experience Team", email: "" },
      project.districtChefOwner,
      ...informList,
    ].filter((person) => person?.name || person?.email);
  }
  if (category === "Completed SSMT file") {
    return [
      { name: "IT / Centric Team", email: "" },
      ...informList,
    ].filter((person) => person?.name || person?.email);
  }
  return informList;
}

function uploadNotificationAction(project, category) {
  if (project.menuType === MENU_TYPES.MICROCONCEPT && category === "Completed New Menu Concept Brief") {
    return "Concept brief uploaded; Director of Culinary review ready";
  }
  if (category === "Completed New Menu Concept Brief" || category === "Completed New Menu Multi Station Concept Brief") {
    return "Concept brief uploaded; Experience review ready";
  }
  if (category === "Completed SSMT file") return "SSMT uploaded; IT / Centric programming ready";
  return `${category} uploaded`;
}

function notificationMailto(note) {
  const recipients = (note.recipients || []).map((person) => person.email).filter(Boolean);
  if (!recipients.length) return "";
  const subject = encodeURIComponent(`${note.menuName}: ${note.requiredAction}`);
  const body = encodeURIComponent([
    `Menu: ${note.menuName}`,
    `Type: ${note.menuType}`,
    `Current stage: ${note.currentStage}`,
    `Required action: ${note.requiredAction}`,
    `Due date: ${formatDate(note.dueDate)}`,
    note.comments ? `Comments: ${note.comments}` : "",
    "",
    "Open the Culinary Tools Platform and review the Menu Projects record.",
  ].filter(Boolean).join("\n"));
  return `mailto:${recipients.join(",")}?subject=${subject}&body=${body}`;
}

function makeProjectRecordId(projectId) {
  return `menuProject|${projectId}`;
}

function makeProjectFileRecordId(projectId, fileId) {
  return `menuProjectFile|${projectId}|${fileId}`;
}

function projectOwnersText(project) {
  const owners = project.projectOwners?.length ? project.projectOwners : [project.projectOwner].filter(Boolean);
  return owners.map((person) => person?.name || person?.email).filter(Boolean).join(", ");
}

function upcomingTasting(project) {
  const deliverables = project.stages.find((stage) => stage.id === "microconcept-deliverables");
  const tasting = deliverables?.requiredTasks?.find((task) => task.name === "Schedule Tasting");
  return tasting?.fields?.tastingDate || "";
}

function cleanProjectForStorage(project) {
  return {
    ...project,
    files: (project.files || []).map(({ dataUrl, ...file }) => file),
  };
}

function projectToBackboneRecords(project) {
  const stage = getCurrentStage(project);
  const updatedAt = project.updatedAt || project.createdDate || new Date().toISOString();
  const projectRecord = {
    "Record ID": makeProjectRecordId(project.id),
    "Parent Record ID": "",
    "Record Type": "Menu Project",
    "Status": project.status || getProjectStatus(project),
    "Menu Project ID": project.id,
    "Menu Name": project.menuName,
    "Menu Type": project.menuType,
    "Launch Date": project.launchDate,
    "Current Stage": stage?.name || "",
    "Current Owner Team": stage?.ownerTeam || "",
    "Current Due Date": stage?.dueDate || "",
    "Centric Complete By": project.centricCompleteBy || "",
    "Project Owner(s)": projectOwnersText(project),
    "File Count": String(project.files?.length || 0),
    "Open Blockers": String((project.blockers || []).filter((blocker) => blocker.status === "Open").length),
    "Upcoming Tasting Date": upcomingTasting(project),
    "Updated At": updatedAt,
    "Visible In Dashboard": "true",
    "__project": cleanProjectForStorage(project),
  };

  const fileRecords = (project.files || []).map((file) => ({
    "Record ID": makeProjectFileRecordId(project.id, file.id),
    "Parent Record ID": makeProjectRecordId(project.id),
    "Record Type": "Menu Project File",
    "Status": file.status || "Uploaded",
    "Menu Project ID": project.id,
    "Menu Name": project.menuName,
    "File Name": file.fileName,
    "Original File Name": file.originalFileName || file.fileName,
    "File Category": file.fileCategory,
    "File Version": String(file.version || 1),
    "Uploaded By": file.uploadedBy || "",
    "Uploaded At": file.uploadedDate || "",
    "Required": file.required ? "true" : "false",
    "File Size": file.size ? String(file.size) : "",
    "File Type": file.type || "",
    "Updated At": updatedAt,
    "Visible In Dashboard": "true",
    "__fileDataUrl": file.dataUrl || "",
  }));

  return [projectRecord, ...fileRecords];
}

function recordsToProjects(records = []) {
  return records
    .filter((record) => String(record["Record Type"] || "") === "Menu Project" && record.__project)
    .map((record) => ({
      ...record.__project,
      __storageUpdatedAt: record.__supabaseUpdatedAt || record["Updated At"] || "",
    }));
}

function mergeProjectsByNewest(localProjects = [], remoteProjects = []) {
  const map = new Map();
  [...localProjects, ...remoteProjects].forEach((project) => {
    if (!project?.id) return;
    const existing = map.get(project.id);
    const existingStamp = existing?.updatedAt || existing?.__storageUpdatedAt || existing?.createdDate || "";
    const nextStamp = project.updatedAt || project.__storageUpdatedAt || project.createdDate || "";
    if (!existing || nextStamp >= existingStamp) map.set(project.id, normalizeMenuProject(project));
  });
  return Array.from(map.values()).sort((a, b) => String(b.updatedAt || b.createdDate || "").localeCompare(String(a.updatedAt || a.createdDate || "")));
}

async function syncMenuProjectsToBackbone(projects) {
  const records = projects.flatMap(projectToBackboneRecords);
  if (!records.length) return null;
  return syncRecordsToBackbone(records, {
    tool: MENU_PROJECT_BACKBONE_TOOL,
    source: "menu-projects",
    autoCreateMissingColumns: true,
    replaceParentRecordIds: projects.map((project) => makeProjectRecordId(project.id)),
  });
}

function fileBaseName(name = "") {
  const lastDot = name.lastIndexOf(".");
  return lastDot > 0 ? name.slice(0, lastDot) : name;
}

function fileExtension(name = "") {
  const lastDot = name.lastIndexOf(".");
  return lastDot > 0 ? name.slice(lastDot) : "";
}

function versionedFileName(originalName, version) {
  if (version <= 1) return originalName;
  return `${fileBaseName(originalName)} v${version}${fileExtension(originalName)}`;
}

function nextFileVersion(files = [], category, originalName) {
  const base = fileBaseName(originalName).toLowerCase();
  const matching = files.filter((file) => file.fileCategory === category && fileBaseName(file.originalFileName || file.fileName).toLowerCase() === base);
  return matching.reduce((max, file) => Math.max(max, Number(file.version) || 1), 0) + 1;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Unable to read file."));
    reader.readAsDataURL(file);
  });
}

function downloadStoredFile(file) {
  if (!file?.dataUrl) return;
  const anchor = document.createElement("a");
  anchor.href = file.dataUrl;
  anchor.download = file.fileName || file.originalFileName || "menu-project-file";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export default function MenuProjects({ onBackToPlatform, onOpenSmartsheetHealth }) {
  const [projects, setProjects] = useState(loadProjects);
  const [selectedId, setSelectedId] = useState(() => projects[0]?.id || "");
  const [backboneReady, setBackboneReady] = useState(false);
  const [storageStatus, setStorageStatus] = useState({ state: "loading", message: "Loading Menu Projects database..." });
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [ownerFilter, setOwnerFilter] = useState("All");
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    let active = true;
    loadRecordsFromBackbone({ tool: MENU_PROJECT_BACKBONE_TOOL, fallbackOnEmpty: false })
      .then((payload) => {
        if (!active) return;
        const remoteProjects = recordsToProjects(payload.records || []);
        if (remoteProjects.length) {
          setProjects((current) => mergeProjectsByNewest(current, remoteProjects));
        }
        setStorageStatus({
          state: payload.source || "loaded",
          message: remoteProjects.length
            ? `Loaded ${remoteProjects.length} Menu Project record${remoteProjects.length === 1 ? "" : "s"} from ${payload.source || "database"}.`
            : "Menu Projects database connected. No saved project records found yet.",
        });
      })
      .catch((error) => {
        if (!active) return;
        setStorageStatus({ state: "local", message: `Using local project records. Database load needs attention: ${error.message}` });
      })
      .finally(() => {
        if (active) setBackboneReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => saveProjects(projects), [projects]);

  useEffect(() => {
    if (!backboneReady) return undefined;
    const timer = window.setTimeout(() => {
      setStorageStatus((current) => ({ ...current, state: "saving", message: "Saving Menu Projects to Supabase and Smartsheet..." }));
      syncMenuProjectsToBackbone(projects)
        .then((payload) => setStorageStatus({
          state: payload?.source || "synced",
          message: payload?.message || "Menu Projects saved to the database backbone.",
        }))
        .catch((error) => setStorageStatus({
          state: "error",
          message: `Menu Projects database sync needs attention: ${error.message}`,
        }));
    }, 900);
    return () => window.clearTimeout(timer);
  }, [projects, backboneReady]);

  const scoredProjects = useMemo(() => projects.map((project) => ({
    ...project,
    status: getProjectStatus(project),
  })), [projects]);

  const filteredProjects = scoredProjects.filter((project) => {
    const haystack = `${project.menuName} ${project.menuType} ${project.status} ${getCurrentStage(project)?.ownerTeam}`.toLowerCase();
    return (
      haystack.includes(search.toLowerCase()) &&
      (typeFilter === "All" || project.menuType === typeFilter) &&
      (statusFilter === "All" || project.status === statusFilter) &&
      (ownerFilter === "All" || getCurrentStage(project)?.ownerTeam === ownerFilter)
    );
  });

  const selectedProject = scoredProjects.find((project) => project.id === selectedId) || scoredProjects[0];

  const updateProject = (projectId, updater) => {
    setProjects((current) => current.map((project) => {
      if (project.id !== projectId) return project;
      const next = typeof updater === "function" ? updater(project) : updater;
      return { ...next, updatedAt: new Date().toISOString(), status: getProjectStatus(next) };
    }));
  };

  const addProject = (input) => {
    const project = { ...createProject(input), updatedAt: new Date().toISOString() };
    setProjects((current) => [project, ...current]);
    setSelectedId(project.id);
    setShowCreate(false);
  };

  const summary = {
    total: scoredProjects.length,
    active: scoredProjects.filter((project) => project.status !== "Complete").length,
    atRisk: scoredProjects.filter((project) => ["At Risk", "Late", "Compressed Timeline", "Blocked"].includes(project.status)).length,
    blocked: scoredProjects.filter((project) => project.blockers.some((blocker) => blocker.status === "Open")).length,
  };

  const dashboard = useMemo(() => buildProjectDashboard(scoredProjects), [scoredProjects]);

  const trashProject = (projectId) => {
    setProjects((current) => {
      const next = current.filter((project) => project.id !== projectId);
      if (selectedId === projectId) setSelectedId(next[0]?.id || "");
      return next;
    });
    setDeleteTarget(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 text-slate-950">
      <div className="mx-auto flex w-full max-w-[110rem] flex-col gap-5 px-4 py-5 md:px-8">
        <header className="rounded-lg border border-sky-200 bg-white p-4 shadow-sm md:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <button type="button" onClick={onBackToPlatform} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700">
                <ArrowLeft size={16} />
                Back to Platform
              </button>
              <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-emerald-600">Menu Project Pipeline</p>
              <h1 className="mt-2 text-3xl font-black tracking-normal md:text-4xl">Menu Projects</h1>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
                Central project record for concept briefs, approvals, files, handoffs, and Centric programming.
              </p>
            </div>
            <div className="flex flex-col items-start gap-2 md:items-end">
              <div className="flex items-center gap-3">
                <PlatformSettings onOpenSmartsheetHealth={onOpenSmartsheetHealth} />
                <CompassOneLogo compact />
              </div>
              <VersionStamp compact />
            </div>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryCard icon={FolderKanban} label="Projects" value={summary.total} />
          <SummaryCard icon={Clock} label="Active" value={summary.active} />
          <SummaryCard icon={AlertTriangle} label="At risk" value={summary.atRisk} />
          <SummaryCard icon={ShieldAlert} label="Open blockers" value={summary.blocked} />
        </section>

        <section className="rounded-lg border border-sky-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-4">
              <label className="relative md:col-span-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm font-bold" placeholder="Search menu projects" />
              </label>
              <Select label="Menu type" value={typeFilter} onChange={setTypeFilter} options={["All", ...Object.values(MENU_TYPES)]} />
              <Select label="Status" value={statusFilter} onChange={setStatusFilter} options={["All", ...Object.keys(statusTone)]} />
              <Select label="Owner team" value={ownerFilter} onChange={setOwnerFilter} options={["All", "Project Owner", "Experience Team", "Director of Culinary", "District Chef", "IT Team"]} />
            </div>
            <button type="button" onClick={() => setShowCreate(true)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-800">
              <Plus size={18} />
              New Menu Project
            </button>
          </div>
        </section>

        <ProjectDashboardCharts dashboard={dashboard} visibleCount={filteredProjects.length} />
        <StorageStatusBanner status={storageStatus} />

        <main className="grid grid-cols-1 gap-5 2xl:grid-cols-[minmax(0,1.2fr)_minmax(520px,0.8fr)]">
          <ProjectTable
            projects={filteredProjects}
            selectedId={selectedProject?.id}
            onSelect={setSelectedId}
            onTrash={setDeleteTarget}
          />

          {selectedProject && (
            <ProjectDetail
              project={selectedProject}
              onUpdate={(updater) => updateProject(selectedProject.id, updater)}
              onTrash={() => setDeleteTarget(selectedProject)}
            />
          )}
        </main>
      </div>

      {showCreate && (
        <CreateProjectModal
          onClose={() => setShowCreate(false)}
          onCreate={addProject}
        />
      )}

      {deleteTarget && (
        <TrashProjectModal
          project={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => trashProject(deleteTarget.id)}
        />
      )}
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value }) {
  return (
    <article className="rounded-lg border border-sky-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{label}</p>
        <span className="rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-emerald-700">
          <Icon size={18} />
        </span>
      </div>
      <p className="mt-4 text-3xl font-black text-slate-950">{value}</p>
    </article>
  );
}

function StorageStatusBanner({ status }) {
  const tone = status.state === "error"
    ? "border-amber-200 bg-amber-50 text-amber-900"
    : status.state === "saving"
      ? "border-sky-200 bg-sky-50 text-sky-900"
      : "border-emerald-200 bg-emerald-50 text-emerald-900";
  return (
    <section className={`rounded-lg border p-3 text-sm font-bold shadow-sm ${tone}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span>Menu Projects Database</span>
        <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-black">{status.state}</span>
      </div>
      <p className="mt-1 leading-6">{status.message}</p>
    </section>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label>
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-bold">
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function buildProjectDashboard(projects) {
  const countBy = (getter) => projects.reduce((acc, project) => {
    const key = getter(project) || "Unassigned";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const byType = countBy((project) => project.menuType);
  const byStage = countBy((project) => getCurrentStage(project)?.name);
  const byStatus = countBy((project) => project.status);
  const lateOrRisk = projects.filter((project) => ["Late", "At Risk", "Compressed Timeline", "Blocked"].includes(project.status)).length;
  const complete = projects.filter((project) => project.status === "Complete").length;
  const upcomingDueDates = projects
    .flatMap((project) => project.stages
      .filter((stage) => stage.status !== "Complete" && stage.dueDate)
      .map((stage) => ({
        projectId: project.id,
        menuName: project.menuName,
        menuType: project.menuType,
        stageName: stage.name,
        ownerTeam: stage.ownerTeam,
        dueDate: stage.dueDate,
        status: project.status,
      })))
    .sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)))
    .slice(0, 8);
  const upcomingTastings = projects
    .flatMap((project) => {
      const deliverables = project.stages.find((stage) => stage.id === "microconcept-deliverables");
      const tasting = deliverables?.requiredTasks?.find((task) => task.name === "Schedule Tasting");
      if (!tasting?.fields?.tastingDate) return [];
      return [{
        projectId: project.id,
        menuName: project.menuName,
        tastingDate: tasting.fields.tastingDate,
        tastingLocation: tasting.fields.tastingLocation || "Location not set",
        status: tasting.status,
      }];
    })
    .sort((a, b) => String(a.tastingDate).localeCompare(String(b.tastingDate)))
    .slice(0, 6);
  return {
    total: projects.length,
    byType,
    byStage,
    byStatus,
    lateOrRisk,
    complete,
    upcomingDueDates,
    upcomingTastings,
  };
}

function ProjectDashboardCharts({ dashboard, visibleCount }) {
  const typeRows = Object.entries(dashboard.byType);
  const stageRows = Object.entries(dashboard.byStage).sort((a, b) => b[1] - a[1]);
  const statusRows = Object.entries(dashboard.byStatus).sort((a, b) => b[1] - a[1]);
  const total = Math.max(1, dashboard.total);

  return (
    <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(360px,0.85fr)_minmax(0,1.15fr)_minmax(320px,0.8fr)]">
      <article className="rounded-lg border border-sky-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600">Portfolio Mix</p>
            <h2 className="mt-1 text-2xl font-black">Menu Type Buckets</h2>
          </div>
          <span className="rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-emerald-700"><PieChart size={20} /></span>
        </div>
        <div className="mt-5 grid grid-cols-[150px_minmax(0,1fr)] items-center gap-4">
          <div
            className="relative h-[150px] w-[150px] rounded-full"
            style={{ background: makeDonutGradient(typeRows, total) }}
            aria-label="Menu type mix chart"
          >
            <div className="absolute inset-8 flex flex-col items-center justify-center rounded-full bg-white text-center shadow-inner">
              <p className="text-3xl font-black">{dashboard.total}</p>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">menus</p>
            </div>
          </div>
          <div className="space-y-2">
            {typeRows.map(([type, count], index) => (
              <div key={type} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className={`h-3 w-3 shrink-0 rounded-full ${DONUT_COLORS[index % DONUT_COLORS.length].dot}`} />
                    <p className="truncate text-sm font-black text-slate-950">{type}</p>
                  </div>
                  <p className="text-sm font-black text-slate-950">{count}</p>
                </div>
                <p className="mt-1 text-xs font-bold text-slate-500">{Math.round((count / total) * 100)}% of active records</p>
              </div>
            ))}
          </div>
        </div>
      </article>

      <article className="rounded-lg border border-sky-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600">Stage Workload</p>
            <h2 className="mt-1 text-2xl font-black">Where Projects Sit</h2>
          </div>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-600">{visibleCount} visible</span>
        </div>
        <div className="mt-5 space-y-3">
          {stageRows.map(([stage, count]) => (
            <div key={stage}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-black text-slate-800">{stage}</p>
                <p className="text-sm font-black text-slate-950">{count}</p>
              </div>
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-sky-400" style={{ width: `${Math.max(7, (count / total) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </article>

      <article className="rounded-lg border border-sky-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600">Health Read</p>
            <h2 className="mt-1 text-2xl font-black">Action Queue</h2>
          </div>
          <span className="rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-emerald-700"><BarChart3 size={20} /></span>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-amber-800">Needs Eyes</p>
            <p className="mt-2 text-3xl font-black text-amber-950">{dashboard.lateOrRisk}</p>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-emerald-800">Complete</p>
            <p className="mt-2 text-3xl font-black text-emerald-950">{dashboard.complete}</p>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          {statusRows.map(([status, count]) => (
            <div key={status} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <StatusBadge status={status} />
              <p className="text-sm font-black text-slate-950">{count}</p>
            </div>
          ))}
        </div>
      </article>

      <article className="rounded-lg border border-sky-200 bg-white p-5 shadow-sm xl:col-span-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600">Deadline Watch</p>
            <h2 className="mt-1 text-2xl font-black">Upcoming Due Dates</h2>
          </div>
          <span className="rounded-lg border border-sky-200 bg-sky-50 p-2 text-sky-700"><CalendarDays size={20} /></span>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-2 lg:grid-cols-2">
          {dashboard.upcomingDueDates.map((item) => (
            <div key={`${item.projectId}-${item.stageName}-${item.dueDate}`} className="rounded-lg border border-slate-300 bg-slate-50 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-950">{item.menuName}</p>
                  <p className="mt-1 text-xs font-bold text-slate-500">{item.stageName} / {item.ownerTeam}</p>
                </div>
                <p className="shrink-0 text-sm font-black text-slate-900">{formatDate(item.dueDate)}</p>
              </div>
            </div>
          ))}
          {!dashboard.upcomingDueDates.length && <p className="rounded-lg border border-dashed border-slate-200 p-4 text-sm font-bold text-slate-500">No upcoming due dates.</p>}
        </div>
      </article>

      <article className="rounded-lg border border-sky-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600">Microconcept Pulse</p>
            <h2 className="mt-1 text-2xl font-black">Upcoming Tastings</h2>
          </div>
          <span className="rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-emerald-700"><CheckCircle2 size={20} /></span>
        </div>
        <div className="mt-4 space-y-2">
          {dashboard.upcomingTastings.map((item) => (
            <div key={`${item.projectId}-${item.tastingDate}`} className="rounded-lg border border-slate-300 bg-slate-50 p-3">
              <p className="text-sm font-black text-slate-950">{item.menuName}</p>
              <p className="mt-1 text-xs font-bold text-slate-500">{formatDate(item.tastingDate)} / {item.tastingLocation}</p>
              <span className="mt-2 inline-flex rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-black text-emerald-800">{item.status}</span>
            </div>
          ))}
          {!dashboard.upcomingTastings.length && <p className="rounded-lg border border-dashed border-slate-200 p-4 text-sm font-bold text-slate-500">No tastings scheduled yet.</p>}
        </div>
      </article>
    </section>
  );
}

const DONUT_COLORS = [
  { stop: "#10b981", dot: "bg-emerald-500" },
  { stop: "#38bdf8", dot: "bg-sky-400" },
  { stop: "#f59e0b", dot: "bg-amber-500" },
  { stop: "#8b5cf6", dot: "bg-violet-500" },
];

function makeDonutGradient(rows, total) {
  if (!rows.length) return "conic-gradient(#e2e8f0 0deg 360deg)";
  let cursor = 0;
  const stops = rows.map(([, count], index) => {
    const start = cursor;
    const end = cursor + (count / total) * 360;
    cursor = end;
    return `${DONUT_COLORS[index % DONUT_COLORS.length].stop} ${start}deg ${end}deg`;
  });
  return `conic-gradient(${stops.join(", ")})`;
}

function ProjectTable({ projects, selectedId, onSelect, onTrash }) {
  return (
    <section className="rounded-lg border border-sky-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Project List</p>
          <h2 className="mt-1 text-2xl font-black">Menus in the Works</h2>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-600">{projects.length} records</span>
      </div>
      <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
        {projects.map((project) => {
          const stage = getCurrentStage(project);
          return (
            <div key={project.id} className={`grid grid-cols-1 gap-3 border-b border-slate-200 p-4 last:border-b-0 lg:grid-cols-[minmax(220px,1.3fr)_minmax(180px,0.9fr)_minmax(150px,0.7fr)_minmax(160px,0.7fr)_auto] lg:items-center ${selectedId === project.id ? "bg-emerald-50" : "bg-white"}`}>
              <button type="button" onClick={() => onSelect(project.id)} className="min-w-0 text-left">
                <p className="truncate text-lg font-black text-slate-950">{project.menuName}</p>
                <p className="mt-1 text-sm font-bold text-slate-500">{project.menuType}</p>
              </button>
              <button type="button" onClick={() => onSelect(project.id)} className="text-left">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">Current Stage</p>
                <p className="mt-1 text-sm font-black text-slate-800">{stage?.name}</p>
              </button>
              <button type="button" onClick={() => onSelect(project.id)} className="text-left">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">Due</p>
                <p className="mt-1 text-sm font-black text-slate-800">{formatDate(stage?.dueDate)}</p>
              </button>
              <div>
                <StatusBadge status={project.status} />
              </div>
              <div className="flex items-center gap-2 lg:justify-end">
                <button type="button" onClick={() => onSelect(project.id)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-800 hover:bg-slate-50">Open</button>
                <button type="button" onClick={() => onTrash(project)} className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-rose-700 hover:bg-rose-100" aria-label={`Trash ${project.menuName}`}>
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          );
        })}
        {!projects.length && (
          <div className="p-8 text-center">
            <p className="text-lg font-black text-slate-950">No projects match this view.</p>
            <p className="mt-2 text-sm font-semibold text-slate-500">Clear a filter or create a new project to start the workflow.</p>
          </div>
        )}
      </div>
    </section>
  );
}

function ProjectDetail({ project, onUpdate, onTrash }) {
  const [approval, setApproval] = useState({ reviewerName: "", reviewerEmail: "", decision: "Approve", comments: "" });
  const [blocker, setBlocker] = useState({ title: "", description: "", owner: "" });
  const [newPerson, setNewPerson] = useState({ name: "", email: "" });
  const [activeStageId, setActiveStageId] = useState(project.currentStage);
  const [delayForm, setDelayForm] = useState({ open: false, launchDate: project.launchDate, reason: "" });
  const projectOwners = project.projectOwners?.length ? project.projectOwners : [project.projectOwner].filter((person) => person?.name || person?.email);
  const currentStage = getCurrentStage(project);
  const directorComplete = project.stages.some((item) => item.id === "director-review" && item.status === "Complete");
  const canOpenStage = (item) => item.id === project.currentStage
    || (project.menuType === MENU_TYPES.MICROCONCEPT && item.id === "microconcept-deliverables" && directorComplete);
  const requestedStage = project.stages.find((item) => item.id === activeStageId);
  const stage = requestedStage && canOpenStage(requestedStage) ? requestedStage : currentStage;
  const isWorkingAhead = stage.id !== project.currentStage;
  const completion = currentStageCanComplete(project, stage.id);

  useEffect(() => {
    setActiveStageId(project.currentStage);
    setDelayForm((current) => ({ ...current, launchDate: project.launchDate }));
  }, [project.id, project.currentStage, project.launchDate]);

  const addFile = async (event, category, required = false) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const dataUrl = file.size <= MAX_ATTACHMENT_BYTES ? await readFileAsDataUrl(file) : "";
    onUpdate((current) => {
      const version = nextFileVersion(current.files || [], category, file.name);
      const storedFileName = versionedFileName(file.name, version);
      const next = {
        ...current,
        files: [
          {
            id: `file-${Date.now()}`,
            projectId: current.id,
            fileName: storedFileName,
            originalFileName: file.name,
            fileCategory: category,
            uploadedBy: current.projectOwners?.[0]?.name || current.projectOwner.name || "Project Owner",
            uploadedDate: new Date().toISOString(),
            required,
            status: dataUrl ? "Uploaded" : "Metadata Only",
            version,
            size: file.size,
            type: file.type || "",
            dataUrl,
            url: "",
          },
          ...current.files,
        ],
      };
      const recipients = notificationRecipientsForUpload(next, category);
      return {
        ...next,
        notifications: [
          makeNotification(
            next,
            uploadNotificationAction(next, category),
            dataUrl ? storedFileName : `${storedFileName} stored as metadata only because the file is too large for browser-side storage.`,
            recipients
          ),
          ...current.notifications,
        ],
      };
    });
    event.target.value = "";
  };

  const deleteFile = (fileId) => {
    onUpdate((current) => {
      const file = current.files.find((item) => item.id === fileId);
      const next = {
        ...current,
        files: current.files.filter((item) => item.id !== fileId),
      };
      return {
        ...next,
        notifications: [makeNotification(next, "Menu project file deleted", file?.fileName || "File removed"), ...current.notifications],
      };
    });
  };

  const markStageComplete = () => {
    if (isWorkingAhead) return;
    if (!completion.ok) return;
    onUpdate((current) => advanceProject(current, nextActionLabel(current)));
  };

  const submitDelay = () => {
    if (!delayForm.launchDate) return;
    onUpdate((current) => delayProject(current, delayForm.launchDate, delayForm.reason));
    setDelayForm({ open: false, launchDate: delayForm.launchDate, reason: "" });
  };

  const submitApproval = () => {
    const approvalRecord = {
      id: `approval-${Date.now()}`,
      projectId: project.id,
      stageId: stage.id,
      reviewerName: approval.reviewerName || "Reviewer",
      reviewerEmail: approval.reviewerEmail,
      decision: approval.decision,
      comments: approval.comments,
      decisionDate: new Date().toISOString(),
    };
    onUpdate((current) => {
      const withApproval = { ...current, approvals: [approvalRecord, ...current.approvals] };
      if (approval.decision === "Approve") return advanceProject(withApproval, nextActionLabel(withApproval));
      return sendBackForRevision(withApproval, approval.decision, approval.comments);
    });
    setApproval({ reviewerName: "", reviewerEmail: "", decision: "Approve", comments: "" });
  };

  const updateTask = (taskId, patch) => {
    onUpdate((current) => ({
      ...current,
      stages: current.stages.map((item) => item.id === stage.id
        ? { ...item, requiredTasks: item.requiredTasks.map((task) => task.id === taskId ? { ...task, ...patch, fields: { ...task.fields, ...(patch.fields || {}) } } : task) }
        : item),
    }));
  };

  const addBlocker = () => {
    if (!blocker.title.trim()) return;
    onUpdate((current) => {
      const next = {
        ...current,
        blockers: [{
          id: `blocker-${Date.now()}`,
          projectId: current.id,
          title: blocker.title,
          description: blocker.description,
          owner: blocker.owner,
          status: "Open",
          createdDate: new Date().toISOString(),
          resolvedDate: "",
          resolutionNotes: "",
        }, ...current.blockers],
      };
      return { ...next, notifications: [makeNotification(next, "Project blocked", blocker.title), ...current.notifications] };
    });
    setBlocker({ title: "", description: "", owner: "" });
  };

  const addInformPerson = () => {
    if (!newPerson.email.trim() && !newPerson.name.trim()) return;
    onUpdate((current) => ({ ...current, peopleToInform: [...current.peopleToInform, newPerson] }));
    setNewPerson({ name: "", email: "" });
  };

  return (
    <aside id={`menu-project-${project.id}`} className="rounded-lg border border-sky-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600">Project Record</p>
          <h2 className="mt-1 text-3xl font-black">{project.menuName}</h2>
          <p className="mt-1 text-sm font-bold text-slate-500">{project.menuType} / Menu launch {formatDate(project.launchDate)}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusBadge status={project.status} />
          <button type="button" onClick={onTrash} className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-black text-rose-700 hover:bg-rose-100">
            <Trash2 size={16} />
            Trash Project
          </button>
          <button type="button" onClick={() => setDelayForm({ open: !delayForm.open, launchDate: project.launchDate, reason: "" })} className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-black text-amber-800 hover:bg-amber-100">
            <Clock size={16} />
            Delay Project
          </button>
        </div>
      </div>

      {delayForm.open && (
        <section className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_2fr_auto]">
            <label className="block">
              <span className="text-xs font-black uppercase tracking-[0.14em] text-amber-800">New Menu Launch Date</span>
              <input value={delayForm.launchDate} onChange={(event) => setDelayForm({ ...delayForm, launchDate: event.target.value })} type="date" className="mt-1 w-full rounded-lg border border-amber-200 bg-white px-3 py-2.5 text-sm font-bold" />
            </label>
            <label className="block">
              <span className="text-xs font-black uppercase tracking-[0.14em] text-amber-800">Delay Reason</span>
              <input value={delayForm.reason} onChange={(event) => setDelayForm({ ...delayForm, reason: event.target.value })} className="mt-1 w-full rounded-lg border border-amber-200 bg-white px-3 py-2.5 text-sm font-bold" placeholder="Reason for delay" />
            </label>
            <button type="button" onClick={submitDelay} className="self-end rounded-lg bg-slate-950 px-4 py-3 text-sm font-black text-white">
              Update Dates
            </button>
          </div>
          <p className="mt-2 text-xs font-bold text-amber-900">Recalculates open stage dates and keeps IT / Centric targeted 5 business days before the new launch date.</p>
        </section>
      )}

      {project.compressedTimeline && (
        <div className="mt-4 rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm font-bold text-orange-900">
          Compressed Timeline: this menu launch date is under standard lead time, so due dates are shortened proportionally while IT / Centric stays targeted ahead of launch.
        </div>
      )}

      <section className="mt-5 rounded-lg border border-sky-200 bg-slate-50 p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Current Stage</p>
            <h3 className="mt-1 text-xl font-black">{stage.name}</h3>
            <p className="mt-1 text-sm font-bold text-slate-500">{stage.ownerTeam} / Due {formatDate(stage.dueDate)}</p>
            {isWorkingAhead && <p className="mt-1 text-xs font-black uppercase tracking-[0.14em] text-emerald-700">Work-ahead view / current gate remains {currentStage.name}</p>}
          </div>
          <CalendarDays className="text-emerald-600" size={28} />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
          {stage.templateKey && (
            <button type="button" onClick={() => downloadTemplate(stage.templateKey, project.menuName)} className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800">
              <Download size={17} />
              Download {TEMPLATE_FILES[stage.templateKey].label}
            </button>
          )}
          <button type="button" disabled={isWorkingAhead || !completion.ok} onClick={markStageComplete} className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300">
            <CheckCircle2 size={17} />
            {isWorkingAhead ? "Current gate must advance first" : "Mark Stage Complete"}
          </button>
        </div>
        {!completion.ok && <p className="mt-3 text-sm font-bold text-amber-800">{completion.reason}</p>}
      </section>

      <StageTimeline project={project} activeStageId={stage.id} onSelectStage={setActiveStageId} canOpenStage={canOpenStage} />

      <section className="mt-5 rounded-lg border border-sky-200 bg-white p-4 shadow-sm">
        <SectionTitle icon={Users} title="People and Team Assignment" />
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <PeopleListEditor
            label="Project Owner / Chef"
            people={projectOwners}
            onChange={(people) => onUpdate((current) => ({ ...current, projectOwners: people, projectOwner: people[0] || { name: "", email: "" } }))}
          />
          <PersonEditor label="District Chef / SSMT Owner" person={project.districtChefOwner} onChange={(person) => onUpdate((current) => ({ ...current, districtChefOwner: person }))} />
        </div>
        <div className="mt-3 rounded-lg border border-slate-300 bg-slate-50 p-3">
          <p className="text-sm font-black">People to Inform</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {[...project.peopleToInform, ...TEAM_PRESETS.slice(0, 0)].map((person, index) => (
              <span key={`${person.email}-${index}`} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold">{person.name || person.email}</span>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-[1fr_1fr_auto]">
            <input value={newPerson.name} onChange={(event) => setNewPerson({ ...newPerson, name: event.target.value })} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold" placeholder="Name" />
            <input value={newPerson.email} onChange={(event) => setNewPerson({ ...newPerson, email: event.target.value })} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold" placeholder="Email" />
            <button type="button" onClick={addInformPerson} className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-black text-white">Add</button>
          </div>
        </div>
      </section>

      <section className="mt-5 rounded-lg border border-sky-200 bg-white p-4 shadow-sm">
        <SectionTitle icon={Paperclip} title="Central File Area" />
        <div className="mt-3 grid grid-cols-1 gap-3">
          {stage.requiredFiles.map((fileName) => (
            <FileUploadRow key={fileName} label={fileName} required onChange={(event) => addFile(event, fileName, true)} />
          ))}
          <FileUploadRow label="Other Attachments" onChange={(event) => addFile(event, "Other Attachments", false)} />
        </div>
        <div className="mt-4 space-y-2">
          {project.files.length ? project.files.map((file) => (
            <div key={file.id} className="rounded-lg border border-slate-300 bg-slate-50 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-black text-slate-950">{file.fileName}</p>
                  <p className="mt-1 text-xs font-bold text-slate-500">
                    {file.fileCategory} / Version {file.version || 1} / Uploaded by {file.uploadedBy} / {formatDateTime(file.uploadedDate)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black">{file.required ? "Required" : "Optional"}</span>
                  <button type="button" disabled={!file.dataUrl} onClick={() => downloadStoredFile(file)} className="inline-flex items-center gap-1 rounded-lg border border-sky-200 bg-white px-3 py-2 text-xs font-black text-sky-800 disabled:cursor-not-allowed disabled:text-slate-400">
                    <Download size={14} />
                    Download
                  </button>
                  <button type="button" onClick={() => deleteFile(file.id)} className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-black text-rose-700 hover:bg-rose-100">
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>
              {!file.dataUrl && <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900">Download not available for this file because it was larger than the browser-side storage limit.</p>}
            </div>
          )) : <p className="rounded-lg border border-dashed border-slate-200 p-4 text-sm font-bold text-slate-500">No files uploaded yet.</p>}
        </div>
      </section>

      {(stage.requiredApprovals.length > 0 || stage.ownerTeam === "IT Team") && (
        <section className="mt-5 rounded-lg border border-sky-200 bg-white p-4 shadow-sm">
          <SectionTitle icon={CheckCircle2} title={stage.ownerTeam === "IT Team" ? "IT / Centric Status" : "Approval Actions"} />
          {stage.ownerTeam === "IT Team" ? (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {["In Progress", "Complete", "Blocked", "Needs clarification"].map((state) => (
                <button key={state} type="button" onClick={() => state === "Complete" ? onUpdate((current) => advanceProject(current, "IT marked complete")) : onUpdate((current) => ({ ...current, status: state === "Blocked" ? "Blocked" : "Waiting on IT", notifications: [makeNotification(current, `IT status: ${state}`), ...current.notifications] }))} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-black hover:bg-white">
                  {state}
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <input value={approval.reviewerName} onChange={(event) => setApproval({ ...approval, reviewerName: event.target.value })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold" placeholder="Reviewer name" />
                <input value={approval.reviewerEmail} onChange={(event) => setApproval({ ...approval, reviewerEmail: event.target.value })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold" placeholder="Reviewer email" />
              </div>
              <select value={approval.decision} onChange={(event) => setApproval({ ...approval, decision: event.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold">
                <option>Approve</option>
                <option>Reject</option>
                <option>Request changes</option>
              </select>
              <textarea value={approval.comments} onChange={(event) => setApproval({ ...approval, comments: event.target.value })} className="min-h-[90px] w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold" placeholder="Comments" />
              <button type="button" onClick={submitApproval} className="w-full rounded-lg bg-slate-950 px-4 py-3 text-sm font-black text-white">Submit Review Decision</button>
            </div>
          )}
        </section>
      )}

      {stage.requiredTasks?.length > 0 && (
        <section className="mt-5 rounded-lg border border-sky-200 bg-white p-4 shadow-sm">
          <SectionTitle icon={FileSpreadsheet} title="Microconcept Deliverables" />
          <div className="mt-3 space-y-3">
            {stage.requiredTasks.map((task) => (
              <TaskCard key={task.id} task={task} onChange={(patch) => updateTask(task.id, patch)} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-5 rounded-lg border border-sky-200 bg-white p-4 shadow-sm">
        <SectionTitle icon={ShieldAlert} title="Snags / Blockers" />
        <div className="mt-3 grid grid-cols-1 gap-2">
          <input value={blocker.title} onChange={(event) => setBlocker({ ...blocker, title: event.target.value })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold" placeholder="Blocker title" />
          <input value={blocker.owner} onChange={(event) => setBlocker({ ...blocker, owner: event.target.value })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold" placeholder="Owner" />
          <textarea value={blocker.description} onChange={(event) => setBlocker({ ...blocker, description: event.target.value })} className="min-h-[80px] rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold" placeholder="Description" />
          <button type="button" onClick={addBlocker} className="rounded-lg bg-slate-950 px-4 py-3 text-sm font-black text-white">Add Blocker</button>
        </div>
        <div className="mt-3 space-y-2">
          {project.blockers.map((item) => (
            <div key={item.id} className={`rounded-lg border p-3 ${item.status === "Open" ? "border-red-200 bg-red-50" : "border-emerald-200 bg-emerald-50"}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black">{item.title}</p>
                  <p className="mt-1 text-xs font-bold text-slate-600">{item.description}</p>
                  <p className="mt-1 text-xs font-bold text-slate-500">Owner: {item.owner || "-"} / {formatDateTime(item.createdDate)}</p>
                </div>
                {item.status === "Open" && <button type="button" onClick={() => onUpdate((current) => ({ ...current, blockers: current.blockers.map((blockerItem) => blockerItem.id === item.id ? { ...blockerItem, status: "Resolved", resolvedDate: new Date().toISOString(), resolutionNotes: "Resolved from dashboard" } : blockerItem) }))} className="rounded-full bg-white px-3 py-1 text-xs font-black">Resolve</button>}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-5 rounded-lg border border-sky-200 bg-white p-4 shadow-sm">
        <SectionTitle icon={Bell} title="Notification Log" />
        <div className="mt-3 space-y-2">
          {project.notifications.slice(0, 8).map((note) => (
            <div key={note.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2">
                <Mail className="mt-0.5 text-emerald-600" size={16} />
                <div>
                  <p className="text-sm font-black">{note.requiredAction}</p>
                  <p className="mt-1 text-xs font-bold text-slate-500">{note.currentStage} / Due {formatDate(note.dueDate)} / {formatDateTime(note.createdDate)}</p>
                  {note.recipients?.length > 0 && (
                    <p className="mt-1 text-xs font-bold text-emerald-700">
                      Notify: {note.recipients.map((person) => person.name || person.email).join(", ")}
                    </p>
                  )}
                  {note.comments && <p className="mt-1 text-xs font-semibold text-slate-600">{note.comments}</p>}
                </div>
                </div>
                {notificationMailto(note) && (
                  <a href={notificationMailto(note)} className="shrink-0 rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-black text-emerald-800 hover:bg-emerald-50">
                    Email Draft
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </aside>
  );
}

function nextActionLabel(project) {
  const stage = getCurrentStage(project);
  if (stage.id === "concept-brief" || stage.id === "multi-station-brief") return project.menuType === MENU_TYPES.MICROCONCEPT ? "Ready for Director review" : "Ready for Experience review";
  if (stage.id === "director-review") return "Director approved; deliverables unlocked";
  if (stage.id === "experience-review") return "Experience approved; ready for SSMT programming";
  if (stage.id === "microconcept-deliverables") return "Microconcept deliverables complete; ready for SSMT programming";
  if (stage.id === "ssmt-programming") return "SSMT uploaded; ready for IT / Centric programming";
  return "Stage complete";
}

function StageTimeline({ project, activeStageId, onSelectStage, canOpenStage }) {
  const centricTarget = project.centricCompleteBy || project.stages.at(-1)?.dueDate || project.launchDate;
  return (
    <section className="mt-5 rounded-lg border border-sky-200 bg-white p-4 shadow-sm">
      <SectionTitle icon={Clock} title="Timeline" />
      <div className="mt-3 rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm font-bold text-slate-700">
        <span className="text-slate-950">Menu Launch Date:</span> {formatDate(project.launchDate)}
        <span className="mx-2 text-slate-400">/</span>
        <span className="text-slate-950">IT / Centric complete by:</span> {formatDate(centricTarget)}
        <span className="ml-2 text-slate-500">(5 business days before launch)</span>
      </div>
      <div className="mt-3 space-y-2">
        {project.stages.map((stage) => {
          const open = canOpenStage?.(stage);
          const active = stage.id === activeStageId;
          return (
          <button type="button" key={stage.id} disabled={!open} onClick={() => open && onSelectStage(stage.id)} className={`w-full rounded-lg border p-3 text-left transition ${active ? "border-emerald-300 bg-emerald-50 shadow-sm" : stage.id === project.currentStage ? "border-emerald-300 bg-emerald-50" : "border-slate-300 bg-slate-50"} ${open ? "cursor-pointer hover:border-sky-400 hover:bg-white" : "cursor-default opacity-90"}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-black">{stage.order}. {stage.name}</p>
              <div className="flex flex-wrap items-center gap-2">
                {stage.id === "microconcept-deliverables" && open && stage.id !== project.currentStage && (
                  <span className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-black text-emerald-700">Work ahead</span>
                )}
                <span className="rounded-full bg-white px-3 py-1 text-xs font-black">{stage.status}</span>
              </div>
            </div>
            <p className="mt-1 text-xs font-bold text-slate-500">{stage.ownerTeam} / {formatDate(stage.startDate)} to {formatDate(stage.dueDate)}</p>
          </button>
        );
        })}
      </div>
    </section>
  );
}

function SectionTitle({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-2">
      <Icon size={18} className="text-emerald-600" />
      <h3 className="text-base font-black text-slate-950">{title}</h3>
    </div>
  );
}

function FileUploadRow({ label, required = false, onChange }) {
  return (
    <label className="flex cursor-pointer flex-col gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 hover:bg-white md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-sm font-black text-slate-950">{label}</p>
        <p className="text-xs font-bold text-slate-500">{required ? "Required file" : "Optional upload"}</p>
      </div>
      <span className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-black text-slate-800">
        <Upload size={16} />
        Upload
      </span>
      <input type="file" className="hidden" onChange={onChange} />
    </label>
  );
}

function PeopleListEditor({ label, people, onChange }) {
  const list = people.length ? people : [{ name: "", email: "" }];
  const updatePerson = (index, patch) => {
    const next = list.map((person, personIndex) => personIndex === index ? { ...person, ...patch } : person);
    onChange(next.filter((person, personIndex) => personIndex === index || person.name || person.email));
  };
  const addPerson = () => onChange([...people, { name: "", email: "" }]);
  const removePerson = (index) => onChange(list.filter((_, personIndex) => personIndex !== index));

  return (
    <div className="rounded-lg border border-sky-200 bg-slate-50 p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="max-w-[70%] text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
        <button type="button" onClick={addPerson} className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-800">
          Add owner
        </button>
      </div>
      <div className="mt-3 space-y-3">
        {list.map((person, index) => (
          <div key={`${index}-${person.email || person.name}`} className="rounded-lg border border-slate-300 bg-white p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">Owner {index + 1}</p>
              {list.length > 1 && (
                <button type="button" onClick={() => removePerson(index)} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-600 hover:bg-rose-50 hover:text-rose-700">
                  Remove
                </button>
              )}
            </div>
            <input value={person.name || ""} onChange={(event) => updatePerson(index, { name: event.target.value })} className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold" placeholder="Name" />
            <input value={person.email || ""} onChange={(event) => updatePerson(index, { email: event.target.value })} className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold" placeholder="Email" />
          </div>
        ))}
      </div>
    </div>
  );
}

function PersonEditor({ label, person, onChange }) {
  return (
    <div className="rounded-lg border border-sky-200 bg-slate-50 p-3 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <input value={person.name} onChange={(event) => onChange({ ...person, name: event.target.value })} className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold" placeholder="Name" />
      <input value={person.email} onChange={(event) => onChange({ ...person, email: event.target.value })} className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold" placeholder="Email" />
    </div>
  );
}

function TaskCard({ task, onChange }) {
  return (
    <div className="rounded-lg border border-sky-200 bg-slate-50 p-3 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-black">{task.name}</p>
        <select value={task.status} onChange={(event) => onChange({ status: event.target.value })} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-black">
          <option>Not Started</option>
          <option>In Progress</option>
          <option>Complete</option>
        </select>
      </div>
      {task.name === "Schedule Tasting" && (
        <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
          <input value={task.fields.tastingDate} onChange={(event) => onChange({ fields: { tastingDate: event.target.value } })} type="date" className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold" />
          <input value={task.fields.tastingLocation} onChange={(event) => onChange({ fields: { tastingLocation: event.target.value } })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold" placeholder="Tasting location" />
          <input value={task.fields.attendees} onChange={(event) => onChange({ fields: { attendees: event.target.value } })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold md:col-span-2" placeholder="Attendees" />
        </div>
      )}
      {task.name === "Photography Scheduled" && (
        <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
          <input value={task.fields.shootDate || ""} onChange={(event) => onChange({ fields: { shootDate: event.target.value } })} type="date" className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold" />
          <input value={task.fields.photographer || ""} onChange={(event) => onChange({ fields: { photographer: event.target.value } })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold" placeholder="Photographer / owner" />
        </div>
      )}
      {task.name === "Webtrition Entry" && (
        <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
          <input value={task.fields.recipeName} onChange={(event) => onChange({ fields: { recipeName: event.target.value } })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold" placeholder="Recipe name" />
          <input value={task.fields.mrn} onChange={(event) => onChange({ fields: { mrn: event.target.value } })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold" placeholder="Webtrition number" />
        </div>
      )}
      <textarea value={task.fields.notes || ""} onChange={(event) => onChange({ fields: { notes: event.target.value } })} className="mt-2 min-h-[70px] w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold" placeholder="Notes" />
    </div>
  );
}

function StatusBadge({ status }) {
  return <span className={`w-fit rounded-full border px-3 py-1 text-xs font-black ${statusTone[status] || statusTone["On Track"]}`}>{status}</span>;
}

function TrashProjectModal({ project, onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-rose-200 bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-rose-600">Confirm Trash</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">Trash this menu project?</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"><X size={18} /></button>
        </div>
        <div className="mt-5 rounded-lg border border-rose-100 bg-rose-50 p-4">
          <p className="text-lg font-black text-rose-950">{project.menuName}</p>
          <p className="mt-1 text-sm font-bold text-rose-800">{project.menuType} / Launch {formatDate(project.launchDate)}</p>
        </div>
        <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">
          This removes the project from this dashboard view. Use this for test records, accidental starts, or duplicate projects.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800 hover:bg-slate-50">
            Keep Project
          </button>
          <button type="button" onClick={onConfirm} className="inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-3 text-sm font-black text-white hover:bg-rose-700">
            <Trash2 size={17} />
            Trash Project
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateProjectModal({ onClose, onCreate }) {
  const [form, setForm] = useState({
    menuName: "",
    menuType: MENU_TYPES.PROMOTIONAL,
    launchDate: "",
    createdBy: "",
  });

  const submit = () => {
    const projectOwners = form.createdBy
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean)
      .map((name) => ({ name, email: "" }));
    onCreate({
      ...form,
      launchDate: form.launchDate || "2026-08-14",
      createdDate: todayIso(),
      projectOwners,
      projectOwner: projectOwners[0] || { name: "", email: "" },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600">New Project</p>
            <h2 className="mt-1 text-2xl font-black">Create menu project</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-slate-200 p-2"><X size={18} /></button>
        </div>
        <div className="mt-5 space-y-3">
          <input value={form.menuName} onChange={(event) => setForm({ ...form, menuName: event.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-3 text-sm font-bold" placeholder="Menu name" />
          <select value={form.menuType} onChange={(event) => setForm({ ...form, menuType: event.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-3 text-sm font-bold">
            {Object.values(MENU_TYPES).map((type) => <option key={type}>{type}</option>)}
          </select>
          <label className="block">
            <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Menu Launch Date</span>
            <input value={form.launchDate} onChange={(event) => setForm({ ...form, launchDate: event.target.value })} type="date" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-3 text-sm font-bold" />
            <span className="mt-1 block text-xs font-bold text-slate-500">This is the guest-facing launch date. IT / Centric is planned to finish 5 business days before launch.</span>
          </label>
          <input value={form.createdBy} onChange={(event) => setForm({ ...form, createdBy: event.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-3 text-sm font-bold" placeholder="Project owner(s) / chef(s), comma separated" />
          <button type="button" onClick={submit} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-3 text-sm font-black text-white">
            Create Project
            <ArrowRight size={17} />
          </button>
        </div>
      </div>
    </div>
  );
}

