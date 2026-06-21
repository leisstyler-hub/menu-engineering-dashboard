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
    .traffic-line-graph { position: relative; height: 198px; margin-top: 20px; overflow: hidden; border: 1px solid #e2e8f0; border-radius: 18px; background: #fff; padding: 18px 18px 12px; box-shadow: 0 10px 24px rgba(15, 23, 42, .04); }
    .traffic-line-plot { position: relative; height: 126px; margin: 0 10px; }
    .traffic-line-svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; display: block; }
    .traffic-line-marker { position: absolute; z-index: 2; height: 10px; width: 10px; border-radius: 999px; border: 2px solid #fff; background: #10b981; box-shadow: 0 3px 10px rgba(15, 118, 110, .2); transform: translate(-50%, -50%); }
    .traffic-line-marker.zero { height: 6px; width: 6px; background: #cbd5e1; opacity: .9; box-shadow: none; }
    .traffic-line-callout { position: absolute; z-index: 4; min-width: 92px; transform: translate(-50%, -100%); border: 1px solid #dbeafe; border-radius: 14px; background: rgba(255,255,255,.96); color: #0f172a; padding: 7px 10px; text-align: left; font-size: 11px; line-height: 1.2; font-weight: 800; box-shadow: 0 12px 30px rgba(15, 23, 42, .1); }
    .traffic-line-callout strong { display: block; color: #0f766e; font-size: 16px; line-height: 1; margin-top: 2px; }
    .traffic-line-days { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 4px; }
    .traffic-line-day { min-width: 0; text-align: center; }
    .traffic-line-day-label { display: block; color: #64748b; font-size: 10px; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; }
    .traffic-line-day-value { display: block; margin-top: 2px; color: #0f172a; font-size: 10px; font-weight: 900; }
    .traffic-line-detail-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 10px; color: #64748b; font-size: 11px; font-weight: 800; }
    .traffic-line-detail-row span:last-child { color: #0f766e; text-transform: uppercase; letter-spacing: .08em; }
    html.dark .traffic-line-card { color: #f8fafc; }
    html.dark .traffic-line-total { color: #f8fafc; }
    html.dark .traffic-line-chip { border-color: #92400e; background: #3b2608; color: #fde68a; }
    html.dark .traffic-line-chip.live { border-color: #0f766e; background: #063b31; color: #a7f3d0; }
    html.dark .traffic-line-graph { border-color: #334155; background: #0f172a; box-shadow: inset 0 1px 0 rgba(255,255,255,.04), 0 16px 34px rgba(0,0,0,.26); }
    html.dark .traffic-line-grid-strong { stroke: #334155; }
    html.dark .traffic-line-grid-soft { stroke: #1f2a3b; }
    html.dark .traffic-line-day-label { color: #94a3b8; }
    html.dark .traffic-line-day-value { color: #e2e8f0; }
    html.dark .traffic-line-marker { border-color: #0f172a; box-shadow: 0 3px 14px rgba(16,185,129,.35); }
    html.dark .traffic-line-marker.zero { background: #64748b; box-shadow: none; }
    html.dark .traffic-line-callout { border-color: #115e59; background: rgba(15,23,42,.96); color: #e2e8f0; box-shadow: 0 16px 36px rgba(0,0,0,.36); }
    html.dark .traffic-line-callout strong { color: #5eead4; }
    html.dark .traffic-line-detail-row { color: #94a3b8; }
    html.dark .traffic-line-detail-row span:last-child { color: #5eead4; }
    @media (max-width: 767px) {
      .traffic-line-total { font-size: 34px; }
      .traffic-line-graph { height: 176px; border-radius: 16px; padding: 16px 10px 12px; }
      .traffic-line-plot { height: 112px; margin: 0 6px; }
      .traffic-line-callout { min-width: 76px; padding: 6px 8px; font-size: 10px; }
      .traffic-line-callout strong { font-size: 14px; }
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
    const y = 78 - (value / max) * 52;
    return { x, y, value };
  });
  const line = points.map((point) => `${point.x},${point.y}`).join(" ");
  const stroke = isLive ? "#0f766e" : "#94a3b8";
  const dot = isLive ? "#10b981" : "#cbd5e1";

  return `
    <svg class="traffic-line-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Visitors by day this week">
      <line class="traffic-line-grid-strong" x1="4" x2="96" y1="22" y2="22" stroke="#e2e8f0" stroke-width="0.6"></line>
      <line class="traffic-line-grid-soft" x1="4" x2="96" y1="52" y2="52" stroke="#eef2f7" stroke-width="0.6"></line>
      <line class="traffic-line-grid-strong" x1="4" x2="96" y1="82" y2="82" stroke="#e2e8f0" stroke-width="0.8"></line>
      <polyline points="${line}" fill="none" stroke="${stroke}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"></polyline>
      ${points.map((point) => `<circle cx="${point.x}" cy="${point.y}" r="2" fill="${dot}" stroke="#ffffff" stroke-width="1.1" vector-effect="non-scaling-stroke"></circle>`).join("")}
    </svg>
  `;
}

function buildGraphMarkers(days, isLive) {
  if (!isLive) return "";
  const values = days.map((day) => Number(day.visitors || 0));
  const max = Math.max(...values, 1);
  const peak = values.reduce((best, value, index) => value > best.value ? { value, index } : best, { value: -1, index: -1 });
  return values.map((value, index) => {
    const x = 6 + (index * 88) / Math.max(days.length - 1, 1);
    const y = 78 - (value / max) * 52;
    const marker = `<span class="traffic-line-marker ${value ? "" : "zero"}" style="left:${x}%; top:${y}%;"></span>`;
    const label = value && index === peak.index
      ? `<span class="traffic-line-callout" style="left:${Math.min(86, Math.max(14, x))}%; top:${Math.max(18, y - 8)}%;">Peak visitors<strong>${value.toLocaleString()}</strong></span>`
      : "";
    return `${label}${marker}`;
  }).join("");
}

function renderTraffic(container, state) {
  const days = state.days?.length ? state.days : PLACEHOLDER_DAYS;
  const isLive = state.status === "live";
  const total = isLive ? days.reduce((sum, day) => sum + Number(day.visitors || 0), 0) : null;
  const chip = isLive ? "Live" : state.status === "loading" ? "Connecting" : "Needs data";
  const latestSignal = isLive
    ? days.filter((day) => Number(day.visitors || 0) > 0).map((day) => `${day.day} ${Number(day.visitors || 0).toLocaleString()}`).join(" / ") || "No visits yet"
    : state.status === "loading" ? "Connecting endpoint" : "Endpoint needs attention";

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
        <div class="traffic-line-plot">
          ${buildGraph(days, isLive)}
          ${buildGraphMarkers(days, isLive)}
        </div>
        <div class="traffic-line-days">
          ${days.map((day) => `
            <div class="traffic-line-day">
              <span class="traffic-line-day-label">${day.day}</span>
              ${isLive ? `<span class="traffic-line-day-value">${Number(day.visitors || 0).toLocaleString()}</span>` : ""}
            </div>
          `).join("")}
        </div>
      </div>
      <div class="traffic-line-detail-row">
        <span>${latestSignal}</span>
        <span>Details</span>
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
