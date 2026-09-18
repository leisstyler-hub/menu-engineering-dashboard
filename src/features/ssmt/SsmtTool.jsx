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
  Pencil,
  Plus,
  Save,
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
import { deriveSsmtOperatingRows, ssmtDerivedMenuEntries } from "./ssmtDerivedMenuSource.js";
import { loadSsmtWorkspaceFromSharedStorage, saveSsmtWorkspaceToSharedStorage } from "./ssmtWorkspaceStorage.js";

const PASSCODE = "0411";
const UNLOCKED_KEY = "culinaryToolsSsmtUnlocked";
const WORKSPACE_STORAGE_KEY = "culinaryToolsSsmtWorkspace_v1";
const DEFAULT_MENU_TYPES = ["Core", "Global", "Menu Library", "Thompson Hospitality", "Promotion"];
const ACTIVE_DATE_MENU_TYPES = ["Promotion", "Thompson Hospitality"];
const MENU_TYPE_ORDER = ["Core", "Global", "Menu Library", "Promotion", "Thompson Hospitality"];
const MODIFIER_TYPES = ["Force", "Remove", "Addition"];
const MODIFIER_TYPE_STYLES = {
  Force: {
    borderClass: "border-violet-400",
    cardClass: "bg-violet-50",
    headerClass: "border-violet-300 bg-violet-100/80",
    iconClass: "bg-violet-700",
    Icon: ShieldCheck,
  },
  Remove: {
    borderClass: "border-rose-400",
    cardClass: "bg-rose-50",
    headerClass: "border-rose-300 bg-rose-100/80",
    iconClass: "bg-rose-700",
    Icon: X,
  },
  Addition: {
    borderClass: "border-amber-400",
    cardClass: "bg-amber-50",
    headerClass: "border-amber-300 bg-amber-100/80",
    iconClass: "bg-amber-700",
    Icon: Plus,
  },
};
const MODIFIER_CLIPBOARD_SLOT_COUNT = 4;
const AUTO_SHARED_SAVE_DELAY_MS = 10000;
// The workspace has grown large (500+ modifier groups, 90+ menus): serializing it to JSON for
// the local cache write and the shared-save change check is expensive enough now to visibly
// freeze the UI if it runs synchronously on every keystroke/drag. Debouncing it off the
// immediate interaction fixes that without changing when saves actually happen.
const LOCAL_CACHE_DEBOUNCE_MS = 500;
const SHARED_SAVE_SIGNATURE_DEBOUNCE_MS = 500;
const EMPTY_MODIFIER_CLIPBOARD_SLOTS = Array.from({ length: MODIFIER_CLIPBOARD_SLOT_COUNT }, (_, index) => ({
  id: `slot-${index + 1}`,
  label: `Slot ${index + 1}`,
  group: null,
  savedAt: "",
}));
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
  "Menu Library": {
    label: "Menu Library",
    groupClass: "border-violet-400 bg-violet-100/80",
    badgeClass: "bg-violet-700 text-white",
    itemClass: "border-violet-100 hover:border-violet-500 hover:bg-violet-50",
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
// Items before any divider/sub menu inherit this "main" tone.
const SSMT_BUILDER_MAIN_PALETTE = {
  itemRowClass: "odd:bg-sky-50 even:bg-sky-100/60",
  itemCellBorderClass: "border-sky-200",
  itemHandleClass: "text-sky-700",
};
// Dividers use warm structural colors, while sub menus use cool structural colors.
// Keeping both groups out of the green family prevents them from blending with
// SSMT completion, lock, save, dietary, and modifier-readiness status colors.
const SSMT_DIVIDER_PALETTES = [
  {
    headerRowClass: "bg-rose-50",
    headerGripClass: "border-rose-300 text-rose-800",
    headerCellBorderClass: "border-rose-300",
    headerBoxClass: "border-rose-400 bg-rose-50",
    badgeClass: "bg-rose-700",
    itemRowClass: "odd:bg-rose-50 even:bg-rose-100/60",
    itemCellBorderClass: "border-rose-200",
    itemHandleClass: "text-rose-700",
  },
  {
    headerRowClass: "bg-amber-50",
    headerGripClass: "border-amber-300 text-amber-800",
    headerCellBorderClass: "border-amber-300",
    headerBoxClass: "border-amber-400 bg-amber-50",
    badgeClass: "bg-amber-700",
    itemRowClass: "odd:bg-amber-50 even:bg-amber-100/60",
    itemCellBorderClass: "border-amber-200",
    itemHandleClass: "text-amber-700",
  },
  {
    headerRowClass: "bg-orange-50",
    headerGripClass: "border-orange-300 text-orange-800",
    headerCellBorderClass: "border-orange-300",
    headerBoxClass: "border-orange-400 bg-orange-50",
    badgeClass: "bg-orange-700",
    itemRowClass: "odd:bg-orange-50 even:bg-orange-100/60",
    itemCellBorderClass: "border-orange-200",
    itemHandleClass: "text-orange-700",
  },
  {
    headerRowClass: "bg-fuchsia-50",
    headerGripClass: "border-fuchsia-300 text-fuchsia-800",
    headerCellBorderClass: "border-fuchsia-300",
    headerBoxClass: "border-fuchsia-400 bg-fuchsia-50",
    badgeClass: "bg-fuchsia-700",
    itemRowClass: "odd:bg-fuchsia-50 even:bg-fuchsia-100/60",
    itemCellBorderClass: "border-fuchsia-200",
    itemHandleClass: "text-fuchsia-700",
  },
];
// Sub menus rotate independently through the cool palette.
const SSMT_SUBMENU_PALETTES = [
  {
    headerRowClass: "bg-blue-50",
    headerGripClass: "border-blue-300 text-blue-800",
    headerCellBorderClass: "border-blue-300",
    headerBoxClass: "border-blue-400 bg-blue-50",
    badgeClass: "bg-blue-700",
    itemRowClass: "odd:bg-blue-50 even:bg-blue-100/60",
    itemCellBorderClass: "border-blue-200",
    itemHandleClass: "text-blue-700",
  },
  {
    headerRowClass: "bg-indigo-50",
    headerGripClass: "border-indigo-300 text-indigo-800",
    headerCellBorderClass: "border-indigo-300",
    headerBoxClass: "border-indigo-400 bg-indigo-50",
    badgeClass: "bg-indigo-700",
    itemRowClass: "odd:bg-indigo-50 even:bg-indigo-100/60",
    itemCellBorderClass: "border-indigo-200",
    itemHandleClass: "text-indigo-700",
  },
  {
    headerRowClass: "bg-violet-50",
    headerGripClass: "border-violet-300 text-violet-800",
    headerCellBorderClass: "border-violet-300",
    headerBoxClass: "border-violet-400 bg-violet-50",
    badgeClass: "bg-violet-700",
    itemRowClass: "odd:bg-violet-50 even:bg-violet-100/60",
    itemCellBorderClass: "border-violet-200",
    itemHandleClass: "text-violet-700",
  },
  {
    headerRowClass: "bg-cyan-50",
    headerGripClass: "border-cyan-300 text-cyan-800",
    headerCellBorderClass: "border-cyan-300",
    headerBoxClass: "border-cyan-400 bg-cyan-50",
    badgeClass: "bg-cyan-700",
    itemRowClass: "odd:bg-cyan-50 even:bg-cyan-100/60",
    itemCellBorderClass: "border-cyan-200",
    itemHandleClass: "text-cyan-700",
  },
];
const SSMT_AREA_PRICE_GRID_CLASS = "grid w-full min-w-0 grid-cols-8 gap-1 text-[11px] font-bold leading-3 text-slate-700";
// Prices are stored with a currency symbol (e.g. "$12.10"). When copying a
// locked price for Centric, IT wants just the number + decimal point ("12.10").
function priceDigitsOnly(value) {
  return String(value || "").replace(/[^0-9.]/g, "");
}
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
    centricMenuName: menu.centricMenuName || "",
    webtritionMasterMenuName: menu.webtritionMasterMenuName || "",
    flags: Array.isArray(menu.flags) ? menu.flags.map((flag) => ({ ...flag })) : [],
    items: (menu.items || []).map((item) => ({
      ...item,
      lockedForCentric: Boolean(item.lockedForCentric),
      secondaryCategory: item.secondaryCategory || item.reportingCategorySecondary || "",
      dietaryPreference: item.dietaryPreference || "",
      scanPayUpc: item.scanPayUpc || "",
      areaPrices: { ...(item.areaPrices || {}) },
      modifierGroups: [...(item.modifierGroups || [])],
    })),
  };
}

function normalizeModifierClipboardSlots(slots = []) {
  return EMPTY_MODIFIER_CLIPBOARD_SLOTS.map((emptySlot, index) => {
    const slot = slots[index] || slots.find((candidate) => candidate?.id === emptySlot.id) || {};
    return {
      ...emptySlot,
      savedAt: slot.savedAt || "",
      group: slot.group ? normalizeModifierGroup(slot.group) : null,
    };
  });
}

function copyModifierGroupPayload(group = {}) {
  return {
    ...group,
    choices: (group.choices || []).map((choice) => ({ ...choice })),
  };
}

function buildFlagReportMailto({ menu = {}, flags = [], recipients = [] } = {}) {
  const timestamp = new Date().toLocaleString();
  const subject = encodeURIComponent(`SSMT flag report: ${menu.name || "Selected menu"}`);
  const flagLines = flags.length ? flags.flatMap((flag, index) => [
    `${index + 1}. ${flag.itemName || "Selected row"}`,
    `Reason: ${flag.reason || "No reason selected"}`,
    `Note: ${flag.note || "No note entered."}`,
    `Flagged at: ${flag.createdAt || "Timestamp not captured"}`,
    "",
  ]) : ["No saved flags.", ""];
  const body = encodeURIComponent([
    `Timestamp: ${timestamp}`,
    `Menu: ${menu.name || "Selected menu"}`,
    `Menu type: ${menu.type || ""}`,
    `Phase: ${menu.phase || ""}`,
    `Saved item flags: ${flags.length}`,
    "",
    ...flagLines,
    "This report was generated from saved SSMT item flags.",
  ].join("\n"));
  return `mailto:${recipients.join(",")}?subject=${subject}&body=${body}`;
}

function workspaceSharedSignature(workspace = {}) {
  return JSON.stringify({
    menus: workspace.menus || [],
    priceBook: workspace.priceBook || [],
    modifierGroups: workspace.modifierGroups || [],
    modifierClipboardSlots: workspace.modifierClipboardSlots || [],
    seedMenuTypeCorrectionsApplied: Boolean(workspace.seedMenuTypeCorrectionsApplied),
  });
}

function menuKey(menu = {}) {
  return String(menu.name || menu.id || "").trim().toLowerCase();
}

