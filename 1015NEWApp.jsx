import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { Search, Star, TrendingUp, HelpCircle, Dog, SlidersHorizontal, ChefHat, DollarSign, ArrowLeft, AlertTriangle, Building2, CalendarDays, CheckCircle2, ChevronDown, ChevronUp, ClipboardList, Upload } from "lucide-react";

import MENUWORKS_ITEMS from "./data/menuItems.json";

const APP_VERSION_STAMP = "v2026-06-04-1015-smartsheet-missing-column-debug";

// Smartsheet database contract. Keep these labels exactly matched to the master database column names.
const SMARTSHEET_DATABASE_STORAGE_KEY = "culinaryToolsSmartsheetReadyRecords_v1";
const NEIGHBORHOOD_ROTATIONS_STORAGE_KEY = "neighborhoodRotations_v6_databaseAligned";

const SMARTSHEET_COLUMNS = Object.freeze({
  recordId: "Record ID",
  parentRecordId: "Parent Record ID",
  recordType: "Record Type",
  status: "Status",
  district: "District",
  cafeUnit: "Café / Unit",
  weekStartDate: "Week Start Date",
  weekEndDate: "Week End Date",
  businessDate: "Business Date",
  dayOfWeek: "Day of Week",
  dateRangeLabel: "Date Range Label",
  station: "Station",
  stationDisplayName: "Station Display Name",
  stationKey: "Station Key",
  stationSortOrder: "Station Sort Order",
  slotNumber: "Slot Number",
  menuConcept: "Menu / Concept",
  stationSubConcept: "Station / Sub-Concept",
  menuBlockLabel: "Menu Block Label",
  menuBlockType: "Menu Block Type",
  globalBlockId: "Global Block ID",
  globalBlockIndex: "Global Block Index",
  globalBlockDays: "Global Block Days",
  isReadOnly: "Is Read Only",
  startedPreviousWeek: "Started Previous Week",
  continuesNextWeek: "Continues Next Week",
  nextWeekCarryoverDays: "Next Week Carryover Days",
  cycleSourceWeekStartDate: "Cycle Source Week Start Date",
  cycleSourceCafeUnit: "Cycle Source Café / Unit",
  cycleSourceRecordId: "Cycle Source Record ID",
  copiedFromCafeUnit: "Copied From Café / Unit",
  copiedFromRecordId: "Copied From Record ID",
  allowedOverlapGroup: "Allowed Overlap Group",
  promotionOverrideEnabled: "Promotion Override Enabled",
  promotionName: "Promotion Name",
  promotionDays: "Promotion Days",
  promotionStartDate: "Promotion Start Date",
  promotionEndDate: "Promotion End Date",
  returnToCycleDays: "Return To Cycle Days",
  returnToCycleStartDate: "Return To Cycle Start Date",
  returnToCycleEndDate: "Return To Cycle End Date",
  breaksNormalCycle: "Breaks Normal Cycle",
  cycleRecoveryNotes: "Cycle Recovery Notes",
  selectionType: "Selection Type",
  menuItemSelection: "Menu Item / Selection",
  mrn: "MRN",
  portion: "Portion",
  menuItemSortOrder: "Menu Item Sort Order",
  price: "Price",
  trueCost: "True Cost",
  foodCostPct: "Food Cost %",
  costRangeLow: "Cost Range Low",
  costRangeHigh: "Cost Range High",
  foodCostRangeLowPct: "Food Cost Range Low %",
  foodCostRangeHighPct: "Food Cost Range High %",
  enticingDescription: "Enticing Description",
  dietTags: "Diet Tags",
  allergens: "Allergens",
  uploadedSourceFileName: "Uploaded Source File Name",
  uploadedReportType: "Uploaded Report Type",
  detectedCafe: "Detected Café",
  detectedStation: "Detected Station",
  detectedDateRange: "Detected Date Range",
  sourceStationName: "Source Station Name",
  mappedStationKey: "Mapped Station Key",
  stationMappingNotes: "Station Mapping Notes",
  uploadedItemName: "Uploaded Item Name",
  matchedMenuWorksItem: "Matched MenuWorks Item",
  matchedMrn: "Matched MRN",
  matchConfidence: "Match Confidence",
  unmatchedItems: "Unmatched Items",
  uploadApplied: "Upload Applied",
  submittedBy: "Submitted By",
  submittedAt: "Submitted At",
  updatedBy: "Updated By",
  updatedAt: "Updated At",
  approvedBy: "Approved By",
  approvedAt: "Approved At",
  notes: "Notes",
  internalReviewNotes: "Internal Review Notes",
  alertType: "Alert Type",
  alertMessage: "Alert Message",
  alertSeverity: "Alert Severity",
  alertRecipients: "Alert Recipients",
  alertSent: "Alert Sent",
  alertSentAt: "Alert Sent At",
  alertResolved: "Alert Resolved",
  alertResolutionNotes: "Alert Resolution Notes",
  savedEntryCount: "Saved Entry Count",
  submittedEntryCount: "Submitted Entry Count",
  draftEntryCount: "Draft Entry Count",
  projectedFoodCostPct: "Projected Food Cost %",
  projectedTrueCostLow: "Projected True Cost Low",
  projectedTrueCostHigh: "Projected True Cost High",
  mostUsedMenuFlag: "Most Used Menu Flag",
  historyInclude: "History Include",
  ladleTotalTasks: "Ladle Total Tasks",
  ladleCompletedTasks: "Ladle Completed Tasks",
  ladleMissedTasks: "Ladle Missed Tasks",
  ladleCompliancePct: "Ladle Compliance %",
  ladleTargetPct: "Ladle Target %",
  ladleStatus: "Ladle Status",
  ladleTrend: "Ladle Trend",
  ladlePreviousCompliancePct: "Ladle Previous Compliance %",
  ladleVariancePct: "Ladle Variance %",
  ladleFocusArea: "Ladle Focus Area",
  ladleFollowUpNeeded: "Ladle Follow-Up Needed",
  ladleFollowUpOwner: "Ladle Follow-Up Owner",
  ladleFollowUpNotes: "Ladle Follow-Up Notes",
});

const SMARTSHEET_RECORD_TYPES = Object.freeze({
  rotationHeader: "Rotation Header",
  globalBlock: "Global Block",
  globalSelection: "Global Selection",
  stationSelection: "Station Selection",
  grillSelection: "Grill Selection",
  carverySelection: "Carvery Selection",
  wokSelection: "Wok Selection",
  weekAtGlanceUpload: "Week at a Glance Upload",
  uploadedItem: "Uploaded Item",
  alertNotification: "Alert / Notification",
  ladleCompliance: "Ladle Compliance",
  menuWorksItem: "MenuWorks Item",
  menuEngineeringScenario: "Menu Engineering Scenario",
});

const SMARTSHEET_SELECTION_TYPES = Object.freeze({
  entree: "Entrée",
  side: "Side",
  subRecipe: "Sub Recipe",
  extension: "Extension",
  lto: "LTO",
  regionalSpecial: "Regional Special",
  locationSpotlight: "Location Spotlight",
  carveryProtein: "Carvery Protein",
  carveryVegetable: "Carvery Vegetable",
  carveryStarch: "Carvery Starch",
  carveryHotSide: "Carvery Hot Side",
  carveryColdSide: "Carvery Cold Side",
  wokEntree: "Wok Entrée",
  wokSide: "Wok Side",
  wokBase: "Wok Base",
  wokSubRecipe: "Wok Sub Recipe",
  complianceMetric: "Compliance Metric",
});

const STATION_SMARTSHEET_LABELS = Object.freeze({
  global: "Global",
  wok: "Wok",
  grill: "Grill",
  carvery: "Carvery",
  salad: "Salad",
  pizza: "Pizza",
  deli: "Deli",
  fishMarket: "Fish Market",
  freshFive: "Fresh Five",
  soup: "Soup",
  ladle: "Ladle",
});

const REQUIRED_SMARTSHEET_COLUMNS_FOR_CURRENT_BUILD = Object.freeze(Object.values(SMARTSHEET_COLUMNS));


const money = (value) =>
  value == null || Number.isNaN(Number(value))
    ? "—"
    : Number(value).toLocaleString(undefined, { style: "currency", currency: "USD" });

const pct = (value) =>
  value == null || Number.isNaN(Number(value))
    ? "—"
    : String((Number(value) * 100).toFixed(1)) + "%";

const priceLabel = (value) =>
  value == null || Number.isNaN(Number(value)) ? "Complimentary" : money(value);

const titleCase = (value) =>
  String(value || "")
    .split(" ")
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(" ");

const getMenuEngineeringCategoryRank = (row) => {
  if (row.price == null) return 4;
  const category = String(row.category || row.itemCategory || row.type || "").toLowerCase();
  const name = String(row.item || row.recipeName || row.displayName || row.shortName || "").toLowerCase();
  if (category.includes("entree") || category.includes("entrée") || row.price >= 9) return 1;
  if (category.includes("side") || (row.price < 9 && !/cookie|cake|dessert|lassi|beverage|drink|chips|bar|brownie|fruit leather/i.test(name))) return 2;
  if (category.includes("extension") || /cookie|cake|dessert|lassi|beverage|drink|chips|bar|brownie|fruit leather/i.test(name)) return 3;
  return 4;
};

const smartMenuEngineeringSort = (a, b) => {
  const categoryCompare = getMenuEngineeringCategoryRank(a) - getMenuEngineeringCategoryRank(b);
  if (categoryCompare !== 0) return categoryCompare;
  const stationCompare = String(a.station || "").localeCompare(String(b.station || ""));
  if (stationCompare !== 0) return stationCompare;
  return String(a.item || "").localeCompare(String(b.item || ""));
};

function classify(marginHigh, volumeHigh) {
  if (marginHigh && volumeHigh) return "STAR";
  if (!marginHigh && volumeHigh) return "CASH COW";
  if (marginHigh && !volumeHigh) return "PUZZLE";
  return "DOG";
}

const classConfig = {
  STAR: {
    icon: Star,
    label: "Star",
    note: "High margin / high volume",
    action: "Protect and promote.",
    badge: "bg-emerald-100 text-emerald-900 border-emerald-200",
  },
  "CASH COW": {
    icon: TrendingUp,
    label: "Cash Cow",
    note: "Low margin / high volume",
    action: "Review price, portion, or cost.",
    badge: "bg-sky-100 text-sky-900 border-sky-200",
  },
  PUZZLE: {
    icon: HelpCircle,
    label: "Puzzle",
    note: "High margin / low volume",
    action: "Improve placement or merchandising.",
    badge: "bg-amber-100 text-amber-900 border-amber-200",
  },
  DOG: {
    icon: Dog,
    label: "Dog",
    note: "Low margin / low volume",
    action: "Consider rework or removal.",
    badge: "bg-rose-100 text-rose-900 border-rose-200",
  },
  COMPLIMENTARY: {
    icon: ChefHat,
    label: "Complimentary",
    note: "No sell price",
    action: "Included item, sauce, or garnish.",
    badge: "bg-slate-100 text-slate-700 border-slate-200",
  },
};

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getHealthGrade(score) {
  if (score >= 85) return { label: "Strong", tone: "text-emerald-700", fill: "bg-emerald-500", bg: "bg-emerald-50", border: "border-emerald-200" };
  if (score >= 70) return { label: "Stable", tone: "text-sky-700", fill: "bg-sky-500", bg: "bg-sky-50", border: "border-sky-200" };
  if (score >= 55) return { label: "Watch", tone: "text-amber-700", fill: "bg-amber-500", bg: "bg-amber-50", border: "border-amber-200" };
  return { label: "Critical", tone: "text-red-700", fill: "bg-red-500", bg: "bg-red-50", border: "border-red-200" };
}

function calculateMenuHealth({ avgFoodCost, grossProfitPct, stars, cashCows, puzzles, dogs, totalItems, targetFoodCost, targetMarginPct }) {
  const activeItems = Math.max(1, totalItems || 1);
  const starPct = stars / activeItems;
  const dogPct = dogs / activeItems;
  const cashCowPct = cashCows / activeItems;
  const puzzlePct = puzzles / activeItems;

  const fcTargetPct = targetFoodCost == null ? null : Number(targetFoodCost);
  const marginTargetPct = targetMarginPct == null ? null : Number(targetMarginPct);
  const actualFcPct = avgFoodCost == null ? null : avgFoodCost * 100;
  const actualMarginPct = grossProfitPct == null ? null : grossProfitPct * 100;

  const foodCostScore = fcTargetPct == null || actualFcPct == null
    ? 75
    : actualFcPct <= fcTargetPct
      ? 100
      : clampScore(100 - (((actualFcPct - fcTargetPct) / Math.max(fcTargetPct, 1)) * 100));

  const marginScore = marginTargetPct == null || actualMarginPct == null
    ? 75
    : actualMarginPct >= marginTargetPct
      ? 100
      : clampScore(100 - (((marginTargetPct - actualMarginPct) / Math.max(marginTargetPct, 1)) * 100));

  const financialFitScore = clampScore((foodCostScore * 0.55) + (marginScore * 0.45));
  const engineeringMixScore = clampScore(60 + (starPct * 35) + (puzzlePct * 14) + (cashCowPct * 4) - (dogPct * 42));
  const riskBalanceScore = clampScore(100 - (dogPct * 95) - Math.max(0, cashCowPct - 0.35) * 30);

  let score = clampScore(
    (financialFitScore * 0.60) +
    (engineeringMixScore * 0.25) +
    (riskBalanceScore * 0.15)
  );

  if (financialFitScore < 25) {
    score = Math.min(score, financialFitScore + 10);
  } else if (financialFitScore < 45) {
    score = Math.min(score, financialFitScore + 20);
  }

  return {
    score: clampScore(score),
    grade: getHealthGrade(clampScore(score)),
    financialFitScore,
    foodCostScore,
    marginScore,
    engineeringMixScore,
    riskBalanceScore,
    starPct,
    dogPct,
    actualFcPct,
    actualMarginPct,
    fcTargetPct,
    marginTargetPct,
  };
}


function VersionStamp({ compact = false }) {
  return (
    <div className={`inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 ${compact ? "py-1 text-[11px]" : "py-1.5 text-xs"} font-bold text-sky-800`}>
      App Version: {APP_VERSION_STAMP}
    </div>
  );
}


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

  return (
    <LandingPage
      onOpenMenuEngineering={() => setActiveTool("menuEngineering")}
      onOpenNeighborhoodRotations={() => setActiveTool("neighborhoodRotations")}
      onOpenLadleCompliance={() => setActiveTool("ladleCompliance")}
    />
  );
}

