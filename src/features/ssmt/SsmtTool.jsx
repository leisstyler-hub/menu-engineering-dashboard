import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  ClipboardCheck,
  Copy,
  DollarSign,
  Flag,
  ListChecks,
  Mail,
  Plus,
  Search,
  ShieldCheck,
  Tags,
  Trash2,
  X,
} from "lucide-react";
import CompassOneLogo from "../../shared/ui/CompassOneLogo.jsx";
import PlatformSettings from "../../shared/ui/PlatformSettings.jsx";
import VersionStamp from "../../shared/ui/VersionStamp.jsx";

const PASSCODE = "0411";
const UNLOCKED_KEY = "culinaryToolsSsmtUnlocked";
const DEFAULT_MENU_TYPES = ["Core", "Global", "Thompson Hospitality", "Promotion"];
const ACTIVE_DATE_MENU_TYPES = ["Promotion", "Thompson Hospitality"];
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

function slugify(value) {
  return String(value || "menu").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "menu";
}

function activeDatesRequired(type) {
  return ACTIVE_DATE_MENU_TYPES.includes(type);
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
    reportingCategorySecondary: "",
    brandMenu: "",
    calories: "",
    priceSelectorId: "",
    seaPrice: "",
    workbookSeaPrice: "",
    priceReviewStatus: "Unpriced",
    areaPrices: blankAreaPrices(areaOrder),
    modifierGroups: [],
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [flagReason, setFlagReason] = useState("Description correction");
  const [flagNote, setFlagNote] = useState("");
  const [reportedFlag, setReportedFlag] = useState(null);
  const [copiedModifierNotice, setCopiedModifierNotice] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function loadSeedData() {
      try {
        const response = await fetch("/data/ssmtSeedData.json");
        const payload = await response.json();
        if (!response.ok) throw new Error("SSMT seed data could not be loaded.");
        if (cancelled) return;
        setSsmtData({ ...payload, menuTypes: payload.menuTypes?.length ? payload.menuTypes : DEFAULT_MENU_TYPES });
        setMenus((current) => current.length ? current : payload.menus.map(cloneMenu));
        setSelectedMenuId((current) => current || payload.menus[0]?.id || "");
        setSelectedPriceId((current) => current || payload.priceBook[0]?.id || "");
        setNewMenuType(payload.menuTypes?.[0] || "Core");
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

  const downstreamReadyCount = menus.filter((menu) => ["Core", "Global"].includes(menu.type) && menu.phase === "IT complete").length;
  const promotionCount = menus.filter((menu) => menu.type === "Promotion").length;
  const historicalCount = menus.filter((menu) => ["Thompson Hospitality", "Promotion"].includes(menu.type)).length;
  const menuTypes = ssmtData.menuTypes?.length ? ssmtData.menuTypes : DEFAULT_MENU_TYPES;
  const showActiveDates = activeDatesRequired(selectedMenu.type);

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
    const timestamp = new Date().toISOString();
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

  const deleteSelectedMenu = () => {
    if (deleteConfirmation !== selectedMenu.name) return;
    setMenus((current) => {
      const remaining = current.filter((menu) => menu.id !== selectedMenu.id);
      setSelectedMenuId(remaining[0]?.id || "");
      return remaining;
    });
    setDeleteDialogOpen(false);
    setDeleteConfirmation("");
    setActiveView("menus");
  };

  const openModifierDialog = (item) => {
    setCopiedModifierNotice("");
    const matchedGroups = ssmtData.modifierGroups
      .filter((group) => (item.modifierGroups || []).some((name) => group.name.toLowerCase().includes(String(name).toLowerCase()) || String(name).toLowerCase().includes(group.name.toLowerCase())))
      .slice(0, 4);
    setModifierDialog({
      item,
      groups: matchedGroups.length ? matchedGroups : ssmtData.modifierGroups.slice(0, 3),
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
    setSsmtData((current) => ({ ...current, modifierGroups: [...current.modifierGroups, copiedGroup] }));
    updateItem(modifierDialog.item.id, { modifierGroups: [...(modifierDialog.item.modifierGroups || []), copiedGroup.name] });
    setModifierDialog((current) => current ? {
      ...current,
      item: { ...current.item, modifierGroups: [...(current.item.modifierGroups || []), copiedGroup.name] },
      groups: [...current.groups, copiedGroup],
    } : current);
    setCopiedModifierNotice(`${copyName} added as an independent modifier group.`);
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
    <div className="min-h-screen bg-[#f5f6f1] px-4 py-5 text-slate-950 md:px-8">
      <div className="mx-auto max-w-[132rem] space-y-5">
        <header className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <button onClick={onBackToPlatform} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100">
                <ArrowLeft size={16} /> Back to Platform
              </button>
              <p className="mt-5 text-xs font-black uppercase tracking-[0.22em] text-emerald-600">Culinary to IT programming</p>
              <h1 className="mt-2 text-4xl font-black">SSMT</h1>
              <p className="mt-3 max-w-4xl text-sm font-semibold leading-6 text-slate-600">
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

        <section className="flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <button type="button" onClick={() => setActiveView("home")} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-black ${activeView === "home" ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-800 hover:bg-slate-100"}`}>
            <ListChecks size={16} /> SSMT Start
          </button>
          <button type="button" onClick={() => setActiveView("pricing")} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-black ${activeView === "pricing" ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-800 hover:bg-slate-100"}`}>
            <DollarSign size={16} /> Pricing Structure
          </button>
          <button type="button" onClick={() => setActiveView("menus")} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-black ${activeView === "menus" ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-800 hover:bg-slate-100"}`}>
            <ClipboardCheck size={16} /> Menu Selector / New Menu
          </button>
        </section>

        {dataStatus !== "ready" && (
          <section className={`rounded-lg border p-4 text-sm font-bold leading-6 ${dataStatus === "error" ? "border-red-200 bg-red-50 text-red-800" : "border-sky-200 bg-sky-50 text-sky-900"}`}>
            {dataStatus === "error" ? "SSMT seed data could not be loaded." : "Loading current SSMT seed data..."}
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
              <div className="mt-4 grid max-h-[68vh] gap-2 overflow-y-auto pr-1 md:grid-cols-2 2xl:grid-cols-3">
                {visibleMenus.map((menu) => (
                  <button
                    key={menu.id}
                    type="button"
                    onClick={() => openMenu(menu.id)}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-left hover:border-emerald-300 hover:bg-emerald-50"
                  >
                    <span className="block truncate text-sm font-black text-slate-950">{menu.name}</span>
                    <span className="mt-1 flex flex-wrap gap-2 text-[11px] font-bold text-slate-600">
                      <span>{menu.type}</span>
                      <span>{menu.phase}</span>
                    </span>
                  </button>
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
          <main className="space-y-5">
            <section className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setActiveView("menus")} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-black text-slate-800 hover:bg-slate-100">
                  <ArrowLeft size={16} /> Back to menu selection
                </button>
                <button type="button" onClick={() => setActiveView("pricing")} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-black text-slate-800 hover:bg-slate-100">
                  <DollarSign size={16} /> Pricing table
                </button>
              </div>
              <button type="button" onClick={() => setDeleteDialogOpen(true)} className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-black text-red-800 hover:bg-red-100">
                <Trash2 size={16} /> Delete menu
              </button>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Menu Record</p>
                  <h2 className="mt-1 text-3xl font-black">{selectedMenu.name}</h2>
                  <p className="mt-2 text-sm font-semibold text-slate-600">{selectedMenu.type} / {selectedMenu.phase} / availability after IT complete</p>
                </div>
                <div className="grid min-w-[280px] gap-2 text-sm font-bold text-slate-700">
                  <label className="grid gap-1">
                    <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Phase</span>
                    <select value={selectedMenu.phase} onChange={(event) => updateSelectedMenuPhase(event.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-bold">
                      {ssmtData.workflowPhases.map((phase) => <option key={phase}>{phase}</option>)}
                    </select>
                  </label>
                  <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">Type: {selectedMenu.type}</span>
                </div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-4">
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

            <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Menu Items</p>
                  <h2 className="mt-1 text-2xl font-black">Builder rows</h2>
                </div>
                <button type="button" onClick={addDivider} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-black text-slate-800 hover:bg-slate-100">
                  <Plus size={16} /> Add divider
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-[1760px] w-full border-collapse text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                    <tr>
                      {["Label", "Description", "MRN", "Category", "FOH / Fixy", "Calories", "SEA price", "Area prices", "Actions"].map((header) => (
                        <th key={header} className="border-b border-slate-200 px-4 py-3">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedMenu.items.slice(0, 80).map((item) => (
                      item.recordType === "divider" ? (
                        <tr key={item.id} className="bg-slate-100">
                          <td colSpan={9} className="border-b border-slate-200 px-4 py-3">
                            <label className="flex flex-col gap-2 md:flex-row md:items-center">
                              <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Divider title</span>
                              <input aria-label="Divider title" value={item.title} onChange={(event) => updateDivider(item.id, event.target.value)} className="min-w-[260px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-black outline-none focus:border-emerald-500" />
                            </label>
                          </td>
                        </tr>
                      ) : (
                        <tr key={item.id} className="align-top odd:bg-white even:bg-slate-50/70">
                          <td className="border-b border-slate-100 px-4 py-3">
                            <input
                              aria-label="Item label"
                              value={item.label}
                              onChange={(event) => updateItem(item.id, { label: normalizeLabel(event.target.value) })}
                              className="w-56 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-black outline-none focus:border-emerald-500"
                            />
                          </td>
                          <td className="border-b border-slate-100 px-4 py-3">
                            <textarea
                              aria-label="Description"
                              value={item.description}
                              onChange={(event) => updateItem(item.id, { description: normalizeDescription(event.target.value) })}
                              className="h-20 w-72 resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-500"
                            />
                          </td>
                          <td className="border-b border-slate-100 px-4 py-3 font-mono text-xs font-bold text-slate-700">{item.mrn || "TBD"}</td>
                          <td className="border-b border-slate-100 px-4 py-3">
                            <input
                              aria-label={`Category for ${item.label || item.name || "item"}`}
                              value={item.category || ""}
                              onChange={(event) => updateItem(item.id, { category: event.target.value })}
                              className="w-44 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-emerald-500"
                            />
                          </td>
                          <td className="border-b border-slate-100 px-4 py-3">
                            <input
                              aria-label={`FOH / Fixy for ${item.label || item.name || "item"}`}
                              value={item.fohColumn || ""}
                              onChange={(event) => updateItem(item.id, { fohColumn: event.target.value })}
                              className="w-40 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-emerald-500"
                            />
                          </td>
                          <td className="border-b border-slate-100 px-4 py-3 font-bold text-slate-700">{selectedMenu.type === "Promotion" ? item.calories || "TBD" : "Promo only"}</td>
                          <td className="border-b border-slate-100 px-4 py-3">
                            <select
                              aria-label={`SEA price for ${item.label || item.name || "item"}`}
                              value={item.priceSelectorId || ""}
                              onChange={(event) => assignItemPrice(item.id, event.target.value)}
                              className="w-56 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-900"
                            >
                              <option value="">Select SEA price</option>
                              {ssmtData.priceBook.map((price) => (
                                <option key={price.id} value={price.id}>{price.selectorLabel}</option>
                              ))}
                            </select>
                            {item.workbookSeaPrice && item.priceReviewStatus === "Needs pricing structure match" && (
                              <p className="mt-2 text-[11px] font-bold text-amber-700">Workbook value needs pricing structure match.</p>
                            )}
                          </td>
                          <td className="border-b border-slate-100 px-4 py-3">
                            <div aria-label={`Area prices for ${item.label || item.name || "item"}`} className="grid w-[460px] grid-cols-4 gap-1 text-[11px] font-bold text-slate-700">
                              {ssmtData.areaOrder.map((area) => (
                                <span key={area} className="rounded border border-slate-200 bg-white px-2 py-1">
                                  <span className="font-black text-slate-500">{area}</span> {item.areaPrices?.[area] || "TBD"}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="border-b border-slate-100 px-4 py-3">
                            <div className="flex flex-col gap-2">
                              <button type="button" onClick={() => openModifierDialog(item)} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-800 hover:bg-slate-100">
                                <Tags size={15} /> View modifiers
                              </button>
                              <button type="button" onClick={() => setFlagDialog({ item })} className="inline-flex items-center justify-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-black text-amber-900 hover:bg-amber-100">
                                <Flag size={15} /> Flag for change
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
        <Modal title="Modifier detail" onClose={() => setModifierDialog(null)}>
          <div className="space-y-4">
            <p className="text-sm font-bold text-slate-700">For {modifierDialog.item.label || modifierDialog.item.name}, copy creates an independent modifier group so edits do not change another menu.</p>
            {copiedModifierNotice && <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-black text-emerald-900">{copiedModifierNotice}</p>}
            {modifierDialog.groups.map((group) => (
              <section key={group.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-slate-950">{group.name}</p>
                    <p className="mt-1 text-xs font-bold text-slate-500">{group.choices.length} choices / {group.sourceSheet}</p>
                  </div>
                  <button type="button" onClick={() => copyModifierGroup(group)} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-800">
                    <Copy size={14} /> Copy group
                  </button>
                </div>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {group.choices.slice(0, 6).map((choice) => (
                    <div key={choice.id} className="rounded-lg border border-white bg-white p-3">
                      <p className="text-sm font-black text-slate-900">{choice.label}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">{choice.description || "No description"}</p>
                      <p className="mt-2 font-mono text-[11px] font-bold text-slate-500">{choice.mrn || "No MRN"}</p>
                    </div>
                  ))}
                </div>
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

      {deleteDialogOpen && (
        <Modal title="Delete menu" onClose={() => setDeleteDialogOpen(false)}>
          <div className="space-y-4">
            <p className="text-sm font-bold leading-6 text-slate-700">
              Retype the menu name exactly to delete this in-app SSMT menu record: <span className="font-black text-slate-950">{selectedMenu.name}</span>
            </p>
            <label className="block">
              <span className="text-sm font-black text-slate-900">Retype menu name</span>
              <input value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm font-bold outline-none focus:border-red-500" />
            </label>
            <button type="button" onClick={deleteSelectedMenu} disabled={deleteConfirmation !== selectedMenu.name} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-red-700 px-4 py-3 text-sm font-black text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-slate-300">
              <Trash2 size={18} /> Delete permanently
            </button>
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

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4" onMouseDown={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-slate-200 bg-white p-5 shadow-2xl"
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
