export const COMMISSARY_STATIONS = Object.freeze({
  SALAD_BAR: "saladBar",
  GRILL: "grill",
  DELI: "deli",
  GLOBAL: "global",
  BREAKFAST: "breakfast",
});

export const COMMISSARY_HUBS = Object.freeze([
  Object.freeze({ key: "Cricket", label: "Cricket" }),
  Object.freeze({ key: "Sonic", label: "Sonic" }),
  Object.freeze({ key: "Blueshift", label: "Blueshift" }),
]);

export function isCommissaryHub(cafe) {
  return COMMISSARY_HUBS.some(({ key }) => key === cafe);
}

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
  Doppler: Object.freeze([COMMISSARY_STATIONS.SALAD_BAR, COMMISSARY_STATIONS.DELI, COMMISSARY_STATIONS.GLOBAL]),
  "Day 1": ALL_CURRENT_STATIONS,
  Nitro: Object.freeze([COMMISSARY_STATIONS.SALAD_BAR, COMMISSARY_STATIONS.GRILL, COMMISSARY_STATIONS.GLOBAL]),
  "Re:Invent": ALL_CURRENT_STATIONS,
  "Brazil Coffee": Object.freeze([COMMISSARY_STATIONS.BREAKFAST, COMMISSARY_STATIONS.DELI]),
  "Roxanne Coffee": Object.freeze([COMMISSARY_STATIONS.BREAKFAST, COMMISSARY_STATIONS.DELI]),
  "Arizona Coffee": Object.freeze([COMMISSARY_STATIONS.BREAKFAST, COMMISSARY_STATIONS.DELI]),
  "Zoka Coffee": Object.freeze([COMMISSARY_STATIONS.BREAKFAST, COMMISSARY_STATIONS.DELI]),
  Atlas: Object.freeze([COMMISSARY_STATIONS.GRILL]),
  Frontier: Object.freeze([COMMISSARY_STATIONS.GLOBAL, COMMISSARY_STATIONS.SALAD_BAR]),
});

export const COMMISSARY_HUB_ROUTING = Object.freeze({
  Cricket: Object.freeze({
    saladBar: Object.freeze(["Cricket", "Nessie", "Dawson", "Frontier"]),
    grill: Object.freeze(["Cricket", "Nessie", "Dawson", "Atlas"]),
    deli: Object.freeze(["Cricket", "Nessie", "Dawson", "Brazil Coffee", "Zoka Coffee"]),
    global: Object.freeze(["Cricket", "Nessie", "Dawson", "Frontier"]),
    breakfast: Object.freeze(["Brazil Coffee", "Zoka Coffee"]),
  }),
  Sonic: Object.freeze({
    saladBar: Object.freeze(["Bingo", "Sonic", "Blueshift", "105", "Everest", "Astra"]),
    grill: Object.freeze(["Bingo", "Grace", "Sonic", "Blueshift", "105", "Astra"]),
    deli: Object.freeze(["Sonic", "Blueshift", "105", "Dynamo", "Gemini", "Eclipse", "Odyssey"]),
    global: Object.freeze([]),
    breakfast: Object.freeze([]),
  }),
  Blueshift: Object.freeze({
    saladBar: Object.freeze(["Doppler", "Day 1", "Nitro", "Re:Invent"]),
    grill: Object.freeze(["Day 1", "Nitro", "Re:Invent"]),
    deli: Object.freeze(["Doppler", "Day 1", "Re:Invent", "Roxanne Coffee", "Arizona Coffee"]),
    global: Object.freeze(["Bingo", "Grace", "Sonic", "Blueshift", "105", "Everest", "Gemini", "Astra", "Doppler", "Day 1", "Nitro", "Re:Invent"]),
    breakfast: Object.freeze(["Roxanne Coffee", "Arizona Coffee"]),
  }),
});

const PACKOUT_GLOBAL_SONIC_CAFES = Object.freeze([
  "Bingo", "Grace", "Sonic", "Blueshift", "105", "Everest", "Gemini", "Astra",
  "Doppler", "Day 1", "Nitro", "Re:Invent",
]);

export const COMMISSARY_PACKOUT_HUB_ROUTING = Object.freeze({
  Cricket: COMMISSARY_HUB_ROUTING.Cricket,
  Sonic: Object.freeze({ ...COMMISSARY_HUB_ROUTING.Sonic, global: PACKOUT_GLOBAL_SONIC_CAFES }),
  Blueshift: Object.freeze({ ...COMMISSARY_HUB_ROUTING.Blueshift, global: Object.freeze([]) }),
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

export function cafeRoutesToPackoutHub(cafe, station, hub) {
  return COMMISSARY_PACKOUT_HUB_ROUTING[hub]?.[station]?.includes(cafe) || false;
}
