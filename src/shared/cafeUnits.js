export const CAFE_UNITS_BY_DISTRICT = Object.freeze({
  South: ["Doppler", "Day 1", "Nitro", "Re:Invent"],
  North: ["Dawson", "Nessie", "Cricket", "Moby", "Commissary", "Atlas"],
  East: ["Astra", "Bingo", "Sonic", "Blueshift", "Eclipse", "Grace"],
  LAX: ["LAX22", "LAX35", "LAX75", "LAX78", "SNA3"],
});

export const CAFE_UNITS = Object.freeze(Object.entries(CAFE_UNITS_BY_DISTRICT).flatMap(([district, cafes]) => (
  cafes.map((cafe) => ({ district, cafe }))
)));
