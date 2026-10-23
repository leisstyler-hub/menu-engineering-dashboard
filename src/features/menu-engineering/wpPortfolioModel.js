import {tierFor} from './panReadyModel.js';
export const includeWpMenu = menu => !/^(?:AMZ:\s*)?(?:Deli Core|Grill Core|Salt\s*&\s*Char)$/i.test(String(menu).trim()) && !/\b(?:sandwich(?:es)?|pizzas?|flatbreads?)\b/i.test(String(menu));

// Source identifiers establish identity. Names alone never merge unrelated foods.
export function buildPortfolio(projections) {
  const groups=new Map();
  for(const p of projections.filter(p=>includeWpMenu(p.menu))) for(const r of p.items) {
    const key=r.mrn?`mrn:${r.mrn}`:JSON.stringify([p.menu,r.key||r.id||r.name]);
    if(!groups.has(key))groups.set(key,[]);
    groups.get(key).push({...r,menu:p.menu});
  }
  return [...groups].map(([key,variants])=>{
    const first=variants[0],menus=[...new Set(variants.map(r=>r.menu))].sort();
    const perLb=r=>r.massOz>0&&Number.isFinite(r.cost)?r.cost/r.massOz*16:null;
    const different=(a,b)=>a==null||b==null?a!==b:Math.abs(a-b)>1e-8;
    const conflict=variants.some(r=>different(perLb(r),perLb(first))||different(r.foodCost,first.foodCost)||r.category!==first.category||r.economics==='Needs review');
    const serviceReasons=[...new Set(variants.flatMap(r=>r.serviceReasons||[]))];
    const foodCost=conflict?null:first.foodCost;
    const valid=Number.isFinite(foodCost)&&foodCost>=0&&perLb(first)!=null;
    const portfolioStatus=!valid?'Needs information':serviceReasons.length?'Service review':foodCost<=.4+1e-12?'Within 40%':'Above 40%';
    return {...first,...(conflict?{cost:null,massOz:null}:{}),key,menus,variants,serviceReasons:conflict?[...serviceReasons,'Conflicting source variants require review']:serviceReasons,foodCost,tier:tierFor(foodCost),costPerLb:conflict?null:perLb(first),portfolioStatus,conflict};
  }).sort((a,b)=>a.category.localeCompare(b.category)||a.name.localeCompare(b.name));
}
