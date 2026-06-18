import React, { useEffect, useRef, useState } from "react";
import { Database, Moon, Printer, RefreshCcw, Settings, Sun } from "lucide-react";

const THEME_STORAGE_KEY = "culinaryToolsTheme";

function applyTheme(theme) {
  const dark = theme === "dark";
  document.documentElement.classList.toggle("dark", dark);
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export default function PlatformSettings({ onRefresh, onOpenSmartsheetHealth, label = "Settings" }) {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "light";
    return localStorage.getItem(THEME_STORAGE_KEY) || "light";
  });
  const menuRef = useRef(null);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const close = (event) => {
      if (!menuRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const refresh = () => {
    setOpen(false);
    if (onRefresh) {
      onRefresh();
      return;
    }
    window.location.reload();
  };

  const printView = () => {
    setOpen(false);
    window.setTimeout(() => window.print(), 50);
  };
  const iconOnly = React.isValidElement(label);

  return (
    <div ref={menuRef} className="relative print:hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Settings"
        className={`inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 ${iconOnly ? "h-10 w-10 p-0" : "px-3 py-2"}`}
      >
        {!iconOnly && <Settings size={17} />}
        {label}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">App Settings</p>
            <p className="mt-1 text-sm font-bold text-slate-950">Display and quick actions</p>
          </div>
          <div className="p-2">
            <button
              type="button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              <span className="inline-flex items-center gap-2">
                {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
                {theme === "dark" ? "Use Light Mode" : "Use Dark Mode"}
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-black uppercase text-slate-500">
                {theme}
              </span>
            </button>
            <button
              type="button"
              onClick={refresh}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-3 text-left text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              <RefreshCcw size={17} />
              Refresh Current View
            </button>
            {onOpenSmartsheetHealth && (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onOpenSmartsheetHealth();
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-3 text-left text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                <Database size={17} />
                Smartsheet Health
              </button>
            )}
            <button
              type="button"
              onClick={printView}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-3 text-left text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              <Printer size={17} />
              Print / Save PDF
            </button>
          </div>
          <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold leading-5 text-slate-500">
            Print uses the browser print window, so you can save the current view as a PDF.
          </div>
        </div>
      )}
    </div>
  );
}
