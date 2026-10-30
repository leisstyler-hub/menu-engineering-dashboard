export const COMMISSARY_STATIONS = Object.freeze({
  SALAD_BAR: "saladBar",
  GRILL: "grill",
  DELI: "deli",
  GLOBAL: "global",
});

export const COMMISSARY_HUBS = Object.freeze([
  Object.freeze({ key: "Cricket", label: "Cricket" }),
  Object.freeze({ key: "Sonic", label: "Sonic" }),
  Object.freeze({ key: "Blueshift", label: "Blueshift" }),
]);

const ALL_CURRENT_STATIONS = Object.freeze([COMMISSARY_STATIONS.SALAD_BAR, COMMISSARY_STATIONS.GRILL, COMMISSARY_STATIONS.DELI, COMMISSARY_STATIONS.GLOBAL]);

export const COMMISSARY_CAFE_STATION_ACCESS = Object.freeze({
  Cricket: ALL_CURRENT_STATIONS,
  Nessie: ALL_CURRENT_STATIONS,
  Dawson: ALL_CURRENT_STATIONS,
  Bingo: Object.freeze([COMMISSARY_STATIONS.GLOBAL, COMMISSARY_STATIONS.SALAD_BAR, COMMISSARY_STATIONS.GRILL]),
  Grace: Object.freeze([COMMISSARY_STATIONS.GLOBAL, COMMISSARY_STATIONS.GRILL]),
  Sonic: ALL_CURRENT_STATIONS,
  Blueshift: ALL_CURRENT_STATIONS,
  "105": ALL_CURRENT_STATIONS,
  Everest: Object.freeze([COMMISSARY_STATIONS.GLOBAL, COMMISSARY_STATIONS.SALAD_BAR]),
  Dynamo: Object.freeze([COMMISSARY_STATIONS.DELI]),
  Gemini: Object.freeze([COMMISSARY_STATIONS.GLOBAL, COMMISSARY_STATIONS.DELI]),
  Astra: Object.freeze([COMMISSARY_STATIONS.GLOBAL, COMMISSARY_STATIONS.SALAD_BAR, COMMISSARY_STATIONS.GRILL]),
  Eclipse: Object.freeze([COMMISSARY_STATIONS.DELI]),
  Odyssey: Object.freeze([COMMISSARY_STATIONS.DELI]),
});

export const COMMISSARY_HUB_ROUTING = Object.freeze({
  Cricket: Object.freeze({
    saladBar: Object.freeze(["Cricket", "Nessie", "Dawson"]),
    grill: Object.freeze(["Cricket", "Nessie", "Dawson"]),
    deli: Object.freeze(["Cricket", "Nessie", "Dawson"]),
    global: Object.freeze(["Cricket", "Nessie", "Dawson"]),
  }),
  Sonic: Object.freeze({
    saladBar: Object.freeze(["Bingo", "Sonic", "Blueshift", "105", "Everest", "Astra"]),
    grill: Object.freeze(["Bingo", "Grace", "Sonic", "Blueshift", "105", "Astra"]),
    deli: Object.freeze(["Sonic", "Blueshift", "105", "Dynamo", "Gemini", "Eclipse", "Odyssey"]),
    global: Object.freeze([]),
  }),
  Blueshift: Object.freeze({
    saladBar: Object.freeze([]),
    grill: Object.freeze([]),
    deli: Object.freeze([]),
    global: Object.freeze(["Bingo", "Grace", "Sonic", "Blueshift", "105", "Everest", "Gemini", "Astra"]),
  }),
});

export function isCafeStationEnabled(cafe, station) {
  return COMMISSARY_CAFE_STATION_ACCESS[cafe]?.includes(station) || false;
}

export function commissaryHubFor(cafe, station) {
  if (!isCafeStationEnabled(cafe, station)) return null;
  return COMMISSARY_HUBS.find(({ key }) => COMMISSARY_HUB_ROUTING[key]?.[station]?.includes(cafe))?.key || null;
}

export function cafeRoutesToHub(cafe, station, hub) {
  return commissaryHubFor(cafe, station) === hub;
}
