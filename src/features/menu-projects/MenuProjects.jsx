import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  Clock,
  Download,
  FileSpreadsheet,
  FolderKanban,
  Mail,
  Paperclip,
  Plus,
  Search,
  ShieldAlert,
  Upload,
  Users,
  X,
} from "lucide-react";

import CompassOneLogo from "../../shared/ui/CompassOneLogo.jsx";
import PlatformSettings from "../../shared/ui/PlatformSettings.jsx";
import VersionStamp from "../../shared/ui/VersionStamp.jsx";
import {
  MENU_PROJECT_STORAGE_KEY,
  MENU_TYPES,
  TEMPLATE_FILES,
  advanceProject,
  createProject,
  currentStageCanComplete,
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
  "Station Handbook",
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

function loadProjects() {
  if (typeof window === "undefined") return sampleProjects();
  try {
    const stored = window.localStorage.getItem(MENU_PROJECT_STORAGE_KEY);
    if (!stored) return sampleProjects();
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) && parsed.length ? parsed : sampleProjects();
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

export default function MenuProjects({ onBackToPlatform, onOpenSmartsheetHealth }) {
  const [projects, setProjects] = useState(loadProjects);
  const [selectedId, setSelectedId] = useState(() => projects[0]?.id || "");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [ownerFilter, setOwnerFilter] = useState("All");
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => saveProjects(projects), [projects]);

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
      return { ...next, status: getProjectStatus(next) };
    }));
  };

  const addProject = (input) => {
    const project = createProject(input);
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

  return (
    <div className="min-h-screen bg-slate-50 pb-20 text-slate-950">
      <div className="mx-auto flex w-full max-w-[96rem] flex-col gap-5 px-4 py-5 md:px-8">
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
            <div className="flex flex-wrap items-center gap-2">
              <PlatformSettings onOpenSmartsheetHealth={onOpenSmartsheetHealth} />
              <CompassOneLogo compact />
              <VersionStamp />
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

        <main className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)]">
          <section className="space-y-5">
            <PipelineBoard projects={filteredProjects} selectedId={selectedProject?.id} onSelect={setSelectedId} />
            <ProjectTable projects={filteredProjects} selectedId={selectedProject?.id} onSelect={setSelectedId} />
          </section>

          {selectedProject && (
            <ProjectDetail
              project={selectedProject}
              onUpdate={(updater) => updateProject(selectedProject.id, updater)}
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

function PipelineBoard({ projects, selectedId, onSelect }) {
  const stages = ["Concept Brief", "Director of Culinary Review", "Experience Review", "Microconcept Deliverables", "SSMT Programming", "IT / Centric Programming"];
  return (
    <section className="rounded-lg border border-sky-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600">Pipeline</p>
          <h2 className="mt-1 text-2xl font-black">Menu launch board</h2>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-600">{projects.length} visible projects</span>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3 2xl:grid-cols-6">
        {stages.map((stageName) => {
          const columnProjects = projects.filter((project) => getCurrentStage(project)?.name === stageName);
          return (
            <div key={stageName} className="min-h-[210px] rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-black text-slate-950">{stageName}</h3>
                <span className="rounded-full bg-white px-2 py-1 text-xs font-black text-slate-500">{columnProjects.length}</span>
              </div>
              <div className="mt-3 space-y-2">
                {columnProjects.map((project) => (
                  <button key={project.id} type="button" onClick={() => onSelect(project.id)} className={`w-full rounded-lg border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md ${selectedId === project.id ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white"}`}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-black text-slate-950">{project.menuName}</p>
                      <StatusBadge status={project.status} />
                    </div>
                    <p className="mt-2 text-xs font-bold text-slate-500">{project.menuType}</p>
                    <p className="mt-1 text-xs font-bold text-slate-600">Launch {formatDate(project.launchDate)}</p>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ProjectTable({ projects, selectedId, onSelect }) {
  return (
    <section className="rounded-lg border border-sky-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Project List</p>
      <div className="mt-3 overflow-hidden rounded-lg border border-slate-200">
        {projects.map((project) => {
          const stage = getCurrentStage(project);
          return (
            <button key={project.id} type="button" onClick={() => onSelect(project.id)} className={`grid w-full grid-cols-1 gap-2 border-b border-slate-200 p-4 text-left last:border-b-0 md:grid-cols-[1.2fr_0.9fr_0.8fr_0.7fr] ${selectedId === project.id ? "bg-emerald-50" : "bg-white hover:bg-slate-50"}`}>
              <div>
                <p className="text-base font-black text-slate-950">{project.menuName}</p>
                <p className="text-xs font-bold text-slate-500">{project.menuType}</p>
              </div>
              <p className="text-sm font-bold text-slate-700">{stage?.name}</p>
              <p className="text-sm font-bold text-slate-700">Due {formatDate(stage?.dueDate)}</p>
              <StatusBadge status={project.status} />
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ProjectDetail({ project, onUpdate }) {
  const [approval, setApproval] = useState({ reviewerName: "", reviewerEmail: "", decision: "Approve", comments: "" });
  const [blocker, setBlocker] = useState({ title: "", description: "", owner: "" });
  const [newPerson, setNewPerson] = useState({ name: "", email: "" });
  const stage = getCurrentStage(project);
  const completion = currentStageCanComplete(project);

  const addFile = (event, category, required = false) => {
    const file = event.target.files?.[0];
    if (!file) return;
    onUpdate((current) => {
      const next = {
        ...current,
        files: [
          {
            id: `file-${Date.now()}`,
            projectId: current.id,
            fileName: file.name,
            fileCategory: category,
            uploadedBy: current.projectOwner.name || "Project Owner",
            uploadedDate: new Date().toISOString(),
            required,
            status: "Uploaded",
            url: "",
          },
          ...current.files,
        ],
      };
      return {
        ...next,
        notifications: [makeNotification(next, `${category} uploaded`, file.name), ...current.notifications],
      };
    });
    event.target.value = "";
  };

  const markStageComplete = () => {
    if (!completion.ok) return;
    onUpdate((current) => advanceProject(current, nextActionLabel(current)));
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
    <aside id={`menu-project-${project.id}`} className="rounded-lg border border-sky-200 bg-white p-4 shadow-sm xl:sticky xl:top-4 xl:max-h-[calc(100vh-2rem)] xl:overflow-auto">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600">Project Record</p>
          <h2 className="mt-1 text-3xl font-black">{project.menuName}</h2>
          <p className="mt-1 text-sm font-bold text-slate-500">{project.menuType} / Launch {formatDate(project.launchDate)}</p>
        </div>
        <StatusBadge status={project.status} />
      </div>

      {project.compressedTimeline && (
        <div className="mt-4 rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm font-bold text-orange-900">
          Compressed Timeline: this launch date is under standard lead time, so due dates are shortened proportionally.
        </div>
      )}

      <section className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Current Stage</p>
            <h3 className="mt-1 text-xl font-black">{stage.name}</h3>
            <p className="mt-1 text-sm font-bold text-slate-500">{stage.ownerTeam} / Due {formatDate(stage.dueDate)}</p>
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
          <button type="button" disabled={!completion.ok} onClick={markStageComplete} className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300">
            <CheckCircle2 size={17} />
            Mark Stage Complete
          </button>
        </div>
        {!completion.ok && <p className="mt-3 text-sm font-bold text-amber-800">{completion.reason}</p>}
      </section>

      <StageTimeline project={project} />

      <section className="mt-5 rounded-lg border border-slate-200 bg-white p-4">
        <SectionTitle icon={Users} title="People and Team Assignment" />
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <PersonEditor label="Project Owner / Chef" person={project.projectOwner} onChange={(person) => onUpdate((current) => ({ ...current, projectOwner: person }))} />
          <PersonEditor label="District Chef / SSMT Owner" person={project.districtChefOwner} onChange={(person) => onUpdate((current) => ({ ...current, districtChefOwner: person }))} />
        </div>
        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
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

      <section className="mt-5 rounded-lg border border-slate-200 bg-white p-4">
        <SectionTitle icon={Paperclip} title="Central File Area" />
        <div className="mt-3 grid grid-cols-1 gap-3">
          {stage.requiredFiles.map((fileName) => (
            <FileUploadRow key={fileName} label={fileName} required onChange={(event) => addFile(event, fileName, true)} />
          ))}
          <FileUploadRow label="Other Attachments" onChange={(event) => addFile(event, "Other Attachments", false)} />
        </div>
        <div className="mt-4 space-y-2">
          {project.files.length ? project.files.map((file) => (
            <div key={file.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-black text-slate-950">{file.fileName}</p>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black">{file.required ? "Required" : "Optional"}</span>
              </div>
              <p className="mt-1 text-xs font-bold text-slate-500">{file.fileCategory} / Uploaded by {file.uploadedBy} / {formatDateTime(file.uploadedDate)}</p>
            </div>
          )) : <p className="rounded-lg border border-dashed border-slate-200 p-4 text-sm font-bold text-slate-500">No files uploaded yet.</p>}
        </div>
      </section>

      {(stage.requiredApprovals.length > 0 || stage.ownerTeam === "IT Team") && (
        <section className="mt-5 rounded-lg border border-slate-200 bg-white p-4">
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
        <section className="mt-5 rounded-lg border border-slate-200 bg-white p-4">
          <SectionTitle icon={FileSpreadsheet} title="Microconcept Deliverables" />
          <div className="mt-3 space-y-3">
            {stage.requiredTasks.map((task) => (
              <TaskCard key={task.id} task={task} onChange={(patch) => updateTask(task.id, patch)} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-5 rounded-lg border border-slate-200 bg-white p-4">
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

      <section className="mt-5 rounded-lg border border-slate-200 bg-white p-4">
        <SectionTitle icon={Bell} title="Notification Log" />
        <div className="mt-3 space-y-2">
          {project.notifications.slice(0, 8).map((note) => (
            <div key={note.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-start gap-2">
                <Mail className="mt-0.5 text-emerald-600" size={16} />
                <div>
                  <p className="text-sm font-black">{note.requiredAction}</p>
                  <p className="mt-1 text-xs font-bold text-slate-500">{note.currentStage} / Due {formatDate(note.dueDate)} / {formatDateTime(note.createdDate)}</p>
                  {note.comments && <p className="mt-1 text-xs font-semibold text-slate-600">{note.comments}</p>}
                </div>
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

function StageTimeline({ project }) {
  return (
    <section className="mt-5 rounded-lg border border-slate-200 bg-white p-4">
      <SectionTitle icon={Clock} title="Timeline" />
      <div className="mt-3 space-y-2">
        {project.stages.map((stage) => (
          <div key={stage.id} className={`rounded-lg border p-3 ${stage.id === project.currentStage ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50"}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-black">{stage.order}. {stage.name}</p>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-black">{stage.status}</span>
            </div>
            <p className="mt-1 text-xs font-bold text-slate-500">{stage.ownerTeam} / {formatDate(stage.startDate)} to {formatDate(stage.dueDate)}</p>
          </div>
        ))}
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

function PersonEditor({ label, person, onChange }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <input value={person.name} onChange={(event) => onChange({ ...person, name: event.target.value })} className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold" placeholder="Name" />
      <input value={person.email} onChange={(event) => onChange({ ...person, email: event.target.value })} className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold" placeholder="Email" />
    </div>
  );
}

function TaskCard({ task, onChange }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-black">{task.name}</p>
        <select value={task.status} onChange={(event) => onChange({ status: event.target.value })} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-black">
          <option>Not Started</option>
          <option>In Progress</option>
          <option>Complete</option>
        </select>
      </div>
      {task.name === "Scheduled Tasting" && (
        <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
          <input value={task.fields.tastingDate} onChange={(event) => onChange({ fields: { tastingDate: event.target.value } })} type="date" className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold" />
          <input value={task.fields.tastingLocation} onChange={(event) => onChange({ fields: { tastingLocation: event.target.value } })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold" placeholder="Tasting location" />
          <input value={task.fields.attendees} onChange={(event) => onChange({ fields: { attendees: event.target.value } })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold md:col-span-2" placeholder="Attendees" />
        </div>
      )}
      {task.name === "Webtrition Recipe Entry / MRNs" && (
        <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
          <input value={task.fields.recipeName} onChange={(event) => onChange({ fields: { recipeName: event.target.value } })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold" placeholder="Recipe name" />
          <input value={task.fields.mrn} onChange={(event) => onChange({ fields: { mrn: event.target.value } })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold" placeholder="Webtrition number / MRN" />
        </div>
      )}
      <textarea value={task.fields.notes || ""} onChange={(event) => onChange({ fields: { notes: event.target.value } })} className="mt-2 min-h-[70px] w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold" placeholder="Notes" />
    </div>
  );
}

function StatusBadge({ status }) {
  return <span className={`w-fit rounded-full border px-3 py-1 text-xs font-black ${statusTone[status] || statusTone["On Track"]}`}>{status}</span>;
}

function CreateProjectModal({ onClose, onCreate }) {
  const [form, setForm] = useState({
    menuName: "",
    menuType: MENU_TYPES.PROMOTIONAL,
    launchDate: "",
    createdBy: "",
  });

  const submit = () => {
    onCreate({
      ...form,
      launchDate: form.launchDate || "2026-08-14",
      createdDate: todayIso(),
      projectOwner: { name: form.createdBy || "Project Owner", email: "" },
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
          <input value={form.launchDate} onChange={(event) => setForm({ ...form, launchDate: event.target.value })} type="date" className="w-full rounded-lg border border-slate-200 px-3 py-3 text-sm font-bold" />
          <input value={form.createdBy} onChange={(event) => setForm({ ...form, createdBy: event.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-3 text-sm font-bold" placeholder="Project owner / chef" />
          <button type="button" onClick={submit} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-3 text-sm font-black text-white">
            Create Project
            <ArrowRight size={17} />
          </button>
        </div>
      </div>
    </div>
  );
}

