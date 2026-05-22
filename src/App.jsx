import React, { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { Search, Star, TrendingUp, HelpCircle, Dog, SlidersHorizontal, ChefHat, DollarSign } from "lucide-react";

const MENUWORKS_ITEMS = [
  {
    "id": 0,
    "menu": "AMZ: Andes",
    "meal": "Lunch",
    "station": "Andes",
    "item": "aji amarillo dipping sauce",
    "mrn": "122252",
    "portion": "1 floz",
    "price": null,
    "itemCost": 0.3647,
    "wastePct": 0.04,
    "trueCost": 0.3793,
    "forecast": 100.0
  },
  {
    "id": 1,
    "menu": "AMZ: Andes",
    "meal": "Lunch",
    "station": "Andes",
    "item": "aji de gallina",
    "mrn": "122251",
    "portion": "8 ounce",
    "price": 11.75,
    "itemCost": 2.4737,
    "wastePct": 0.04,
    "trueCost": 2.5727,
    "forecast": 100.0
  }
];

const money = (value) =>
  value == null || Number.isNaN(Number(value))
    ? "—"
    : Number(value).toLocaleString(undefined, {
        style: "currency",
        currency: "USD"
      });

const pct = (value) =>
  value == null || Number.isNaN(Number(value))
    ? "—"
    : String((Number(value) * 100).toFixed(1)) + "%";

const priceLabel = (value) =>
  value == null || Number.isNaN(Number(value))
    ? "Complimentary"
    : money(value);

const titleCase = (value) =>
  String(value || "")
    .split(" ")
    .map(word =>
      word ? word.charAt(0).toUpperCase() + word.slice(1) : word
    )
    .join(" ");

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
    badge: "bg-emerald-100 text-emerald-900 border-emerald-200"
  },
  "CASH COW": {
    icon: TrendingUp,
    label: "Cash Cow",
    note: "Low margin / high volume",
    action: "Review price, portion, or cost.",
    badge: "bg-sky-100 text-sky-900 border-sky-200"
  },
  PUZZLE: {
    icon: HelpCircle,
    label: "Puzzle",
    note: "High margin / low volume",
    action: "Improve placement or merchandising.",
    badge: "bg-amber-100 text-amber-900 border-amber-200"
  },
  DOG: {
    icon: Dog,
    label: "Dog",
    note: "Low margin / low volume",
    action: "Consider rework or removal.",
    badge: "bg-rose-100 text-rose-900 border-rose-200"
  },
  COMPLIMENTARY: {
    icon: ChefHat,
    label: "Complimentary",
    note: "No sell price",
    action: "Included item, sauce, or garnish.",
    badge: "bg-slate-100 text-slate-700 border-slate-200"
  }
};

export default function MenuEngineeringApp() {
  const [menuItems, setMenuItems] = useState(MENUWORKS_ITEMS);
  const [selectedMenu, setSelectedMenu] = useState(
    MENUWORKS_ITEMS[0]?.menu || ""
  );

  const menus = useMemo(() => {
    return Array.from(
      new Set(menuItems.map(item => item.menu).filter(Boolean))
    ).sort();
  }, [menuItems]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        <header className="rounded-[2rem] bg-white border border-slate-200 p-6 shadow-2xl">
          <h1 className="text-5xl font-bold">
            Menu Engineering Dashboard
          </h1>

          <div className="mt-6">
            <label className="block text-sm font-semibold text-slate-500 mb-2">
              Select menu to view
            </label>

            <select
              value={selectedMenu}
              onChange={e => setSelectedMenu(e.target.value)}
              className="w-full rounded-2xl bg-white border border-slate-300 px-4 py-3 text-lg"
            >
              {menus.map(menu => (
                <option key={menu} value={menu}>
                  {menu}
                </option>
              ))}
            </select>
          </div>
        </header>

      </div>
    </div>
  );
}
