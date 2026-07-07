import React, { Suspense, lazy, useEffect, useState } from "react";
import { BarChart3, BookOpen, CalendarRange, ClipboardCheck, FolderKanban, Home, ShieldCheck } from "lucide-react";
import LandingPage from "./LandingPage.jsx";
import { addToolBreadcrumb, setActiveToolContext } from "../shared/monitoring/sentry.jsx";

const CHUNK_RELOAD_KEY = "culinaryToolsChunkReloaded";

function isMissingChunkError(error) {
  const message = String(error?.message || error || "");
  return message.includes("Failed to fetch dynamically imported module")
    || message.includes("Importing a module script failed")
    || message.includes("Loading chunk")
    || message.includes("dynamically imported module");
}

function lazyWithStaleBundleReload(factory) {
  return lazy(async () => {
    try {
      const loaded = await factory();
      if (typeof window !== "undefined") window.sessionStorage.removeItem(CHUNK_RELOAD_KEY);
      return loaded;
    } catch (error) {
      if (typeof window !== "undefined" && isMissingChunkError(error) && window.sessionStorage.getItem(CHUNK_RELOAD_KEY) !== "true") {
        window.sessionStorage.setItem(CHUNK_RELOAD_KEY, "true");
        window.location.reload();
      }
      throw error;
    }
  });
}

const MenuEngineeringDashboard = lazyWithStaleBundleReload(() => import("../features/menu-engineering/MenuEngineeringDashboard.jsx"));
const NeighborhoodRotations = lazyWithStaleBundleReload(() => import("../features/neighborhood-rotations/NeighborhoodRotations.jsx"));
const LadleComplianceDashboard = lazyWithStaleBundleReload(() => import("../features/ladle-compliance/LadleComplianceDashboard.jsx"));
const LeanTool = lazyWithStaleBundleReload(() => import("../features/lean-tool/LeanTool.jsx"));
const RecipeDatabase = lazyWithStaleBundleReload(() => import("../features/recipe-database/RecipeDatabase.jsx"));
const MenuProjects = lazyWithStaleBundleReload(() => import("../features/menu-projects/MenuProjects.jsx"));
const MenuAuditTool = lazyWithStaleBundleReload(() => import("../features/menu-audit/MenuAuditTool.jsx"));
const SmartsheetHealth = lazyWithStaleBundleReload(() => import("../features/smartsheet-health/SmartsheetHealth.jsx"));

