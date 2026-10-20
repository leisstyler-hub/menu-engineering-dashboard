import React from "react";
import { createRoot } from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import App from "./App.jsx";
import BrandEntrance from "./app/BrandEntrance.jsx";
import "./index.css";
import "./leanMobileFlow.css";
import { initSentry, PlatformErrorBoundary } from "./shared/monitoring/sentry.jsx";

import { captureSsmtAuthRedirect } from "./features/ssmt/ssmtAuthRedirect.js";

captureSsmtAuthRedirect(window.location, window.history);
initSentry();

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <PlatformErrorBoundary>
      <App />
      <BrandEntrance />
    </PlatformErrorBoundary>
    <Analytics />
  </React.StrictMode>
);
