import { loadSsmtWorkspaceFromSharedStorage } from "./ssmtWorkspaceStorage.js";

const DOWNSTREAM_MENU_TYPES = new Set(["Core", "Global", "Menu Library"]);
// Browser smoke tests create throwaway "Smoke Test Ordering ..." Core menus that
// have leaked into the shared SSMT workspace and surfaced as selectable menus in
// the Menu Library / Neighborhood Rotations feed. Keep these out of the downstream
// feed regardless of what remains in the workspace data. See ARCHITECTURE_RULES.md.
const SMOKE_TEST_MENU_PATTERN = /smoke.?test/i;

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
    && !menuIsAutoHibernated(menu, today)
    && !SMOKE_TEST_MENU_PATTERN.test(cleanText(menu.name));
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
    let currentSubmenuId = "";
    let currentCategory = "";
    const submenuNamesById = new Map((menu.items || [])
      .filter((item) => item?.recordType === "divider" && item.dividerKind === "submenu")
      .map((item) => [item.id, cleanText(item.title)]));
    (menu.items || []).forEach((item, index) => {
      if (item?.recordType === "divider") {
        const title = cleanText(item.title);
        if (item.dividerKind === "submenu") {
          currentSubmenuId = item.id;
        }
        currentCategory = title || currentCategory;
        return;
      }
      const label = cleanText(item.label || item.name);
      if (!label) return;
      const category = cleanText(item.category) || cleanText(currentCategory) || "Entree";
      const primaryMembership = submenuNamesById.has(currentSubmenuId)
        ? [{ submenuId: currentSubmenuId, submenu: submenuNamesById.get(currentSubmenuId), isAdditional: false }]
        : [{ submenuId: "", submenu: "", isAdditional: false }];
      const additionalMemberships = [...new Set(Array.isArray(item.additionalSubmenuIds) ? item.additionalSubmenuIds : [])]
        .filter((submenuId) => submenuId !== currentSubmenuId && submenuNamesById.has(submenuId))
        .map((submenuId) => ({ submenuId, submenu: submenuNamesById.get(submenuId), isAdditional: true }));
      [...primaryMembership, ...additionalMemberships].forEach(({ submenuId, submenu, isAdditional }) => {
        const rowMenu = submenu ? normalizeSubmenuForApp(menu.name, submenu) : normalizeMenuForApp(menu.name);
        if (!rowMenu) return;
        const membershipSuffix = isAdditional ? `-${submenuId}` : "";
        rows.push({
          id: `ssmt-${menu.id || menu.name}-${item.id || index}${membershipSuffix}`,
          item_key: `ssmt:${menu.id || menu.name}:${item.id || index}${membershipSuffix}`,
          menu: rowMenu,
          masterMenu: normalizeMenuForApp(menu.name),
          masterMenuName: cleanText(menu.name),
          submenu,
          station: submenu || cleanText(item.secondaryCategory || item.reportingCategorySecondary || category) || "SSMT",
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
