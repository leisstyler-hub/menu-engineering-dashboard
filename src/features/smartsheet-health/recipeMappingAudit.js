import { itemName, itemTrustFlags, textValue } from "../recipe-database/recipeLibraryModel.js";

function asText(value) {
  return String(value ?? "").trim();
}

function numberValue(value) {
  if (value === null || value === undefined || value === "") return null;
  const numeric = Number(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(numeric) ? numeric : null;
}

function familyStatus(issues = [], watch = []) {
  if (issues.length) return "needs_review";
  if (watch.length) return "watch";
  return "ready";
}

function menuRows(rows, menu) {
  return rows.filter((row) => row.menu === menu);
}

function globalMenuRows(rows) {
  return rows.filter((row) => /^AMZ: /i.test(asText(row.menu)) && !["AMZ: Grill Core", "AMZ: Carvery", "AMZ: Fresh Five"].includes(row.menu));
}

function issue(row, reason) {
  return {
    menu: asText(row.menu),
    station: asText(row.station),
    category: asText(row.category),
    item: itemName(row),
    price: numberValue(row.price),
    notes: asText(row.menuItemNotes),
    reason,
  };
}

export function buildRecipeMappingAudit(rows = []) {
  const grillRows = menuRows(rows, "AMZ: Grill Core");
  const grillSideLeaks = grillRows
    .filter((row) => row.category === "side")
    .filter((row) => numberValue(row.price) >= 9 || /burger|sandwich|wrap|torta|dog/i.test(itemName(row)));
  const missingFrenchFries = !grillRows.some((row) => row.category === "side" && /french fries/i.test(itemName(row)));

  const carveryRows = menuRows(rows, "AMZ: Carvery");
  const note = (row) => textValue(row, "menuItemNotes").toLowerCase().replace(/\s+/g, " ").trim();
  const charredVegetables = carveryRows.filter((row) => /^charred vegetable option/.test(note(row)));
  const hotSides = carveryRows.filter((row) => note(row) === "hot a la carte and side choice");
  const coldSides = carveryRows.filter((row) => ["a la carte and side choice", "cold a la carte and side choice"].includes(note(row)));
  const supportSignal = /sauce|dressing|condiment|spread|dip|salsa|chutney|preserve|preserves|vinaigrette|aioli|mustard|mayonnaise|mayo|hummus|gravy|jus/i;
  const carverySupportSideLeaks = carveryRows.filter((row) => row.category === "side" && numberValue(row.price) == null && supportSignal.test(`${itemName(row)} ${row.recipeName || ""} ${row.recipeCategory || ""} ${row.menuItemNotes || ""}`));

  const freshFiveRows = menuRows(rows, "AMZ: Fresh Five");
  const freshFiveStations = new Set(freshFiveRows.map((row) => asText(row.station)).filter(Boolean));
  const freshFiveGrillLeaks = freshFiveRows.filter((row) => row.station === "Grill" && /soup|salad|flatbread/i.test(itemName(row)));

  const amzGlobalRows = globalMenuRows(rows);
  const globalMenus = new Set(amzGlobalRows.map((row) => row.menu).filter(Boolean));
  const globalEntreeSideLeaks = amzGlobalRows.filter((row) => row.category === "side" && /main entree|sandwich\/wrap|pizza\/calzone\/flatbread/i.test(asText(row.recipeCategory).toLowerCase()) && !/side choice|side pairing|a la carte\s*(?:&|and)\s*side choice/i.test(asText(row.menuItemNotes).toLowerCase()));

  const trustFlags = rows.map((row) => ({ row, flags: itemTrustFlags(row) }));
  const reviewRows = trustFlags.filter(({ flags }) => flags.some((flag) => flag.level === "review"));
  const watchRows = trustFlags.filter(({ flags }) => flags.some((flag) => flag.level === "watch"));

  const families = [
    {
      id: "grill-core",
      label: "Grill Core",
      status: familyStatus([
        ...grillSideLeaks.map((row) => issue(row, "Side group contains entree-priced grill item.")),
        ...(missingFrenchFries ? [{ item: "French Fries", reason: "Required Grill Core side is missing." }] : []),
      ]),
      metrics: {
        rows: grillRows.length,
        sideLeaks: grillSideLeaks.length,
        hasFrenchFries: !missingFrenchFries,
      },
    },
    {
      id: "carvery",
      label: "Carvery",
      status: familyStatus(carverySupportSideLeaks.map((row) => issue(row, "Complimentary support item is mapped as a side."))),
      metrics: {
        rows: carveryRows.length,
        charredVegetables: charredVegetables.length,
        hotSides: hotSides.length,
        coldSides: coldSides.length,
        supportSideLeaks: carverySupportSideLeaks.length,
      },
    },
    {
      id: "fresh-five",
      label: "Fresh Five",
      status: familyStatus(freshFiveGrillLeaks.map((row) => issue(row, "Fresh Five Grill row contains soup, salad, or flatbread language."))),
      metrics: {
        rows: freshFiveRows.length,
        stationCount: freshFiveStations.size,
        stationLabels: Array.from(freshFiveStations).sort(),
        stationLeaks: freshFiveGrillLeaks.length,
      },
    },
    {
      id: "global-menus",
      label: "Global Menus",
      status: familyStatus(globalEntreeSideLeaks.map((row) => issue(row, "Global side row has entree-style recipe category without side-choice notes."))),
      metrics: {
        rows: amzGlobalRows.length,
        menuCount: globalMenus.size,
        sideLeaks: globalEntreeSideLeaks.length,
      },
    },
  ];

  return {
    summary: {
      rows: rows.length,
      readyFamilies: families.filter((family) => family.status === "ready").length,
      watchFamilies: families.filter((family) => family.status === "watch").length,
      reviewFamilies: families.filter((family) => family.status === "needs_review").length,
      reviewRows: reviewRows.length,
      watchRows: watchRows.length,
    },
    families,
  };
}
