import React, { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { Search, Star, TrendingUp, HelpCircle, Dog, SlidersHorizontal, ChefHat, DollarSign } from "lucide-react";

const MENUWORKS_ITEMS = [{"id":0,"menu":"AMZ: Andes","meal":"Lunch","station":"Andes","item":"aji amarillo dipping sauce","mrn":"122252","portion":"1 floz","price":null,"itemCost":0.3647,"wastePct":0.04,"trueCost":0.3793,"forecast":100.0},{"id":1,"menu":"AMZ: Andes","meal":"Lunch","station":"Andes","item":"aji de gallina","mrn":"122251","portion":"8 ounce","price":11.75,"itemCost":2.4737,"wastePct":0.04,"trueCost":2.5727,"forecast":100.0},{"id":2,"menu":"AMZ: Andes","meal":"Lunch","station":"Andes","item":"arroz chaufa","mrn":"122256","portion":"1 cup","price":2.55,"itemCost":0.7172,"wastePct":0.04,"trueCost":0.7459,"forecast":100.0},{"id":3,"menu":"AMZ: Andes","meal":"Lunch","station":"Andes","item":"lomo saltado","mrn":"122258","portion":"8 ounce","price":12.55,"itemCost":1.7149,"wastePct":0.04,"trueCost":1.7835,"forecast":100.0},{"id":4,"menu":"AMZ: Andes","meal":"Lunch","station":"Andes","item":"papa a la huancaina","mrn":"122260","portion":"8 ounce","price":2.55,"itemCost":0.876,"wastePct":0.04,"trueCost":0.9111,"forecast":100.0},{"id":5,"menu":"AMZ: Andes","meal":"Lunch","station":"Andes","item":"papa seca","mrn":"122259","portion":"1 cup","price":2.55,"itemCost":0.3818,"wastePct":0.04,"trueCost":0.3971,"forecast":100.0},{"id":6,"menu":"AMZ: Andes","meal":"Lunch","station":"Andes","item":"peruvian black beans","mrn":"122255","portion":"1 cup","price":2.55,"itemCost":0.4874,"wastePct":0.04,"trueCost":0.5069,"forecast":100.0},{"id":7,"menu":"AMZ: Andes","meal":"Lunch","station":"Andes","item":"peruvian chicken","mrn":"122254","portion":"4 ounce","price":11.75,"itemCost":1.6393,"wastePct":0.04,"trueCost":1.7049,"forecast":100.0},{"id":8,"menu":"AMZ: Andes","meal":"Lunch","station":"Andes","item":"peruvian green rice","mrn":"122257","portion":"1 cup","price":2.55,"itemCost":0.4938,"wastePct":0.04,"trueCost":0.5135,"forecast":100.0},{"id":9,"menu":"AMZ: Andes","meal":"Lunch","station":"Andes","item":"quinoa avocado salad","mrn":"122261","portion":"8 ounce","price":2.55,"itemCost":3.0244,"wastePct":0.04,"trueCost":3.1454,"forecast":100.0},{"id":10,"menu":"AMZ: Andes","meal":"Lunch","station":"Andes","item":"quinoa fried rice","mrn":"122264","portion":"1 cup","price":2.55,"itemCost":1.1057,"wastePct":0.04,"trueCost":1.1499,"forecast":100.0},{"id":11,"menu":"AMZ: Andes","meal":"Lunch","station":"Andes","item":"roasted corn salad","mrn":"122262","portion":"8 ounce","price":2.55,"itemCost":0.928,"wastePct":0.04,"trueCost":0.9651,"forecast":100.0},{"id":12,"menu":"AMZ: Andes","meal":"Lunch","station":"Andes","item":"sauteed spinach with garlic","mrn":"122263","portion":"1 cup","price":2.55,"itemCost":2.1967,"wastePct":0.04,"trueCost":2.2846,"forecast":100.0},{"id":13,"menu":"AMZ: Andes","meal":"Lunch","station":"Andes","item":"seafood chupe","mrn":"122265","portion":"8 ounce","price":13.45,"itemCost":4.6313,"wastePct":0.04,"trueCost":4.8166,"forecast":100.0},{"id":14,"menu":"AMZ: Andes","meal":"Lunch","station":"Andes","item":"sopa de mani","mrn":"122253","portion":"8 ounce","price":2.55,"itemCost":0.8603,"wastePct":0.04,"trueCost":0.8947,"forecast":100.0},{"id":15,"menu":"AMZ: Andes","meal":"Lunch","station":"Andes","item":"tallarin saltado","mrn":"122266","portion":"8 ounce","price":11.75,"itemCost":2.1336,"wastePct":0.04,"trueCost":2.219,"forecast":100.0},{"id":16,"menu":"AMZ: Andes","meal":"Lunch","station":"Andes","item":"vegetarian causa","mrn":"122267","portion":"8 ounce","price":2.55,"itemCost":0.7741,"wastePct":0.04,"trueCost":0.8051,"forecast":100.0},{"id":17,"menu":"AMZ: Andes","meal":"Lunch","station":"Andes","item":"vegetarian tacu tacu","mrn":"122268","portion":"8 ounce","price":2.55,"itemCost":0.5903,"wastePct":0.04,"trueCost":0.6139,"forecast":100.0},{"id":18,"menu":"AMZ: Andes","meal":"Lunch","station":"Andes","item":"yucca fries","mrn":"122269","portion":"4 ounce","price":2.55,"itemCost":0.5414,"wastePct":0.04,"trueCost":0.5631,"forecast":100.0}];

const money = (value) => value == null || Number.isNaN(Number(value)) ? "—" : Number(value).toLocaleString(undefined, { style: "currency", currency: "USD" });
const pct = (value) => value == null || Number.isNaN(Number(value)) ? "—" : String((Number(value) * 100).toFixed(1)) + "%";
const priceLabel = (value) => value == null || Number.isNaN(Number(value)) ? "Complimentary" : money(value);
const titleCase = (value) => String(value || "").split(" ").map(word => word ? word.charAt(0).toUpperCase() + word.slice(1) : word).join(" ");



function classify(marginHigh, volumeHigh) {
  if (marginHigh && volumeHigh) return "STAR";
  if (!marginHigh && volumeHigh) return "CASH COW";
  if (marginHigh && !volumeHigh) return "PUZZLE";
  return "DOG";
}

const classConfig = {
  STAR: { icon: Star, label: "Star", note: "High margin / high volume", action: "Protect and promote.", badge: "bg-emerald-100 text-emerald-900 border-emerald-200" },
  "CASH COW": { icon: TrendingUp, label: "Cash Cow", note: "Low margin / high volume", action: "Review price, portion, or cost.", badge: "bg-sky-100 text-sky-900 border-sky-200" },
  PUZZLE: { icon: HelpCircle, label: "Puzzle", note: "High margin / low volume", action: "Improve placement or merchandising.", badge: "bg-amber-100 text-amber-900 border-amber-200" },
  DOG: { icon: Dog, label: "Dog", note: "Low margin / low volume", action: "Consider rework or removal.", badge: "bg-rose-100 text-rose-900 border-rose-200" },
  COMPLIMENTARY: { icon: ChefHat, label: "Complimentary", note: "No sell price", action: "Included item, sauce, or garnish.", badge: "bg-slate-100 text-slate-700 border-slate-200" }
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

  const fcTarget = targetFoodCost == null ? null : Number(targetFoodCost) / 100;
  const marginTarget = targetMarginPct == null ? null : Number(targetMarginPct) / 100;

  const foodCostScore = fcTarget == null || avgFoodCost == null
    ? 75
    : clampScore(100 - Math.max(0, (avgFoodCost - fcTarget) * 250) + Math.max(0, (fcTarget - avgFoodCost) * 75));

  const marginScore = marginTarget == null || grossProfitPct == null
    ? 75
    : clampScore(100 - Math.max(0, (marginTarget - grossProfitPct) * 220) + Math.max(0, (grossProfitPct - marginTarget) * 45));

  const engineeringMixScore = clampScore(60 + (starPct * 35) + (puzzlePct * 14) + (cashCowPct * 4) - (dogPct * 42));
  const riskBalanceScore = clampScore(100 - (dogPct * 95) - Math.max(0, cashCowPct - 0.35) * 30);

  const score = clampScore(
    (foodCostScore * 0.35) +
    (marginScore * 0.25) +
    (engineeringMixScore * 0.25) +
    (riskBalanceScore * 0.15)
  );

  return {
    score,
    grade: getHealthGrade(score),
    foodCostScore,
    marginScore,
    engineeringMixScore,
    riskBalanceScore,
    starPct,
    dogPct
  };
}

export default function MenuEngineeringApp() {
  const [menuItems, setMenuItems] = useState(MENUWORKS_ITEMS);
  const [selectedMenu, setSelectedMenu] = useState(MENUWORKS_ITEMS[0]?.menu || "");
  const [pendingImport, setPendingImport] = useState(null);
  const [globalSearch, setGlobalSearch] = useState("");
  const [fillUnitsValue, setFillUnitsValue] = useState(5);
  const [viewMode, setViewMode] = useState("operations");
  const [targetFoodCost, setTargetFoodCost] = useState(30);
  const [targetMarginPct, setTargetMarginPct] = useState(68);

  const parsedTargetFoodCost = targetFoodCost === "" ? null : Number(targetFoodCost);
  const parsedTargetMarginPct = targetMarginPct === "" ? null : Number(targetMarginPct);
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("source");
  const [unitsById, setUnitsById] = useState({});
  const [manualMargin, setManualMargin] = useState(5);

  const menus = useMemo(() => {
    const allMenuNames = Array.from(new Set(menuItems.map(item => item.menu).filter(Boolean))).sort();
    return allMenuNames.map(menuName => {
      const rows = menuItems.filter(item => item.menu === menuName);
      const stationSet = new Set(rows.map(item => item.station || "—"));
      return {
        menu: menuName,
        count: rows.length,
        priced: rows.filter(item => item.price != null && item.trueCost != null).length,
        stations: Array.from(stationSet).filter(Boolean).sort().join(", ") || "Data available in full build"
      };
    });
  }, [menuItems]);

  const activeSelectedMenu = menus.some(m => m.menu === selectedMenu)
    ? selectedMenu
    : menus[0]?.menu || "";

  const selectedMenuInfo = menus.find(m => m.menu === activeSelectedMenu);

  const menuRows = useMemo(() => {
    const search = globalSearch.trim().toLowerCase();
    if (search) {
      return menuItems.filter(item => String(item.item + " " + item.menu + " " + item.station + " " + item.mrn).toLowerCase().includes(search));
    }
    return menuItems.filter(item => item.menu === activeSelectedMenu);
  }, [menuItems, activeSelectedMenu, globalSearch]);

  const rowsWithUnits = useMemo(() => menuRows.map(row => {
    const rawUnits = unitsById[row.id] ?? 0;
    const units = rawUnits === "" ? 0 : Number(rawUnits);
    const unitProfit = row.price != null && row.trueCost != null ? row.price - row.trueCost : null;
    const revenue = row.price != null ? row.price * units : null;
    const totalCost = row.trueCost != null ? row.trueCost * units : null;
    const totalProfit = revenue != null && totalCost != null ? revenue - totalCost : null;
    const foodCost = row.price ? row.trueCost / row.price : null;
    return { ...row, units, unitProfit, revenue, totalCost, totalProfit, foodCost };
  }), [menuRows, unitsById]);

  const completeRows = useMemo(() => rowsWithUnits.filter(r => r.price != null && r.trueCost != null), [rowsWithUnits]);
  const averageVolume = completeRows.length ? completeRows.reduce((sum, r) => sum + Number(r.units || 0), 0) / completeRows.length : 0;
  const sortedMargins = completeRows.map(r => Number(r.unitProfit || 0)).sort((a, b) => a - b);
  const medianMargin = sortedMargins.length ? sortedMargins[Math.floor(sortedMargins.length / 2)] : 0;
  const volumeThreshold = averageVolume;
  const marginThreshold = Number(manualMargin || 0);

  const engineered = useMemo(() => rowsWithUnits.map(row => {
    if (row.price == null) return { ...row, engineering: "COMPLIMENTARY", marginRank: "—", volumeRank: "—" };
    if (row.unitProfit == null) return { ...row, engineering: "COMPLIMENTARY", marginRank: "—", volumeRank: "—" };
    const marginHigh = row.unitProfit >= marginThreshold;
    const volumeHigh = Number(row.units || 0) >= volumeThreshold;
    return { ...row, engineering: classify(marginHigh, volumeHigh), marginRank: marginHigh ? "HIGH" : "LOW", volumeRank: volumeHigh ? "HIGH" : "LOW" };
  }), [rowsWithUnits, marginThreshold, volumeThreshold]);

  const filtered = useMemo(() => {
    return engineered
      .filter(row => category === "All" || row.engineering === category)
      .sort((a, b) => {
        if (sort === "source") return Number(a.id) - Number(b.id);
        if (sort === "name") return String(a.item).localeCompare(String(b.item));
        if (sort === "foodCostDesc") return (b.foodCost ?? -Infinity) - (a.foodCost ?? -Infinity);
        if (sort === "priceDesc") return (b.price ?? -Infinity) - (a.price ?? -Infinity);
        if (sort === "costDesc") return (b.trueCost ?? -Infinity) - (a.trueCost ?? -Infinity);
        return Number(a.id) - Number(b.id);
      });
  }, [engineered, category, sort]);

  const totals = useMemo(() => engineered.reduce((acc, row) => {
    acc.units += Number(row.units || 0);
    acc.revenue += row.revenue || 0;
    acc.cost += row.totalCost || 0;
    acc.profit += row.totalProfit || 0;
    acc.priced += row.price != null && row.trueCost != null ? 1 : 0;
    acc[row.engineering] = (acc[row.engineering] || 0) + 1;
    return acc;
  }, { units: 0, revenue: 0, cost: 0, profit: 0, priced: 0 }), [engineered]);

  const avgFoodCost = totals.revenue ? totals.cost / totals.revenue : null;
  const grossProfitPct = totals.revenue ? totals.profit / totals.revenue : null;

  const menuHealthDetails = useMemo(() => {
    return calculateMenuHealth({
      avgFoodCost,
      grossProfitPct,
      stars: totals.STAR || 0,
      cashCows: totals["CASH COW"] || 0,
      puzzles: totals.PUZZLE || 0,
      dogs: totals.DOG || 0,
      totalItems: engineered.filter(row => row.engineering !== "COMPLIMENTARY").length,
      targetFoodCost: parsedTargetFoodCost,
      targetMarginPct: parsedTargetMarginPct
    });
  }, [engineered, totals, avgFoodCost, grossProfitPct, parsedTargetFoodCost, parsedTargetMarginPct]);

  const menuHealth = menuHealthDetails.score;

  const executiveRisks = useMemo(() => {
    const risks = [];
    const dogPct = engineered.length ? ((totals.DOG || 0) / engineered.length) * 100 : 0;

    if (dogPct >= 40) {
      risks.push({ level: "CRITICAL", message: `${dogPct.toFixed(0)}% of visible items are classified as DOG items.` });
    } else if (dogPct >= 20) {
      risks.push({ level: "WARNING", message: `${dogPct.toFixed(0)}% of visible items are DOG items and should be reviewed.` });
    }

    if (parsedTargetFoodCost != null) {
      if ((avgFoodCost || 0) * 100 > parsedTargetFoodCost + 6) {
        risks.push({ level: "CRITICAL", message: `Average food cost exceeds target by more than 6%.` });
      } else if ((avgFoodCost || 0) * 100 > parsedTargetFoodCost + 2) {
        risks.push({ level: "WARNING", message: `Average food cost is above target.` });
      }
    }

    const lowMarginHighVolume = engineered.filter(row => row.engineering === "CASH COW").length;
    if (lowMarginHighVolume >= 5) {
      risks.push({ level: "INFO", message: `${lowMarginHighVolume} high-volume low-margin items detected.` });
    }

    if (risks.length === 0) {
      risks.push({ level: "HEALTHY", message: `No major operational or financial risks detected.` });
    }

    return risks;
  }, [engineered, totals, avgFoodCost, parsedTargetFoodCost]);

  const portfolioRows = useMemo(() => {
    return menus.map(menu => {
      const rows = menuItems.filter(item => item.menu === menu.menu);
      const priced = rows.filter(row => row.price != null && row.trueCost != null);
      const avgFc = priced.length
        ? priced.reduce((sum, row) => sum + ((row.trueCost / row.price) || 0), 0) / priced.length
        : 0;

      const dogs = priced.filter(row => row.price && row.trueCost / row.price > 0.34).length;
      const stars = priced.filter(row => row.price && row.trueCost / row.price < 0.24).length;

      const grossMargin = avgFc ? 1 - avgFc : null;
      const cashCows = priced.filter(row => row.price && row.trueCost / row.price >= 0.24 && row.trueCost / row.price <= 0.34).length;
      const healthDetails = calculateMenuHealth({
        avgFoodCost: avgFc,
        grossProfitPct: grossMargin,
        stars,
        cashCows,
        puzzles: 0,
        dogs,
        totalItems: priced.length,
        targetFoodCost: parsedTargetFoodCost,
        targetMarginPct: parsedTargetMarginPct
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
        healthDetails
      };
    }).sort((a, b) => b.health - a.health);
  }, [menus, menuItems, parsedTargetFoodCost, parsedTargetMarginPct]);

  const portfolioHealthDetails = useMemo(() => {
    if (!portfolioRows.length) {
      return {
        score: 0,
        grade: getHealthGrade(0),
        menuCount: 0,
        warningMenus: 0,
        criticalMenus: 0
      };
    }

    const weightedHealth = portfolioRows.reduce((sum, row) => sum + (row.health * Math.max(1, row.items)), 0);
    const totalWeight = portfolioRows.reduce((sum, row) => sum + Math.max(1, row.items), 0);
    const score = clampScore(weightedHealth / totalWeight);

    return {
      score,
      grade: getHealthGrade(score),
      menuCount: portfolioRows.length,
      warningMenus: portfolioRows.filter(row => row.risk === "WARNING").length,
      criticalMenus: portfolioRows.filter(row => row.risk === "CRITICAL").length
    };
  }, [portfolioRows]);

  const portfolioHealth = portfolioHealthDetails.score;

  const updateUnits = (id, value) => {
    setUnitsById(prev => ({ ...prev, [id]: value === "" ? "" : Math.max(0, Number(value)) }));
  };

  const resetMenuUnits = () => {
    setUnitsById(prev => {
      const next = { ...prev };
      menuRows.forEach(row => delete next[row.id]);
      return next;
    });
  };

  const fillVisibleUnits = () => {
    const amount = Math.max(0, Number(fillUnitsValue || 0));
    setUnitsById(prev => {
      const next = { ...prev };
      filtered.forEach(row => {
        next[row.id] = amount;
      });
      return next;
    });
  };

  const cleanNumber = value => {
    if (value === null || value === undefined || value === "") return null;
    const number = Number(String(value).replace(/[$,%]/g, ""));
    return Number.isFinite(number) ? number : null;
  };

  const baseRowKey = row => String([row.menu, row.station, row.mrn, row.item, row.portion].join("|")).toLowerCase();

  const buildComparableMap = rows => {
    const counts = new Map();
    const result = new Map();

    rows.forEach(row => {
      const base = baseRowKey(row);
      const occurrence = counts.get(base) || 0;
      counts.set(base, occurrence + 1);
      result.set(`${base}|occurrence:${occurrence}`, row);
    });

    return result;
  };

  const parseMenuWorksFile = async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheet = workbook.Sheets.Report || workbook.Sheets[workbook.SheetNames[0]];
    const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: null });

    const importedRows = rawRows
      .filter(row => row["Menu Name"] && row["Menu Item"])
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
        forecast: 0
      }));

    const currentByKey = buildComparableMap(menuItems);
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

        if (costChanged && row.trueCost > current.trueCost) {
          costIncreases.push(change);
        }
        if (costChanged && row.trueCost < current.trueCost) {
          costDecreases.push(change);
        }
        if (priceChanged) {
          priceChanges.push(change);
        }
      }
    });

    currentByKey.forEach((row, key) => {
      if (!importedByKey.has(key)) {
        removedItems.push(row);
      }
    });

    const currentMenus = new Set(menuItems.map(row => row.menu));
    const newMenus = Array.from(new Set(importedRows.map(row => row.menu))).filter(menu => !currentMenus.has(menu));

    const comparableBeforeCost = changedItems.reduce((sum, change) => sum + (change.before.trueCost || 0), 0);
    const comparableAfterCost = changedItems.reduce((sum, change) => sum + (change.after.trueCost || 0), 0);
    const comparableCostChangePct = comparableBeforeCost ? ((comparableAfterCost - comparableBeforeCost) / comparableBeforeCost) * 100 : null;

    const currentTotalCost = menuItems.reduce((sum, row) => sum + (row.trueCost || 0), 0);
    const importedTotalCost = importedRows.reduce((sum, row) => sum + (row.trueCost || 0), 0);
    const totalCostChangePct = currentTotalCost ? ((importedTotalCost - currentTotalCost) / currentTotalCost) * 100 : null;

    setPendingImport({ importedRows, newItems, removedItems, changedItems, costIncreases, costDecreases, priceChanges, newMenus, fileName: file.name, comparableCostChangePct, totalCostChangePct });
    event.target.value = "";
  };

  const acceptImport = () => {
    if (!pendingImport) return;
    const nextRows = pendingImport.importedRows.map((row, index) => ({ ...row, id: index }));
    setMenuItems(nextRows);
    setUnitsById({});
    setSelectedMenu(nextRows[0]?.menu || "");
    setPendingImport(null);
  };


  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6">
      {pendingImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-w-4xl w-full rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 space-y-5">
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 max-h-80 overflow-auto">
              <ChangeList title="New menus" items={pendingImport.newMenus} empty="No new menus." />
              <ChangeList title="New items" items={pendingImport.newItems.slice(0, 25).map(row => titleCase(row.menu) + " • " + titleCase(row.item))} empty="No new items." />
              <ChangeList title="Updated items" items={pendingImport.changedItems.slice(0, 25).map(change => titleCase(change.after.item) + " — " + priceLabel(change.before.price) + " → " + priceLabel(change.after.price) + ", " + money(change.before.trueCost) + " → " + money(change.after.trueCost))} empty="No updates." />
              <ChangeList title="Cost increases" items={(pendingImport.costIncreases || []).slice(0, 25).map(change => titleCase(change.after.item) + " — " + money(change.before.trueCost) + " → " + money(change.after.trueCost))} empty="No cost increases." />
              <ChangeList title="Removed items" items={pendingImport.removedItems.slice(0, 25).map(row => titleCase(row.menu) + " • " + titleCase(row.item))} empty="No removed items." />
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
          <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-6">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Stored MenuWorks cost intelligence</p>
              <h1 className="text-4xl md:text-5xl font-bold mt-2">Menu Engineering Dashboard</h1>
              <p className="mt-3 text-slate-600 max-w-3xl">Select the menu a café is running, view its MenuWorks price and true cost data, then enter units sold to classify each item as a Star, Cash Cow, Puzzle, or Dog.</p>
            </div>
            <div className="rounded-3xl bg-slate-100 border border-slate-200 p-4 min-w-[320px] space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-500 mb-2">Admin upload MenuWorks report</label>
                <input type="file" accept=".xlsx,.xls,.csv" onChange={parseMenuWorksFile} className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-xl file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-white hover:file:bg-slate-700" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-500 mb-2">Search all items</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3.5 text-slate-400" size={18}/>
                  <input value={globalSearch} onChange={e => setGlobalSearch(e.target.value)} placeholder="Search item, MRN, menu..." className="w-full rounded-2xl bg-white border border-slate-300 pl-10 pr-3 py-3 outline-none focus:border-slate-500" />
                </div>
              </div>
              <div>
              <label className="block text-sm font-semibold text-slate-500 mb-2">Select menu to view</label>
              <select value={activeSelectedMenu} onChange={e => { setSelectedMenu(e.target.value); setCategory("All"); }} className="w-full rounded-2xl bg-white border border-slate-300 px-4 py-3 text-lg outline-none focus:border-slate-500">
                {menus.map(menu => <option key={menu.menu} value={menu.menu}>{menu.menu} — {menu.count} items</option>)}
              </select>
              </div>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-4">
          <div className="rounded-3xl bg-white border border-slate-200 p-5 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-white text-zinc-950 p-3"><ChefHat size={22}/></div>
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Current menu</p>
                <h2 className="text-3xl font-bold mt-1">{globalSearch.trim() ? "Search Results" : activeSelectedMenu}</h2>
                <p className="text-slate-500 mt-2">{globalSearch.trim() ? `${menuRows.length} matching items across all menus` : `${selectedMenuInfo?.count || 0} items • ${selectedMenuInfo?.priced || 0} with price and cost • ${selectedMenuInfo?.stations || "No station listed"}`}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="flex flex-wrap gap-3">
          <button onClick={() => setViewMode("operations")} className={`rounded-2xl px-5 py-3 font-semibold border ${viewMode === "operations" ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-300 text-slate-700"}`}>Menu View</button>
          <button onClick={() => setViewMode("portfolio")} className={`rounded-2xl px-5 py-3 font-semibold border ${viewMode === "portfolio" ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-300 text-slate-700"}`}>Portfolio Menu View</button>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-3xl bg-white border border-slate-200 p-5 shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-slate-500">Target Food Cost %</p>
              <button onClick={() => setTargetFoodCost(30)} className="text-xs rounded-full bg-slate-100 border border-slate-200 px-3 py-1 hover:bg-slate-200">Reset</button>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <input type="number" value={targetFoodCost} onChange={e => setTargetFoodCost(e.target.value)} className="w-28 rounded-2xl border border-slate-300 px-3 py-3" placeholder="Disabled" />
              <span className="text-slate-500">%</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">Industry-standard operating food cost benchmark used for heatmaps, executive risks, and menu health scoring. Typical foodservice target range is 28–32%.</p>
            <p className="text-xs text-slate-400 mt-1">{parsedTargetFoodCost == null ? "FC% heatmaps and risk escalation disabled." : `Heatmaps activate above ${parsedTargetFoodCost}% FC.`}</p>
          </div>
          <div className="rounded-3xl bg-white border border-slate-200 p-5 shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-slate-500">Target Gross Margin %</p>
              <button onClick={() => setTargetMarginPct(68)} className="text-xs rounded-full bg-slate-100 border border-slate-200 px-3 py-1 hover:bg-slate-200">Reset</button>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <input type="number" value={targetMarginPct} onChange={e => setTargetMarginPct(e.target.value)} className="w-28 rounded-2xl border border-slate-300 px-3 py-3" placeholder="Disabled" />
              <span className="text-slate-500">%</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">Industry-standard profitability benchmark for evaluating overall menu margin performance. Typical foodservice target range is 65–72% gross margin.</p>
            <p className="text-xs text-slate-400 mt-1">{parsedTargetMarginPct == null ? "Margin benchmarking disabled." : `Targeting ${parsedTargetMarginPct}% gross margin.`}</p>
          </div>
          <div className="rounded-3xl bg-white border border-slate-200 p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500">{viewMode === "portfolio" ? "Portfolio Health" : "Menu Health"}</p>
                <div className="mt-3 flex items-end gap-3">
                  <p className="text-4xl font-bold">{viewMode === "portfolio" ? portfolioHealth : menuHealth}/100</p>
                  <p className={`mb-1 rounded-full px-3 py-1 text-xs font-bold ${(viewMode === "portfolio" ? portfolioHealthDetails.grade.bg : menuHealthDetails.grade.bg)} ${(viewMode === "portfolio" ? portfolioHealthDetails.grade.tone : menuHealthDetails.grade.tone)} border ${(viewMode === "portfolio" ? portfolioHealthDetails.grade.border : menuHealthDetails.grade.border)}`}>{viewMode === "portfolio" ? portfolioHealthDetails.grade.label : menuHealthDetails.grade.label}</p>
                </div>
                <div className="mt-4 h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className={`h-full rounded-full ${viewMode === "portfolio" ? portfolioHealthDetails.grade.fill : menuHealthDetails.grade.fill}`} style={{ width: `${viewMode === "portfolio" ? portfolioHealth : menuHealth}%` }} />
                </div>
                <p className="text-sm text-slate-500 mt-2">
                  {viewMode === "portfolio"
                    ? `Weighted health score across ${portfolioHealthDetails.menuCount} menus. ${portfolioHealthDetails.warningMenus} warning and ${portfolioHealthDetails.criticalMenus} critical menus detected.`
                    : "Weighted score using FC%, gross margin, engineering mix, and risk concentration."}
                </p>
              </div>
              <div className="group relative">
                <div className="rounded-full border border-slate-300 bg-slate-100 p-2 cursor-help">
                  <HelpCircle size={16} className="text-slate-500" />
                </div>
                <div className="pointer-events-none absolute right-0 top-full z-30 mt-3 hidden w-96 rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-2xl group-hover:block">
                  <p className="font-bold text-slate-900">How Menu Health is calculated</p>
                  <p className="mt-2 text-slate-600">Menu Health is a weighted operational score designed to estimate overall menu viability using common foodservice benchmarks.</p>
                  <ul className="mt-3 space-y-2 text-slate-600">
                    <li><strong className="text-slate-900">Food Cost Control:</strong> 35% of score. Compares actual FC% to the target FC%.</li>
                    <li><strong className="text-slate-900">Gross Margin:</strong> 25% of score. Compares menu gross margin to the target margin.</li>
                    <li><strong className="text-slate-900">Engineering Mix:</strong> 25% of score. Rewards Stars and Puzzles while penalizing Dogs.</li>
                    <li><strong className="text-slate-900">Risk Balance:</strong> 15% of score. Penalizes high DOG concentration and too many low-margin high-volume items.</li>
                  </ul>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-2">FC Score: <strong>{menuHealthDetails.foodCostScore}/100</strong></div>
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-2">Margin Score: <strong>{menuHealthDetails.marginScore}/100</strong></div>
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-2">Mix Score: <strong>{menuHealthDetails.engineeringMixScore}/100</strong></div>
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-2">Risk Score: <strong>{menuHealthDetails.riskBalanceScore}/100</strong></div>
                  </div>
                  <p className="mt-3 text-slate-500">The score is capped between 0 and 100 and is intended as a quick executive benchmark rather than a financial statement.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {viewMode === "operations" && <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          <Metric icon={DollarSign} title="Revenue" value={money(totals.revenue)} sub="price × units sold" />
          <Metric title="True cost" value={money(totals.cost)} sub="MenuWorks cost × units" />
          <Metric title="Profit" value={money(totals.profit)} sub="revenue - true cost" />
          <Metric title="Avg food cost" value={pct(avgFoodCost)} sub="total cost / revenue" />
          <Metric title="Gross profit" value={pct(grossProfitPct)} sub="profit / revenue" />
        </section>}

        {viewMode === "operations" && <section className="grid grid-cols-1 xl:grid-cols-4 gap-4">
          {["STAR", "CASH COW", "PUZZLE", "DOG"].map(key => (
            <CategoryCard
              key={key}
              count={totals[key] || 0}
              config={classConfig[key]}
              items={engineered.filter(row => row.engineering === key)}
            />
          ))}
        </section>}

        {viewMode === "operations" && <section className="rounded-3xl bg-white border border-slate-200 p-4 shadow-xl space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div className="flex items-center gap-2 text-slate-800 font-semibold"><SlidersHorizontal size={18}/> Menu engineering controls</div>
            <div className="flex flex-wrap gap-2">
              <button onClick={resetMenuUnits} className="rounded-2xl bg-slate-100 border border-slate-200 px-4 py-2 font-semibold hover:bg-slate-200">Reset units to zero</button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
            <select value={category} onChange={e => setCategory(e.target.value)} className="rounded-2xl bg-white border border-slate-300 px-3 py-3 outline-none focus:border-zinc-500">{["All", "STAR", "CASH COW", "PUZZLE", "DOG", "COMPLIMENTARY"].map(c => <option key={c}>{c}</option>)}</select>
            <select value={sort} onChange={e => setSort(e.target.value)} className="rounded-2xl bg-white border border-slate-300 px-3 py-3 outline-none focus:border-zinc-500"><option value="source">Menu order</option><option value="name">Name A-Z</option><option value="priceDesc">Price high to low</option><option value="costDesc">Cost high to low</option><option value="foodCostDesc">Food cost % high to low</option></select>
            <input type="number" min="0" value={fillUnitsValue} onChange={e => setFillUnitsValue(e.target.value)} className="rounded-2xl bg-white border border-slate-300 px-3 py-3 outline-none focus:border-zinc-500" placeholder="Units sold" />
            <button onClick={fillVisibleUnits} className="rounded-2xl bg-slate-900 text-white px-4 py-3 font-semibold hover:bg-slate-700">Fill visible units</button>
            <div className="rounded-2xl bg-white border border-slate-300 px-3 py-3 text-slate-500">Visible items: <span className="text-slate-900 font-semibold">{filtered.length}</span></div>
          </div>
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3 text-sm text-slate-600">
            Margin benchmark: items at or above <span className="font-semibold text-slate-900">{money(manualMargin)}</span> unit profit are HIGH margin. Volume benchmark uses the current menu average units sold.
          </div>
        </section>}

        {viewMode === "operations" ? <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
          <div className="overflow-auto max-h-[680px]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-slate-100 border-b border-slate-200">
                <tr className="text-left text-slate-500">
                  <Th>Item</Th><Th>Station</Th><Th>Price</Th><Th>True Cost</Th><Th>FC%</Th><Th>Units Sold</Th><Th>Revenue</Th><Th>Profit</Th><Th>Margin</Th><Th>Volume</Th><Th>Engineering</Th><Th>Recommendation</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filtered.map(row => <ItemRow key={row.id} row={row} updateUnits={updateUnits} parsedTargetFoodCost={parsedTargetFoodCost} />)}
              </tbody>
            </table>
          </div>
        </section> : <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 border-b border-slate-200">
                <tr className="text-left text-slate-500">
                  <Th>Menu</Th>
                  <Th>Health</Th>
                  <Th>Items</Th>
                  <Th>Stars</Th>
                  <Th>Dogs</Th>
                  <Th>Avg FC%</Th>
                  <Th>Risk</Th>
                  <Th>Executive Risk Detail</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {portfolioRows.map(row => (
                  <tr key={row.menu} className={`hover:bg-slate-50 ${parsedTargetFoodCost != null && row.avgFc * 100 > parsedTargetFoodCost + 6 ? "bg-red-50" : parsedTargetFoodCost != null && row.avgFc * 100 > parsedTargetFoodCost + 2 ? "bg-amber-50" : "bg-emerald-50/40"}`}>
                    <td className="px-4 py-3 font-semibold">{row.menu}</td>
                    <td className="px-4 py-3 font-bold min-w-[300px]">
                      <div>
                        <p className="text-lg font-bold">{row.health}/100</p>
                        <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs font-normal text-slate-600">
                          <p className="font-semibold text-slate-900">Why this score?</p>
                          <p className="mt-1"><strong className="text-emerald-700">{row.stars}</strong> strong-margin items helped the score.</p>
                          <p><strong className="text-rose-700">{row.dogs}</strong> high-risk items reduced the score.</p>
                          <p>Average FC% is <strong>{pct(row.avgFc)}</strong> against the {parsedTargetFoodCost ?? "disabled"}% benchmark.</p>
                          <p>Risk state: <strong>{row.risk}</strong>.</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{row.items}</td>
                    <td className="px-4 py-3 text-emerald-700 font-semibold">{row.stars}</td>
                    <td className="px-4 py-3 text-red-700 font-semibold">{row.dogs}</td>
                    <td className="px-4 py-3">{pct(row.avgFc)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${row.risk === "CRITICAL" ? "bg-red-100 text-red-800" : row.risk === "WARNING" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>{row.risk}</span>
                    </td>
                    <td className="px-4 py-3 min-w-[280px]">
                      <ul className="space-y-1 text-xs text-slate-600">
                        {row.riskNotes.map((note, index) => <li key={index}>• {note}</li>)}
                      </ul>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>}
      </div>
    </div>
  );
}

function Metric({ title, value, sub, icon: Icon }) {
  return <div className="rounded-3xl bg-white border border-slate-200 p-5 shadow-xl"><div className="flex items-center justify-between gap-3"><p className="text-slate-500 text-sm">{title}</p>{Icon && <Icon size={18} className="text-slate-400"/>}</div><p className="text-2xl font-bold mt-2">{value}</p><p className="text-xs text-slate-400 mt-2">{sub}</p></div>;
}
function CategoryCard({ count, config, items = [] }) {
  const Icon = config.icon;
  const previewItems = [...items]
    .sort((a, b) => (b.totalProfit || 0) - (a.totalProfit || 0))
    .slice(0, 4);

  return (
    <div className="group relative rounded-3xl bg-white border border-slate-200 p-5 shadow-xl flex items-start gap-3 cursor-help">
      <div className={`rounded-2xl border p-3 ${config.badge}`}><Icon size={20}/></div>
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
        {previewItems.length === 0 ? (
          <p className="text-slate-500">No items currently in this category.</p>
        ) : (
          <ul className="mt-1 space-y-1 text-slate-600">
            {previewItems.map(row => (
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
  return <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="font-semibold text-slate-900 mb-2">{title}</p>{items.length === 0 ? <p className="text-sm text-slate-500">{empty}</p> : <ul className="space-y-2 text-sm text-slate-600">{items.map((item, index) => <li key={index} className="border-b border-slate-200 pb-2 last:border-0">{item}</li>)}</ul>}</div>;
}

function Benchmark({ title, mode, setMode, manual, setManual, autoLabel }) {
  const autoValue = title.includes("Volume") ? "average" : "median";
  return <div className="rounded-2xl bg-white border border-slate-300 p-3 flex flex-col md:flex-row md:items-center gap-3 justify-between"><div><p className="font-semibold text-slate-800">{title}</p><p className="text-slate-400">{mode === "manual" ? "Manual threshold" : autoLabel}</p></div><div className="flex gap-2"><select value={mode} onChange={e => setMode(e.target.value)} className="rounded-xl bg-white border border-slate-300 px-3 py-2"><option value={autoValue}>Auto</option><option value="manual">Manual</option></select>{mode === "manual" && <input type="number" value={manual} onChange={e => setManual(e.target.value)} className="w-24 rounded-xl bg-white border border-slate-300 px-3 py-2" />}</div></div>;
}
function Th({ children }) { return <th className="px-4 py-3 font-semibold whitespace-nowrap">{children}</th>; }
function ItemRow({ row, updateUnits, parsedTargetFoodCost }) {
  const cfg = classConfig[row.engineering];

  let heatClass = "";
  if (typeof parsedTargetFoodCost !== "undefined" && parsedTargetFoodCost != null && row.foodCost != null) {
    const fcPct = row.foodCost * 100;
    if (fcPct > parsedTargetFoodCost + 6) {
      heatClass = "bg-red-50";
    } else if (fcPct > parsedTargetFoodCost + 2) {
      heatClass = "bg-amber-50";
    } else {
      heatClass = "bg-emerald-50/40";
    }
  }

  return <tr className={`hover:bg-slate-50 align-top ${heatClass}`}><td className="px-4 py-3 min-w-[280px]"><p className="font-semibold text-slate-900 capitalize">{titleCase(row.item)}</p><p className="text-xs text-slate-400">MRN {row.mrn || "—"} • {row.portion || "—"}</p></td><td className="px-4 py-3 min-w-[140px]">{row.station || "—"}</td><td className="px-4 py-3 whitespace-nowrap">{priceLabel(row.price)}</td><td className="px-4 py-3 whitespace-nowrap">{money(row.trueCost)}</td><td className="px-4 py-3 whitespace-nowrap">{pct(row.foodCost)}</td><td className="px-4 py-3"><input type="number" min="0" value={row.units ?? ""} onChange={e => updateUnits(row.id, e.target.value)} className="w-24 rounded-xl bg-white border border-slate-300 px-3 py-2 text-slate-900" /></td><td className="px-4 py-3 whitespace-nowrap">{money(row.revenue)}</td><td className="px-4 py-3 whitespace-nowrap font-semibold">{money(row.totalProfit)}</td><td className="px-4 py-3 whitespace-nowrap">{row.marginRank}</td><td className="px-4 py-3 whitespace-nowrap">{row.volumeRank}</td><td className="px-4 py-3 whitespace-nowrap"><span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${cfg.badge}`}>{cfg.label}</span></td><td className="px-4 py-3 min-w-[180px] text-slate-500">{cfg.action}</td></tr>;
}
