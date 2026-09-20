import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const inputPath = "C:/Users/12064/Downloads/Palette Onboarding to RMP - Sample Excel Input (Edit)-2026-08-27.xlsx";
const outputPath = "C:/Users/12064/OneDrive/Documents/PC - Culinary Platform/outputs/rmp-recipe-intake/Palette Onboarding to RMP - populated ingredients.xlsx";

const profiles = {
  basmatiRice: ["165741.34", "INDIAN", "LOW_SPICE|SAVORY", "BASE", null, "VEGAN|VEGETARIAN", null, "Water, Basmati Rice, Kosher Salt, Ginger Root, Bay Leaf.", "LOW", "WHITE", "Fluffy long-grain white basmati rice", "N"],
  roastedChickenThigh: ["52581.2", "INDIAN", "SAVORY", "PROTEIN", "HIGH_PROTEIN", null, null, "Skinless, boneless chicken thigh, canola oil, kosher salt, ground black pepper.", "MEDIUM", "BROWN", "Roasted brown chicken thigh, lightly seasoned", "N"],
  makhniSauce: ["165741.108", "INDIAN", "MEDIUM_SPICE|SAVORY", "SAUCE", null, "VEGETARIAN", "MILK", "Dhaba ginger garlic paste, canola oil, cumin seed, serrano peppers, garam masala, ground coriander, diced onions, tomato paste, ground tomatoes, fenugreek leaves, heavy whipping cream, unsalted butter.", "MEDIUM", "ORANGE", "Smooth orange tomato cream sauce", "N"],
  chanaMasala: ["165741.24", "INDIAN", "MEDIUM_SPICE|SAVORY", "VEGGIES", null, "VEGAN|VEGETARIAN", null, "Chana Masala, Cilantro.", "MEDIUM", "ORANGE", "Chickpeas in orange-red masala sauce", "N"],
  kachumbar: ["165741.11", "INDIAN", "TANGY|LOW_SPICE", "VEGGIES", null, "VEGAN|VEGETARIAN", null, "Cucumber, Red Onions, Tomatoes, Cilantro Chutney, Tamarind Chutney, Ginger Root, Serrano Pepper.", "HIGH", "RED", "Fresh cucumber, tomato, and red onion salad", "N"],
  raita: ["81281", "INDIAN", "TANGY|LOW_SPICE", "SAUCE", null, "VEGETARIAN", "MILK", "Fat Free Plain Greek Yogurt, Roma Tomatoes, Yellow Onions, Extra Virgin Olive Oil, Water, Jalapeno, Ginger Paste, Mustard, Cumin, Turmeric, Cayenne Pepper.", "LOW", "WHITE", "Creamy white yogurt sauce with tomato and cucumber-style garnish", "N"],
  cilantroChutney: ["81768", "INDIAN", "MEDIUM_SPICE|TANGY", "SAUCE", null, "VEGAN|VEGETARIAN", null, "Seasoned Rice Vinegar, Sugar, Cilantro, Jalapeno, Garlic, Lime, Ginger Root, Kosher Salt.", "MEDIUM", "GREEN", "Bright green cilantro herb sauce", "N"],
  cilantro: [null, "INDIAN", "LOW_SPICE", "GARNISH", null, "VEGAN|VEGETARIAN", null, "Fresh cilantro, chopped.", "HIGH", "GREEN", "Fresh chopped green cilantro leaves", "N"],
  palakSauce: [null, "INDIAN", "MEDIUM_SPICE|SAVORY", "SAUCE", null, "VEGETARIAN", "MILK", "Dhaba ginger garlic paste, Bhuna Masala, serrano peppers, cumin seed, fenugreek leaves, canola oil, unsalted butter, water, cilantro, heavy whipping cream, baby spinach, lemon juice, kosher salt.", "MEDIUM", "GREEN", "Smooth green spinach cream sauce", "N"],
};

