const RECIPE_LIBRARY_ASSET_BASE = "/assets/recipe-library";

const menuAssetBase = (folder) => `${RECIPE_LIBRARY_ASSET_BASE}/${folder}`;

export const MENU_HEADER_ASSETS = {
  "AMZ: Andes": {
    src: `${menuAssetBase("andes")}/andes-group.jpg`,
    alt: "Andes menu group photo",
    label: "Andes menu photography",
  },
  "AMZ: Atlas Noodle": {
    src: `${menuAssetBase("atlas-noodle")}/atlas-noodle-group.jpg`,
    alt: "Atlas Noodle menu group photo",
    label: "Atlas Noodle menu photography",
  },
  "AMZ: Anisa": {
    src: `${menuAssetBase("anisa")}/anisa-group.jpg`,
    alt: "Anisa menu group photo",
    label: "Anisa menu photography",
  },
  "AMZ: Breakfast": {
    src: `${menuAssetBase("breakfast")}/breakfast-group.jpg`,
    alt: "Breakfast menu group photo",
    label: "Breakfast menu photography",
  },
  "AMZ: Carvery": {
    src: `${menuAssetBase("carvery")}/carvery-group.jpg`,
    alt: "Carvery menu group photo",
    label: "Carvery menu photography",
  },
};

const ANDES_ITEM_PHOTOS = {
  "arroz chaufa": "arroz-chaufa.jpg",
  "french fries": "french-fries.jpg",
  "fried plantains": "fried-plantains.jpg",
  "lomo saltado": "lomo-saltado.jpg",
  "peruvian almond horchata pudding": "peruvian-almond-horchata-pudding.jpg",
  "peruvian grilled asparagus": "peruvian-grilled-asparagus.jpg",
  "peruvian roasted potatoes": "peruvian-roasted-potatoes.jpg",
  "peruvian shrimp": "peruvian-shrimp.jpg",
  "peruvian stewed chicken": "peruvian-stewed-chicken.jpg",
  "peruvian stewed tofu": "peruvian-stewed-tofu.jpg",
  "pollo a la brasa": "pollo-a-la-brasa.jpg",
  quinoa: "quinoa.jpg",
  "salsa criolla": "salsa-criolla-peruvian-salad.jpg",
  "solterito": "solterito-chopped-corn-salad.jpg",
  "yucca fries": "yucca-fries.jpg",
};

