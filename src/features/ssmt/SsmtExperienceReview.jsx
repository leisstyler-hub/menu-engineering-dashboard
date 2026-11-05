import React, { useState } from "react";

const displayValue = (value) => value === undefined || value === null || String(value).trim() === "" ? "Not available" : String(value);

export default function SsmtExperienceReview({ menus, menu, groupsForItem, onSelectMenu, onDescriptionChange, onSave, onAdvance, allItemsLocked, syncMessage, phaseBlocker, dataStatus, onBack, flagModals, flagReportHref, existingFlagForItem, onFlagItem }) {
  const [spellcheck, setSpellcheck] = useState(true);
  const [copyStatus, setCopyStatus] = useState("");
  const [copyFallback, setCopyFallback] = useState("");
  const items = (menu.items || []).filter(item => item.recordType !== "divider" && item.rowType !== "divider");
  const nextPhase = menu.phase === "Culinary draft" ? "Experience review" : "IT programming";
  const canAdvance = ["Culinary draft", "Experience review"].includes(menu.phase) && allItemsLocked;
  const copyAll = async () => {
    const text = [`Menu: ${menu.name}`, `Stage: ${menu.phase}`, ...items.flatMap(item => [
      "", `Item: ${item.label || item.name || "Unnamed item"}`, `MRN: ${displayValue(item.mrn)}`,
      `Description: ${displayValue(item.description)}`, `Dietary: ${displayValue(item.dietaryPreference)}`, `Calories: ${displayValue(item.calories)}`,
      "Modifiers:", ...(groupsForItem(item).length ? groupsForItem(item).flatMap(group => [
        `  ${group.name || group.id} (${displayValue(group.modifierType)})`,
        ...(group.choices || []).map(choice => `    ${choice.label || choice.name || "Unnamed choice"} | ${displayValue(choice.description)} | MRN: ${displayValue(choice.mrn)} | Calories: ${displayValue(choice.calories)}`),
      ]) : ["  No linked modifier groups"]),
    ])].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopyFallback("");
      setCopyStatus("Selected menu copied. Paste it into your chat.");
    } catch {
      setCopyFallback(text);
      setCopyStatus("Clipboard unavailable. Select and copy the text below.");
    }
  };
  return <div className="mx-auto max-w-6xl space-y-4 p-4 pb-28 text-slate-950 md:pb-4">
    <button type="button" onClick={onBack}>Back to Platform</button>
    <h1 className="text-2xl font-black">SSMT - Experience review</h1>
    <p>Edit the shared menu descriptions, save, then send the menu to IT programming.</p>
    <p role="status">{syncMessage}</p>
    {flagModals}
    {dataStatus === "ready" ? <>
      <div className="flex flex-wrap items-center gap-3">
        <label>Menu <select aria-label="Experience menu" value={menu.id} onChange={event => { onSelectMenu(event.target.value); setCopyFallback(""); setCopyStatus(""); }} className="rounded border bg-white p-2">{menus.map(entry => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select></label>
        <span>Current stage: {menu.phase}</span>
        <button type="button" onClick={copyAll} className="rounded border bg-white p-2">Copy all selected menu</button>
      </div>
      {menu.flags?.length > 0 && <div className="rounded border border-amber-400 bg-amber-50 p-3"><p>{menu.flags.length} saved item flags for menu builders.</p><a href={flagReportHref} className="underline">Report flags ({menu.flags.length})</a></div>}
      <label className="flex items-center gap-2"><input type="checkbox" checked={spellcheck} onChange={event => setSpellcheck(event.target.checked)} />Spellcheck descriptions</label>
      <p className="text-sm text-slate-600">Spelling is checked by your browser. Right-click an underlined word for corrections; on mobile, tap the word. Enable English spelling in your browser or keyboard settings if suggestions are unavailable.</p>
      {copyStatus && <p role="status">{copyStatus}</p>}
      {copyFallback && <label className="block">Selected menu text<textarea aria-label="Selected menu text" readOnly value={copyFallback} onFocus={event => event.target.select()} className="mt-1 min-h-48 w-full rounded border p-2" /></label>}
      <div className="space-y-3">{items.map(item => {
        const groups = groupsForItem(item);
        return <section key={item.id} className="space-y-2 rounded-lg border bg-white p-3">
          <h2 className="font-bold">{item.label || item.name}</h2>
          <button type="button" aria-label={existingFlagForItem(item) ? `Edit or clear flag for ${item.label || item.name || "item"}` : "Flag for change"} onClick={() => onFlagItem(item)} className="rounded border border-amber-400 bg-amber-50 px-3 py-2 font-bold text-amber-900">{existingFlagForItem(item) ? "Flagged" : "Flag"}</button>
          {existingFlagForItem(item) && <p className="text-sm text-amber-900">{existingFlagForItem(item).reason}: {existingFlagForItem(item).note}</p>}
          <p className="text-sm">MRN: {displayValue(item.mrn)}</p>
          <div className="flex flex-wrap gap-3 text-sm"><span>{item.dietaryPreference || "Dietary information not available"}</span><span>{displayValue(item.calories) !== "Not available" ? `${item.calories} calories` : "Calories not available"}</span></div>
          <label className="block">Description<textarea aria-label={`Description for ${item.label || item.name}`} value={item.description || ""} onChange={event => onDescriptionChange(item.id, event.target.value)} spellCheck={spellcheck} lang="en-US" className="mt-1 min-h-24 w-full rounded border p-2" /></label>
          {groups.length ? <details><summary className="cursor-pointer font-semibold">View modifiers ({groups.length})</summary><div className="mt-2 space-y-2">{groups.map(group => <section key={group.id} className="rounded border p-2"><h3 className="font-bold">{group.name || group.id}</h3><p className="text-sm">{group.modifierType} | Minimum {displayValue(group.minQty)} | Maximum {displayValue(group.maxQty)}</p><ul className="list-inside list-disc">{(group.choices || []).map(choice => <li key={choice.id}><strong>{choice.label || choice.name}</strong>{choice.description && ` - ${choice.description}`}<span className="block text-sm">MRN: {displayValue(choice.mrn)} | Calories: {displayValue(choice.calories)}</span></li>)}</ul>{!group.choices?.length && <p>No choices available.</p>}</section>)}</div></details> : <p className="text-sm text-slate-600">No linked modifier groups.</p>}
        </section>;
      })}</div>
      {!items.length && <p>No item rows in this menu.</p>}
      <div className="flex flex-wrap gap-3"><button type="button" className="rounded border bg-white p-2" onClick={onSave}>Save SSMT workspace</button><button type="button" className="rounded border bg-white p-2 disabled:opacity-50" disabled={!canAdvance} onClick={() => onAdvance(nextPhase)}>{nextPhase === "IT programming" ? "Send to IT programming" : "Move to Experience review"}</button></div>
      {!allItemsLocked && <p>All item rows must be locked by Culinary before the menu can advance.</p>}
      {phaseBlocker && <p role="alert">{phaseBlocker}</p>}
    </> : <p>{dataStatus === "error" ? "Shared workspace could not be loaded. No edits or saves are allowed." : "Loading shared SSMT workspace..."}</p>}
  </div>;
}
