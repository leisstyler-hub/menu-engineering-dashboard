import React, { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { Search, Star, TrendingUp, HelpCircle, Dog, SlidersHorizontal, ChefHat, DollarSign } from "lucide-react";

import MENUWORKS_ITEMS from "../../data/menuItems.json";
import { money, pct, priceLabel, smartMenuEngineeringSort, titleCase } from "../../shared/formatting.js";
import CompassOneLogo from "../../shared/ui/CompassOneLogo.jsx";

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

const MENU_ENGINEERING_OVERRIDE_STORAGE_KEY = "culinaryToolsMenuEngineeringItems_v2";
const MENUWORKS_IMPORT_INITIATION_CODE = "410410";
const MENUWORKS_ALLERGEN_COLUMNS = [
  "Egg",
  "Fish",
  "Milk",
  "Peanuts",
  "Sesame",
  "Shellfish - Crustacean",
  "Soy",
  "Tree Nuts",
  "Wheat",
  "Alcohol",
  "Beef",
  "Buckwheat",
  "Celery",
  "Garlic",
  "Gluten",
  "Lupin",
  "MSG",
  "Mushroom",
  "Mustard",
  "Onion",
  "Orange",
  "Pork",
  "Poultry",
  "Shellfish - Mollusk",
  "Strawberry",
  "Sulphites",
  "Tomato",
];

function readStoredMenuItems() {
  if (typeof window === "undefined") return MENUWORKS_ITEMS;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(MENU_ENGINEERING_OVERRIDE_STORAGE_KEY) || "null");
    return Array.isArray(parsed) && parsed.length ? parsed : MENUWORKS_ITEMS;
  } catch {
    return MENUWORKS_ITEMS;
  }
}

function textValue(row, ...keys) {
  for (const key of keys) {
    const value = row?.[key];
    if (value !== null && value !== undefined && String(value).trim()) return String(value).trim();
  }
  return "";
}

function stripRecipePrefix(value = "") {
  return String(value).replace(/^(AMZ|EUR|RA|AMZ\+RA):\s*/i, "").trim();
}

function cleanMrn(value = "") {
  return String(value || "").replace(/^'/, "").trim();
}

function normalizeWastePct(value) {
  if (value == null) return null;
  return value > 1 ? value / 100 : value;
}

function cleanNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(String(value).replace(/[$,%]/g, ""));
  return Number.isFinite(number) ? number : null;
}

function menuBaseName(menu = "") {
  return stripRecipePrefix(menu);
}

function menuPrefix(menu = "") {
  const match = String(menu || "").match(/^([^:]+):/);
  return match ? match[1] : "";
}

function inferImportedCategory(row, price) {
  const notes = textValue(row, "Menu Item Notes").toLowerCase();
  const recipeCategory = textValue(row, "Recipe Category.", "Recipe Category").toLowerCase();
  const productionArea = textValue(row, "Recipe Production Area.", "Recipe Production Area").toLowerCase();
  const station = textValue(row, "Station", "Station.").toLowerCase();
  const itemText = `${textValue(row, "Recipe Name")} ${textValue(row, "Short Name")} ${recipeCategory}`.toLowerCase();

  if (price == null) return "subRecipe";
  if (/extension/.test(notes) || /cookie|cake|dessert|pastry|beverage|smoothie|chips|salsa|guacamole|queso/.test(itemText)) return "extension";
  if (/a la carte|side choice/.test(notes) || /hot side/.test(productionArea) || /starch\/grain|vegetable/.test(recipeCategory)) return "side";
  if (/entree/.test(notes) || /main entree|breakfast|sandwich\/wrap/.test(recipeCategory) || price >= 9) return "entree";
  if (/side/.test(station)) return "side";
  return price >= 5 ? "entree" : "side";
}