const CURATED_MENU_PHOTOS = {
  "AMZ: Andes": { folder: "andes", photos: ANDES_ITEM_PHOTOS },
  "AMZ: Atlas Noodle": {
    folder: "atlas-noodle",
    photos: {
      "black sesame miso cookies": "black-sesame-miso-cookies.jpg",
      "chicken chashu sesame ramen": "chicken-chashu-sesame-ramen.jpg",
      "chashu tofu sesame ramen": "chashu-tofu-sesame-ramen.jpg",
      "pork belly black tonkotsu ramen bowl": "pork-belly-black-tonkotsu-ramen-bowl.jpg",
      "pork belly jajangmyeon": "pork-belly-jajangmyeon.jpg",
      "steak jajangmyeon": "steak-jajangmyeon.jpg",
      "tofu jajangmyeon": "tofu-jajangmyeon.jpg",
    },
  },
  "AMZ: Anisa": {
    folder: "anisa",
    photos: {
      "black tea": "black-tea.jpg",
      "chicken souvlaki kebab plate": "chicken-souvlaki-kebab-plate.jpg",
      "crisp cucumber salad": "crisp-cucumber-salad.jpg",
      "crispy saffron rice with yogurt and eggs": "crispy-saffron-rice.jpg",
      "fresh olive feta mezze platter": "fresh-olive-feta-mezze-platter.jpg",
      "grilled vegetables": "grilled-vegetables.jpg",
      "harissa cauliflower and hummus": "harissa-cauliflower-and-hummus.jpg",
      "jewelled rice": "jewelled-rice.jpg",
      "lamb kofta kebab plate": "lamb-kofta-kebab-plate.jpg",
      "lemon basmati rice": "lemon-basmati-rice.jpg",
      "lemon herb halloumi kebab plate": "lemon-herb-halloumi-kebab-plate.jpg",
      "persian pistachio cake": "persian-pistachio-cake.jpg",
      "sfoof cake": "sfoof-cake.jpg",
      "sumac tomato eggplant plate": "sumac-tomato-eggplant-plate.jpg",
      "tabbouleh": "tabbouleh.jpg",
      "za atar lamb kofta kebab plate": "zaatar-lamb-kofta-kebab-plate.jpg",
      "zaffron ember chicken plate": "zaffron-ember-chicken-plate.jpg",
    },
  },
  "AMZ: Bibimbowl": {
    folder: "bibimbowl",
    photos: {
      "beef bulgogi bibimbap bowl": "beef-bulgogi-bibimbap-bowl.jpg",
      "gochujang chicken bibimbap bowl": "gochujang-chicken-bibimbap-bowl.jpg",
      "gochujang pork bibimbap bowl": "gochujang-pork-bibimbap-bowl.jpg",
      "gochujang tofu bibimbap bowl": "gochujang-tofu-bibimbap-bowl.jpg",
      "sesame peanut hotteok pancake": "sesame-peanut-hotteok-pancake.jpg",
      "shrimp bibimbap bowl": "shrimp-bibimbap-bowl.jpg",
    },
  },
  "AMZ: Balti": {
    folder: "balti",
    photos: {
      "aloo gobhi": "aloo-gobhi.jpg",
      "basmati rice": "basmati-rice.jpg",
      "bhuna dal": "bhuna-dal.jpg",
      "butter chicken plate": "butter-chicken-plate.jpg",
      "chana masala": "chana-masala.jpg",
      "chicken jalfrezi plate": "chicken-jalfrezi-plate.jpg",
      "kale poriyal": "kale-poriyal.jpg",
      "lamb rogan josh plate": "lamb-rogan-josh-plate.jpg",
      "matar paneer plate": "matar-paneer-plate.jpg",
      "shrimp coconut curry plate": "shrimp-coconut-curry-plate.jpg",
    },
  },
  "AMZ: Breakfast": {
    folder: "breakfast",
    photos: {
      "3 eggs cooked to order": "three-eggs-cooked-to-order.jpg",
      "avocado toast": "avocado-toast.jpg",
      "bacon and egg burrito": "bacon-and-egg-burrito.jpg",
      "bacon egg and cheese taco": "bacon-egg-and-cheese-taco.jpg",
      "bacon egg cheddar croissant": "bacon-egg-cheddar-croissant.jpg",
      "bacon egg and cheese bagel breakfast sandwich": "bacon-egg-cheese-bagel-sandwich.jpg",
      "bacon egg and cheese breakfast sandwich": "bacon-egg-cheese-breakfast-sandwich.jpg",
      "biscuits and gravy": "biscuits-and-gravy.jpg",
      "brioche french toast": "brioche-french-toast.jpg",
      "breakfast burrito supreme": "breakfast-burrito-supreme.jpg",
      "buttermilk pancakes plate": "buttermilk-pancakes-plate.jpg",
      "carrot cake almond chia pudding": "carrot-cake-almond-chia-pudding.jpg",
      "chocolate strawberry chia pudding": "chocolate-strawberry-chia-pudding.jpg",
      "chorizo potato and egg burrito": "chorizo-potato-egg-burrito.jpg",
      "deluxe breakfast sandwich": "deluxe-breakfast-sandwich.jpg",
      "egg and cheese bagel breakfast sandwich": "egg-cheese-bagel-sandwich.jpg",
      "egg and cheese breakfast sandwich": "egg-cheese-breakfast-sandwich.jpg",
      "ham egg and cheese wheat muffin": "ham-egg-cheese-wheat-muffin.jpg",
      "lox bagel": "lox-bagel.jpg",
      "mediterranean egg white wrap": "mediterranean-egg-white-wrap.jpg",
      "mediterranean quiche": "mediterranean-quiche.jpg",
      "pistachio pomegranate overnight oats": "pistachio-pomegranate-overnight-oats.jpg",
      "potato egg and cheese taco": "potato-egg-cheese-taco.jpg",
      "potatoes o brien": "potatoes-obrien.jpg",
      "sausage egg and cheese bagel breakfast sandwich": "sausage-egg-cheese-bagel-sandwich.jpg",
      "sausage egg and cheese biscuit": "sausage-egg-cheese-biscuit.jpg",
      "sausage egg and cheese breakfast sandwich": "sausage-egg-cheese-breakfast-sandwich.jpg",
      "scrambled eggs": "scrambled-eggs.jpg",
      "soyrizo breakfast burrito": "soyrizo-breakfast-burrito.jpg",
      "three egg omelet": "three-egg-omelet.jpg",
      "turkey sausage link": "turkey-sausage-link.jpg",
    },
  },
  "AMZ: Carvery": {
    folder: "carvery",
    photos: {
      "beef brisket": "beef-brisket.jpg",
      "beef brisket sandwich": "beef-brisket-sandwich.jpg",
      "black forest ham and brie panini": "black-forest-ham-brie-panini.jpg",
      "braised cabbage apples and bacon": "braised-cabbage-apples-bacon.jpg",
      "broccoli and cheddar salad": "broccoli-cheddar-salad.jpg",
      "carved cajun turkey breast": "carved-cajun-turkey-breast.jpg",
      "carved pork loin": "carved-pork-loin.jpg",
      "classic beef french dip": "classic-beef-french-dip.jpg",
      "coleslaw": "coleslaw.jpg",
      "corned beef brisket": "corned-beef-brisket.jpg",
      "creamy potato salad": "creamy-potato-salad.jpg",
      "cuban": "cuban.jpg",
      "cucumber tomato salad": "cucumber-tomato-salad.jpg",
      "garlic green beans": "garlic-green-beans.jpg",
      "garlic herb roasted leg of lamb": "garlic-herb-roasted-leg-of-lamb.jpg",
      "garlic lemon broccolini": "garlic-lemon-broccolini.jpg",
      "greek pasta salad": "greek-pasta-salad.jpg",
      "herb roasted potatoes": "herb-roasted-potatoes.jpg",
      "herb roasted turkey breast": "herb-roasted-turkey-breast.jpg",
      "lemon green beans with capers": "lemon-green-beans-capers.jpg",
      "mac and cheese": "mac-and-cheese.jpg",
      "maple roasted carrots": "maple-roasted-carrots.jpg",
      "mashed potatoes": "mashed-potatoes.jpg",
      "monster meatloaf": "monster-meatloaf.jpg",
      "porchetta sandwich": "porchetta-sandwich.jpg",
      "portobello reuben": "portobello-reuben.jpg",
      "roasted brussels sprouts": "roasted-brussels-sprouts.jpg",
      "roasted fingerling potatoes": "roasted-fingerling-potatoes.jpg",
      "roasted sweet potato": "roasted-sweet-potato.jpg",
      "rosemary crusted pork loin": "rosemary-crusted-pork-loin.jpg",
      "scalloped potatoes": "scalloped-potatoes.jpg",
      "spiced leg of lamb": "spiced-leg-of-lamb.jpg",
      "spiced maple soy glazed steelhead": "spiced-maple-soy-glazed-steelhead.jpg",
      "spiced roasted kabocha squash": "spiced-roasted-kabocha-squash.jpg",
      "thai rice noodle salad with peanuts": "thai-rice-noodle-salad-peanuts.jpg",
      "tomato and mozzarella caprese salad": "tomato-mozzarella-caprese-salad.jpg",
      "traditional meatloaf": "traditional-meatloaf.jpg",
      "tuscan turkey sandwich": "tuscan-turkey-sandwich.jpg",
      "white bean kale salad": "white-bean-kale-salad.jpg",
    },
  },
};

