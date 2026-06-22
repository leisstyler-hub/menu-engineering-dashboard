import React, { useEffect, useState } from "react";
import { BarChart3, BookOpen, CalendarRange, Home, ShieldCheck } from "lucide-react";
import LandingPage from "./LandingPage.jsx";
import MenuEngineeringDashboard from "../features/menu-engineering/MenuEngineeringDashboard.jsx";
import NeighborhoodRotations from "../features/neighborhood-rotations/NeighborhoodRotations.jsx";
import LadleComplianceDashboard from "../features/ladle-compliance/LadleComplianceDashboard.jsx";
import LeanTool from "../features/lean-tool/LeanTool.jsx";
import RecipeDatabase from "../features/recipe-database/RecipeDatabase.jsx";
import SmartsheetHealth from "../features/smartsheet-health/SmartsheetHealth.jsx";
import { addToolBreadcrumb, setActiveToolContext } from "../shared/monitoring/sentry.jsx";

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
        <MenuEngineeringDashboard onBackToPlatform={() => setActiveTool("home")} onOpenSmartsheetHealth={openSmartsheetHealth} />
        <MobileToolNav activeTool={activeTool} setActiveTool={setActiveTool} />
      </>
    );
  }

  if (activeTool === "neighborhoodRotations") {
    return (
      <>
        <NeighborhoodRotations onBackToPlatform={() => setActiveTool("home")} onOpenSmartsheetHealth={openSmartsheetHealth} />
        <MobileToolNav activeTool={activeTool} setActiveTool={setActiveTool} />
      </>
    );
  }

  if (activeTool === "recipeDatabase") {
    return (
      <>
        <RecipeDatabase onBackToPlatform={() => setActiveTool("home")} onOpenSmartsheetHealth={openSmartsheetHealth} />
        <MobileToolNav activeTool={activeTool} setActiveTool={setActiveTool} />
      </>
    );
  }

  if (activeTool === "ladleCompliance") {
    return (
      <>
        <LadleComplianceDashboard onBackToPlatform={() => setActiveTool("home")} onOpenSmartsheetHealth={openSmartsheetHealth} />
        <MobileToolNav activeTool={activeTool} setActiveTool={setActiveTool} />
      </>
    );
  }

  if (activeTool === "leanTool") {
    return (
      <>
        <LeanTool onBackToPlatform={() => setActiveTool("home")} onOpenSmartsheetHealth={openSmartsheetHealth} />
      </>
    );
  }

  if (activeTool === "smartsheetHealth") {
    return (
      <>
        <SmartsheetHealth onBackToPlatform={() => setActiveTool("home")} />
        <MobileToolNav activeTool={activeTool} setActiveTool={setActiveTool} />
      </>
    );
  }

  return (
    <LandingPage
      onOpenMenuEngineering={() => setActiveTool("menuEngineering")}
      onOpenNeighborhoodRotations={() => setActiveTool("neighborhoodRotations")}
      onOpenRecipeDatabase={() => setActiveTool("recipeDatabase")}
      onOpenLadleCompliance={() => setActiveTool("ladleCompliance")}
      onOpenLeanTool={() => setActiveTool("leanTool")}
      onOpenSmartsheetHealth={openSmartsheetHealth}
    />
  );
}

function MobileToolNav({ activeTool, setActiveTool }) {
  const items = [
    { key: "home", label: "Home", icon: Home },
    { key: "menuEngineering", label: "Engineering", icon: BarChart3 },
    { key: "recipeDatabase", label: "Recipes", icon: BookOpen },
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

