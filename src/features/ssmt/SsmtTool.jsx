import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  ClipboardCheck,
  Copy,
  Download,
  DollarSign,
  Flag,
  GripVertical,
  ListChecks,
  Lock,
  Mail,
  Plus,
  Search,
  ShieldCheck,
  Tags,
  Trash2,
  Unlock,
  X,
} from "lucide-react";
import CompassOneLogo from "../../shared/ui/CompassOneLogo.jsx";
import PlatformSettings from "../../shared/ui/PlatformSettings.jsx";
import VersionStamp from "../../shared/ui/VersionStamp.jsx";
import { readLocalStorageJson, writeLocalStorageJson } from "../../shared/safeStorage.js";
import { downloadCentricExport } from "./ssmtCentricExport.js";
import { loadSsmtWorkspaceFromSharedStorage, saveSsmtWorkspaceToSharedStorage } from "./ssmtWorkspaceStorage.js";

const PASSCODE = "0411";
const UNLOCKED_KEY = "culinaryToolsSsmtUnlocked";
const WORKSPACE_STORAGE_KEY = "culinaryToolsSsmtWorkspace_v1";
const DEFAULT_MENU_TYPES = ["Core", "Global", "Thompson Hospitality", "Promotion"];
const ACTIVE_DATE_MENU_TYPES = ["Promotion", "Thompson Hospitality"];
const MENU_TYPE_ORDER = ["Core", "Global", "Promotion", "Thompson Hospitality"];
const MODIFIER_TYPES = ["Force", "Remove", "Addition"];
const MENU_TYPE_STYLES = {
  Core: {
    label: "Core",
    groupClass: "border-emerald-400 bg-emerald-100/80",
    badgeClass: "bg-emerald-700 text-white",
    itemClass: "border-emerald-100 hover:border-emerald-500 hover:bg-emerald-50",
  },
  Global: {
    label: "Global",
    groupClass: "border-sky-400 bg-sky-100/80",
    badgeClass: "bg-sky-700 text-white",
    itemClass: "border-sky-100 hover:border-sky-500 hover:bg-sky-50",
  },
  Promotion: {
    label: "Promotions",
    groupClass: "border-amber-400 bg-amber-100/80",
    badgeClass: "bg-amber-700 text-white",
    itemClass: "border-amber-100 hover:border-amber-500 hover:bg-amber-50",
  },
  "Thompson Hospitality": {
    label: "Thompson Hospitality",
    groupClass: "border-fuchsia-400 bg-fuchsia-100/80",
    badgeClass: "bg-fuchsia-700 text-white",
    itemClass: "border-fuchsia-100 hover:border-fuchsia-500 hover:bg-fuchsia-50",
  },
};
const EMPTY_SSMT_DATA = {
  areaOrder: [],
  workflowPhases: ["Culinary draft", "Experience review", "IT programming", "IT complete"],
  menuTypes: DEFAULT_MENU_TYPES,
  flagReasons: ["Description correction", "Missing / wrong modifier", "Price assignment question", "MRN / POS ID question", "Other"],
  reportRecipients: ["alexander.neuse@compass-usa.com", "tyler.leiss@compass-usa.com"],
  workbookStats: { parsedMenuCount: 0, parsedPricingRows: 0, parsedModifierGroupCount: 0 },
  priceBook: [],
  menus: [],
  modifierGroups: [],
};

function normalizeLabel(value) {
  return String(value || "").toUpperCase();
}

function normalizeDescription(value) {
  return String(value || "").toLowerCase();
}

function cloneMenu(menu) {
  return {
    ...menu,
    items: (menu.items || []).map((item) => ({
      ...item,
      lockedForCentric: Boolean(item.lockedForCentric),
      secondaryCategory: item.secondaryCategory || item.reportingCategorySecondary || "",
      areaPrices: { ...(item.areaPrices || {}) },
      modifierGroups: [...(item.modifierGroups || [])],
    })),
  };
}

function metricValue(value) {
  return Number(value || 0).toLocaleString();
}

function blankAreaPrices(areaOrder = []) {
  return Object.fromEntries(areaOrder.map((area) => [area, ""]));
}

function findPriceRow(priceBook, priceId) {
  return priceBook.find((row) => row.id === priceId) || null;
}

function modifierTypeForGroup(group = {}) {
  const rawType = group.modifierType || group.type;
  if (MODIFIER_TYPES.includes(rawType)) return rawType;
  const name = String(group.name || "").toLowerCase();
  if (name.includes("remove")) return "Remove";
  if (name.includes("force")) return "Force";
  return "Addition";
}

function normalizeModifierChoice(choice = {}, areaOrder = [], priceBook = []) {
  const priceSelectorId = choice.priceSelectorId || "";
  const priceRow = findPriceRow(priceBook, priceSelectorId);
  return {
    ...choice,
    label: choice.label || choice.name || "",
    description: choice.description || "",
    mrn: choice.mrn || "",
    calories: choice.calories || "",
    priceSelectorId,
    price: choice.price || priceRow?.areas?.SEA || choice.priceSelector || "",
    areaPrices: choice.areaPrices || priceRow?.areas || blankAreaPrices(areaOrder),
  };
}

function normalizeModifierGroup(group = {}, areaOrder = [], priceBook = []) {
  return {
    ...group,
    modifierType: modifierTypeForGroup(group),
    choices: (group.choices || []).map((choice) => normalizeModifierChoice(choice, areaOrder, priceBook)),
  };
}

function slugify(value) {
  return String(value || "menu").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "menu";
}

function activeDatesRequired(type) {
  return ACTIVE_DATE_MENU_TYPES.includes(type);
}

function compareMenuNames(a, b) {
  return String(a.name || "").localeCompare(String(b.name || ""), undefined, { sensitivity: "base" });
}

function groupMenusByType(menus = []) {
  const groups = MENU_TYPE_ORDER.map((type) => ({
    type,
    ...MENU_TYPE_STYLES[type],
    menus: menus.filter((menu) => menu.type === type).sort(compareMenuNames),
  }));
  const knownTypes = new Set(MENU_TYPE_ORDER);
  const otherMenus = menus.filter((menu) => !knownTypes.has(menu.type)).sort(compareMenuNames);
  if (otherMenus.length) {
    groups.push({
      type: "Other",
      label: "Other",
      groupClass: "border-slate-300 bg-slate-50",
      badgeClass: "bg-slate-700 text-white",
      itemClass: "hover:border-slate-400 hover:bg-slate-100",
      menus: otherMenus,
    });
  }
  return groups.filter((group) => group.menus.length);
}

function createBlankItem(menuId, areaOrder, index = 1) {
  return {
    id: `${menuId}-item-${Date.now()}-${index}`,
    label: "NEW ITEM",
    name: "NEW ITEM",
    description: "",
    mrn: "",
    category: "",
    fohColumn: "",
    secondaryCategory: "",
    brandMenu: "",
    calories: "",
    priceSelectorId: "",
    seaPrice: "",
    workbookSeaPrice: "",
    priceReviewStatus: "Unpriced",
    areaPrices: blankAreaPrices(areaOrder),
    modifierGroups: [],
    lockedForCentric: false,
  };
}

function createMenuRecord(name, type, areaOrder) {
  const menuId = `menu-${slugify(name)}-${Date.now()}`;
  return {
    id: menuId,
    name,
    sourceSheet: "Created in SSMT",
    includeReason: "Created in SSMT",
    type,
    phase: "Culinary draft",
    status: "Draft",
    activeStart: "",
    activeEnd: "",
    completedAt: "",
    editSignal: false,
    downstreamEligibleAfter: "IT complete",
    items: [createBlankItem(menuId, areaOrder, 1)],
  };
}

function createDivider(menuId) {
  return {
    id: `${menuId}-divider-${Date.now()}`,
    recordType: "divider",
    title: "New divider",
  };
}

function createBlankModifierChoice(groupId, areaOrder, index = 1) {
  return {
    id: `${groupId}-choice-${Date.now()}-${index}`,
    label: "",
    description: "",
    mrn: "",
    calories: "",
    priceSelectorId: "",
    price: "",
    areaPrices: blankAreaPrices(areaOrder),
  };
}