const PHOTO_FIELD_KEYS = [
  "photoUrl",
  "photoURL",
  "photo_url",
  "itemPhotoUrl",
  "item_photo_url",
  "itemPhotoPath",
  "photoPath",
  "imageUrl",
  "image_url",
  "imagePath",
  "photo",
  "image",
];

function normalizeAssetText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function photoString(value) {
  if (!value) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "object") {
    return photoString(value.src || value.url || value.path || value.href || value.publicUrl || value.public_url);
  }
  return "";
}

function uploadedPhotoSource(rowOrItem = {}) {
  for (const key of PHOTO_FIELD_KEYS) {
    const src = photoString(rowOrItem[key]);
    if (src) return src;
  }

  const documentRows = [
    ...(Array.isArray(rowOrItem.documents) ? rowOrItem.documents : []),
    ...(Array.isArray(rowOrItem.files) ? rowOrItem.files : []),
    ...(Array.isArray(rowOrItem.file_attachments) ? rowOrItem.file_attachments : []),
  ];
  const photoDocument = documentRows.find((file) => {
    const typeText = normalizeAssetText([file?.type, file?.category, file?.fileCategory, file?.label, file?.name].filter(Boolean).join(" "));
    return typeText.includes("photo") || typeText.includes("image");
  });
  return photoString(photoDocument);
}

export function getRecipeLibraryPhoto(rowOrItem = {}) {
  const uploadedSrc = uploadedPhotoSource(rowOrItem);
  if (uploadedSrc) {
    return {
      src: uploadedSrc,
      alt: `${rowOrItem.display_name || rowOrItem.displayName || rowOrItem.item || rowOrItem.recipe_name || "Recipe item"} photo`,
      label: "Photo attached",
      source: "uploaded",
    };
  }

  const menu = rowOrItem.menu || "";
  const curatedMenu = CURATED_MENU_PHOTOS[menu];
  if (!curatedMenu) return null;
  const searchableNames = [
    rowOrItem.display_name,
    rowOrItem.displayName,
    rowOrItem.item,
    rowOrItem.recipe_name,
    rowOrItem.recipeName,
    rowOrItem.short_name,
    rowOrItem.shortName,
  ].filter(Boolean).map(normalizeAssetText);
  const match = Object.entries(curatedMenu.photos)
    .find(([dishName]) => searchableNames.includes(dishName));
  if (!match) return null;
  const [dishName, fileName] = match;
  return {
    src: `${menuAssetBase(curatedMenu.folder)}/${fileName}`,
    alt: `${dishName} photo`,
    label: "Photo attached",
    source: "curated",
  };
}
