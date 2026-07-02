import React from "react";
import * as Sentry from "@sentry/react";

import { APP_VERSION_STAMP } from "../appConfig.js";

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN || "";
const SENTRY_ENVIRONMENT = import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE || "production";

function sampleRateFromEnv(key, fallback) {
  const value = Number(import.meta.env[key]);
  return Number.isFinite(value) ? value : fallback;
}

export function initSentry() {
  if (!SENTRY_DSN) return false;

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: SENTRY_ENVIRONMENT,
    release: `culinary-tools-platform@${APP_VERSION_STAMP}`,
    sendDefaultPii: false,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: sampleRateFromEnv("VITE_SENTRY_TRACES_SAMPLE_RATE", SENTRY_ENVIRONMENT === "production" ? 0.2 : 1),
    replaysSessionSampleRate: sampleRateFromEnv("VITE_SENTRY_REPLAY_SESSION_SAMPLE_RATE", 0),
    replaysOnErrorSampleRate: sampleRateFromEnv("VITE_SENTRY_REPLAY_ERROR_SAMPLE_RATE", 1),
    beforeSend(event) {
      event.tags = {
        ...event.tags,
        app: "culinary-tools-platform",
        app_version: APP_VERSION_STAMP,
      };
      return event;
    },
    initialScope: {
      tags: {
        app: "culinary-tools-platform",
        app_version: APP_VERSION_STAMP,
      },
    },
  });

  return true;
}

export function setActiveToolContext(activeTool) {
  if (!SENTRY_DSN) return;
  Sentry.setTag("active_tool", activeTool || "home");
  Sentry.setContext("culinary_tool", {
    activeTool: activeTool || "home",
    version: APP_VERSION_STAMP,
  });
}

export function addToolBreadcrumb(activeTool, message) {
  if (!SENTRY_DSN) return;
  Sentry.addBreadcrumb({
    category: "tool.navigation",
    level: "info",
    message: message || `Opened ${activeTool || "home"}`,
    data: {
      activeTool: activeTool || "home",
      version: APP_VERSION_STAMP,
    },
  });
}

export function PlatformErrorBoundary({ children }) {
  return (
    <Sentry.ErrorBoundary fallback={({ error, resetError }) => <CrashFallback error={error} onReset={resetError} />}>
      {children}
    </Sentry.ErrorBoundary>
  );
}

function CrashFallback({ error, onReset }) {
  const message = String(error?.message || "");
  const isStaleBundle = message.includes("Failed to fetch dynamically imported module")
    || message.includes("Importing a module script failed")
    || message.includes("Loading chunk");

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-slate-950">
      <section className="w-full max-w-xl rounded-[2rem] border border-rose-200 bg-white p-6 shadow-2xl">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-rose-600">App protection</p>
        <h1 className="mt-2 text-3xl font-black">{isStaleBundle ? "Refreshing to the newest app version." : "Something broke in this view."}</h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
          {isStaleBundle
            ? "This usually happens right after a publish when the browser is holding an old app file. Reloading will pull the current version."
            : "The issue was captured for review if Sentry is configured. You can try reloading the view without losing the whole platform."}
        </p>
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Error</p>
          <p className="mt-1 break-words text-sm font-bold text-slate-700">{error?.message || "Unknown client error"}</p>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" onClick={onReset} className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-800">
            Try again
          </button>
          <button type="button" onClick={() => window.location.reload()} className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-800 hover:bg-slate-100">
            {isStaleBundle ? "Refresh latest app" : "Reload app"}
          </button>
        </div>
      </section>
    </main>
  );
}
