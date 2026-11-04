// Generated from public/resources/Ingredient_Costing_9.19.26.xlsx.
// Run node scripts/build-commissary-grill-lto-catalog.mjs after the source workbook changes.

export const GRILL_LTO_PROGRAM = Object.freeze({
  "version": 2,
  "menu": "AMZ: Grill Core",
  "station": "Spotlights",
  "anchorWeekStart": "2026-11-16",
  "cycleLengthWeeks": 6,
  "effectiveDate": "2026-11-16",
  "coreDefaultStartWeek": "2026-11-16",
  "coreStartWeekByCafe": {
    "Atlas": "2026-11-09"
  },
  "eligibleCafes": [
    "Cricket",
    "Nessie",
    "Dawson",
    "Atlas",
    "Bingo",
    "Grace",
    "Blueshift",
    "Sonic",
    "Astra",
    "Day 1",
    "Nitro",
    "Re:Invent"
  ],
  "quantityIncrement": 1,
  "orderUnit": "sandwich",
  "source": "Supabase recipe_items + Ingredient Costing 9.19.26",
  "cycleWeeks": [
    {
      "week": 1,
      "setA": [
        {
          "mrn": "77139.72",
          "name": "ATX Burger"
        },
        {
          "mrn": "13773.6",
          "name": "Mushroom Swiss Burger"
        }
      ],
      "setB": [
        {
          "mrn": "77139.68",
          "name": "Diablo Burger"
        },
        {
          "mrn": "64908.6",
          "name": "Southwest Burger"
        }
      ]
    },
    {
      "week": 2,
      "setA": [
        {
          "mrn": "77139.68",
          "name": "Diablo Burger"
        },
        {
          "mrn": "64908.6",
          "name": "Southwest Burger"
        }
      ],
      "setB": [
        {
          "mrn": "107045.1",
          "name": "Brunch Burger"
        },
        {
          "mrn": "91861.2",
          "name": "BBQ Brisket Smashburger"
        }
      ]
    },
    {
      "week": 3,
      "setA": [
        {
          "mrn": "107045.1",
          "name": "Brunch Burger"
        },
        {
          "mrn": "91861.2",
          "name": "BBQ Brisket Smashburger"
        }
      ],
      "setB": [
        {
          "mrn": "63517.3",
          "name": "Teriyaki Bacon Burger"
        },
        {
          "mrn": "63329.3",
          "name": "Carolina BBQ Burger"
        }
      ]
    },
    {
      "week": 4,
      "setA": [
        {
          "mrn": "63517.3",
          "name": "Teriyaki Bacon Burger"
        },
        {
          "mrn": "63329.3",
          "name": "Carolina BBQ Burger"
        }
      ],
      "setB": [
        {
          "mrn": "78211.2",
          "name": "Blackened Steelhead Sandwich"
        },
        {
          "mrn": "165740.2",
          "name": "Spicy Fried Cod Sandwich on Brioche"
        }
      ]
    },
    {
      "week": 5,
      "setA": [
        {
          "mrn": "78211.2",
          "name": "Blackened Steelhead Sandwich"
        },
        {
          "mrn": "165740.2",
          "name": "Spicy Fried Cod Sandwich on Brioche"
        }
      ],
      "setB": [
        {
          "mrn": "77139.70",
          "name": "Chesapeake Chicken Sandwich"
        },
        {
          "mrn": "77139.69",
          "name": "Haystack Burger"
        }
      ]
    },
    {
      "week": 6,
      "setA": [
        {
          "mrn": "77139.70",
          "name": "Chesapeake Chicken Sandwich"
        },
        {
          "mrn": "77139.69",
          "name": "Haystack Burger"
        }
      ],
      "setB": [
        {
          "mrn": "77139.72",
          "name": "ATX Burger"
        },
        {
          "mrn": "13773.6",
          "name": "Mushroom Swiss Burger"
        }
      ]
    }
  ],
  "coreItems": [
    {
      "mrn": "147955.17",
      "name": "Smashburger",
      "category": "sandwich"
    },
    {
      "mrn": "77139.66",
      "name": "Smashburger With Cheese",
      "category": "sandwich"
    },
    {
      "mrn": "83088.1",
      "name": "Santa Fe Black Bean Burger",
      "category": "sandwich"
    },
    {
      "mrn": "107374.35",
      "name": "Nashville Hot Chicken Sandwich",
      "category": "sandwich"
    },
    {
      "mrn": "77139.67",
      "name": "Grilled Chicken Sandwich",
      "category": "sandwich"
    },
    {
      "mrn": "16811",
      "name": "Garden Salad",
      "category": "side"
    },
    {
      "mrn": "5294.29",
      "name": "Grilled Vegetables",
      "category": "side"
    }
  ],
  "itemPrepComponents": {
    "16811": [
      {
        "id": "grill-prep|ingredient|1247|ounce",
        "type": "ingredient",
        "mrn": "1247",
        "name": "Carrots, Fresh",
        "quantity": 1,
        "unit": "ounce"
      },
      {
        "id": "grill-prep|ingredient|53124|ounce",
        "type": "ingredient",
        "mrn": "53124",
        "name": "Cucumbers, English, Fresh, Sliced",
        "quantity": 1,
        "unit": "ounce"
      },
      {
        "id": "grill-prep|ingredient|7557|each",
        "type": "ingredient",
        "mrn": "7557",
        "name": "Tomatoes, Grape, Fresh",
        "quantity": 5,
        "unit": "each"
      },
      {
        "id": "grill-prep|subrecipe|34052.3|cup",
        "type": "subrecipe",
        "mrn": "34052.3",
        "name": "EUR: Signature Salad Blend",
        "quantity": 1,
        "unit": "cup"
      }
    ],
    "77139.72": [
      {
        "id": "grill-prep|ingredient|31228|each",
        "type": "ingredient",
        "mrn": "31228",
        "name": "Bun, Brioche, Vegan, 2.57 oz, La Brea, Frozen",
        "quantity": 1,
        "unit": "each"
      },
      {
        "id": "grill-prep|ingredient|1675|slice",
        "type": "ingredient",
        "mrn": "1675",
        "name": "Cheese, Pepper Jack, Loaf, Great Lakes, Sliced, .75 oz",
        "quantity": 1,
        "unit": "slice"
      },
      {
        "id": "grill-prep|ingredient|3764|each",
        "type": "ingredient",
        "mrn": "3764",
        "name": "Lettuce, Iceberg, Individual Leaf, Fresh",
        "quantity": 1,
        "unit": "each"
      },
      {
        "id": "grill-prep|ingredient|169286|tbsp",
        "type": "ingredient",
        "mrn": "169286",
        "name": "Oil, Canola, 100%",
        "quantity": 0.25,
        "unit": "tbsp"
      },
      {
        "id": "grill-prep|ingredient|56055|slice",
        "type": "ingredient",
        "mrn": "56055",
        "name": "Tomatoes, 5x6, Fresh, Sliced",
        "quantity": 2,
        "unit": "slice"
      },
      {
        "id": "grill-prep|subrecipe|78123.7|ounce",
        "type": "subrecipe",
        "mrn": "78123.7",
        "name": "AMZ: Pickled Habanero Peppers",
        "quantity": 0.5,
        "unit": "ounce"
      },
      {
        "id": "grill-prep|subrecipe|147955.16|each",
        "type": "subrecipe",
        "mrn": "147955.16",
        "name": "AMZ: Smashburger Patty",
        "quantity": 1,
        "unit": "each"
      },
      {
        "id": "grill-prep|subrecipe|19294.5|tbsp",
        "type": "subrecipe",
        "mrn": "19294.5",
        "name": "EUR: Grilled Jalapeno Peppers",
        "quantity": 1,
        "unit": "tbsp"
      },
      {
        "id": "grill-prep|subrecipe|62183.1|ounce",
        "type": "subrecipe",
        "mrn": "62183.1",
        "name": "EUR: Grilled Poblano Peppers",
        "quantity": 0.5,
        "unit": "ounce"
      },
      {
        "id": "grill-prep|subrecipe|168231|tbsp",
        "type": "subrecipe",
        "mrn": "168231",
        "name": "EUR: Upcycled Chow Chow Aioli",
        "quantity": 2,
        "unit": "tbsp"
      }
    ],
    "13773.6": [
      {
        "id": "grill-prep|ingredient|31228|each",
        "type": "ingredient",
        "mrn": "31228",
        "name": "Bun, Brioche, Vegan, 2.57 oz, La Brea, Frozen",
        "quantity": 1,
        "unit": "each"
      },
      {
        "id": "grill-prep|ingredient|1688|slice",
        "type": "ingredient",
        "mrn": "1688",
        "name": "Cheese, Swiss, Pre-Sliced, .75 oz, Great Lakes",
        "quantity": 1,
        "unit": "slice"
      },
      {
        "id": "grill-prep|ingredient|3764|each",
        "type": "ingredient",
        "mrn": "3764",
        "name": "Lettuce, Iceberg, Individual Leaf, Fresh",
        "quantity": 1,
        "unit": "each"
      },
      {
        "id": "grill-prep|ingredient|169286|tbsp",
        "type": "ingredient",
        "mrn": "169286",
        "name": "Oil, Canola, 100%",
        "quantity": 1,
        "unit": "tbsp"
      },
      {
        "id": "grill-prep|ingredient|56055|slice",
        "type": "ingredient",
        "mrn": "56055",
        "name": "Tomatoes, 5x6, Fresh, Sliced",
        "quantity": 2,
        "unit": "slice"
      },
      {
        "id": "grill-prep|subrecipe|147955.16|each",
        "type": "subrecipe",
        "mrn": "147955.16",
        "name": "AMZ: Smashburger Patty",
        "quantity": 1,
        "unit": "each"
      },
      {
        "id": "grill-prep|subrecipe|14681.3|tbsp",
        "type": "subrecipe",
        "mrn": "14681.3",
        "name": "EUR: Roasted Garlic Aioli (Vegan Mayo)",
        "quantity": 2,
        "unit": "tbsp"
      },
      {
        "id": "grill-prep|subrecipe|76476.2|tbsp",
        "type": "subrecipe",
        "mrn": "76476.2",
        "name": "EUR: Roasted Mushrooms",
        "quantity": 3,
        "unit": "tbsp"
      }
    ],
    "77139.68": [
      {
        "id": "grill-prep|ingredient|31228|each",
        "type": "ingredient",
        "mrn": "31228",
        "name": "Bun, Brioche, Vegan, 2.57 oz, La Brea, Frozen",
        "quantity": 1,
        "unit": "each"
      },
      {
        "id": "grill-prep|ingredient|1675|slice",
        "type": "ingredient",
        "mrn": "1675",
        "name": "Cheese, Pepper Jack, Loaf, Great Lakes, Sliced, .75 oz",
        "quantity": 1,
        "unit": "slice"
      },
      {
        "id": "grill-prep|ingredient|3764|each",
        "type": "ingredient",
        "mrn": "3764",
        "name": "Lettuce, Iceberg, Individual Leaf, Fresh",
        "quantity": 1,
        "unit": "each"
      },
      {
        "id": "grill-prep|ingredient|169286|tbsp",
        "type": "ingredient",
        "mrn": "169286",
        "name": "Oil, Canola, 100%",
        "quantity": 1,
        "unit": "tbsp"
      },
      {
        "id": "grill-prep|subrecipe|147955.16|each",
        "type": "subrecipe",
        "mrn": "147955.16",
        "name": "AMZ: Smashburger Patty",
        "quantity": 1,
        "unit": "each"
      },
      {
        "id": "grill-prep|subrecipe|11315|ounce",
        "type": "subrecipe",
        "mrn": "11315",
        "name": "EUR: Pico de Gallo",
        "quantity": 1,
        "unit": "ounce"
      },
      {
        "id": "grill-prep|subrecipe|77137.1|tbsp",
        "type": "subrecipe",
        "mrn": "77137.1",
        "name": "EURNA: Diablo Sauce",
        "quantity": 1,
        "unit": "tbsp"
      },
      {
        "id": "grill-prep|subrecipe|81169.1|ounce",
        "type": "subrecipe",
        "mrn": "81169.1",
        "name": "EURNA: Sriracha Mayonnaise, Vegan",
        "quantity": 1,
        "unit": "ounce"
      }
    ],
    "64908.6": [
      {
        "id": "grill-prep|ingredient|31228|each",
        "type": "ingredient",
        "mrn": "31228",
        "name": "Bun, Brioche, Vegan, 2.57 oz, La Brea, Frozen",
        "quantity": 1,
        "unit": "each"
      },
      {
        "id": "grill-prep|ingredient|1675|slice",
        "type": "ingredient",
        "mrn": "1675",
        "name": "Cheese, Pepper Jack, Loaf, Great Lakes, Sliced, .75 oz",
        "quantity": 1,
        "unit": "slice"
      },
      {
        "id": "grill-prep|ingredient|1755|tbsp",
        "type": "ingredient",
        "mrn": "1755",
        "name": "Cilantro, Fresh",
        "quantity": 1,
        "unit": "tbsp"
      },
      {
        "id": "grill-prep|ingredient|169286|tbsp",
        "type": "ingredient",
        "mrn": "169286",
        "name": "Oil, Canola, 100%",
        "quantity": 1,
        "unit": "tbsp"
      },
      {
        "id": "grill-prep|subrecipe|147955.16|each",
        "type": "subrecipe",
        "mrn": "147955.16",
        "name": "AMZ: Smashburger Patty",
        "quantity": 1,
        "unit": "each"
      },
      {
        "id": "grill-prep|subrecipe|22403.7|tbsp",
        "type": "subrecipe",
        "mrn": "22403.7",
        "name": "EUR: Chipotle Mayonnaise",
        "quantity": 2,
        "unit": "tbsp"
      },
      {
        "id": "grill-prep|subrecipe|77960.2|ounce",
        "type": "subrecipe",
        "mrn": "77960.2",
        "name": "EUR: Pickled Red Onions",
        "quantity": 1,
        "unit": "ounce"
      },
      {
        "id": "grill-prep|subrecipe|19294.11|ounce",
        "type": "subrecipe",
        "mrn": "19294.11",
        "name": "EURNA: Roasted Jalapeno Peppers",
        "quantity": 1,
        "unit": "ounce"
      }
    ],
    "107045.1": [
      {
        "id": "grill-prep|ingredient|183006|each",
        "type": "ingredient",
        "mrn": "183006",
        "name": "Bacon, Applewood, Sliced, 14/18 Ct, Hatfield, Raw",
        "quantity": 2,
        "unit": "each"
      },
      {
        "id": "grill-prep|ingredient|31228|each",
        "type": "ingredient",
        "mrn": "31228",
        "name": "Bun, Brioche, Vegan, 2.57 oz, La Brea, Frozen",
        "quantity": 1,
        "unit": "each"
      },
      {
        "id": "grill-prep|ingredient|1605|each",
        "type": "ingredient",
        "mrn": "1605",
        "name": "Cheese, American, Pre-Sliced, .5 oz, Great Lakes",
        "quantity": 1,
        "unit": "each"
      },
      {
        "id": "grill-prep|ingredient|162575|each",
        "type": "ingredient",
        "mrn": "162575",
        "name": "Egg, Fresh, Large, Cage Free, HFAC, Wilcox",
        "quantity": 1,
        "unit": "each"
      },
      {
        "id": "grill-prep|ingredient|3764|each",
        "type": "ingredient",
        "mrn": "3764",
        "name": "Lettuce, Iceberg, Individual Leaf, Fresh",
        "quantity": 1,
        "unit": "each"
      },
      {
        "id": "grill-prep|subrecipe|147955.16|each",
        "type": "subrecipe",
        "mrn": "147955.16",
        "name": "AMZ: Smashburger Patty",
        "quantity": 1,
        "unit": "each"
      },
      {
        "id": "grill-prep|subrecipe|144065|floz",
        "type": "subrecipe",
        "mrn": "144065",
        "name": "EUR: Bloody Mary Ketchup",
        "quantity": 1,
        "unit": "floz"
      },
      {
        "id": "grill-prep|subrecipe|77960.1|ounce",
        "type": "subrecipe",
        "mrn": "77960.1",
        "name": "Pickled Onions",
        "quantity": 2,
        "unit": "ounce"
      }
    ],
    "91861.2": [
      {
        "id": "grill-prep|ingredient|36857|ounce",
        "type": "ingredient",
        "mrn": "36857",
        "name": "Beef, Brisket, BBQ, Sliced, Austin Blues, FC",
        "quantity": 2,
        "unit": "ounce"
      },
      {
        "id": "grill-prep|ingredient|31228|each",
        "type": "ingredient",
        "mrn": "31228",
        "name": "Bun, Brioche, Vegan, 2.57 oz, La Brea, Frozen",
        "quantity": 1,
        "unit": "each"
      },
      {
        "id": "grill-prep|ingredient|1667|slice",
        "type": "ingredient",
        "mrn": "1667",
        "name": "Cheese, Cheddar, Mild, Great Lakes, Pre-Sliced, .75 oz",
        "quantity": 1,
        "unit": "slice"
      },
      {
        "id": "grill-prep|ingredient|169286|tbsp",
        "type": "ingredient",
        "mrn": "169286",
        "name": "Oil, Canola, 100%",
        "quantity": 1,
        "unit": "tbsp"
      },
      {
        "id": "grill-prep|subrecipe|147955.16|each",
        "type": "subrecipe",
        "mrn": "147955.16",
        "name": "AMZ: Smashburger Patty",
        "quantity": 1,
        "unit": "each"
      },
      {
        "id": "grill-prep|subrecipe|78836|tbsp",
        "type": "subrecipe",
        "mrn": "78836",
        "name": "EUR: Bourbon BBQ Sauce",
        "quantity": 2,
        "unit": "tbsp"
      },
      {
        "id": "grill-prep|subrecipe|17142.4|ounce",
        "type": "subrecipe",
        "mrn": "17142.4",
        "name": "EURNA: Crispy Fried Onions",
        "quantity": 1,
        "unit": "ounce"
      },
      {
        "id": "grill-prep|subrecipe|76326|ounce",
        "type": "subrecipe",
        "mrn": "76326",
        "name": "EURNA: Sauteed Mushrooms",
        "quantity": 1,
        "unit": "ounce"
      }
    ],
    "63517.3": [
      {
        "id": "grill-prep|ingredient|183006|each",
        "type": "ingredient",
        "mrn": "183006",
        "name": "Bacon, Applewood, Sliced, 14/18 Ct, Hatfield, Raw",
        "quantity": 2,
        "unit": "each"
      },
      {
        "id": "grill-prep|ingredient|31228|each",
        "type": "ingredient",
        "mrn": "31228",
        "name": "Bun, Brioche, Vegan, 2.57 oz, La Brea, Frozen",
        "quantity": 1,
        "unit": "each"
      },
      {
        "id": "grill-prep|ingredient|148538|slice",
        "type": "ingredient",
        "mrn": "148538",
        "name": "Cheese, Provolone, Pre-Sliced, .5 oz, Great Lakes",
        "quantity": 1,
        "unit": "slice"
      },
      {
        "id": "grill-prep|ingredient|3764|each",
        "type": "ingredient",
        "mrn": "3764",
        "name": "Lettuce, Iceberg, Individual Leaf, Fresh",
        "quantity": 1,
        "unit": "each"
      },
      {
        "id": "grill-prep|ingredient|169286|tbsp",
        "type": "ingredient",
        "mrn": "169286",
        "name": "Oil, Canola, 100%",
        "quantity": 1,
        "unit": "tbsp"
      },
      {
        "id": "grill-prep|ingredient|225846|each",
        "type": "ingredient",
        "mrn": "225846",
        "name": "Pickles, Dill Chips, Kosher, Block & Barrel, Bulk",
        "quantity": 3,
        "unit": "each"
      },
      {
        "id": "grill-prep|ingredient|8262|slice",
        "type": "ingredient",
        "mrn": "8262",
        "name": "Pineapple, Fresh, Sliced",
        "quantity": 1,
        "unit": "slice"
      },
      {
        "id": "grill-prep|ingredient|56055|slice",
        "type": "ingredient",
        "mrn": "56055",
        "name": "Tomatoes, 5x6, Fresh, Sliced",
        "quantity": 2,
        "unit": "slice"
      },
      {
        "id": "grill-prep|subrecipe|147955.16|each",
        "type": "subrecipe",
        "mrn": "147955.16",
        "name": "AMZ: Smashburger Patty",
        "quantity": 1,
        "unit": "each"
      },
      {
        "id": "grill-prep|subrecipe|22403.7|tbsp",
        "type": "subrecipe",
        "mrn": "22403.7",
        "name": "EUR: Chipotle Mayonnaise",
        "quantity": 2,
        "unit": "tbsp"
      },
      {
        "id": "grill-prep|subrecipe|83233|tbsp",
        "type": "subrecipe",
        "mrn": "83233",
        "name": "EURNA: Teriyaki Sauce",
        "quantity": 1,
        "unit": "tbsp"
      }
    ],
    "63329.3": [
      {
        "id": "grill-prep|ingredient|31228|each",
        "type": "ingredient",
        "mrn": "31228",
        "name": "Bun, Brioche, Vegan, 2.57 oz, La Brea, Frozen",
        "quantity": 1,
        "unit": "each"
      },
      {
        "id": "grill-prep|ingredient|9165|slice",
        "type": "ingredient",
        "mrn": "9165",
        "name": "Cheese, Cheddar, Mild, Loaf, Great Lakes, Sliced, .5 oz",
        "quantity": 2,
        "unit": "slice"
      },
      {
        "id": "grill-prep|ingredient|3764|each",
        "type": "ingredient",
        "mrn": "3764",
        "name": "Lettuce, Iceberg, Individual Leaf, Fresh",
        "quantity": 1,
        "unit": "each"
      },
      {
        "id": "grill-prep|ingredient|4183|cup",
        "type": "ingredient",
        "mrn": "4183",
        "name": "Onions, French Fried, Dried",
        "quantity": 0.5,
        "unit": "cup"
      },
      {
        "id": "grill-prep|ingredient|225846|each",
        "type": "ingredient",
        "mrn": "225846",
        "name": "Pickles, Dill Chips, Kosher, Block & Barrel, Bulk",
        "quantity": 3,
        "unit": "each"
      },
      {
        "id": "grill-prep|subrecipe|147955.16|each",
        "type": "subrecipe",
        "mrn": "147955.16",
        "name": "AMZ: Smashburger Patty",
        "quantity": 1,
        "unit": "each"
      },
      {
        "id": "grill-prep|subrecipe|76857|tbsp",
        "type": "subrecipe",
        "mrn": "76857",
        "name": "EURNA: Carolina Gold  BBQ Sauce",
        "quantity": 2,
        "unit": "tbsp"
      }
    ],
    "78211.2": [
      {
        "id": "grill-prep|ingredient|31228|each",
        "type": "ingredient",
        "mrn": "31228",
        "name": "Bun, Brioche, Vegan, 2.57 oz, La Brea, Frozen",
        "quantity": 1,
        "unit": "each"
      },
      {
        "id": "grill-prep|ingredient|3764|each",
        "type": "ingredient",
        "mrn": "3764",
        "name": "Lettuce, Iceberg, Individual Leaf, Fresh",
        "quantity": 1,
        "unit": "each"
      },
      {
        "id": "grill-prep|ingredient|166043|slice",
        "type": "ingredient",
        "mrn": "166043",
        "name": "Onions, Red, Fresh, Each Slice, 1/4\"",
        "quantity": 1,
        "unit": "slice"
      },
      {
        "id": "grill-prep|ingredient|225846|each",
        "type": "ingredient",
        "mrn": "225846",
        "name": "Pickles, Dill Chips, Kosher, Block & Barrel, Bulk",
        "quantity": 3,
        "unit": "each"
      },
      {
        "id": "grill-prep|ingredient|56055|slice",
        "type": "ingredient",
        "mrn": "56055",
        "name": "Tomatoes, 5x6, Fresh, Sliced",
        "quantity": 2,
        "unit": "slice"
      },
      {
        "id": "grill-prep|subrecipe|191368|serving-s-",
        "type": "subrecipe",
        "mrn": "191368",
        "name": "AMZ: Blackened Steelhead Trout, 4.5oz",
        "quantity": 1,
        "unit": "serving(s)"
      },
      {
        "id": "grill-prep|subrecipe|168231|tbsp",
        "type": "subrecipe",
        "mrn": "168231",
        "name": "EUR: Upcycled Chow Chow Aioli",
        "quantity": 2,
        "unit": "tbsp"
      }
    ],
    "165740.2": [
      {
        "id": "grill-prep|ingredient|31228|each",
        "type": "ingredient",
        "mrn": "31228",
        "name": "Bun, Brioche, Vegan, 2.57 oz, La Brea, Frozen",
        "quantity": 1,
        "unit": "each"
      },
      {
        "id": "grill-prep|ingredient|3764|each",
        "type": "ingredient",
        "mrn": "3764",
        "name": "Lettuce, Iceberg, Individual Leaf, Fresh",
        "quantity": 1,
        "unit": "each"
      },
      {
        "id": "grill-prep|ingredient|169286|tsp",
        "type": "ingredient",
        "mrn": "169286",
        "name": "Oil, Canola, 100%",
        "quantity": 0.5,
        "unit": "tsp"
      },
      {
        "id": "grill-prep|ingredient|225846|each",
        "type": "ingredient",
        "mrn": "225846",
        "name": "Pickles, Dill Chips, Kosher, Block & Barrel, Bulk",
        "quantity": 3,
        "unit": "each"
      },
      {
        "id": "grill-prep|ingredient|56055|slice",
        "type": "ingredient",
        "mrn": "56055",
        "name": "Tomatoes, 5x6, Fresh, Sliced",
        "quantity": 2,
        "unit": "slice"
      },
      {
        "id": "grill-prep|subrecipe|136560.2|tbsp",
        "type": "subrecipe",
        "mrn": "136560.2",
        "name": "AMZ: Fresno Chile Hot Sauce",
        "quantity": 1,
        "unit": "tbsp"
      },
      {
        "id": "grill-prep|subrecipe|32208.2|serving-s-",
        "type": "subrecipe",
        "mrn": "32208.2",
        "name": "AMZ: Fried Cod",
        "quantity": 1,
        "unit": "serving(s)"
      },
      {
        "id": "grill-prep|subrecipe|187430.1|tbsp",
        "type": "subrecipe",
        "mrn": "187430.1",
        "name": "AMZ: Tarragon Aioli",
        "quantity": 2,
        "unit": "tbsp"
      }
    ],
    "77139.70": [
      {
        "id": "grill-prep|ingredient|31228|each",
        "type": "ingredient",
        "mrn": "31228",
        "name": "Bun, Brioche, Vegan, 2.57 oz, La Brea, Frozen",
        "quantity": 1,
        "unit": "each"
      },
      {
        "id": "grill-prep|ingredient|1712|each",
        "type": "ingredient",
        "mrn": "1712",
        "name": "Chicken, Breast, Boneless, Skinless, 5 oz, Tyson, Raw",
        "quantity": 1,
        "unit": "each"
      },
      {
        "id": "grill-prep|ingredient|3764|each",
        "type": "ingredient",
        "mrn": "3764",
        "name": "Lettuce, Iceberg, Individual Leaf, Fresh",
        "quantity": 1,
        "unit": "each"
      },
      {
        "id": "grill-prep|ingredient|169286|tbsp",
        "type": "ingredient",
        "mrn": "169286",
        "name": "Oil, Canola, 100%",
        "quantity": 1,
        "unit": "tbsp"
      },
      {
        "id": "grill-prep|ingredient|166043|slice",
        "type": "ingredient",
        "mrn": "166043",
        "name": "Onions, Red, Fresh, Each Slice, 1/4\"",
        "quantity": 2,
        "unit": "slice"
      },
      {
        "id": "grill-prep|ingredient|56055|slice",
        "type": "ingredient",
        "mrn": "56055",
        "name": "Tomatoes, 5x6, Fresh, Sliced",
        "quantity": 2,
        "unit": "slice"
      },
      {
        "id": "grill-prep|subrecipe|145477.1|tbsp",
        "type": "subrecipe",
        "mrn": "145477.1",
        "name": "AMZ: Chesapeake Aioli",
        "quantity": 2,
        "unit": "tbsp"
      },
      {
        "id": "grill-prep|subrecipe|101533.5|cup",
        "type": "subrecipe",
        "mrn": "101533.5",
        "name": "AMZ: Chesapeake Chicken Marinade",
        "quantity": 0.25,
        "unit": "cup"
      },
      {
        "id": "grill-prep|subrecipe|191493|tsp",
        "type": "subrecipe",
        "mrn": "191493",
        "name": "AMZ: Waste Not Salt",
        "quantity": 0.5,
        "unit": "tsp"
      }
    ],
    "77139.69": [
      {
        "id": "grill-prep|ingredient|31228|each",
        "type": "ingredient",
        "mrn": "31228",
        "name": "Bun, Brioche, Vegan, 2.57 oz, La Brea, Frozen",
        "quantity": 1,
        "unit": "each"
      },
      {
        "id": "grill-prep|ingredient|7775|ounce",
        "type": "ingredient",
        "mrn": "7775",
        "name": "Cheese, Havarti, Roth Kase",
        "quantity": 0.75,
        "unit": "ounce"
      },
      {
        "id": "grill-prep|ingredient|3764|each",
        "type": "ingredient",
        "mrn": "3764",
        "name": "Lettuce, Iceberg, Individual Leaf, Fresh",
        "quantity": 1,
        "unit": "each"
      },
      {
        "id": "grill-prep|ingredient|169286|tbsp",
        "type": "ingredient",
        "mrn": "169286",
        "name": "Oil, Canola, 100%",
        "quantity": 1,
        "unit": "tbsp"
      },
      {
        "id": "grill-prep|ingredient|85770|g",
        "type": "ingredient",
        "mrn": "85770",
        "name": "Oil, Canola, Liquid Frying, Frilite",
        "quantity": 15.666667,
        "unit": "g"
      },
      {
        "id": "grill-prep|ingredient|166043|slice",
        "type": "ingredient",
        "mrn": "166043",
        "name": "Onions, Red, Fresh, Each Slice, 1/4\"",
        "quantity": 2,
        "unit": "slice"
      },
      {
        "id": "grill-prep|ingredient|15372|ounce",
        "type": "ingredient",
        "mrn": "15372",
        "name": "Potatoes, Hash Brown, Shredded, McCain, Frozen",
        "quantity": 4,
        "unit": "ounce"
      },
      {
        "id": "grill-prep|ingredient|82193|tbsp",
        "type": "ingredient",
        "mrn": "82193",
        "name": "Seasoning, Mesquite, BBQ, McCormick",
        "quantity": 1,
        "unit": "tbsp"
      },
      {
        "id": "grill-prep|ingredient|56055|slice",
        "type": "ingredient",
        "mrn": "56055",
        "name": "Tomatoes, 5x6, Fresh, Sliced",
        "quantity": 2,
        "unit": "slice"
      },
      {
        "id": "grill-prep|subrecipe|147955.16|each",
        "type": "subrecipe",
        "mrn": "147955.16",
        "name": "AMZ: Smashburger Patty",
        "quantity": 1,
        "unit": "each"
      },
      {
        "id": "grill-prep|subrecipe|77537.1|ounce",
        "type": "subrecipe",
        "mrn": "77537.1",
        "name": "EURNA: Sweet and Smoky Sauce",
        "quantity": 2,
        "unit": "ounce"
      }
    ],
    "147955.17": [
      {
        "id": "grill-prep|ingredient|31228|each",
        "type": "ingredient",
        "mrn": "31228",
        "name": "Bun, Brioche, Vegan, 2.57 oz, La Brea, Frozen",
        "quantity": 1,
        "unit": "each"
      },
      {
        "id": "grill-prep|ingredient|3764|each",
        "type": "ingredient",
        "mrn": "3764",
        "name": "Lettuce, Iceberg, Individual Leaf, Fresh",
        "quantity": 1,
        "unit": "each"
      },
      {
        "id": "grill-prep|ingredient|169286|tbsp",
        "type": "ingredient",
        "mrn": "169286",
        "name": "Oil, Canola, 100%",
        "quantity": 1,
        "unit": "tbsp"
      },
      {
        "id": "grill-prep|ingredient|166043|slice",
        "type": "ingredient",
        "mrn": "166043",
        "name": "Onions, Red, Fresh, Each Slice, 1/4\"",
        "quantity": 2,
        "unit": "slice"
      },
      {
        "id": "grill-prep|ingredient|225846|each",
        "type": "ingredient",
        "mrn": "225846",
        "name": "Pickles, Dill Chips, Kosher, Block & Barrel, Bulk",
        "quantity": 3,
        "unit": "each"
      },
      {
        "id": "grill-prep|ingredient|56055|slice",
        "type": "ingredient",
        "mrn": "56055",
        "name": "Tomatoes, 5x6, Fresh, Sliced",
        "quantity": 2,
        "unit": "slice"
      },
      {
        "id": "grill-prep|subrecipe|147955.16|each",
        "type": "subrecipe",
        "mrn": "147955.16",
        "name": "AMZ: Smashburger Patty",
        "quantity": 1,
        "unit": "each"
      },
      {
        "id": "grill-prep|subrecipe|168231|tbsp",
        "type": "subrecipe",
        "mrn": "168231",
        "name": "EUR: Upcycled Chow Chow Aioli",
        "quantity": 2,
        "unit": "tbsp"
      }
    ],
    "77139.66": [
      {
        "id": "grill-prep|ingredient|31228|each",
        "type": "ingredient",
        "mrn": "31228",
        "name": "Bun, Brioche, Vegan, 2.57 oz, La Brea, Frozen",
        "quantity": 1,
        "unit": "each"
      },
      {
        "id": "grill-prep|ingredient|1605|slice",
        "type": "ingredient",
        "mrn": "1605",
        "name": "Cheese, American, Pre-Sliced, .5 oz, Great Lakes",
        "quantity": 1,
        "unit": "slice"
      },
      {
        "id": "grill-prep|ingredient|3764|each",
        "type": "ingredient",
        "mrn": "3764",
        "name": "Lettuce, Iceberg, Individual Leaf, Fresh",
        "quantity": 1,
        "unit": "each"
      },
      {
        "id": "grill-prep|ingredient|169286|tbsp",
        "type": "ingredient",
        "mrn": "169286",
        "name": "Oil, Canola, 100%",
        "quantity": 1,
        "unit": "tbsp"
      },
      {
        "id": "grill-prep|ingredient|166043|slice",
        "type": "ingredient",
        "mrn": "166043",
        "name": "Onions, Red, Fresh, Each Slice, 1/4\"",
        "quantity": 2,
        "unit": "slice"
      },
      {
        "id": "grill-prep|ingredient|225846|each",
        "type": "ingredient",
        "mrn": "225846",
        "name": "Pickles, Dill Chips, Kosher, Block & Barrel, Bulk",
        "quantity": 3,
        "unit": "each"
      },
      {
        "id": "grill-prep|ingredient|56055|slice",
        "type": "ingredient",
        "mrn": "56055",
        "name": "Tomatoes, 5x6, Fresh, Sliced",
        "quantity": 2,
        "unit": "slice"
      },
      {
        "id": "grill-prep|subrecipe|147955.16|each",
        "type": "subrecipe",
        "mrn": "147955.16",
        "name": "AMZ: Smashburger Patty",
        "quantity": 1,
        "unit": "each"
      },
      {
        "id": "grill-prep|subrecipe|168231|tbsp",
        "type": "subrecipe",
        "mrn": "168231",
        "name": "EUR: Upcycled Chow Chow Aioli",
        "quantity": 2,
        "unit": "tbsp"
      }
    ],
    "83088.1": [
      {
        "id": "grill-prep|ingredient|179508|scoop-16",
        "type": "ingredient",
        "mrn": "179508",
        "name": "Avocado, Hand Scooped, Wholly Avocado, Fresh",
        "quantity": 2,
        "unit": "scoop #16"
      },
      {
        "id": "grill-prep|ingredient|31228|each",
        "type": "ingredient",
        "mrn": "31228",
        "name": "Bun, Brioche, Vegan, 2.57 oz, La Brea, Frozen",
        "quantity": 1,
        "unit": "each"
      },
      {
        "id": "grill-prep|ingredient|170538|each",
        "type": "ingredient",
        "mrn": "170538",
        "name": "Burger, Meatless, Black Bean, Actual Veggies, 4 oz, Frozen",
        "quantity": 1,
        "unit": "each"
      },
      {
        "id": "grill-prep|ingredient|3762|each",
        "type": "ingredient",
        "mrn": "3762",
        "name": "Lettuce, Leaf, Individual Leaf, Fresh",
        "quantity": 1,
        "unit": "each"
      },
      {
        "id": "grill-prep|ingredient|169286|tbsp",
        "type": "ingredient",
        "mrn": "169286",
        "name": "Oil, Canola, 100%",
        "quantity": 1,
        "unit": "tbsp"
      },
      {
        "id": "grill-prep|ingredient|56055|slice",
        "type": "ingredient",
        "mrn": "56055",
        "name": "Tomatoes, 5x6, Fresh, Sliced",
        "quantity": 2,
        "unit": "slice"
      },
      {
        "id": "grill-prep|subrecipe|77960.2|ounce",
        "type": "subrecipe",
        "mrn": "77960.2",
        "name": "EUR: Pickled Red Onions",
        "quantity": 2,
        "unit": "ounce"
      },
      {
        "id": "grill-prep|subrecipe|81315|ounce",
        "type": "subrecipe",
        "mrn": "81315",
        "name": "EURNA: Pickled Jalapenos",
        "quantity": 1,
        "unit": "ounce"
      }
    ],
    "107374.35": [
      {
        "id": "grill-prep|ingredient|31228|each",
        "type": "ingredient",
        "mrn": "31228",
        "name": "Bun, Brioche, Vegan, 2.57 oz, La Brea, Frozen",
        "quantity": 1,
        "unit": "each"
      },
      {
        "id": "grill-prep|ingredient|191189|each",
        "type": "ingredient",
        "mrn": "191189",
        "name": "Chicken, Breast, Fillet, Breaded, Spicy, 4oz, Koch, Frozen",
        "quantity": 1,
        "unit": "each"
      },
      {
        "id": "grill-prep|ingredient|108406|tbsp",
        "type": "ingredient",
        "mrn": "108406",
        "name": "Mayo, Vegan, Hellmann's, Bulk",
        "quantity": 2,
        "unit": "tbsp"
      },
      {
        "id": "grill-prep|ingredient|169286|tbsp",
        "type": "ingredient",
        "mrn": "169286",
        "name": "Oil, Canola, 100%",
        "quantity": 1,
        "unit": "tbsp"
      },
      {
        "id": "grill-prep|ingredient|85770|g",
        "type": "ingredient",
        "mrn": "85770",
        "name": "Oil, Canola, Liquid Frying, Frilite",
        "quantity": 1,
        "unit": "g"
      },
      {
        "id": "grill-prep|ingredient|225846|each",
        "type": "ingredient",
        "mrn": "225846",
        "name": "Pickles, Dill Chips, Kosher, Block & Barrel, Bulk",
        "quantity": 3,
        "unit": "each"
      },
      {
        "id": "grill-prep|subrecipe|120180.3|tbsp",
        "type": "subrecipe",
        "mrn": "120180.3",
        "name": "EUR: Nashville Hot Sauce for Chicken",
        "quantity": 3,
        "unit": "tbsp"
      },
      {
        "id": "grill-prep|subrecipe|18179.1|cup",
        "type": "subrecipe",
        "mrn": "18179.1",
        "name": "EURNA: Vinegar Coleslaw",
        "quantity": 0.5,
        "unit": "cup"
      }
    ],
    "77139.67": [
      {
        "id": "grill-prep|ingredient|31228|each",
        "type": "ingredient",
        "mrn": "31228",
        "name": "Bun, Brioche, Vegan, 2.57 oz, La Brea, Frozen",
        "quantity": 1,
        "unit": "each"
      },
      {
        "id": "grill-prep|ingredient|3764|each",
        "type": "ingredient",
        "mrn": "3764",
        "name": "Lettuce, Iceberg, Individual Leaf, Fresh",
        "quantity": 1,
        "unit": "each"
      },
      {
        "id": "grill-prep|ingredient|169286|tbsp",
        "type": "ingredient",
        "mrn": "169286",
        "name": "Oil, Canola, 100%",
        "quantity": 1,
        "unit": "tbsp"
      },
      {
        "id": "grill-prep|ingredient|166043|slice",
        "type": "ingredient",
        "mrn": "166043",
        "name": "Onions, Red, Fresh, Each Slice, 1/4\"",
        "quantity": 2,
        "unit": "slice"
      },
      {
        "id": "grill-prep|ingredient|225846|each",
        "type": "ingredient",
        "mrn": "225846",
        "name": "Pickles, Dill Chips, Kosher, Block & Barrel, Bulk",
        "quantity": 3,
        "unit": "each"
      },
      {
        "id": "grill-prep|ingredient|56055|slice",
        "type": "ingredient",
        "mrn": "56055",
        "name": "Tomatoes, 5x6, Fresh, Sliced",
        "quantity": 2,
        "unit": "slice"
      },
      {
        "id": "grill-prep|subrecipe|144591.1|each",
        "type": "subrecipe",
        "mrn": "144591.1",
        "name": "AMZ: Grilled Chicken Breast",
        "quantity": 1,
        "unit": "each"
      },
      {
        "id": "grill-prep|subrecipe|168231|tbsp",
        "type": "subrecipe",
        "mrn": "168231",
        "name": "EUR: Upcycled Chow Chow Aioli",
        "quantity": 2,
        "unit": "tbsp"
      }
    ],
    "5294.29": [
      {
        "id": "grill-prep|ingredient|4123|ounce",
        "type": "ingredient",
        "mrn": "4123",
        "name": "Mushrooms, Portobello, Fresh",
        "quantity": 1,
        "unit": "ounce"
      },
      {
        "id": "grill-prep|ingredient|169286|tbsp",
        "type": "ingredient",
        "mrn": "169286",
        "name": "Oil, Canola, 100%",
        "quantity": 0.166667,
        "unit": "tbsp"
      },
      {
        "id": "grill-prep|ingredient|4253|ounce",
        "type": "ingredient",
        "mrn": "4253",
        "name": "Onions, Red, Fresh, Each Ring, 1/4\"",
        "quantity": 0.666667,
        "unit": "ounce"
      },
      {
        "id": "grill-prep|ingredient|8065|ounce",
        "type": "ingredient",
        "mrn": "8065",
        "name": "Peppers, Bell, Red, Fresh",
        "quantity": 1,
        "unit": "ounce"
      },
      {
        "id": "grill-prep|ingredient|7411|tsp",
        "type": "ingredient",
        "mrn": "7411",
        "name": "Salt, Kosher",
        "quantity": 0.027778,
        "unit": "tsp"
      },
      {
        "id": "grill-prep|ingredient|7390|tsp",
        "type": "ingredient",
        "mrn": "7390",
        "name": "Spice, Pepper, Black, Ground",
        "quantity": 0.027778,
        "unit": "tsp"
      },
      {
        "id": "grill-prep|ingredient|55272|ounce",
        "type": "ingredient",
        "mrn": "55272",
        "name": "Squash, Yellow, Fresh, Bias Cut, Halved, 1/2\"",
        "quantity": 1,
        "unit": "ounce"
      },
      {
        "id": "grill-prep|ingredient|7462|ounce",
        "type": "ingredient",
        "mrn": "7462",
        "name": "Squash, Zucchini, Fresh, Bias Cut, Halved, 1/2\"",
        "quantity": 1.083333,
        "unit": "ounce"
      }
    ]
  },
  "itemTransferComponents": {
    "16811": [
      {
        "id": "grill-transfer|1247",
        "mrn": "1247",
        "name": "Carrots, Fresh",
        "quantity": 1,
        "unit": "ounce",
        "costPerPortion": 0.1188,
        "glCode": "4111005"
      },
      {
        "id": "grill-transfer|7557",
        "mrn": "7557",
        "name": "Tomatoes, Grape, Fresh",
        "quantity": 5,
        "unit": "each",
        "costPerPortion": 0.3,
        "glCode": "4111012"
      },
      {
        "id": "grill-transfer|53124",
        "mrn": "53124",
        "name": "Cucumbers, English, Fresh, Sliced",
        "quantity": 1,
        "unit": "ounce",
        "costPerPortion": 0,
        "glCode": "4111005"
      }
    ],
    "77139.72": [
      {
        "id": "grill-transfer|31228",
        "mrn": "31228",
        "name": "Bun, Brioche, Vegan, 2.57 oz, La Brea, Frozen",
        "quantity": 1,
        "unit": "each",
        "costPerPortion": 0.68,
        "glCode": "4111010"
      },
      {
        "id": "grill-transfer|1675",
        "mrn": "1675",
        "name": "Cheese, Pepper Jack, Loaf, Great Lakes, Sliced, .75 oz",
        "quantity": 1,
        "unit": "slice",
        "costPerPortion": 0.15,
        "glCode": "4111006"
      },
      {
        "id": "grill-transfer|3764",
        "mrn": "3764",
        "name": "Lettuce, Iceberg, Individual Leaf, Fresh",
        "quantity": 1,
        "unit": "each",
        "costPerPortion": 0.03,
        "glCode": "4111012"
      },
      {
        "id": "grill-transfer|169286",
        "mrn": "169286",
        "name": "Oil, Canola, 100%",
        "quantity": 0.25,
        "unit": "tbsp",
        "costPerPortion": 0.0138,
        "glCode": "4111005"
      },
      {
        "id": "grill-transfer|56055",
        "mrn": "56055",
        "name": "Tomatoes, 5x6, Fresh, Sliced",
        "quantity": 2,
        "unit": "slice",
        "costPerPortion": 0.12,
        "glCode": "4111005"
      }
    ],
    "13773.6": [
      {
        "id": "grill-transfer|31228",
        "mrn": "31228",
        "name": "Bun, Brioche, Vegan, 2.57 oz, La Brea, Frozen",
        "quantity": 1,
        "unit": "each",
        "costPerPortion": 0.68,
        "glCode": "4111010"
      },
      {
        "id": "grill-transfer|1688",
        "mrn": "1688",
        "name": "Cheese, Swiss, Pre-Sliced, .75 oz, Great Lakes",
        "quantity": 1,
        "unit": "slice",
        "costPerPortion": 0.16,
        "glCode": "4111006"
      },
      {
        "id": "grill-transfer|3764",
        "mrn": "3764",
        "name": "Lettuce, Iceberg, Individual Leaf, Fresh",
        "quantity": 1,
        "unit": "each",
        "costPerPortion": 0.03,
        "glCode": "4111012"
      },
      {
        "id": "grill-transfer|169286",
        "mrn": "169286",
        "name": "Oil, Canola, 100%",
        "quantity": 1,
        "unit": "tbsp",
        "costPerPortion": 0.055,
        "glCode": "4111005"
      },
      {
        "id": "grill-transfer|56055",
        "mrn": "56055",
        "name": "Tomatoes, 5x6, Fresh, Sliced",
        "quantity": 2,
        "unit": "slice",
        "costPerPortion": 0.12,
        "glCode": "4111005"
      }
    ],
    "77139.68": [
      {
        "id": "grill-transfer|31228",
        "mrn": "31228",
        "name": "Bun, Brioche, Vegan, 2.57 oz, La Brea, Frozen",
        "quantity": 1,
        "unit": "each",
        "costPerPortion": 0.68,
        "glCode": "4111010"
      },
      {
        "id": "grill-transfer|1675",
        "mrn": "1675",
        "name": "Cheese, Pepper Jack, Loaf, Great Lakes, Sliced, .75 oz",
        "quantity": 1,
        "unit": "slice",
        "costPerPortion": 0.15,
        "glCode": "4111006"
      },
      {
        "id": "grill-transfer|3764",
        "mrn": "3764",
        "name": "Lettuce, Iceberg, Individual Leaf, Fresh",
        "quantity": 1,
        "unit": "each",
        "costPerPortion": 0.03,
        "glCode": "4111012"
      },
      {
        "id": "grill-transfer|169286",
        "mrn": "169286",
        "name": "Oil, Canola, 100%",
        "quantity": 1,
        "unit": "tbsp",
        "costPerPortion": 0.055,
        "glCode": "4111005"
      }
    ],
    "64908.6": [
      {
        "id": "grill-transfer|31228",
        "mrn": "31228",
        "name": "Bun, Brioche, Vegan, 2.57 oz, La Brea, Frozen",
        "quantity": 1,
        "unit": "each",
        "costPerPortion": 0.68,
        "glCode": "4111010"
      },
      {
        "id": "grill-transfer|1675",
        "mrn": "1675",
        "name": "Cheese, Pepper Jack, Loaf, Great Lakes, Sliced, .75 oz",
        "quantity": 1,
        "unit": "slice",
        "costPerPortion": 0.15,
        "glCode": "4111006"
      },
      {
        "id": "grill-transfer|1755",
        "mrn": "1755",
        "name": "Cilantro, Fresh",
        "quantity": 1,
        "unit": "tbsp",
        "costPerPortion": 0.03,
        "glCode": "4111012"
      },
      {
        "id": "grill-transfer|169286",
        "mrn": "169286",
        "name": "Oil, Canola, 100%",
        "quantity": 1,
        "unit": "tbsp",
        "costPerPortion": 0.055,
        "glCode": "4111005"
      }
    ],
    "107045.1": [
      {
        "id": "grill-transfer|183006",
        "mrn": "183006",
        "name": "Bacon, Applewood, Sliced, 14/18 Ct, Hatfield, Raw",
        "quantity": 2,
        "unit": "each",
        "costPerPortion": 0.8,
        "glCode": "4111003"
      },
      {
        "id": "grill-transfer|31228",
        "mrn": "31228",
        "name": "Bun, Brioche, Vegan, 2.57 oz, La Brea, Frozen",
        "quantity": 1,
        "unit": "each",
        "costPerPortion": 0.68,
        "glCode": "4111010"
      },
      {
        "id": "grill-transfer|1605",
        "mrn": "1605",
        "name": "Cheese, American, Pre-Sliced, .5 oz, Great Lakes",
        "quantity": 1,
        "unit": "each",
        "costPerPortion": 0.13,
        "glCode": "4111006"
      },
      {
        "id": "grill-transfer|162575",
        "mrn": "162575",
        "name": "Egg, Fresh, Large, Cage Free, HFAC, Wilcox",
        "quantity": 1,
        "unit": "each",
        "costPerPortion": 0.36,
        "glCode": "4111005"
      },
      {
        "id": "grill-transfer|3764",
        "mrn": "3764",
        "name": "Lettuce, Iceberg, Individual Leaf, Fresh",
        "quantity": 1,
        "unit": "each",
        "costPerPortion": 0.03,
        "glCode": "4111012"
      }
    ],
    "91861.2": [
      {
        "id": "grill-transfer|31228",
        "mrn": "31228",
        "name": "Bun, Brioche, Vegan, 2.57 oz, La Brea, Frozen",
        "quantity": 1,
        "unit": "each",
        "costPerPortion": 0.68,
        "glCode": "4111010"
      },
      {
        "id": "grill-transfer|1667",
        "mrn": "1667",
        "name": "Cheese, Cheddar, Mild, Great Lakes, Pre-Sliced, .75 oz",
        "quantity": 1,
        "unit": "slice",
        "costPerPortion": 0.15,
        "glCode": "4111006"
      },
      {
        "id": "grill-transfer|169286",
        "mrn": "169286",
        "name": "Oil, Canola, 100%",
        "quantity": 1,
        "unit": "tbsp",
        "costPerPortion": 0.055,
        "glCode": "4111005"
      },
      {
        "id": "grill-transfer|36857",
        "mrn": "36857",
        "name": "Beef, Brisket, BBQ, Sliced, Austin Blues, FC",
        "quantity": 2,
        "unit": "ounce",
        "costPerPortion": 0,
        "glCode": "4111003"
      }
    ],
    "63517.3": [
      {
        "id": "grill-transfer|183006",
        "mrn": "183006",
        "name": "Bacon, Applewood, Sliced, 14/18 Ct, Hatfield, Raw",
        "quantity": 2,
        "unit": "each",
        "costPerPortion": 0.8,
        "glCode": "4111003"
      },
      {
        "id": "grill-transfer|31228",
        "mrn": "31228",
        "name": "Bun, Brioche, Vegan, 2.57 oz, La Brea, Frozen",
        "quantity": 1,
        "unit": "each",
        "costPerPortion": 0.68,
        "glCode": "4111010"
      },
      {
        "id": "grill-transfer|148538",
        "mrn": "148538",
        "name": "Cheese, Provolone, Pre-Sliced, .5 oz, Great Lakes",
        "quantity": 1,
        "unit": "slice",
        "costPerPortion": 0.11,
        "glCode": "4111006"
      },
      {
        "id": "grill-transfer|3764",
        "mrn": "3764",
        "name": "Lettuce, Iceberg, Individual Leaf, Fresh",
        "quantity": 1,
        "unit": "each",
        "costPerPortion": 0.03,
        "glCode": "4111012"
      },
      {
        "id": "grill-transfer|169286",
        "mrn": "169286",
        "name": "Oil, Canola, 100%",
        "quantity": 1,
        "unit": "tbsp",
        "costPerPortion": 0.055,
        "glCode": "4111005"
      },
      {
        "id": "grill-transfer|225846",
        "mrn": "225846",
        "name": "Pickles, Dill Chips, Kosher, Block & Barrel, Bulk",
        "quantity": 3,
        "unit": "each",
        "costPerPortion": 0.03,
        "glCode": "4111012"
      },
      {
        "id": "grill-transfer|56055",
        "mrn": "56055",
        "name": "Tomatoes, 5x6, Fresh, Sliced",
        "quantity": 2,
        "unit": "slice",
        "costPerPortion": 0.12,
        "glCode": "4111005"
      },
      {
        "id": "grill-transfer|8262",
        "mrn": "8262",
        "name": "Pineapple, Fresh, Sliced",
        "quantity": 1,
        "unit": "slice",
        "costPerPortion": 0,
        "glCode": "4111012"
      }
    ],
    "63329.3": [
      {
        "id": "grill-transfer|31228",
        "mrn": "31228",
        "name": "Bun, Brioche, Vegan, 2.57 oz, La Brea, Frozen",
        "quantity": 1,
        "unit": "each",
        "costPerPortion": 0.68,
        "glCode": "4111010"
      },
      {
        "id": "grill-transfer|9165",
        "mrn": "9165",
        "name": "Cheese, Cheddar, Mild, Loaf, Great Lakes, Sliced, .5 oz",
        "quantity": 2,
        "unit": "slice",
        "costPerPortion": 0.19,
        "glCode": "4111006"
      },
      {
        "id": "grill-transfer|3764",
        "mrn": "3764",
        "name": "Lettuce, Iceberg, Individual Leaf, Fresh",
        "quantity": 1,
        "unit": "each",
        "costPerPortion": 0.03,
        "glCode": "4111012"
      },
      {
        "id": "grill-transfer|4183",
        "mrn": "4183",
        "name": "Onions, French Fried, Dried",
        "quantity": 0.5,
        "unit": "cup",
        "costPerPortion": 0.32,
        "glCode": "4111005"
      },
      {
        "id": "grill-transfer|225846",
        "mrn": "225846",
        "name": "Pickles, Dill Chips, Kosher, Block & Barrel, Bulk",
        "quantity": 3,
        "unit": "each",
        "costPerPortion": 0.03,
        "glCode": "4111012"
      }
    ],
    "78211.2": [
      {
        "id": "grill-transfer|31228",
        "mrn": "31228",
        "name": "Bun, Brioche, Vegan, 2.57 oz, La Brea, Frozen",
        "quantity": 1,
        "unit": "each",
        "costPerPortion": 0.68,
        "glCode": "4111010"
      },
      {
        "id": "grill-transfer|3764",
        "mrn": "3764",
        "name": "Lettuce, Iceberg, Individual Leaf, Fresh",
        "quantity": 1,
        "unit": "each",
        "costPerPortion": 0.03,
        "glCode": "4111012"
      },
      {
        "id": "grill-transfer|166043",
        "mrn": "166043",
        "name": "Onions, Red, Fresh, Each Slice, 1/4\"",
        "quantity": 1,
        "unit": "slice",
        "costPerPortion": 0.04,
        "glCode": "4111012"
      },
      {
        "id": "grill-transfer|225846",
        "mrn": "225846",
        "name": "Pickles, Dill Chips, Kosher, Block & Barrel, Bulk",
        "quantity": 3,
        "unit": "each",
        "costPerPortion": 0.03,
        "glCode": "4111012"
      },
      {
        "id": "grill-transfer|56055",
        "mrn": "56055",
        "name": "Tomatoes, 5x6, Fresh, Sliced",
        "quantity": 2,
        "unit": "slice",
        "costPerPortion": 0.12,
        "glCode": "4111005"
      }
    ],
    "165740.2": [
      {
        "id": "grill-transfer|31228",
        "mrn": "31228",
        "name": "Bun, Brioche, Vegan, 2.57 oz, La Brea, Frozen",
        "quantity": 1,
        "unit": "each",
        "costPerPortion": 0.68,
        "glCode": "4111010"
      },
      {
        "id": "grill-transfer|3764",
        "mrn": "3764",
        "name": "Lettuce, Iceberg, Individual Leaf, Fresh",
        "quantity": 1,
        "unit": "each",
        "costPerPortion": 0.03,
        "glCode": "4111012"
      },
      {
        "id": "grill-transfer|169286",
        "mrn": "169286",
        "name": "Oil, Canola, 100%",
        "quantity": 0.5,
        "unit": "tsp",
        "costPerPortion": 0.0092,
        "glCode": "4111005"
      },
      {
        "id": "grill-transfer|225846",
        "mrn": "225846",
        "name": "Pickles, Dill Chips, Kosher, Block & Barrel, Bulk",
        "quantity": 3,
        "unit": "each",
        "costPerPortion": 0.03,
        "glCode": "4111012"
      },
      {
        "id": "grill-transfer|56055",
        "mrn": "56055",
        "name": "Tomatoes, 5x6, Fresh, Sliced",
        "quantity": 2,
        "unit": "slice",
        "costPerPortion": 0.12,
        "glCode": "4111005"
      }
    ],
    "77139.70": [
      {
        "id": "grill-transfer|31228",
        "mrn": "31228",
        "name": "Bun, Brioche, Vegan, 2.57 oz, La Brea, Frozen",
        "quantity": 1,
        "unit": "each",
        "costPerPortion": 0.68,
        "glCode": "4111010"
      },
      {
        "id": "grill-transfer|1712",
        "mrn": "1712",
        "name": "Chicken, Breast, Boneless, Skinless, 5 oz, Tyson, Raw",
        "quantity": 1,
        "unit": "each",
        "costPerPortion": 1.28,
        "glCode": "4111003"
      },
      {
        "id": "grill-transfer|3764",
        "mrn": "3764",
        "name": "Lettuce, Iceberg, Individual Leaf, Fresh",
        "quantity": 1,
        "unit": "each",
        "costPerPortion": 0.03,
        "glCode": "4111012"
      },
      {
        "id": "grill-transfer|169286",
        "mrn": "169286",
        "name": "Oil, Canola, 100%",
        "quantity": 1,
        "unit": "tbsp",
        "costPerPortion": 0.055,
        "glCode": "4111005"
      },
      {
        "id": "grill-transfer|166043",
        "mrn": "166043",
        "name": "Onions, Red, Fresh, Each Slice, 1/4\"",
        "quantity": 2,
        "unit": "slice",
        "costPerPortion": 0.08,
        "glCode": "4111012"
      },
      {
        "id": "grill-transfer|56055",
        "mrn": "56055",
        "name": "Tomatoes, 5x6, Fresh, Sliced",
        "quantity": 2,
        "unit": "slice",
        "costPerPortion": 0.12,
        "glCode": "4111005"
      }
    ],
    "77139.69": [
      {
        "id": "grill-transfer|31228",
        "mrn": "31228",
        "name": "Bun, Brioche, Vegan, 2.57 oz, La Brea, Frozen",
        "quantity": 1,
        "unit": "each",
        "costPerPortion": 0.68,
        "glCode": "4111010"
      },
      {
        "id": "grill-transfer|7775",
        "mrn": "7775",
        "name": "Cheese, Havarti, Roth Kase",
        "quantity": 0.75,
        "unit": "ounce",
        "costPerPortion": 0.2175,
        "glCode": "4111006"
      },
      {
        "id": "grill-transfer|3764",
        "mrn": "3764",
        "name": "Lettuce, Iceberg, Individual Leaf, Fresh",
        "quantity": 1,
        "unit": "each",
        "costPerPortion": 0.03,
        "glCode": "4111012"
      },
      {
        "id": "grill-transfer|169286",
        "mrn": "169286",
        "name": "Oil, Canola, 100%",
        "quantity": 1,
        "unit": "tbsp",
        "costPerPortion": 0.055,
        "glCode": "4111005"
      },
      {
        "id": "grill-transfer|166043",
        "mrn": "166043",
        "name": "Onions, Red, Fresh, Each Slice, 1/4\"",
        "quantity": 2,
        "unit": "slice",
        "costPerPortion": 0.08,
        "glCode": "4111012"
      },
      {
        "id": "grill-transfer|15372",
        "mrn": "15372",
        "name": "Potatoes, Hash Brown, Shredded, McCain, Frozen",
        "quantity": 4,
        "unit": "ounce",
        "costPerPortion": 0.44,
        "glCode": "4111005"
      },
      {
        "id": "grill-transfer|82193",
        "mrn": "82193",
        "name": "Seasoning, Mesquite, BBQ, McCormick",
        "quantity": 1,
        "unit": "tbsp",
        "costPerPortion": 0.06,
        "glCode": "4111005"
      },
      {
        "id": "grill-transfer|56055",
        "mrn": "56055",
        "name": "Tomatoes, 5x6, Fresh, Sliced",
        "quantity": 2,
        "unit": "slice",
        "costPerPortion": 0.12,
        "glCode": "4111005"
      },
      {
        "id": "grill-transfer|85770",
        "mrn": "85770",
        "name": "Oil, Canola, Liquid Frying, Frilite",
        "quantity": 15.666667,
        "unit": "g",
        "costPerPortion": 0,
        "glCode": "4111005"
      }
    ],
    "147955.17": [
      {
        "id": "grill-transfer|31228",
        "mrn": "31228",
        "name": "Bun, Brioche, Vegan, 2.57 oz, La Brea, Frozen",
        "quantity": 1,
        "unit": "each",
        "costPerPortion": 0.68,
        "glCode": "4111010"
      },
      {
        "id": "grill-transfer|3764",
        "mrn": "3764",
        "name": "Lettuce, Iceberg, Individual Leaf, Fresh",
        "quantity": 1,
        "unit": "each",
        "costPerPortion": 0.03,
        "glCode": "4111012"
      },
      {
        "id": "grill-transfer|169286",
        "mrn": "169286",
        "name": "Oil, Canola, 100%",
        "quantity": 1,
        "unit": "tbsp",
        "costPerPortion": 0.055,
        "glCode": "4111005"
      },
      {
        "id": "grill-transfer|166043",
        "mrn": "166043",
        "name": "Onions, Red, Fresh, Each Slice, 1/4\"",
        "quantity": 2,
        "unit": "slice",
        "costPerPortion": 0.08,
        "glCode": "4111012"
      },
      {
        "id": "grill-transfer|225846",
        "mrn": "225846",
        "name": "Pickles, Dill Chips, Kosher, Block & Barrel, Bulk",
        "quantity": 3,
        "unit": "each",
        "costPerPortion": 0.03,
        "glCode": "4111012"
      },
      {
        "id": "grill-transfer|56055",
        "mrn": "56055",
        "name": "Tomatoes, 5x6, Fresh, Sliced",
        "quantity": 2,
        "unit": "slice",
        "costPerPortion": 0.12,
        "glCode": "4111005"
      }
    ],
    "77139.66": [
      {
        "id": "grill-transfer|31228",
        "mrn": "31228",
        "name": "Bun, Brioche, Vegan, 2.57 oz, La Brea, Frozen",
        "quantity": 1,
        "unit": "each",
        "costPerPortion": 0.68,
        "glCode": "4111010"
      },
      {
        "id": "grill-transfer|1605",
        "mrn": "1605",
        "name": "Cheese, American, Pre-Sliced, .5 oz, Great Lakes",
        "quantity": 1,
        "unit": "slice",
        "costPerPortion": 0.16,
        "glCode": "4111006"
      },
      {
        "id": "grill-transfer|3764",
        "mrn": "3764",
        "name": "Lettuce, Iceberg, Individual Leaf, Fresh",
        "quantity": 1,
        "unit": "each",
        "costPerPortion": 0.03,
        "glCode": "4111012"
      },
      {
        "id": "grill-transfer|169286",
        "mrn": "169286",
        "name": "Oil, Canola, 100%",
        "quantity": 1,
        "unit": "tbsp",
        "costPerPortion": 0.055,
        "glCode": "4111005"
      },
      {
        "id": "grill-transfer|166043",
        "mrn": "166043",
        "name": "Onions, Red, Fresh, Each Slice, 1/4\"",
        "quantity": 2,
        "unit": "slice",
        "costPerPortion": 0.08,
        "glCode": "4111012"
      },
      {
        "id": "grill-transfer|225846",
        "mrn": "225846",
        "name": "Pickles, Dill Chips, Kosher, Block & Barrel, Bulk",
        "quantity": 3,
        "unit": "each",
        "costPerPortion": 0.03,
        "glCode": "4111012"
      },
      {
        "id": "grill-transfer|56055",
        "mrn": "56055",
        "name": "Tomatoes, 5x6, Fresh, Sliced",
        "quantity": 2,
        "unit": "slice",
        "costPerPortion": 0.12,
        "glCode": "4111005"
      }
    ],
    "83088.1": [
      {
        "id": "grill-transfer|31228",
        "mrn": "31228",
        "name": "Bun, Brioche, Vegan, 2.57 oz, La Brea, Frozen",
        "quantity": 1,
        "unit": "each",
        "costPerPortion": 0.68,
        "glCode": "4111010"
      },
      {
        "id": "grill-transfer|170538",
        "mrn": "170538",
        "name": "Burger, Meatless, Black Bean, Actual Veggies, 4 oz, Frozen",
        "quantity": 1,
        "unit": "each",
        "costPerPortion": 1.3433,
        "glCode": "4111003"
      },
      {
        "id": "grill-transfer|3762",
        "mrn": "3762",
        "name": "Lettuce, Leaf, Individual Leaf, Fresh",
        "quantity": 1,
        "unit": "each",
        "costPerPortion": 0.08,
        "glCode": "4111012"
      },
      {
        "id": "grill-transfer|169286",
        "mrn": "169286",
        "name": "Oil, Canola, 100%",
        "quantity": 1,
        "unit": "tbsp",
        "costPerPortion": 0.055,
        "glCode": "4111005"
      },
      {
        "id": "grill-transfer|56055",
        "mrn": "56055",
        "name": "Tomatoes, 5x6, Fresh, Sliced",
        "quantity": 2,
        "unit": "slice",
        "costPerPortion": 0.12,
        "glCode": "4111005"
      },
      {
        "id": "grill-transfer|179508",
        "mrn": "179508",
        "name": "Avocado, Hand Scooped, Wholly Avocado, Fresh",
        "quantity": 2,
        "unit": "scoop #16",
        "costPerPortion": 0,
        "glCode": "4111012"
      }
    ],
    "107374.35": [
      {
        "id": "grill-transfer|31228",
        "mrn": "31228",
        "name": "Bun, Brioche, Vegan, 2.57 oz, La Brea, Frozen",
        "quantity": 1,
        "unit": "each",
        "costPerPortion": 0.68,
        "glCode": "4111010"
      },
      {
        "id": "grill-transfer|191189",
        "mrn": "191189",
        "name": "Chicken, Breast, Fillet, Breaded, Spicy, 4oz, Koch, Frozen",
        "quantity": 1,
        "unit": "each",
        "costPerPortion": 1.54,
        "glCode": "4111003"
      },
      {
        "id": "grill-transfer|108406",
        "mrn": "108406",
        "name": "Mayo, Vegan, Hellmann's, Bulk",
        "quantity": 2,
        "unit": "tbsp",
        "costPerPortion": 0.2,
        "glCode": "4111005"
      },
      {
        "id": "grill-transfer|169286",
        "mrn": "169286",
        "name": "Oil, Canola, 100%",
        "quantity": 1,
        "unit": "tbsp",
        "costPerPortion": 0.055,
        "glCode": "4111005"
      },
      {
        "id": "grill-transfer|225846",
        "mrn": "225846",
        "name": "Pickles, Dill Chips, Kosher, Block & Barrel, Bulk",
        "quantity": 3,
        "unit": "each",
        "costPerPortion": 0.03,
        "glCode": "4111012"
      },
      {
        "id": "grill-transfer|85770",
        "mrn": "85770",
        "name": "Oil, Canola, Liquid Frying, Frilite",
        "quantity": 1,
        "unit": "g",
        "costPerPortion": 0,
        "glCode": "4111005"
      }
    ],
    "77139.67": [
      {
        "id": "grill-transfer|31228",
        "mrn": "31228",
        "name": "Bun, Brioche, Vegan, 2.57 oz, La Brea, Frozen",
        "quantity": 1,
        "unit": "each",
        "costPerPortion": 0.68,
        "glCode": "4111010"
      },
      {
        "id": "grill-transfer|3764",
        "mrn": "3764",
        "name": "Lettuce, Iceberg, Individual Leaf, Fresh",
        "quantity": 1,
        "unit": "each",
        "costPerPortion": 0.03,
        "glCode": "4111012"
      },
      {
        "id": "grill-transfer|169286",
        "mrn": "169286",
        "name": "Oil, Canola, 100%",
        "quantity": 1,
        "unit": "tbsp",
        "costPerPortion": 0.055,
        "glCode": "4111005"
      },
      {
        "id": "grill-transfer|166043",
        "mrn": "166043",
        "name": "Onions, Red, Fresh, Each Slice, 1/4\"",
        "quantity": 2,
        "unit": "slice",
        "costPerPortion": 0.08,
        "glCode": "4111012"
      },
      {
        "id": "grill-transfer|225846",
        "mrn": "225846",
        "name": "Pickles, Dill Chips, Kosher, Block & Barrel, Bulk",
        "quantity": 3,
        "unit": "each",
        "costPerPortion": 0.03,
        "glCode": "4111012"
      },
      {
        "id": "grill-transfer|56055",
        "mrn": "56055",
        "name": "Tomatoes, 5x6, Fresh, Sliced",
        "quantity": 2,
        "unit": "slice",
        "costPerPortion": 0.12,
        "glCode": "4111005"
      }
    ],
    "5294.29": [
      {
        "id": "grill-transfer|4123",
        "mrn": "4123",
        "name": "Mushrooms, Portobello, Fresh",
        "quantity": 1,
        "unit": "ounce",
        "costPerPortion": 0.24,
        "glCode": "4111005"
      },
      {
        "id": "grill-transfer|169286",
        "mrn": "169286",
        "name": "Oil, Canola, 100%",
        "quantity": 0.166667,
        "unit": "tbsp",
        "costPerPortion": 0.0092,
        "glCode": "4111005"
      },
      {
        "id": "grill-transfer|4253",
        "mrn": "4253",
        "name": "Onions, Red, Fresh, Each Ring, 1/4\"",
        "quantity": 0.666667,
        "unit": "ounce",
        "costPerPortion": 0.02,
        "glCode": "4111012"
      },
      {
        "id": "grill-transfer|8065",
        "mrn": "8065",
        "name": "Peppers, Bell, Red, Fresh",
        "quantity": 1,
        "unit": "ounce",
        "costPerPortion": 0.6075,
        "glCode": "4111012"
      },
      {
        "id": "grill-transfer|7411",
        "mrn": "7411",
        "name": "Salt, Kosher",
        "quantity": 0.027778,
        "unit": "tsp",
        "costPerPortion": 0.0022,
        "glCode": "4111005"
      },
      {
        "id": "grill-transfer|55272",
        "mrn": "55272",
        "name": "Squash, Yellow, Fresh, Bias Cut, Halved, 1/2\"",
        "quantity": 1,
        "unit": "ounce",
        "costPerPortion": 0.3333,
        "glCode": "4111012"
      },
      {
        "id": "grill-transfer|7462",
        "mrn": "7462",
        "name": "Squash, Zucchini, Fresh, Bias Cut, Halved, 1/2\"",
        "quantity": 1.083333,
        "unit": "ounce",
        "costPerPortion": 0.3611,
        "glCode": "4111012"
      },
      {
        "id": "grill-transfer|7390",
        "mrn": "7390",
        "name": "Spice, Pepper, Black, Ground",
        "quantity": 0.027778,
        "unit": "tsp",
        "costPerPortion": 0,
        "glCode": "4111005"
      }
    ]
  }
});

export const GRILL_LTO_ITEM_MRNS = Object.freeze([...new Set([...GRILL_LTO_PROGRAM.cycleWeeks.flatMap((week) => [...week.setA, ...week.setB]), ...GRILL_LTO_PROGRAM.coreItems].map((item) => item.mrn))]);
export const GRILL_LTO_PREP_ITEM_IDS = Object.freeze([...new Set(Object.values(GRILL_LTO_PROGRAM.itemPrepComponents).flat().map((item) => item.id))]);
