import React from "react";
import { createRoot } from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import App from "./App.jsx";
import "./index.css";
import "./leanMobileFlow.css";
import { initSentry, PlatformErrorBoundary } from "./shared/monitoring/sentry.jsx";

initSentry();

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <PlatformErrorBoundary>
      <App />
    </PlatformErrorBoundary>
    <Analytics />
  </React.StrictMode>
);
