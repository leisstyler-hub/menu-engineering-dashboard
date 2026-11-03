import snapshot from '../../data/menuCrossUtilization.json' with {type:'json'};

// W&P selector overlay only. Pairwise and proposed culinary profiles retain their source definitions.
const normalize=value=>String(value||'').replace(/^AMZ(?:\+RA)?:\s*/i,'').trim().toLowerCase();
const aliases=new Map([
 ['harvest co.','harvest co'],['paninoteca','paninioteca'],
 ['cafe express curated salads','curated salads'],
 ['cafe express curated sandwiches','curated sandwiches'],['cafe express soup','soup']
]);
const canonical=value=>aliases.get(normalize(value))||normalize(value);
const pillars=snapshot.pillars.map(p=>({name:p.name==='Base Station Infrastructure'?'Core Stations Pillar':p.name,
 menus:p.name==='Base Station Infrastructure'?[...p.menus,'Cafe Express','Harvest Co']:p.menus.filter(m=>m!=='Harvest Co')}));
export const SELECTOR_PILLARS=[...pillars.map(p=>p.name),'Needs pillar assignment'];
export function selectorPillarMenus(pillar,names) {
 const allowed=new Set((pillars.find(p=>p.name===pillar)?.menus||[]).map(canonical));
 const mapped=new Set(pillars.flatMap(p=>p.menus.map(canonical)));
 return names.filter(name=>pillar==='Needs pillar assignment'?!mapped.has(canonical(name)):allowed.has(canonical(name)));
}
