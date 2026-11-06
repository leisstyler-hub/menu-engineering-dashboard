import { noExperienceReviewNeeded } from "./ssmtReuse.js";
import React, { useState } from "react";

const displayValue = (value) => value === undefined || value === null || String(value).trim() === "" ? "Not available" : String(value);

export function TicketFormNotice({ ticket }) {
  if (!ticket) return null;
  return <aside role="status" className="rounded-lg border border-sky-300 bg-sky-50 p-3 text-sm text-sky-950"><p className="font-bold">Finish the {ticket.label} ticket in Smartsheet.</p><p>Review the menu details, enter requester information, and submit the form.</p><a href={ticket.href} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-11 items-center rounded-lg border border-sky-700 bg-sky-700 px-4 py-2 font-bold text-white">Open {ticket.label} ticket form</a></aside>;
}

export default function SsmtExperienceReview({ ticketForm, menus, menu, groupsForItem, onSelectMenu, onDescriptionChange, onSave, onAdvance, allItemsLocked, syncMessage, phaseBlocker, dataStatus, onBack, backLabel = "Back to Platform", preview = false, flagModals, flagReportHref, existingFlagForItem, onFlagItem }) {
  const [expandedModifiers, setExpandedModifiers] = useState({});
  const [spellcheck, setSpellcheck] = useState(true);
  const [copyStatus, setCopyStatus] = useState("");
  const [copyFallback, setCopyFallback] = useState("");
  const items = (menu.items || []).filter(item => item.recordType !== "divider" && item.rowType !== "divider");
  // Section boundaries follow the stored order; never sort or mutate menu rows.
  const isDivider = item => item.recordType === "divider" || item.rowType === "divider";
  const sections = [];
  let section = { id: "leading", title: "", rows: [] };
  for (const row of menu.items || []) {
    if (isDivider(row) && row.dividerKind === "submenu") {
      if (section.rows.length || section.title) sections.push(section);
      section = {id: row.id, title: row.title || row.name || "Untitled submenu", rows: []};
    } else section.rows.push(row);
  }
  if (section.rows.length || section.title) sections.push(section);
  const alphabeticalMenus = [...menus].sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base", numeric: true }));
  const selectorGroups = [
    { label: "Experience Review:", menus: alphabeticalMenus.filter(entry => entry.phase === "Experience review") },
    { label: "Menus:", menus: alphabeticalMenus.filter(entry => entry.phase !== "Experience review") },
  ];
  const nextPhase = menu.phase === "Culinary draft" ? "Experience review" : "IT programming";
  const canAdvance = ["Culinary draft", "Experience review"].includes(menu.phase) && allItemsLocked;
  const copyAll = async () => {
    const text = items.map(item => `${item.label || item.name || "Unnamed item"}\n${item.description ?? ""}`).join("\n\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopyFallback("");
      setCopyStatus("Selected menu copied. Paste it into your chat.");
    } catch {
      setCopyFallback(text);
      setCopyStatus("Clipboard unavailable. Select and copy the text below.");
    }
  };
  return <div className="mx-auto w-full max-w-screen-2xl min-w-0 space-y-3 p-3 pb-28 text-slate-950 md:p-5 md:pb-5">
    <button type="button" onClick={onBack} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-sky-700 bg-sky-700 px-4 py-2 text-base font-bold text-white shadow-sm hover:bg-sky-800"><span aria-hidden="true">←</span>{backLabel}</button>
    {preview && <p data-testid="ssmt-experience-preview" className="rounded border border-indigo-700 bg-indigo-50 p-3 font-bold">Experience preview: {menu.name}. Description edits and flags apply to this shared menu.</p>}
    <h1 className="text-xl font-black tracking-tight">SSMT - Experience review</h1>
    <p className="text-sm text-slate-600">Review descriptions, save your changes, then send the menu to IT.</p>
    <p role="status" className="text-xs text-slate-600">{syncMessage}</p>
    {flagModals}
    <TicketFormNotice ticket={ticketForm} />
    {dataStatus === "ready" ? <>
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
        <label className="flex min-w-0 max-w-full items-center gap-2 font-semibold">Menu <select aria-label="Experience menu" value={menu.id} onChange={event => { onSelectMenu(event.target.value); setCopyFallback(""); setCopyStatus(""); }} className="min-w-0 max-w-full rounded-md border border-slate-300 bg-white px-2 py-2 font-normal">{selectorGroups.map(group => <optgroup key={group.label} label={group.label}>{group.menus.map(entry => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</optgroup>)}</select></label>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900">Current stage: {menu.phase}</span>
        <button type="button" onClick={copyAll} className="rounded border bg-white p-2">Copy all selected menu</button>
      <label className="flex items-center gap-2"><input type="checkbox" checked={spellcheck} onChange={event => setSpellcheck(event.target.checked)} />Spellcheck descriptions</label>
      <details className="text-xs text-slate-500"><summary className="cursor-pointer">Spelling help</summary><p className="mt-1">Spelling is checked by your browser. Right-click an underlined word for corrections; on mobile, tap the word. Enable English spelling in your browser or keyboard settings if suggestions are unavailable.</p></details>
      </div>
      {menu.flags?.length > 0 && <div className="rounded border border-amber-400 bg-amber-50 p-3"><p>{menu.flags.length} saved item flags for menu builders.</p><a href={flagReportHref} className="underline">Report flags ({menu.flags.length})</a></div>}
      {copyStatus && <p role="status">{copyStatus}</p>}
      {copyFallback && <label className="block">Selected menu text<textarea aria-label="Selected menu text" readOnly value={copyFallback} onFocus={event => event.target.select()} className="mt-1 min-h-48 w-full rounded border p-2" /></label>}
      <div data-testid="ssmt-experience-table-scroll" tabIndex={0} aria-label="Menu review rows, scroll for more information" className="max-h-[65vh] overflow-auto rounded-lg border border-slate-300 bg-slate-50 p-2">
        {sections.map(section => <section key={section.id} aria-label={section.title || "Menu items"} className="mb-5 min-w-[980px] overflow-clip rounded-lg border-2 border-emerald-200 bg-white last:mb-0">
          {section.title && <h2 className="border-b-2 border-l-[6px] border-emerald-600 bg-emerald-100 px-4 py-4 text-[20px] font-black text-emerald-950"><span className="mb-1 block text-[12px] font-bold uppercase tracking-widest text-emerald-700">Submenu</span>{section.title}</h2>}
          <table className="w-full table-fixed border-separate border-spacing-0 text-left text-sm">
            <caption className="sr-only">{section.title || menu.name} review items</caption>
            <colgroup><col style={{width:"22%"}} /><col style={{width:"40%"}} /><col style={{width:"14%"}} /><col style={{width:"15%"}} /><col style={{width:"9%"}} /></colgroup>
            <thead className="sticky top-0 z-10 bg-slate-100 text-[12px] uppercase tracking-wider text-slate-700"><tr>{["Item / MRN", "Description", "Dietary / Calories", "Modifiers", "Flag"].map(title => <th key={title} scope="col" className="border-b border-slate-200 px-3 py-2 font-semibold">{title}</th>)}</tr></thead>
            <tbody>{section.rows.map(item => {
              if (isDivider(item)) return <tr key={item.id} className="bg-sky-100"><td colSpan={5} className="border-y-2 border-l-[6px] border-sky-600 px-4 py-4"><h3 className="text-[18px] font-black tracking-wide text-sky-950">{item.title || item.name || "Untitled section"}</h3></td></tr>;
              const groups = groupsForItem(item);
              const flag = existingFlagForItem(item);
              const modifierKey = `${menu.id}:${item.id}`;
              const modifiersOpen = !!expandedModifiers[modifierKey];
              return <React.Fragment key={item.id}><tr data-testid="ssmt-experience-item-row" className="align-top [&>td]:border-b [&>td]:border-slate-100 [&>td]:px-3 [&>td]:py-3 last:[&>td]:border-b-0 hover:bg-slate-50/70">
                <td className="break-words"><h4 className="text-[16px] font-bold leading-6">{item.label || item.name}</h4><p className="mt-2 font-mono text-[13px] text-slate-600">MRN: {displayValue(item.mrn)}</p>{noExperienceReviewNeeded(item, menus) && <span className="mt-2 inline-flex rounded bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-800">No Review Needed</span>}</td>
                <td><textarea aria-label={`Description for ${item.label || item.name}`} value={item.description || ""} onChange={event => onDescriptionChange(item.id, event.target.value)} spellCheck={spellcheck} lang="en-US" rows={3} className="block min-h-20 w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2 text-[16px] leading-6 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" /></td>
                <td className="break-words text-[14px] leading-6 text-slate-700">{["Vegan", "Vegetarian"].includes(item.dietaryPreference) && <span className="mb-2 inline-flex rounded-full border border-emerald-300 bg-emerald-50 px-2 py-1 font-semibold text-emerald-900">{item.dietaryPreference}</span>}<span className="block">{displayValue(item.calories) !== "Not available" ? `${item.calories} calories` : "Calories not available"}</span></td>
                <td className="break-words text-[14px]">
                  {groups.length ? <button type="button" aria-expanded={modifiersOpen} aria-controls={`review-modifiers-${item.id}`} onClick={() => setExpandedModifiers(current => ({...current, [modifierKey]: !current[modifierKey]}))} className="min-h-11 rounded-lg border border-violet-300 bg-violet-50 px-3 py-2 text-left font-bold text-violet-950">{modifiersOpen ? "Hide" : "View"} modifiers ({groups.length})</button> : <p className="text-sm text-slate-600">No linked modifier groups.</p>}
                </td>
                <td><button type="button" aria-label={flag ? `Edit or clear flag for ${item.label || item.name || "item"}` : "Flag for change"} onClick={() => onFlagItem(item)} className={`min-h-9 rounded-md border px-2 py-1 text-xs font-semibold ${flag ? "border-amber-400 bg-amber-50 text-amber-900" : "border-slate-300 bg-white text-slate-600 hover:border-amber-400 hover:text-amber-900"}`}>{flag ? "Flagged" : "Flag"}</button>{flag && <p className="mt-2 break-words text-xs text-amber-900">{flag.reason}: {flag.note}</p>}</td>
              </tr>
              {modifiersOpen && <tr id={`review-modifiers-${item.id}`}><td colSpan={5} className="border-b-2 border-violet-200 bg-violet-50 p-4"><div data-testid="ssmt-experience-modifiers" className={`grid gap-4 ${groups.length > 1 ? "lg:grid-cols-2" : ""}`}>{groups.map(group => <section key={group.id} aria-label={`${group.name || group.id} modifier group`} className="min-w-0 overflow-hidden rounded-lg border-2 border-violet-300 bg-white"><header className="border-b border-violet-300 bg-violet-100 px-4 py-3"><h3 className="text-[20px] font-black text-violet-950">{group.name || group.id}</h3><p className="mt-1 text-[14px] text-violet-900">{group.modifierType} | Minimum {displayValue(group.minQty)} | Maximum {displayValue(group.maxQty)}</p></header><ul className="divide-y divide-slate-200">{(group.choices || []).map(choice => <li key={choice.id} className="px-4 py-3 text-[16px] leading-6"><strong>{choice.label || choice.name}</strong>{choice.description && <p>{choice.description}</p>}<p className="mt-1 text-[14px] text-slate-600">MRN: {displayValue(choice.mrn)}{displayValue(choice.calories) !== "Not available" && ` | ${choice.calories} calories`}</p></li>)}</ul>{!group.choices?.length && <p className="p-4">No choices available.</p>}</section>)}</div></td></tr>}
              </React.Fragment>;
            })}</tbody>
          </table>
        </section>)}
      </div>
      {!items.length && <p>No item rows in this menu.</p>}
      <div className="z-20 flex flex-wrap items-center justify-end gap-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm"><button type="button" className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold" onClick={onSave}>Save SSMT workspace</button><button type="button" className="rounded-md bg-emerald-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" disabled={!canAdvance} onClick={() => onAdvance(nextPhase)}>{nextPhase === "IT programming" ? "Send to IT programming" : "Move to Experience review"}</button></div>
      {!allItemsLocked && <p>All item rows must be locked by Culinary before the menu can advance.</p>}
      {phaseBlocker && <p role="alert">{phaseBlocker}</p>}
    </> : <p>{dataStatus === "error" ? "Shared workspace could not be loaded. No edits or saves are allowed." : "Loading shared SSMT workspace..."}</p>}
  </div>;
}
