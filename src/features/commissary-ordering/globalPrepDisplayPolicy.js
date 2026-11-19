const MASS_UNIT_TO_OUNCES = Object.freeze({
  ounce: 1, ounces: 1, oz: 1,
  pound: 16, pounds: 16, lb: 16, lbs: 16,
  gram: 1 / 28.349523125, grams: 1 / 28.349523125, g: 1 / 28.349523125,
  kilogram: 1000 / 28.349523125, kilograms: 1000 / 28.349523125, kg: 1000 / 28.349523125,
});

const PREPARED_VOLUME_MRNS = Object.freeze([
  "96597", "4181", "4179", "9058", "4213", "4235", "7700", "7542", "7547", "15490", "1781",
  "81037.2", "145111", "141044.1", "176612", "1185", "1252", "53211", "1780", "56048", "2893", "4233",
  "33992.63", "15306.1", "76476", "5633.3", "5663.1", "155947", "143669.1", "101685",
  "56177", "51971", "4257", "4254", "4295", "7796", "78541", "40773.2", "76476.2", "228203", "7552",
  "9057", "1330", "51405", "50595", "2142", "130495", "3678", "4877", "6173", "78541.1", "54497", "7548",
  "165741.32", "165741.26", "1190", "53304", "1246", "1253", "120683", "16468", "3769", "4229", "54495", "4216",
  "7954", "9061", "55397", "53208", "165999", "85813", "1184", "1193", "130775", "1389", "83591", "142874", "4236",
  "4215", "4218", "6566", "3787", "7073", "7545",
]);

const LIQUID_OR_PASTE_OUNCES_PER_CUP = Object.freeze({
  "3543": 8, "3542": 8, "2894": 8, "45663": 8, "78536": 8,
  "84039": 8, "84042": 8, "84042.1": 8, "15323": 8, "4203": 8,
  "140952": 8, "48655": 8, "24866": 8, "3190": 12, "191759": 8,
  "1158": 8, "3434": 8, "3": 8, "116445": 8, "7637": 8,
  "4138": 8, "7346": 8,
});

const NAME_OUNCES_PER_CUP = Object.freeze({
  "Cucumbers, English, Fresh, Sliced, Thin, on Bias": 4,
  "Ginger Root, Fresh, Julienne Sliced": 4,
  "Tomatoes, Fresh, Julienne Sliced": 4,
  "Cabbage, Red, Fresh, Shredded": 4,
  "Carrots, Fresh, Grated": 4,
  "Lettuce, Iceberg, Fresh, Chopped": 4,
  "Corn, Whole Kernel, Frozen": 4,
  "Oil, Olive, Extra Virgin": 8,
});

const CUT_ONION_OR_PEPPER = /\b(?:onions?|peppers?)\b.*\b(?:chopped|diced|sliced|julienne|minced|halved|cubed|pieces?|rings?)\b/i;
const CUT_PRODUCE_CUPS_PER_EACH = Object.freeze({
  "4251": 0.25, // sliced scallion bunch
  "3787": 1, // diced red bell pepper
  "7711": 0.125, // minced serrano
  "96597": 2, // diced white onion
  "24701": 0.0625, // minced habanero
  "53211": 0.125, // sliced Fresno pepper
  "4176": 2, // diced yellow onion
  "4257": 2, // diced red onion
  "7694": 0.125, // sliced serrano
  "4215": 2, // minced yellow onion
  "55883": 0.125, // chopped Fresno pepper
  "50595": 4, // sliced English cucumber
  "2893": 1 / 48, // minced garlic clove
});

export const GLOBAL_PREP_DISPLAY_POLICY = Object.freeze({
  version: 1,
  scope: "prep-list-only",
  transferAndGlQuantities: "recipe-native-unchanged",
  preparedVolumeMrns: PREPARED_VOLUME_MRNS,
  liquidOrPasteOuncesPerCup: LIQUID_OR_PASTE_OUNCES_PER_CUP,
  nameOuncesPerCup: NAME_OUNCES_PER_CUP,
  cutOnionOrPepperOuncesPerCup: 4,
  cutProduceCupsPerEach: CUT_PRODUCE_CUPS_PER_EACH,
  conditionalNativeWeightMrns: Object.freeze(["84052", "49473", "76662"]),
  packageRules: Object.freeze([
    Object.freeze({ mrn: "8061", name: "Spinach, Baby, Fresh", poundsPerPackage: 2.5, displayUnit: "2.5-pound bag", trueCostEach: 6 }),
    Object.freeze({ mrn: "95860", name: "Kale, Lacinato (Dinosaur), Fresh", poundsPerPackage: 2.5, displayUnit: "2.5-pound bag", trueCostEach: null }),
  ]),
});

export function globalPrepCupsPerUnit(row = {}) {
  if (row.station !== "Global") return 0;
  const unit = String(row.orderUnit || row.unit || "").trim().toLowerCase();
  const mrn = String(row.mrn || "");
  const name = String(row.name || "");
  if (["each", "ea"].includes(unit) && CUT_PRODUCE_CUPS_PER_EACH[mrn]) return CUT_PRODUCE_CUPS_PER_EACH[mrn];
  const ouncesPerUnit = MASS_UNIT_TO_OUNCES[unit];
  if (!ouncesPerUnit) return 0;
  const ouncesPerCup = LIQUID_OR_PASTE_OUNCES_PER_CUP[mrn]
    || NAME_OUNCES_PER_CUP[name]
    || (PREPARED_VOLUME_MRNS.includes(mrn) ? 4 : 0)
    || (CUT_ONION_OR_PEPPER.test(name) ? 4 : 0);
  return ouncesPerCup ? ouncesPerUnit / ouncesPerCup : 0;
}

export function globalPrepPackageRule(row = {}) {
  if (row.station !== "Global") return null;
  const mrn = String(row.mrn || "");
  const name = String(row.name || "");
  return GLOBAL_PREP_DISPLAY_POLICY.packageRules.find((rule) => rule.mrn === mrn && rule.name === name) || null;
}

