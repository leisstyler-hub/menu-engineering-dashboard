import React from "react";

import { APP_VERSION_STAMP } from "../appConfig.js";

export default function VersionStamp({ compact = false }) {
  return (
    <div className={`inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 ${compact ? "py-1 text-[11px]" : "py-1.5 text-xs"} font-bold text-sky-800`}>
      App Version: {APP_VERSION_STAMP}
    </div>
  );
}


