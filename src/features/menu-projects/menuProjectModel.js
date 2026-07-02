export const MENU_PROJECT_STORAGE_KEY = "culinaryToolsMenuProjects.v1";

export const MENU_TYPES = {
  PROMOTIONAL: "Promotional Menu",
  MICROCONCEPT: "Microconcept",
  NEW_UNIT: "New Unit Opening",
};

export const TEMPLATE_FILES = {
  conceptBrief: {
    label: "New Menu Concept Brief",
    path: "/templates/new-menu-concept-brief.xlsx",
    baseFileName: "New Menu Concept Brief.xlsx",
  },
  multiStationBrief: {
    label: "New Menu Multi Station Concept Brief",
    path: "/templates/new-menu-multi-station-concept-brief.xlsx",
    baseFileName: "New Menu Multi Station Concept Brief.xlsx",
  },
};

export const STATUS_BADGES = [
  "On Track",
  "At Risk",
  "Late",
  "Compressed Timeline",
  "Needs Revision",
  "Waiting on Experience",
  "Waiting on Director",
  "Waiting on District Chef",
  "Waiting on IT",
  "Complete",
  "Blocked",
];

const DAY_MS = 24 * 60 * 60 * 1000;

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function formatDate(value) {
  if (!value) return "-";
  const date = new Date(`${value}T12:00:00`);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function formatDateTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function toIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

export function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function addBusinessDays(startIso, days) {
  const date = new Date(`${startIso}T12:00:00`);
  let remaining = Math.max(0, Math.round(days));
  while (remaining > 0) {
    date.setDate(date.getDate() + 1);
    if (!isWeekend(date)) remaining -= 1;
  }
  return toIsoDate(date);
}

export function businessDaysBetween(startIso, endIso) {
  const start = new Date(`${startIso}T12:00:00`);
  const end = new Date(`${endIso}T12:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return 0;
  let count = 0;
  const cursor = new Date(start);
  while (cursor < end) {
    cursor.setDate(cursor.getDate() + 1);
    if (cursor <= end && !isWeekend(cursor)) count += 1;
  }
  return count;
}

function compactId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function stageBlueprints(menuType) {
  if (menuType === MENU_TYPES.MICROCONCEPT) {
    return [
      {
        id: "concept-brief",
        name: "Concept Brief",
        ownerTeam: "Project Owner",
        standardDays: 5,
        requiredFiles: ["Completed New Menu Concept Brief"],
        templateKey: "conceptBrief",
      },
      {
        id: "director-review",
        name: "Director of Culinary Review",
        ownerTeam: "Director of Culinary",
        standardDays: 5,
        requiredApprovals: ["Director of Culinary approval"],
      },
      {
        id: "experience-review",
        name: "Experience Review",
        ownerTeam: "Experience Team",
        standardDays: 10,
        requiredApprovals: ["Experience Team approval"],
      },
      {
        id: "microconcept-deliverables",
        name: "Microconcept Deliverables",
        ownerTeam: "District Chef",
        standardDays: 5,
        requiredFiles: ["Station Handbook"],
        requiredTasks: ["Scheduled Tasting", "Station Handbook", "Webtrition Recipe Entry / MRNs"],
      },
      {
        id: "ssmt-programming",
        name: "SSMT Programming",
        ownerTeam: "District Chef",
        standardDays: 5,
        requiredFiles: ["Completed SSMT file"],
      },
      {
        id: "centric-programming",
        name: "IT / Centric Programming",
        ownerTeam: "IT Team",
        standardDays: 10,
      },
    ];
  }

  if (menuType === MENU_TYPES.NEW_UNIT) {
    return [
      {
        id: "multi-station-brief",
        name: "Multi Station Concept Brief",
        ownerTeam: "Project Owner",
        standardDays: 10,
        requiredFiles: ["Completed New Menu Multi Station Concept Brief"],
        templateKey: "multiStationBrief",
      },
      {
        id: "experience-review",
        name: "Experience Review",
        ownerTeam: "Experience Team",
        standardDays: 10,
        requiredApprovals: ["Experience Team approval"],
      },
      {
        id: "ssmt-programming",
        name: "SSMT Programming",
        ownerTeam: "District Chef",
        standardDays: 5,
        requiredFiles: ["Completed SSMT file"],
      },
      {
        id: "centric-programming",
        name: "IT / Centric Programming",
        ownerTeam: "IT Team",
        standardDays: 10,
      },
    ];
  }

  return [
    {
      id: "concept-brief",
      name: "Concept Brief",
      ownerTeam: "Project Owner",
      standardDays: 5,
      requiredFiles: ["Completed New Menu Concept Brief"],
      templateKey: "conceptBrief",
    },
    {
      id: "experience-review",
      name: "Experience Review",
      ownerTeam: "Experience Team",
      standardDays: 10,
      requiredApprovals: ["Experience Team approval"],
    },
    {
      id: "ssmt-programming",
      name: "SSMT Programming",
      ownerTeam: "District Chef",
      standardDays: 5,
      requiredFiles: ["Completed SSMT file"],
    },
    {
      id: "centric-programming",
      name: "IT / Centric Programming",
      ownerTeam: "IT Team",
      standardDays: 10,
    },
  ];
}

export function buildStages(menuType, launchDate, createdDate = todayIso()) {
  const blueprints = stageBlueprints(menuType);
  const standardTotal = blueprints.reduce((sum, stage) => sum + stage.standardDays, 0);
  const availableDays = Math.max(blueprints.length, businessDaysBetween(createdDate, launchDate));
  const compressed = availableDays < standardTotal;
  const scale = compressed ? availableDays / standardTotal : 1;
  let cursor = createdDate;

  const stages = blueprints.map((stage, index) => {
    const calculatedDays = compressed ? Math.max(1, Math.floor(stage.standardDays * scale)) : stage.standardDays;
    const dueDate = addBusinessDays(cursor, calculatedDays);
    const built = {
      ...stage,
      order: index + 1,
      status: index === 0 ? "In Progress" : "Not Started",
      startDate: cursor,
      dueDate,
      completedDate: "",
      assignedTo: [],
      comments: [],
      requiredFiles: stage.requiredFiles || [],
      requiredApprovals: stage.requiredApprovals || [],
      requiredTasks: (stage.requiredTasks || []).map((taskName) => ({
        id: compactId("task"),
        name: taskName,
        status: "Not Started",
        fields: taskName === "Scheduled Tasting"
          ? { tastingDate: "", tastingLocation: "", attendees: "", notes: "" }
          : taskName === "Webtrition Recipe Entry / MRNs"
            ? { recipeName: "", mrn: "", notes: "" }
            : { notes: "" },
      })),
    };
    cursor = dueDate;
    return built;
  });

  return { stages, compressedTimeline: compressed, standardTotal, availableDays };
}

export function getCurrentStage(project) {
  return project.stages.find((stage) => stage.id === project.currentStage) || project.stages[0];
}

export function getStageIndex(project, stageId = project.currentStage) {
  return project.stages.findIndex((stage) => stage.id === stageId);
}

export function hasOpenBlocker(project) {
  return project.blockers.some((blocker) => blocker.status === "Open");
}

export function getProjectStatus(project) {
  if (project.status === "Complete") return "Complete";
  if (hasOpenBlocker(project)) return "Blocked";
  if (project.status === "Needs Revision") return "Needs Revision";
  const stage = getCurrentStage(project);
  const today = todayIso();
  const daysToDue = businessDaysBetween(today, stage?.dueDate || today);
  if (stage?.dueDate && today > stage.dueDate) return "Late";
  if (project.compressedTimeline) return "Compressed Timeline";
  if (daysToDue <= 2) return "At Risk";
  if (stage?.ownerTeam === "Experience Team") return "Waiting on Experience";
  if (stage?.ownerTeam === "Director of Culinary") return "Waiting on Director";
  if (stage?.ownerTeam === "District Chef") return "Waiting on District Chef";
  if (stage?.ownerTeam === "IT Team") return "Waiting on IT";
  return "On Track";
}

export function makeNotification(project, requiredAction, comments = "") {
  const stage = getCurrentStage(project);
  return {
    id: compactId("note"),
    menuName: project.menuName,
    menuType: project.menuType,
    currentStage: stage?.name || project.currentStage,
    requiredAction,
    dueDate: stage?.dueDate || project.launchDate,
    projectLink: `#menu-project-${project.id}`,
    comments,
    createdDate: new Date().toISOString(),
  };
}

export function createProject(input) {
  const createdDate = input.createdDate || todayIso();
  const timeline = buildStages(input.menuType, input.launchDate, createdDate);
  const project = {
    id: compactId("menu-project"),
    menuName: input.menuName || "Untitled Menu Project",
    menuType: input.menuType || MENU_TYPES.PROMOTIONAL,
    launchDate: input.launchDate || addBusinessDays(createdDate, 30),
    createdDate,
    createdBy: input.createdBy || "Project Owner",
    currentStage: timeline.stages[0].id,
    status: timeline.compressedTimeline ? "Compressed Timeline" : "On Track",
    compressedTimeline: timeline.compressedTimeline,
    projectOwner: input.projectOwner || { name: input.createdBy || "Project Owner", email: "" },
    districtChefOwner: input.districtChefOwner || { name: "District Chef", email: "" },
    experienceTeamEmails: input.experienceTeamEmails || ["experience.team@compass-usa.com"],
    directorOfCulinaryEmail: input.directorOfCulinaryEmail || "chandon.clenard@compass-usa.com",
    itTeamEmails: input.itTeamEmails || ["it.support@compass-usa.com"],
    peopleToInform: input.peopleToInform || [],
    stages: timeline.stages,
    files: [],
    approvals: [],
    blockers: [],
    notifications: [],
    deliverablesUnlocked: false,
  };
  return {
    ...project,
    notifications: [makeNotification(project, "New menu project created")],
  };
}

export function requiredFileUploaded(project, requiredFileName) {
  return project.files.some((file) => file.required && file.status === "Uploaded" && file.fileCategory === requiredFileName);
}

export function currentStageCanComplete(project) {
  const stage = getCurrentStage(project);
  if (!stage) return { ok: false, reason: "No active stage found." };
  const missingFiles = stage.requiredFiles.filter((fileName) => !requiredFileUploaded(project, fileName));
  if (missingFiles.length) return { ok: false, reason: `Missing required file: ${missingFiles.join(", ")}` };
  const incompleteTasks = (stage.requiredTasks || []).filter((task) => task.status !== "Complete");
  if (incompleteTasks.length) return { ok: false, reason: `Incomplete task: ${incompleteTasks.map((task) => task.name).join(", ")}` };
  return { ok: true, reason: "" };
}

export function advanceProject(project, actionLabel = "Stage complete") {
  const index = getStageIndex(project);
  const stages = project.stages.map((stage, stageIndex) => {
    if (stageIndex === index) return { ...stage, status: "Complete", completedDate: todayIso() };
    if (stageIndex === index + 1) return { ...stage, status: "In Progress", startDate: todayIso() };
    return stage;
  });
  const nextStage = stages[index + 1];
  const done = !nextStage;
  const updated = {
    ...project,
    stages,
    currentStage: done ? project.currentStage : nextStage.id,
    status: done ? "Complete" : getProjectStatus({ ...project, stages, currentStage: nextStage.id, status: "On Track" }),
    deliverablesUnlocked: project.deliverablesUnlocked || project.currentStage === "director-review",
  };
  return {
    ...updated,
    notifications: [
      makeNotification(updated, done ? "IT marked the project complete" : actionLabel),
      ...project.notifications,
    ],
  };
}

export function sendBackForRevision(project, decision, comments) {
  const index = getStageIndex(project);
  const previousStage = project.stages[Math.max(0, index - 1)] || getCurrentStage(project);
  const stages = project.stages.map((stage) => {
    if (stage.id === project.currentStage) return { ...stage, status: decision === "Rejected" ? "Rejected" : "Changes Requested" };
    if (stage.id === previousStage.id) {
      return {
        ...stage,
        status: "In Progress",
        comments: [...(stage.comments || []), comments].filter(Boolean),
      };
    }
    return stage;
  });
  const updated = {
    ...project,
    stages,
    currentStage: previousStage.id,
    status: "Needs Revision",
  };
  return {
    ...updated,
    notifications: [makeNotification(updated, `Project returned for revision: ${decision}`, comments), ...project.notifications],
  };
}

export function sampleProjects() {
  const promo = createProject({
    menuName: "Summer Street Tacos",
    menuType: MENU_TYPES.PROMOTIONAL,
    launchDate: "2026-08-14",
    createdDate: "2026-07-01",
    createdBy: "Tyler Leiss",
    projectOwner: { name: "Tyler Leiss", email: "tyler.leiss@compass-usa.com" },
    districtChefOwner: { name: "Shane James", email: "shane.james@compass-usa.com" },
    peopleToInform: [{ name: "Lynn Wu", email: "lynn-wu@compass-usa.com" }],
  });

  const micro = advanceProject(createProject({
    menuName: "Korean Noodle Lab",
    menuType: MENU_TYPES.MICROCONCEPT,
    launchDate: "2026-08-28",
    createdDate: "2026-06-29",
    createdBy: "Alex Neuse",
    projectOwner: { name: "Alex Neuse", email: "alex.neuse@compass-usa.com" },
    districtChefOwner: { name: "Jeremy Slagle", email: "jeremy.slagle@compass-usa.com" },
  }), "Ready for Director review");

  const unit = advanceProject(advanceProject(createProject({
    menuName: "Atlas Cafe Opening",
    menuType: MENU_TYPES.NEW_UNIT,
    launchDate: "2026-07-24",
    createdDate: "2026-06-26",
    createdBy: "DJ Bauer",
    projectOwner: { name: "DJ Bauer", email: "dj.bauer@compass-usa.com" },
    districtChefOwner: { name: "Bil Smith", email: "bil.smith@compass-usa.com" },
    peopleToInform: [{ name: "Summer Hinshaw", email: "summer.hinshaw@compass-usa.com" }],
  }), "Ready for Experience review"), "Ready for SSMT programming");

  return [promo, micro, unit].map((project) => ({
    ...project,
    status: getProjectStatus(project),
  }));
}

