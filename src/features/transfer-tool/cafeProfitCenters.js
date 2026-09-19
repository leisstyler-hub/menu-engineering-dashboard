export const CAFE_PROFIT_CENTERS = Object.freeze({
  Doppler: "30786",
  "Day 1": "30871",
  Nitro: "51641",
  "Re:Invent": "47622",
  Dawson: "28676",
  Nessie: "30159",
  Cricket: "22472",
  Moby: "28671",
  Commissary: "28675",
  Atlas: "35983",
  Bingo: "53170",
  Sonic: "62102",
  Blueshift: "56746",
  Grace: "53172",
});

export const cafeProfitCenter = (cafe = "") => CAFE_PROFIT_CENTERS[String(cafe || "").trim()] || "";