const rowProfiles = new Map([
  [13, "basmatiRice"], [14, "roastedChickenThigh"], [15, "makhniSauce"], [16, "chanaMasala"], [17, "kachumbar"], [18, "raita"], [19, "cilantroChutney"], [20, "cilantro"],
  [22, "basmatiRice"], [24, "makhniSauce"], [25, "chanaMasala"], [26, "kachumbar"], [27, "raita"], [28, "cilantroChutney"], [29, "cilantro"],
  [31, "basmatiRice"], [33, "palakSauce"], [34, "chanaMasala"], [35, "kachumbar"], [36, "raita"], [37, "cilantroChutney"], [38, "cilantro"],
  [40, "basmatiRice"], [42, "palakSauce"], [43, "chanaMasala"], [44, "kachumbar"], [45, "raita"], [46, "cilantroChutney"], [47, "cilantro"],
]);
const rowsToClear = [12, 21, 23, 30, 32, 39, 41];
const headingRows = new Map([
  [12, "Butter Chicken"],
  [21, "Paneer Makhni"],
  [30, "Chicken Palak"],
  [39, "Palak Paneer"],
]);
const rowNameOverrides = new Map([[14, "Roasted Chicken Thigh"]]);

const input = await FileBlob.load(inputPath);
const workbook = await SpreadsheetFile.importXlsx(input);
const sheet = workbook.worksheets.getItem("Ingredients");
const nutritionSheet = workbook.worksheets.getItem("Nutrition");

if (process.argv.includes("--inspect")) {
  const sourcePreview = await workbook.render({ sheetName: "Ingredients", range: "A1:R47", scale: 1.5, format: "png" });
  await fs.mkdir("C:/Users/12064/OneDrive/Documents/PC - Culinary Platform/tmp/rmp-recipe-intake", { recursive: true });
  await fs.writeFile("C:/Users/12064/OneDrive/Documents/PC - Culinary Platform/tmp/rmp-recipe-intake/ingredients-before.png", new Uint8Array(await sourcePreview.arrayBuffer()));
  const check = await workbook.inspect({ kind: "table", range: "Ingredients!A1:R47", include: "values,formulas", tableMaxRows: 47, tableMaxCols: 18 });
  console.log(check.ndjson);
  process.exit(0);
}

sheet.getRange("A12:A47").setNumberFormat("@");
for (const rowNumber of rowsToClear) {
  sheet.getRange(`A${rowNumber}:R${rowNumber}`).values = [Array(18).fill(null)];
}
for (const [rowNumber, heading] of headingRows) {
  sheet.getRange(`B${rowNumber}`).values = [[heading]];
}
for (const [rowNumber, profileName] of rowProfiles) {
  const [mrn, cuisine, flavor, groupTypes, callouts, dietTypes, allergens, statement, visualImpact, colorFamily, visualDescriptor, visuallyPromoted] = profiles[profileName];
  const row = sheet.getRange(`A${rowNumber}:R${rowNumber}`).values[0];
  row[0] = mrn;
  if (rowNameOverrides.has(rowNumber)) row[1] = rowNameOverrides.get(rowNumber);
  row[5] = callouts;
  row[6] = dietTypes;
  row[7] = allergens;
  row[8] = statement;
  row[14] = visualImpact;
  row[15] = colorFamily;
  row[16] = visualDescriptor;
  row[17] = visuallyPromoted;
  sheet.getRange(`A${rowNumber}:R${rowNumber}`).values = [row];
}

