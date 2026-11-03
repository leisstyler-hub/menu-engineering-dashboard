// Current concept assignments shared across Pairwise, W&P and exports.
export const PILLARS = [
  { name: "Latin", color: "#D97706", menus: ["Andes", "Cevicheria", "Ciudad", "La Chino", "Porto", "SMACO", "Taco Total"] },
  { name: "Asian & Pacific", color: "#0F766E", menus: ["Atlas Noodle", "Bibimbowl", "Chiang Mai", "House of Teriyaki", "Lemongrass + Lime", "Lotus", "Masaya", "Ohana", "Pho", "Poke Counter", "Sushi", "Wok", "Yakisoba"] },
  { name: "Mediterranean & Middle Eastern", color: "#7C3AED", menus: ["Anisa", "Barbanzo", "Cypress", "Oregano"] },
  { name: "Italian", color: "#B91C1C", menus: ["Paninioteca", "Piccola Italia", "Pizzas & Flatbreads", "Tavola Nova"] },
  { name: "American Grill & Smokehouse", color: "#374151", menus: ["Carvery", "Chickle", "Cutlet", "Fish Market", "Roam BBQ", "Salt & Char", "Smokehouse BBQ"] },
  { name: "South Asian", color: "#C2410C", menus: ["Balti", "Balti Pilot", "Chaatwalla", "Katora", "Saffron", "Street Eats"] },
  { name: "Core Stations Pillar", color: "#1D4ED8", menus: ["Bowl INC", "Fresh Five", "Global Grains", "Q Bowl", "Simmers", "Smoothies", "Breakfast", "Cafe Express", "Harvest Co", "Curated Salads", "Curated Sandwiches", "Deli Core", "Grill Core", "Soup"] },
];


const normalize=value=>String(value||'').replace(/^AMZ(?:\+RA)?:\s*/i,'').trim().toLowerCase();
const aliases=new Map([
 ['harvest co.','harvest co'],['paninoteca','paninioteca'],
 ['cafe express curated salads','curated salads'],
 ['cafe express curated sandwiches','curated sandwiches'],['cafe express soup','soup']
]);
export const canonicalConceptName=value=>aliases.get(normalize(value))||normalize(value);
export const isRetiredConcept=value=>['mto deli','wp salad bar'].includes(canonicalConceptName(value));
export function pillarForConcept(value){
 const key=canonicalConceptName(value);
 return PILLARS.find(p=>p.menus.some(name=>canonicalConceptName(name)===key))||null;
}
export function conceptMenusForPillar(pillar,names){
 return names.filter(name=>!isRetiredConcept(name)&&(pillar==='Needs pillar assignment'?!pillarForConcept(name):pillarForConcept(name)?.name===pillar));
}