function parseAllergenDetails(row) {
  const allergenDetails = {};
  const allergens = [];
  MENUWORKS_ALLERGEN_COLUMNS.forEach((allergen) => {
    const value = textValue(row, allergen);
    if (!value || value.toLowerCase() === "no") return;
    allergenDetails[allergen] = value;
    allergens.push(value.toLowerCase().includes("at risk") ? `${allergen} (At Risk)` : allergen);
  });

  const summary = textValue(row, "Allergens.", "Allergens");
  if (summary && !allergens.length) {
    summary.split(",").map((value) => value.replace(/^contains\s+/i, "").trim()).filter(Boolean).forEach((allergen) => {
      allergenDetails[allergen] = "Yes";
      allergens.push(allergen);
    });
  }

  return { allergenSummary: summary || null, allergenDetails, allergens };
}

function parseImportedMenuWorksRow(row, index) {
  const menu = textValue(row, "Menu Name");
  const recipeName = textValue(row, "Recipe Name", "Menu Item");
  if (!menu || !recipeName || !/^(AMZ|AMZ\+RA|EUR|RA):/i.test(menu)) return null;

  const price = cleanNumber(textValue(row, "Sell Price", "Price"));
  const itemCost = cleanNumber(textValue(row, "Menu Item Cost", "Item Cost"));
  const wastePct = normalizeWastePct(cleanNumber(textValue(row, "Waste %", "Waste")));
  const trueCost = cleanNumber(textValue(row, "Item + Waste Cost", "True Cost")) ?? (itemCost == null ? null : Number((itemCost * (1 + (wastePct || 0))).toFixed(4)));
  const displayName = titleCase(textValue(row, "Short Name") || stripRecipePrefix(recipeName));
  const { allergens, allergenDetails, allergenSummary } = parseAllergenDetails(row);

  return {
    id: index,
    menu,
    meal: textValue(row, "Meal", "Meal Period"),
    station: textValue(row, "Station", "Station.") || menuBaseName(menu),
    item: displayName,
    mrn: cleanMrn(textValue(row, "Recipe Number", "MRN")),
    portion: textValue(row, "Menu Portion Size", "Portion"),
    price,
    itemCost,
    wastePct,
    trueCost,
    forecast: 0,
    menuPrefix: menuPrefix(menu),
    menuBaseName: menuBaseName(menu),
    recipeName,
    recipePrefix: menuPrefix(recipeName),
    recipeSource: textValue(row, "Recipe Source."),
    displayName,
    shortName: displayName,
    portionOz: cleanNumber(textValue(row, "Menu Portion Weight(oz)")),
    category: inferImportedCategory(row, price),
    enticingDescription: textValue(row, "Enticing Description"),
    dietDescription: textValue(row, "Diet Description"),
    dietTags: [textValue(row, "Diet"), textValue(row, "Vegan Tag."), textValue(row, "Vegetarian Tag."), textValue(row, "Compass Fit.")].filter(Boolean).join(", "),
    ingredients: textValue(row, "Ingredients"),
    ingredientsCommonName: textValue(row, "Ingredients Common Name"),
    recipeCategory: textValue(row, "Recipe Category."),
    recipeProductionArea: textValue(row, "Recipe Production Area."),
    productionArea: textValue(row, "Production Area"),
    menuItemNotes: textValue(row, "Menu Item Notes"),
    allergenSummary,
    allergens,
    allergenDetails,
    compassFit: textValue(row, "Compass Fit.") || null,
    exceedsSodiumLimit: textValue(row, "Exceeds Sodium Limit.") || null,
    ghgEmissions: textValue(row, "GHG Emissions.") || null,
    madeFromSingleSource: textValue(row, "Made from Single Source.") || null,
    veganTag: textValue(row, "Vegan Tag.") || null,
    vegetarianTag: textValue(row, "Vegetarian Tag.") || null,
    dataSource: "menuworks-user-upload",
  };
}

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