const nutritionProfiles = {
  basmatiRice: ["165741.34", "Basmati Rice", 181.995, "GRAM", 225.587, 0.412, 0.112, 0, 0, 471.986, 49.414, 0.814, 0.085, 0, 4.408, 0, 21.211, 2.666, 74.812],
  roastedChickenThigh: ["52581.2", "Roasted Chicken Thigh", 83.5235, "GRAM", 166.286, 9.074, 2.041, 0.045, 106.626, 344.693, 0.095, 0.038, 0.001, 0, 19.866, 0.16, 8.035, 0.923, 217.688],
  makhniSauce: ["165741.108", "Makhni Sauce", 236.3354, "GRAM", 260.737, 18.911, 9.347, 0.17, 40.349, 321.896, 19.281, 4.974, 10.536, 0, 4.957, 0.203, 46.564, 3.095, 903.711],
  chanaMasala: ["165741.24", "Chana Masala", 114.056, "GRAM", 99.273, 3.394, 0.442, 0.011, 0, 360.206, 14.607, 2.604, 3.272, 0, 3.631, 0, 51.187, 1.667, 219.963],
  kachumbar: ["165741.11", "Kachumbar", 127.154, "GRAM", 41.087, 0.301, 0.046, 0, 0, 76.025, 9.495, 1.361, 5.446, 2.148, 1.05, 0, 21.484, 0.396, 221.232],
  raita: ["81281", "Raita Sauce", 53.652, "GRAM", 50.596, 2.623, 0.357, 0, 0.735, 17.838, 2.384, 0.177, 1.749, 0, 4.326, 0, 49.533, 0.213, 68.186],
  cilantroChutney: ["81768", "Spicy Cilantro Chutney", 15.925, "GRAM", 27.216, 0.03, 0.004, 0, 0, 168.875, 6.754, 0.167, 5.945, 5.801, 0.134, 0, 3.878, 0.071, 25.624],
  cilantro: [null, "Cilantro, chopped", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
  // Canonical vegetarian Palak Sauce: Palak Paneer total minus its paneer ingredient.
  // Paneer has no reported potassium, iron, or vitamin D values, so those sauce fields remain blank.
  palakSauce: [null, "Palak Sauce", 109.5637, "GRAM", 189.928, 16.664, 8.698, 0.202, 37.126, 522.429, 6.749, 2.009, 2.162, 0, 2.642, null, 67.604, null, null],
};
const nutritionRowProfiles = new Map([
  [13, "basmatiRice"], [14, "roastedChickenThigh"], [15, "makhniSauce"], [16, "chanaMasala"], [17, "kachumbar"], [18, "raita"], [19, "cilantroChutney"], [20, "cilantro"],
  [22, "basmatiRice"], [24, "makhniSauce"], [25, "chanaMasala"], [26, "kachumbar"], [27, "raita"], [28, "cilantroChutney"], [29, "cilantro"],
  [31, "basmatiRice"], [33, "palakSauce"], [34, "chanaMasala"], [35, "kachumbar"], [36, "raita"], [37, "cilantroChutney"], [38, "cilantro"],
  [40, "basmatiRice"], [42, "palakSauce"], [43, "chanaMasala"], [44, "kachumbar"], [45, "raita"], [46, "cilantroChutney"], [47, "cilantro"],
]);

for (let rowNumber = 12; rowNumber <= 47; rowNumber += 1) {
  nutritionSheet.getRange("A2:S2").copyTo(nutritionSheet.getRange(`A${rowNumber}:S${rowNumber}`), "all");
  nutritionSheet.getRange(`A${rowNumber}:S${rowNumber}`).values = [Array(19).fill(null)];
}
for (const [rowNumber, heading] of headingRows) {
  sheet.getRange(`B${rowNumber}`).copyTo(nutritionSheet.getRange(`B${rowNumber}`), "all");
  nutritionSheet.getRange(`B${rowNumber}`).values = [[heading]];
}
for (const [rowNumber, profileName] of nutritionRowProfiles) {
  nutritionSheet.getRange(`A${rowNumber}:S${rowNumber}`).values = [nutritionProfiles[profileName]];
}
nutritionSheet.getRange("A12:A47").setNumberFormat("@");
nutritionSheet.getRange("C12:C47").setNumberFormat("0.###");
nutritionSheet.getRange("E12:S47").setNumberFormat("0.###");

const recipeRows = [
  ["165741.16", "Butter Chicken", "FINISHED_GOOD", "INDIAN", "MEDIUM_SPICE|SAVORY", null, "HIGH_PROTEIN", null, null, null, null, null, null, "HIGH", "ORANGE", "Creamy orange tomato curry with diced chicken pieces", "Y"],
  ["165741.20", "Paneer Makhni", "FINISHED_GOOD", "INDIAN", "MEDIUM_SPICE|SAVORY", null, null, "VEGETARIAN", null, null, null, null, null, "HIGH", "ORANGE", "Creamy orange tomato curry with paneer", "Y"],
  ["165741.14", "Chicken Palak", "FINISHED_GOOD", "INDIAN", "MEDIUM_SPICE|SAVORY", null, "HIGH_PROTEIN", null, null, null, null, null, null, "HIGH", "GREEN", "Green spinach curry with roasted chicken", "Y"],
  ["165741.5", "Palak Paneer", "FINISHED_GOOD", "INDIAN", "MEDIUM_SPICE|SAVORY", null, null, "VEGETARIAN", null, null, null, null, null, "HIGH", "GREEN", "Green spinach curry with paneer", "Y"],
  ["52581.2", "Roasted Chicken Thigh", "SEMI_FINISHED_GOOD", "INDIAN", "SAVORY", "PROTEIN", "HIGH_PROTEIN", null, 43, "EACH", 83.5235, "GRAM", null, "MEDIUM", "BROWN", "Roasted brown chicken thigh, lightly seasoned", "N"],
  ["165741.108", "Makhni Sauce", "SEMI_FINISHED_GOOD", "INDIAN", "MEDIUM_SPICE|SAVORY", "SAUCE", null, "VEGETARIAN", 75, "EACH", 236.3354, "GRAM", null, "MEDIUM", "ORANGE", "Smooth orange tomato cream sauce", "N"],
  ["165741.34", "Basmati Rice", "SEMI_FINISHED_GOOD", "INDIAN", "LOW_SPICE|SAVORY", "BASE", null, "VEGAN|VEGETARIAN", null, null, 181.995, "GRAM", null, "LOW", "WHITE", "Fluffy long-grain white basmati rice", "N"],
  ["165741.24", "Chana Masala", "SEMI_FINISHED_GOOD", "INDIAN", "MEDIUM_SPICE|SAVORY", "VEGGIES", null, "VEGAN|VEGETARIAN", null, null, 114.056, "GRAM", null, "MEDIUM", "ORANGE", "Chickpeas in orange-red masala sauce", "N"],
  ["165741.11", "Kachumbar", "SEMI_FINISHED_GOOD", "INDIAN", "TANGY|LOW_SPICE", "VEGGIES", null, "VEGAN|VEGETARIAN", null, null, 127.154, "GRAM", null, "HIGH", "RED", "Fresh cucumber, tomato, and red onion salad", "N"],
  ["81281", "Raita Sauce", "SEMI_FINISHED_GOOD", "INDIAN", "TANGY|LOW_SPICE", "SAUCE", null, "VEGETARIAN", null, null, 53.652, "GRAM", null, "LOW", "WHITE", "Creamy white yogurt sauce", "N"],
  ["81768", "Spicy Cilantro Chutney", "SEMI_FINISHED_GOOD", "INDIAN", "MEDIUM_SPICE|TANGY", "SAUCE", null, "VEGAN|VEGETARIAN", null, null, 15.925, "GRAM", null, "MEDIUM", "GREEN", "Bright green cilantro herb sauce", "N"],
  [null, "Palak Sauce", "WORK_IN_PROGRESS", "INDIAN", "MEDIUM_SPICE|SAVORY", "SAUCE", null, "VEGETARIAN", 24, "EACH", 109.5637, "GRAM", null, "MEDIUM", "GREEN", "Smooth green spinach cream sauce", "N"],
];
const recipesSheet = workbook.worksheets.getItem("Recipes");
for (let index = 0; index < recipeRows.length; index += 1) {
  const rowNumber = index + 4;
  recipesSheet.getRange("A2:Q2").copyTo(recipesSheet.getRange(`A${rowNumber}:Q${rowNumber}`), "all");
  recipesSheet.getRange(`A${rowNumber}:Q${rowNumber}`).values = [recipeRows[index]];
}
recipesSheet.getRange(`A4:A${recipeRows.length + 3}`).setNumberFormat("@");
recipesSheet.getRange(`I4:I${recipeRows.length + 3}`).setNumberFormat("0.###");
recipesSheet.getRange(`K4:K${recipeRows.length + 3}`).setNumberFormat("0.###");

const bomRows = [
  // Butter Chicken: 1 base, 1 protein, 3 sauces, and 2 vegetable sides.
  ["165741.16", "BASE", "Y", 1, 1, "165741.34", "RECIPE", "Y", 181.995, "GRAM"],
  ["165741.16", "PROTEIN", "Y", 1, 1, "52581.2", "RECIPE", "Y", 83.5235, "GRAM"],
  ["165741.16", "SAUCE", "Y", 3, 3, "165741.108", "RECIPE", "Y", 236.3354, "GRAM"],
  ["165741.16", "SAUCE", "Y", 3, 3, "81281", "RECIPE", "Y", 53.652, "GRAM"],
  ["165741.16", "SAUCE", "Y", 3, 3, "81768", "RECIPE", "Y", 15.925, "GRAM"],
  ["165741.16", "VEGGIES", "Y", 2, 2, "165741.24", "RECIPE", "Y", 114.056, "GRAM"],
  ["165741.16", "VEGGIES", "Y", 2, 2, "165741.11", "RECIPE", "Y", 127.154, "GRAM"],
  // Paneer Makhni intentionally retains the protein-free component set supplied for this intake.
  ["165741.20", "BASE", "Y", 1, 1, "165741.34", "RECIPE", "Y", 181.995, "GRAM"],
  ["165741.20", "SAUCE", "Y", 3, 3, "165741.108", "RECIPE", "Y", 236.3354, "GRAM"],
  ["165741.20", "SAUCE", "Y", 3, 3, "81281", "RECIPE", "Y", 53.652, "GRAM"],
  ["165741.20", "SAUCE", "Y", 3, 3, "81768", "RECIPE", "Y", 15.925, "GRAM"],
  ["165741.20", "VEGGIES", "Y", 2, 2, "165741.24", "RECIPE", "Y", 114.056, "GRAM"],
  ["165741.20", "VEGGIES", "Y", 2, 2, "165741.11", "RECIPE", "Y", 127.154, "GRAM"],
  // Palak Sauce cannot be linked until an approved MRN is assigned; known sides are added now.
  ["165741.14", "BASE", "Y", 1, 1, "165741.34", "RECIPE", "Y", 181.995, "GRAM"],
  ["165741.14", "SAUCE", "Y", 2, 2, "81281", "RECIPE", "Y", 53.652, "GRAM"],
  ["165741.14", "SAUCE", "Y", 2, 2, "81768", "RECIPE", "Y", 15.925, "GRAM"],
  ["165741.14", "VEGGIES", "Y", 2, 2, "165741.24", "RECIPE", "Y", 114.056, "GRAM"],
  ["165741.14", "VEGGIES", "Y", 2, 2, "165741.11", "RECIPE", "Y", 127.154, "GRAM"],
  ["165741.5", "BASE", "Y", 1, 1, "165741.34", "RECIPE", "Y", 181.995, "GRAM"],
  ["165741.5", "SAUCE", "Y", 2, 2, "81281", "RECIPE", "Y", 53.652, "GRAM"],
  ["165741.5", "SAUCE", "Y", 2, 2, "81768", "RECIPE", "Y", 15.925, "GRAM"],
  ["165741.5", "VEGGIES", "Y", 2, 2, "165741.24", "RECIPE", "Y", 114.056, "GRAM"],
  ["165741.5", "VEGGIES", "Y", 2, 2, "165741.11", "RECIPE", "Y", 127.154, "GRAM"],
];
const bomSheet = workbook.worksheets.getItem("BOM");
for (let index = 0; index < bomRows.length; index += 1) {
  const rowNumber = index + 12;
  bomSheet.getRange("A2:J2").copyTo(bomSheet.getRange(`A${rowNumber}:J${rowNumber}`), "all");
  bomSheet.getRange(`A${rowNumber}:J${rowNumber}`).values = [bomRows[index]];
}
bomSheet.getRange(`A12:A${bomRows.length + 11}`).setNumberFormat("@");
bomSheet.getRange(`F12:F${bomRows.length + 11}`).setNumberFormat("@");
bomSheet.getRange(`D12:E${bomRows.length + 11}`).setNumberFormat("0");
bomSheet.getRange(`I12:I${bomRows.length + 11}`).setNumberFormat("0.###");

// RMP routings reference recipe SKUs. Add only the single, supported operational
// step that is clear from the confirmed recipe/component data; the detailed recipe
// method remains the authority for exact process parameters.
const routingRows = [
  ["165741.16", 1, "Assemble rice, chicken, Makhni sauce, Chana Masala, Kachumbar, raita, and chutney to approved portions.", "ASSEMBLY", null],
  ["165741.20", 1, "Assemble rice, Makhni sauce, Chana Masala, Kachumbar, raita, and chutney to approved portions.", "ASSEMBLY", null],
  ["165741.14", 1, "Assemble rice, Palak Sauce, Chana Masala, Kachumbar, raita, and chutney to approved portions.", "ASSEMBLY", null],
  ["165741.5", 1, "Assemble rice, Palak Sauce, Chana Masala, Kachumbar, raita, and chutney to approved portions.", "ASSEMBLY", null],
  ["52581.2", 1, "Roast chicken thighs to the approved internal temperature; hold or cool and portion.", "COOK", "OVEN"],
  ["165741.108", 1, "Cook Makhni Sauce per the approved recipe; hot-hold or cool according to the service plan.", "COOK", "HOT_KITCHEN"],
  ["165741.34", 1, "Cook basmati rice; fluff and portion.", "COOK", "BOIL_STATION"],
  ["165741.24", 1, "Cook Chana Masala per the approved recipe; hot-hold or cool according to the service plan.", "COOK", "HOT_KITCHEN"],
  ["165741.11", 1, "Wash, cut, and combine vegetables and sauces; hold cold.", "PREP", null],
  ["81281", 1, "Combine ingredients and mix until uniform; hold cold.", "MIX", null],
  ["81768", 1, "Combine and blend ingredients until smooth; hold cold.", "MIX", null],
];
const routingsSheet = workbook.worksheets.getItem("Routings");
for (let index = 0; index < routingRows.length; index += 1) {
  const rowNumber = index + 6;
  routingsSheet.getRange("A2:E2").copyTo(routingsSheet.getRange(`A${rowNumber}:E${rowNumber}`), "all");
  routingsSheet.getRange(`A${rowNumber}:E${rowNumber}`).values = [routingRows[index]];
}
routingsSheet.getRange(`A6:A${routingRows.length + 5}`).setNumberFormat("@");
routingsSheet.getRange(`B6:B${routingRows.length + 5}`).setNumberFormat("0");
routingsSheet.getRange(`A1:A${routingRows.length + 5}`).format.columnWidth = 15;
routingsSheet.getRange(`B1:B${routingRows.length + 5}`).format.columnWidth = 10;
routingsSheet.getRange(`C1:C${routingRows.length + 5}`).format.columnWidth = 90;
routingsSheet.getRange(`D1:D${routingRows.length + 5}`).format.columnWidth = 20;
routingsSheet.getRange(`E1:E${routingRows.length + 5}`).format.columnWidth = 20;

workbook.recalculate();
const check = await workbook.inspect({ kind: "table", range: "Ingredients!A12:R47", include: "values,formulas", tableMaxRows: 36, tableMaxCols: 18 });
console.log(check.ndjson);
const nutritionCheck = await workbook.inspect({ kind: "table", range: "Nutrition!A12:S47", include: "values,formulas", tableMaxRows: 36, tableMaxCols: 19 });
console.log(nutritionCheck.ndjson);
const recipesCheck = await workbook.inspect({ kind: "table", range: `Recipes!A1:Q${recipeRows.length + 3}`, include: "values,formulas", tableMaxRows: recipeRows.length + 3, tableMaxCols: 17 });
console.log(recipesCheck.ndjson);
const bomCheck = await workbook.inspect({ kind: "table", range: `BOM!A1:J${bomRows.length + 11}`, include: "values,formulas", tableMaxRows: bomRows.length + 11, tableMaxCols: 10 });
console.log(bomCheck.ndjson);
const routingsCheck = await workbook.inspect({ kind: "table", range: `Routings!A1:E${routingRows.length + 5}`, include: "values,formulas", tableMaxRows: routingRows.length + 5, tableMaxCols: 5 });
console.log(routingsCheck.ndjson);
const preview = await workbook.render({ sheetName: "Ingredients", range: "A1:R47", scale: 1.5, format: "png" });
await fs.mkdir("C:/Users/12064/OneDrive/Documents/PC - Culinary Platform/tmp/rmp-recipe-intake", { recursive: true });
await fs.writeFile("C:/Users/12064/OneDrive/Documents/PC - Culinary Platform/tmp/rmp-recipe-intake/ingredients-after.png", new Uint8Array(await preview.arrayBuffer()));
const nutritionPreview = await workbook.render({ sheetName: "Nutrition", range: "A1:S47", scale: 1.5, format: "png" });
await fs.writeFile("C:/Users/12064/OneDrive/Documents/PC - Culinary Platform/tmp/rmp-recipe-intake/nutrition-after.png", new Uint8Array(await nutritionPreview.arrayBuffer()));
const recipesPreview = await workbook.render({ sheetName: "Recipes", range: `A1:Q${recipeRows.length + 3}`, scale: 1.5, format: "png" });
await fs.writeFile("C:/Users/12064/OneDrive/Documents/PC - Culinary Platform/tmp/rmp-recipe-intake/recipes-after.png", new Uint8Array(await recipesPreview.arrayBuffer()));
const bomPreview = await workbook.render({ sheetName: "BOM", range: `A1:J${bomRows.length + 11}`, scale: 1.5, format: "png" });
await fs.writeFile("C:/Users/12064/OneDrive/Documents/PC - Culinary Platform/tmp/rmp-recipe-intake/bom-after.png", new Uint8Array(await bomPreview.arrayBuffer()));
const routingsPreview = await workbook.render({ sheetName: "Routings", range: `A1:E${routingRows.length + 5}`, scale: 1.5, format: "png" });
await fs.writeFile("C:/Users/12064/OneDrive/Documents/PC - Culinary Platform/tmp/rmp-recipe-intake/routings-after.png", new Uint8Array(await routingsPreview.arrayBuffer()));
await fs.mkdir(path.dirname(outputPath), { recursive: true });
const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);
console.log(`WROTE ${outputPath}`);
