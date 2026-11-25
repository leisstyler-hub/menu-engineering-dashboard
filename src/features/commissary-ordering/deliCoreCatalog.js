// Synchronized from Alex's authoritative complete Deli Core MenuWorks export.
// Shared costs remain authoritative in Supabase recipe_items; recipe files remain private Supabase documents.

export const DELI_CORE_SELECTED_CATALOG = Object.freeze({
  "version": 2,
  "menu": "AMZ: Deli Core",
  "itemSource": "supabase.recipe_items",
  "recipeDocumentSource": "supabase.recipe_item_documents",
  "exactMrnRequired": true,
  "source": {
    "fileName": "MenuWorks_AMZ_Deli_Core_2026-11-25.csv",
    "sha256": "47a313bbc0e914cabdd13ce9530ece29dc9d6d5f11a3748ad0662d90323b2d33",
    "verifiedAt": "2026-11-25",
    "authority": "complete-menu-replacement"
  },
  "items": [
    {
      "mrn": "174951",
      "name": "Mediterranean Sandwich",
      "station": "Curated Sandwiches",
      "recipePage": 2
    },
    {
      "mrn": "37311.43",
      "name": "Chicken Caesar Wrap",
      "station": "Curated Sandwiches",
      "recipePage": 6
    },
    {
      "mrn": "76623.4",
      "name": "Italian Grinder",
      "station": "Curated Sandwiches",
      "recipePage": 8
    },
    {
      "mrn": "190990",
      "name": "Mediterranean Turkey Wrap",
      "station": "Curated Sandwiches",
      "recipePage": 9
    },
    {
      "mrn": "34303.46",
      "name": "Roast Beef and Cheddar Sandwich",
      "station": "Curated Sandwiches",
      "recipePage": 10
    },
    {
      "mrn": "37001.21",
      "name": "Turkey Apple Brie Sandwich",
      "station": "Curated Sandwiches",
      "recipePage": 11
    },
    {
      "mrn": "148838.3",
      "name": "Turkey Avocado Club",
      "station": "Curated Sandwiches",
      "recipePage": 12
    },
    {
      "mrn": "142803",
      "name": "Green California Crunch Sandwich",
      "station": "Curated Sandwiches",
      "recipePage": 13
    },
    {
      "mrn": "16392",
      "name": "Portobello Provolone Wrap",
      "station": "Curated Sandwiches",
      "recipePage": 15
    },
    {
      "mrn": "104208.27",
      "name": "Caprese Chicken on Telera",
      "station": "Curated Sandwiches",
      "recipePage": 18
    },
    {
      "mrn": "85656.3",
      "name": "Southwest Grilled Chicken Wrap",
      "station": "Regional Spotlights - Deli",
      "recipePage": 22
    },
    {
      "mrn": "129693.5",
      "name": "Shrimp Salad Sandwich",
      "station": "Regional Spotlights - Deli",
      "recipePage": 28
    },
    {
      "mrn": "37154.1",
      "name": "Roast Beef Florentine Sandwich",
      "station": "Curated Sandwiches",
      "recipePage": 30
    },
    {
      "mrn": "9282.7",
      "name": "Buffalo Chicken Wrap",
      "station": "Curated Sandwiches",
      "recipePage": 33
    },
    {
      "mrn": "108987",
      "name": "Tuscan Vegetable Sandwich",
      "station": "Curated Sandwiches",
      "recipePage": 37
    },
    {
      "mrn": "161945",
      "name": "Waldorf Chicken Salad Croissant",
      "station": "Curated Sandwiches",
      "recipePage": 49
    },
    {
      "mrn": "37394.7",
      "name": "Banh Mi Ham Sandwich",
      "station": "Regional Spotlights - Deli",
      "recipePage": 50
    },
    {
      "mrn": "134036.4",
      "name": "Charred Eggplant, Shaved Parmesan, Arugula, Smoky Romesco on Rustico Ciabatta",
      "station": "Curated Sandwiches",
      "recipePage": 51
    },
    {
      "mrn": "37007.1",
      "name": "Chicken Artichoke Pesto Sandwich",
      "station": "Curated Sandwiches",
      "recipePage": 52
    },
    {
      "mrn": "144636",
      "name": "Muffaletta",
      "station": "Regional Spotlights - Deli",
      "recipePage": 56
    },
    {
      "mrn": "141826.1",
      "name": "Med Tuna Salad On Wheat Roll",
      "station": "Curated Sandwiches",
      "recipePage": null,
      "recipeEvidence": "MenuWorks item metadata only; recipe components remain unavailable."
    }
  ],
  "unsupported": [
    {
      "mrn": "234913",
      "name": "Shrimp Avocado Corn Wrap",
      "reason": "No exact-MRN recipe or cost row was present in the supplied sources."
    }
  ]
});

export const DELI_CORE_SELECTED_MRNS = Object.freeze(DELI_CORE_SELECTED_CATALOG.items.map(({ mrn }) => mrn));