export default function CulinaryToolsPlatformApp() {
  const [activeTool, setActiveTool] = useState("home");
  const openSmartsheetHealth = () => setActiveTool("smartsheetHealth");

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    setActiveToolContext(activeTool);
    addToolBreadcrumb(activeTool);
  }, [activeTool]);

  if (activeTool === "menuEngineering") {
    return (
      <>
        <Suspense fallback={<ToolLoading title="Opening Menu Engineering" />}>
          <MenuEngineeringDashboard onBackToPlatform={() => setActiveTool("home")} onOpenSmartsheetHealth={openSmartsheetHealth} />
        </Suspense>
        <MobileToolNav activeTool={activeTool} setActiveTool={setActiveTool} />
      </>
    );
  }

  if (activeTool === "neighborhoodRotations") {
    return (
      <>
        <Suspense fallback={<ToolLoading title="Opening Neighborhood Rotations" />}>
          <NeighborhoodRotations onBackToPlatform={() => setActiveTool("home")} onOpenSmartsheetHealth={openSmartsheetHealth} />
        </Suspense>
        <MobileToolNav activeTool={activeTool} setActiveTool={setActiveTool} />
      </>
    );
  }

  if (activeTool === "recipeDatabase") {
    return (
      <>
        <Suspense fallback={<ToolLoading title="Opening Recipe Library" />}>
          <RecipeDatabase onBackToPlatform={() => setActiveTool("home")} onOpenSmartsheetHealth={openSmartsheetHealth} />
        </Suspense>
        <MobileToolNav activeTool={activeTool} setActiveTool={setActiveTool} />
      </>
    );
  }

  if (activeTool === "menuProjects") {
    return (
      <>
        <Suspense fallback={<ToolLoading title="Opening Menu Projects" />}>
          <MenuProjects onBackToPlatform={() => setActiveTool("home")} onOpenSmartsheetHealth={openSmartsheetHealth} />
        </Suspense>
        <MobileToolNav activeTool={activeTool} setActiveTool={setActiveTool} />
      </>
    );
  }

  if (activeTool === "menuAuditTool") {
    return (
      <>
        <Suspense fallback={<ToolLoading title="Opening Menu Audit Tool" />}>
          <MenuAuditTool onBackToPlatform={() => setActiveTool("home")} onOpenSmartsheetHealth={openSmartsheetHealth} />
        </Suspense>
        <MobileToolNav activeTool={activeTool} setActiveTool={setActiveTool} />
      </>
    );
  }

  if (activeTool === "ladleCompliance") {
    return (
      <>
        <Suspense fallback={<ToolLoading title="Opening Ladle Compliance" />}>
          <LadleComplianceDashboard onBackToPlatform={() => setActiveTool("home")} onOpenSmartsheetHealth={openSmartsheetHealth} />
        </Suspense>
        <MobileToolNav activeTool={activeTool} setActiveTool={setActiveTool} />
      </>
    );
  }

  if (activeTool === "leanTool") {
    return (
      <>
        <Suspense fallback={<ToolLoading title="Opening Lean Tool" />}>
          <LeanTool onBackToPlatform={() => setActiveTool("home")} onOpenSmartsheetHealth={openSmartsheetHealth} />
        </Suspense>
      </>
    );
  }

  if (activeTool === "smartsheetHealth") {
    return (
      <>
        <Suspense fallback={<ToolLoading title="Opening Data Health" />}>
          <SmartsheetHealth onBackToPlatform={() => setActiveTool("home")} />
        </Suspense>
        <MobileToolNav activeTool={activeTool} setActiveTool={setActiveTool} />
      </>
    );
  }

  return (
    <LandingPage
      onOpenMenuEngineering={() => setActiveTool("menuEngineering")}
      onOpenNeighborhoodRotations={() => setActiveTool("neighborhoodRotations")}
      onOpenRecipeDatabase={() => setActiveTool("recipeDatabase")}
      onOpenMenuProjects={() => setActiveTool("menuProjects")}
      onOpenMenuAuditTool={() => setActiveTool("menuAuditTool")}
      onOpenLadleCompliance={() => setActiveTool("ladleCompliance")}
      onOpenLeanTool={() => setActiveTool("leanTool")}
      onOpenSmartsheetHealth={openSmartsheetHealth}
    />
  );
}

function ToolLoading({ title }) {
  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-950">
      <div className="mx-auto flex min-h-[360px] max-w-4xl items-center justify-center">
        <div className="rounded-[2rem] border border-sky-200 bg-white p-8 text-center shadow-xl">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-500" />
          <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-emerald-600">Loading</p>
          <h1 className="mt-2 text-2xl font-black">{title}</h1>
        </div>
      </div>
    </div>
  );
}

function MobileToolNav({ activeTool, setActiveTool }) {
  const items = [
    { key: "home", label: "Home", icon: Home },
    { key: "menuEngineering", label: "Engineering", icon: BarChart3 },
    { key: "recipeDatabase", label: "Library", icon: BookOpen },
    { key: "menuProjects", label: "Projects", icon: FolderKanban },
    { key: "menuAuditTool", label: "Audit", icon: ClipboardCheck },
    { key: "neighborhoodRotations", label: "Rotations", icon: CalendarRange },
    { key: "ladleCompliance", label: "Compliance", icon: ShieldCheck },
  ];

  return (
    <nav className="global-mobile-tool-nav md:hidden" aria-label="Mobile tool navigation">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => setActiveTool(item.key)}
            className={activeTool === item.key ? "active" : ""}
          >
            <Icon size={20} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