function LandingPage({ onOpenMenuEngineering, onOpenNeighborhoodRotations, onOpenLadleCompliance }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="rounded-[2rem] bg-white border border-slate-200 p-6 md:p-10 shadow-2xl">
          <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Compass culinary systems</p>
          <h1 className="text-4xl md:text-6xl font-bold mt-3">Culinary Tools Platform</h1>
          <p className="mt-4 text-slate-600 max-w-3xl text-lg">
            A centralized workspace for culinary analytics, menu strategy, pricing review, and operational tools.
          </p>
          <div className="mt-5"><VersionStamp /></div>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-emerald-700 font-bold">Live</p>
                <h2 className="text-3xl font-bold mt-2">Menu Engineering Dashboard</h2>
                <p className="text-slate-600 mt-3">
                  Analyze MenuWorks price, true cost, food cost %, gross margin, financial fit, and portfolio health across stored menus.
                </p>
              </div>
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-700">
                Live
              </div>
            </div>
            <button
              onClick={onOpenMenuEngineering}
              className="mt-6 rounded-2xl bg-slate-900 text-white px-5 py-3 font-semibold hover:bg-slate-700"
            >
              Open Dashboard
            </button>
          </div>

          <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-amber-700 font-bold">Still in Development</p>
                <h2 className="text-3xl font-bold mt-2">Neighborhood Rotations</h2>
                <p className="text-slate-600 mt-3">
                  A planning tool for weekly café rotations, station LTOs, Fresh $5 selections, and leadership visibility.
                </p>
              </div>
              <div className="rounded-2xl bg-amber-50 border border-amber-200 px-3 py-2 text-xs font-bold text-amber-700">
                Still in Development
              </div>
            </div>
            <button
              onClick={onOpenNeighborhoodRotations}
              className="mt-6 rounded-2xl bg-slate-900 text-white px-5 py-3 font-semibold hover:bg-slate-700"
            >
              Open Rotations
            </button>
          </div>

          <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3 w-fit mb-5">
                  <ClipboardList size={22} className="text-slate-700" />
                </div>
                <p className="text-xs uppercase tracking-[0.18em] text-sky-700 font-bold">Test Concept</p>
                <h2 className="text-3xl font-bold mt-2">Ladle Compliance Dashboard</h2>
                <p className="text-slate-600 mt-3">
                  Track Ladle compliance by district, café, and week with executive summaries, heat-map tiles, and team-facing trends.
                </p>
              </div>
              <div className="rounded-2xl bg-sky-50 border border-sky-200 px-3 py-2 text-xs font-bold text-sky-700">
                Can Delete
              </div>
            </div>
            <button
              onClick={onOpenLadleCompliance}
              className="mt-6 rounded-2xl bg-slate-900 text-white px-5 py-3 font-semibold hover:bg-slate-700"
            >
              Open Ladle Dashboard
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function MenuEngineeringDashboard({ onBackToPlatform }) {
  const [menuItems, setMenuItems] = useState(MENUWORKS_ITEMS);
  const [selectedMenu, setSelectedMenu] = useState(MENUWORKS_ITEMS[0]?.menu || "");
  const [pendingImport, setPendingImport] = useState(null);
  const [globalSearch, setGlobalSearch] = useState("");
  const [fillUnitsValue, setFillUnitsValue] = useState(5);
  const [viewMode, setViewMode] = useState("operations");
  const [targetMode, setTargetMode] = useState("foodCost");
  const [targetFoodCost, setTargetFoodCost] = useState(30);
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("source");
  const [unitsById, setUnitsById] = useState({});
  const [manualMargin] = useState(5);

  const parsedTargetValue = targetFoodCost === "" ? null : Number(targetFoodCost);
  const parsedTargetFoodCost = parsedTargetValue == null ? null : targetMode === "foodCost" ? parsedTargetValue : 100 - parsedTargetValue;
  const parsedTargetMarginPct = parsedTargetValue == null ? null : targetMode === "grossMargin" ? parsedTargetValue : 100 - parsedTargetValue;

  const menus = useMemo(() => {
    const allMenuNames = Array.from(new Set(menuItems.map((item) => item.menu).filter(Boolean))).sort();
    return allMenuNames.map((menuName) => {
      const rows = menuItems.filter((item) => item.menu === menuName);
      const stationSet = new Set(rows.map((item) => item.station || "—"));
      return {
        menu: menuName,
        count: rows.length,
        priced: rows.filter((item) => item.price != null && item.trueCost != null).length,
        stations: Array.from(stationSet).filter(Boolean).sort().join(", ") || "No station listed",
      };
    });
  }, [menuItems]);

  const activeSelectedMenu = menus.some((m) => m.menu === selectedMenu) ? selectedMenu : menus[0]?.menu || "";
  const selectedMenuInfo = menus.find((m) => m.menu === activeSelectedMenu);

  const menuRows = useMemo(() => {
    const search = globalSearch.trim().toLowerCase();
    if (search) {
      return menuItems.filter((item) =>
        String(`${item.item} ${item.menu} ${item.station} ${item.mrn} ${item.portion}`).toLowerCase().includes(search)
      );
    }
    return menuItems.filter((item) => item.menu === activeSelectedMenu);
  }, [menuItems, activeSelectedMenu, globalSearch]);

  const rowsWithUnits = useMemo(
    () =>
      menuRows.map((row) => {
        const rawUnits = unitsById[row.id] ?? 0;
        const units = rawUnits === "" ? 0 : Number(rawUnits);
        const complimentary = row.price == null;
        const unitProfit = !complimentary && row.trueCost != null ? row.price - row.trueCost : null;
        const revenue = !complimentary ? row.price * units : 0;
        const totalCost = row.trueCost != null ? row.trueCost * units : 0;
        const totalProfit = !complimentary && row.trueCost != null ? revenue - totalCost : null;
        const foodCost = !complimentary && row.price ? row.trueCost / row.price : null;
        return { ...row, units, complimentary, unitProfit, revenue, totalCost, totalProfit, foodCost };
      }),
    [menuRows, unitsById]
  );

    const completeRowsWithUnits = useMemo(
    () =>
      rowsWithUnits.filter(
        (r) =>
          r.price != null &&
          r.trueCost != null &&
          r.price > 0 &&
          Number(r.units || 0) > 0
      ),
    [rowsWithUnits]
  );

  const averageActiveVolume = completeRowsWithUnits.length
    ? completeRowsWithUnits.reduce((sum, r) => sum + Number(r.units || 0), 0) / completeRowsWithUnits.length
    : 0;

  const engineered = useMemo(
    () =>
      rowsWithUnits.map((row) => {
        if (row.price == null || row.trueCost == null || row.price <= 0) {
          return {
            ...row,
            engineering: "COMPLIMENTARY",
            marginRank: "—",
            volumeRank: "—",
          };
        }

        const foodCostPct = row.trueCost / row.price;
        const targetFcDecimal =
          parsedTargetFoodCost == null ? 0.3 : Number(parsedTargetFoodCost) / 100;

        const marginHigh = foodCostPct <= targetFcDecimal;

        const units = Number(row.units || 0);
        const volumeHigh =
          units > 0 &&
          (averageActiveVolume === 0 || units >= averageActiveVolume);

        return {
          ...row,
          engineering: classify(marginHigh, volumeHigh),
          marginRank: marginHigh ? "HIGH" : "LOW",
          volumeRank: volumeHigh ? "HIGH" : "LOW",
        };
      }),
    [rowsWithUnits, parsedTargetFoodCost, averageActiveVolume]
  );

  const filtered = useMemo(() => {
    return engineered
      .filter((row) => category === "All" || row.engineering === category)
      .sort((a, b) => {
        if (sort === "source") return smartMenuEngineeringSort(a, b);
        if (sort === "name") return String(a.item).localeCompare(String(b.item));
        if (sort === "foodCostDesc") return (b.foodCost ?? -Infinity) - (a.foodCost ?? -Infinity);
        if (sort === "priceDesc") return (b.price ?? -Infinity) - (a.price ?? -Infinity);
        if (sort === "costDesc") return (b.trueCost ?? -Infinity) - (a.trueCost ?? -Infinity);
        return Number(a.id) - Number(b.id);
      });
  }, [engineered, category, sort]);

  const totals = useMemo(
    () =>
      engineered.reduce(
        (acc, row) => {
          acc.units += Number(row.units || 0);
          acc.revenue += row.revenue || 0;
          acc.cost += row.totalCost || 0;
          acc.profit += row.totalProfit || 0;
          acc.priced += row.price != null && row.trueCost != null ? 1 : 0;
          acc[row.engineering] = (acc[row.engineering] || 0) + 1;
          return acc;
        },
        { units: 0, revenue: 0, cost: 0, profit: 0, priced: 0 }
      ),
    [engineered]
  );

  const avgFoodCost = totals.revenue ? totals.cost / totals.revenue : null;
  const grossProfitPct = totals.revenue ? totals.profit / totals.revenue : null;

  const menuPricedRows = useMemo(() => {
    return engineered.filter((row) => row.price != null && row.trueCost != null && row.price > 0);
  }, [engineered]);

  const menuCostSummary = useMemo(() => {
    const totalSellPrice = menuPricedRows.reduce((sum, row) => sum + Number(row.price || 0), 0);
    const totalTrueCost = menuPricedRows.reduce((sum, row) => sum + Number(row.trueCost || 0), 0);
    const summedFoodCost = totalSellPrice ? totalTrueCost / totalSellPrice : null;
    const summedGrossMargin = summedFoodCost == null ? null : 1 - summedFoodCost;
    return { totalSellPrice, totalTrueCost, summedFoodCost, summedGrossMargin };
  }, [menuPricedRows]);

  const menuHealthDetails = useMemo(
    () =>
      calculateMenuHealth({
        avgFoodCost: menuCostSummary.summedFoodCost,
        grossProfitPct: menuCostSummary.summedGrossMargin,
        stars: totals.STAR || 0,
        cashCows: totals["CASH COW"] || 0,
        puzzles: totals.PUZZLE || 0,
        dogs: totals.DOG || 0,
        totalItems: engineered.filter((row) => row.engineering !== "COMPLIMENTARY").length,
        targetFoodCost: parsedTargetFoodCost,
        targetMarginPct: parsedTargetMarginPct,
      }),
    [engineered, totals, menuCostSummary, parsedTargetFoodCost, parsedTargetMarginPct]
  );

  const menuHealth = menuHealthDetails.score;

  const portfolioRows = useMemo(() => {
    return menus
      .map((menu) => {
        const rows = menuItems.filter((item) => item.menu === menu.menu);
        const priced = rows.filter((row) => row.price != null && row.trueCost != null);
        const avgFc = priced.length ? priced.reduce((sum, row) => sum + (row.trueCost / row.price || 0), 0) / priced.length : 0;
        const dogs = priced.filter((row) => row.price && row.trueCost / row.price > 0.34).length;
        const stars = priced.filter((row) => row.price && row.trueCost / row.price < 0.24).length;
        const cashCows = priced.filter((row) => row.price && row.trueCost / row.price >= 0.24 && row.trueCost / row.price <= 0.34).length;
        const grossMargin = avgFc ? 1 - avgFc : null;

        const healthDetails = calculateMenuHealth({
          avgFoodCost: avgFc,
          grossProfitPct: grossMargin,
          stars,
          cashCows,
          puzzles: 0,
          dogs,
          totalItems: priced.length,
          targetFoodCost: parsedTargetFoodCost,
          targetMarginPct: parsedTargetMarginPct,
        });
        const health = healthDetails.score;

        const riskNotes = [];
        const dogPct = priced.length ? (dogs / priced.length) * 100 : 0;
        const fcPct = avgFc * 100;

        if (health < 55) riskNotes.push("Health score is in critical range.");
        if (health >= 55 && health < 70) riskNotes.push("Health score requires review.");
        if (parsedTargetFoodCost != null && fcPct > parsedTargetFoodCost + 6) riskNotes.push("Average food cost is materially above target.");
        if (parsedTargetFoodCost != null && fcPct > parsedTargetFoodCost + 2 && fcPct <= parsedTargetFoodCost + 6) riskNotes.push("Average food cost is above target.");
        if (dogPct >= 40) riskNotes.push(`${dogPct.toFixed(0)}% of priced items are high-risk DOG items.`);
        if (dogPct >= 20 && dogPct < 40) riskNotes.push(`${dogPct.toFixed(0)}% of priced items are DOG items.`);
        if (riskNotes.length === 0) riskNotes.push("No major executive risk flags detected.");

        return {
          menu: menu.menu,
          items: rows.length,
          avgFc,
          stars,
          dogs,
          health,
          risk: health < 55 ? "CRITICAL" : health < 70 ? "WARNING" : "HEALTHY",
          riskNotes,
          healthDetails,
        };
      })
      .sort((a, b) => b.health - a.health);
  }, [menus, menuItems, parsedTargetFoodCost, parsedTargetMarginPct]);

  const portfolioHealthDetails = useMemo(() => {
    if (!portfolioRows.length) {
      return { score: 0, grade: getHealthGrade(0), menuCount: 0, warningMenus: 0, criticalMenus: 0 };
    }
    const weightedHealth = portfolioRows.reduce((sum, row) => sum + row.health * Math.max(1, row.items), 0);
    const totalWeight = portfolioRows.reduce((sum, row) => sum + Math.max(1, row.items), 0);
    const score = clampScore(weightedHealth / totalWeight);
    return {
      score,
      grade: getHealthGrade(score),
      menuCount: portfolioRows.length,
      warningMenus: portfolioRows.filter((row) => row.risk === "WARNING").length,
      criticalMenus: portfolioRows.filter((row) => row.risk === "CRITICAL").length,
    };
  }, [portfolioRows]);

  const portfolioHealth = portfolioHealthDetails.score;

  const updateUnits = (id, value) => {
    setUnitsById((prev) => ({ ...prev, [id]: value === "" ? "" : Math.max(0, Number(value)) }));
  };

  const resetMenuUnits = () => {
    setUnitsById((prev) => {
      const next = { ...prev };
      menuRows.forEach((row) => delete next[row.id]);
      return next;
    });
  };

  const fillVisibleUnits = () => {
    const amount = Math.max(0, Number(fillUnitsValue || 0));
    setUnitsById((prev) => {
      const next = { ...prev };
      filtered.forEach((row) => {
        next[row.id] = amount;
      });
      return next;
    });
  };

  const cleanNumber = (value) => {
    if (value === null || value === undefined || value === "") return null;
    const number = Number(String(value).replace(/[$,%]/g, ""));
    return Number.isFinite(number) ? number : null;
  };

  const baseRowKey = (row) => String([row.menu, row.station, row.mrn, row.item, row.portion].join("|")).toLowerCase();

  const buildComparableMap = (rows) => {
    const counts = new Map();
    const result = new Map();
    rows.forEach((row) => {
      const base = baseRowKey(row);
      const occurrence = counts.get(base) || 0;
      counts.set(base, occurrence + 1);
      result.set(`${base}|occurrence:${occurrence}`, row);
    });
    return result;
  };

  const parseMenuWorksFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheet = workbook.Sheets.Report || workbook.Sheets[workbook.SheetNames[0]];
    const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: null });

    const importedRows = rawRows
      .filter((row) => row["Menu Name"] && row["Menu Item"])
      .map((row, index) => ({
        id: index,
        menu: row["Menu Name"] || "Unassigned Menu",
        meal: row["Meal"] || row["Meal Period"] || "",
        station: row["Station"] || "—",
        item: row["Menu Item"] || "Unnamed Item",
        mrn: row["MRN"] || "—",
        portion: row["Portion"] || "—",
        price: cleanNumber(row["Sell Price"]),
        itemCost: cleanNumber(row["Item Cost"]),
        wastePct: cleanNumber(row["Waste %"]),
        trueCost: cleanNumber(row["Item + Waste Cost"]) ?? cleanNumber(row["Item Cost"]),
        forecast: 0,
      }));

    const importedMenuNames = Array.from(new Set(importedRows.map((row) => row.menu).filter(Boolean)));
    const currentRowsInScope = menuItems.filter((row) => importedMenuNames.includes(row.menu));

    const currentByKey = buildComparableMap(currentRowsInScope);
    const importedByKey = buildComparableMap(importedRows);
    const newItems = [];
    const removedItems = [];
    const changedItems = [];
    const costIncreases = [];
    const costDecreases = [];
    const priceChanges = [];

    importedByKey.forEach((row, key) => {
      const current = currentByKey.get(key);
      if (!current) {
        newItems.push(row);
        return;
      }
      const priceChanged = current.price !== row.price;
      const costChanged = current.trueCost !== row.trueCost;
      const itemCostChanged = current.itemCost !== row.itemCost;
      const portionChanged = current.portion !== row.portion;
      if (priceChanged || costChanged || itemCostChanged || portionChanged) {
        const change = { before: current, after: row };
        changedItems.push(change);
        if (costChanged && row.trueCost > current.trueCost) costIncreases.push(change);
        if (costChanged && row.trueCost < current.trueCost) costDecreases.push(change);
        if (priceChanged) priceChanges.push(change);
      }
    });

    currentByKey.forEach((row, key) => {
      if (!importedByKey.has(key)) removedItems.push(row);
    });

    const currentMenus = new Set(menuItems.map((row) => row.menu));
    const newMenus = Array.from(new Set(importedRows.map((row) => row.menu))).filter((menu) => !currentMenus.has(menu));

    const comparableBeforeCost = changedItems.reduce((sum, change) => sum + (change.before.trueCost || 0), 0);
    const comparableAfterCost = changedItems.reduce((sum, change) => sum + (change.after.trueCost || 0), 0);
    const comparableCostChangePct = comparableBeforeCost ? ((comparableAfterCost - comparableBeforeCost) / comparableBeforeCost) * 100 : null;

    const currentTotalCost = currentRowsInScope.reduce((sum, row) => sum + (row.trueCost || 0), 0);
    const importedTotalCost = importedRows.reduce((sum, row) => sum + (row.trueCost || 0), 0);
    const totalCostChangePct = currentTotalCost ? ((importedTotalCost - currentTotalCost) / currentTotalCost) * 100 : null;

    setPendingImport({
      importedRows,
      importedMenuNames,
      newItems,
      removedItems,
      changedItems,
      costIncreases,
      costDecreases,
      priceChanges,
      newMenus,
      fileName: file.name,
      comparableCostChangePct,
      totalCostChangePct,
    });
    event.target.value = "";
  };

  const acceptImport = () => {
    if (!pendingImport) return;
    const importedMenuNames = pendingImport.importedMenuNames || Array.from(new Set(pendingImport.importedRows.map((row) => row.menu).filter(Boolean)));
    const retainedRows = menuItems.filter((row) => !importedMenuNames.includes(row.menu));
    const nextRows = [...retainedRows, ...pendingImport.importedRows].map((row, index) => ({ ...row, id: index }));
    setMenuItems(nextRows);
    setUnitsById({});
    setSelectedMenu(pendingImport.importedRows[0]?.menu || retainedRows[0]?.menu || "");
    setPendingImport(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6">
      {pendingImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-w-5xl w-full rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 space-y-5">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Review MenuWorks update</p>
              <h2 className="text-3xl font-bold mt-1">Import changes from {pendingImport.fileName}</h2>
              <p className="text-slate-600 mt-2">Review these changes before replacing the stored menu data. Nothing changes unless you click Accept Update.</p>
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">Change summary</p>
                <ul className="mt-2 space-y-1">
                  <li>This upload will add <strong>{pendingImport.newMenus.length}</strong> new menu{pendingImport.newMenus.length === 1 ? "" : "s"}.</li>
                  <li>This upload will add <strong>{pendingImport.newItems.length}</strong> item{pendingImport.newItems.length === 1 ? "" : "s"}.</li>
                  <li>This upload will update <strong>{pendingImport.changedItems.length}</strong> existing item{pendingImport.changedItems.length === 1 ? "" : "s"}.</li>
                  <li>This upload will remove <strong>{pendingImport.removedItems.length}</strong> item{pendingImport.removedItems.length === 1 ? "" : "s"}.</li>
                  <li>Comparable item cost change: <strong>{pendingImport.comparableCostChangePct == null ? "n/a" : `${pendingImport.comparableCostChangePct >= 0 ? "+" : ""}${pendingImport.comparableCostChangePct.toFixed(1)}%`}</strong>.</li>
                  <li>Total stored cost change: <strong>{pendingImport.totalCostChangePct == null ? "n/a" : `${pendingImport.totalCostChangePct >= 0 ? "+" : ""}${pendingImport.totalCostChangePct.toFixed(1)}%`}</strong> — this can be impacted by new or removed items.</li>
                </ul>
              </div>
              {pendingImport.removedItems.length > 0 && (
                <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                  <strong>Removal warning:</strong> {pendingImport.removedItems.length} item{pendingImport.removedItems.length === 1 ? "" : "s"} will be removed from the stored dashboard data if accepted.
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <Metric title="New menus" value={pendingImport.newMenus.length} sub="added to dropdown" />
              <Metric title="New items" value={pendingImport.newItems.length} sub="not in current data" />
              <Metric title="Updated items" value={pendingImport.changedItems.length} sub="price, cost, or portion changed" />
              <Metric title="Cost increases" value={pendingImport.costIncreases?.length || 0} sub="true cost went up" />
              <Metric title="Removed items" value={pendingImport.removedItems.length} sub="missing from upload" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 max-h-80 overflow-auto">
              <ChangeList title="New menus" items={pendingImport.newMenus} empty="No new menus." />
              <ChangeList title="New items" items={pendingImport.newItems.slice(0, 25).map((row) => titleCase(row.menu) + " • " + titleCase(row.item))} empty="No new items." />
              <ChangeList title="Updated items" items={pendingImport.changedItems.slice(0, 25).map((change) => titleCase(change.after.item) + " — " + priceLabel(change.before.price) + " → " + priceLabel(change.after.price) + ", " + money(change.before.trueCost) + " → " + money(change.after.trueCost))} empty="No updates." />
              <ChangeList title="Cost increases" items={(pendingImport.costIncreases || []).slice(0, 25).map((change) => titleCase(change.after.item) + " — " + money(change.before.trueCost) + " → " + money(change.after.trueCost))} empty="No cost increases." />
              <ChangeList title="Removed items" items={pendingImport.removedItems.slice(0, 25).map((row) => titleCase(row.menu) + " • " + titleCase(row.item))} empty="No removed items." />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setPendingImport(null)} className="rounded-2xl bg-slate-100 border border-slate-200 px-5 py-3 font-semibold hover:bg-slate-200">Cancel</button>
              <button onClick={acceptImport} className="rounded-2xl bg-slate-900 text-white px-5 py-3 font-semibold hover:bg-slate-700">Accept Update + Replace Data</button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        <header className="rounded-[2rem] bg-white border border-slate-200 p-6 md:p-8 shadow-2xl">
          <div className="mb-6">
            <button
              onClick={onBackToPlatform}
              className="rounded-2xl bg-slate-100 border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
            >
              ← Back to Culinary Tools Platform
            </button>
          </div>
          <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-6">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Stored MenuWorks cost intelligence</p>
              <h1 className="text-4xl md:text-5xl font-bold mt-2">Menu Engineering Dashboard</h1>
              <p className="mt-3 text-slate-600 max-w-3xl">Select a menu, view MenuWorks price and true cost data, enter units sold, and evaluate menu performance by item or across the portfolio.</p>
            </div>

            <div className="rounded-3xl bg-slate-100 border border-slate-200 p-4 min-w-[320px] space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-500 mb-2">Admin upload MenuWorks report</label>
                <input type="file" accept=".xlsx,.xls,.csv" onChange={parseMenuWorksFile} className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-xl file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-white hover:file:bg-slate-700" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-500 mb-2">Search all items</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3.5 text-slate-400" size={18} />
                  <input value={globalSearch} onChange={(e) => setGlobalSearch(e.target.value)} placeholder="Search item, MRN, menu..." className="w-full rounded-2xl bg-white border border-slate-300 pl-10 pr-3 py-3 outline-none focus:border-slate-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-500 mb-2">Select menu to view</label>
                <select value={activeSelectedMenu} onChange={(e) => { setSelectedMenu(e.target.value); setCategory("All"); }} className="w-full rounded-2xl bg-white border border-slate-300 px-4 py-3 text-lg outline-none focus:border-slate-500">
                  {menus.map((menu) => (
                    <option key={menu.menu} value={menu.menu}>
                      {menu.menu} — {menu.count} items
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </header>

        <section className="rounded-3xl bg-white border border-slate-200 p-5 shadow-xl">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-slate-100 border border-slate-200 p-3"><ChefHat size={22} /></div>
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Current menu</p>
              <h2 className="text-3xl font-bold mt-1">{globalSearch.trim() ? "Search Results" : activeSelectedMenu}</h2>
              <p className="text-slate-500 mt-2">{globalSearch.trim() ? `${menuRows.length} matching items across all menus` : `${selectedMenuInfo?.count || 0} items • ${selectedMenuInfo?.priced || 0} with price and cost • ${selectedMenuInfo?.stations || "No station listed"}`}</p>
            </div>
          </div>
        </section>

        <section className="flex flex-wrap gap-3">
          <button onClick={() => setViewMode("operations")} className={`rounded-2xl px-5 py-3 font-semibold border ${viewMode === "operations" ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-300 text-slate-700"}`}>Menu View</button>
          <button onClick={() => setViewMode("portfolio")} className={`rounded-2xl px-5 py-3 font-semibold border ${viewMode === "portfolio" ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-300 text-slate-700"}`}>Portfolio Menu View</button>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BenchmarkTargetCard
            targetMode={targetMode}
            setTargetMode={setTargetMode}
            targetFoodCost={targetFoodCost}
            setTargetFoodCost={setTargetFoodCost}
            parsedTargetValue={parsedTargetValue}
            parsedTargetFoodCost={parsedTargetFoodCost}
            parsedTargetMarginPct={parsedTargetMarginPct}
          />

          <HealthCard
            viewMode={viewMode}
            menuHealth={menuHealth}
            menuHealthDetails={menuHealthDetails}
            portfolioHealth={portfolioHealth}
            portfolioHealthDetails={portfolioHealthDetails}
          />
        </section>

        {viewMode === "operations" && (
          <>
            <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
              <Metric icon={DollarSign} title="Revenue" value={money(totals.revenue)} sub="price × units sold" />
              <Metric title="True cost" value={money(totals.cost)} sub="MenuWorks cost × units" />
              <Metric title="Profit" value={money(totals.profit)} sub="revenue - true cost" />
              <Metric title="Avg food cost" value={pct(avgFoodCost)} sub="total cost / revenue" />
              <Metric title="Gross profit" value={pct(grossProfitPct)} sub="profit / revenue" />
            </section>

            <section className="grid grid-cols-1 xl:grid-cols-4 gap-4">
              {["STAR", "CASH COW", "PUZZLE", "DOG"].map((key) => (
                <CategoryCard key={key} count={totals[key] || 0} config={classConfig[key]} items={engineered.filter((row) => row.engineering === key)} />
              ))}
            </section>

            <section className="rounded-3xl bg-white border border-slate-200 p-4 shadow-xl space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                <div className="flex items-center gap-2 text-slate-800 font-semibold"><SlidersHorizontal size={18} /> Menu engineering controls</div>
                <button onClick={resetMenuUnits} className="rounded-2xl bg-slate-100 border border-slate-200 px-4 py-2 font-semibold hover:bg-slate-200">Reset units to zero</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-2xl bg-white border border-slate-300 px-3 py-3 outline-none focus:border-slate-500">
                  {["All", "STAR", "CASH COW", "PUZZLE", "DOG", "COMPLIMENTARY"].map((c) => <option key={c}>{c}</option>)}
                </select>
                <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-2xl bg-white border border-slate-300 px-3 py-3 outline-none focus:border-slate-500">
                  <option value="source">Smart order: Entrées, Sides, Extensions, No Price</option>
                  <option value="name">Name A-Z</option>
                  <option value="priceDesc">Price high to low</option>
                  <option value="costDesc">Cost high to low</option>
                  <option value="foodCostDesc">Food cost % high to low</option>
                </select>
                <input type="number" min="0" value={fillUnitsValue} onChange={(e) => setFillUnitsValue(e.target.value)} className="rounded-2xl bg-white border border-slate-300 px-3 py-3 outline-none focus:border-slate-500" placeholder="Units sold" />
                <button onClick={fillVisibleUnits} className="rounded-2xl bg-slate-900 text-white px-4 py-3 font-semibold hover:bg-slate-700">Fill visible units</button>
                <div className="rounded-2xl bg-white border border-slate-300 px-3 py-3 text-slate-500">Visible items: <span className="text-slate-900 font-semibold">{filtered.length}</span></div>
              </div>
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3 text-sm text-slate-600">
                Margin benchmark: items at or above <span className="font-semibold text-slate-900">{money(manualMargin)}</span> unit profit are HIGH margin. Volume benchmark uses the current menu average units sold.
              </div>
            </section>

            <MenuTable rows={filtered} updateUnits={updateUnits} parsedTargetFoodCost={parsedTargetFoodCost} />
          </>
        )}

        {viewMode === "portfolio" && <PortfolioTable rows={portfolioRows} parsedTargetFoodCost={parsedTargetFoodCost} parsedTargetMarginPct={parsedTargetMarginPct} />}
      </div>
    </div>
  );
}

function Metric({ title, value, sub, icon: Icon }) {
  return (
    <div className="rounded-3xl bg-white border border-slate-200 p-5 shadow-xl">
      <div className="flex items-center justify-between gap-3">
        <p className="text-slate-500 text-sm">{title}</p>
        {Icon && <Icon size={18} className="text-slate-400" />}
      </div>
      <p className="text-2xl font-bold mt-2">{value}</p>
      <p className="text-xs text-slate-400 mt-2">{sub}</p>
    </div>
  );
}

function BenchmarkTargetCard({ targetMode, setTargetMode, targetFoodCost, setTargetFoodCost, parsedTargetValue, parsedTargetFoodCost, parsedTargetMarginPct }) {
  return (
    <div className="rounded-3xl bg-white border border-slate-200 p-5 shadow-xl">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500">Target Benchmark</p>
        <button onClick={() => { setTargetMode("foodCost"); setTargetFoodCost(30); }} className="text-xs rounded-full bg-slate-100 border border-slate-200 px-3 py-1 hover:bg-slate-200">Reset</button>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button onClick={() => { setTargetMode("foodCost"); setTargetFoodCost(30); }} className={`rounded-2xl border px-3 py-2 text-sm font-semibold ${targetMode === "foodCost" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-300"}`}>Food Cost %</button>
        <button onClick={() => { setTargetMode("grossMargin"); setTargetFoodCost(70); }} className={`rounded-2xl border px-3 py-2 text-sm font-semibold ${targetMode === "grossMargin" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-300"}`}>Gross Margin %</button>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <input type="number" value={targetFoodCost} onChange={(e) => setTargetFoodCost(e.target.value)} className="w-28 rounded-2xl border border-slate-300 px-3 py-3" placeholder="Disabled" />
        <span className="text-slate-500">%</span>
      </div>
      <p className="text-xs text-slate-500 mt-2">Choose whether the benchmark is entered as food cost or gross margin. The app converts the other side automatically because they are inverse measures.</p>
      <p className="text-xs text-slate-400 mt-1">{parsedTargetValue == null ? "Financial heatmaps and health scoring disabled." : targetMode === "foodCost" ? `Targeting ${parsedTargetFoodCost}% FC / ${parsedTargetMarginPct}% Gross Margin.` : `Targeting ${parsedTargetMarginPct}% Gross Margin / ${parsedTargetFoodCost}% FC.`}</p>
    </div>
  );
}

function HealthCard({ viewMode, menuHealth, menuHealthDetails, portfolioHealth, portfolioHealthDetails }) {
  const score = viewMode === "portfolio" ? portfolioHealth : menuHealth;
  const details = viewMode === "portfolio" ? portfolioHealthDetails : menuHealthDetails;
  const detailSource = viewMode === "portfolio" ? portfolioHealthDetails : menuHealthDetails;

  return (
    <div className="rounded-3xl bg-white border border-slate-200 p-5 shadow-xl">
      <div className="flex items-start justify-between gap-3">
        <div className="w-full">
          <p className="text-sm text-slate-500">{viewMode === "portfolio" ? "Portfolio Health" : "Menu Health"}</p>
          <div className="mt-3 flex items-end gap-3">
            <p className="text-4xl font-bold">{score}/100</p>
            <p className={`mb-1 rounded-full px-3 py-1 text-xs font-bold ${details.grade.bg} ${details.grade.tone} border ${details.grade.border}`}>{details.grade.label}</p>
          </div>
          <div className="mt-4 h-3 w-full rounded-full bg-slate-100 overflow-hidden">
            <div className={`h-full rounded-full ${details.grade.fill}`} style={{ width: `${score}%` }} />
          </div>
          <p className="text-sm text-slate-500 mt-2">
            {viewMode === "portfolio"
              ? `Weighted health score across ${details.menuCount} menus. ${details.warningMenus} warning and ${details.criticalMenus} critical menus detected.`
              : "Weighted score using financial fit, engineering mix, and risk concentration."}
          </p>
          {viewMode === "operations" && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-slate-500">Financial Target Fit</p>
                <p className="text-lg font-bold text-slate-900">{menuHealthDetails.financialFitScore}/100</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-slate-500">Actual Food Cost %</p>
                <p className="text-lg font-bold text-slate-900">{menuHealthDetails.actualFcPct == null ? "—" : `${menuHealthDetails.actualFcPct.toFixed(1)}%`}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-slate-500">Actual Gross Margin %</p>
                <p className="text-lg font-bold text-slate-900">{menuHealthDetails.actualMarginPct == null ? "—" : `${menuHealthDetails.actualMarginPct.toFixed(1)}%`}</p>
              </div>
            </div>
          )}
        </div>

        <div className="group relative">
          <div className="rounded-full border border-slate-300 bg-slate-100 p-2 cursor-help">
            <HelpCircle size={16} className="text-slate-500" />
          </div>
          <div className="pointer-events-none absolute right-0 top-full z-30 mt-3 hidden w-96 rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-2xl group-hover:block">
            <p className="font-bold text-slate-900">How Health is calculated</p>
            <p className="mt-2 text-slate-600">Health is a weighted operational score designed to estimate menu viability using common foodservice benchmarks.</p>
            <ul className="mt-3 space-y-2 text-slate-600">
              <li><strong className="text-slate-900">Financial Fit:</strong> 60% of score. Compares actual food cost and actual gross margin against the selected benchmark.</li>
              <li><strong className="text-slate-900">Engineering Mix:</strong> 25% of score. Rewards Stars and Puzzles while penalizing Dogs.</li>
              <li><strong className="text-slate-900">Risk Balance:</strong> 15% of score. Penalizes high DOG concentration and too many low-margin high-volume items.</li>
            </ul>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-2">Financial Fit: <strong>{detailSource.financialFitScore ?? "—"}/100</strong></div>
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-2">FC Score: <strong>{detailSource.foodCostScore ?? "—"}/100</strong></div>
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-2">Margin Score: <strong>{detailSource.marginScore ?? "—"}/100</strong></div>
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-2">Mix Score: <strong>{detailSource.engineeringMixScore ?? "—"}/100</strong></div>
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-2">Risk Score: <strong>{detailSource.riskBalanceScore ?? "—"}/100</strong></div>
            </div>
            <p className="mt-3 text-slate-500">The score is capped between 0 and 100 and is intended as a quick executive benchmark rather than a financial statement.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CategoryCard({ count, config, items = [] }) {
  const Icon = config.icon;
  const previewItems = [...items].sort((a, b) => (b.totalProfit || 0) - (a.totalProfit || 0)).slice(0, 4);

  return (
    <div className="group relative rounded-3xl bg-white border border-slate-200 p-5 shadow-xl flex items-start gap-3 cursor-help">
      <div className={`rounded-2xl border p-3 ${config.badge}`}><Icon size={20} /></div>
      <div>
        <p className="text-2xl font-bold">{count}</p>
        <p className="font-semibold">{config.label}</p>
        <p className="text-sm text-slate-500">{config.note}</p>
      </div>
      <div className="pointer-events-none absolute left-4 top-full z-30 mt-3 hidden w-80 rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-2xl group-hover:block">
        <p className="font-bold text-slate-900">{config.label}</p>
        <p className="mt-1 text-slate-600">{config.note}</p>
        <p className="mt-3 font-semibold text-slate-900">Recommended action</p>
        <p className="text-slate-600">{config.action}</p>
        <p className="mt-3 font-semibold text-slate-900">Example items</p>
        {previewItems.length === 0 ? <p className="text-slate-500">No items currently in this category.</p> : (
          <ul className="mt-1 space-y-1 text-slate-600">
            {previewItems.map((row) => (
              <li key={row.id} className="flex justify-between gap-3">
                <span className="truncate">{titleCase(row.item)}</span>
                <span className="shrink-0 font-medium">{money(row.totalProfit)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ChangeList({ title, items, empty }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="font-semibold text-slate-900 mb-2">{title}</p>
      {items.length === 0 ? <p className="text-sm text-slate-500">{empty}</p> : (
        <ul className="space-y-2 text-sm text-slate-600">
          {items.map((item, index) => <li key={index} className="border-b border-slate-200 pb-2 last:border-0">{item}</li>)}
        </ul>
      )}
    </div>
  );
}

function Th({ children }) {
  return <th className="px-4 py-3 font-semibold whitespace-nowrap">{children}</th>;
}

function MenuTable({ rows, updateUnits, parsedTargetFoodCost }) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
      <div className="overflow-auto max-h-[680px]">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-slate-100 border-b border-slate-200">
            <tr className="text-left text-slate-500">
              <Th>Item</Th><Th>Station</Th><Th>Price</Th><Th>True Cost</Th><Th>FC%</Th><Th>Units Sold</Th><Th>Revenue</Th><Th>Profit</Th><Th>Margin</Th><Th>Volume</Th><Th>Engineering</Th><Th>Recommendation</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {rows.map((row) => <ItemRow key={row.id} row={row} updateUnits={updateUnits} parsedTargetFoodCost={parsedTargetFoodCost} />)}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ItemRow({ row, updateUnits, parsedTargetFoodCost }) {
  const cfg = classConfig[row.engineering];

  let heatClass = "";
  if (parsedTargetFoodCost != null && row.foodCost != null) {
    const fcPct = row.foodCost * 100;
    if (fcPct > parsedTargetFoodCost + 6) heatClass = "bg-red-50";
    else if (fcPct > parsedTargetFoodCost + 2) heatClass = "bg-amber-50";
    else heatClass = "bg-emerald-50/40";
  }

  return (
    <tr className={`hover:bg-slate-50 align-top ${heatClass}`}>
      <td className="px-4 py-3 min-w-[280px]"><p className="font-semibold text-slate-900 capitalize">{titleCase(row.item)}</p><p className="text-xs text-slate-400">MRN {row.mrn || "—"} • {row.portion || "—"}</p></td>
      <td className="px-4 py-3 min-w-[140px]">{row.station || "—"}</td>
      <td className="px-4 py-3 whitespace-nowrap">{priceLabel(row.price)}</td>
      <td className="px-4 py-3 whitespace-nowrap">{money(row.trueCost)}</td>
      <td className="px-4 py-3 whitespace-nowrap">{pct(row.foodCost)}</td>
      <td className="px-4 py-3"><input type="number" min="0" value={row.units ?? ""} onChange={(e) => updateUnits(row.id, e.target.value)} className="w-24 rounded-xl bg-white border border-slate-300 px-3 py-2 text-slate-900" /></td>
      <td className="px-4 py-3 whitespace-nowrap">{money(row.revenue)}</td>
      <td className="px-4 py-3 whitespace-nowrap font-semibold">{money(row.totalProfit)}</td>
      <td className="px-4 py-3 whitespace-nowrap">{row.marginRank}</td>
      <td className="px-4 py-3 whitespace-nowrap">{row.volumeRank}</td>
      <td className="px-4 py-3 whitespace-nowrap"><span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${cfg.badge}`}>{cfg.label}</span></td>
      <td className="px-4 py-3 min-w-[180px] text-slate-500">{cfg.action}</td>
    </tr>
  );
}

function PortfolioTable({ rows, parsedTargetFoodCost, parsedTargetMarginPct }) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 border-b border-slate-200">
            <tr className="text-left text-slate-500">
              <Th>Menu</Th>
              <Th>Health</Th>
              <Th>Items</Th>
              <Th>Stars</Th>
              <Th>Dogs</Th>
              <Th>Financial Fit</Th>
              <Th>Actual Food Cost %</Th>
              <Th>Actual Gross Margin %</Th>
              <Th>Risk</Th>
              <Th>Executive Risk Detail</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {rows.map((row) => (
              <tr key={row.menu} className={`hover:bg-slate-50 ${parsedTargetFoodCost != null && row.avgFc * 100 > parsedTargetFoodCost + 6 ? "bg-red-50" : parsedTargetFoodCost != null && row.avgFc * 100 > parsedTargetFoodCost + 2 ? "bg-amber-50" : "bg-emerald-50/40"}`}>
                <td className="px-4 py-3 font-semibold">{row.menu}</td>
                <td className="px-4 py-3 font-bold min-w-[300px]">
                  <p className="text-lg font-bold">{row.health}/100</p>
                  <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs font-normal text-slate-600">
                    <p className="font-semibold text-slate-900">Why this score?</p>
                    <p className="mt-1"><strong className="text-emerald-700">{row.stars}</strong> strong-margin items helped the score.</p>
                    <p><strong className="text-rose-700">{row.dogs}</strong> high-risk items reduced the score.</p>
                    <p>Financial Fit is <strong>{row.healthDetails.financialFitScore}/100</strong>.</p>
                    <p>Actual Food Cost % is <strong>{pct(row.avgFc)}</strong> against the {parsedTargetFoodCost ?? "disabled"}% food cost benchmark.</p>
                    <p>Actual Gross Margin % is <strong>{row.healthDetails.actualMarginPct == null ? "—" : `${row.healthDetails.actualMarginPct.toFixed(1)}%`}</strong> against the {parsedTargetMarginPct ?? "disabled"}% gross margin benchmark.</p>
                    <p>Risk state: <strong>{row.risk}</strong>.</p>
                  </div>
                </td>
                <td className="px-4 py-3">{row.items}</td>
                <td className="px-4 py-3 text-emerald-700 font-semibold">{row.stars}</td>
                <td className="px-4 py-3 text-red-700 font-semibold">{row.dogs}</td>
                <td className="px-4 py-3 font-semibold">{row.healthDetails.financialFitScore}/100</td>
                <td className="px-4 py-3">{pct(row.avgFc)}</td>
                <td className="px-4 py-3">{row.healthDetails.actualMarginPct == null ? "—" : `${row.healthDetails.actualMarginPct.toFixed(1)}%`}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-3 py-1 text-xs font-bold ${row.risk === "CRITICAL" ? "bg-red-100 text-red-800" : row.risk === "WARNING" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>{row.risk}</span></td>
                <td className="px-4 py-3 min-w-[280px]"><ul className="space-y-1 text-xs text-slate-600">{row.riskNotes.map((note, index) => <li key={index}>• {note}</li>)}</ul></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const DISTRICTS = {
  South: ["Doppler", "Day 1", "Nitro", "Re:Invent"],
  North: ["Dawson", "Nessie", "Cricket", "Moby", "Commissary", "Atlas"],
  East: ["East Café 1", "East Café 2", "East Café 3"],
  LAX: ["LAX22", "LAX35", "LAX75", "LAX78", "SNA3"]
};

// CHECKPOINT: South District station configs intentionally include Fresh $5 as the final station for Doppler, Day 1, Nitro, and Re:Invent.
const CAFE_STATION_CONFIG = {
  Nitro: ["global", "carvery", "grill", "pizza", "salad"],
  Doppler: ["global", "salad", "grill", "pizza", "deli"],
  "Day 1": ["global", "grill", "salad", "fishMarket", "deli"],
  "Re:Invent": ["fishMarket", "global", "deli", "grill"],
  Dawson: ["global", "carvery", "grill", "salad", "freshFive"],
  Nessie: ["wok", "global", "grill", "deli", "salad", "freshFive"],
  Cricket: ["global", "grill", "deli", "pizza", "freshFive"],
  Moby: ["global", "pizza", "salad", "deli", "freshFive"],
  Commissary: ["deli", "salad", "pizza", "freshFive", "soup"],
  Atlas: ["grill", "freshFive"],
  LAX22: ["global", "grill", "salad", "freshFive"],
  LAX35: ["global", "grill", "salad", "freshFive"],
  LAX75: ["global", "grill", "salad", "freshFive"],
  LAX78: ["global", "grill", "salad", "freshFive"],
  SNA3: ["global", "grill", "salad", "freshFive"]
};

const STATION_LABELS = {
  global: "Global Station",
  wok: "Wok Station",
  grill: "Grill Station",
  salad: "Salad LTOs",
  pizza: "Pizza / Flatbread LTOs",
  deli: "Deli LTOs",
  fishMarket: "Fish Market LTO",
  carvery: "Carvery Station",
  freshFive: "Fresh $5",
  soup: "Soup LTOs"
};

const formatDateKey = (date) => date.toISOString().slice(0, 10);
const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};
const getMonday = (date = new Date()) => {
  const next = new Date(date);
  const day = next.getDay();
  const diff = next.getDate() - day + (day === 0 ? -6 : 1);
  next.setDate(diff);
  next.setHours(0, 0, 0, 0);
  return next;
};
const dateLabel = (date) => date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
const makeWeekOption = (monday) => `${formatDateKey(monday)} | ${dateLabel(monday)} - ${dateLabel(addDays(monday, 4))}`;
const parseWeekStart = (weekLabel = "") => String(weekLabel).split("|")[0].trim();
const parseWeekEnd = (weekLabel = "") => {
  const start = parseWeekStart(weekLabel);
  if (!start) return "";
  return formatDateKey(addDays(new Date(`${start}T00:00:00`), 4));
};
const ROTATION_WEEKS = Array.from({ length: 160 }, (_, index) => makeWeekOption(addDays(new Date("2026-01-05T00:00:00"), index * 7)));
const DEFAULT_ROTATION_WEEK = makeWeekOption(getMonday(new Date()));

const ROLLING_HISTORY_WEEK_COUNT = 26;
const ROLLING_ROTATION_WEEKS = ROTATION_WEEKS.slice(0, ROLLING_HISTORY_WEEK_COUNT);

const EMPTY_ROTATION = {
  menu: "",
  station: "",
  entrees: ["", "", ""],
  sides: ["", "", "", ""],
  subRecipes: ["", "", "", ""],
  extensions: ["", ""],
  grill: { regionalSpecial: "", locationSpotlight: "" },
  ltos: {
    salad: ["", ""],
    pizza: ["", ""],
    deli: ["", ""],
    fishMarket: [""],
    freshFive: ["", "", "", "", ""],
    soup: ["", ""],
    wokEntrees: ["", "", ""],
    wokSides: ["", ""],
    wokBase: [""],
    wokSubRecipes: ["", ""]
  },
  carvery: {
    protein1: "",
    protein2: "",
    vegetable1: "",
    vegetable2: "",
    vegetable3: "",
    starch: "",
    hotSide1: "",
    coldSide1: "",
    coldSide2: ""
  },
  uploadedLtos: {},
  status: "Draft",
  submittedBy: "",
  updatedAt: "",
  submittedAt: ""
};

const rotationKey = (week, district, cafe) => `${week}|${district}|${cafe}`;
const rotationRecordParentId = (week, district, cafe) => `rotation|${parseWeekStart(week) || week}|${district}|${cafe}`;
const makeDatabaseRecordId = (...parts) => parts.filter(Boolean).join("|").replace(/\s+/g, " ").trim();
const compactValues = (values = []) => values.filter((value) => String(value || "").trim());
const selectedRowForName = (name) => MENUWORKS_ITEMS.find((row) => getItemIdentity(row) === name) || makeUploadedItem(name);

function baseDatabaseRecord({ parentId, recordId, recordType, status, district, cafe, week, stationKey, stationDisplayName, notes }) {
  return {
    [SMARTSHEET_COLUMNS.recordId]: recordId,
    [SMARTSHEET_COLUMNS.parentRecordId]: parentId || "",
    [SMARTSHEET_COLUMNS.recordType]: recordType,
    [SMARTSHEET_COLUMNS.status]: status || "Draft",
    [SMARTSHEET_COLUMNS.district]: district || "",
    [SMARTSHEET_COLUMNS.cafeUnit]: cafe || "",
    [SMARTSHEET_COLUMNS.weekStartDate]: parseWeekStart(week),
    [SMARTSHEET_COLUMNS.weekEndDate]: parseWeekEnd(week),
    [SMARTSHEET_COLUMNS.dateRangeLabel]: week || "",
    [SMARTSHEET_COLUMNS.station]: stationKey ? (STATION_SMARTSHEET_LABELS[stationKey] || stationKey) : "",
    [SMARTSHEET_COLUMNS.stationDisplayName]: stationDisplayName || (stationKey ? stationLabel(cafe, stationKey) : ""),
    [SMARTSHEET_COLUMNS.stationKey]: stationKey || "",
    [SMARTSHEET_COLUMNS.notes]: notes || "",
  };
}

function selectionDatabaseRecord({ parentId, district, cafe, week, rotation, stationKey, selectionType, itemName, sortOrder, slotNumber }) {
  const row = selectedRowForName(itemName);
  const price = getPrice(row);
  const trueCost = getTrueCost(row);
  const foodCost = price ? Number(trueCost || 0) / Number(price) : null;
  return {
    ...baseDatabaseRecord({
      parentId,
      recordId: makeDatabaseRecordId(parentId, stationKey, selectionType, slotNumber, itemName),
      recordType: stationKey === "global" ? SMARTSHEET_RECORD_TYPES.globalSelection : SMARTSHEET_RECORD_TYPES.stationSelection,
      status: rotation.status || "Draft",
      district,
      cafe,
      week,
      stationKey,
    }),
    [SMARTSHEET_COLUMNS.slotNumber]: slotNumber,
    [SMARTSHEET_COLUMNS.menuConcept]: rotation.menu || "",
    [SMARTSHEET_COLUMNS.stationSubConcept]: rotation.station || "",
    [SMARTSHEET_COLUMNS.selectionType]: selectionType,
    [SMARTSHEET_COLUMNS.menuItemSelection]: getDisplayName(row) || titleCase(itemName),
    [SMARTSHEET_COLUMNS.mrn]: row.mrn || row.MRN || "",
    [SMARTSHEET_COLUMNS.portion]: row.portion || row.Portion || "",
    [SMARTSHEET_COLUMNS.menuItemSortOrder]: sortOrder,
    [SMARTSHEET_COLUMNS.price]: price ?? "",
    [SMARTSHEET_COLUMNS.trueCost]: trueCost ?? "",
    [SMARTSHEET_COLUMNS.foodCostPct]: foodCost == null ? "" : Number((foodCost * 100).toFixed(1)),
    [SMARTSHEET_COLUMNS.enticingDescription]: row.enticingDescription || row.description || row["Enticing Description"] || "",
    [SMARTSHEET_COLUMNS.dietTags]: getDiet(row),
    [SMARTSHEET_COLUMNS.allergens]: getAllergens(row),
  };
}

function buildDatabaseRecordsForRotation({ week, district, cafe, rotation }) {
  if (!week || !district || !cafe) return [];
  const parentId = rotationRecordParentId(week, district, cafe);
  const selected = selectedItems(rotation);
  const costRange = selectedTrueCostRange(selected);
  const fcRange = selectedFoodCostRange(selected);
  const header = {
    ...baseDatabaseRecord({
      parentId: "",
      recordId: parentId,
      recordType: SMARTSHEET_RECORD_TYPES.rotationHeader,
      status: rotation.status || "Draft",
      district,
      cafe,
      week,
      notes: "Generated by Culinary Tools Platform. Smartsheet column labels are database-aligned."
    }),
    [SMARTSHEET_COLUMNS.submittedBy]: rotation.submittedBy || "",
    [SMARTSHEET_COLUMNS.submittedAt]: rotation.submittedAt || "",
    [SMARTSHEET_COLUMNS.updatedBy]: rotation.submittedBy || "",
    [SMARTSHEET_COLUMNS.updatedAt]: rotation.updatedAt || "",
    [SMARTSHEET_COLUMNS.savedEntryCount]: selected.length,
    [SMARTSHEET_COLUMNS.projectedTrueCostLow]: costRange.low ?? "",
    [SMARTSHEET_COLUMNS.projectedTrueCostHigh]: costRange.high ?? "",
    [SMARTSHEET_COLUMNS.foodCostRangeLowPct]: fcRange.low == null ? "" : Number((fcRange.low * 100).toFixed(1)),
    [SMARTSHEET_COLUMNS.foodCostRangeHighPct]: fcRange.high == null ? "" : Number((fcRange.high * 100).toFixed(1)),
    [SMARTSHEET_COLUMNS.historyInclude]: true,
  };

  const globalBlock = rotation.menu ? {
    ...baseDatabaseRecord({
      parentId,
      recordId: makeDatabaseRecordId(parentId, "global-block", rotation.menu),
      recordType: SMARTSHEET_RECORD_TYPES.globalBlock,
      status: rotation.status || "Draft",
      district,
      cafe,
      week,
      stationKey: "global",
    }),
    [SMARTSHEET_COLUMNS.menuConcept]: rotation.menu || "",
    [SMARTSHEET_COLUMNS.stationSubConcept]: rotation.station || "",
    [SMARTSHEET_COLUMNS.menuBlockLabel]: "Weekly",
    [SMARTSHEET_COLUMNS.menuBlockType]: "Weekly",
    [SMARTSHEET_COLUMNS.globalBlockId]: makeDatabaseRecordId(parentId, "global"),
    [SMARTSHEET_COLUMNS.globalBlockIndex]: 1,
    [SMARTSHEET_COLUMNS.globalBlockDays]: "Monday, Tuesday, Wednesday, Thursday, Friday",
    [SMARTSHEET_COLUMNS.isReadOnly]: false,
    [SMARTSHEET_COLUMNS.startedPreviousWeek]: false,
    [SMARTSHEET_COLUMNS.continuesNextWeek]: false,
    [SMARTSHEET_COLUMNS.allowedOverlapGroup]: district === "North" && ["Cricket", "Moby"].includes(cafe) ? "North Commissary Global" : "",
  } : null;

  const selectionRows = [];
  const pushSelections = (stationKey, selectionType, values, offset = 0) => {
    compactValues(values).forEach((itemName, index) => {
      selectionRows.push(selectionDatabaseRecord({ parentId, district, cafe, week, rotation, stationKey, selectionType, itemName, sortOrder: offset + index + 1, slotNumber: index + 1 }));
    });
  };

  pushSelections("global", SMARTSHEET_SELECTION_TYPES.entree, rotation.entrees || [], 0);
  pushSelections("global", SMARTSHEET_SELECTION_TYPES.side, rotation.sides || [], 100);
  pushSelections("global", SMARTSHEET_SELECTION_TYPES.subRecipe, rotation.subRecipes || [], 200);
  pushSelections("global", SMARTSHEET_SELECTION_TYPES.extension, rotation.extensions || [], 300);
  pushSelections("grill", SMARTSHEET_SELECTION_TYPES.regionalSpecial, [rotation.grill?.regionalSpecial], 400);
  pushSelections("grill", SMARTSHEET_SELECTION_TYPES.locationSpotlight, [rotation.grill?.locationSpotlight], 410);
  ["salad", "pizza", "deli", "fishMarket", "freshFive", "soup"].forEach((stationKey, stationIndex) => {
    pushSelections(stationKey, SMARTSHEET_SELECTION_TYPES.lto, rotation.ltos?.[stationKey] || [], 500 + stationIndex * 100);
  });
  pushSelections("wok", SMARTSHEET_SELECTION_TYPES.wokEntree, rotation.ltos?.wokEntrees || [], 1000);
  pushSelections("wok", SMARTSHEET_SELECTION_TYPES.wokSide, rotation.ltos?.wokSides || [], 1100);
  pushSelections("wok", SMARTSHEET_SELECTION_TYPES.wokBase, rotation.ltos?.wokBase || [], 1200);
  pushSelections("wok", SMARTSHEET_SELECTION_TYPES.wokSubRecipe, rotation.ltos?.wokSubRecipes || [], 1300);
  Object.entries(rotation.carvery || {}).filter(([, value]) => value).forEach(([field, value], index) => {
    const type = field.includes("protein") ? SMARTSHEET_SELECTION_TYPES.carveryProtein : field.includes("vegetable") ? SMARTSHEET_SELECTION_TYPES.carveryVegetable : field.includes("starch") ? SMARTSHEET_SELECTION_TYPES.carveryStarch : field.includes("hot") ? SMARTSHEET_SELECTION_TYPES.carveryHotSide : SMARTSHEET_SELECTION_TYPES.carveryColdSide;
    selectionRows.push(selectionDatabaseRecord({ parentId, district, cafe, week, rotation, stationKey: "carvery", selectionType: type, itemName: value, sortOrder: 1400 + index, slotNumber: index + 1 }));
  });

  const uploadRows = [];
  Object.entries(rotation.uploadedLtos || {}).forEach(([stationKey, items]) => {
    compactValues(items || []).forEach((itemName, index) => {
      uploadRows.push({
        ...baseDatabaseRecord({ parentId, recordId: makeDatabaseRecordId(parentId, "upload", stationKey, index + 1, itemName), recordType: SMARTSHEET_RECORD_TYPES.uploadedItem, status: rotation.status || "Draft", district, cafe, week, stationKey }),
        [SMARTSHEET_COLUMNS.uploadedItemName]: titleCase(itemName),
        [SMARTSHEET_COLUMNS.mappedStationKey]: stationKey,
        [SMARTSHEET_COLUMNS.uploadApplied]: true,
        [SMARTSHEET_COLUMNS.selectionType]: SMARTSHEET_SELECTION_TYPES.lto,
      });
    });
  });

  return [header, ...(globalBlock ? [globalBlock] : []), ...selectionRows, ...uploadRows];
}

function upsertDatabaseRecords(existingRecords = [], nextRecords = []) {
  const ids = new Set(nextRecords.map((record) => record[SMARTSHEET_COLUMNS.recordId]));
  return [...existingRecords.filter((record) => !ids.has(record[SMARTSHEET_COLUMNS.recordId])), ...nextRecords];
}

function missingRequiredDatabaseColumns(availableColumns = []) {
  const available = new Set(availableColumns);
  return REQUIRED_SMARTSHEET_COLUMNS_FOR_CURRENT_BUILD.filter((column) => !available.has(column));
}


async function syncRecordsToSmartsheet(records = [], context = {}) {
  const response = await fetch("/api/smartsheet/records", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "upsertRecords",
      records,
      requiredColumns: REQUIRED_SMARTSHEET_COLUMNS_FOR_CURRENT_BUILD,
      recordIdColumn: SMARTSHEET_COLUMNS.recordId,
      context,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.ok === false) {
    const error = new Error(payload.message || "Smartsheet sync failed");
    error.payload = payload;
    throw error;
  }
  return payload;
}

async function loadRecordsFromSmartsheet() {
  const response = await fetch("/api/smartsheet/records");
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.ok === false) {
    const error = new Error(payload.message || "Smartsheet load failed");
    error.payload = payload;
    throw error;
  }
  return Array.isArray(payload.records) ? payload.records : [];
}

function normalizeLoadedRotationRecord(record = {}) {
  return {
    recordId: String(record[SMARTSHEET_COLUMNS.recordId] || ""),
    parentRecordId: String(record[SMARTSHEET_COLUMNS.parentRecordId] || ""),
    recordType: String(record[SMARTSHEET_COLUMNS.recordType] || ""),
    status: String(record[SMARTSHEET_COLUMNS.status] || ""),
    district: String(record[SMARTSHEET_COLUMNS.district] || ""),
    cafe: String(record[SMARTSHEET_COLUMNS.cafeUnit] || ""),
    week: String(record[SMARTSHEET_COLUMNS.dateRangeLabel] || ""),
    stationKey: String(record[SMARTSHEET_COLUMNS.stationKey] || ""),
    selectionType: String(record[SMARTSHEET_COLUMNS.selectionType] || ""),
    itemName: String(record[SMARTSHEET_COLUMNS.menuItemSelection] || record[SMARTSHEET_COLUMNS.uploadedItemName] || ""),
    slotNumber: Number(record[SMARTSHEET_COLUMNS.slotNumber] || 0),
    menuConcept: String(record[SMARTSHEET_COLUMNS.menuConcept] || ""),
    stationSubConcept: String(record[SMARTSHEET_COLUMNS.stationSubConcept] || ""),
    submittedBy: String(record[SMARTSHEET_COLUMNS.submittedBy] || ""),
    submittedAt: String(record[SMARTSHEET_COLUMNS.submittedAt] || ""),
    updatedAt: String(record[SMARTSHEET_COLUMNS.updatedAt] || ""),
  };
}

function recordsToRotations(records = []) {
  const grouped = {};

  const ensureRotation = (key) => {
    if (!grouped[key]) {
      grouped[key] = {
        ...EMPTY_ROTATION,
        entrees: [...EMPTY_ROTATION.entrees],
        sides: [...EMPTY_ROTATION.sides],
        subRecipes: [...EMPTY_ROTATION.subRecipes],
        extensions: [...EMPTY_ROTATION.extensions],
        grill: { ...EMPTY_ROTATION.grill },
        ltos: Object.fromEntries(Object.entries(EMPTY_ROTATION.ltos).map(([station, values]) => [station, [...values]])),
        carvery: { ...EMPTY_ROTATION.carvery },
        uploadedLtos: {},
      };
    }
    return grouped[key];
  };

  records.map(normalizeLoadedRotationRecord).forEach((record) => {
    if (!record.week || !record.district || !record.cafe) return;
    const key = rotationKey(record.week, record.district, record.cafe);
    const rotation = ensureRotation(key);

    if (record.recordType === SMARTSHEET_RECORD_TYPES.rotationHeader) {
      rotation.status = record.status || rotation.status || "Draft";
      rotation.submittedBy = record.submittedBy || rotation.submittedBy || "";
      rotation.submittedAt = record.submittedAt || rotation.submittedAt || "";
      rotation.updatedAt = record.updatedAt || rotation.updatedAt || "";
      return;
    }

    if (record.recordType === SMARTSHEET_RECORD_TYPES.globalBlock) {
      rotation.menu = record.menuConcept || rotation.menu || "";
      rotation.station = record.stationSubConcept || rotation.station || "";
      rotation.status = record.status || rotation.status || "Draft";
      return;
    }

    if (record.recordType === SMARTSHEET_RECORD_TYPES.uploadedItem) {
      const stationKey = record.stationKey || "unmatched";
      rotation.uploadedLtos[stationKey] = rotation.uploadedLtos[stationKey] || [];
      if (record.itemName && !rotation.uploadedLtos[stationKey].includes(record.itemName)) rotation.uploadedLtos[stationKey].push(record.itemName);
      return;
    }

    if (!record.itemName) return;
    const index = Math.max(0, (record.slotNumber || 1) - 1);

    if (record.stationKey === "global") {
      if (record.selectionType === SMARTSHEET_SELECTION_TYPES.entree) rotation.entrees[index] = record.itemName;
      else if (record.selectionType === SMARTSHEET_SELECTION_TYPES.side) rotation.sides[index] = record.itemName;
      else if (record.selectionType === SMARTSHEET_SELECTION_TYPES.subRecipe) rotation.subRecipes[index] = record.itemName;
      else if (record.selectionType === SMARTSHEET_SELECTION_TYPES.extension) rotation.extensions[index] = record.itemName;
      return;
    }

    if (record.stationKey === "grill") {
      if (record.selectionType === SMARTSHEET_SELECTION_TYPES.regionalSpecial) rotation.grill.regionalSpecial = record.itemName;
      if (record.selectionType === SMARTSHEET_SELECTION_TYPES.locationSpotlight) rotation.grill.locationSpotlight = record.itemName;
      return;
    }

    if (record.stationKey === "wok") {
      if (record.selectionType === SMARTSHEET_SELECTION_TYPES.wokEntree) rotation.ltos.wokEntrees[index] = record.itemName;
      if (record.selectionType === SMARTSHEET_SELECTION_TYPES.wokSide) rotation.ltos.wokSides[index] = record.itemName;
      if (record.selectionType === SMARTSHEET_SELECTION_TYPES.wokBase) rotation.ltos.wokBase[index] = record.itemName;
      if (record.selectionType === SMARTSHEET_SELECTION_TYPES.wokSubRecipe) rotation.ltos.wokSubRecipes[index] = record.itemName;
      return;
    }

    if (record.stationKey === "carvery") {
      const carveryFieldByType = {
        [SMARTSHEET_SELECTION_TYPES.carveryProtein]: ["protein1", "protein2"],
        [SMARTSHEET_SELECTION_TYPES.carveryVegetable]: ["vegetable1", "vegetable2", "vegetable3"],
        [SMARTSHEET_SELECTION_TYPES.carveryStarch]: ["starch"],
        [SMARTSHEET_SELECTION_TYPES.carveryHotSide]: ["hotSide1"],
        [SMARTSHEET_SELECTION_TYPES.carveryColdSide]: ["coldSide1", "coldSide2"],
      };
      const fields = carveryFieldByType[record.selectionType] || [];
      const field = fields[Math.min(index, fields.length - 1)];
      if (field) rotation.carvery[field] = record.itemName;
      return;
    }

    if (rotation.ltos[record.stationKey]) {
      rotation.ltos[record.stationKey][index] = record.itemName;
    }
  });

  return grouped;
}

const getItemIdentity = (row) =>
  row.item ||
  row.recipeName ||
  row.displayName ||
  row.shortName ||
  row["Recipe Name"] ||
  row["Short Name"] ||
  "";

const getDisplayName = (row) => titleCase(row.displayName || row.shortName || row.item || row.recipeName || row["Recipe Name"] || "");
const getMenuName = (row) => row.menu || row.menuName || row["Menu Name"] || "";
const getStationName = (row) => row.station || row.stationName || row["Station"] || "";
const getPrice = (row) => row.price ?? row.sellPrice ?? row["Sell Price"] ?? null;
const getTrueCost = (row) => row.trueCost ?? row.itemCostWithWaste ?? row["Item + Waste Cost"] ?? row["Recipe Cost"] ?? row.recipeCost ?? null;
const getCategory = (row) => String(row.category || row.itemType || row["Item Type"] || row.classification || "").toLowerCase();
const getAllergens = (row) => Array.isArray(row.allergens) ? row.allergens.join(", ") : (row.allergens || row.allergenSummary || row["Allergens"] || "");
const stationLabel = (cafe, stationKey) => {
  if (cafe === "Doppler" && stationKey === "global") return "Wok Xahn";
  if (cafe === "Day 1" && stationKey === "grill") return "Adelaide's";
  return STATION_LABELS[stationKey] || stationKey;
};

function getDiet(row) {
  const normalize = (value) => {
    if (Array.isArray(value)) return value.join(" ");
    if (typeof value === "boolean") return value ? "true" : "";
    return String(value || "");
  };

  const combined = [
    row.veganTag,
    row.vegetarianTag,
    row.vegan,
    row.vegetarian,
    row.diet,
    row.dietTag,
    row.dietary,
    row.dietaryTags,
    row.smartTags,
    row.tags,
    row.attributes,
    row.dietaryPreference,
    row.dietaryPreferences,
    row.menuTags,
    row.itemTags,
    row.smartTagNames,
    row.itemAttributes
  ].map(normalize).filter(Boolean).join(" ").toLowerCase();

  const name = String(getItemIdentity(row)).toLowerCase();
  const description = String(row.enticingDescription || row.description || row["Enticing Description"] || "").toLowerCase();
  const text = `${name} ${description}`;

  if (row.vegan === true || combined.includes("vegan") || combined.includes("plant-based") || combined.includes("plant based")) return "Vegan";
  if (row.vegetarian === true || combined.includes("vegetarian")) return "Vegetarian";
  if (text.includes("vegan") || text.includes("plant-based") || text.includes("plant based")) return "Vegan";
  if (text.includes("vegetarian")) return "Vegetarian";
  return "";
}

function uniqueRows(rows) {
  const seen = new Set();
  return rows.filter((row) => {
    const identity = getItemIdentity(row);
    const key = `${identity}`.toLowerCase() + "|" + (row.mrn || row.MRN || "") + "|" + (row.portion || row.Portion || "");
    if (!identity || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function isPriced(row) {
  return getPrice(row) != null && !Number.isNaN(Number(getPrice(row)));
}

function isEntree(row) {
  const price = Number(getPrice(row));
  const category = getCategory(row);
  return category.includes("entree") || category.includes("entrée") || category.includes("plate") || category.includes("main") || price >= 9;
}

function isSide(row) {
  const price = Number(getPrice(row));
  const category = getCategory(row);
  return category.includes("side") || (!category.includes("extension") && isPriced(row) && price < 9);
}

function isSubRecipe(row) {
  const category = getCategory(row);
  return category.includes("sub") || getPrice(row) == null;
}

function isExtension(row) {
  const text = `${getItemIdentity(row)} ${getMenuName(row)} ${getStationName(row)}`.toLowerCase();
  const category = getCategory(row);
  return category.includes("extension") || /cookie|cake|dessert|lassi|beverage|drink|chips|salsa|guacamole|queso/.test(text);
}

function normalizeImportedStation(stationName = "") {
  const value = String(stationName).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  if (/wok|global|xhan|xahn/.test(value)) return "global";
  if (/zanes|zane|salad/.test(value)) return "salad";
  if (/pizza|flatbread/.test(value)) return "pizza";
  if (/sandwich|deli/.test(value)) return "deli";
  if (/adelaide|adelaides|grill/.test(value)) return "grill";
  if (/fish/.test(value)) return "fishMarket";
  if (/carvery|carve/.test(value)) return "carvery";
  if (/fresh|five|\$5/.test(value)) return "freshFive";
  if (/soup|chili|bisque|chowder/.test(value)) return "soup";
  return "unmatched";
}

function makeUploadedItem(name) {
  return {
    id: `uploaded-${String(name).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    menu: "Uploaded Week at a Glance",
    station: "Week at a Glance",
    item: name,
    mrn: "—",
    portion: "—",
    price: null,
    trueCost: null,
    category: "uploaded",
    enticingDescription: "Imported from Week at a Glance report. Match to MenuWorks database for full cost, description, and allergen detail.",
    allergens: ""
  };
}

function categorize(items) {
  const rows = uniqueRows(items);
  return {
    entrees: rows.filter((row) => isPriced(row) && isEntree(row)),
    sides: rows.filter((row) => isPriced(row) && isSide(row)),
    subRecipes: rows.filter((row) => isSubRecipe(row)),
    extensions: rows.filter((row) => isPriced(row) && isExtension(row))
  };
}

function textForRow(row) {
  return `${getMenuName(row)} ${getStationName(row)} ${getItemIdentity(row)} ${row.enticingDescription || ""} ${row.description || ""}`.toLowerCase();
}

function stationPool(stationKey) {
  const all = uniqueRows(MENUWORKS_ITEMS);
  const byMenu = (needle) => all.filter((row) => getMenuName(row).toLowerCase().includes(needle));
  const byStation = (needle) => all.filter((row) => getStationName(row).toLowerCase().includes(needle));
  const byText = (regex) => all.filter((row) => regex.test(textForRow(row)));

  const pools = {
    salad: uniqueRows([...byMenu("salad"), ...byStation("salad"), ...byText(/salad|greens|slaw/)]),
    pizza: uniqueRows([...byMenu("pizza"), ...byStation("pizza"), ...byText(/pizza|flatbread/)]),
    deli: uniqueRows([...byMenu("deli"), ...byStation("deli"), ...byStation("sandwich"), ...byText(/sandwich|deli|wrap|naanwich|banh mi/)]),
    fishMarket: uniqueRows([...byMenu("fish"), ...byStation("fish"), ...byText(/fish|salmon|tuna|cod|shrimp|crab|seafood/)]),
    freshFive: uniqueRows([...byMenu("fresh five"), ...byMenu("fresh $5"), ...byStation("fresh"), ...byText(/fresh five|fresh \$5|fresh 5/)]),
    soup: uniqueRows([...byMenu("soup"), ...byStation("soup"), ...byText(/soup|chili|bisque|chowder/)]),
    wokEntrees: uniqueRows([...byMenu("wok"), ...byStation("wok"), ...byText(/wok|stir fry|stir-fry|orange peel|sweet and sour|huli huli/)]).filter((row) => isEntree(row)),
    wokSides: uniqueRows([...byMenu("wok"), ...byStation("wok"), ...byText(/lo mein|fried rice|green beans|carrots|gai lan|slaw/)]).filter((row) => isSide(row)),
    wokBase: uniqueRows([...byMenu("wok"), ...byStation("wok"), ...byText(/rice|noodle|lo mein|base/)]).filter((row) => isSide(row) || /rice|noodle|base/i.test(getItemIdentity(row))),
    wokSubRecipes: all.filter((row) => isSubRecipe(row)),
    carveryProtein: uniqueRows([...byMenu("carvery"), ...byStation("carvery"), ...byText(/beef|chicken|pork|turkey|salmon|tofu|protein/)]).filter((row) => isEntree(row)),
    carveryVegetable: byText(/broccoli|carrot|green bean|beans|vegetable|veg|cauliflower|brussels|squash|zucchini|asparagus/),
    carverySide: all.filter((row) => isSide(row))
  };

  const pool = pools[stationKey] || [];
  if (pool.length) return pool;

  if (["freshFive", "salad", "pizza", "deli", "fishMarket", "soup"].includes(stationKey)) {
    return all.filter((row) => isEntree(row) || isSide(row));
  }

  return all;
}

function stationSlots(cafe, stationKey) {
  const override = {
    Dawson: { freshFive: 5 },
    Nessie: { freshFive: 5 },
    Cricket: { freshFive: 5 },
    Moby: { deli: 4, salad: 4, freshFive: 2 },
    Commissary: { deli: 4, salad: 3, freshFive: 2, soup: 2 },
    Atlas: { freshFive: 2 },
    Frontier: { freshFive: 2 }
  }[cafe]?.[stationKey];

  if (override) return override;
  if (stationKey === "fishMarket") return 1;
  if (["salad", "pizza", "deli", "soup"].includes(stationKey)) return 2;
  if (stationKey === "freshFive") return 5;
  return 1;
}

function potatoSides() {
  return uniqueRows(MENUWORKS_ITEMS.filter((row) => {
    const name = String(getItemIdentity(row)).toLowerCase();
    return isSide(row) && /potato|potatoes|fries|tots|hash brown|mashed|fingerling|yukon|russet|sweet potato/.test(name);
  }));
}

function carverySideTemperature(row) {
  const text = textForRow(row);
  if (/salad|slaw|coleslaw|cold|chilled|pickle|pickled|crudite|fruit|pasta salad|potato salad|cucumber|tomato salad/.test(text)) return "cold";
  if (/roasted|grilled|sauteed|sautéed|steamed|braised|mashed|fried|fries|tots|hash brown|rice|beans|mac|gratin|warm|hot|baked|vegetable|broccoli|carrot|green bean|cauliflower|brussels|squash|zucchini|asparagus|corn/.test(text)) return "hot";
  return "unknown";
}

function carveryHotSides() {
  const sides = stationPool("carverySide").filter((row) => carverySideTemperature(row) !== "cold");
  return sides.length ? uniqueRows(sides) : stationPool("carverySide");
}

function carveryColdSides() {
  const sides = stationPool("carverySide").filter((row) => carverySideTemperature(row) !== "hot");
  return sides.length ? uniqueRows(sides) : stationPool("carverySide");
}

function blankRotation(menu = "", station = "") {
  return {
    ...EMPTY_ROTATION,
    menu,
    station,
    grill: { regionalSpecial: "", locationSpotlight: "" },
    ltos: { ...EMPTY_ROTATION.ltos },
    carvery: { ...EMPTY_ROTATION.carvery },
    uploadedLtos: {},
    status: "Draft",
    submittedBy: "",
    updatedAt: "",
    submittedAt: ""
  };
}

function nowStamp() {
  return new Date().toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function stationComplete(rotation, stationKey) {
  if (stationKey === "global") return Boolean(rotation.menu && (rotation.entrees || []).filter(Boolean).length >= 2);
  if (stationKey === "grill") return Boolean(rotation.grill?.regionalSpecial || rotation.grill?.locationSpotlight);
  if (["salad", "pizza", "deli", "fishMarket", "freshFive", "soup"].includes(stationKey)) {
    return Boolean((rotation.ltos?.[stationKey] || []).some(Boolean) || (rotation.uploadedLtos?.[stationKey] || []).some(Boolean));
  }
  if (stationKey === "wok") return Boolean((rotation.ltos?.wokEntrees || []).some(Boolean));
  if (stationKey === "carvery") return Boolean(Object.values(rotation.carvery || {}).some(Boolean));
  return false;
}

function rotationRequirements(rotation, cafe) {
  const stationKeys = CAFE_STATION_CONFIG[cafe] || ["global"];
  const globalReady = Boolean(rotation.menu && (rotation.entrees || []).filter(Boolean).length >= 2);
  const incompleteStations = stationKeys.filter((stationKey) => stationKey !== "global" && !stationComplete(rotation, stationKey));
  return {
    globalReady,
    incompleteStations,
    canSubmit: globalReady && incompleteStations.length === 0
  };
}

function leadershipRead(rows, conflictMenus) {
  const declared = rows.filter((row) => row.menu).length;
  const missing = rows.filter((row) => !row.menu).map((row) => row.cafe);
  const conflicts = rows.filter((row) => row.menu && conflictMenus[`${row.district}|${row.menu}`] > 1);
  const parts = [`${declared} of ${rows.length} cafés have a Global declaration.`];
  if (missing.length) parts.push(`${missing.join(", ")} still need to submit.`);
  if (conflicts.length) parts.push(`${conflicts.length} café${conflicts.length === 1 ? " has" : "s have"} duplicate menu flags.`);
  if (!missing.length && !conflicts.length) parts.push("No immediate leadership follow-up is showing for this week.");
  return parts.join(" ");
}

function rowsForSelectedNames(names = []) {
  const cleanNames = names.filter(Boolean);
  const matched = MENUWORKS_ITEMS.filter((row) => cleanNames.includes(getItemIdentity(row)));
  const missing = cleanNames.filter((name) => !matched.some((row) => getItemIdentity(row) === name)).map(makeUploadedItem);
  return [...matched, ...missing];
}

function globalSelectedRows(rotation) {
  return rowsForSelectedNames([...(rotation.entrees || []), ...(rotation.sides || []), ...(rotation.subRecipes || []), ...(rotation.extensions || [])]);
}

function grillSelectedRows(rotation) {
  return rowsForSelectedNames([rotation.grill?.regionalSpecial, rotation.grill?.locationSpotlight]);
}

function ltoSelectedRows(rotation, stationKey) {
  return rowsForSelectedNames([...(rotation.ltos?.[stationKey] || []), ...(rotation.uploadedLtos?.[stationKey] || [])]);
}

function wokSelectedRows(rotation) {
  return rowsForSelectedNames([...(rotation.ltos?.wokEntrees || []), ...(rotation.ltos?.wokSides || []), ...(rotation.ltos?.wokBase || []), ...(rotation.ltos?.wokSubRecipes || [])]);
}

function carverySelectedRows(rotation) {
  return rowsForSelectedNames(Object.values(rotation.carvery || {}));
}

function selectedItems(rotation) {
  return [
    ...globalSelectedRows(rotation),
    ...grillSelectedRows(rotation),
    ...rowsForSelectedNames(Object.values(rotation.ltos || {}).flat()),
    ...carverySelectedRows(rotation)
  ];
}

function foodSummary(items) {
  const priced = items.filter((row) => getPrice(row) != null && getTrueCost(row) != null && Number(getPrice(row)) > 0);
  const sell = priced.reduce((sum, row) => sum + Number(getPrice(row) || 0), 0);
  const cost = priced.reduce((sum, row) => sum + Number(getTrueCost(row) || 0), 0);
  return { priced: priced.length, sell, cost, fc: sell ? cost / sell : null };
}

function selectedTrueCostRange(items) {
  const costedItems = items.filter((row) => getTrueCost(row) != null);
  const entrees = costedItems.filter((row) => isEntree(row)).map((row) => Number(getTrueCost(row) || 0)).sort((a, b) => a - b);
  const sides = costedItems.filter((row) => isSide(row)).map((row) => Number(getTrueCost(row) || 0)).sort((a, b) => a - b);
  const subRecipeCost = costedItems.filter((row) => isSubRecipe(row)).reduce((sum, row) => sum + Number(getTrueCost(row) || 0), 0);

  if (!entrees.length) {
    return { low: subRecipeCost > 0 ? subRecipeCost : null, high: subRecipeCost > 0 ? subRecipeCost : null, subRecipeCost, partial: subRecipeCost > 0 };
  }

  const lowestEntree = entrees[0];
  const highestEntree = entrees[entrees.length - 1];
  const lowestTwoSides = sides.slice(0, 2).reduce((sum, value) => sum + value, 0);
  const highestTwoSides = sides.slice(-2).reduce((sum, value) => sum + value, 0);

  return {
    low: lowestEntree + lowestTwoSides + subRecipeCost,
    high: highestEntree + highestTwoSides + subRecipeCost,
    subRecipeCost,
    partial: sides.length < 2
  };
}

function moneyRange(range) {
  if (!range || range.low == null || range.high == null) return "—";
  if (Math.abs(range.low - range.high) < 0.005) return money(range.low);
  return `${money(range.low)} – ${money(range.high)}`;
}

function trueCostRangeNote(range) {
  if (!range || range.low == null) return "select items to calculate";
  if (range.partial) return "partial range; add entrée/sides to complete";
  return "1 entrée + 2 sides + sub recipes";
}

function selectedFoodCostRange(items) {
  const costedItems = items.filter((row) => getTrueCost(row) != null);
  const pricedItems = items.filter((row) => getPrice(row) != null && getTrueCost(row) != null && Number(getPrice(row)) > 0);

  const entreeRows = pricedItems.filter((row) => isEntree(row)).map((row) => ({ cost: Number(getTrueCost(row) || 0), price: Number(getPrice(row) || 0) })).sort((a, b) => a.cost - b.cost);
  const sideRows = pricedItems.filter((row) => isSide(row)).map((row) => ({ cost: Number(getTrueCost(row) || 0), price: Number(getPrice(row) || 0) })).sort((a, b) => a.cost - b.cost);
  const subRecipeCost = costedItems.filter((row) => isSubRecipe(row)).reduce((sum, row) => sum + Number(getTrueCost(row) || 0), 0);

  if (!entreeRows.length) return { low: null, high: null, partial: true, subRecipeCost };

  const lowestEntree = entreeRows[0];
  const highestEntree = entreeRows[entreeRows.length - 1];
  const lowestTwoSides = sideRows.slice(0, 2);
  const highestTwoSides = sideRows.slice(-2);

  const lowCost = lowestEntree.cost + lowestTwoSides.reduce((sum, row) => sum + row.cost, 0) + subRecipeCost;
  const highCost = highestEntree.cost + highestTwoSides.reduce((sum, row) => sum + row.cost, 0) + subRecipeCost;
  const lowSell = lowestEntree.price + lowestTwoSides.reduce((sum, row) => sum + row.price, 0);
  const highSell = highestEntree.price + highestTwoSides.reduce((sum, row) => sum + row.price, 0);

  return {
    low: lowSell > 0 ? lowCost / lowSell : null,
    high: highSell > 0 ? highCost / highSell : null,
    partial: sideRows.length < 2,
    subRecipeCost
  };
}

function pctRange(range) {
  if (!range || range.low == null || range.high == null) return "—";
  if (Math.abs(range.low - range.high) < 0.0005) return pct(range.low);
  return `${pct(range.low)} – ${pct(range.high)}`;
}

function foodCostRangeNote(range) {
  if (!range) return "select entrée to calculate";
  if (range.low == null && range.subRecipeCost > 0) return "sub recipe cost accepted; add priced entrée to calculate %";
  if (range.low == null) return "select entrée to calculate";
  if (range.partial) return "partial range; add sides to complete";
  return "plate range with sub recipes included";
}

function getStationCostOverview(rotation, cafe) {
  const uploaded = rotation.uploadedLtos || {};
  const stationRows = [];
  const cafeStations = CAFE_STATION_CONFIG[cafe] || ["global"];

  if (cafeStations.includes("global")) {
    const globalItems = globalSelectedRows(rotation);
    stationRows.push({ key: "global", label: stationLabel(cafe, "global"), items: globalItems, note: rotation.menu ? rotation.menu : "not selected" });
  }

  if (cafeStations.includes("grill")) {
    const grillItems = grillSelectedRows(rotation);
    stationRows.push({ key: "grill", label: stationLabel(cafe, "grill"), items: grillItems, note: "regional + location spotlight" });
  }

  ["salad", "pizza", "deli", "fishMarket", "freshFive", "soup"].forEach((key) => {
    if (cafeStations.includes(key)) {
      const selected = ltoSelectedRows(rotation, key);
      const uploadedItems = (uploaded[key] || []).filter(Boolean).map(makeUploadedItem);
      stationRows.push({ key, label: STATION_LABELS[key], items: selected.length ? selected : uploadedItems, note: selected.length ? "selected" : uploadedItems.length ? "from upload preview" : "not selected" });
    }
  });

  if (cafeStations.includes("wok")) stationRows.push({ key: "wok", label: "Wok Station", items: wokSelectedRows(rotation), note: "wok selections" });
  if (cafeStations.includes("carvery")) stationRows.push({ key: "carvery", label: "Carvery Station", items: carverySelectedRows(rotation), note: "carvery selections" });

  return stationRows.map((row) => {
    const summary = foodSummary(row.items);
    return { ...row, summary, selectedCount: row.items.length };
  });
}

function weekAtGlancePreview(fileName) {
  const rawStations = {
    "Wok Xhan": ["Sweet and Sour Tofu", "Pulled Kahlua Pork", "orange peel chicken", "jasmine rice", "vegetable fried rice", "vegetable lo mein", "blistered green beans", "Vegetarian Egg Roll"],
    "Pizza LTO": ["caprese flatbread", "Garden Pesto Flatbread"],
    "Zanes LTO": ["maple tofu barley pecan salad"],
    "Sandwich LTO": ["turkey apple brie sandwich with apple"]
  };

  const stationMap = Object.entries(rawStations).reduce((acc, [station, items]) => {
    const key = normalizeImportedStation(station);
    acc[key] = [...(acc[key] || []), ...items];
    return acc;
  }, {});

  return {
    fileName,
    reportType: "MenuWorks Week at a Glance",
    detectedCafe: "Doppler",
    detectedStation: "Wok Xhan",
    detectedDateRange: "May 25, 2026 - May 29, 2026",
    global: {
      menu: "Uploaded Week at a Glance",
      station: "Wok Xhan",
      entrees: ["Sweet and Sour Tofu", "Pulled Kahlua Pork", "orange peel chicken"],
      sides: ["jasmine rice", "vegetable fried rice", "vegetable lo mein", "blistered green beans"],
      subRecipes: ["", "", "", ""],
      extensions: ["Vegetarian Egg Roll", ""]
    },
    uploadedLtos: {
      pizza: stationMap.pizza || [],
      salad: stationMap.salad || [],
      deli: stationMap.deli || [],
      fishMarket: stationMap.fishMarket || [],
      grill: stationMap.grill || [],
      unmatched: stationMap.unmatched || []
    },
    stationAliases: Object.keys(rawStations).map((station) => ({ source: station, mappedTo: normalizeImportedStation(station) }))
  };
}

function NeighborhoodRotations({ onBackToPlatform }) {
  const [district, setDistrict] = useState("");
  const [week, setWeek] = useState(DEFAULT_ROTATION_WEEK);
  const [selectedCafe, setSelectedCafe] = useState("");
  const [rotationView, setRotationView] = useState("planner");
  const [resultsDistrict, setResultsDistrict] = useState("All");
  const [resultsCafe, setResultsCafe] = useState("All");
  const [rotations, setRotations] = useState(() => {
    try { return JSON.parse(localStorage.getItem(NEIGHBORHOOD_ROTATIONS_STORAGE_KEY) || "{}"); } catch { return {}; }
  });
  const [databaseRecords, setDatabaseRecords] = useState(() => {
    try { return JSON.parse(localStorage.getItem(SMARTSHEET_DATABASE_STORAGE_KEY) || "[]"); } catch { return []; }
  });
  const [databaseLoadStatus, setDatabaseLoadStatus] = useState({ state: "idle", message: "Using local saved data until Smartsheet is loaded.", loadedAt: "" });
  const [databaseSyncStatus, setDatabaseSyncStatus] = useState({ state: "idle", message: "No Smartsheet sync attempted yet.", syncedAt: "" });

  useEffect(() => { localStorage.setItem(NEIGHBORHOOD_ROTATIONS_STORAGE_KEY, JSON.stringify(rotations)); }, [rotations]);
  useEffect(() => { localStorage.setItem(SMARTSHEET_DATABASE_STORAGE_KEY, JSON.stringify(databaseRecords)); }, [databaseRecords]);

  const refreshFromSmartsheet = async () => {
    setDatabaseLoadStatus({ state: "loading", message: "Loading saved rotations from Smartsheet...", loadedAt: "" });
    try {
      const records = await loadRecordsFromSmartsheet();
      const loadedRotations = recordsToRotations(records);
      setDatabaseRecords(records);
      setRotations((prev) => ({ ...prev, ...loadedRotations }));
      setDatabaseLoadStatus({
        state: "synced",
        message: `Loaded ${records.length} Smartsheet row${records.length === 1 ? "" : "s"}. Executive View is using database-loaded rotations when available.`,
        loadedAt: nowStamp(),
      });
    } catch (error) {
      setDatabaseLoadStatus({
        state: "fallback",
        message: error.message || "Could not load Smartsheet records. Using local fallback records.",
        loadedAt: nowStamp(),
      });
    }
  };

  useEffect(() => { refreshFromSmartsheet(); }, []);

  const cafes = DISTRICTS[district] || [];
  useEffect(() => { if (district && selectedCafe && !cafes.includes(selectedCafe)) setSelectedCafe(""); }, [district, cafes, selectedCafe]);

  const currentRotation = selectedCafe ? (rotations[rotationKey(week, district, selectedCafe)] || EMPTY_ROTATION) : EMPTY_ROTATION;
  const menus = useMemo(() => Array.from(new Set(MENUWORKS_ITEMS.map((row) => getMenuName(row)).filter(Boolean))).sort(), []);
  const updateRotation = (patch) => setRotations((prev) => ({
    ...prev,
    [rotationKey(week, district, selectedCafe)]: { ...(prev[rotationKey(week, district, selectedCafe)] || EMPTY_ROTATION), ...patch }
  }));

  const districtWeekRows = cafes.map((cafe) => ({ district, cafe, ...(rotations[rotationKey(week, district, cafe)] || EMPTY_ROTATION) }));
  const leadershipRows = district === "South" ? districtWeekRows.flatMap((row) => row.cafe === "Nitro" ? [row, { ...row, cafe: "Frontier", copiedFrom: "Nitro" }] : [row]) : districtWeekRows;
  const conflictMenus = districtWeekRows.reduce((acc, row) => { if (row.menu) acc[row.menu] = (acc[row.menu] || 0) + 1; return acc; }, {});
  const allRows = Object.entries(DISTRICTS).flatMap(([dist, cafeList]) => cafeList.map((cafe) => ({ district: dist, cafe, ...(rotations[rotationKey(week, dist, cafe)] || EMPTY_ROTATION) })));
  const allConflictMenus = allRows.reduce((acc, row) => { if (row.menu) acc[`${row.district}|${row.menu}`] = (acc[`${row.district}|${row.menu}`] || 0) + 1; return acc; }, {});
  const resultRows = ROLLING_ROTATION_WEEKS.flatMap((wk) => Object.entries(DISTRICTS).flatMap(([dist, cafeList]) => cafeList.map((cafe) => ({ week: wk, district: dist, cafe, ...(rotations[rotationKey(wk, dist, cafe)] || EMPTY_ROTATION) })))).filter((row) => row.menu);
  const filteredResults = resultRows.filter((row) => (resultsDistrict === "All" || row.district === resultsDistrict) && (resultsCafe === "All" || row.cafe === resultsCafe)).reverse();
  const persistRotationToDatabase = async (nextRotation) => {
    if (!week || !district || !selectedCafe) return;
    const nextRecords = buildDatabaseRecordsForRotation({ week, district, cafe: selectedCafe, rotation: nextRotation });
    setDatabaseRecords((prev) => upsertDatabaseRecords(prev, nextRecords));
    setDatabaseSyncStatus({ state: "syncing", message: `Syncing ${nextRecords.length} row${nextRecords.length === 1 ? "" : "s"} to Smartsheet...`, syncedAt: "" });
    try {
      const result = await syncRecordsToSmartsheet(nextRecords, { week, district, cafe: selectedCafe, status: nextRotation.status || "Draft" });
      setDatabaseSyncStatus({ state: "synced", message: result.message || `Synced ${nextRecords.length} row${nextRecords.length === 1 ? "" : "s"} to Smartsheet.`, syncedAt: nowStamp() });
    } catch (error) {
      const missingColumns = error?.payload?.missingColumns || [];
      const missingMessage = missingColumns.length
        ? `Smartsheet is missing ${missingColumns.length} required column${missingColumns.length === 1 ? "" : "s"}: ${missingColumns.join(", ")}`
        : error.message || "Smartsheet sync failed. Local fallback saved.";
      setDatabaseSyncStatus({
        state: "fallback",
        message: missingMessage,
        missingColumns,
        syncedAt: nowStamp(),
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <NeighborhoodHeader onBackToPlatform={onBackToPlatform} district={district} />
        <section className="flex flex-wrap gap-3">
          <RotationTab label="Chef Planner" value="planner" active={rotationView} setActive={setRotationView} />
          <RotationTab label="Executive View" value="executive" active={rotationView} setActive={setRotationView} />
          <RotationTab label="Results" value="results" active={rotationView} setActive={setRotationView} />
        </section>
        {rotationView === "planner" && (
          <>
            <section className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <ControlCard label="District" value={district} setValue={setDistrict} options={Object.keys(DISTRICTS)} placeholder="Select district..." />
              <ControlCard label="Week" value={week} setValue={setWeek} options={ROTATION_WEEKS} />
              <ControlCard label="Café" value={selectedCafe} setValue={setSelectedCafe} options={cafes} placeholder="Select café/unit..." disabled={!district} />
              <StatusCard ready={Boolean(district && selectedCafe)} conflicts={Object.values(conflictMenus).filter((count) => count > 1).length} completed={districtWeekRows.filter((row) => row.menu).length} total={cafes.length} />
            </section>
            <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 space-y-6">
                {district && selectedCafe ? <RotationPlannerCard cafe={selectedCafe} district={district} menuOptions={menus} rotation={currentRotation} updateRotation={updateRotation} week={week} printRows={allRows} persistRotationToDatabase={persistRotationToDatabase} databaseLoadStatus={databaseLoadStatus} databaseSyncStatus={databaseSyncStatus} onRefreshDatabase={refreshFromSmartsheet} /> : <SelectPlannerPrompt />}
              </div>
              <LeadershipOverview district={district} week={week} rows={leadershipRows} conflictMenus={conflictMenus} />
            </section>
          </>
        )}
        {rotationView === "executive" && <ExecutiveView week={week} setWeek={setWeek} rows={allRows} conflictMenus={allConflictMenus} />}
        {rotationView === "results" && <ResultsView rows={filteredResults} resultsDistrict={resultsDistrict} setResultsDistrict={setResultsDistrict} resultsCafe={resultsCafe} setResultsCafe={setResultsCafe} />}
      </div>
    </div>
  );
}

function NeighborhoodHeader({ onBackToPlatform, district }) {
  return (
    <header className="rounded-[2rem] bg-white border border-slate-200 p-6 shadow-2xl">
      <button onClick={onBackToPlatform} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900"><ArrowLeft size={16} /> Back to platform</button>
      <div className="mt-5 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Still in Development</p>
          <h1 className="text-4xl font-bold mt-2">Neighborhood Rotations</h1>
          <p className="text-slate-600 mt-3 max-w-3xl">Chefs declare weekly Global Menu rotations and station LTOs by café.</p>
        </div>
        <div className="flex flex-col items-start lg:items-end gap-2">
          <VersionStamp compact />
          {district === "South" && <div className="rounded-2xl bg-slate-100 border border-slate-200 px-4 py-3 text-sm text-slate-600">Frontier follows Nitro for tracking.</div>}
        </div>
      </div>
    </header>
  );
}

function RotationTab({ label, value, active, setActive }) {
  return <button onClick={() => setActive(value)} className={`rounded-2xl px-5 py-3 font-semibold border ${active === value ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-300 text-slate-700"}`}>{label}</button>;
}

function ControlCard({ label, value, setValue, options, placeholder, disabled = false }) {
  return (
    <div className="rounded-3xl bg-white border border-slate-200 p-5 shadow-xl">
      <label className="block text-sm font-semibold text-slate-500 mb-2">{label}</label>
      <select disabled={disabled} value={value} onChange={(e) => setValue(e.target.value)} className="w-full rounded-2xl border-2 border-sky-200 bg-white px-4 py-3 font-semibold outline-none shadow-sm focus:border-sky-500 focus:ring-4 focus:ring-sky-100 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200">
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </div>
  );
}

function StatusCard({ ready, conflicts, completed, total }) {
  return (
    <div className="rounded-3xl bg-white border border-slate-200 p-5 shadow-xl">
      <p className="text-sm font-semibold text-slate-500">Week Status</p>
      {!ready ? (
        <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">Select a district and café/unit to view status.</div>
      ) : (
        <>
          <div className="mt-3 flex items-end gap-3"><p className="text-3xl font-bold">{completed}/{total}</p><p className="text-sm text-slate-500 mb-1">cafés declared</p></div>
          <p className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-bold ${conflicts ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>{conflicts ? `${conflicts} conflict group` : "No conflicts"}</p>
        </>
      )}
    </div>
  );
}


function SelectPlannerPrompt() {
  return (
    <div className="rounded-[2rem] bg-white border border-slate-200 p-8 shadow-2xl">
      <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Chef Planner</p>
      <h2 className="text-3xl font-bold mt-1">Select a district and café/unit</h2>
      <p className="text-slate-600 mt-3">The planner stays blank until a location is selected so the app does not imply a rotation has already been started.</p>
    </div>
  );
}

function DatabaseAlignmentNotice({ district, cafe, week, rotation }) {
  const records = buildDatabaseRecordsForRotation({ week, district, cafe, rotation });
  return (
    <div className="mt-4 rounded-3xl border border-emerald-200 bg-emerald-50/70 p-4 text-sm text-emerald-900">
      <p className="font-bold">Smartsheet database alignment</p>
      <p className="mt-1">Save Draft and Submit Rotation now generate database-ready records using the master column labels. Current record preview: <span className="font-bold">{records.length}</span> row{records.length === 1 ? "" : "s"} for this café/week.</p>
    </div>
  );
}


function SmartsheetDatabaseStatusPanel({ loadStatus, syncStatus, onRefreshDatabase }) {
  const toneForState = (state) => {
    if (state === "synced") return "border-emerald-200 bg-emerald-50 text-emerald-900";
    if (state === "syncing" || state === "loading") return "border-sky-200 bg-sky-50 text-sky-900";
    if (state === "fallback") return "border-amber-200 bg-amber-50 text-amber-900";
    return "border-slate-200 bg-slate-50 text-slate-700";
  };

  return (
    <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
        <div>
          <p className="font-bold text-slate-900">Smartsheet live database</p>
          <p className="mt-1 text-slate-500">The planner writes to Smartsheet and reloads saved database rows for Executive View.</p>
        </div>
        <button type="button" onClick={onRefreshDatabase} className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
          Refresh from Smartsheet
        </button>
      </div>
      <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className={`rounded-2xl border p-3 ${toneForState(loadStatus?.state)}`}>
          <p className="text-xs uppercase tracking-[0.16em] font-bold opacity-70">Read Status</p>
          <p className="mt-1 font-semibold">{loadStatus?.message || "Not loaded yet."}</p>
          {loadStatus?.loadedAt && <p className="mt-1 text-xs opacity-70">Last read: {loadStatus.loadedAt}</p>}
        </div>
        <div className={`rounded-2xl border p-3 ${toneForState(syncStatus?.state)}`}>
          <p className="text-xs uppercase tracking-[0.16em] font-bold opacity-70">Write Status</p>
          <p className="mt-1 font-semibold">{syncStatus?.message || "No write attempted yet."}</p>
          {syncStatus?.missingColumns?.length > 0 && (
            <div className="mt-3 rounded-xl border border-amber-300 bg-white/60 p-3 text-xs">
              <p className="font-bold">Missing Smartsheet columns to add or rename exactly:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {syncStatus.missingColumns.map((column) => (
                  <li key={column} className="font-mono">{column}</li>
                ))}
              </ul>
            </div>
          )}
          {syncStatus?.syncedAt && <p className="mt-1 text-xs opacity-70">Last write: {syncStatus.syncedAt}</p>}
        </div>
      </div>
    </div>
  );
}

function RotationPlannerCard({ cafe, district, menuOptions, rotation, updateRotation, week, printRows, persistRotationToDatabase, databaseLoadStatus, databaseSyncStatus, onRefreshDatabase }) {
  const [preview, setPreview] = useState(null);
  const [copiedRotation, setCopiedRotation] = useState(null);

  const stationOptions = Array.from(new Set(MENUWORKS_ITEMS.filter((row) => getMenuName(row) === rotation.menu).map((row) => getStationName(row) || "—"))).sort();
  const menuItems = MENUWORKS_ITEMS.filter((row) => getMenuName(row) === rotation.menu && (!rotation.station || getStationName(row) === rotation.station));
  const categorized = categorize(menuItems);
  const items = selectedItems(rotation);
  const summary = foodSummary(items);
  const cafeStations = CAFE_STATION_CONFIG[cafe] || ["global"];
  const stationCostOverview = getStationCostOverview(rotation, cafe);
  const requirements = rotationRequirements(rotation, cafe);
  const canSubmitRotation = requirements.canSubmit;

  const updateSlot = (group, index, value) => {
    const next = [...(rotation[group] || EMPTY_ROTATION[group])];
    next[index] = value;
    updateRotation({ [group]: next });
  };

  const updateGrill = (field, value) => updateRotation({ grill: { ...(rotation.grill || EMPTY_ROTATION.grill), [field]: value } });
  const updateLto = (stationKey, index, value) => {
    const current = rotation.ltos?.[stationKey] || EMPTY_ROTATION.ltos[stationKey] || [];
    const next = [...current];
    next[index] = value;
    updateRotation({ ltos: { ...(rotation.ltos || EMPTY_ROTATION.ltos), [stationKey]: next } });
  };
  const updateCarvery = (field, value) => updateRotation({ carvery: { ...(rotation.carvery || EMPTY_ROTATION.carvery), [field]: value } });
  const markDraft = () => {
    const nextRotation = { ...rotation, status: "Draft", updatedAt: nowStamp(), submittedBy: "Chef" };
    updateRotation(nextRotation);
    persistRotationToDatabase?.(nextRotation);
  };
  const submitRotation = () => {
    if (!canSubmitRotation) return;
    const stamp = nowStamp();
    const nextRotation = { ...rotation, status: "Submitted", updatedAt: stamp, submittedAt: stamp, submittedBy: "Chef" };
    updateRotation(nextRotation);
    persistRotationToDatabase?.(nextRotation);
  };
  const copyCurrentRotation = () => {
    const copy = { ...rotation, status: "Draft", updatedAt: "", submittedAt: "", submittedBy: "" };
    setCopiedRotation(copy);
  };
  const loadCopiedRotation = () => {
    if (!copiedRotation) return;
    const nextRotation = { ...copiedRotation, status: "Draft", updatedAt: nowStamp(), submittedAt: "", submittedBy: "Chef" };
    updateRotation(nextRotation);
    persistRotationToDatabase?.(nextRotation);
  };
  const applyPreview = () => {
    if (!preview) return;
    const nextRotation = { ...rotation, ...preview.global, uploadedLtos: preview.uploadedLtos, updatedAt: nowStamp(), submittedBy: "Chef" };
    updateRotation(nextRotation);
    persistRotationToDatabase?.(nextRotation);
    setPreview(null);
  };

  return (
    <div className="rounded-[2rem] bg-white border border-slate-200 p-6 shadow-2xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Chef Planner</p>
          <h2 className="text-3xl font-bold mt-1">{cafe}</h2>
          {cafe === "Nitro" && <p className="text-sm text-slate-500 mt-1">Frontier follows Nitro for tracking.</p>}
        </div>
        <Building2 className="text-slate-300" size={32} />
      </div>

      <StationPills cafe={cafe} stations={cafeStations} />
      <SubmitBar rotation={rotation} cafe={cafe} requirements={requirements} canSubmit={canSubmitRotation} onSaveDraft={markDraft} onSubmit={submitRotation} />
      <div className="mt-4 rounded-3xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
        <p className="font-bold">Loaded app version</p>
        <p className="mt-1"><span className="font-bold">{APP_VERSION_STAMP}</span> · This build includes Smartsheet read/write sync, Read Status, Write Status, and Refresh from Smartsheet.</p>
      </div>
      <DatabaseAlignmentNotice district={district} cafe={cafe} week={week} rotation={rotation} />
      <SmartsheetDatabaseStatusPanel loadStatus={databaseLoadStatus} syncStatus={databaseSyncStatus} onRefreshDatabase={onRefreshDatabase} />
      <PlannerControlsPanel cafe={cafe} copiedRotation={copiedRotation} onCopy={copyCurrentRotation} onLoad={loadCopiedRotation} preview={preview} setPreview={setPreview} applyPreview={applyPreview} week={week} printRows={printRows} />
      <StationCostOverview rows={stationCostOverview} />

      {cafeStations.map((stationKey) => (
        <CafeStationSection
          key={stationKey}
          stationKey={stationKey}
          cafe={cafe}
          rotation={rotation}
          menuOptions={menuOptions}
          stationOptions={stationOptions}
          categorized={categorized}
          updateRotation={updateRotation}
          updateSlot={updateSlot}
          updateGrill={updateGrill}
          updateLto={updateLto}
          updateCarvery={updateCarvery}
          summary={summary}
          selectedItems={items}
        />
      ))}
    </div>
  );
}

function StationCostOverview({ rows }) {
  const [isOpen, setIsOpen] = useState(false);
  if (!rows.length) return null;

  const stationsWithSelections = rows.filter((row) => row.selectedCount > 0).length;

  return (
    <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <button type="button" onClick={() => setIsOpen((value) => !value)} className="w-full flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 text-left">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Food Cost Overview</p>
          <h3 className="text-2xl font-bold mt-1">By Station</h3>
          <p className="text-sm text-slate-500 mt-1">Quick station read. Expand when you need the detail.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-xs font-bold text-slate-600">{stationsWithSelections}/{rows.length} active</span>
          <span className="rounded-full bg-slate-900 text-white px-3 py-1 text-xs font-bold inline-flex items-center gap-1">
            {isOpen ? "Collapse" : "Expand"} {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </span>
        </div>
      </button>
      {isOpen && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {rows.map((row) => {
            const tone = row.summary.fc == null
              ? "border-slate-200 bg-slate-50"
              : row.summary.fc > 0.34
                ? "border-amber-200 bg-amber-50"
                : "border-emerald-200 bg-emerald-50";
            return (
              <div key={row.key} className={`rounded-2xl border p-4 ${tone}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-900">{row.label}</p>
                    <p className="text-xs text-slate-500 mt-1">{row.note}</p>
                  </div>
                  <span className="rounded-full bg-white/80 border border-slate-200 px-3 py-1 text-xs font-bold text-slate-700">{pct(row.summary.fc)}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-white/80 border border-slate-200 px-3 py-1 font-semibold text-slate-600">{row.selectedCount} selected</span>
                  <span className="rounded-full bg-white/80 border border-slate-200 px-3 py-1 font-semibold text-slate-600">{moneyRange(selectedTrueCostRange(row.items))} cost range</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


function PlannerControlsPanel({ cafe, copiedRotation, onCopy, onLoad, preview, setPreview, applyPreview, week, printRows }) {
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const copiedSummary = copiedRotation?.menu
    ? `${copiedRotation.menu}${copiedRotation.station ? ` • ${copiedRotation.station}` : ""}`
    : "No copied rotation saved";

  const handleUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPreview(weekAtGlancePreview(file.name));
    event.target.value = "";
  };

  return (
    <div className="mt-4 rounded-3xl border border-sky-200 bg-sky-50/80 p-5 shadow-sm print:hidden">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-sky-700 font-bold">Planner Controls</p>
          <h3 className="text-2xl font-bold mt-1">Copy, Upload, and Print</h3>
          <p className="text-sm text-slate-600 mt-1">Use these controls to reuse rotations, import Week at a Glance, or print a clean weekly packet.</p>
          <p className="text-xs text-slate-500 mt-2">Saved copy: {copiedSummary}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={onCopy} className="rounded-2xl bg-white border border-sky-200 px-5 py-3 text-sm font-semibold text-sky-800 hover:bg-sky-100">Copy Current Rotation</button>
          <button onClick={onLoad} disabled={!copiedRotation} className={`rounded-2xl border px-5 py-3 text-sm font-semibold ${copiedRotation ? "bg-white border-sky-200 text-sky-800 hover:bg-sky-100" : "bg-slate-200 border-slate-200 text-slate-400 cursor-not-allowed"}`}>Load Copied Rotation</button>
          <label className="inline-flex items-center gap-2 rounded-2xl bg-white border border-sky-200 px-5 py-3 text-sm font-semibold text-sky-800 hover:bg-sky-100 cursor-pointer">
            <Upload size={16} /> Upload Week at a Glance
            <input type="file" accept="application/pdf,.pdf" onChange={handleUpload} className="hidden" />
          </label>
          <button onClick={() => setShowPrintPreview((value) => !value)} className="rounded-2xl bg-slate-900 text-white px-5 py-3 text-sm font-semibold hover:bg-slate-700">{showPrintPreview ? "Hide Print Preview" : "Print Weekly Packet"}</button>
        </div>
      </div>

      {showPrintPreview && <WeeklyPrintPreview week={week} cafe={cafe} rows={printRows || []} />}

      {preview && (
        <div className="mt-5 rounded-3xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-amber-700 font-bold">Review before applying</p>
              <h4 className="text-xl font-bold text-amber-950 mt-1">{preview.reportType}</h4>
              <p className="text-sm text-amber-900 mt-1">Detected: {preview.detectedCafe} • {preview.detectedStation} • {preview.detectedDateRange}</p>
              <p className="text-xs text-amber-800 mt-2">This applies only to the café and week currently open: <span className="font-semibold">{cafe}</span>.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setPreview(null)} className="rounded-2xl bg-white border border-amber-200 px-4 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100">Cancel</button>
              <button onClick={applyPreview} className="rounded-2xl bg-amber-900 text-white px-4 py-2 text-sm font-semibold hover:bg-amber-800">Apply to Open Café/Week</button>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <PreviewBox title="Global Entrees" items={preview.global.entrees} />
            <PreviewBox title="Global Sides" items={preview.global.sides} />
            <PreviewBox title="Station LTOs" items={[...preview.uploadedLtos.pizza, ...preview.uploadedLtos.salad, ...preview.uploadedLtos.deli, ...preview.uploadedLtos.fishMarket]} />
            <PreviewBox title="Station Mapping" items={preview.stationAliases.map((row) => `${row.source} → ${STATION_LABELS[row.mappedTo] || row.mappedTo}`)} />
          </div>
        </div>
      )}
    </div>
  );
}

function openPrintWindow() {
  const printContent = document.getElementById("weekly-cafe-print-packet")?.innerHTML;
  if (!printContent) return;
  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) return;
  printWindow.document.write(`
    <html>
      <head>
        <title>Weekly Rotation Packet</title>
        <style>
          body { font-family: Arial, sans-serif; color: #0f172a; margin: 24px; }
          h1, h2, h3, h4, p { margin-top: 0; }
          .rounded-2xl, .rounded-xl, .rounded-3xl { border-radius: 12px; }
          .border { border: 1px solid #e2e8f0; }
          .bg-white, .bg-slate-50 { background: #fff; }
          .p-3 { padding: 12px; }
          .p-4 { padding: 16px; }
          .p-5 { padding: 20px; }
          .mt-1 { margin-top: 4px; }
          .mt-2 { margin-top: 8px; }
          .mt-3 { margin-top: 12px; }
          .mt-4 { margin-top: 16px; }
          .mb-4 { margin-bottom: 16px; }
          .space-y-2 > * + * { margin-top: 8px; }
          .text-sm { font-size: 13px; }
          .text-xs { font-size: 11px; }
          .font-bold, .font-semibold { font-weight: 700; }
          .text-slate-500, .text-slate-600 { color: #64748b; }
          ul { padding-left: 18px; }
          @media print { button { display: none; } body { margin: 16px; } }
        </style>
      </head>
      <body>${printContent}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => printWindow.print(), 250);
}

function WeeklyPrintPreview({ week, cafe, rows }) {
  const row = rows.find((entry) => entry.cafe === cafe) || { cafe, ...EMPTY_ROTATION };
  const districtName = row.district || Object.entries(DISTRICTS).find(([, cafes]) => cafes.includes(cafe))?.[0] || "—";
  return (
    <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Print Preview</p>
          <h3 className="text-3xl font-bold mt-1">Weekly Rotation Packet</h3>
          <p className="text-sm text-slate-500 mt-1">Week: <span className="font-semibold text-slate-900">{week}</span> • Café: <span className="font-semibold text-slate-900">{cafe}</span></p>
        </div>
        <button onClick={openPrintWindow} className="rounded-2xl bg-slate-900 text-white px-5 py-3 text-sm font-semibold hover:bg-slate-700">Open Print Window</button>
      </div>

      <div id="weekly-cafe-print-packet" className="mt-5">
        <div className="border border-slate-200 rounded-2xl p-5 mb-4 bg-white">
          <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Neighborhood Rotations</p>
          <h1 className="text-3xl font-bold mt-1">Weekly Rotation Packet</h1>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><p className="text-xs uppercase tracking-[0.14em] text-slate-400 font-bold">Café</p><p className="font-bold text-slate-900 mt-1">{cafe}</p></div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><p className="text-xs uppercase tracking-[0.14em] text-slate-400 font-bold">District</p><p className="font-bold text-slate-900 mt-1">{districtName}</p></div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><p className="text-xs uppercase tracking-[0.14em] text-slate-400 font-bold">Fiscal Week</p><p className="font-bold text-slate-900 mt-1">{week}</p></div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><p className="text-xs uppercase tracking-[0.14em] text-slate-400 font-bold">Status</p><p className="font-bold text-slate-900 mt-1">{row.status || "Draft"}</p></div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><p className="text-xs uppercase tracking-[0.14em] text-slate-400 font-bold">Updated</p><p className="font-bold text-slate-900 mt-1">{row.updatedAt || "—"}</p></div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><p className="text-xs uppercase tracking-[0.14em] text-slate-400 font-bold">Submitted</p><p className="font-bold text-slate-900 mt-1">{row.submittedAt || "—"}</p></div>
          </div>
        </div>
        <ExportCafeCard row={row} />
      </div>
    </div>
  );
}

function ExportCafeCard({ row }) {
  const items = selectedItems(row);
  const trueCostRange = selectedTrueCostRange(items);
  const foodCostRange = selectedFoodCostRange(items);
  const cafeStations = CAFE_STATION_CONFIG[row.cafe] || [];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 break-inside-avoid">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold">{row.cafe}</h3>
          <p className="text-sm text-slate-500">{row.status || "Draft"}{row.submittedAt ? ` • Submitted ${row.submittedAt}` : ""}</p>
        </div>
        <div className="text-right text-sm">
          <p className="font-bold text-slate-900">{pctRange(foodCostRange)}</p>
          <p className="text-slate-500">{moneyRange(trueCostRange)}</p>
        </div>
      </div>

      <div className="mt-3 rounded-xl bg-slate-50 border border-slate-200 p-3">
        <p className="text-xs uppercase tracking-[0.14em] text-slate-400 font-bold">Global</p>
        <p className="font-semibold text-slate-900 mt-1">{row.menu || "No Global Menu selected"}</p>
        {row.station && <p className="text-sm text-slate-500">{row.station}</p>}
        <ExportLine label="Entrées" values={row.entrees} />
        <ExportLine label="Sides" values={row.sides} />
        <ExportLine label="Sub Recipes" values={row.subRecipes} />
        <ExportLine label="Extensions" values={row.extensions} />
      </div>

      <div className="mt-3 space-y-2">
        {cafeStations.filter((stationKey) => stationKey !== "global").map((stationKey) => (
          <ExportStationBlock key={stationKey} stationKey={stationKey} cafe={row.cafe} row={row} />
        ))}
      </div>
    </div>
  );
}

function ExportStationBlock({ stationKey, cafe, row }) {
  if (stationKey === "grill") return <ExportLineCard title={stationLabel(cafe, stationKey)} values={[row.grill?.regionalSpecial, row.grill?.locationSpotlight]} />;
  if (stationKey === "carvery") return <ExportLineCard title={stationLabel(cafe, stationKey)} values={Object.values(row.carvery || {})} />;
  if (stationKey === "wok") return <ExportLineCard title={stationLabel(cafe, stationKey)} values={[...(row.ltos?.wokEntrees || []), ...(row.ltos?.wokSides || []), ...(row.ltos?.wokBase || []), ...(row.ltos?.wokSubRecipes || [])]} />;
  return <ExportLineCard title={stationLabel(cafe, stationKey)} values={row.ltos?.[stationKey] || []} />;
}

function ExportLineCard({ title, values }) {
  const clean = (values || []).filter(Boolean);
  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <p className="text-xs uppercase tracking-[0.14em] text-slate-400 font-bold">{title}</p>
      {clean.length ? <ul className="mt-1 text-sm text-slate-700 space-y-1">{clean.map((value, index) => <li key={`${value}-${index}`}>• {titleCase(value)}</li>)}</ul> : <p className="mt-1 text-sm text-slate-400">No selection</p>}
    </div>
  );
}

function ExportLine({ label, values }) {
  const clean = (values || []).filter(Boolean);
  if (!clean.length) return null;
  return <p className="text-sm text-slate-600 mt-1"><span className="font-semibold text-slate-900">{label}:</span> {clean.map(titleCase).join(", ")}</p>;
}

function CopyWeekPanel({ copiedRotation, onCopy, onLoad }) {
  const copiedSummary = copiedRotation?.menu ? `${copiedRotation.menu}${copiedRotation.station ? ` • ${copiedRotation.station}` : ""}` : "No copied rotation saved";
  return (
    <div className="mt-4 rounded-3xl border border-sky-200 bg-sky-50/80 p-5 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-sky-700 font-bold">Copy Week</p>
          <h3 className="text-2xl font-bold mt-1">Reuse a Saved Rotation</h3>
          <p className="text-sm text-slate-600 mt-1">Copy this café’s current rotation, switch to another week, then load it into that open week.</p>
          <p className="text-xs text-slate-500 mt-2">Saved copy: {copiedSummary}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={onCopy} className="rounded-2xl bg-white border border-sky-200 px-5 py-3 text-sm font-semibold text-sky-800 hover:bg-sky-100">Copy Current Rotation</button>
          <button onClick={onLoad} disabled={!copiedRotation} className={`rounded-2xl px-5 py-3 text-sm font-semibold ${copiedRotation ? "bg-slate-900 text-white hover:bg-slate-700" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}>Load Copied Rotation</button>
        </div>
      </div>
    </div>
  );
}

function WeekAtGlanceUpload({ cafe, preview, setPreview, applyPreview }) {
  const handleUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPreview(weekAtGlancePreview(file.name));
    event.target.value = "";
  };

  return (
    <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-slate-400">PDF Import</p>
          <h3 className="text-2xl font-bold mt-1">Upload Week at a Glance</h3>
          <p className="text-sm text-slate-500 mt-1">Upload the MenuWorks Week at a Glance report. It applies only to the café and week currently open: <span className="font-semibold text-slate-900">{cafe}</span>.</p>
        </div>
        <label className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 text-white px-5 py-3 font-semibold hover:bg-slate-700 cursor-pointer text-sm">
          <Upload size={16} /> Upload PDF
          <input type="file" accept="application/pdf,.pdf" onChange={handleUpload} className="hidden" />
        </label>
      </div>
      {preview && (
        <div className="mt-5 rounded-3xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-amber-700 font-bold">Review before applying</p>
              <h4 className="text-xl font-bold text-amber-950 mt-1">{preview.reportType}</h4>
              <p className="text-sm text-amber-900 mt-1">Detected: {preview.detectedCafe} • {preview.detectedStation} • {preview.detectedDateRange}</p>
              <p className="text-xs text-amber-800 mt-2">Preview only. Production should parse the PDF through a Vercel API route and match items to the database.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setPreview(null)} className="rounded-2xl bg-white border border-amber-200 px-4 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100">Cancel</button>
              <button onClick={applyPreview} className="rounded-2xl bg-amber-900 text-white px-4 py-2 text-sm font-semibold hover:bg-amber-800">Apply to Open Café/Week</button>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <PreviewBox title="Global Entrees" items={preview.global.entrees} />
            <PreviewBox title="Global Sides" items={preview.global.sides} />
            <PreviewBox title="Station LTOs" items={[...preview.uploadedLtos.pizza, ...preview.uploadedLtos.salad, ...preview.uploadedLtos.deli, ...preview.uploadedLtos.fishMarket]} />
            <PreviewBox title="Station Mapping" items={preview.stationAliases.map((row) => `${row.source} → ${STATION_LABELS[row.mappedTo] || row.mappedTo}`)} />
          </div>
        </div>
      )}
    </div>
  );
}

function PreviewBox({ title, items }) {
  return <div className="rounded-2xl bg-white border border-amber-200 p-4"><p className="font-bold text-amber-950">{title}</p><ul className="mt-2 space-y-1 text-amber-900">{items.map((item) => <li key={item}>• {titleCase(item)}</li>)}</ul></div>;
}

function StationPills({ cafe, stations }) {
  return <div className="mt-5 flex flex-wrap gap-2">{stations.map((station) => <span key={station} className="rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">{stationLabel(cafe, station)}</span>)}</div>;
}

function CafeStationSection(props) {
  const { stationKey, cafe, rotation, menuOptions, stationOptions, categorized, updateRotation, updateSlot, updateGrill, updateLto, updateCarvery, summary, selectedItems } = props;
  if (stationKey === "global") return <GlobalSection cafe={cafe} rotation={rotation} menuOptions={menuOptions} stationOptions={stationOptions} categorized={categorized} updateRotation={updateRotation} updateSlot={updateSlot} summary={summary} selectedItems={selectedItems} />;
  if (stationKey === "grill") return <GrillSection cafe={cafe} rotation={rotation} updateGrill={updateGrill} />;
  if (stationKey === "salad") return <SimpleLTOSection stationKey="salad" title="Salad LTOs" slots={Array.from({ length: stationSlots(cafe, "salad") }, (_, i) => `Salad LTO ${i + 1}`)} values={rotation.ltos?.salad || EMPTY_ROTATION.ltos.salad} uploaded={rotation.uploadedLtos?.salad || []} updateLto={updateLto} complete={stationComplete(rotation, "salad")} />;
  if (stationKey === "pizza") return <SimpleLTOSection stationKey="pizza" title="Pizza / Flatbread LTOs" slots={Array.from({ length: stationSlots(cafe, "pizza") }, (_, i) => `Pizza/Flatbread LTO ${i + 1}`)} values={rotation.ltos?.pizza || EMPTY_ROTATION.ltos.pizza} uploaded={rotation.uploadedLtos?.pizza || []} updateLto={updateLto} complete={stationComplete(rotation, "pizza")} />;
  if (stationKey === "deli") return <SimpleLTOSection stationKey="deli" title="Deli LTOs" slots={Array.from({ length: stationSlots(cafe, "deli") }, (_, i) => `Deli LTO ${i + 1}`)} values={rotation.ltos?.deli || EMPTY_ROTATION.ltos.deli} uploaded={rotation.uploadedLtos?.deli || []} updateLto={updateLto} complete={stationComplete(rotation, "deli")} />;
  if (stationKey === "fishMarket") return <SimpleLTOSection stationKey="fishMarket" title="Fish Market LTO" slots={Array.from({ length: stationSlots(cafe, "fishMarket") }, (_, i) => `Fish Market LTO ${i + 1}`)} values={rotation.ltos?.fishMarket || EMPTY_ROTATION.ltos.fishMarket} uploaded={rotation.uploadedLtos?.fishMarket || []} updateLto={updateLto} complete={stationComplete(rotation, "fishMarket")} />;
  if (stationKey === "freshFive") return <SimpleLTOSection stationKey="freshFive" title="Fresh $5" slots={Array.from({ length: stationSlots(cafe, "freshFive") }, (_, i) => `Fresh $5 Option ${i + 1}`)} values={rotation.ltos?.freshFive || EMPTY_ROTATION.ltos.freshFive} uploaded={rotation.uploadedLtos?.freshFive || []} updateLto={updateLto} complete={stationComplete(rotation, "freshFive")} />;
  if (stationKey === "soup") return <SimpleLTOSection stationKey="soup" title="Soup LTOs" slots={Array.from({ length: stationSlots(cafe, "soup") }, (_, i) => `Soup ${i + 1}`)} values={rotation.ltos?.soup || EMPTY_ROTATION.ltos.soup} uploaded={rotation.uploadedLtos?.soup || []} updateLto={updateLto} complete={stationComplete(rotation, "soup")} />;
  if (stationKey === "wok") return <WokSection rotation={rotation} updateLto={updateLto} />;
  if (stationKey === "carvery") return <CarverySection rotation={rotation} updateCarvery={updateCarvery} />;
  return null;
}

function GlobalSection({ cafe, rotation, menuOptions, stationOptions, categorized, updateRotation, updateSlot, summary, selectedItems }) {
  const globalTitle = cafe === "Doppler" ? "Wok Xahn" : "Global Station";
  return (
    <CollapsibleStation title={globalTitle} eyebrow="Station Rotation" complete={stationComplete(rotation, "global")} defaultOpen={!stationComplete(rotation, "global")}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-500 mb-2">Global Menu</label>
          <select value={rotation.menu} onChange={(e) => updateRotation(e.target.value ? blankRotation(e.target.value) : EMPTY_ROTATION)} className="w-full rounded-2xl border-2 border-sky-200 bg-white px-4 py-3 font-semibold outline-none shadow-sm focus:border-sky-500 focus:ring-4 focus:ring-sky-100">
            <option value="">Select menu...</option>
            {menuOptions.map((menu) => <option key={menu} value={menu}>{menu}</option>)}
          </select>
        </div>
        {rotation.menu && stationOptions.length > 1 && (
          <div>
            <label className="block text-sm font-semibold text-slate-500 mb-2">Station / Sub-Concept</label>
            <select value={rotation.station || ""} onChange={(e) => updateRotation(blankRotation(rotation.menu, e.target.value))} className="w-full rounded-2xl border-2 border-sky-200 bg-white px-4 py-3 font-semibold outline-none shadow-sm focus:border-sky-500 focus:ring-4 focus:ring-sky-100">
              <option value="">All stations</option>
              {stationOptions.map((station) => <option key={station} value={station}>{station}</option>)}
            </select>
          </div>
        )}
      </div>
      {rotation.menu && <LiveAnalytics summary={summary} selectedItems={selectedItems} />}
      <div className="mt-5 grid grid-cols-1 xl:grid-cols-4 gap-5">
        <PickerGroup title="Entrees" limit="up to 3" items={categorized.entrees} values={rotation.entrees || ["", "", ""]} onChange={(index, value) => updateSlot("entrees", index, value)} />
        <PickerGroup title="Sides" limit="up to 4" items={categorized.sides} values={rotation.sides || ["", "", "", ""]} onChange={(index, value) => updateSlot("sides", index, value)} />
        <PickerGroup title="Sub Recipes" limit="up to 4" items={categorized.subRecipes} values={rotation.subRecipes || ["", "", "", ""]} onChange={(index, value) => updateSlot("subRecipes", index, value)} />
        <PickerGroup title="Extensions" limit="up to 2" items={categorized.extensions} values={rotation.extensions || ["", ""]} onChange={(index, value) => updateSlot("extensions", index, value)} />
      </div>
      <StationSelectedList title="Selected Global Items Rollup" items={globalSelectedRows(rotation)} />
    </CollapsibleStation>
  );
}

function CollapsibleStation({ title, eyebrow, complete, children }) {
  return (
    <div className="mt-6 rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-slate-400">{eyebrow}</p>
          <h3 className="text-2xl font-bold mt-1">{title}</h3>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold border ${complete ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-sky-50 border-sky-200 text-sky-700"}`}>{complete ? "complete" : "needs selection"}</span>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function StationSelectedList({ title = "Selected Items Rollup", items }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
      <button type="button" onClick={() => setIsOpen((value) => !value)} className="w-full flex items-center justify-between gap-3 text-left">
        <div>
          <p className="text-sm font-bold text-slate-900">{title}</p>
          <p className="text-xs text-slate-500 mt-1">{items.length} selected • descriptions, diet tags, and allergens</p>
        </div>
        <span className="rounded-full bg-slate-900 text-white px-3 py-1 text-xs font-bold inline-flex items-center gap-1">
          {isOpen ? "Hide" : "View"} {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>
      {isOpen && (
        <div className="mt-4 space-y-2">
          {!items.length && <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">No items selected yet.</div>}
          {items.map((row, index) => {
            const diet = getDiet(row);
            const allergens = String(getAllergens(row) || "").split(",").map((value) => value.trim()).filter(Boolean);
            const description = row.enticingDescription || row.description || row["Enticing Description"] || "No description available.";
            return (
              <div key={`${getItemIdentity(row)}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="font-bold text-slate-900">{getDisplayName(row)}</p>
                  <div className="flex flex-wrap justify-end gap-2">
                    {diet && <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-800">{diet}</span>}
                    {allergens.length ? allergens.map((allergen) => (
                      <span key={allergen} className="rounded-full bg-rose-50 border border-rose-200 px-3 py-1 text-xs font-bold text-rose-800">{titleCase(allergen)}</span>
                    )) : <span className="rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-xs font-bold text-slate-500">No Allergens Listed</span>}
                  </div>
                </div>
                <p className="text-sm text-slate-600 mt-1">{description}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function LiveAnalytics({ selectedItems }) {
  const trueCostRange = selectedTrueCostRange(selectedItems);
  const foodCostRange = selectedFoodCostRange(selectedItems);
  const immediateSelectedCost = selectedItems.filter((row) => getTrueCost(row) != null).reduce((sum, row) => sum + Number(getTrueCost(row) || 0), 0);
  const foodCostDisplayValue = foodCostRange.low == null && immediateSelectedCost > 0 ? `Cost ${money(immediateSelectedCost)}` : pctRange(foodCostRange);
  const foodCostDisplayNote = foodCostRange.low == null && immediateSelectedCost > 0 ? "cost accepted; add priced entrée to calculate %" : foodCostRangeNote(foodCostRange);

  return (
    <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-5">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Live Selection Analytics</p>
        <h3 className="text-2xl font-bold mt-1">Current Rotation Mix</h3>
        <p className="text-sm text-slate-500 mt-1">A quick planning read that updates as selections are made.</p>
      </div>
      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
        <Mini title="Selected True Cost Range" value={moneyRange(trueCostRange)} sub={trueCostRangeNote(trueCostRange)} emphasize />
        <Mini title="Selected Mix Food Cost %" value={foodCostDisplayValue} sub={foodCostDisplayNote} emphasize />
      </div>
    </div>
  );
}

function Mini({ title, value, sub, tone = "neutral", emphasize = false }) {
  const cls = tone === "amber" ? "border-amber-200 bg-amber-50 text-amber-900" : tone === "green" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : emphasize ? "border-sky-200 bg-sky-50 text-slate-900" : "border-slate-200 bg-white text-slate-900";
  return <div className={`rounded-2xl border p-4 ${cls}`}><p className="text-xs font-semibold opacity-75">{title}</p><p className={`${emphasize ? "text-4xl" : "text-2xl"} font-bold mt-1`}>{value}</p><p className="text-xs opacity-70 mt-1">{sub}</p></div>;
}

function PickerGroup({ title, limit, items, values, onChange }) {
  return (
    <div className="rounded-3xl border-2 border-sky-200 bg-sky-50/80 p-4 shadow-sm ring-1 ring-sky-100">
      <div className="flex items-center justify-between gap-2"><p className="font-bold text-slate-900">{title}</p><span className="rounded-full bg-white border border-sky-200 px-3 py-1 text-xs font-bold text-sky-700">choose here</span></div>
      <p className="text-xs text-sky-700 mt-1 font-semibold">{limit}</p>
      <div className="mt-3 space-y-2">
        {values.map((value, index) => (
          <select key={index} value={value} onChange={(e) => onChange(index, e.target.value)} className="w-full rounded-2xl border-2 border-sky-200 bg-white px-3 py-2 text-sm font-semibold outline-none shadow-sm focus:border-sky-500 focus:ring-4 focus:ring-sky-100">
            <option value="">Select {title.toLowerCase()}...</option>
            {items.map((row) => <option key={`${getItemIdentity(row)}-${index}`} value={getItemIdentity(row)}>{getDisplayName(row)}</option>)}
          </select>
        ))}
      </div>
    </div>
  );
}

function GrillSection({ cafe, rotation, updateGrill }) {
  const grillItems = categorize(MENUWORKS_ITEMS.filter((row) => getMenuName(row) === "AMZ: Grill Core" || getStationName(row).toLowerCase().includes("grill"))).entrees;
  const grillTitle = cafe === "Day 1" ? "Adelaide's" : "Core Grill Additions";
  const options = grillItems.length ? grillItems : stationPool("carveryProtein");
  return (
    <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Grill Station</p>
      <h3 className="text-2xl font-bold mt-1">{grillTitle}</h3>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <GrillSelect label="Regional Special" value={rotation.grill?.regionalSpecial || ""} onChange={(value) => updateGrill("regionalSpecial", value)} items={options} />
        <GrillSelect label="Location Spotlight" value={rotation.grill?.locationSpotlight || ""} onChange={(value) => updateGrill("locationSpotlight", value)} items={options} />
      </div>
      <StationSelectedList title="Selected Grill Items Rollup" items={grillSelectedRows(rotation)} />
    </div>
  );
}

function GrillSelect({ label, value, onChange, items }) {
  return <div className="rounded-3xl border-2 border-sky-200 bg-sky-50/80 p-4 shadow-sm"><div className="flex items-center justify-between gap-2 mb-2"><label className="block text-sm font-bold text-slate-900">{label}</label><span className="rounded-full bg-white border border-sky-200 px-3 py-1 text-xs font-bold text-sky-700">choose here</span></div><select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-2xl border-2 border-sky-200 bg-white px-4 py-3 font-semibold outline-none shadow-sm focus:border-sky-500 focus:ring-4 focus:ring-sky-100"><option value="">Select {label.toLowerCase()}...</option>{items.map((row) => <option key={`${label}-${getItemIdentity(row)}`} value={getItemIdentity(row)}>{getDisplayName(row)}</option>)}</select></div>;
}

function SimpleLTOSection({ stationKey, title, slots, values = [], uploaded = [], updateLto, complete }) {
  const pool = stationPool(stationKey);
  return (
    <CollapsibleStation title={title} eyebrow="Station Special" complete={complete}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {slots.map((slot, index) => (
          <div key={slot} className="rounded-3xl border-2 border-sky-200 bg-sky-50/80 p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2 mb-2"><label className="block text-sm font-bold text-slate-900">{slot}</label><span className="rounded-full bg-white border border-sky-200 px-3 py-1 text-xs font-bold text-sky-700">choose here</span></div>
            <select value={values[index] || uploaded[index] || ""} onChange={(e) => updateLto(stationKey, index, e.target.value)} className="w-full rounded-2xl border-2 border-sky-200 bg-white px-4 py-3 font-semibold outline-none shadow-sm focus:border-sky-500 focus:ring-4 focus:ring-sky-100">
              <option value="">Select {slot.toLowerCase()}...</option>
              {uploaded[index] && <option value={uploaded[index]}>{titleCase(uploaded[index])}</option>}
              {pool.map((row) => <option key={`${stationKey}-${slot}-${getItemIdentity(row)}`} value={getItemIdentity(row)}>{getDisplayName(row)}</option>)}
            </select>
          </div>
        ))}
      </div>
      <StationSelectedList title={`Selected ${title} Rollup`} items={ltoSelectedRows({ ltos: { [stationKey]: values }, uploadedLtos: { [stationKey]: uploaded } }, stationKey)} />
    </CollapsibleStation>
  );
}

function WokSection({ rotation, updateLto }) {
  return (
    <CollapsibleStation title="Wok Station" eyebrow="Station Rotation" complete={stationComplete(rotation, "wok")}>
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
        <PickerGroup title="Wok Entrees" limit="up to 3" items={stationPool("wokEntrees")} values={rotation.ltos?.wokEntrees || EMPTY_ROTATION.ltos.wokEntrees} onChange={(index, value) => updateLto("wokEntrees", index, value)} />
        <PickerGroup title="Wok Sides" limit="up to 2" items={stationPool("wokSides")} values={rotation.ltos?.wokSides || EMPTY_ROTATION.ltos.wokSides} onChange={(index, value) => updateLto("wokSides", index, value)} />
        <PickerGroup title="Wok Base" limit="1 base" items={stationPool("wokBase")} values={rotation.ltos?.wokBase || EMPTY_ROTATION.ltos.wokBase} onChange={(index, value) => updateLto("wokBase", index, value)} />
        <PickerGroup title="Wok Sub Recipes" limit="up to 2" items={stationPool("wokSubRecipes")} values={rotation.ltos?.wokSubRecipes || EMPTY_ROTATION.ltos.wokSubRecipes} onChange={(index, value) => updateLto("wokSubRecipes", index, value)} />
      </div>
      <StationSelectedList title="Selected Wok Items Rollup" items={wokSelectedRows(rotation)} />
    </CollapsibleStation>
  );
}

function CarverySection({ rotation, updateCarvery }) {
  const fields = [
    ["protein1", "Rotating Protein 1", stationPool("carveryProtein")],
    ["protein2", "Rotating Protein 2", stationPool("carveryProtein")],
    ["vegetable1", "Rotating Vegetable 1", stationPool("carveryVegetable")],
    ["vegetable2", "Rotating Vegetable 2", stationPool("carveryVegetable")],
    ["vegetable3", "Rotating Vegetable 3", stationPool("carveryVegetable")],
    ["starch", "Starch", potatoSides().length ? potatoSides() : stationPool("carverySide")],
    ["hotSide1", "Hot Side 1", carveryHotSides()],
    ["coldSide1", "Cold Side 1", carveryColdSides()],
    ["coldSide2", "Cold Side 2", carveryColdSides()]
  ];
  return (
    <CollapsibleStation title="Carvery Rotations" eyebrow="Carvery Station" complete={stationComplete(rotation, "carvery")}>
      <p className="text-sm text-slate-500 mb-4">Hot and cold side dropdowns are filtered by item naming cues from the database. Ambiguous sides remain available where review may be needed.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {fields.map(([field, label, options]) => (
          <div key={field} className="rounded-3xl border-2 border-sky-200 bg-sky-50/80 p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2 mb-2"><label className="block text-sm font-bold text-slate-900">{label}</label><span className="rounded-full bg-white border border-sky-200 px-3 py-1 text-xs font-bold text-sky-700">choose here</span></div>
            <select value={rotation.carvery?.[field] || ""} onChange={(e) => updateCarvery(field, e.target.value)} className="w-full rounded-2xl border-2 border-sky-200 bg-white px-4 py-3 font-semibold outline-none shadow-sm focus:border-sky-500 focus:ring-4 focus:ring-sky-100">
              <option value="">Select {label.toLowerCase()}...</option>
              {options.map((row) => <option key={`${field}-${getItemIdentity(row)}`} value={getItemIdentity(row)}>{getDisplayName(row)}</option>)}
            </select>
          </div>
        ))}
      </div>
      <StationSelectedList title="Selected Carvery Items Rollup" items={carverySelectedRows(rotation)} />
    </CollapsibleStation>
  );
}

function SubmitBar({ rotation, cafe, requirements, canSubmit, onSaveDraft, onSubmit }) {
  return (
    <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Submission</p>
        <h3 className="text-2xl font-bold mt-1">{rotation.status || "Draft"}</h3>
        <p className="text-sm text-slate-500 mt-1">{rotation.updatedAt ? `Updated ${rotation.updatedAt} by ${rotation.submittedBy || "Chef"}` : "Not saved yet"}</p>
        {rotation.submittedAt && <p className="text-sm text-slate-500 mt-1">Submitted {rotation.submittedAt}</p>}
        {!canSubmit && <p className="text-sm text-amber-700 mt-2">Submit requires a Global Menu, at least two Global entrées, and at least one selection for each assigned station.</p>}
        {!requirements.globalReady && <p className="text-xs text-amber-700 mt-1">Missing: Global Menu or two Global entrées.</p>}
        {requirements.incompleteStations.length > 0 && <p className="text-xs text-amber-700 mt-1">Missing station selection: {requirements.incompleteStations.map((stationKey) => stationLabel(cafe, stationKey)).join(", ")}.</p>}
      </div>
      <div className="flex flex-wrap gap-2">
        <button onClick={onSaveDraft} className="rounded-2xl bg-white border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Save Draft</button>
        <button onClick={onSubmit} disabled={!canSubmit} className={`rounded-2xl px-5 py-3 text-sm font-semibold ${canSubmit ? "bg-slate-900 text-white hover:bg-slate-700" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}>Submit Rotation</button>
      </div>
    </div>
  );
}

function LeadershipOverview({ district, week, rows, conflictMenus }) {
  return (
    <div className="rounded-[2rem] bg-white border border-slate-200 p-6 shadow-2xl">
      <div className="flex items-start gap-3"><CalendarDays className="text-slate-400" /><div><p className="text-sm uppercase tracking-[0.2em] text-slate-400">Leadership Overview</p><h2 className="text-2xl font-bold mt-1">{district} • {week}</h2></div></div>
      <div className="mt-5 space-y-3">{rows.map((row) => <SummaryCard key={row.cafe} row={row} conflict={row.menu && conflictMenus[row.menu] > 1} />)}</div>
    </div>
  );
}

function ExecutiveView({ week, setWeek, rows, conflictMenus }) {
  const declared = rows.filter((row) => row.menu).length;
  const conflicts = rows.filter((row) => row.menu && conflictMenus[`${row.district}|${row.menu}`] > 1).length;
  const globalRows = rows.filter((row) => row.menu);
  const globalSummaries = globalRows.map((row) => ({ ...row, summary: foodSummary(selectedItems(row)) }));
  const pricedGlobalSummaries = globalSummaries.filter((row) => row.summary.fc != null);
  const averageGlobalFc = pricedGlobalSummaries.length
    ? pricedGlobalSummaries.reduce((sum, row) => {
      const range = selectedFoodCostRange(selectedItems(row));
      const midpoint = range.low != null && range.high != null ? (range.low + range.high) / 2 : row.summary.fc;
      return sum + midpoint;
    }, 0) / pricedGlobalSummaries.length
    : null;

  const districtNames = Object.keys(DISTRICTS);
  const read = leadershipRead(rows, conflictMenus);

  return (
    <div className="space-y-5">
      <section className="rounded-[2rem] bg-white border border-slate-200 p-6 shadow-2xl">
        <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Leadership Read</p>
        <h2 className="text-3xl font-bold mt-1">This Week at a Glance</h2>
        <p className="text-slate-600 mt-3 text-lg leading-relaxed">{read}</p>
      </section>
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <ControlCard label="Leadership Week View" value={week} setValue={setWeek} options={ROTATION_WEEKS} />
        <ExecutiveMetric title="Declared" value={`${declared}/${rows.length}`} sub="cafés submitted" />
        <ExecutiveMetric title="Duplicate Menus" value={conflicts} sub="within district" tone={conflicts ? "amber" : "green"} />
        <ExecutiveMetric title="Projected Global FC%" value={pct(averageGlobalFc)} sub="based on selected rotation mix" tone={averageGlobalFc != null && averageGlobalFc > 0.34 ? "amber" : "green"} />
      </section>

      <section className="rounded-[2rem] bg-white border border-slate-200 p-6 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Executive Rotation View</p>
            <h2 className="text-3xl font-bold mt-1">Weekly Rotation Health</h2>
            <p className="text-sm text-slate-500 mt-1">One card per café showing rotation status, food cost signal, duplicate flags, and station completion gaps.</p>
          </div>
        </div>
        <div className="mt-5 space-y-6">
          {districtNames.map((districtName) => {
            const districtRows = rows.filter((row) => row.district === districtName);
            return (
              <div key={districtName}>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-xl font-bold">{districtName}</h3>
                  <div className="flex flex-wrap gap-2">
                    <p className="rounded-full bg-slate-100 border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">{districtRows.filter((row) => row.menu).length}/{districtRows.length} declared</p>
                    <p className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-800">≤30% favorable</p>
                    <p className="rounded-full bg-slate-100 border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">30–34% monitor</p>
                    <p className="rounded-full bg-amber-100 border border-amber-200 px-3 py-2 text-xs font-semibold text-amber-800">&gt;34% watch</p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {districtRows.map((row) => (
                    <SummaryCard key={`${row.district}-${row.cafe}`} row={row} conflict={row.menu && conflictMenus[`${row.district}|${row.menu}`] > 1} showDistrict={false} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function ExecutiveMetric({ title, value, sub, tone = "neutral" }) {
  const toneClass = tone === "amber" ? "border-amber-200 bg-amber-50 text-amber-900" : tone === "green" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-slate-200 bg-white text-slate-900";
  return (
    <div className={`rounded-3xl border p-5 shadow-xl ${toneClass}`}>
      <p className="text-sm font-semibold opacity-75">{title}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
      <p className="text-xs opacity-70 mt-2">{sub}</p>
    </div>
  );
}

function SummaryCard({ row, conflict, showDistrict = true }) {
  const rowItems = selectedItems(row);
  const summary = foodSummary(rowItems);
  const fcRange = selectedFoodCostRange(rowItems);
  const fcMidpoint = fcRange.low != null && fcRange.high != null ? (fcRange.low + fcRange.high) / 2 : summary.fc;
  const stationKeys = CAFE_STATION_CONFIG[row.cafe] || [];
  const completedStations = stationKeys.filter((stationKey) => stationComplete(row, stationKey)).length;
  const tone = !row.menu ? "border-slate-200 bg-slate-50" : fcMidpoint == null ? "border-slate-300 bg-slate-100" : fcMidpoint > 0.34 ? "border-amber-200 bg-amber-50" : fcMidpoint <= 0.30 ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white";

  return (
    <div className={`rounded-2xl border p-4 ${tone}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          {showDistrict && row.district && <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{row.district}</p>}
          <p className="font-bold text-slate-900">{row.cafe}</p>
          {row.copiedFrom ? <p className="text-xs text-slate-500 mt-1">Copied from {row.copiedFrom}</p> : row.cafe === "Nitro" ? <p className="text-xs text-slate-500 mt-1">Frontier follows Nitro</p> : null}
          <p className="text-sm text-slate-600 mt-1">{row.menu || "No menu declared"}</p>
          {row.status && <p className="text-xs text-slate-500 mt-1">{row.status}{row.updatedAt ? ` • Updated ${row.updatedAt}` : ""}</p>}
          {row.submittedBy && <p className="text-xs text-slate-500 mt-1">By {row.submittedBy}</p>}
          {row.station && <p className="text-xs text-slate-500 mt-1">{row.station}</p>}
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="rounded-full bg-white/80 border border-slate-200 px-3 py-1 text-xs font-bold text-slate-700">{pctRange(fcRange)}</span>
          {conflict ? <AlertTriangle className="text-amber-600" size={18} /> : row.menu ? <CheckCircle2 className="text-emerald-600" size={18} /> : null}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
        {row.menu && <span className="rounded-full bg-white/80 border border-slate-200 px-3 py-1 text-slate-600">{(row.entrees || []).filter(Boolean).length} entrees</span>}
        {row.menu && <span className="rounded-full bg-white/80 border border-slate-200 px-3 py-1 text-slate-600">{(row.sides || []).filter(Boolean).length} sides</span>}
        {row.menu && <span className="rounded-full bg-white/80 border border-slate-200 px-3 py-1 text-slate-600">{(row.subRecipes || []).filter(Boolean).length} sub recipes</span>}
        {stationKeys.length > 0 && <span className="rounded-full bg-white/80 border border-slate-200 px-3 py-1 text-slate-600">{completedStations}/{stationKeys.length} stations</span>}
        {conflict && <span className="rounded-full bg-amber-100 border border-amber-200 px-3 py-1 text-amber-800">duplicate</span>}
      </div>
    </div>
  );
}

function SummaryBucket({ title, value, details, empty, tone = "neutral" }) {
  const toneClass = tone === "amber" ? "border-amber-200 bg-amber-50 text-amber-900" : tone === "green" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-slate-200 bg-slate-50 text-slate-900";
  return (
    <div className={`rounded-2xl border p-4 ${toneClass}`}>
      <div className="flex items-start justify-between gap-3"><p className="text-sm font-bold">{title}</p><span className="rounded-full bg-white/80 border border-slate-200 px-3 py-1 text-xs font-bold">{value}</span></div>
      <div className="mt-3 flex flex-wrap gap-2">{details.length ? details.map((detail) => <span key={detail} className="rounded-full bg-white/80 border border-slate-200 px-3 py-1 text-xs font-semibold">{detail}</span>) : <span className="text-xs opacity-70">{empty}</span>}</div>
    </div>
  );
}

function ResultsView({ rows, resultsDistrict, setResultsDistrict, resultsCafe, setResultsCafe }) {
  const allCafeOptions = Array.from(new Set(Object.values(DISTRICTS).flat())).sort();
  const submittedRows = rows.filter((row) => row.status === "Submitted");
  const draftRows = rows.filter((row) => row.status !== "Submitted");
  const pricedRows = rows.map((row) => ({ ...row, summary: foodSummary(selectedItems(row)) })).filter((row) => row.summary.fc != null);
  const averageFc = pricedRows.length ? pricedRows.reduce((sum, row) => sum + row.summary.fc, 0) / pricedRows.length : null;
  const trueCostRows = rows.map((row) => ({ ...row, trueCostRange: selectedTrueCostRange(selectedItems(row)) })).filter((row) => row.trueCostRange.low != null);
  const mostUsedMenus = Object.entries(rows.reduce((acc, row) => { if (row.menu) acc[row.menu] = (acc[row.menu] || 0) + 1; return acc; }, {})).sort((a, b) => b[1] - a[1]).slice(0, 3);

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <ControlCard label="District Filter" value={resultsDistrict} setValue={setResultsDistrict} options={["All", ...Object.keys(DISTRICTS)]} />
        <ControlCard label="Café Filter" value={resultsCafe} setValue={setResultsCafe} options={["All", ...allCafeOptions]} />
        <ExecutiveMetric title="Saved Entries" value={rows.length} sub="declared rotations" />
        <ExecutiveMetric title="Submitted" value={submittedRows.length} sub={`${draftRows.length} drafts`} tone={draftRows.length ? "amber" : "green"} />
        <ExecutiveMetric title="Projected FC%" value={pct(averageFc)} sub="based on saved rotation mix" tone={averageFc != null && averageFc > 0.34 ? "amber" : "green"} />
      </section>
      <section className="rounded-[2rem] bg-white border border-slate-200 p-6 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Results Summary</p>
            <h2 className="text-3xl font-bold mt-1">Rotation History Health</h2>
            <p className="text-sm text-slate-500 mt-1">A quick read of saved declarations across the selected filter.</p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
          <SummaryBucket title="True Cost Range Records" value={trueCostRows.length || "—"} details={trueCostRows.map((row) => `${row.cafe} • ${row.week}: ${moneyRange(row.trueCostRange)}`).slice(0, 5)} empty="no true cost history yet" />
          <SummaryBucket title="Most Used Menus" value={mostUsedMenus.length || "—"} details={mostUsedMenus.map(([menu, count]) => `${menu} (${count})`)} empty="no menu history yet" />
        </div>
      </section>
      <section className="overflow-hidden rounded-[2rem] bg-white border border-slate-200 shadow-2xl">
        <div className="p-5 border-b border-slate-200 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Rolling 6 Month Results</p>
            <h2 className="text-3xl font-bold mt-1">Rotation History</h2>
            <p className="text-sm text-slate-500 mt-1">Shows the most recent 26 rotation weeks with global declarations, submission status, food cost signal, and timestamps.</p>
          </div>
        </div>
        <div className="overflow-auto max-h-[680px]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-100 text-slate-500 border-b border-slate-200">
              <tr className="text-left">
                <th className="px-4 py-3">Week</th>
                <th className="px-4 py-3">District</th>
                <th className="px-4 py-3">Café</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Global Menu</th>
                <th className="px-4 py-3">Food Cost %</th>
                <th className="px-4 py-3">True Cost Range</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rows.length === 0 ? (
                <tr><td colSpan="9" className="px-4 py-8 text-center text-slate-500">No saved declarations match this filter yet.</td></tr>
              ) : rows.map((row, index) => {
                const rowItems = selectedItems(row);
                const summary = foodSummary(rowItems);
                const trueCostRange = selectedTrueCostRange(rowItems);
                const foodCostRange = selectedFoodCostRange(rowItems);
                const fcMidpoint = foodCostRange.low != null && foodCostRange.high != null ? (foodCostRange.low + foodCostRange.high) / 2 : summary.fc;
                const fcTone = fcMidpoint == null ? "bg-slate-100 text-slate-600 border-slate-200" : fcMidpoint > 0.34 ? "bg-amber-100 text-amber-800 border-amber-200" : fcMidpoint <= 0.30 ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-white text-slate-700 border-slate-200";
                return (
                  <tr key={`${row.week}-${row.district}-${row.cafe}-${index}`} className="hover:bg-slate-50 align-top">
                    <td className="px-4 py-3 font-semibold whitespace-nowrap">{row.week}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{row.district}</td>
                    <td className="px-4 py-3 whitespace-nowrap font-semibold">{row.cafe}</td>
                    <td className="px-4 py-3 whitespace-nowrap"><span className={`rounded-full px-3 py-1 text-xs font-bold border ${row.status === "Submitted" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-slate-100 border-slate-200 text-slate-600"}`}>{row.status || "Draft"}</span></td>
                    <td className="px-4 py-3 min-w-[190px] font-semibold">{row.menu}</td>
                    <td className="px-4 py-3 whitespace-nowrap"><span className={`rounded-full border px-3 py-1 text-xs font-bold ${fcTone}`}>{pctRange(foodCostRange)}</span></td>
                    <td className="px-4 py-3 whitespace-nowrap font-semibold text-slate-700">{moneyRange(trueCostRange)}</td>
                    <td className="px-4 py-3 min-w-[150px] text-slate-500">{row.updatedAt || "—"}{row.submittedBy ? <p className="text-xs">by {row.submittedBy}</p> : null}</td>
                    <td className="px-4 py-3 min-w-[150px] text-slate-500">{row.submittedAt || "—"}{row.submittedBy && row.submittedAt ? <p className="text-xs">by {row.submittedBy}</p> : null}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function LadleComplianceDashboard({ onBackToPlatform }) {
  const seededRows = [
    { district: "South", unit: "Doppler", week: "Current Week", compliance: 96, completed: 144, expected: 150, missed: 6, trend: 4 },
    { district: "South", unit: "Day 1", week: "Current Week", compliance: 91, completed: 137, expected: 150, missed: 13, trend: 2 },
    { district: "South", unit: "Nitro", week: "Current Week", compliance: 84, completed: 126, expected: 150, missed: 24, trend: -3 },
    { district: "South", unit: "Re:Invent", week: "Current Week", compliance: 78, completed: 117, expected: 150, missed: 33, trend: -6 },
    { district: "North", unit: "Cricket", week: "Current Week", compliance: 93, completed: 140, expected: 150, missed: 10, trend: 1 },
    { district: "North", unit: "Moby", week: "Current Week", compliance: 88, completed: 132, expected: 150, missed: 18, trend: -1 },
    { district: "North", unit: "Dawson", week: "Current Week", compliance: 90, completed: 135, expected: 150, missed: 15, trend: 3 },
    { district: "North", unit: "Nessie", week: "Current Week", compliance: 82, completed: 123, expected: 150, missed: 27, trend: -4 },
    { district: "East", unit: "East Café 1", week: "Current Week", compliance: 89, completed: 134, expected: 150, missed: 16, trend: 2 },
    { district: "LAX", unit: "LAX22", week: "Current Week", compliance: 87, completed: 131, expected: 150, missed: 19, trend: -2 },
  ];

  const [rows, setRows] = useState(seededRows);
  const [district, setDistrict] = useState("South");
  const [week, setWeek] = useState("Current Week");
  const [unit, setUnit] = useState("All Units");
  const [viewMode, setViewMode] = useState("executive");
  const [uploadedFileName, setUploadedFileName] = useState("");

  const districtOptions = useMemo(() => ["All", ...Array.from(new Set(rows.map((row) => row.district).filter(Boolean))).sort()], [rows]);
  const weekOptions = useMemo(() => ["Current Week", "Previous Week", "Rolling 4 Weeks", ...Array.from(new Set(rows.map((row) => row.week).filter(Boolean))).filter((wk) => !["Current Week", "Previous Week", "Rolling 4 Weeks"].includes(wk)).sort()], [rows]);
  const unitOptions = useMemo(() => ["All Units", ...Array.from(new Set(rows.filter((row) => district === "All" || row.district === district).map((row) => row.unit).filter(Boolean))).sort()], [rows, district]);

  useEffect(() => {
    if (!unitOptions.includes(unit)) setUnit("All Units");
  }, [unitOptions, unit]);

  const filtered = useMemo(() => rows.filter((row) => {
    const districtMatch = district === "All" || row.district === district;
    const unitMatch = unit === "All Units" || row.unit === unit;
    const weekMatch = week === "Rolling 4 Weeks" || week === "Current Week" || row.week === week;
    return districtMatch && unitMatch && weekMatch;
  }), [rows, district, unit, week]);

  const summary = useMemo(() => {
    const totalExpected = filtered.reduce((sum, row) => sum + Number(row.expected || 0), 0);
    const totalCompleted = filtered.reduce((sum, row) => sum + Number(row.completed || 0), 0);
    const totalMissed = filtered.reduce((sum, row) => sum + Number(row.missed || 0), 0);
    const averageCompliance = totalExpected ? Math.round((totalCompleted / totalExpected) * 100) : filtered.length ? Math.round(filtered.reduce((sum, row) => sum + Number(row.compliance || 0), 0) / filtered.length) : 0;
    const compliantUnits = filtered.filter((row) => Number(row.compliance || 0) >= 90).length;
    const watchUnits = filtered.filter((row) => Number(row.compliance || 0) >= 85 && Number(row.compliance || 0) < 90).length;
    const atRiskUnits = filtered.filter((row) => Number(row.compliance || 0) < 85).length;
    const focusUnit = [...filtered].sort((a, b) => Number(a.compliance || 0) - Number(b.compliance || 0))[0];
    return { totalExpected, totalCompleted, totalMissed, averageCompliance, compliantUnits, watchUnits, atRiskUnits, focusUnit };
  }, [filtered]);

  const parseUploadedLadleFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: null });

    const parsedRows = rawRows.map((row, index) => {
      const unitName = row.Unit || row.Cafe || row.Café || row.Location || row["Unit Name"] || row["Cafe Name"] || row["Café Name"] || `Unit ${index + 1}`;
      const expected = Number(row.Expected || row["Expected Checks"] || row.Total || row["Total Checks"] || 0);
      const completed = Number(row.Completed || row["Completed Checks"] || row.Complete || 0);
      const missedRaw = row.Missed || row["Missed Checks"] || row.Incomplete || null;
      const complianceRaw = row.Compliance || row["Compliance %"] || row.Score || row["Score %"] || null;
      const compliance = complianceRaw != null
        ? Number(String(complianceRaw).replace("%", "")) > 1
          ? Number(String(complianceRaw).replace("%", ""))
          : Number(String(complianceRaw).replace("%", "")) * 100
        : expected
          ? (completed / expected) * 100
          : 0;
      const missed = missedRaw != null ? Number(missedRaw) : Math.max(0, expected - completed);

      return {
        district: row.District || district || "South",
        unit: unitName,
        week: row.Week || row.Period || row.Date || "Uploaded Week",
        compliance: Math.round(compliance),
        completed,
        expected,
        missed,
        trend: Number(row.Trend || row["Trend %"] || 0)
      };
    }).filter((row) => row.unit);

    if (parsedRows.length) {
      setRows(parsedRows);
      setUploadedFileName(file.name);
      setDistrict("All");
      setWeek("Uploaded Week");
      setUnit("All Units");
    }

    event.target.value = "";
  };

  const complianceTone = (value) => {
    if (Number(value) >= 90) return "bg-emerald-50 border-emerald-200 text-emerald-900";
    if (Number(value) >= 85) return "bg-amber-50 border-amber-200 text-amber-900";
    return "bg-rose-50 border-rose-200 text-rose-900";
  };

  const complianceLabel = (value) => {
    if (Number(value) >= 90) return "Strong";
    if (Number(value) >= 85) return "Watch";
    return "Follow Up";
  };

  const barTone = (value) => {
    if (Number(value) >= 90) return "bg-emerald-500";
    if (Number(value) >= 85) return "bg-amber-500";
    return "bg-rose-500";
  };

  const sortedRows = [...filtered].sort((a, b) => Number(a.compliance || 0) - Number(b.compliance || 0));
  const trendBars = [82, 85, 88, 91, summary.averageCompliance];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="rounded-[2rem] bg-white border border-slate-200 p-6 md:p-8 shadow-2xl">
          <button
            onClick={onBackToPlatform}
            className="rounded-2xl bg-slate-100 border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
          >
            ← Back to Culinary Tools Platform
          </button>

          <div className="mt-6 flex flex-col xl:flex-row xl:items-end xl:justify-between gap-6">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-sky-700 font-bold">Test Concept / Can Delete</p>
              <h1 className="text-4xl md:text-5xl font-bold mt-2">Ladle Compliance Dashboard</h1>
              <p className="mt-3 text-slate-600 max-w-3xl">
                Review Ladle compliance by district, café, and week. This prototype is isolated from Menu Engineering and Neighborhood Rotations.
              </p>
            </div>

            <div className="rounded-3xl bg-sky-50 border border-sky-200 p-4 min-w-[320px]">
              <label className="block text-sm font-semibold text-sky-900 mb-2">Upload Ladle spreadsheet</label>
              <input type="file" accept=".xlsx,.xls,.csv" onChange={parseUploadedLadleFile} className="block w-full text-sm text-sky-900 file:mr-3 file:rounded-xl file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-white hover:file:bg-slate-700" />
              <p className="text-xs text-sky-800 mt-2">{uploadedFileName ? `Loaded ${uploadedFileName}` : "Uses sample data until a spreadsheet is uploaded."}</p>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <LadleControl label="District" value={district} setValue={setDistrict} options={districtOptions} />
          <LadleControl label="Week / Period" value={week} setValue={setWeek} options={weekOptions} />
          <LadleControl label="Unit" value={unit} setValue={setUnit} options={unitOptions} />
          <LadleControl label="View" value={viewMode} setValue={setViewMode} options={["executive", "team"]} />
        </section>

        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <LadleMetric title="Overall Compliance" value={`${summary.averageCompliance}%`} sub="completed checks / expected checks" tone={summary.averageCompliance >= 90 ? "green" : summary.averageCompliance >= 85 ? "amber" : "red"} />
          <LadleMetric title="Compliant Units" value={`${summary.compliantUnits}/${filtered.length}`} sub="90% or higher" tone="green" />
          <LadleMetric title="At Risk Units" value={summary.atRiskUnits} sub="below 85%" tone={summary.atRiskUnits ? "red" : "green"} />
          <LadleMetric title="Missed Checks" value={summary.totalMissed} sub="selected scope" tone={summary.totalMissed > 20 ? "amber" : "neutral"} />
        </section>

        {viewMode === "executive" ? (
          <>
            <section className="rounded-[2rem] bg-white border border-slate-200 p-6 shadow-2xl">
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Executive Heat Map</p>
                  <h2 className="text-3xl font-bold mt-1">Compliance by Unit</h2>
                  <p className="text-sm text-slate-500 mt-1">Green = strong, amber = watch, red = needs follow-up.</p>
                </div>
                <div className="rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-600">
                  Focus Unit: <span className="font-bold text-slate-900">{summary.focusUnit?.unit || "—"}</span>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {sortedRows.map((row) => (
                  <div key={`${row.district}-${row.unit}`} className={`rounded-3xl border p-5 ${complianceTone(row.compliance)}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] opacity-70">{row.district}</p>
                        <h3 className="text-2xl font-bold mt-1">{row.unit}</h3>
                      </div>
                      <span className="rounded-full bg-white/80 border border-white px-3 py-1 text-xs font-bold">{complianceLabel(row.compliance)}</span>
                    </div>
                    <p className="text-5xl font-bold mt-5">{row.compliance}%</p>
                    <p className="text-sm mt-2 opacity-80">{row.missed} missed checks • {row.trend >= 0 ? "+" : ""}{row.trend}% vs prior</p>
                    <div className="mt-4 h-3 rounded-full bg-white/70 overflow-hidden">
                      <div className={`h-full rounded-full ${barTone(row.compliance)}`} style={{ width: `${Math.max(0, Math.min(100, row.compliance))}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="rounded-[2rem] bg-white border border-slate-200 p-6 shadow-2xl">
                <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Trend Concept</p>
                <h2 className="text-3xl font-bold mt-1">Rolling Compliance</h2>
                <p className="text-sm text-slate-500 mt-1">Mock trend until weekly historical data is connected.</p>
                <div className="mt-6 flex items-end gap-3 h-44">
                  {trendBars.map((value, index) => (
                    <div key={index} className="flex-1">
                      <div className={`rounded-t-2xl ${barTone(value)}`} style={{ height: `${Math.max(24, value * 1.45)}px` }} />
                      <p className="text-xs text-center mt-2 text-slate-500">W{index + 1}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] bg-white border border-slate-200 p-6 shadow-2xl">
                <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Leadership Read</p>
                <h2 className="text-3xl font-bold mt-1">Follow-Up Callouts</h2>
                <div className="mt-5 space-y-3">
                  {sortedRows.filter((row) => row.compliance < 90).slice(0, 5).map((row) => (
                    <div key={row.unit} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-bold">{row.unit}</p>
                        <span className={`rounded-full border px-3 py-1 text-xs font-bold ${complianceTone(row.compliance)}`}>{row.compliance}%</span>
                      </div>
                      <p className="text-sm text-slate-600 mt-1">Review missed checks, closeout habits, and manager follow-up rhythm.</p>
                    </div>
                  ))}
                  {!sortedRows.some((row) => row.compliance < 90) && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
                      <p className="font-bold">No major follow-up flags</p>
                      <p className="text-sm mt-1">All selected units are at or above 90% compliance.</p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </>
        ) : (
          <section className="rounded-[2rem] bg-white border border-slate-200 p-6 shadow-2xl">
            <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Team View</p>
            <h2 className="text-3xl font-bold mt-1">Unit Detail</h2>
            <div className="mt-5 overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 text-slate-500">
                  <tr className="text-left">
                    <th className="px-4 py-3">District</th>
                    <th className="px-4 py-3">Unit</th>
                    <th className="px-4 py-3">Compliance</th>
                    <th className="px-4 py-3">Completed</th>
                    <th className="px-4 py-3">Expected</th>
                    <th className="px-4 py-3">Missed</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {sortedRows.map((row) => (
                    <tr key={`${row.district}-${row.unit}`} className="hover:bg-slate-50">
                      <td className="px-4 py-3">{row.district}</td>
                      <td className="px-4 py-3 font-semibold">{row.unit}</td>
                      <td className="px-4 py-3"><span className={`rounded-full border px-3 py-1 text-xs font-bold ${complianceTone(row.compliance)}`}>{row.compliance}%</span></td>
                      <td className="px-4 py-3">{row.completed}</td>
                      <td className="px-4 py-3">{row.expected}</td>
                      <td className="px-4 py-3">{row.missed}</td>
                      <td className="px-4 py-3 text-slate-600">{row.compliance >= 90 ? "Maintain rhythm." : row.compliance >= 85 ? "Review weak dayparts." : "Manager follow-up needed."}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function LadleControl({ label, value, setValue, options }) {
  return (
    <div className="rounded-3xl bg-white border border-slate-200 p-5 shadow-xl">
      <label className="block text-sm font-semibold text-slate-500 mb-2">{label}</label>
      <select value={value} onChange={(e) => setValue(e.target.value)} className="w-full rounded-2xl border-2 border-sky-200 bg-white px-4 py-3 font-semibold outline-none shadow-sm focus:border-sky-500 focus:ring-4 focus:ring-sky-100">
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </div>
  );
}

function LadleMetric({ title, value, sub, tone = "neutral" }) {
  const toneClass = tone === "green" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : tone === "amber" ? "border-amber-200 bg-amber-50 text-amber-900" : tone === "red" ? "border-rose-200 bg-rose-50 text-rose-900" : "border-slate-200 bg-white text-slate-900";
  return (
    <div className={`rounded-3xl border p-5 shadow-xl ${toneClass}`}>
      <p className="text-sm font-semibold opacity-75">{title}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
      <p className="text-xs opacity-70 mt-2">{sub}</p>
    </div>
  );
}