function createBlankModifierGroup(item, areaOrder) {
  const groupId = `modifier-custom-${Date.now()}`;
  return {
    id: groupId,
    name: "New modifier group",
    modifierType: "Addition",
    sourceSheet: "Created in SSMT",
    menuName: item?.menuName || "Created in SSMT",
    minQty: "",
    maxQty: "",
    copyBehavior: "Independent app-side modifier group",
    choices: [createBlankModifierChoice(groupId, areaOrder, 1)],
  };
}

export default function SsmtTool({ onBackToPlatform, onOpenSmartsheetHealth }) {
  const [ssmtData, setSsmtData] = useState(EMPTY_SSMT_DATA);
  const [dataStatus, setDataStatus] = useState("loading");
  const [passcode, setPasscode] = useState("");
  const [passcodeError, setPasscodeError] = useState("");
  const [unlocked, setUnlocked] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.sessionStorage.getItem(UNLOCKED_KEY) === "true";
  });
  const [activeView, setActiveView] = useState("home");
  const [menus, setMenus] = useState([]);
  const [selectedMenuId, setSelectedMenuId] = useState("");
  const [selectedPriceId, setSelectedPriceId] = useState("");
  const [search, setSearch] = useState("");
  const [newMenuName, setNewMenuName] = useState("");
  const [newMenuType, setNewMenuType] = useState("Core");
  const [newPriceCategory, setNewPriceCategory] = useState("");
  const [newPriceSea, setNewPriceSea] = useState("");
  const [modifierDialog, setModifierDialog] = useState(null);
  const [flagDialog, setFlagDialog] = useState(null);
  const [deleteRequest, setDeleteRequest] = useState(null);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [flagReason, setFlagReason] = useState("Description correction");
  const [flagNote, setFlagNote] = useState("");
  const [reportedFlag, setReportedFlag] = useState(null);
  const [copiedModifierNotice, setCopiedModifierNotice] = useState("");
  const [copiedFieldNotice, setCopiedFieldNotice] = useState("");
  const [phaseBlocker, setPhaseBlocker] = useState("");
  const [draggedRowId, setDraggedRowId] = useState("");
  const [workspaceSync, setWorkspaceSync] = useState({
    state: "loading",
    source: "local",
    message: "Loading SSMT workspace...",
  });
  const workspaceLoadedRef = useRef(false);
  const skipInitialSharedSaveRef = useRef(true);

  useEffect(() => {
    let cancelled = false;
    async function loadSeedData() {
      try {
        const response = await fetch("/data/ssmtSeedData.json");
        const payload = await response.json();
        if (!response.ok) throw new Error("SSMT seed data could not be loaded.");
        if (cancelled) return;
        const stored = readLocalStorageJson(WORKSPACE_STORAGE_KEY, null);
        let sharedWorkspace = null;
        try {
          const shared = await loadSsmtWorkspaceFromSharedStorage();
          if (cancelled) return;
          sharedWorkspace = shared.workspace;
          setWorkspaceSync(sharedWorkspace ? {
            state: "synced",
            source: shared.source || "supabase",
            message: "Loaded shared SSMT workspace.",
          } : {
            state: "local",
            source: shared.source || "supabase",
            message: "No shared SSMT workspace yet. Saving will create it.",
          });
        } catch (error) {
          if (cancelled) return;
          setWorkspaceSync({
            state: "fallback",
            source: "local",
            message: `${error.message || "Shared SSMT workspace unavailable."} Using this browser's saved SSMT cache.`,
          });
        }
        const workspace = sharedWorkspace || stored || {};
        const storedMenus = Array.isArray(workspace.menus) && workspace.menus.length ? workspace.menus : payload.menus;
        const storedPriceBook = Array.isArray(workspace.priceBook) && workspace.priceBook.length ? workspace.priceBook : payload.priceBook;
        const storedModifierGroups = Array.isArray(workspace.modifierGroups) && workspace.modifierGroups.length ? workspace.modifierGroups : payload.modifierGroups;
        const priceBook = storedPriceBook;
        const modifierGroups = storedModifierGroups.map((group) => normalizeModifierGroup(group, payload.areaOrder, priceBook));
        setSsmtData({
          ...payload,
          menuTypes: payload.menuTypes?.length ? payload.menuTypes : DEFAULT_MENU_TYPES,
          priceBook,
          modifierGroups,
        });
        setMenus((current) => current.length ? current : storedMenus.map(cloneMenu));
        setSelectedMenuId((current) => current || (storedMenus.some((menu) => menu.id === workspace.selectedMenuId) ? workspace.selectedMenuId : storedMenus[0]?.id || ""));
        setSelectedPriceId((current) => current || payload.priceBook[0]?.id || "");
        setNewMenuType(payload.menuTypes?.[0] || "Core");
        workspaceLoadedRef.current = true;
        setDataStatus("ready");
      } catch {
        if (!cancelled) setDataStatus("error");
      }
    }
    loadSeedData();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (dataStatus !== "ready" || !menus.length) return;
    const workspace = {
      menus,
      priceBook: ssmtData.priceBook,
      modifierGroups: ssmtData.modifierGroups,
      selectedMenuId,
      updatedAt: new Date().toISOString(),
    };
    writeLocalStorageJson(WORKSPACE_STORAGE_KEY, workspace, { clearOnQuota: true });
    if (!workspaceLoadedRef.current) return;
    if (skipInitialSharedSaveRef.current) {
      skipInitialSharedSaveRef.current = false;
      return;
    }
    setWorkspaceSync((current) => ({
      ...current,
      state: "saving",
      message: "Saving shared SSMT workspace...",
    }));
    const saveTimer = window.setTimeout(async () => {
      try {
        const result = await saveSsmtWorkspaceToSharedStorage(workspace);
        setWorkspaceSync({
          state: "synced",
          source: result.source || "supabase",
          message: "Shared SSMT workspace saved.",
        });
      } catch (error) {
        setWorkspaceSync({
          state: "fallback",
          source: "local",
          message: `${error.message || "Shared SSMT workspace save failed."} This browser kept a local cache.`,
        });
      }
    }, 500);
    return () => window.clearTimeout(saveTimer);
  }, [dataStatus, menus, selectedMenuId, ssmtData.priceBook, ssmtData.modifierGroups]);

  useEffect(() => {
    if (!modifierDialog) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setModifierDialog(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [modifierDialog]);

  const selectedMenu = menus.find((menu) => menu.id === selectedMenuId) || menus[0] || { id: "loading", name: "Loading SSMT", type: "Core", phase: "Culinary draft", items: [] };
  const selectedPrice = ssmtData.priceBook.find((row) => row.id === selectedPriceId) || ssmtData.priceBook[0];
  const visibleMenus = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return menus;
    return menus.filter((menu) => `${menu.name} ${menu.type}`.toLowerCase().includes(query));
  }, [menus, search]);
  const menuGroups = useMemo(() => groupMenusByType(visibleMenus), [visibleMenus]);

  const downstreamReadyCount = menus.filter((menu) => ["Core", "Global"].includes(menu.type) && menu.phase === "IT complete").length;
  const promotionCount = menus.filter((menu) => menu.type === "Promotion").length;
  const historicalCount = menus.filter((menu) => ["Thompson Hospitality", "Promotion"].includes(menu.type)).length;
  const menuTypes = ssmtData.menuTypes?.length ? ssmtData.menuTypes : DEFAULT_MENU_TYPES;
  const showActiveDates = activeDatesRequired(selectedMenu.type);
  const selectedItemRows = (selectedMenu.items || []).filter((item) => item.recordType !== "divider");
  const lockedItemCount = selectedItemRows.filter((item) => item.lockedForCentric).length;
  const allItemRowsLocked = selectedItemRows.length === 0 || lockedItemCount === selectedItemRows.length;
  const currentPhaseIndex = ssmtData.workflowPhases.indexOf(selectedMenu.phase);
  const phaseIsBlocked = (phase) => {
    const nextIndex = ssmtData.workflowPhases.indexOf(phase);
    return nextIndex > currentPhaseIndex && !allItemRowsLocked;
  };

  const submitPasscode = (event) => {
    event.preventDefault();
    if (passcode !== PASSCODE) {
      setPasscodeError("Passcode does not match SSMT access.");
      return;
    }
    if (typeof window !== "undefined") window.sessionStorage.setItem(UNLOCKED_KEY, "true");
    setUnlocked(true);
    setPasscodeError("");
    setActiveView("home");
  };

  const updateItem = (itemId, patch) => {
    setMenus((current) => current.map((menu) => {
      if (menu.id !== selectedMenu.id) return menu;
      return {
        ...menu,
        items: menu.items.map((item) => (item.id === itemId ? { ...item, ...patch } : item)),
      };
    }));
  };

  const updateDivider = (dividerId, title) => {
    setMenus((current) => current.map((menu) => {
      if (menu.id !== selectedMenu.id) return menu;
      return {
        ...menu,
        items: menu.items.map((item) => (item.id === dividerId ? { ...item, title } : item)),
      };
    }));
  };

  const assignItemPrice = (itemId, priceId) => {
    const priceRow = ssmtData.priceBook.find((row) => row.id === priceId);
    updateItem(itemId, {
      priceSelectorId: priceRow?.id || "",
      seaPrice: priceRow?.areas?.SEA || "",
      areaPrices: priceRow?.areas || blankAreaPrices(ssmtData.areaOrder),
      priceReviewStatus: priceRow ? "Pricing structure match" : "Unpriced",
    });
  };

  const updateSelectedMenu = (patch) => {
    setMenus((current) => current.map((menu) => (menu.id === selectedMenu.id ? { ...menu, ...patch } : menu)));
  };

  const updateSelectedMenuPhase = (phase) => {
    if (phaseIsBlocked(phase)) {
      setPhaseBlocker(`Lock all item rows before moving to ${phase}.`);
      return;
    }
    const timestamp = new Date().toISOString();
    setPhaseBlocker("");
    updateSelectedMenu({
      phase,
      status: phase === "IT complete" ? "IT complete / Centric ready" : phase,
      completedAt: phase === "IT complete" ? (selectedMenu.completedAt || timestamp) : selectedMenu.completedAt,
      phaseTimestamps: {
        ...(selectedMenu.phaseTimestamps || {}),
        [phase]: timestamp,
      },
    });
  };

  const copyForCentric = async (value, label) => {
    const text = String(value || "").trim();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedFieldNotice(`${label} copied for Centric.`);
    } catch {
      setCopiedFieldNotice(`${label} ready for Centric copy: ${text}`);
    }
  };

  const copyLockedField = (item, value, label) => {
    if (!item.lockedForCentric) return;
    copyForCentric(value, label);
  };

  const exportSelectedMenuForCentric = () => {
    downloadCentricExport({
      selectedMenu,
      areaOrder: ssmtData.areaOrder,
      modifierGroups: ssmtData.modifierGroups,
    });
    setCopiedFieldNotice(`${selectedMenu.name} SSMT Export downloaded.`);
  };

  const addPricingRow = () => {
    const category = newPriceCategory.trim();
    const seaPrice = newPriceSea.trim();
    if (!category || !seaPrice) return;
    const id = `price-custom-${slugify(category)}-${Date.now()}`;
    const areas = Object.fromEntries(ssmtData.areaOrder.map((area) => [area, area === "SEA" ? seaPrice : ""]));
    const row = {
      id,
      category,
      example: "Created in SSMT",
      selectorLabel: `${seaPrice} - ${category}`,
      areas,
    };
    setSsmtData((current) => ({ ...current, priceBook: [...current.priceBook, row] }));
    setSelectedPriceId(id);
    setNewPriceCategory("");
    setNewPriceSea("");
  };

  const openMenu = (menuId) => {
    setSelectedMenuId(menuId);
    setActiveView("editor");
  };

  const createNewMenu = () => {
    const name = newMenuName.trim();
    if (!name) return;
    const menu = createMenuRecord(name, newMenuType, ssmtData.areaOrder);
    setMenus((current) => [...current, menu]);
    setSelectedMenuId(menu.id);
    setNewMenuName("");
    setNewMenuType(menuTypes[0] || "Core");
    setActiveView("editor");
  };

  const addDivider = () => {
    setMenus((current) => current.map((menu) => {
      if (menu.id !== selectedMenu.id) return menu;
      return { ...menu, items: [...menu.items, createDivider(menu.id)] };
    }));
  };

  const addItem = () => {
    setMenus((current) => current.map((menu) => {
      if (menu.id !== selectedMenu.id) return menu;
      return { ...menu, items: [...menu.items, createBlankItem(menu.id, ssmtData.areaOrder, menu.items.length + 1)] };
    }));
  };

  const deleteItem = (itemId) => {
    setMenus((current) => current.map((menu) => {
      if (menu.id !== selectedMenu.id) return menu;
      return { ...menu, items: menu.items.filter((item) => item.id !== itemId) };
    }));
  };

  const requestDelete = (request) => {
    setDeleteRequest(request);
    setDeleteConfirmed(false);
  };

  const moveRow = (sourceId, targetId) => {
    if (!sourceId || !targetId || sourceId === targetId) return;
    setMenus((current) => current.map((menu) => {
      if (menu.id !== selectedMenu.id) return menu;
      const sourceIndex = menu.items.findIndex((item) => item.id === sourceId);
      const targetIndex = menu.items.findIndex((item) => item.id === targetId);
      if (sourceIndex < 0 || targetIndex < 0) return menu;
      const nextItems = [...menu.items];
      const [moved] = nextItems.splice(sourceIndex, 1);
      nextItems.splice(targetIndex, 0, moved);
      return { ...menu, items: nextItems };
    }));
    setDraggedRowId("");
  };

  const deleteSelectedMenu = (menuId) => {
    setMenus((current) => {
      const remaining = current.filter((menu) => menu.id !== menuId);
      setSelectedMenuId(remaining[0]?.id || "");
      return remaining;
    });
    setDeleteRequest(null);
    setDeleteConfirmed(false);
    setActiveView("menus");
  };

  const openModifierDialog = (item) => {
    setCopiedModifierNotice("");
    const matchedGroups = ssmtData.modifierGroups
      .filter((group) => (item.modifierGroups || []).some((name) => group.name.toLowerCase().includes(String(name).toLowerCase()) || String(name).toLowerCase().includes(group.name.toLowerCase())))
      .slice(0, 4);
    setModifierDialog({
      item,
      groups: (matchedGroups.length ? matchedGroups : ssmtData.modifierGroups.slice(0, 3)).map((group) => normalizeModifierGroup(group, ssmtData.areaOrder, ssmtData.priceBook)),
    });
  };

  const copyModifierGroup = (group) => {
    const copyNumber = ssmtData.modifierGroups.filter((candidate) => candidate.name.startsWith(`${group.name} copy`)).length + 1;
    const copyName = `${group.name} copy ${copyNumber}`;
    const copiedGroup = {
      ...group,
      id: `${group.id}-copy-${Date.now()}`,
      name: copyName,
      sourceSheet: `${group.sourceSheet} / copied in SSMT`,
      copyBehavior: "Independent copy",
      choices: group.choices.map((choice, index) => ({
        ...choice,
        id: `${group.id}-copy-${Date.now()}-choice-${index + 1}`,
      })),
    };
    const normalizedGroup = normalizeModifierGroup(copiedGroup, ssmtData.areaOrder, ssmtData.priceBook);
    setSsmtData((current) => ({ ...current, modifierGroups: [...current.modifierGroups, normalizedGroup] }));
    updateItem(modifierDialog.item.id, { modifierGroups: [...(modifierDialog.item.modifierGroups || []), copiedGroup.name] });
    setModifierDialog((current) => current ? {
      ...current,
      item: { ...current.item, modifierGroups: [...(current.item.modifierGroups || []), copiedGroup.name] },
      groups: [...current.groups, normalizedGroup],
    } : current);
    setCopiedModifierNotice(`${copyName} added as an independent modifier group.`);
  };

  const updateModifierGroup = (groupId, patch) => {
    const existingGroup = ssmtData.modifierGroups.find((group) => group.id === groupId)
      || modifierDialog?.groups.find((group) => group.id === groupId)
      || {};
    const previousName = existingGroup.name || "";
    const nextName = Object.prototype.hasOwnProperty.call(patch, "name") ? patch.name : previousName;
    setSsmtData((current) => {
      const modifierGroups = current.modifierGroups.map((group) => {
        if (group.id !== groupId) return group;
        return normalizeModifierGroup({ ...group, ...patch }, current.areaOrder, current.priceBook);
      });
      return { ...current, modifierGroups };
    });
    setModifierDialog((current) => current ? {
      ...current,
      item: {
        ...current.item,
        modifierGroups: (current.item.modifierGroups || []).map((name) => (name === previousName ? nextName : name)),
      },
      groups: current.groups.map((group) => (
        group.id === groupId
          ? normalizeModifierGroup({ ...group, ...patch }, ssmtData.areaOrder, ssmtData.priceBook)
          : group
      )),
    } : current);
    if (Object.prototype.hasOwnProperty.call(patch, "name")) {
      setMenus((current) => current.map((menu) => ({
        ...menu,
        items: menu.items.map((item) => ({
          ...item,
          modifierGroups: (item.modifierGroups || []).map((name) => (name === previousName ? nextName : name)),
        })),
      })));
    }
  };

  const addModifierGroup = () => {
    const group = createBlankModifierGroup(modifierDialog?.item, ssmtData.areaOrder);
    setSsmtData((current) => ({ ...current, modifierGroups: [...current.modifierGroups, group] }));
    if (modifierDialog?.item?.id) {
      updateItem(modifierDialog.item.id, { modifierGroups: [...(modifierDialog.item.modifierGroups || []), group.name] });
    }
    setModifierDialog((current) => current ? {
      ...current,
      item: { ...current.item, modifierGroups: [...(current.item.modifierGroups || []), group.name] },
      groups: [...current.groups, group],
    } : current);
  };

  const addModifierChoice = (groupId) => {
    const addChoice = (group) => ({
      ...group,
      choices: [...(group.choices || []), createBlankModifierChoice(group.id, ssmtData.areaOrder, (group.choices || []).length + 1)],
    });
    setSsmtData((current) => ({
      ...current,
      modifierGroups: current.modifierGroups.map((group) => (group.id === groupId ? addChoice(group) : group)),
    }));
    setModifierDialog((current) => current ? {
      ...current,
      groups: current.groups.map((group) => (group.id === groupId ? addChoice(group) : group)),
    } : current);
  };

  const updateModifierChoice = (groupId, choiceId, patch) => {
    const normalizePatch = (choice, priceBook = ssmtData.priceBook) => {
      const nextChoice = { ...choice, ...patch };
      const priceRow = findPriceRow(priceBook, nextChoice.priceSelectorId);
      if (Object.prototype.hasOwnProperty.call(patch, "priceSelectorId")) {
        nextChoice.price = priceRow?.areas?.SEA || "";
        nextChoice.areaPrices = priceRow?.areas || blankAreaPrices(ssmtData.areaOrder);
      }
      return normalizeModifierChoice(nextChoice, ssmtData.areaOrder, priceBook);
    };
    setSsmtData((current) => ({
      ...current,
      modifierGroups: current.modifierGroups.map((group) => (
        group.id === groupId
          ? { ...group, choices: group.choices.map((choice) => (choice.id === choiceId ? normalizePatch(choice, current.priceBook) : choice)) }
          : group
      )),
    }));
    setModifierDialog((current) => current ? {
      ...current,
      groups: current.groups.map((group) => (
        group.id === groupId
          ? { ...group, choices: group.choices.map((choice) => (choice.id === choiceId ? normalizePatch(choice) : choice)) }
          : group
      )),
    } : current);
  };

  const deleteModifierGroup = (groupId) => {
    const groupName = ssmtData.modifierGroups.find((group) => group.id === groupId)?.name
      || modifierDialog?.groups.find((group) => group.id === groupId)?.name
      || "";
    setSsmtData((current) => ({
      ...current,
      modifierGroups: current.modifierGroups.filter((group) => group.id !== groupId),
    }));
    setMenus((current) => current.map((menu) => ({
      ...menu,
      items: menu.items.map((item) => ({
        ...item,
        modifierGroups: (item.modifierGroups || []).filter((name) => name !== groupName),
      })),
    })));
    setModifierDialog((current) => current ? {
      ...current,
      item: { ...current.item, modifierGroups: (current.item.modifierGroups || []).filter((name) => name !== groupName) },
      groups: current.groups.filter((group) => group.id !== groupId),
    } : current);
    setDeleteRequest(null);
    setDeleteConfirmed(false);
  };

  const deleteModifierChoice = (groupId, choiceId) => {
    setSsmtData((current) => ({
      ...current,
      modifierGroups: current.modifierGroups.map((group) => (
        group.id === groupId ? { ...group, choices: group.choices.filter((choice) => choice.id !== choiceId) } : group
      )),
    }));
    setModifierDialog((current) => current ? {
      ...current,
      groups: current.groups.map((group) => (
        group.id === groupId ? { ...group, choices: group.choices.filter((choice) => choice.id !== choiceId) } : group
      )),
    } : current);
    setDeleteRequest(null);
    setDeleteConfirmed(false);
  };

  const confirmDelete = () => {
    if (!deleteConfirmed || !deleteRequest) return;
    if (deleteRequest.type === "menu") {
      deleteSelectedMenu(deleteRequest.id);
    } else if (deleteRequest.type === "item") {
      deleteItem(deleteRequest.id);
      setDeleteRequest(null);
      setDeleteConfirmed(false);
    } else if (deleteRequest.type === "modifier-group") {
      deleteModifierGroup(deleteRequest.id);
    } else if (deleteRequest.type === "modifier-item") {
      deleteModifierChoice(deleteRequest.groupId, deleteRequest.id);
    }
  };

  const reportFlag = () => {
    const item = flagDialog?.item;
    const subject = encodeURIComponent(`SSMT flag: ${selectedMenu.name}`);
    const body = encodeURIComponent([
      `Menu: ${selectedMenu.name}`,
      `Menu type: ${selectedMenu.type}`,
      `Phase: ${selectedMenu.phase}`,
      `Item/modifier: ${item?.label || item?.name || "Selected row"}`,
      `Reason: ${flagReason}`,
      `Note: ${flagNote || "No note entered."}`,
      "",
      "This flag is saved in SSMT; email is the notification copy.",
    ].join("\n"));
    const mailto = `mailto:${ssmtData.reportRecipients.join(",")}?subject=${subject}&body=${body}`;
    setReportedFlag({ reason: flagReason, note: flagNote, mailto, itemName: item?.label || item?.name || "Selected row" });
    setFlagDialog(null);
    setFlagNote("");
    setFlagReason("Description correction");
  };

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-[#f5f6f1] px-4 py-5 text-slate-950 md:px-8">
        <div className="mx-auto max-w-5xl space-y-5">
          <header className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <button onClick={onBackToPlatform} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100">
                  <ArrowLeft size={16} /> Back to Platform
                </button>
                <p className="mt-5 text-xs font-black uppercase tracking-[0.22em] text-emerald-600">Passcode Required</p>
                <h1 className="mt-2 text-4xl font-black">SSMT</h1>
                <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-600">
                  Culinary to IT programming opens after the shared SSMT passcode. This is a convenience gate, not personal identity tracking.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <CompassOneLogo />
                <VersionStamp />
              </div>
            </div>
          </header>

          <form onSubmit={submitPasscode} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <label htmlFor="ssmt-passcode" className="text-sm font-black text-slate-900">SSMT passcode</label>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <input
                id="ssmt-passcode"
                type="password"
                inputMode="numeric"
                value={passcode}
                onChange={(event) => setPasscode(event.target.value)}
                className="min-h-12 flex-1 rounded-lg border border-slate-300 bg-white px-4 text-lg font-black tracking-normal outline-none focus:border-emerald-500"
                autoComplete="off"
              />
              <button type="submit" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 text-sm font-black text-white hover:bg-slate-800">
                <ShieldCheck size={18} /> Unlock SSMT
              </button>
            </div>
            {passcodeError && <p className="mt-3 text-sm font-bold text-red-700">{passcodeError}</p>}
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f6f1] px-3 py-4 text-slate-950 md:px-4">
      <div className="mx-auto w-full max-w-[2680px] space-y-3">
        <header className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <button onClick={onBackToPlatform} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-bold text-slate-700 hover:bg-slate-100">
                <ArrowLeft size={16} /> Back to Platform
              </button>
              <p className="mt-3 text-xs font-black uppercase tracking-[0.22em] text-emerald-600">Culinary to IT programming</p>
              <h1 className="mt-1 text-3xl font-black">SSMT</h1>
              <p className="mt-2 max-w-4xl text-sm font-semibold leading-5 text-slate-600">
                Split pricing maintenance from menu programming so the menu editor has more working room for large Centric records.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <PlatformSettings onOpenSmartsheetHealth={onOpenSmartsheetHealth} />
              <CompassOneLogo />
              <VersionStamp />
            </div>
          </div>
        </header>

        <section className="flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm">
          <button type="button" onClick={() => setActiveView("home")} className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-black ${activeView === "home" ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-800 hover:bg-slate-100"}`}>
            <ListChecks size={16} /> SSMT Start
          </button>
          <button type="button" onClick={() => setActiveView("pricing")} className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-black ${activeView === "pricing" ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-800 hover:bg-slate-100"}`}>
            <DollarSign size={16} /> Pricing Structure
          </button>
          <button type="button" onClick={() => setActiveView("menus")} className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-black ${activeView === "menus" ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-800 hover:bg-slate-100"}`}>
            <ClipboardCheck size={16} /> Menu Selector / New Menu
          </button>
        </section>

        {dataStatus !== "ready" && (
          <section className={`rounded-lg border p-4 text-sm font-bold leading-6 ${dataStatus === "error" ? "border-red-200 bg-red-50 text-red-800" : "border-sky-200 bg-sky-50 text-sky-900"}`}>
            {dataStatus === "error" ? "SSMT seed data could not be loaded." : "Loading current SSMT seed data..."}
          </section>
        )}

        {dataStatus === "ready" && (
          <section
            data-testid="ssmt-workspace-sync"
            className={`rounded-lg border px-3 py-2 text-xs font-black ${
              workspaceSync.state === "synced"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : workspaceSync.state === "saving"
                  ? "border-sky-200 bg-sky-50 text-sky-900"
                  : "border-amber-200 bg-amber-50 text-amber-900"
            }`}
          >
            Shared workspace: {workspaceSync.message}
          </section>
        )}

        {reportedFlag && (
          <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold leading-6 text-emerald-950">
            Flag saved for {reportedFlag.itemName}. Report email draft is ready for {ssmtData.reportRecipients.join(" and ")}.
            <a href={reportedFlag.mailto} className="ml-2 inline-flex items-center gap-1 underline">
              <Mail size={16} /> Open email
            </a>
          </section>
        )}

        {copiedFieldNotice && (
          <section className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-950">
            {copiedFieldNotice}
          </section>
        )}

        {activeView === "home" && (
          <main className="space-y-5">
            <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <Metric icon={ClipboardCheck} label="Parsed menus" value={metricValue(ssmtData.workbookStats.parsedMenuCount)} />
              <Metric icon={Tags} label="Pricing rows" value={metricValue(ssmtData.priceBook.length || ssmtData.workbookStats.parsedPricingRows)} />
              <Metric icon={Copy} label="Modifier groups" value={metricValue(ssmtData.workbookStats.parsedModifierGroupCount)} />
              <Metric icon={ShieldCheck} label="IT complete eligible" value={metricValue(downstreamReadyCount)} />
              <Metric icon={CalendarDays} label="Calendar" value={`${metricValue(promotionCount)} promo`} />
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <button type="button" onClick={() => setActiveView("pricing")} className="rounded-lg border border-emerald-200 bg-white p-6 text-left shadow-sm hover:border-emerald-400 hover:bg-emerald-50">
                <DollarSign size={26} className="text-emerald-700" />
                <h2 className="mt-4 text-2xl font-black">Pricing Structure</h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">View the pricing book, keep SEA price + category as the selector, and add controlled pricing rows when the table needs one.</p>
              </button>
              <button type="button" onClick={() => setActiveView("menus")} className="rounded-lg border border-sky-200 bg-white p-6 text-left shadow-sm hover:border-sky-400 hover:bg-sky-50">
                <ClipboardCheck size={26} className="text-sky-700" />
                <h2 className="mt-4 text-2xl font-black">Menu Selector / New Menu</h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">Open an existing menu or create a new record by selecting the menu type first.</p>
              </button>
            </section>

            <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-950">
              SSMT workbook input creates app records and review flags only. Webtrition Report Menu Index remains deletion authority; SSMT-only and Webtrition-only differences do not delete operational records without Webtrition confirmation.
            </section>
          </main>
        )}

        {activeView === "pricing" && (
          <main className="space-y-5">
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">SEA price + category</p>
                  <h2 className="mt-1 text-2xl font-black">Pricing Structure</h2>
                  <p className="mt-2 text-sm font-semibold text-slate-600">{ssmtData.areaOrder.join(", ")}</p>
                </div>
                <div className="grid gap-2 sm:grid-cols-[minmax(180px,1fr)_150px_auto]">
                  <label className="grid gap-1 text-sm font-bold text-slate-700">
                    <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">New pricing category</span>
                    <input aria-label="New pricing category" value={newPriceCategory} onChange={(event) => setNewPriceCategory(event.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-bold outline-none focus:border-emerald-500" />
                  </label>
                  <label className="grid gap-1 text-sm font-bold text-slate-700">
                    <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">New SEA price</span>
                    <input aria-label="New SEA price" value={newPriceSea} onChange={(event) => setNewPriceSea(event.target.value)} placeholder="$0.00" className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-bold outline-none focus:border-emerald-500" />
                  </label>
                  <button type="button" onClick={addPricingRow} className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-sm font-black text-white hover:bg-slate-800">
                    <Plus size={16} /> Add pricing row
                  </button>
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-[1320px] w-full border-collapse text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                    <tr>
                      <th className="border-b border-slate-200 px-4 py-3">SEA price + category</th>
                      {ssmtData.areaOrder.map((area) => <th key={area} className="border-b border-slate-200 px-4 py-3">{area}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {ssmtData.priceBook.map((price) => (
                      <tr key={price.id} className="odd:bg-white even:bg-slate-50/70">
                        <td className="border-b border-slate-100 px-4 py-3 font-black text-slate-950">{price.selectorLabel}</td>
                        {ssmtData.areaOrder.map((area) => (
                          <td key={area} className="border-b border-slate-100 px-4 py-3 font-bold text-slate-700">{price.areas?.[area] || "TBD"}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </main>
        )}

        {activeView === "menus" && (
          <main className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Existing records</p>
                  <h2 className="mt-1 text-2xl font-black">Menu Selector</h2>
                </div>
                <label className="relative block w-full md:max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search menus..." className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-10 pr-3 text-sm font-bold outline-none focus:border-emerald-500" />
                </label>
              </div>
              <div data-testid="ssmt-menu-selector-grid" className="mt-4 grid gap-2 lg:grid-cols-4">
                {menuGroups.map((group) => (
                  <section
                    key={group.type}
                    data-testid={`ssmt-menu-group-${group.type}`}
                    data-menu-type={group.type}
                    className={`flex max-h-[52vh] min-h-0 flex-col rounded-lg border p-3 ${group.groupClass}`}
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <h3 className="text-sm font-black text-slate-950">{group.label}</h3>
                      <span className={`rounded px-2 py-1 text-[11px] font-black ${group.badgeClass}`}>{group.menus.length}</span>
                    </div>
                    <div className="grid min-h-0 gap-1 overflow-y-auto pr-1">
                      {group.menus.map((menu) => (
                        <button
                          key={menu.id}
                          type="button"
                          data-menu-name={menu.name}
                          onClick={() => openMenu(menu.id)}
                          className={`rounded-lg border bg-white px-3 py-2 text-left shadow-sm ${group.itemClass}`}
                        >
                          <span className="block whitespace-normal break-words text-sm font-black leading-4 text-slate-950">{menu.name}</span>
                          <span className="mt-1 flex flex-wrap gap-1 text-[11px] font-bold text-slate-600">
                            <span>{menu.type}</span>
                            <span>{menu.phase}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-600">Create record</p>
              <h2 className="mt-1 text-2xl font-black">New Menu</h2>
              <div className="mt-4 space-y-3">
                <label className="grid gap-1 text-sm font-bold text-slate-700">
                  <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">New menu name</span>
                  <input aria-label="New menu name" value={newMenuName} onChange={(event) => setNewMenuName(event.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-bold outline-none focus:border-emerald-500" />
                </label>
                <label className="grid gap-1 text-sm font-bold text-slate-700">
                  <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">New menu type</span>
                  <select aria-label="New menu type" value={newMenuType} onChange={(event) => setNewMenuType(event.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-bold">
                    {menuTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                  </select>
                </label>
                <button type="button" onClick={createNewMenu} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-3 text-sm font-black text-white hover:bg-slate-800">
                  <Plus size={18} /> Create menu
                </button>
              </div>
            </section>
          </main>
        )}

        {activeView === "editor" && (
          <main className="space-y-3">
            <section className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm">
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setActiveView("menus")} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-black text-slate-800 hover:bg-slate-100">
                  <ArrowLeft size={16} /> Back to menu selection
                </button>
                <button type="button" onClick={() => setActiveView("pricing")} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-black text-slate-800 hover:bg-slate-100">
                  <DollarSign size={16} /> Pricing table
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={exportSelectedMenuForCentric} className="inline-flex items-center gap-2 rounded-lg border border-emerald-700 bg-emerald-700 px-3 py-1.5 text-sm font-black text-white hover:bg-emerald-800">
                  <Download size={16} /> Export SSMT
                </button>
                <button type="button" onClick={() => requestDelete({ type: "menu", id: selectedMenu.id, name: selectedMenu.name })} className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-black text-red-800 hover:bg-red-100">
                  <Trash2 size={16} /> Delete menu
                </button>
              </div>
            </section>

            <section data-testid="ssmt-phase-panel" className="grid gap-3 rounded-lg border border-slate-400 bg-slate-950 p-3 text-white shadow-sm lg:grid-cols-[minmax(260px,1fr)_minmax(220px,0.7fr)_minmax(260px,1fr)] lg:items-end">
              <label className="grid gap-1 text-sm font-bold">
                <span className="text-xs font-black uppercase tracking-[0.16em] text-emerald-200">Current SSMT phase</span>
                <select value={selectedMenu.phase} onChange={(event) => updateSelectedMenuPhase(event.target.value)} className="rounded-lg border border-emerald-300 bg-white px-3 py-2 text-base font-black text-slate-950">
                  {ssmtData.workflowPhases.map((phase) => (
                    <option key={phase} disabled={phaseIsBlocked(phase)}>{phase}</option>
                  ))}
                </select>
              </label>
              <div className="rounded-lg border border-white/20 bg-white/10 px-3 py-2">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-200">Item readiness</p>
                <p className="mt-1 text-xl font-black">{lockedItemCount} of {selectedItemRows.length} item rows locked</p>
              </div>
              <div className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-bold leading-5">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-200">Status</p>
                <p className="mt-1">{selectedMenu.status || selectedMenu.phase}</p>
                {!allItemRowsLocked && <p className="mt-1 text-amber-200">Lock all item rows before moving to the next phase.</p>}
                {phaseBlocker && <p className="mt-1 text-amber-200">{phaseBlocker}</p>}
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Menu Record</p>
                  <h2 className="mt-1 text-2xl font-black">{selectedMenu.name}</h2>
                  <p className="mt-1 text-sm font-semibold text-slate-600">{selectedMenu.type} / {selectedMenu.phase} / availability after IT complete</p>
                </div>
                <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700">Type: {selectedMenu.type}</span>
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-4">
                {showActiveDates ? (
                  <>
                    <label className="grid gap-1 text-sm font-bold text-slate-700">
                      <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Active start</span>
                      <input type="date" aria-label="Active start" value={selectedMenu.activeStart || ""} onChange={(event) => updateSelectedMenu({ activeStart: event.target.value })} className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-bold" />
                    </label>
                    <label className="grid gap-1 text-sm font-bold text-slate-700">
                      <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Active end</span>
                      <input type="date" aria-label="Active end" value={selectedMenu.activeEnd || ""} onChange={(event) => updateSelectedMenu({ activeEnd: event.target.value })} className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-bold" />
                    </label>
                  </>
                ) : (
                  <div className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-bold leading-6 text-sky-900 md:col-span-2">
                    Active dates are only required for Promotion and Thompson Hospitality menus.
                  </div>
                )}
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Completed</p>
                  <p className="mt-1">{selectedMenu.completedAt ? new Date(selectedMenu.completedAt).toLocaleString() : "Pending IT complete"}</p>
                </div>
                <label className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-black text-amber-950">
                  <input type="checkbox" checked={Boolean(selectedMenu.editSignal)} onChange={(event) => updateSelectedMenu({ editSignal: event.target.checked, status: event.target.checked ? "Edit / resubmission needed" : selectedMenu.phase })} />
                  Edit signal
                </label>
              </div>
            </section>

            <section className="overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm">
              <div className="flex flex-col gap-2 border-b border-slate-300 p-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Menu Items</p>
                  <h2 className="mt-1 text-xl font-black">Builder rows</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={addItem} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-black text-slate-800 hover:bg-slate-100">
                    <Plus size={16} /> Add item
                  </button>
                  <button type="button" onClick={addDivider} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-black text-slate-800 hover:bg-slate-100">
                    <Plus size={16} /> Add divider
                  </button>
                </div>
              </div>
              <div data-testid="ssmt-builder-scroll" className="max-h-[74vh] overflow-auto">
                <table className="w-full min-w-[2520px] table-fixed border-collapse text-left text-xs">
                  <colgroup>
                    <col className="w-[46px]" />
                    <col className="w-[125px]" />
                    <col className="w-[320px]" />
                    <col className="w-[450px]" />
                    <col className="w-[112px]" />
                    <col className="w-[170px]" />
                    <col className="w-[140px]" />
                    <col className="w-[150px]" />
                    <col className="w-[330px]" />
                    <col className="w-[72px]" />
                    <col className="w-[160px]" />
                  </colgroup>
                  <thead className="sticky top-0 z-10 bg-slate-100 text-xs font-black uppercase tracking-[0.12em] text-slate-600 shadow-sm">
                    <tr>
                      {["Move", "Fixy", "Label", "Description", "MRN", "SEA price", "Category", "Secondary category", "Area prices", "Calories", "Actions"].map((header) => (
                        <th key={header} className="border-b border-slate-300 px-2 py-1.5">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody data-testid="ssmt-builder-body">
                    {selectedMenu.items.slice(0, 80).map((item) => (
                      item.recordType === "divider" ? (
                        <tr
                          key={item.id}
                          data-testid={`ssmt-row-divider-${item.id}`}
                          data-row-kind="divider"
                          draggable
                          onDragStart={() => setDraggedRowId(item.id)}
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={() => moveRow(draggedRowId, item.id)}
                          className="bg-slate-100"
                        >
                          <td className="border-b border-slate-300 px-2 py-1 text-slate-500"><GripVertical size={16} /></td>
                          <td colSpan={10} className="border-b border-slate-300 px-2 py-1">
                            <label className="flex flex-col gap-1 md:flex-row md:items-center">
                              <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Divider title</span>
                              <input aria-label="Divider title" value={item.title} onChange={(event) => updateDivider(item.id, event.target.value)} className="min-w-[260px] rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-black outline-none focus:border-emerald-500" />
                            </label>
                          </td>
                        </tr>
                      ) : (
                        <tr
                          key={item.id}
                          data-testid={`ssmt-row-item-${item.id}`}
                          data-row-kind="item"
                          draggable
                          onDragStart={() => setDraggedRowId(item.id)}
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={() => moveRow(draggedRowId, item.id)}
                          className={`align-top odd:bg-white even:bg-sky-50/70 ${item.lockedForCentric ? "outline outline-1 -outline-offset-1 outline-emerald-500" : ""}`}
                        >
                          <td className="border-b border-slate-300 px-2 py-1 text-slate-500"><GripVertical size={16} /></td>
                          <td className="border-b border-slate-300 px-2 py-1">
                            <input
                              aria-label={`Fixy for ${item.label || item.name || "item"}`}
                              value={item.fohColumn || ""}
                              onChange={(event) => updateItem(item.id, { fohColumn: event.target.value })}
                              onClick={() => copyLockedField(item, item.fohColumn, "Fixy")}
                              readOnly={Boolean(item.lockedForCentric)}
                              className={`w-full rounded-md border border-slate-300 px-2 py-1 text-xs font-bold outline-none focus:border-emerald-500 ${item.lockedForCentric ? "cursor-copy bg-emerald-50 text-slate-950" : "bg-white"}`}
                            />
                          </td>
                          <td className="border-b border-slate-300 px-2 py-1">
                            <input
                              aria-label="Item label"
                              value={item.label}
                              onChange={(event) => updateItem(item.id, { label: normalizeLabel(event.target.value) })}
                              onClick={() => copyLockedField(item, item.label, "Label")}
                              readOnly={Boolean(item.lockedForCentric)}
                              className={`w-full rounded-md border border-slate-300 px-2 py-1 text-xs font-black outline-none focus:border-emerald-500 ${item.lockedForCentric ? "cursor-copy bg-emerald-50 text-slate-950" : "bg-white"}`}
                            />
                          </td>
                          <td className="border-b border-slate-300 px-2 py-1">
                            <textarea
                              aria-label="Description"
                              value={item.description}
                              onChange={(event) => updateItem(item.id, { description: normalizeDescription(event.target.value) })}
                              onClick={() => copyLockedField(item, item.description, "Description")}
                              readOnly={Boolean(item.lockedForCentric)}
                              className={`h-14 w-full resize-y rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold leading-4 outline-none focus:border-emerald-500 ${item.lockedForCentric ? "cursor-copy bg-emerald-50 text-slate-950" : "bg-white"}`}
                            />
                          </td>
                          <td className="border-b border-slate-300 px-2 py-1">
                            <input
                              aria-label={`MRN for ${item.label || item.name || "item"}`}
                              value={item.mrn || ""}
                              onChange={(event) => updateItem(item.id, { mrn: event.target.value })}
                              onClick={() => copyLockedField(item, item.mrn, "MRN")}
                              readOnly={Boolean(item.lockedForCentric)}
                              className={`w-full rounded-md border border-slate-300 px-2 py-1 font-mono text-xs font-bold outline-none focus:border-emerald-500 ${item.lockedForCentric ? "cursor-copy bg-emerald-50 text-slate-950" : "bg-white"}`}
                            />
                          </td>
                          <td className="border-b border-slate-300 px-2 py-1">
                            <select
                              aria-label={`SEA price for ${item.label || item.name || "item"}`}
                              value={item.priceSelectorId || ""}
                              onChange={(event) => assignItemPrice(item.id, event.target.value)}
                              disabled={Boolean(item.lockedForCentric)}
                              className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-black text-slate-900"
                            >
                              <option value="">Select SEA price</option>
                              {ssmtData.priceBook.map((price) => (
                                <option key={price.id} value={price.id}>{price.selectorLabel}</option>
                              ))}
                            </select>
                            {item.workbookSeaPrice && item.priceReviewStatus === "Needs pricing structure match" && (
                              <p className="mt-1 text-[10px] font-bold leading-3 text-amber-700">Workbook value needs pricing structure match.</p>
                            )}
                          </td>
                          <td className="border-b border-slate-300 px-2 py-1">
                            <input
                              aria-label={`Category for ${item.label || item.name || "item"}`}
                              value={item.category || ""}
                              onChange={(event) => updateItem(item.id, { category: event.target.value })}
                              onClick={() => copyLockedField(item, item.category, "Category")}
                              readOnly={Boolean(item.lockedForCentric)}
                              className={`w-full rounded-md border border-slate-300 px-2 py-1 text-xs font-bold outline-none focus:border-emerald-500 ${item.lockedForCentric ? "cursor-copy bg-emerald-50 text-slate-950" : "bg-white"}`}
                            />
                          </td>
                          <td className="border-b border-slate-300 px-2 py-1">
                            <input
                              aria-label={`Secondary category for ${item.label || item.name || "item"}`}
                              value={item.secondaryCategory || item.reportingCategorySecondary || ""}
                              onChange={(event) => updateItem(item.id, { secondaryCategory: event.target.value, reportingCategorySecondary: event.target.value })}
                              onClick={() => copyLockedField(item, item.secondaryCategory || item.reportingCategorySecondary, "Secondary category")}
                              readOnly={Boolean(item.lockedForCentric)}
                              className={`w-full rounded-md border border-slate-300 px-2 py-1 text-xs font-bold outline-none focus:border-emerald-500 ${item.lockedForCentric ? "cursor-copy bg-emerald-50 text-slate-950" : "bg-white"}`}
                            />
                          </td>
                          <td className="border-b border-slate-300 px-2 py-1">
                            <div aria-label={`Area prices for ${item.label || item.name || "item"}`} className="grid w-full grid-cols-8 gap-px text-[11px] font-bold leading-4 text-slate-700">
                              {ssmtData.areaOrder.map((area) => (
                                <button
                                  key={area}
                                  type="button"
                                  aria-label={`Copy ${area} price for ${item.label || item.name || "item"}`}
                                  disabled={!item.lockedForCentric || !item.areaPrices?.[area]}
                                  onClick={() => copyForCentric(item.areaPrices?.[area], `${area} price`)}
                                  className="rounded border border-slate-300 bg-white px-1 py-0.5 text-left disabled:cursor-not-allowed disabled:text-slate-700 disabled:opacity-100 enabled:cursor-copy enabled:border-emerald-400 enabled:bg-emerald-50 enabled:hover:bg-emerald-100"
                                >
                                  <span className="font-black text-slate-500">{area}</span> {item.areaPrices?.[area] || "TBD"}
                                </button>
                              ))}
                            </div>
                          </td>
                          <td className="border-b border-slate-300 px-2 py-1 font-bold text-slate-700">{selectedMenu.type === "Promotion" ? item.calories || "TBD" : "N/A"}</td>
                          <td className="border-b border-slate-300 px-2 py-1">
                            <div className="grid grid-cols-3 gap-0.5">
                              <button type="button" aria-label="View modifiers" onClick={() => openModifierDialog(item)} className="col-span-3 inline-flex items-center justify-center gap-1 rounded-md border border-green-800 bg-green-700 px-1.5 py-0.5 text-[10px] font-black text-white shadow-sm hover:bg-green-800">
                                <Tags size={12} /> Mods
                              </button>
                              <button type="button" onClick={() => updateItem(item.id, { lockedForCentric: !item.lockedForCentric })} className={`inline-flex items-center justify-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-black ${item.lockedForCentric ? "border-emerald-700 bg-emerald-700 text-white hover:bg-emerald-800" : "border-slate-300 bg-slate-50 text-slate-800 hover:bg-slate-100"}`} aria-label={`${item.lockedForCentric ? "Unlock" : "Lock"} item ${item.label || item.name || "item"}`}>
                                {item.lockedForCentric ? <Lock size={12} /> : <Unlock size={12} />} {item.lockedForCentric ? "Locked" : "Lock"}
                              </button>
                              <button type="button" onClick={() => requestDelete({ type: "item", id: item.id, name: item.label || item.name || "item" })} disabled={Boolean(item.lockedForCentric)} className="inline-flex items-center justify-center gap-1 rounded-md border border-red-200 bg-red-50 px-1.5 py-0.5 text-[10px] font-black text-red-800 hover:bg-red-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400" aria-label={`Delete item ${item.label || item.name || "item"}`}>
                                <Trash2 size={12} /> Del
                              </button>
                              <button type="button" aria-label="Flag for change" onClick={() => setFlagDialog({ item })} className="inline-flex items-center justify-center gap-1 rounded-md border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[10px] font-black text-amber-900 hover:bg-amber-100">
                                <Flag size={12} /> Flag
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </main>
        )}
      </div>

      {modifierDialog && (
        <Modal title="Modifier detail" size="wide" onClose={() => setModifierDialog(null)}>
          <div className="space-y-3">
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <p className="text-sm font-bold leading-6 text-slate-700">For {modifierDialog.item.label || modifierDialog.item.name}, copy creates an independent modifier group. Modifier groups are saved as app-side SSMT records. Prices stay tied to Pricing Structure rows.</p>
              <button type="button" onClick={addModifierGroup} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-800 hover:bg-slate-100">
                <Plus size={14} /> Add modifier group
              </button>
            </div>
            {copiedModifierNotice && <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-black text-emerald-900">{copiedModifierNotice}</p>}
            {modifierDialog.groups.map((group) => (
              <section key={group.id} data-testid={`ssmt-modifier-group-${group.id}`} className="rounded-lg border border-slate-300 bg-slate-50 p-3">
                <div className="grid gap-2 lg:grid-cols-[minmax(220px,1fr)_170px_auto] lg:items-end">
                  <label className="grid gap-1">
                    <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Modifier group name</span>
                    <input
                      aria-label="Modifier group name"
                      value={group.name}
                      onChange={(event) => updateModifierGroup(group.id, { name: event.target.value })}
                      className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-black outline-none focus:border-emerald-500"
                    />
                  </label>
                  <label className="grid gap-1">
                    <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Modifier group type</span>
                    <select
                      aria-label="Modifier group type"
                      value={modifierTypeForGroup(group)}
                      onChange={(event) => updateModifierGroup(group.id, { modifierType: event.target.value })}
                      className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-black"
                    >
                      {MODIFIER_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                    </select>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => addModifierChoice(group.id)} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-800 hover:bg-slate-100">
                      <Plus size={14} /> Add modifier item line
                    </button>
                    <button type="button" onClick={() => requestDelete({ type: "modifier-group", id: group.id, name: group.name })} className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-black text-red-800 hover:bg-red-100">
                      <Trash2 size={14} /> Delete modifier group
                    </button>
                    <button type="button" onClick={() => copyModifierGroup(group)} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-800 hover:bg-slate-100">
                      <Copy size={14} /> Copy group
                    </button>
                  </div>
                </div>

                <div className="mt-2 max-h-[52vh] overflow-auto rounded-lg border border-slate-300 bg-white">
                  <table className="w-full min-w-[1180px] table-fixed border-collapse text-left text-xs">
                    <colgroup>
                      <col className="w-[180px]" />
                      <col className="w-[230px]" />
                      <col className="w-[110px]" />
                      <col className="w-[78px]" />
                      <col className="w-[150px]" />
                      <col className="w-[330px]" />
                      <col className="w-[102px]" />
                    </colgroup>
                    <thead className="sticky top-0 bg-slate-100 font-black uppercase tracking-[0.1em] text-slate-600">
                      <tr>
                        {["Modifier name", "Description", "MRN", "Calories", "Price", "Area prices", "Actions"].map((header) => (
                          <th key={header} className="border-b border-slate-300 px-2 py-1.5">{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(group.choices || []).map((choice) => (
                        <tr key={choice.id} className="align-top odd:bg-white even:bg-slate-50">
                          <td className="border-b border-slate-300 px-2 py-0.5">
                            <input
                              aria-label="Modifier name"
                              value={choice.label || ""}
                              onChange={(event) => updateModifierChoice(group.id, choice.id, { label: event.target.value })}
                              className="w-full min-w-0 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-black outline-none focus:border-emerald-500"
                            />
                          </td>
                          <td className="border-b border-slate-300 px-2 py-0.5">
                            <textarea
                              aria-label="Modifier description"
                              value={choice.description || ""}
                              onChange={(event) => updateModifierChoice(group.id, choice.id, { description: event.target.value })}
                              className="h-10 w-full min-w-0 resize-y rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold leading-4 outline-none focus:border-emerald-500"
                            />
                          </td>
                          <td className="border-b border-slate-300 px-2 py-0.5">
                            <input
                              aria-label="Modifier MRN"
                              value={choice.mrn || ""}
                              onChange={(event) => updateModifierChoice(group.id, choice.id, { mrn: event.target.value })}
                              className="w-full min-w-0 rounded-md border border-slate-300 bg-white px-2 py-1 font-mono text-xs font-bold outline-none focus:border-emerald-500"
                            />
                          </td>
                          <td className="border-b border-slate-300 px-2 py-0.5">
                            <input
                              aria-label="Modifier calories"
                              value={choice.calories || ""}
                              onChange={(event) => updateModifierChoice(group.id, choice.id, { calories: event.target.value })}
                              className="w-full min-w-0 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-bold outline-none focus:border-emerald-500"
                            />
                          </td>
                          <td className="border-b border-slate-300 px-2 py-0.5">
                            <select
                              aria-label="Modifier price"
                              value={choice.priceSelectorId || ""}
                              onChange={(event) => updateModifierChoice(group.id, choice.id, { priceSelectorId: event.target.value })}
                              className="w-full min-w-0 rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] font-black text-slate-900"
                            >
                              <option value="">Select price</option>
                              {ssmtData.priceBook.map((price) => (
                                <option key={price.id} value={price.id}>{price.selectorLabel}</option>
                              ))}
                            </select>
                            <p className="mt-0.5 text-[10px] font-bold leading-3 text-slate-500">{choice.price || "TBD"}</p>
                          </td>
                          <td className="border-b border-slate-300 px-2 py-0.5">
                            <div className="grid w-full min-w-0 grid-cols-8 gap-px text-[10px] font-bold leading-3 text-slate-700">
                              {ssmtData.areaOrder.map((area) => (
                                <span key={area} className="rounded border border-slate-300 bg-white px-1 py-0.5">
                                  <span className="font-black text-slate-500">{area}</span> {choice.areaPrices?.[area] || "TBD"}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="border-b border-slate-300 px-2 py-0.5">
                            <button type="button" aria-label="Delete modifier item line" onClick={() => requestDelete({ type: "modifier-item", groupId: group.id, id: choice.id, name: choice.label || "modifier item" })} className="inline-flex w-full min-w-0 items-center justify-center gap-1 rounded-md border border-red-300 bg-red-50 px-2 py-1 text-[11px] font-black text-red-800 hover:bg-red-100">
                              <Trash2 size={13} /> Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!group.choices?.length && (
                    <div className="p-4 text-sm font-bold text-slate-600">No modifier item lines yet.</div>
                  )}
                </div>
                <p className="mt-2 text-[11px] font-bold text-slate-500">
                  {group.choices.length} choices / {group.sourceSheet}
                </p>
              </section>
            ))}
          </div>
        </Modal>
      )}

      {flagDialog && (
        <Modal title="Flag for change" onClose={() => setFlagDialog(null)}>
          <div className="space-y-4">
            <p className="text-sm font-bold text-slate-700">Save the flag on this SSMT menu and generate a report email to Tyler and Alex.</p>
            <label className="block">
              <span className="text-sm font-black text-slate-900">Reason</span>
              <select value={flagReason} onChange={(event) => setFlagReason(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm font-bold">
                {ssmtData.flagReasons.map((reason) => <option key={reason}>{reason}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-black text-slate-900">Note</span>
              <textarea value={flagNote} onChange={(event) => setFlagNote(event.target.value)} className="mt-2 h-28 w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm font-semibold" />
            </label>
            <button type="button" onClick={reportFlag} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-3 text-sm font-black text-white hover:bg-slate-800">
              <Mail size={18} /> Report
            </button>
          </div>
        </Modal>
      )}

      {deleteRequest && (
        <DeleteConfirmationModal
          request={deleteRequest}
          confirmed={deleteConfirmed}
          onConfirmedChange={setDeleteConfirmed}
          onClose={() => {
            setDeleteRequest(null);
            setDeleteConfirmed(false);
          }}
          onDelete={confirmDelete}
        />
      )}
    </div>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{label}</p>
        <Icon size={18} className="text-emerald-700" />
      </div>
      <p className="mt-3 text-3xl font-black text-slate-950">{value}</p>
    </article>
  );
}

function Modal({ title, children, onClose, size = "default" }) {
  const widthClass = size === "wide" ? "w-[96vw] max-w-[1500px]" : "w-full max-w-3xl";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4" onMouseDown={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`max-h-[88vh] ${widthClass} overflow-y-auto rounded-lg border border-slate-200 bg-white p-5 shadow-2xl`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-2xl font-black text-slate-950">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-slate-700 hover:bg-slate-100" aria-label={`Close ${title}`}>
            <X size={18} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

function DeleteConfirmationModal({ request, confirmed, onConfirmedChange, onClose, onDelete }) {
  const labelByType = {
    menu: "Delete menu",
    item: "Delete item",
    "modifier-group": "Delete modifier group",
    "modifier-item": "Delete modifier item",
  };
  const title = labelByType[request.type] || "Delete item";
  const targetName = request.name || "selected item";

  return (
    <Modal title={title} onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm font-bold leading-6 text-slate-700">
          This deletes the app-side SSMT record only: <span className="font-black text-slate-950">{targetName}</span>.
        </p>
        <label className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-sm font-black text-red-900">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(event) => onConfirmedChange(event.target.checked)}
            aria-label={`Confirm delete ${targetName}`}
          />
          Confirm delete
        </label>
        <button type="button" onClick={onDelete} disabled={!confirmed} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-red-700 px-4 py-3 text-sm font-black text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-slate-300">
          <Trash2 size={18} /> {title}
        </button>
      </div>
    </Modal>
  );
}
