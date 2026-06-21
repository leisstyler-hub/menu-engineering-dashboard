const VISITOR_STORAGE_KEY = "culinaryToolsAnonymousVisitorId_v1";
const TRAFFIC_STYLE_ID = "weekly-traffic-enhancer-styles";
const PLACEHOLDER_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => ({
  day,
  visitors: null,
  placeholderLevel: 24 + ((index + 1) % 4) * 14,
}));

function ensureTrafficStyles() {
  if (document.getElementById(TRAFFIC_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = TRAFFIC_STYLE_ID;
  style.textContent = `
    .traffic-line-card { color: #020617; }
    .traffic-line-top { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 12px; }
    .traffic-line-eyebrow { margin: 0; color: #94a3b8; font-size: 12px; font-weight: 900; letter-spacing: .14em; text-transform: uppercase; }
    .traffic-line-total { margin: 4px 0 0; color: #020617; font-size: 40px; line-height: 1; font-weight: 900; }
    .traffic-line-chip { border: 1px solid #fcd34d; background: #fffbeb; color: #78350f; border-radius: 999px; padding: 4px 12px; font-size: 12px; font-weight: 900; }
    .traffic-line-chip.live { border-color: #a7f3d0; background: #ecfdf5; color: #065f46; }
    .traffic-line-graph { position: relative; height: 220px; margin-top: 20px; overflow: hidden; border: 1px solid #e2e8f0; border-radius: 18px; background: linear-gradient(180deg, #fff 0%, #f8fafc 100%); padding: 14px 12px 12px; box-shadow: inset 0 1px 14px rgba(15, 23, 42, .04); }
    .traffic-line-svg { width: 100%; height: calc(100% - 40px); overflow: visible; display: block; }
    .traffic-line-days { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 4px; }
    .traffic-line-day { min-width: 0; text-align: center; }
    .traffic-line-day-label { display: block; color: #64748b; font-size: 10px; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; }
    .traffic-line-day-value { display: block; margin-top: 2px; color: #0f172a; font-size: 10px; font-weight: 900; }
    .traffic-line-note { margin-top: 16px; border: 1px solid #e2e8f0; border-radius: 14px; background: #f8fafc; padding: 12px; }
    .traffic-line-note-title { margin: 0; color: #020617; font-size: 14px; font-weight: 800; }
    .traffic-line-note-body { margin: 4px 0 0; color: #64748b; font-size: 12px; line-height: 1.55; font-weight: 700; }
    @media (max-width: 767px) {
      .traffic-line-total { font-size: 34px; }
      .traffic-line-graph { height: 180px; border-radius: 16px; padding-left: 8px; padding-right: 8px; }
    }
  `;
  document.head.appendChild(style);
}

function getVisitorId() {
  try {
    const existing = window.localStorage.getItem(VISITOR_STORAGE_KEY);
    if (existing) return existing;
    const nextId = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    window.localStorage.setItem(VISITOR_STORAGE_KEY, nextId);
    return nextId;
  } catch {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

function buildGraph(days, isLive) {
  const values = days.map((day) => isLive ? Number(day.visitors || 0) : Number(day.placeholderLevel || 24));
  const max = Math.max(...values, 1);
  const points = values.map((value, index) => {
    const x = 6 + (index * 88) / Math.max(days.length - 1, 1);
    const y = 80 - (value / max) * 54;
    const labelY = Math.max(10, y - 10);
    return { x, y, value, labelY };
  });
  const line = points.map((point) => `${point.x},${point.y}`).join(" ");
  const area = points.length ? `6,92 ${line} 94,92` : "";
  const stroke = isLive ? "#0f766e" : "#94a3b8";
  const dot = isLive ? "#10b981" : "#cbd5e1";
  const fill = isLive ? "rgba(16, 185, 129, 0.16)" : "rgba(148, 163, 184, 0.14)";

  return `
    <svg class="traffic-line-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Visitors by day this week">
      <line x1="4" x2="96" y1="20" y2="20" stroke="#e2e8f0" stroke-width="0.6" stroke-dasharray="2 2"></line>
      <line x1="4" x2="96" y1="53" y2="53" stroke="#e2e8f0" stroke-width="0.6" stroke-dasharray="2 2"></line>
      <line x1="4" x2="96" y1="86" y2="86" stroke="#cbd5e1" stroke-width="0.8"></line>
      ${area ? `<polygon points="${area}" fill="${fill}"></polygon>` : ""}
      <polyline points="${line}" fill="none" stroke="${stroke}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"></polyline>
      ${points.map((point) => `
        <g>
          <rect x="${point.x - 4.6}" y="${point.labelY - 5}" width="9.2" height="8" rx="3.5" fill="${isLive ? "#ecfdf5" : "#f8fafc"}" stroke="${isLive ? "#a7f3d0" : "#cbd5e1"}" stroke-width="0.6" vector-effect="non-scaling-stroke"></rect>
          <text x="${point.x}" y="${point.labelY + 0.9}" text-anchor="middle" font-size="5.2" font-weight="900" fill="${isLive ? "#065f46" : "#475569"}" style="font-family: system-ui, -apple-system, Segoe UI, sans-serif;">${isLive ? point.value.toLocaleString() : ""}</text>
          <line x1="${point.x}" x2="${point.x}" y1="${point.labelY + 4}" y2="${point.y - 3.2}" stroke="${isLive ? "#a7f3d0" : "#cbd5e1"}" stroke-width="0.5" stroke-dasharray="1.2 1.2" vector-effect="non-scaling-stroke"></line>
          <circle cx="${point.x}" cy="${point.y}" r="2.8" fill="${dot}" stroke="#ffffff" stroke-width="1.4" vector-effect="non-scaling-stroke"></circle>
        </g>
      `).join("")}
    </svg>
  `;
}

function renderTraffic(container, state) {
  const days = state.days?.length ? state.days : PLACEHOLDER_DAYS;
  const isLive = state.status === "live";
  const total = isLive ? days.reduce((sum, day) => sum + Number(day.visitors || 0), 0) : null;
  const chip = isLive ? "Live" : state.status === "loading" ? "Connecting" : "Needs data";
  const title = isLive ? "Secure endpoint connected" : state.status === "loading" ? "Connecting traffic endpoint" : "Traffic endpoint needs attention";
  const message = state.message || "Anonymous weekly visitor totals will appear here after the endpoint responds.";

  container.innerHTML = `
    <div class="traffic-line-card">
      <div class="traffic-line-top">
        <div>
          <p class="traffic-line-eyebrow">Visitors this week</p>
          <p class="traffic-line-total">${isLive ? total.toLocaleString() : "--"}</p>
        </div>
        <span class="traffic-line-chip ${isLive ? "live" : ""}">${chip}</span>
      </div>
      <div class="traffic-line-graph">
        ${buildGraph(days, isLive)}
        <div class="traffic-line-days">
          ${days.map((day) => `
            <div class="traffic-line-day">
              <span class="traffic-line-day-label">${day.day}</span>
              ${isLive ? `<span class="traffic-line-day-value">${Number(day.visitors || 0).toLocaleString()}</span>` : ""}
            </div>
          `).join("")}
        </div>
      </div>
      <div class="traffic-line-note">
        <p class="traffic-line-note-title">${title}</p>
        <p class="traffic-line-note-body">${message}</p>
      </div>
    </div>
  `;
}

function getWeeklyTrafficContainers() {
  return Array.from(document.querySelectorAll("h2"))
    .filter((heading) => heading.textContent?.trim() === "Weekly Traffic")
    .map((heading) => {
      const section = heading.closest("section");
      if (!section) return null;
      const directContent = Array.from(section.children).find((child) => child !== heading.parentElement && child.className?.toString().includes("mt-5"));
      return directContent || section.querySelector(".mobile-data-icon")?.parentElement?.nextElementSibling || null;
    })
    .filter(Boolean);
}

async function loadTraffic() {
  const response = await fetch("/api/traffic/weekly", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      visitorId: getVisitorId(),
      path: `${window.location.pathname}${window.location.search}`,
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.ok === false) {
    throw new Error(payload.message || "Traffic endpoint unavailable");
  }
  return payload;
}

function enhanceTrafficPanels() {
  const containers = getWeeklyTrafficContainers();
  if (!containers.length) return false;
  ensureTrafficStyles();
  containers.forEach((container) => {
    if (container.dataset.trafficEnhanced === "true") return;
    container.dataset.trafficEnhanced = "true";
    renderTraffic(container, {
      days: PLACEHOLDER_DAYS,
      status: "loading",
      message: "Connecting secure traffic endpoint...",
    });
  });

  loadTraffic()
    .then((payload) => {
      getWeeklyTrafficContainers().forEach((container) => renderTraffic(container, {
        days: Array.isArray(payload.days) ? payload.days : PLACEHOLDER_DAYS,
        status: "live",
        message: "Anonymous weekly visitors from the secure app endpoint.",
      }));
    })
    .catch((error) => {
      getWeeklyTrafficContainers().forEach((container) => renderTraffic(container, {
        days: PLACEHOLDER_DAYS,
        status: "error",
        message: error.message || "Traffic endpoint unavailable",
      }));
    });

  return true;
}

function startTrafficEnhancer() {
  if (typeof window === "undefined") return;
  let attempts = 0;
  const tick = () => {
    attempts += 1;
    if (enhanceTrafficPanels() || attempts > 20) return;
    window.setTimeout(tick, 250);
  };

  tick();
  const observer = new MutationObserver(() => enhanceTrafficPanels());
  observer.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startTrafficEnhancer, { once: true });
} else {
  startTrafficEnhancer();
}
