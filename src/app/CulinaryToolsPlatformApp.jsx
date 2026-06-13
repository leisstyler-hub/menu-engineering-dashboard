import React, { useState } from "react";
import LandingPage from "./LandingPage.jsx";
import MenuEngineeringDashboard from "../features/menu-engineering/MenuEngineeringDashboard.jsx";
import NeighborhoodRotations from "../features/neighborhood-rotations/NeighborhoodRotations.jsx";
import LadleComplianceDashboard from "../features/ladle-compliance/LadleComplianceDashboard.jsx";
import LeanTool from "../features/lean-tool/LeanTool.jsx";

export default function CulinaryToolsPlatformApp() {
  const [activeTool, setActiveTool] = useState("home");

  if (activeTool === "menuEngineering") {
    return <MenuEngineeringDashboard onBackToPlatform={() => setActiveTool("home")} />;
  }

  if (activeTool === "neighborhoodRotations") {
    return <NeighborhoodRotations onBackToPlatform={() => setActiveTool("home")} />;
  }

  if (activeTool === "ladleCompliance") {
    return <LadleComplianceDashboard onBackToPlatform={() => setActiveTool("home")} />;
  }

  if (activeTool === "leanTool") {
    return <LeanTool onBackToPlatform={() => setActiveTool("home")} />;
  }

  return (
    <LandingPage
      onOpenMenuEngineering={() => setActiveTool("menuEngineering")}
      onOpenNeighborhoodRotations={() => setActiveTool("neighborhoodRotations")}
      onOpenLadleCompliance={() => setActiveTool("ladleCompliance")}
      onOpenLeanTool={() => setActiveTool("leanTool")}
    />
  );
}

