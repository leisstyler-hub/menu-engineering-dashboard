import {groupsForItem} from "./ssmtReuse.js";
// Additive opening metadata. Never migrate, seed or discard existing menu rows here.
export const OPENING_TYPE = "New Unit Openings";
export const ASSIGNMENT_ORDER = ["Promotion", OPENING_TYPE, "Thompson Hospitality", "Global", "Core"];
export const isItem = row => row.recordType !== "divider" && row.rowType !== "divider";
const same = (a,b) => JSON.stringify(a) === JSON.stringify(b);
export function stationRows(menu, stationId = "", week = 0) {
  return (menu.items || []).filter(row => (!stationId || (stationId === "unassigned" ? !row.stationId || !(menu.stations || []).some(s=>s.id === row.stationId) : row.stationId === stationId)) &&
    (!Number(week) || !row.weeks?.length || row.weeks.includes(Number(week))));
}
export function reviewState(item) {
  if(item.reviewInvalidated) return "Needs review";
  const basis = item.reviewBasis;
  if (!basis) return "Unknown";
  if (basis.source === "new" || basis.mrn !== item.mrn || basis.description !== (item.description || "")) return "Needs review";
  return "Reviewed";
}
export function patchOpeningItem(item, patch) {
  return {...item, ...patch,...(Object.hasOwn(patch,"mrn")&&patch.mrn!==item.mrn?{reviewInvalidated:true}:{})};
}
export function stationReadiness(menu, stationId = "", week = 0) {
  const globalRows=(menu.stations || []).filter(s=>!stationId || s.id===stationId).flatMap(s=>(s.globalMenus || []).flatMap(g=>stationRows({items:g.items || []},"",week).map(row=>({...row,id:`${s.id}/${g.menuId}/${row.id}`}))));
  const rows = [...stationRows(menu, stationId, week),...globalRows].filter(isItem);
  return {rows, review:rows.filter(row=>reviewState(row) !== "Reviewed"), signage:rows.filter(row=>
    !String(row.label || "").trim() || !String(row.fohColumn || "").trim() || row.calories === undefined || row.calories === null || String(row.calories).trim() === ""),
    mrns:rows.filter(row=>!String(row.mrn || "").trim())};
}
// Canonical content snapshot is exact rather than a collision-prone short hash.
export function menuRevision(menu, groups = []) {
  const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value === "object" ? Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])])) : value;
  const attached=[...new Map((menu.items || []).flatMap(item=>groupsForItem(item,groups,menu)).map(group=>[group.id,group])).values()];
  return JSON.stringify(canonical({name:menu.name,type:menu.type,fixyDesignation:menu.fixyDesignation,items:menu.items || [],stations:menu.stations || [],modifiers:attached}));
}
export function transitionMenu(menu, phase, at, actorId) {
  if (menu.phase === phase) return menu;
  return {...menu,phase,phaseHistory:[...(menu.phaseHistory || []),{from:menu.phase,to:phase,at,actorId}],phaseTimestamps:{...(menu.phaseTimestamps || {}),[phase]:at}};
}
export function validateOpeningChange(before, after, actor, members = []) {
  if (!same(before.reviewBaseline,after.reviewBaseline)) return "Use the authenticated baseline action to initialize review history.";
  for (const menu of after.menus || []) {
    const old = before.menus?.find(m=>m.id === menu.id);
    if (!actor.is_admin && !same(old?.assignmentHistory || [],menu.assignmentHistory || [])) return "Only an admin can change assignment history.";
    if (!same(old?.owners || [],menu.owners || []) || old?.leadOwnerId !== menu.leadOwnerId || old?.dueDate !== menu.dueDate) {
      if (!actor.is_admin) return "Only an admin can change menu assignments.";
      if (!Array.isArray(menu.owners) || menu.owners.some(owner=>!members.some(member=>member.user_id === owner.id && member.active && member.email === owner.email))) return "Choose active registered owners.";
      if (menu.leadOwnerId && !menu.owners.some(owner=>owner.id === menu.leadOwnerId)) return "Lead owner must be assigned to the menu.";
    }
    if (!same(old?.reviewApprovals || [],menu.reviewApprovals || [])) return "Use the authenticated approval action to record menu approval.";
    for (const station of menu.stations || []) for (const entry of station.globalMenus || []) {
      const prior=old?.stations?.find(s=>s.id===station.id)?.globalMenus?.find(g=>g.menuId===entry.menuId);
      if(same(prior,entry)) continue;
      const source=after.menus.find(m=>m.id===entry.menuId && m.type==="Global");
      if(!source || entry.revision!==menuRevision(source,after.modifierGroups) || !same(entry.items,source.items) || entry.name!==source.name) return "Global participation must match the exact source menu revision and rows.";
    }
    for (const item of menu.items || []) {
      const prior=old?.items?.find(row=>row.id===item.id);
      const reviewing=(actor.is_admin || actor.work_role === "Experience") && old?.phase === "Experience review" && menu.phase === "IT programming";
      if(prior && prior.mrn!==item.mrn && !item.reviewInvalidated && !reviewing) return "Every MRN change must require another Experience review.";
      if(prior?.reviewInvalidated && !item.reviewInvalidated && !reviewing) return "MRN changes require another Experience review.";
      if (same(prior?.reviewBasis,item.reviewBasis)) continue;
      const basis=item.reviewBasis;
      if (!prior && (!basis || basis.source === "new")) continue;
      const sourceMenu=before.menus?.find(m=>m.id===item.importSource?.menuId);
      const sourceItem=sourceMenu?.items?.find(row=>row.id===item.importSource?.itemId);
      if (sourceItem && same(basis,sourceItem.reviewBasis) && sourceItem.mrn===item.mrn) continue;
      if (reviewing && basis?.source === "experience" && basis.mrn === item.mrn && basis.description === (item.description || "") && basis.actorId === actor.user_id) continue;
      return "Review evidence must come from the source item or an authenticated Experience handoff.";
    }
    if (old && (old.phase !== menu.phase || !same(old.phaseHistory || [],menu.phaseHistory || []))) {
      const history = menu.phaseHistory;
      if (!Array.isArray(history) || !same(history.slice(0,-1),old.phaseHistory || []) || history.length !== (old.phaseHistory?.length || 0)+1 || menu.phase === old.phase || history.at(-1).from !== old.phase || history.at(-1).to !== menu.phase || history.at(-1).actorId !== actor.user_id) return "Phase history must append the current transition without replacing earlier history.";
    }
  }
  return "";
}