export default function MenuEngineeringDashboard({ onBackToPlatform }) {
  const [menuItems, setMenuItems] = useState(readStoredMenuItems);
  const [selectedMenu, setSelectedMenu] = useState(MENUWORKS_ITEMS[0]?.menu || "");
  const [pendingImport, setPendingImport] = useState(null);
  const [uploadInitiationCode, setUploadInitiationCode] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");
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
    if (uploadInitiationCode.trim() !== MENUWORKS_IMPORT_INITIATION_CODE) {
      setUploadStatus("Enter initiation code 410410 before uploading a MenuWorks truth file.");
      event.target.value = "";
      return;
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheet = workbook.Sheets.Report || workbook.Sheets[workbook.SheetNames[0]];
    const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: null });
    const importedRows = rawRows.map((row, index) => parseImportedMenuWorksRow(row, index)).filter(Boolean);

    if (!importedRows.length) {
      setUploadStatus("No MenuWorks menu item rows were detected. Use the Menu Item Index or MenuWorks export format.");
      event.target.value = "";
      return;
    }
    setUploadStatus("");

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
      const detailChanged =
        current.item !== row.item ||
        current.station !== row.station ||
        current.category !== row.category ||
        current.enticingDescription !== row.enticingDescription ||
        current.ingredientsCommonName !== row.ingredientsCommonName ||
        JSON.stringify(current.allergenDetails || {}) !== JSON.stringify(row.allergenDetails || {});
      if (priceChanged || costChanged || itemCostChanged || portionChanged || detailChanged) {
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
    if (!pendingImport || uploadInitiationCode.trim() !== MENUWORKS_IMPORT_INITIATION_CODE) {
      setUploadStatus("Enter initiation code 410410 before accepting an import.");
      return;
    }
    const importedMenuNames = pendingImport.importedMenuNames || Array.from(new Set(pendingImport.importedRows.map((row) => row.menu).filter(Boolean)));
    const retainedRows = menuItems.filter((row) => !importedMenuNames.includes(row.menu));
    const nextRows = [...retainedRows, ...pendingImport.importedRows].map((row, index) => ({ ...row, id: index }));
    setMenuItems(nextRows);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(MENU_ENGINEERING_OVERRIDE_STORAGE_KEY, JSON.stringify(nextRows));
    }
    setUnitsById({});
    setSelectedMenu(pendingImport.importedRows[0]?.menu || retainedRows[0]?.menu || "");
    setPendingImport(null);
    setUploadStatus(`Accepted ${pendingImport.importedRows.length} MenuWorks row${pendingImport.importedRows.length === 1 ? "" : "s"} from ${pendingImport.fileName}.`);
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
              <Metric title="Updated items" value={pendingImport.changedItems.length} sub="details, allergens, price, or cost changed" />
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
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <button
              onClick={onBackToPlatform}
              className="rounded-2xl bg-slate-100 border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
            >
              ← Back to Culinary Tools Platform
            </button>
            <CompassOneLogo compact />
          </div>
          <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-6">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Stored MenuWorks cost intelligence</p>
              <h1 className="text-4xl md:text-5xl font-bold mt-2">Menu Engineering Dashboard</h1>
              <p className="mt-3 text-slate-600 max-w-3xl">Select a menu, view MenuWorks price and true cost data, enter units sold, and evaluate menu performance by item or across the portfolio.</p>
            </div>

            <div className="rounded-3xl bg-slate-100 border border-slate-200 p-4 min-w-[320px] space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-500 mb-2">Initiate MenuWorks Upload</label>
                <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-2">
                  <input value={uploadInitiationCode} onChange={(e) => setUploadInitiationCode(e.target.value)} placeholder="410410" className="rounded-2xl bg-white border border-slate-300 px-3 py-3 text-sm font-semibold outline-none focus:border-slate-500" />
                  <input disabled={uploadInitiationCode.trim() !== MENUWORKS_IMPORT_INITIATION_CODE} type="file" accept=".xlsx,.xls,.csv" onChange={parseMenuWorksFile} className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-xl file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-white hover:file:bg-slate-700 disabled:opacity-50" />
                </div>
                <p className="mt-2 text-xs text-slate-500">Enter the initiation code, upload a MenuWorks truth file, review changes, then accept.</p>
                {uploadStatus && <p className="mt-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-900">{uploadStatus}</p>}
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
