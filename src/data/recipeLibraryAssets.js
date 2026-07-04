const ANDES_ASSET_BASE = "/assets/recipe-library/andes";

export const MENU_HEADER_ASSETS = {
  "AMZ: Andes": {
    src: `${ANDES_ASSET_BASE}/andes-group.jpg`,
    alt: "Andes menu group photo",
    label: "Andes menu photography",
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
  if (menu !== "AMZ: Andes") return null;
  const searchable = normalizeAssetText([
    rowOrItem.display_name,
    rowOrItem.displayName,
    rowOrItem.item,
    rowOrItem.recipe_name,
    rowOrItem.recipeName,
    rowOrItem.short_name,
    rowOrItem.shortName,
  ].filter(Boolean).join(" "));
  const match = Object.entries(ANDES_ITEM_PHOTOS)
    .find(([dishName]) => searchable.includes(dishName));
  if (!match) return null;
  const [dishName, fileName] = match;
  return {
    src: `${ANDES_ASSET_BASE}/${fileName}`,
    alt: `${dishName} photo`,
    label: "Photo attached",
    source: "curated",
  };
}