function mergeWorkspaceMenusWithSeed(workspaceMenus = [], seedMenus = [], { applySeedTypes = false } = {}) {
  const merged = [];
  const seen = new Set();
  const seedByKey = new Map(seedMenus.map((menu) => [menuKey(menu), menu]));

  for (const menu of workspaceMenus) {
    const key = menuKey(menu);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    const seedMenu = seedByKey.get(key);
    merged.push(applySeedTypes && seedMenu?.type ? { ...menu, type: seedMenu.type } : menu);
  }

  for (const menu of seedMenus) {
    const key = menuKey(menu);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    merged.push(menu);
  }

  return merged;
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

function priceNumber(value) {
  const number = Number.parseFloat(String(value || "").replace(/[$,]/g, ""));
  return Number.isFinite(number) ? number : -1;
}

function priceSelectorLabel(seaPrice, category) {
  const numericPrice = Number.parseFloat(String(seaPrice || "").replace(/[$,]/g, ""));
  const displayPrice = Number.isFinite(numericPrice) ? `$${numericPrice.toFixed(2)}` : String(seaPrice || "").trim();
  const cleanCategory = String(category || "Pricing row").trim().replace(/^(?:\$?\d+(?:\.\d{1,2})?\s*)+(?:-\s*)/, "");
  return `${displayPrice} - ${cleanCategory || "Pricing row"}`;
}

function rowSeaPrice(price = {}) {
  const storedPrice = price.areas?.SEA || price.seaPrice || price.price;
  if (storedPrice) return storedPrice;
  return String(price.selectorLabel || "").match(/^\s*\$?\d+(?:\.\d+)?/)?.[0] || "";
}

function comparePricesHighToLow(a, b) {
  const byValue = priceNumber(rowSeaPrice(b)) - priceNumber(rowSeaPrice(a));
  if (byValue !== 0) return byValue;
  return String(a.selectorLabel || a.category || "").localeCompare(String(b.selectorLabel || b.category || ""), undefined, { sensitivity: "base" });
}

function comparePricesLowToHigh(a, b) {
  const byValue = priceNumber(rowSeaPrice(a)) - priceNumber(rowSeaPrice(b));
  if (byValue !== 0) return byValue;
  return String(a.selectorLabel || a.category || "").localeCompare(String(b.selectorLabel || b.category || ""), undefined, { sensitivity: "base" });
}

function sortPricesForItemSelector(priceBook = []) {
  return [...priceBook].sort((a, b) => {
    if (Boolean(a.modifierOnly) !== Boolean(b.modifierOnly)) return a.modifierOnly ? 1 : -1;
    return comparePricesHighToLow(a, b);
  });
}

function sortPricesForModifierSelector(priceBook = []) {
  return [...priceBook].sort((a, b) => {
    if (Boolean(a.modifierOnly) !== Boolean(b.modifierOnly)) return a.modifierOnly ? -1 : 1;
    return comparePricesLowToHigh(a, b);
  });
}

function matchedModifierGroupsForItem(item = {}, modifierGroups = []) {
  if (!Array.isArray(modifierGroups)) return [];
  const refs = Array.isArray(item.modifierGroups) ? item.modifierGroups : [];
  return modifierGroups
    .filter((group) => refs.some((ref) => modifierGroupMatchesItemRef(group, ref)))
    .slice(0, 4);
}

// Building the item-row Mods badge/gate by filtering the full modifierGroups array per item
// is O(items x modifierGroups) and gets slow once modifierGroups grows into the hundreds (a
// large menu's items table was re-scanning all of them on every keystroke). This index turns
// each item's lookup into O(refs), where refs is the item's own (small, <=4) modifierGroups list.
function buildModifierGroupIndex(modifierGroups = []) {
  const byId = new Map();
  const byName = new Map();
  for (const group of modifierGroups) {
    if (group?.id) byId.set(group.id, group);
    const name = String(group?.name || "").trim().toLowerCase();
    if (name) byName.set(name, group);
  }
  return { byId, byName };
}

function matchedModifierGroupsForItemIndexed(item = {}, index = { byId: new Map(), byName: new Map() }) {
  const refs = Array.isArray(item.modifierGroups) ? item.modifierGroups : [];
  const matched = [];
  const seen = new Set();
  for (const ref of refs) {
    const cleanRef = String(ref || "").trim();
    if (!cleanRef) continue;
    const group = index.byId.get(cleanRef) || index.byName.get(cleanRef.toLowerCase());
    if (group && !seen.has(group)) {
      seen.add(group);
      matched.push(group);
    }
  }
  return matched.slice(0, 4);
}

function modifierGroupMatchesItemRef(group = {}, ref = "") {
  const cleanRef = String(ref || "").trim();
  if (!cleanRef) return false;
  // Fresh groups are linked to items by id (addModifierGroup / paste), so id is the
  // reliable key. Legacy free-text refs only count when they match a group name exactly.
  // Substring matching was removed: it silently attached template-artifact groups
  // (names like "2", "NO", "1", "Forced/Add/Remove?") to unrelated items, inflating the
  // Mods count against groups that were never really authored for that item.
  if (group.id === cleanRef) return true;
  const groupName = String(group.name || "").trim().toLowerCase();
  const refName = cleanRef.toLowerCase();
  return groupName !== "" && groupName === refName;
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
    label: normalizeDescription(choice.label || choice.name || ""),
    description: normalizeDescription(choice.description || ""),
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
    lockedForCentric: Boolean(group.lockedForCentric),
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

function groupMenusByType(menus = [], showHidden = false) {
  const isHibernated = (menu) => menu.hidden || menuIsAutoHibernated(menu);
  const activeMenus = menus.filter((menu) => !isHibernated(menu));
  const groups = MENU_TYPE_ORDER.map((type) => ({
    type,
    ...MENU_TYPE_STYLES[type],
    menus: activeMenus.filter((menu) => menu.type === type).sort(compareMenuNames),
  }));
  const knownTypes = new Set(MENU_TYPE_ORDER);
  const otherMenus = activeMenus.filter((menu) => !knownTypes.has(menu.type)).sort(compareMenuNames);
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
  // Sixth bucket: hibernated/expired menus collected on their own, shown only
  // when "Show hibernated" is on. They no longer bleed into their type buckets.
  if (showHidden) {
    const hibernatedMenus = menus.filter(isHibernated).sort(compareMenuNames);
    groups.push({
      type: "Hibernated",
      label: "Hibernated",
      groupClass: "border-slate-400 bg-slate-200/70",
      badgeClass: "bg-slate-800 text-white",
      itemClass: "border-slate-200 hover:border-slate-500 hover:bg-slate-100",
      menus: hibernatedMenus,
    });
  }
  return groups;
}

function mergeMenuTypes(menuTypes = []) {
  return [...new Set([...menuTypes, ...DEFAULT_MENU_TYPES])];
}

function menuIsAutoHibernated(menu, today = new Date()) {
  if (menu.type !== "Promotion" || !menu.activeEnd) return false;
  const end = new Date(`${menu.activeEnd}T23:59:59`);
  return Number.isFinite(end.getTime()) && end < today;
}

function menuIsVisible(menu, showHidden) {
  return showHidden || (!menu.hidden && !menuIsAutoHibernated(menu));
}

function createBlankItem(menuId, areaOrder, index = 1) {
  return {
    id: `${menuId}-item-${Date.now()}-${index}`,
    label: "NEW ITEM",
    name: "NEW ITEM",
    description: "",
    mrn: "",
    photoLink: "",
    category: "",
    fohColumn: "",
    secondaryCategory: "",
    dietaryPreference: "",
    scanPayUpc: "",
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
    centricMenuName: "",
    webtritionMasterMenuName: "",
    sourceSheet: "Created in SSMT",
    includeReason: "Created in SSMT",
    type,
    phase: "Culinary draft",
    status: "Draft",
    activeStart: "",
    activeEnd: "",
    completedAt: "",
    editSignal: false,
    flags: [],
    downstreamEligibleAfter: "IT complete",
    items: [createBlankItem(menuId, areaOrder, 1)],
  };
}

function createDivider(menuId, dividerKind = "category") {
  return {
    id: `${menuId}-divider-${Date.now()}`,
    recordType: "divider",
    dividerKind,
    title: dividerKind === "submenu" ? "New sub menu" : "New divider",
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
    lockedForCentric: false,
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
  const [newPriceModifierOnly, setNewPriceModifierOnly] = useState(false);
  const [showHiddenMenus, setShowHiddenMenus] = useState(false);
  const [modifierDialog, setModifierDialog] = useState(null);
  const [flagDialog, setFlagDialog] = useState(null);
  const [flagActionDialog, setFlagActionDialog] = useState(null);
  const [deleteRequest, setDeleteRequest] = useState(null);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [flagReason, setFlagReason] = useState("Description correction");
  const [flagNote, setFlagNote] = useState("");
  const [reportedFlag, setReportedFlag] = useState(null);
  const [leaveMenuPrompt, setLeaveMenuPrompt] = useState(null);
  const [clearFlagsPrompt, setClearFlagsPrompt] = useState(false);
  const [copiedModifierNotice, setCopiedModifierNotice] = useState("");
  const [copiedFieldNotice, setCopiedFieldNotice] = useState("");
  const [modifierClipboardSlots, setModifierClipboardSlots] = useState(EMPTY_MODIFIER_CLIPBOARD_SLOTS);
  const [phaseBlocker, setPhaseBlocker] = useState("");
  const [menuNameEditing, setMenuNameEditing] = useState(false);
  const draggedRowIdRef = useRef("");
  const draggedModifierGroupIdRef = useRef("");
  const [workspaceSync, setWorkspaceSync] = useState({
    state: "loading",
    source: "local",
    message: "Loading SSMT workspace...",
  });
  const workspaceLoadedRef = useRef(false);
  const skipInitialSharedSaveRef = useRef(true);
  const lastSharedSaveSignatureRef = useRef("");
  const pendingSharedSaveTimersRef = useRef({ debounce: null, save: null });
  const modifierClipboard = modifierClipboardSlots.find((slot) => slot.group)?.group || null;

  const buildWorkspaceSnapshot = (overrides = {}) => ({
    menus,
    priceBook: ssmtData.priceBook,
    modifierGroups: ssmtData.modifierGroups,
    modifierClipboardSlots,
    selectedMenuId,
    seedMenuTypeCorrectionsApplied: true,
    updatedAt: new Date().toISOString(),
    ...overrides,
  });

  const manualSaveWorkspace = async (label = "SSMT workspace") => {
    if (dataStatus !== "ready") return false;
    const workspace = buildWorkspaceSnapshot();
    writeLocalStorageJson(WORKSPACE_STORAGE_KEY, workspace, { clearOnQuota: true });
    setWorkspaceSync((current) => ({
      ...current,
      state: "saving",
      message: `Saving ${label} now...`,
    }));
    try {
      const result = await saveSsmtWorkspaceToSharedStorage(workspace);
      lastSharedSaveSignatureRef.current = workspaceSharedSignature(workspace);
      setWorkspaceSync({
        state: "synced",
        source: result.source || "supabase",
        message: `Shared SSMT workspace saved from ${label}.`,
      });
      return true;
    } catch (error) {
      setWorkspaceSync({
        state: "fallback",
        source: "local",
        message: `${error.message || "Shared SSMT workspace save failed."} This browser kept a local cache; fix the issue and press Save again.`,
      });
      return false;
    }
  };

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
        const storedMenus = Array.isArray(workspace.menus) && workspace.menus.length
          ? mergeWorkspaceMenusWithSeed(workspace.menus, payload.menus, { applySeedTypes: !workspace.seedMenuTypeCorrectionsApplied })
          : payload.menus;
        const storedPriceBook = Array.isArray(workspace.priceBook) && workspace.priceBook.length ? workspace.priceBook : payload.priceBook;
        const storedModifierGroups = Array.isArray(workspace.modifierGroups) && workspace.modifierGroups.length ? workspace.modifierGroups : payload.modifierGroups;
        const priceBook = storedPriceBook;
        const modifierGroups = storedModifierGroups.map((group) => normalizeModifierGroup(group, payload.areaOrder, priceBook));
        const clipboardSlots = normalizeModifierClipboardSlots(workspace.modifierClipboardSlots);
        lastSharedSaveSignatureRef.current = workspaceSharedSignature({
          menus: storedMenus,
          priceBook,
          modifierGroups,
          modifierClipboardSlots: clipboardSlots,
          seedMenuTypeCorrectionsApplied: true,
        });
        setSsmtData({
          ...payload,
          menuTypes: mergeMenuTypes(payload.menuTypes),
          priceBook,
          modifierGroups,
        });
        setMenus((current) => current.length ? current : storedMenus.map(cloneMenu));
        setModifierClipboardSlots(clipboardSlots);
        setSelectedMenuId((current) => current || (storedMenus.some((menu) => menu.id === workspace.selectedMenuId) ? workspace.selectedMenuId : storedMenus[0]?.id || ""));
        setSelectedPriceId((current) => current || payload.priceBook[0]?.id || "");
        setNewMenuType(mergeMenuTypes(payload.menuTypes)[0] || "Core");
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
    if (dataStatus !== "ready" || !menus.length) return undefined;
    const timer = window.setTimeout(() => {
      const workspace = buildWorkspaceSnapshot();
      writeLocalStorageJson(WORKSPACE_STORAGE_KEY, workspace, { clearOnQuota: true });
    }, LOCAL_CACHE_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [dataStatus, menus, selectedMenuId, ssmtData.priceBook, ssmtData.modifierGroups, modifierClipboardSlots]);

  useEffect(() => {
    if (dataStatus !== "ready" || !menus.length) return undefined;
    // Consumed synchronously (not inside the debounce below) so it reliably skips exactly the
    // one render right after loading existing shared data, regardless of how quickly further
    // real edits follow — a debounced check here could merge that first real edit into the same
    // window as the load and skip it too.
    if (skipInitialSharedSaveRef.current) {
      skipInitialSharedSaveRef.current = false;
      return undefined;
    }
    const timers = pendingSharedSaveTimersRef.current;
    if (timers.debounce) window.clearTimeout(timers.debounce);
    if (timers.save) window.clearTimeout(timers.save);

    timers.debounce = window.setTimeout(() => {
      const workspace = buildWorkspaceSnapshot();
      const sharedSignature = workspaceSharedSignature(workspace);
      if (sharedSignature === lastSharedSaveSignatureRef.current) return;
      if (!workspaceLoadedRef.current) return;
      setWorkspaceSync((current) => ({
        ...current,
        state: "saving",
        message: "Saving shared SSMT workspace after idle edits...",
      }));
      timers.save = window.setTimeout(async () => {
        try {
          const result = await saveSsmtWorkspaceToSharedStorage(workspace);
          lastSharedSaveSignatureRef.current = sharedSignature;
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
      }, AUTO_SHARED_SAVE_DELAY_MS);
    }, SHARED_SAVE_SIGNATURE_DEBOUNCE_MS);

    return () => {
      if (timers.debounce) window.clearTimeout(timers.debounce);
      if (timers.save) window.clearTimeout(timers.save);
    };
  }, [dataStatus, menus, ssmtData.priceBook, ssmtData.modifierGroups, modifierClipboardSlots]);

  useEffect(() => {
    if (!modifierDialog) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setModifierDialog(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [modifierDialog]);

  useEffect(() => {
    setMenuNameEditing(false);
  }, [selectedMenuId]);

  const selectedMenu = menus.find((menu) => menu.id === selectedMenuId) || menus[0] || { id: "loading", name: "Loading SSMT", type: "Core", phase: "Culinary draft", items: [] };
  const selectedPrice = ssmtData.priceBook.find((row) => row.id === selectedPriceId) || ssmtData.priceBook[0];
  const itemPriceOptions = useMemo(() => sortPricesForItemSelector(ssmtData.priceBook), [ssmtData.priceBook]);
  const modifierPriceOptions = useMemo(() => sortPricesForModifierSelector(ssmtData.priceBook), [ssmtData.priceBook]);
  const modifierGroupIndex = useMemo(() => buildModifierGroupIndex(ssmtData.modifierGroups), [ssmtData.modifierGroups]);
  const visibleMenus = useMemo(() => {
    const query = search.trim().toLowerCase();
    const availableMenus = menus.filter((menu) => menuIsVisible(menu, showHiddenMenus));
    if (!query) return availableMenus;
    return availableMenus.filter((menu) => `${menu.name} ${menu.type}`.toLowerCase().includes(query));
  }, [menus, search, showHiddenMenus]);
  const menuGroups = useMemo(() => groupMenusByType(visibleMenus, showHiddenMenus), [visibleMenus, showHiddenMenus]);

  const downstreamReadyCount = menus.filter((menu) => ["Core", "Global"].includes(menu.type) && menu.phase === "IT complete").length;
  const promotionCount = menus.filter((menu) => menu.type === "Promotion").length;
  const historicalCount = menus.filter((menu) => ["Thompson Hospitality", "Promotion"].includes(menu.type)).length;
  const flaggedMenus = menus.filter((menu) => menu.editSignal || (Array.isArray(menu.flags) && menu.flags.length));
  const hiddenMenuCount = menus.filter((menu) => menu.hidden || menuIsAutoHibernated(menu)).length;
  const phaseCounts = ssmtData.workflowPhases.map((phase) => ({
    phase,
    count: visibleMenus.filter((menu) => menu.phase === phase).length,
  }));
  const menuTypes = ssmtData.menuTypes?.length ? ssmtData.menuTypes : DEFAULT_MENU_TYPES;
  const showActiveDates = activeDatesRequired(selectedMenu.type);
  const selectedItemRows = (selectedMenu.items || []).filter((item) => item.recordType !== "divider");
  const selectedDerivedRows = useMemo(() => deriveSsmtOperatingRows({ menus: [selectedMenu] }), [selectedMenu]);
  const selectedDerivedMenus = useMemo(() => ssmtDerivedMenuEntries(selectedDerivedRows), [selectedDerivedRows]);
  const selectedMenuFlags = Array.isArray(selectedMenu.flags) ? selectedMenu.flags : [];
  const totalItemFlagCount = menus.reduce((sum, menu) => sum + (Array.isArray(menu.flags) ? menu.flags.length : 0), 0);
  const selectedFlagReportHref = buildFlagReportMailto({
    menu: selectedMenu,
    flags: selectedMenuFlags,
    recipients: ssmtData.reportRecipients,
  });
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

  const updateDivider = (dividerId, patch) => {
    const resolvedPatch = typeof patch === "string" ? { title: patch } : patch;
    setMenus((current) => current.map((menu) => {
      if (menu.id !== selectedMenu.id) return menu;
      return {
        ...menu,
        items: menu.items.map((item) => (item.id === dividerId ? { ...item, ...resolvedPatch } : item)),
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
    const isModifierFree = category.trim().toLowerCase() === "price category modifier free";
    if (!category || (!seaPrice && !isModifierFree)) return;
    const id = `price-custom-${slugify(category)}-${Date.now()}`;
    const normalizedSeaPrice = isModifierFree ? "0.00" : seaPrice;
    const areas = Object.fromEntries(ssmtData.areaOrder.map((area) => [area, isModifierFree ? "0.00" : (area === "SEA" ? normalizedSeaPrice : "")]));
    const row = {
      id,
      category,
      example: "Created in SSMT",
      selectorLabel: priceSelectorLabel(normalizedSeaPrice, category),
      modifierOnly: newPriceModifierOnly || isModifierFree,
      areas,
    };
    setSsmtData((current) => ({ ...current, priceBook: [...current.priceBook, row] }));
    setSelectedPriceId(id);
    setNewPriceCategory("");
    setNewPriceSea("");
    setNewPriceModifierOnly(false);
  };

  const updatePricingRow = (priceId, patch) => {
    setSsmtData((current) => ({
      ...current,
      priceBook: current.priceBook.map((price) => {
        if (price.id !== priceId) return price;
        const next = { ...price, ...patch };
        const seaPrice = next.areas?.SEA || rowSeaPrice(next);
        return {
          ...next,
          selectorLabel: priceSelectorLabel(seaPrice, next.category || price.category),
        };
      }),
    }));
  };

  const updatePricingArea = (priceId, area, value) => {
    updatePricingRow(priceId, {
      areas: {
        ...(ssmtData.priceBook.find((price) => price.id === priceId)?.areas || {}),
        [area]: value,
      },
    });
  };

  const openMenu = (menuId) => {
    setSelectedMenuId(menuId);
    setActiveView("editor");
  };

  // Flags are report-only and menu-session-scoped: warn before leaving a menu
  // that still has unreported flags, and clear them if the user confirms leaving.
  const currentMenuHasUnreportedFlags = () =>
    activeView === "editor" && Array.isArray(selectedMenu?.flags) && selectedMenu.flags.length > 0;

  const requestLeaveCurrentMenu = (action) => {
    if (currentMenuHasUnreportedFlags()) {
      setLeaveMenuPrompt({ action });
      return;
    }
    action();
  };

  const confirmLeaveCurrentMenu = () => {
    const action = leaveMenuPrompt?.action;
    updateSelectedMenu({ flags: [] });
    setReportedFlag(null);
    setLeaveMenuPrompt(null);
    if (typeof action === "function") action();
  };

  const cancelLeaveCurrentMenu = () => setLeaveMenuPrompt(null);

  // Manually clear all saved flags on the current menu (report-only data).
  // Guarded by a confirm modal so a click can't wipe unreported flags by accident.
  const clearSelectedMenuFlags = () => {
    updateSelectedMenu({ flags: [] });
    setReportedFlag(null);
    setClearFlagsPrompt(false);
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

  const addSubmenuDivider = () => {
    setMenus((current) => current.map((menu) => {
      if (menu.id !== selectedMenu.id) return menu;
      return { ...menu, items: [...menu.items, createDivider(menu.id, "submenu")] };
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
    setDeleteConfirmText("");
  };

  const moveMenuToType = (menuId, type) => {
    if (!menuId || !type) return;
    setMenus((current) => current.map((menu) => (menu.id === menuId ? { ...menu, type, hidden: false } : menu)));
  };

  // Dropping a menu onto the Hibernated bucket hibernates it (rather than
  // corrupting its type to "Hibernated").
  const hibernateMenu = (menuId) => {
    if (!menuId) return;
    setMenus((current) => current.map((menu) => (menu.id === menuId ? { ...menu, hidden: true } : menu)));
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
    draggedRowIdRef.current = "";
  };

  const deleteSelectedMenu = (menuId) => {
    setMenus((current) => {
      const remaining = current.filter((menu) => menu.id !== menuId);
      setSelectedMenuId(remaining[0]?.id || "");
      return remaining;
    });
    setDeleteRequest(null);
    setDeleteConfirmed(false);
    setDeleteConfirmText("");
    setActiveView("menus");
  };

  const openModifierDialog = (item) => {
    setCopiedModifierNotice("");
    const matchedGroups = matchedModifierGroupsForItem(item, ssmtData.modifierGroups);
    setModifierDialog({
      item,
      groups: matchedGroups.map((group) => normalizeModifierGroup(group, ssmtData.areaOrder, ssmtData.priceBook)),
    });
  };

  const saveModifierGroupToClipboardSlot = (groupOrId, slotIndex = 0) => {
    const groupId = typeof groupOrId === "string" ? groupOrId : groupOrId?.id;
    setModifierDialog((currentDialog) => {
      const group = currentDialog?.groups.find((candidate) => candidate.id === groupId)
        || ssmtData.modifierGroups.find((candidate) => candidate.id === groupId)
        || groupOrId;
      if (!group?.id) return currentDialog;
      const groupCopy = copyModifierGroupPayload(group);
      const savedAt = new Date().toISOString();
      setModifierClipboardSlots((current) => normalizeModifierClipboardSlots(current).map((slot, index) => (
        index === slotIndex ? { ...slot, group: groupCopy, savedAt } : slot
      )));
      setCopiedModifierNotice(`${group.name || "Modifier group"} saved to slot ${slotIndex + 1}.`);
      return currentDialog;
    });
  };

  const clearModifierClipboardSlot = (slotIndex) => {
    const clearedName = modifierClipboardSlots[slotIndex]?.group?.name || "Modifier group";
    setModifierClipboardSlots((current) => normalizeModifierClipboardSlots(current).map((slot, index) => (
      index === slotIndex ? { ...slot, group: null, savedAt: "" } : slot
    )));
    setCopiedModifierNotice(`${clearedName} cleared from slot ${slotIndex + 1}.`);
  };

  const pasteModifierGroup = (groupToPaste = modifierClipboard) => {
    if (!groupToPaste || !modifierDialog?.item) return;
    const baseName = groupToPaste.name || "Pasted modifier group";
    const nextName = baseName;
    const groupId = `${groupToPaste.id || "modifier-clipboard"}-paste-${Date.now()}`;
    const pastedGroup = normalizeModifierGroup({
      ...groupToPaste,
      id: groupId,
      name: nextName,
      sourceSheet: `${groupToPaste.sourceSheet || "SSMT"} / pasted in SSMT`,
      copyBehavior: "Independent pasted copy",
      lockedForCentric: false,
      choices: (groupToPaste.choices || []).map((choice, index) => ({
        ...choice,
        id: `${groupId}-choice-${index + 1}`,
      })),
    }, ssmtData.areaOrder, ssmtData.priceBook);
    setSsmtData((current) => ({ ...current, modifierGroups: [...current.modifierGroups, pastedGroup] }));
    updateItem(modifierDialog.item.id, { modifierGroups: [...(modifierDialog.item.modifierGroups || []), pastedGroup.id] });
    setModifierDialog((current) => current ? {
      ...current,
      item: { ...current.item, modifierGroups: [...(current.item.modifierGroups || []), pastedGroup.id] },
      groups: [...current.groups, pastedGroup],
    } : current);
    setCopiedModifierNotice(`${pastedGroup.name} pasted onto ${modifierDialog.item.label || modifierDialog.item.name}.`);
  };

  const moveModifierGroup = (sourceId, targetId) => {
    if (!sourceId || !targetId || sourceId === targetId) return;
    const reorder = (groups) => {
      const sourceIndex = groups.findIndex((group) => group.id === sourceId);
      const targetIndex = groups.findIndex((group) => group.id === targetId);
      if (sourceIndex < 0 || targetIndex < 0) return groups;
      const nextGroups = [...groups];
      const [moved] = nextGroups.splice(sourceIndex, 1);
      nextGroups.splice(targetIndex, 0, moved);
      return nextGroups;
    };
    setModifierDialog((current) => current ? { ...current, groups: reorder(current.groups) } : current);
    setSsmtData((current) => ({ ...current, modifierGroups: reorder(current.modifierGroups) }));
    draggedModifierGroupIdRef.current = "";
  };

  const toggleModifierGroupLock = (groupId) => {
    const group = ssmtData.modifierGroups.find((candidate) => candidate.id === groupId)
      || modifierDialog?.groups.find((candidate) => candidate.id === groupId);
    updateModifierGroup(groupId, { lockedForCentric: !group?.lockedForCentric });
  };

  const updateModifierGroupDraft = (groupId, patch) => {
    setModifierDialog((current) => current ? {
      ...current,
      groups: current.groups.map((group) => (
        group.id === groupId ? { ...group, ...patch } : group
      )),
    } : current);
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
      updateItem(modifierDialog.item.id, { modifierGroups: [...(modifierDialog.item.modifierGroups || []), group.id] });
    }
    setModifierDialog((current) => current ? {
      ...current,
      item: { ...current.item, modifierGroups: [...(current.item.modifierGroups || []), group.id] },
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
    const normalizePatch = (choice, priceBook = ssmtData.priceBook, areaOrder = ssmtData.areaOrder) => {
      const normalizedPatch = { ...patch };
      if (Object.prototype.hasOwnProperty.call(normalizedPatch, "label")) {
        normalizedPatch.label = normalizeDescription(normalizedPatch.label);
      }
      if (Object.prototype.hasOwnProperty.call(normalizedPatch, "description")) {
        normalizedPatch.description = normalizeDescription(normalizedPatch.description);
      }
      const nextChoice = { ...choice, ...normalizedPatch };
      const priceRow = findPriceRow(priceBook, nextChoice.priceSelectorId);
      if (Object.prototype.hasOwnProperty.call(patch, "priceSelectorId")) {
        nextChoice.price = priceRow?.areas?.SEA || "";
        nextChoice.areaPrices = priceRow?.areas || blankAreaPrices(areaOrder);
      }
      return normalizeModifierChoice(nextChoice, areaOrder, priceBook);
    };
    setSsmtData((current) => ({
      ...current,
      modifierGroups: current.modifierGroups.map((group) => (
        group.id === groupId
          ? { ...group, choices: group.choices.map((choice) => (choice.id === choiceId ? normalizePatch(choice, current.priceBook, current.areaOrder) : choice)) }
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
        modifierGroups: (item.modifierGroups || []).filter((name) => name !== groupName && name !== groupId),
      })),
    })));
    setModifierDialog((current) => current ? {
      ...current,
      item: { ...current.item, modifierGroups: (current.item.modifierGroups || []).filter((name) => name !== groupName && name !== groupId) },
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
    if (!deleteRequest) return;
    if (deleteRequest.type === "menu" && deleteConfirmText !== deleteRequest.name) return;
    if (deleteRequest.type !== "menu" && !deleteConfirmed) return;
    if (deleteRequest.type === "menu") {
      deleteSelectedMenu(deleteRequest.id);
    } else if (deleteRequest.type === "item" || deleteRequest.type === "divider" || deleteRequest.type === "submenu") {
      deleteItem(deleteRequest.id);
      setDeleteRequest(null);
      setDeleteConfirmed(false);
      setDeleteConfirmText("");
    } else if (deleteRequest.type === "modifier-group") {
      deleteModifierGroup(deleteRequest.id);
    } else if (deleteRequest.type === "modifier-item") {
      deleteModifierChoice(deleteRequest.groupId, deleteRequest.id);
    }
  };

  // Return the saved flag for an item on the current menu, if any.
  const existingFlagForItem = (item) =>
    (Array.isArray(selectedMenu?.flags) ? selectedMenu.flags : []).find(
      (flag) => flag.itemId && item?.id && flag.itemId === item.id,
    ) || null;

  // Clicking Flag on an already-flagged item asks whether to edit or clear it;
  // clicking Flag on an unflagged item opens a fresh flag dialog as before.
  const openFlagForItem = (item) => {
    const existing = existingFlagForItem(item);
    if (existing) {
      setFlagActionDialog({ item, flag: existing });
      return;
    }
    setFlagReason("Description correction");
    setFlagNote("");
    setFlagDialog({ item });
  };

  const editExistingFlag = () => {
    const { item, flag } = flagActionDialog || {};
    if (!item || !flag) return;
    setFlagReason(flag.reason || "Description correction");
    setFlagNote(flag.note || "");
    setFlagDialog({ item, editingFlagId: flag.id });
    setFlagActionDialog(null);
  };

  const clearExistingFlag = () => {
    const flag = flagActionDialog?.flag;
    if (!flag) {
      setFlagActionDialog(null);
      return;
    }
    const nextFlags = (selectedMenu.flags || []).filter((candidate) => candidate.id !== flag.id);
    updateSelectedMenu({ flags: nextFlags, editSignal: nextFlags.length > 0 });
    if (nextFlags.length === 0) setReportedFlag(null);
    setFlagActionDialog(null);
  };

  const saveFlag = () => {
    const item = flagDialog?.item;
    const editingFlagId = flagDialog?.editingFlagId;
    const itemName = item?.label || item?.name || "Selected row";
    const createdAt = new Date().toISOString();
    const existingFlags = selectedMenu.flags || [];
    let nextFlags;
    if (editingFlagId) {
      // Editing an item's existing flag replaces it in place rather than adding a duplicate.
      nextFlags = existingFlags.map((flag) =>
        flag.id === editingFlagId ? { ...flag, itemName, reason: flagReason, note: flagNote } : flag,
      );
    } else {
      const flag = {
        id: `flag-${selectedMenu.id}-${Date.now()}`,
        itemId: item?.id || "",
        itemName,
        reason: flagReason,
        note: flagNote,
        createdAt,
      };
      nextFlags = [...existingFlags, flag];
    }
    updateSelectedMenu({
      flags: nextFlags,
      editSignal: true,
      status: "Edit / resubmission needed",
    });
    setReportedFlag({ reason: flagReason, note: flagNote, itemName, count: nextFlags.length });
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
    <div className="min-h-screen bg-[#f5f6f1] px-2 py-4 text-slate-950 md:px-3">
      <div className="mx-auto w-full max-w-[2760px] space-y-3">
        <header className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <button onClick={() => requestLeaveCurrentMenu(onBackToPlatform)} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-bold text-slate-700 hover:bg-slate-100">
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
          <button type="button" onClick={() => requestLeaveCurrentMenu(() => setActiveView("home"))} className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-black ${activeView === "home" ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-800 hover:bg-slate-100"}`}>
            <ListChecks size={16} /> SSMT Start
          </button>
          <button type="button" onClick={() => requestLeaveCurrentMenu(() => setActiveView("pricing"))} className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-black ${activeView === "pricing" ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-800 hover:bg-slate-100"}`}>
            <DollarSign size={16} /> Pricing Structure
          </button>
          <button type="button" onClick={() => requestLeaveCurrentMenu(() => setActiveView("menus"))} className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-black ${activeView === "menus" ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-800 hover:bg-slate-100"}`}>
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
            className={`flex flex-col gap-2 rounded-lg border px-3 py-2 text-xs font-black sm:flex-row sm:items-center sm:justify-between ${
              workspaceSync.state === "synced"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : workspaceSync.state === "saving"
                  ? "border-sky-200 bg-sky-50 text-sky-900"
                : "border-amber-200 bg-amber-50 text-amber-900"
            }`}
          >
            <span>Shared workspace: {workspaceSync.message}</span>
            <button type="button" onClick={() => manualSaveWorkspace("SSMT workspace")} className="inline-flex items-center justify-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] font-black text-slate-800 hover:bg-slate-100">
              <Save size={13} /> Save SSMT workspace
            </button>
          </section>
        )}

        {reportedFlag && (
          <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold leading-6 text-emerald-950">
            {reportedFlag.count} saved item flag{reportedFlag.count === 1 ? "" : "s"} for {selectedMenu.name}. Latest flag saved for {reportedFlag.itemName}. Report email draft is ready for {ssmtData.reportRecipients.join(" and ")}.
            <a href={selectedFlagReportHref} className="ml-2 inline-flex items-center gap-1 underline">
              <Mail size={16} /> Open flag email
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
                <div className="grid gap-2 sm:grid-cols-[minmax(180px,1fr)_150px_150px_auto]">
                  <label className="grid gap-1 text-sm font-bold text-slate-700">
                    <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">New pricing category</span>
                    <input aria-label="New pricing category" value={newPriceCategory} onChange={(event) => setNewPriceCategory(event.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-bold outline-none focus:border-emerald-500" />
                  </label>
                  <label className="grid gap-1 text-sm font-bold text-slate-700">
                    <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">New SEA price</span>
                    <input aria-label="New SEA price" value={newPriceSea} onChange={(event) => setNewPriceSea(event.target.value)} placeholder="$0.00" className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-bold outline-none focus:border-emerald-500" />
                  </label>
                  <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black text-slate-700">
                    <input type="checkbox" checked={newPriceModifierOnly} onChange={(event) => setNewPriceModifierOnly(event.target.checked)} aria-label="New price modifier only" />
                    Modifier only
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
                      <th className="border-b border-slate-200 px-4 py-3">Modifier only</th>
                      {ssmtData.areaOrder.map((area) => <th key={area} className="border-b border-slate-200 px-4 py-3">{area}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {itemPriceOptions.map((price) => (
                      <tr key={price.id} className="odd:bg-white even:bg-slate-50/70">
                        <td className="border-b border-slate-100 px-4 py-3 font-black text-slate-950">{price.selectorLabel}</td>
                        <td className="border-b border-slate-100 px-4 py-3">
                          <input
                            type="checkbox"
                            checked={Boolean(price.modifierOnly)}
                            onChange={(event) => updatePricingRow(price.id, { modifierOnly: event.target.checked })}
                            aria-label={`Modifier only price ${price.selectorLabel}`}
                          />
                        </td>
                        {ssmtData.areaOrder.map((area) => (
                          <td key={area} className="border-b border-slate-100 px-2 py-2">
                            <input
                              aria-label={`${area} price for ${price.selectorLabel}`}
                              value={price.areas?.[area] || ""}
                              onChange={(event) => updatePricingArea(price.id, area, event.target.value)}
                              placeholder="0.00"
                              className="w-full min-w-[72px] rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-500"
                            />
                          </td>
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
                <div className="flex w-full flex-col gap-2 md:max-w-xl md:flex-row md:items-center">
                  <label className="relative block flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search menus..." className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-10 pr-3 text-sm font-bold outline-none focus:border-emerald-500" />
                  </label>
                  <label className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-xs font-black text-slate-700">
                    <input type="checkbox" checked={showHiddenMenus} onChange={(event) => setShowHiddenMenus(event.target.checked)} aria-label="Show hibernated menus" />
                    Show hibernated
                  </label>
                </div>
              </div>
              {flaggedMenus.length > 0 && (
                <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-bold leading-5 text-amber-950">
                  IT Department: {flaggedMenus.length} menu{flaggedMenus.length === 1 ? " has" : "s have"} been flagged for edit.
                </div>
              )}
              <div className="mt-4 grid grid-cols-2 gap-1.5 text-[11px] font-bold text-slate-700 sm:grid-cols-4 md:grid-cols-7">
                {phaseCounts.map(({ phase, count }) => (
                  <div key={phase} data-testid={`ssmt-phase-count-${phase}`} className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5"><span className="font-black text-slate-950">{count}</span> {phase}</div>
                ))}
                <div className={`rounded-lg border px-2 py-1.5 ${(totalItemFlagCount || flaggedMenus.length) ? "border-amber-300 bg-amber-50 text-amber-950" : "border-slate-200 bg-slate-50"}`}>
                  <span className={`font-black ${(totalItemFlagCount || flaggedMenus.length) ? "text-amber-950" : "text-slate-950"}`}>{totalItemFlagCount || flaggedMenus.length}</span> needs attention
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5"><span className="font-black text-slate-950">{hiddenMenuCount}</span> hibernated/expired</div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5"><span className="font-black text-slate-950">{visibleMenus.length}</span> visible menus</div>
              </div>
              <div data-testid="ssmt-menu-selector-grid" className="mt-4 grid gap-2 lg:grid-cols-4 xl:grid-cols-5">
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
                      {group.menus.map((menu) => {
                        const needsEdits = Boolean(menu.editSignal || (Array.isArray(menu.flags) && menu.flags.length));
                        const isComplete = menu.phase === "IT complete";
                        const workSignal = needsEdits ? "Needs edits" : isComplete ? "Complete" : "Needs completion";
                        return (
                        <div
                          key={menu.id}
                          className={`rounded-lg border bg-white p-2 text-left shadow-sm ${group.itemClass}`}
                        >
                          <button type="button" data-menu-name={menu.name} onClick={() => openMenu(menu.id)} className="block w-full text-left">
                            <span className="block whitespace-normal break-words text-sm font-black leading-4 text-slate-950">{menu.name}</span>
                            <span className="mt-1 flex flex-wrap items-center gap-1 text-[11px] font-bold text-slate-600">
                              <span>{menu.type}</span>
                              <span>{menu.phase}</span>
                              {Array.isArray(menu.flags) && menu.flags.length > 0 && <span>{menu.flags.length} flags</span>}
                              {(menu.hidden || menuIsAutoHibernated(menu)) && <span>Hibernated</span>}
                              <span className={`rounded px-1.5 py-0.5 font-black ${needsEdits ? "bg-amber-200 text-amber-950" : isComplete ? "bg-emerald-100 text-emerald-900" : "bg-rose-100 text-rose-900"}`}>{workSignal}</span>
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setMenus((current) => current.map((candidate) => (candidate.id === menu.id ? { ...candidate, hidden: !candidate.hidden } : candidate)))}
                            className="mt-2 inline-flex rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-black text-slate-700 hover:bg-slate-100"
                          >
                            {menu.hidden ? "Restore" : "Hibernate"}
                          </button>
                        </div>
                        );
                      })}
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
                <button type="button" onClick={() => requestLeaveCurrentMenu(() => setActiveView("menus"))} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-black text-slate-800 hover:bg-slate-100">
                  <ArrowLeft size={16} /> Back to menu selection
                </button>
                <button type="button" onClick={() => requestLeaveCurrentMenu(() => setActiveView("pricing"))} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-black text-slate-800 hover:bg-slate-100">
                  <DollarSign size={16} /> Pricing table
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => manualSaveWorkspace("menu")} className="inline-flex items-center gap-2 rounded-lg border border-sky-700 bg-sky-700 px-3 py-1.5 text-sm font-black text-white hover:bg-sky-800">
                  <Save size={16} /> Save menu
                </button>
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
                  <h2 className="mt-1 text-2xl font-black">{selectedMenu.name || "Unnamed menu"}</h2>
                  <p className="mt-1 text-sm font-semibold text-slate-600">{selectedMenu.type} / {selectedMenu.phase} / availability after IT complete</p>
                </div>
                <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700">Type: {selectedMenu.type}</span>
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-4">
                <label className="grid gap-1 text-sm font-bold text-slate-700">
                  <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Menu bucket</span>
                  <select
                    aria-label="Menu bucket"
                    value={selectedMenu.hidden || menuIsAutoHibernated(selectedMenu) ? "Hibernated" : selectedMenu.type}
                    onChange={(event) => (event.target.value === "Hibernated" ? hibernateMenu(selectedMenu.id) : moveMenuToType(selectedMenu.id, event.target.value))}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-bold outline-none focus:border-emerald-500"
                  >
                    {menuTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                    <option value="Hibernated">Hibernated</option>
                  </select>
                </label>
                <label className="grid gap-1 text-sm font-bold text-slate-700 md:col-span-2">
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Menu name</span>
                    <button
                      type="button"
                      aria-label={menuNameEditing ? "Done editing menu name" : "Edit menu name"}
                      onClick={() => setMenuNameEditing((current) => !current)}
                      className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] font-black text-slate-700 hover:bg-slate-100"
                    >
                      {menuNameEditing ? <Save size={12} /> : <Pencil size={12} />}
                      {menuNameEditing ? "Done" : "Edit"}
                    </button>
                  </span>
                  <input
                    aria-label="Menu name"
                    value={selectedMenu.name || ""}
                    readOnly={!menuNameEditing}
                    onChange={(event) => updateSelectedMenu({ name: event.target.value })}
                    onBlur={(event) => {
                      const cleanedName = event.target.value.trim();
                      if (cleanedName) updateSelectedMenu({ name: cleanedName });
                    }}
                    className={`rounded-lg border border-slate-300 px-3 py-2 font-bold outline-none focus:border-emerald-500 ${menuNameEditing ? "bg-white" : "cursor-default bg-slate-100 text-slate-700"}`}
                  />
                </label>
                <label className="grid gap-1 text-sm font-bold text-slate-700">
                  <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Centric menu name</span>
                  <input
                    aria-label="Centric menu name"
                    value={selectedMenu.centricMenuName || ""}
                    onChange={(event) => updateSelectedMenu({ centricMenuName: event.target.value })}
                    placeholder="Enter Centric name"
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-bold outline-none focus:border-emerald-500"
                  />
                </label>
                <label className="grid gap-1 text-sm font-bold text-slate-700">
                  <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Webtrition Master Menu name</span>
                  <input
                    aria-label="Webtrition Master Menu name"
                    value={selectedMenu.webtritionMasterMenuName || ""}
                    onChange={(event) => updateSelectedMenu({ webtritionMasterMenuName: event.target.value })}
                    placeholder="Enter Webtrition name"
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-bold outline-none focus:border-emerald-500"
                  />
                </label>
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
                <label className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-black text-amber-950">
                  <input type="checkbox" checked={Boolean(selectedMenu.editSignal)} onChange={(event) => updateSelectedMenu({ editSignal: event.target.checked, status: event.target.checked ? "Edit / resubmission needed" : selectedMenu.phase })} />
                  Edit signal
                </label>
              </div>
              {selectedMenuFlags.length > 0 && (
                <div className="mt-3 flex flex-col gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-950 sm:flex-row sm:items-center sm:justify-between">
                  <span>{selectedMenuFlags.length} saved flag{selectedMenuFlags.length === 1 ? "" : "s"} on this menu.</span>
                  <div className="flex flex-wrap items-center gap-2">
                    <a href={selectedFlagReportHref} className="inline-flex items-center justify-center gap-2 rounded-lg border border-amber-700 bg-white px-3 py-2 text-xs font-black text-amber-900 hover:bg-amber-100">
                      <Mail size={14} /> Report flags ({selectedMenuFlags.length})
                    </a>
                    <button type="button" onClick={() => setClearFlagsPrompt(true)} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-400 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-100">
                      <Trash2 size={14} /> Clear flags
                    </button>
                  </div>
                </div>
              )}
            </section>

            <section data-testid="ssmt-builder-sections" className="overflow-hidden rounded-lg border border-sky-300 bg-white shadow-sm shadow-sky-100">
              <div data-testid="ssmt-builder-section-main" className="m-3 flex flex-col gap-2 rounded-lg border border-sky-300 bg-gradient-to-r from-sky-50 to-white p-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-600 text-white shadow-sm">
                    <ListChecks size={20} />
                  </span>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-700">Menu Items</p>
                    <h2 className="mt-1 text-xl font-black">Main Menu Items <span className="ml-1 text-base text-slate-700">Builder rows</span></h2>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={addItem} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-black text-slate-800 hover:bg-slate-100">
                    <Plus size={16} /> Add item
                  </button>
                  <button type="button" onClick={addDivider} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-black text-slate-800 hover:bg-slate-100">
                    <Plus size={16} /> Add divider
                  </button>
                  <button type="button" onClick={addSubmenuDivider} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-black text-white hover:bg-slate-800">
                    <Plus size={16} /> Add sub menu
                  </button>
                </div>
              </div>
              <div data-testid="ssmt-derived-source-preview" className="border-y border-sky-200 bg-sky-50/60 px-4 py-2 text-xs font-bold text-slate-600">
                {selectedDerivedMenus.length ? (
                  <span>Downstream SSMT menus after IT complete: {selectedDerivedMenus.map((entry) => `${entry.menu} (${entry.count})`).join(", ")}</span>
                ) : (
                  <span>Downstream SSMT menus appear here after this menu reaches IT complete.</span>
                )}
              </div>
              <div data-testid="ssmt-builder-scroll" className="max-h-[74vh] overflow-auto">
                <table className="w-full min-w-[2680px] table-fixed border-collapse text-left text-xs">
                  <colgroup>
                    <col className="w-[46px]" />
                    <col className="w-[52px]" />
                    <col className="w-[240px]" />
                    <col className="w-[320px]" />
                    <col className="w-[400px]" />
                    <col className="w-[112px]" />
                    <col className="w-[72px]" />
                    <col className="w-[170px]" />
                    <col className="w-[118px]" />
                    <col className="w-[128px]" />
                    <col className="w-[130px]" />
                    <col className="w-[150px]" />
                    <col className="w-[160px]" />
                    <col className="w-[430px]" />
                    <col className="w-[140px]" />
                  </colgroup>
                  <thead className="sticky top-0 z-10 bg-slate-100 text-xs font-black uppercase tracking-[0.12em] text-slate-600 shadow-sm">
                    <tr>
                      {["Move", "Diet", "Fixy", "Label", "Description", "MRN", "Calories", "SEA price", "Category", "Secondary category", "Vegan / Vegetarian", "Scan & Pay", "Photo link", "Area prices", "Actions"].map((header) => (
                        <th key={header} className="border-b border-slate-400 px-2 py-1.5">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody data-testid="ssmt-builder-body">
                    {(() => {
                      const visibleBuilderRows = selectedMenu.items.slice(0, 80);
                      let activeSectionTone = "main";
                      let activePalette = SSMT_BUILDER_MAIN_PALETTE;
                      let dividerColorIndex = 0;
                      let submenuColorIndex = 0;
                      return visibleBuilderRows.map((item) => (
                      item.recordType === "divider" ? (
                        (() => {
                          const isSubmenu = item.dividerKind === "submenu";
                          const palette = isSubmenu
                            ? SSMT_SUBMENU_PALETTES[submenuColorIndex % SSMT_SUBMENU_PALETTES.length]
                            : SSMT_DIVIDER_PALETTES[dividerColorIndex % SSMT_DIVIDER_PALETTES.length];
                          if (isSubmenu) submenuColorIndex += 1; else dividerColorIndex += 1;
                          activePalette = palette;
                          activeSectionTone = isSubmenu ? "submenu" : "divider";
                          return (
                        <tr
                          key={item.id}
                          data-testid={`${isSubmenu ? "ssmt-row-submenu" : "ssmt-row-divider"}-${item.id}`}
                          data-row-kind={isSubmenu ? "submenu" : "divider"}
                          draggable
                          onDragStart={() => { draggedRowIdRef.current = item.id; }}
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={() => moveRow(draggedRowIdRef.current, item.id)}
                          className={`${palette.headerRowClass} text-slate-950`}
                        >
                          <td className={`border-b px-2 py-2 ${palette.headerGripClass}`}><GripVertical size={16} /></td>
                          <td colSpan={13} className={`border-b px-2 py-2 ${palette.headerCellBorderClass}`}>
                            <div
                              data-testid={`${isSubmenu ? "ssmt-builder-section-submenu" : "ssmt-builder-section-divider"}-${item.id}`}
                              className={`flex flex-col gap-2 rounded-lg border p-2 md:flex-row md:items-center md:justify-between ${palette.headerBoxClass}`}
                            >
                              <label className="flex flex-1 flex-col gap-1 md:flex-row md:items-center">
                                <span className={`inline-flex items-center rounded-full px-2 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-white ${palette.badgeClass}`}>
                                  {isSubmenu ? "Sub Menu" : "Divider"}
                                </span>
                                <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{isSubmenu ? "Title" : "Title"}</span>
                                <input aria-label={isSubmenu ? "Sub menu title" : "Divider title"} value={item.title} onChange={(event) => updateDivider(item.id, event.target.value)} className="min-w-[260px] rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-black text-slate-950 outline-none focus:border-emerald-500" />
                              </label>
                              <button type="button" onClick={() => requestDelete({ type: isSubmenu ? "submenu" : "divider", id: item.id, name: item.title || (isSubmenu ? "sub menu" : "divider") })} className="inline-flex items-center justify-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-black text-red-800 hover:bg-red-100" aria-label={isSubmenu ? `Delete sub menu ${item.title || "sub menu"}` : `Delete divider ${item.title || "divider"}`}>
                                <Trash2 size={13} /> Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                          );
                        })()
                      ) : (
                        (() => {
                          const sectionToneName = activeSectionTone;
                          const sectionTone = activePalette;
                          const builderCellClass = `border-b ${sectionTone.itemCellBorderClass} px-2 py-1`;
                          return (
                        <tr
                          key={item.id}
                          data-testid={`ssmt-row-item-${item.id}`}
                          data-row-kind="item"
                          data-section-tone={sectionToneName}
                          draggable
                          onDragStart={() => { draggedRowIdRef.current = item.id; }}
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={() => moveRow(draggedRowIdRef.current, item.id)}
                          className={`align-top ${sectionTone.itemRowClass} ${item.lockedForCentric ? "outline outline-1 -outline-offset-1 outline-emerald-500" : ""}`}
                        >
                          <td className={`${builderCellClass} ${sectionTone.itemHandleClass}`}><GripVertical size={16} /></td>
                          <td className={`${builderCellClass} text-center`}>
                            {item.dietaryPreference ? (
                              <span
                                aria-label={`Dietary tag for ${item.label || item.name || "item"}: ${item.dietaryPreference}`}
                                title={item.dietaryPreference}
                                className={`inline-flex h-7 w-7 items-center justify-center rounded-full border-2 text-[10px] font-black ${item.dietaryPreference === "Vegan" ? "border-emerald-800 bg-emerald-600 text-white" : "border-lime-700 bg-lime-300 text-lime-950"}`}
                              >
                                {item.dietaryPreference === "Vegan" ? "VN" : "V"}
                              </span>
                            ) : null}
                          </td>
                          <td className={builderCellClass}>
                            <input
                              aria-label={`Fixy for ${item.label || item.name || "item"}`}
                              value={item.fohColumn || ""}
                              onChange={(event) => updateItem(item.id, { fohColumn: event.target.value })}
                              onClick={() => copyLockedField(item, item.fohColumn, "Fixy")}
                              readOnly={Boolean(item.lockedForCentric)}
                              className={`w-full rounded-md border border-slate-300 px-2 py-1 text-xs font-bold outline-none focus:border-emerald-500 ${item.lockedForCentric ? "cursor-copy bg-emerald-50 text-slate-950" : "bg-white"}`}
                            />
                          </td>
                          <td className={builderCellClass}>
                            <input
                              aria-label="Item label"
                              value={item.label}
                              onChange={(event) => updateItem(item.id, { label: normalizeLabel(event.target.value) })}
                              onClick={() => copyLockedField(item, item.label, "Label")}
                              readOnly={Boolean(item.lockedForCentric)}
                              className={`w-full rounded-md border border-slate-300 px-2 py-1 text-xs font-black outline-none focus:border-emerald-500 ${item.lockedForCentric ? "cursor-copy bg-emerald-50 text-slate-950" : "bg-white"}`}
                            />
                          </td>
                          <td className={builderCellClass}>
                            <textarea
                              aria-label="Description"
                              value={item.description}
                              onChange={(event) => updateItem(item.id, { description: normalizeDescription(event.target.value) })}
                              onClick={() => copyLockedField(item, item.description, "Description")}
                              readOnly={Boolean(item.lockedForCentric)}
                              className={`h-14 w-full resize-y rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold leading-4 outline-none focus:border-emerald-500 ${item.lockedForCentric ? "cursor-copy bg-emerald-50 text-slate-950" : "bg-white"}`}
                            />
                          </td>
                          <td className={builderCellClass}>
                            <input
                              aria-label={`MRN for ${item.label || item.name || "item"}`}
                              value={item.mrn || ""}
                              onChange={(event) => updateItem(item.id, { mrn: event.target.value })}
                              onClick={() => copyLockedField(item, item.mrn, "MRN")}
                              readOnly={Boolean(item.lockedForCentric)}
                              className={`w-full rounded-md border border-slate-300 px-2 py-1 font-mono text-xs font-bold outline-none focus:border-emerald-500 ${item.lockedForCentric ? "cursor-copy bg-emerald-50 text-slate-950" : "bg-white"}`}
                            />
                          </td>
                          <td className={`${builderCellClass} font-bold text-slate-700`}>
                            {selectedMenu.type === "Promotion" ? (
                              <input
                                aria-label={`Calories for ${item.label || item.name || "item"}`}
                                value={item.calories || ""}
                                onChange={(event) => updateItem(item.id, { calories: event.target.value })}
                                onClick={() => copyLockedField(item, item.calories, "Calories")}
                                readOnly={Boolean(item.lockedForCentric)}
                                placeholder="TBD"
                                className={`w-full rounded-md border border-slate-300 px-2 py-1 text-xs font-bold outline-none focus:border-emerald-500 ${item.lockedForCentric ? "cursor-copy bg-emerald-50 text-slate-950" : "bg-white"}`}
                              />
                            ) : (
                              "N/A"
                            )}
                          </td>
                          <td className={builderCellClass}>
                            <select
                              aria-label={`SEA price for ${item.label || item.name || "item"}`}
                              value={item.priceSelectorId || ""}
                              onChange={(event) => assignItemPrice(item.id, event.target.value)}
                              disabled={Boolean(item.lockedForCentric)}
                              className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-black text-slate-900"
                            >
                              <option value="">Select SEA price</option>
                              {itemPriceOptions.map((price) => (
                                <option key={price.id} value={price.id}>{price.selectorLabel}</option>
                              ))}
                            </select>
                            {item.workbookSeaPrice && item.priceReviewStatus === "Needs pricing structure match" && (
                              <p className="mt-1 text-[10px] font-bold leading-3 text-amber-700">Workbook value needs pricing structure match.</p>
                            )}
                          </td>
                          <td className={builderCellClass}>
                            <input
                              aria-label={`Category for ${item.label || item.name || "item"}`}
                              value={item.category || ""}
                              onChange={(event) => updateItem(item.id, { category: event.target.value })}
                              onClick={() => copyLockedField(item, item.category, "Category")}
                              readOnly={Boolean(item.lockedForCentric)}
                              className={`w-full rounded-md border border-slate-300 px-2 py-1 text-xs font-bold outline-none focus:border-emerald-500 ${item.lockedForCentric ? "cursor-copy bg-emerald-50 text-slate-950" : "bg-white"}`}
                            />
                          </td>
                          <td className={builderCellClass}>
                            <input
                              aria-label={`Secondary category for ${item.label || item.name || "item"}`}
                              value={item.secondaryCategory || item.reportingCategorySecondary || ""}
                              onChange={(event) => updateItem(item.id, { secondaryCategory: event.target.value, reportingCategorySecondary: event.target.value })}
                              onClick={() => copyLockedField(item, item.secondaryCategory || item.reportingCategorySecondary, "Secondary category")}
                              readOnly={Boolean(item.lockedForCentric)}
                              className={`w-full rounded-md border border-slate-300 px-2 py-1 text-xs font-bold outline-none focus:border-emerald-500 ${item.lockedForCentric ? "cursor-copy bg-emerald-50 text-slate-950" : "bg-white"}`}
                            />
                          </td>
                          <td className={builderCellClass}>
                            <select
                              aria-label={`Vegan or vegetarian for ${item.label || item.name || "item"}`}
                              value={item.dietaryPreference || ""}
                              onChange={(event) => updateItem(item.id, { dietaryPreference: event.target.value })}
                              disabled={Boolean(item.lockedForCentric)}
                              className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-bold text-slate-900 disabled:cursor-not-allowed disabled:bg-emerald-50 disabled:text-slate-950"
                            >
                              <option value=""></option>
                              <option value="Vegan">Vegan</option>
                              <option value="Vegetarian">Vegetarian</option>
                            </select>
                          </td>
                          <td className={builderCellClass}>
                            <input
                              aria-label={`Scan and Pay UPC for ${item.label || item.name || "item"}`}
                              value={item.scanPayUpc || ""}
                              onChange={(event) => updateItem(item.id, { scanPayUpc: event.target.value })}
                              onClick={() => copyLockedField(item, item.scanPayUpc, "Scan & Pay UPC")}
                              readOnly={Boolean(item.lockedForCentric)}
                              placeholder="UPC"
                              className={`w-full rounded-md border border-slate-300 px-2 py-1 font-mono text-xs font-bold outline-none focus:border-emerald-500 ${item.lockedForCentric ? "cursor-copy bg-emerald-50 text-slate-950" : "bg-white"}`}
                            />
                          </td>
                          <td className={builderCellClass}>
                            <input
                              aria-label={`Photo link for ${item.label || item.name || "item"}`}
                              value={item.photoLink || ""}
                              onChange={(event) => updateItem(item.id, { photoLink: event.target.value })}
                              placeholder="Link to source photo"
                              className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold outline-none focus:border-emerald-500"
                            />
                          </td>
                          <td className={builderCellClass}>
                            <div aria-label={`Area prices for ${item.label || item.name || "item"}`} className={SSMT_AREA_PRICE_GRID_CLASS}>
                              {ssmtData.areaOrder.map((area) => (
                                <button
                                  key={area}
                                  type="button"
                                  aria-label={`Copy ${area} price for ${item.label || item.name || "item"}`}
                                  disabled={!item.lockedForCentric || !item.areaPrices?.[area]}
                                  onClick={() => copyForCentric(priceDigitsOnly(item.areaPrices?.[area]), `${area} price`)}
                                  className="flex min-w-0 flex-col items-center rounded border border-slate-300 bg-white px-1 py-0.5 text-center disabled:cursor-not-allowed disabled:text-slate-700 disabled:opacity-100 enabled:cursor-copy enabled:border-emerald-400 enabled:bg-emerald-50 enabled:hover:bg-emerald-100"
                                >
                                  <span className="font-black text-slate-500">{area}</span>
                                  <span>{item.areaPrices?.[area] || "TBD"}</span>
                                </button>
                              ))}
                            </div>
                          </td>
                          <td className={builderCellClass}>
                            <div className="grid grid-cols-2 gap-1">
                              {(() => {
                                const matchedGroups = matchedModifierGroupsForItemIndexed(item, modifierGroupIndex);
                                const modsCount = matchedGroups.length;
                                const modsReady = matchedGroups.every((group) => Boolean(group.lockedForCentric));
                                const lockBlocked = !item.lockedForCentric && !modsReady;
                                return (
                                  <>
                                    <button type="button" aria-label={`View modifiers Mods (${modsCount}), ${modsReady ? "all locked" : "not all locked"}`} onClick={() => openModifierDialog(item)} className={`inline-flex items-center justify-center gap-1 rounded-md border px-2 py-1.5 text-xs font-black text-white shadow-sm ${modsReady ? "border-green-800 bg-green-700 hover:bg-green-800" : "border-red-800 bg-red-600 hover:bg-red-700"}`}>
                                      <Tags size={14} /> Mods ({modsCount})
                                    </button>
                                    <button type="button" onClick={() => updateItem(item.id, { lockedForCentric: !item.lockedForCentric })} disabled={lockBlocked} title={lockBlocked ? "Lock all modifier groups for this item first" : undefined} className={`inline-flex items-center justify-center gap-1 rounded-md border px-2 py-1.5 text-xs font-black ${item.lockedForCentric ? "border-emerald-700 bg-emerald-700 text-white hover:bg-emerald-800" : "border-slate-300 bg-slate-50 text-slate-800 hover:bg-slate-100"} disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400`} aria-label={`${item.lockedForCentric ? "Unlock" : "Lock"} item ${item.label || item.name || "item"}${lockBlocked ? " (locked out until all modifier groups are locked)" : ""}`}>
                                      {item.lockedForCentric ? <Lock size={14} /> : <Unlock size={14} />} {item.lockedForCentric ? "Locked" : "Lock"}
                                    </button>
                                  </>
                                );
                              })()}
                              <button type="button" aria-label={existingFlagForItem(item) ? `Edit or clear flag for ${item.label || item.name || "item"}` : "Flag for change"} onClick={() => openFlagForItem(item)} className={`inline-flex items-center justify-center gap-1 rounded-md border px-2 py-1.5 text-xs font-black ${existingFlagForItem(item) ? "border-amber-600 bg-amber-500 text-white hover:bg-amber-600" : "border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100"}`}>
                                <Flag size={14} /> {existingFlagForItem(item) ? "Flagged" : "Flag"}
                              </button>
                              <button type="button" onClick={() => requestDelete({ type: "item", id: item.id, name: item.label || item.name || "item" })} disabled={Boolean(item.lockedForCentric)} className="inline-flex items-center justify-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 py-1.5 text-xs font-black text-red-800 hover:bg-red-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400" aria-label={`Delete item ${item.label || item.name || "item"}`}>
                                <Trash2 size={14} /> Del
                              </button>
                            </div>
                          </td>
                        </tr>
                          );
                        })()
                      )
                    ));
                  })()}
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
              <p className="text-sm font-semibold leading-6 text-slate-700">For {modifierDialog.item.label || modifierDialog.item.name}, copy places a modifier group on the SSMT clipboard for paste onto another item. Prices stay tied to Pricing Structure rows.</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => manualSaveWorkspace("modifiers")} className="inline-flex items-center justify-center gap-2 rounded-lg border border-sky-700 bg-sky-700 px-3 py-2 text-xs font-black text-white hover:bg-sky-800">
                  <Save size={14} /> Save modifiers
                </button>
                {modifierClipboard && (
                  <button type="button" onClick={() => pasteModifierGroup()} className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-700 bg-emerald-700 px-3 py-2 text-xs font-black text-white hover:bg-emerald-800">
                    <Copy size={14} /> Paste modifier group
                  </button>
                )}
                <button type="button" onClick={addModifierGroup} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-800 hover:bg-slate-100">
                  <Plus size={14} /> Add modifier group
                </button>
              </div>
            </div>
            <div className="grid gap-2 md:grid-cols-4">
              {modifierClipboardSlots.map((slot, index) => (
                <div key={slot.id} className="rounded-lg border border-slate-300 bg-white p-2 text-xs font-bold text-slate-700">
                  <p className="font-black text-slate-950">{slot.label}: {slot.group?.name || "Empty slot"}</p>
                  {slot.group ? (
                    <div className="mt-2 flex items-stretch gap-1">
                      <button type="button" onClick={() => pasteModifierGroup(slot.group)} className="inline-flex w-3/4 items-center justify-center gap-1 rounded-md border border-emerald-700 bg-emerald-700 px-2 py-1 text-[11px] font-black text-white hover:bg-emerald-800">
                        <Copy size={13} /> Paste slot {index + 1}
                      </button>
                      <button type="button" onClick={() => clearModifierClipboardSlot(index)} aria-label={`Clear slot ${index + 1}`} className="inline-flex w-1/4 items-center justify-center rounded-md border border-red-300 bg-red-50 px-2 py-1 text-[11px] font-black text-red-800 hover:bg-red-100">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ) : (
                    <p className="mt-2 text-[11px] text-slate-500">Save a group here.</p>
                  )}
                </div>
              ))}
            </div>
            {copiedModifierNotice && <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-black text-emerald-900">{copiedModifierNotice}</p>}
            {!modifierDialog.groups.length && (
              <p className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-600">No modifier groups attached.</p>
            )}
            {modifierDialog.groups.map((group) => {
              const modifierType = modifierTypeForGroup(group);
              const typeStyle = MODIFIER_TYPE_STYLES[modifierType] || MODIFIER_TYPE_STYLES.Addition;
              const ModifierTypeIcon = typeStyle.Icon;
              return (
              <section
                key={group.id}
                data-testid={`ssmt-modifier-group-${group.id}`}
                data-modifier-type={modifierType}
                draggable
                onDragStart={() => { draggedModifierGroupIdRef.current = group.id; }}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => moveModifierGroup(draggedModifierGroupIdRef.current, group.id)}
                className={`overflow-hidden rounded-lg border ${typeStyle.borderClass} ${typeStyle.cardClass}`}
                style={group.lockedForCentric ? { borderColor: "#059669", borderWidth: "2px" } : undefined}
              >
                <div className={`grid gap-3 border-b p-3 lg:grid-cols-[auto_minmax(240px,1fr)_170px_130px_130px] lg:items-end ${typeStyle.headerClass}`}>
                  <span className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-white shadow-sm ${typeStyle.iconClass}`} title={`${modifierType} modifier group`}>
                    <ModifierTypeIcon size={19} />
                  </span>
                  <label className="grid gap-1">
                    <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Modifier group name</span>
                    <input
                      aria-label="Modifier group name"
                      value={group.name}
                      onChange={(event) => updateModifierGroupDraft(group.id, { name: event.target.value })}
                      onBlur={(event) => updateModifierGroup(group.id, { name: event.target.value })}
                      onKeyDown={(event) => {
                        if (event.key === "Escape") updateModifierGroup(group.id, { name: event.currentTarget.value });
                      }}
                      readOnly={Boolean(group.lockedForCentric)}
                      className={`rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-black outline-none focus:border-emerald-500 ${group.lockedForCentric ? "cursor-copy bg-emerald-50" : "bg-white"}`}
                    />
                  </label>
                  <label className="grid gap-1">
                    <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Modifier group type</span>
                    <select
                      aria-label="Modifier group type"
                      value={modifierType}
                      onChange={(event) => updateModifierGroup(group.id, { modifierType: event.target.value })}
                      disabled={Boolean(group.lockedForCentric)}
                      className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-black"
                    >
                      {MODIFIER_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                    </select>
                  </label>
                  <label className="grid min-w-0 gap-1">
                    <span className="block max-w-full whitespace-normal text-[10px] font-black uppercase leading-3 tracking-[0.08em] text-slate-500">Min selections</span>
                    <input type="number" min="0" aria-label="Minimum selections" value={group.minQty ?? ""} onChange={(event) => updateModifierGroup(group.id, { minQty: event.target.value })} readOnly={Boolean(group.lockedForCentric)} className={`w-full min-w-0 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-black outline-none focus:border-emerald-500 ${group.lockedForCentric ? "cursor-copy bg-emerald-50" : "bg-white"}`} />
                  </label>
                  <label className="grid min-w-0 gap-1">
                    <span className="block max-w-full whitespace-normal text-[10px] font-black uppercase leading-3 tracking-[0.08em] text-slate-500">Max selections</span>
                    <input type="number" min="0" aria-label="Maximum selections" value={group.maxQty ?? ""} onChange={(event) => updateModifierGroup(group.id, { maxQty: event.target.value })} readOnly={Boolean(group.lockedForCentric)} className={`w-full min-w-0 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-black outline-none focus:border-emerald-500 ${group.lockedForCentric ? "cursor-copy bg-emerald-50" : "bg-white"}`} />
                  </label>
                  <div className="flex flex-wrap gap-2 lg:col-start-2 lg:col-span-4 lg:justify-start">
                    <button type="button" onClick={() => addModifierChoice(group.id)} disabled={Boolean(group.lockedForCentric)} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-800 hover:bg-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400">
                      <Plus size={14} /> Add modifier item line
                    </button>
                    <button type="button" onClick={() => requestDelete({ type: "modifier-group", id: group.id, name: group.name })} disabled={Boolean(group.lockedForCentric)} className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-black text-red-800 hover:bg-red-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400">
                      <Trash2 size={14} /> Delete modifier group
                    </button>
                    {modifierClipboardSlots.map((slot, index) => (
                      <button key={slot.id} type="button" onClick={() => saveModifierGroupToClipboardSlot(group, index)} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-800 hover:bg-slate-100">
                        <Copy size={14} /> Save group to slot {index + 1}
                      </button>
                    ))}
                    <button type="button" onClick={() => toggleModifierGroupLock(group.id)} className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-black ${group.lockedForCentric ? "border-emerald-700 bg-emerald-700 text-white hover:bg-emerald-800" : "border-slate-300 bg-white text-slate-800 hover:bg-slate-100"}`} aria-label={`${group.lockedForCentric ? "Unlock" : "Lock"} modifier group ${group.name}`}>
                      {group.lockedForCentric ? <Lock size={14} /> : <Unlock size={14} />} {group.lockedForCentric ? "Locked" : "Lock group"}
                    </button>
                  </div>
                </div>

                <div className="max-h-[52vh] overflow-auto bg-white">
                  <table className="w-full min-w-[1340px] table-fixed border-collapse text-left text-xs">
                    <colgroup>
                      <col className="w-[155px]" />
                      <col className="w-[190px]" />
                      <col className="w-[96px]" />
                      <col className="w-[70px]" />
                      <col className="w-[130px]" />
                      <col className="w-[590px]" />
                      <col className="w-[109px]" />
                    </colgroup>
                    <thead className="sticky top-0 bg-slate-100 font-black uppercase tracking-[0.1em] text-slate-600">
                      <tr>
                        {["Modifier name", "Description", "MRN", "Calories", "Price", "Area prices", "Actions"].map((header) => (
                          <th key={header} className="border-b border-slate-400 px-2 py-1.5">{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(group.choices || []).map((choice) => (
                        <tr key={choice.id} className="align-top odd:bg-white even:bg-slate-100/80">
                          <td className="border-b border-slate-400 px-2 py-0.5">
                            <input
                              aria-label="Modifier name"
                              value={choice.label || ""}
                              onChange={(event) => updateModifierChoice(group.id, choice.id, { label: event.target.value })}
                              readOnly={Boolean(group.lockedForCentric)}
                              onClick={group.lockedForCentric ? (event) => { event.currentTarget.select(); copyForCentric(choice.label, "Modifier name"); } : undefined}
                              className={`w-full min-w-0 rounded-md border border-slate-300 px-2 py-1 text-xs font-normal outline-none focus:border-emerald-500 ${group.lockedForCentric ? "cursor-copy bg-emerald-50" : "bg-white"}`}
                            />
                          </td>
                          <td className="border-b border-slate-400 px-2 py-0.5">
                            <textarea
                              aria-label="Modifier description"
                              value={choice.description || ""}
                              onChange={(event) => updateModifierChoice(group.id, choice.id, { description: event.target.value })}
                              readOnly={Boolean(group.lockedForCentric)}
                              onClick={group.lockedForCentric ? (event) => { event.currentTarget.select(); copyForCentric(choice.description, "Modifier description"); } : undefined}
                              className={`h-10 w-full min-w-0 resize-y rounded-md border border-slate-300 px-2 py-1 text-xs font-normal leading-4 outline-none focus:border-emerald-500 ${group.lockedForCentric ? "cursor-copy bg-emerald-50" : "bg-white"}`}
                            />
                          </td>
                          <td className="border-b border-slate-400 px-2 py-0.5">
                            <input
                              aria-label="Modifier MRN"
                              value={choice.mrn || ""}
                              onChange={(event) => updateModifierChoice(group.id, choice.id, { mrn: event.target.value })}
                              readOnly={Boolean(group.lockedForCentric)}
                              onClick={group.lockedForCentric ? (event) => { event.currentTarget.select(); copyForCentric(choice.mrn, "Modifier MRN"); } : undefined}
                              className={`w-full min-w-0 rounded-md border border-slate-300 px-2 py-1 font-mono text-xs font-normal outline-none focus:border-emerald-500 ${group.lockedForCentric ? "cursor-copy bg-emerald-50" : "bg-white"}`}
                            />
                          </td>
                          <td className="border-b border-slate-400 px-2 py-0.5">
                            <input
                              aria-label="Modifier calories"
                              value={choice.calories || ""}
                              onChange={(event) => updateModifierChoice(group.id, choice.id, { calories: event.target.value })}
                              readOnly={Boolean(group.lockedForCentric)}
                              onClick={group.lockedForCentric ? (event) => { event.currentTarget.select(); copyForCentric(choice.calories, "Modifier calories"); } : undefined}
                              className={`w-full min-w-0 rounded-md border border-slate-300 px-2 py-1 text-xs font-normal outline-none focus:border-emerald-500 ${group.lockedForCentric ? "cursor-copy bg-emerald-50" : "bg-white"}`}
                            />
                          </td>
                          <td className="border-b border-slate-400 px-2 py-0.5">
                            <select
                              aria-label="Modifier price"
                              value={choice.priceSelectorId || ""}
                              onChange={(event) => updateModifierChoice(group.id, choice.id, { priceSelectorId: event.target.value })}
                              disabled={Boolean(group.lockedForCentric)}
                              className="w-full min-w-0 rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] font-semibold text-slate-900"
                            >
                              <option value="">Select price</option>
                              {modifierPriceOptions.map((price) => (
                                <option key={price.id} value={price.id} data-price-kind={price.modifierOnly ? "modifier" : "standard"}>{price.selectorLabel}</option>
                              ))}
                            </select>
                            <p className="mt-0.5 text-[10px] font-bold leading-3 text-slate-500">{choice.price || "TBD"}</p>
                          </td>
                          <td className="border-b border-slate-400 px-2 py-0.5">
                            <div className={SSMT_AREA_PRICE_GRID_CLASS}>
                              {ssmtData.areaOrder.map((area) => (
                                <span key={area} className="flex min-w-0 flex-col items-center rounded border border-slate-300 bg-white px-1 py-0.5 text-center">
                                  <span className="font-black text-slate-500">{area}</span>
                                  <span>{choice.areaPrices?.[area] || "TBD"}</span>
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="border-b border-slate-400 px-2 py-0.5">
                            <button type="button" aria-label="Delete modifier item line" onClick={() => requestDelete({ type: "modifier-item", groupId: group.id, id: choice.id, name: choice.label || "modifier item" })} disabled={Boolean(group.lockedForCentric)} className="inline-flex w-full min-w-0 items-center justify-center gap-1 rounded-md border border-red-300 bg-red-50 px-2 py-1 text-[11px] font-black text-red-800 hover:bg-red-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400">
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
              </section>
              );
            })}
          </div>
        </Modal>
      )}

      {flagActionDialog && (
        <Modal title="This item is already flagged" onClose={() => setFlagActionDialog(null)}>
          <div className="space-y-4">
            <p className="text-sm font-bold text-slate-700">
              {flagActionDialog.item?.label || flagActionDialog.item?.name || "This item"} already has a saved flag ({flagActionDialog.flag?.reason || "no reason"}). Do you want to edit it or clear it?
            </p>
            <div className="flex flex-wrap justify-end gap-2">
              <button type="button" onClick={() => setFlagActionDialog(null)} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-black text-slate-800 hover:bg-slate-100">
                Cancel
              </button>
              <button type="button" onClick={clearExistingFlag} className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-black text-red-800 hover:bg-red-100">
                <Trash2 size={16} /> Clear flag
              </button>
              <button type="button" onClick={editExistingFlag} className="inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-sm font-black text-white hover:bg-slate-800">
                <Flag size={16} /> Edit flag
              </button>
            </div>
          </div>
        </Modal>
      )}

      {flagDialog && (
        <Modal title={flagDialog.editingFlagId ? "Edit item flag" : "Flag for change"} onClose={() => setFlagDialog(null)}>
          <div className="space-y-4">
            <p className="text-sm font-bold text-slate-700">Save this item flag on the SSMT menu. Use Report flags after one or more flags are saved to open the Tyler/Alex email draft.</p>
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
            <button type="button" onClick={saveFlag} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-3 text-sm font-black text-white hover:bg-slate-800">
              <Flag size={18} /> {flagDialog.editingFlagId ? "Update flag" : "Save flag and report"}
            </button>
          </div>
        </Modal>
      )}

      {deleteRequest && (
        <DeleteConfirmationModal
          request={deleteRequest}
          confirmed={deleteConfirmed}
          onConfirmedChange={setDeleteConfirmed}
          confirmText={deleteConfirmText}
          onConfirmTextChange={setDeleteConfirmText}
          onClose={() => {
            setDeleteRequest(null);
            setDeleteConfirmed(false);
            setDeleteConfirmText("");
          }}
          onDelete={confirmDelete}
        />
      )}
      {leaveMenuPrompt && (
        <Modal title="Unreported flags on this menu" onClose={cancelLeaveCurrentMenu}>
          <div className="space-y-4">
            <p className="text-sm font-semibold leading-6 text-slate-700">
              Exiting this menu with unreported flags. Do you wish to continue? Leaving clears the {Array.isArray(selectedMenu?.flags) ? selectedMenu.flags.length : 0} saved flag{(Array.isArray(selectedMenu?.flags) ? selectedMenu.flags.length : 0) === 1 ? "" : "s"} on this menu — use Report flags first if you still need to send them.
            </p>
            <div className="flex flex-wrap justify-end gap-2">
              <button type="button" onClick={cancelLeaveCurrentMenu} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-black text-slate-800 hover:bg-slate-100">
                Stay on this menu
              </button>
              <button type="button" onClick={confirmLeaveCurrentMenu} className="inline-flex items-center gap-2 rounded-lg border border-amber-700 bg-amber-600 px-4 py-2 text-sm font-black text-white hover:bg-amber-700">
                Leave and clear flags
              </button>
            </div>
          </div>
        </Modal>
      )}
      {clearFlagsPrompt && (
        <Modal title="Clear flags on this menu" onClose={() => setClearFlagsPrompt(false)}>
          <div className="space-y-4">
            <p className="text-sm font-semibold leading-6 text-slate-700">
              Clear all {selectedMenuFlags.length} saved flag{selectedMenuFlags.length === 1 ? "" : "s"} on {selectedMenu.name}? Flags are report-only and are not sent anywhere by clearing — use Report flags first if you still need to email them. This cannot be undone.
            </p>
            <div className="flex flex-wrap justify-end gap-2">
              <button type="button" onClick={() => setClearFlagsPrompt(false)} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-black text-slate-800 hover:bg-slate-100">
                Keep flags
              </button>
              <button type="button" onClick={clearSelectedMenuFlags} className="inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-sm font-black text-white hover:bg-slate-800">
                <Trash2 size={16} /> Clear flags
              </button>
            </div>
          </div>
        </Modal>
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
  const widthClass = size === "wide" ? "w-[98vw] max-w-[1700px]" : "w-full max-w-3xl";

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

function DeleteConfirmationModal({ request, confirmed, onConfirmedChange, confirmText, onConfirmTextChange, onClose, onDelete }) {
  const labelByType = {
    menu: "Delete menu",
    item: "Delete item",
    divider: "Delete divider",
    submenu: "Delete sub menu",
    "modifier-group": "Delete modifier group",
    "modifier-item": "Delete modifier item",
  };
  const title = labelByType[request.type] || "Delete item";
  const targetName = request.name || "selected item";
  const isMenuDelete = request.type === "menu";
  const deleteEnabled = isMenuDelete ? confirmText === targetName : confirmed;

  return (
    <Modal title={title} onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm font-bold leading-6 text-slate-700">
          This deletes the app-side SSMT record only: <span className="font-black text-slate-950">{targetName}</span>.
        </p>
        {isMenuDelete ? (
          <label className="block rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-sm font-black text-red-900">
            <span>Retype menu name</span>
            <input
              value={confirmText}
              onChange={(event) => onConfirmTextChange(event.target.value)}
              aria-label="Retype menu name"
              className="mt-2 w-full rounded-md border border-red-300 bg-white px-3 py-2 text-sm font-bold text-slate-950 outline-none focus:border-red-600"
            />
          </label>
        ) : (
          <label className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-sm font-black text-red-900">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) => onConfirmedChange(event.target.checked)}
              aria-label={`Confirm delete ${targetName}`}
            />
            Confirm delete
          </label>
        )}
        <button type="button" onClick={onDelete} disabled={!deleteEnabled} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-red-700 px-4 py-3 text-sm font-black text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-slate-300">
          <Trash2 size={18} /> {title}
        </button>
      </div>
    </Modal>
  );
}
