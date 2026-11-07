import React, { useRef, useState } from "react";
import { Bug, X } from "lucide-react";
import { APP_VERSION_STAMP } from "../shared/appConfig.js";

const RECIPIENT = "tyler.leiss@compass-usa.com";
const TOOL_NAMES = {
  home: "Home", menuEngineering: "Menu Engineering", neighborhoodRotations: "Neighborhood Rotations",
  recipeDatabase: "Menu Library", menuProjects: "Menu Projects", menuAuditTool: "Menu Audit",
  ssmtTool: "SSMT", menuCrossUtilization: "Menu Cross Utilization", transferTool: "Transfer",
  cafeTasting: "Cafe Tasting", commissaryOrdering: "Commissary Ordering", leanTool: "Lean Tool",
  ladleCompliance: "Ladle Compliance", smartsheetHealth: "Data Health",
};

export default function BugReport({ activeTool }) {
  const dialog = useRef(null);
  const trigger = useRef(null);
  const [description, setDescription] = useState("");
  const [tool, setTool] = useState("Home");
  const [copyStatus, setCopyStatus] = useState("");
  const body = `Culinary Tools bug report\n\nTool: ${tool}\nVersion: ${APP_VERSION_STAMP}\n\n${description.trim()}\n\nScreenshots: attach in your email app if helpful.`;
  const href = `mailto:${RECIPIENT}?subject=${encodeURIComponent(`Culinary Tools bug report - ${tool}`)}&body=${encodeURIComponent(body)}`;
  const hasDescription = Boolean(description.trim());

  function openReport() {
    setTool(TOOL_NAMES[activeTool] || activeTool || "Home");
    setCopyStatus("");
    dialog.current.showModal();
  }

  async function copyReport() {
    try {
      await navigator.clipboard.writeText(`To: ${RECIPIENT}\nSubject: Culinary Tools bug report - ${tool}\n\n${body}`);
      setCopyStatus("Report copied. Paste it into an email to Tyler.");
    } catch {
      setCopyStatus("Copy unavailable. Select and copy the report preview below.");
    }
  }

  return <>
    <div className="flex h-14 items-center justify-end border-b border-slate-200 bg-white px-3">
      <button ref={trigger} type="button" aria-label="Report a bug" title="Report a bug" onClick={openReport}
        className="flex h-11 w-11 items-center justify-center rounded-full text-rose-600 hover:bg-rose-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-600">
        <Bug size={23} aria-hidden="true" />
      </button>
    </div>
    <dialog ref={dialog} aria-labelledby="bug-report-title" onClose={() => trigger.current?.focus()}
      className="m-auto max-h-[90dvh] w-[calc(100%-1.5rem)] max-w-lg overflow-y-auto rounded-2xl bg-white p-5 text-slate-900 shadow-2xl backdrop:bg-slate-950/60">
      <div className="flex items-center justify-between gap-3">
        <h2 id="bug-report-title" className="text-xl font-bold">Report a bug</h2>
        <button type="button" aria-label="Close bug report" onClick={() => dialog.current.close()} className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-slate-100"><X aria-hidden="true" /></button>
      </div>
      <p className="mt-2 break-all text-sm">To: {RECIPIENT}</p>
      <p className="mt-1 text-sm text-slate-600">{tool} · {APP_VERSION_STAMP}</p>
      <label htmlFor="bug-description" className="mt-4 block text-sm font-bold">Describe the bug</label>
      <p id="bug-description-help" className="mt-1 text-sm text-slate-600">What happened, and what did you expect? Include steps to reproduce it.</p>
      <textarea id="bug-description" autoFocus aria-describedby="bug-description-help" maxLength={1500} rows={5}
        value={description} onChange={event => { setDescription(event.target.value); setCopyStatus(""); }}
        className="mt-2 block w-full resize-y rounded-lg border border-slate-300 bg-white p-3 text-base text-slate-900" />
      <p className="mt-2 text-xs text-slate-500">{description.length}/1500 characters</p>
      <p className="mt-3 text-sm">Attach screenshots in your email app. Review them for private information before sending.</p>
      <p className="mt-2 text-sm text-slate-600">This form does not send email automatically. Your email app opens a draft for you to review and send.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {hasDescription && <a href={href} className="rounded-lg bg-rose-600 px-4 py-3 text-sm font-bold text-white">Open email to send</a>}
        <button type="button" disabled={!hasDescription} onClick={copyReport} className="rounded-lg border border-slate-300 px-4 py-3 text-sm font-bold disabled:opacity-40">Copy report</button>
      </div>
      <p role="status" className="mt-2 text-sm">{copyStatus}</p>
      {hasDescription && <details className="mt-3 text-sm">
        <summary className="cursor-pointer font-bold">Email did not open? Copy the report</summary>
        <p className="mt-2">Send to {RECIPIENT}. Add screenshots as attachments.</p>
        <textarea aria-label="Report preview" readOnly value={body} rows={7} className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900" />
      </details>}
    </dialog>
  </>;
}
