export const COMMISSARY_SPANISH = Object.freeze({
  categories: Object.freeze({
    Toppings: "Coberturas",
    Proteins: "Proteínas",
    "Crunchy Toppers": "Ingredientes crujientes",
    Cheese: "Quesos",
    Dressings: "Aderezos",
  }),
  units: Object.freeze({
    quart: "cuarto",
    gallon: "galón",
    "3-pound container": "recipiente de 3 libras",
    "5-liter container": "recipiente de 5 litros",
    "32-ounce bottle": "botella de 32 onzas",
  }),
  items: Object.freeze({
    "Sliced Cucumber": "Pepino en rodajas",
    "Baby Arugula": "Rúcula baby",
    "Black Beans": "Frijoles negros",
    "Chopped Kale": "Col rizada picada",
    "Green Peas": "Chícharos verdes",
    "Sliced Red Bell Pepper": "Pimiento rojo en rodajas",
    "Spring Mix": "Mezcla de hojas tiernas",
    "Sliced Red Onion": "Cebolla morada en rodajas",
    "Shredded Red Cabbage": "Col morada rallada",
    "Sliced Radishes": "Rábanos en rodajas",
    "Tri-Color Quinoa": "Quinoa tricolor",
    "Herbed Bulgur": "Bulgur con hierbas",
    "Blanched Broccoli": "Brócoli blanqueado",
    "Marinated Artichokes": "Alcachofas marinadas",
    "Marinated Chickpeas": "Garbanzos marinados",
    "Spiced Edamame": "Edamame especiado",
    "Pickled Red Onions": "Cebollas moradas encurtidas",
    "Broccoli Kimchi": "Kimchi de brócoli",
    "Grape Tomatoes": "Tomates uva",
    "Shredded Carrots": "Zanahorias ralladas",
    "Banana Pepper Rings": "Aros de chile banana",
    "Sliced Black Olives": "Aceitunas negras en rodajas",
    "Chopped Hard Boiled Eggs": "Huevos cocidos picados",
    "Diced Ham": "Jamón en cubos",
    "Herb Marinated Chicken Breast": "Pechuga de pollo marinada con hierbas",
    "Garlic Herb Marinated Tofu": "Tofu marinado con ajo y hierbas",
    "Dried Cranberries": "Arándanos rojos secos",
    "Seasoned Croutons": "Crotones sazonados",
    "Fried Corn Tortilla Strips": "Tiras de tortilla de maíz fritas",
    "Blue Cheese Crumbles": "Queso azul desmoronado",
    "Crumbled Feta Cheese": "Queso feta desmoronado",
    "Shredded Cheddar Cheese": "Queso cheddar rallado",
    "4% Full Fat Cottage Cheese": "Requesón 4% grasa",
    "1000 Island Dressing": "Aderezo Mil Islas",
    "Balsamic Vinaigrette Dressing": "Vinagreta balsámica",
    "Balsamic Vinegar": "Vinagre balsámico",
    "Fat Free Italian Dressing": "Aderezo italiano sin grasa",
    "Honey Mustard Dressing": "Aderezo de mostaza y miel",
    "Olive Oil": "Aceite de oliva",
    "Ranch Dressing": "Aderezo ranch",
    "Red Wine Vinegar": "Vinagre de vino tinto",
  }),
});

export function commissarySpanishItem(name) {
  return COMMISSARY_SPANISH.items[name] || name;
}

export function commissarySpanishCategory(category) {
  return COMMISSARY_SPANISH.categories[category] || category;
}

export function commissarySpanishUnit(unit) {
  return COMMISSARY_SPANISH.units[unit] || unit;
}
