import { loadSsmtWorkspaceFromSharedStorage } from "./ssmtWorkspaceStorage.js";

const DOWNSTREAM_MENU_TYPES = new Set(["Core", "Global", "Menu Library"]);

function cleanText(value) {
  return String(value ?? "").trim();
}

function priceNumber(value) {
  const number = Number.parseFloat(String(value ?? "").replace(/[$,]/g, ""));
  return Number.isFinite(number) ? number : null;
}

function normalizeMenuForApp(name = "") {
  const clean = cleanText(name);
  if (!clean) return "";
  if (/^AMZ(?:\+RA)?:/i.test(clean)) return clean;
  return `AMZ: ${clean}`;
}

function normalizeSubmenuForApp(menuName = "", submenuName = "") {
  const master = cleanText(menuName);
  const submenu = cleanText(submenuName);
  if (!submenu) return normalizeMenuForApp(master);
  if (/^AMZ(?:\+RA)?:/i.test(submenu)) return submenu;
  if (/^Cafe Express$/i.test(master)) return `AMZ: Cafe Express ${submenu}`;
  return `${normalizeMenuForApp(master)} - ${submenu}`;
}

function menuIsAutoHibernated(menu, today = new Date()) {
  if (!menu?.activeEnd || menu.type !== "Promotion") return false;
  const end = new Date(`${menu.activeEnd}T23:59:59`);
  return !Number.isNaN(end.getTime()) && end < today;
}

export function isSsmtDownstreamMenu(menu = {}, today = new Date()) {
  return DOWNSTREAM_MENU_TYPES.has(menu.type)
    && menu.phase === "IT complete"
    && !menu.hidden
    && !menuIsAutoHibernated(menu, today);
}

export function ssmtDerivedMenuEntries(rows = []) {
  const byMenu = new Map();
  rows.forEach((row) => {
    const menu = cleanText(row.menu);
    if (!menu) return;
    byMenu.set(menu, (byMenu.get(menu) || 0) + 1);
  });
  return Array.from(byMenu.entries())
    .map(([menu, count]) => ({ menu, count, source: "ssmt-derived" }))
    .sort((a, b) => a.menu.localeCompare(b.menu));
}

export function mergeMenuEntriesWithSsmt(menuEntries = [], ssmtRows = []) {
  const byMenu = new Map();
  menuEntries.forEach((entry) => {
    if (entry?.menu) byMenu.set(entry.menu, { ...entry });
  });
  ssmtDerivedMenuEntries(ssmtRows).forEach((entry) => {
    const current = byMenu.get(entry.menu);
    byMenu.set(entry.menu, {
      ...current,
      ...entry,
      count: entry.count,
      source: current ? "menuworks+ssmt" : "ssmt-derived",
    });
  });
  return Array.from(byMenu.values()).sort((a, b) => a.menu.localeCompare(b.menu));
}

export function deriveSsmtOperatingRows(workspace = {}, { today = new Date() } = {}) {
  const menus = Array.isArray(workspace.menus) ? workspace.menus : [];
  const rows = [];
  menus.filter((menu) => isSsmtDownstreamMenu(menu, today)).forEach((menu) => {
    let currentSubmenu = "";
    let currentCategory = "";
    (menu.items || []).forEach((item, index) => {
      if (item?.recordType === "divider") {
        const title = cleanText(item.title);
        if (item.dividerKind === "submenu") currentSubmenu = title;
        currentCategory = title || currentCategory;
        return;
      }
      const rowMenu = currentSubmenu
        ? normalizeSubmenuForApp(menu.name, currentSubmenu)
        : normalizeMenuForApp(menu.name);
      const label = cleanText(item.label || item.name);
      if (!rowMenu || !label) return;
      const category = cleanText(item.category) || cleanText(currentCategory) || "Entree";
      rows.push({
        id: `ssmt-${menu.id || menu.name}-${item.id || index}`,
        item_key: `ssmt:${menu.id || menu.name}:${item.id || index}`,
        menu: rowMenu,
        masterMenu: normalizeMenuForApp(menu.name),
        masterMenuName: cleanText(menu.name),
        submenu: currentSubmenu,
        station: currentSubmenu || cleanText(item.secondaryCategory || item.reportingCategorySecondary || category) || "SSMT",
        item: label,
        recipeName: label,
        displayName: label,
        description: cleanText(item.description),
        enticingDescription: cleanText(item.description),
        mrn: cleanText(item.mrn),
        MRN: cleanText(item.mrn),
        category,
        recipeCategory: cleanText(item.secondaryCategory || item.reportingCategorySecondary || category),
        price: priceNumber(item.seaPrice || item.price),
        trueCost: null,
        calories: cleanText(item.calories),
        areaPrices: item.areaPrices || {},
        plannerSelectorGroup: cleanText(item.secondaryCategory || item.reportingCategorySecondary),
        dataSource: "ssmt-derived-menu",
        __ssmtOperatingMenu: true,
      });
    });
  });
  return rows;
}

export function mergeSsmtRowsWithMenuWorksRows(menuWorksRows = [], ssmtRows = []) {
  const ssmtOwnedMenus = new Set(ssmtRows.map((row) => cleanText(row?.menu)).filter(Boolean));
  const byKey = new Map();
  [
    ...menuWorksRows.filter((row) => !ssmtOwnedMenus.has(cleanText(row?.menu))),
    ...ssmtRows,
  ].forEach((row) => {
    if (!row) return;
    const key = row.__ssmtOperatingMenu
      ? `ssmt:${row.item_key || row.id}`
      : `menuworks:${cleanText(row.menu).toLowerCase()}|${cleanText(row.station).toLowerCase()}|${cleanText(row.mrn || row.MRN).toLowerCase()}|${cleanText(row.item || row.recipeName || row.displayName).toLowerCase()}`;
    if (!byKey.has(key)) byKey.set(key, row);
  });
  return Array.from(byKey.values());
}

export async function loadSsmtDerivedMenuSource() {
  const result = await loadSsmtWorkspaceFromSharedStorage();
  const workspace = result.workspace || {};
  const rows = deriveSsmtOperatingRows(workspace);
  return {
    ok: true,
    source: result.source || "supabase",
    rows,
    menus: ssmtDerivedMenuEntries(rows),
    updatedAt: workspace.updatedAt || "",
    message: rows.length
      ? `Loaded ${rows.length} IT-complete SSMT item row${rows.length === 1 ? "" : "s"}.`
      : "No IT-complete SSMT item rows are available yet.",
  };
}
