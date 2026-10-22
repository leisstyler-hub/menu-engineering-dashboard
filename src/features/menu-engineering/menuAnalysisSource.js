import {measure} from './andesAnalysisModel.js';
import {portionWeightOz} from './weighPayModel.js';

const text = value => String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
function samePortion(a,b) {
  const x=measure(a),y=measure(b);
  return text(a)===text(b)||Boolean(x&&y&&x.dimension===y.dimension&&Math.abs(x.amount-y.amount)<1e-9);
}
// Membership always comes from current shared rows. Books only supply analysis.
export function buildMenuAnalysisSource(menu,rows,library,trusted=false) {
  const recipes=library?.recipes||[],byId=new Map(recipes.map(r=>[r.id,r]));
  const selected=new Map(),dishes=[];
  function signature(r,seen=[]) {
    if(!r||seen.includes(r.id)||seen.length>=8)return 'unresolved';
    return JSON.stringify([r.mrn,r.portion,r.cost,r.massOz,r.batchServings,(r.components||[]).map(e=>[e.mrn,e.quantity,signature(byId.get(e.childId),[...seen,r.id])])]);
  }
  function include(id,seen=[]) {
    if(!id||selected.has(id)||seen.includes(id))return;
    const recipe=byId.get(id);if(!recipe)return;
    selected.set(id,{...recipe,topLevel:false});
    for(const edge of recipe.components||[])include(edge.childId,[...seen,id]);
  }
  rows.filter(row=>row.menu===menu).forEach((row,index)=>{
    const candidates=recipes.filter(r=>r.mrn===String(row.mrn??'')&&samePortion(r.portion,row.portion));
    const signatures=new Set(candidates.map(r=>signature(r)));
    const match=signatures.size===1?candidates[0]:null;
    const rawCost=row.trueCost??row.true_cost;
    const sharedCost=rawCost!==null&&rawCost!==undefined&&rawCost!==''&&Number.isFinite(Number(rawCost))&&Number(rawCost)>=0?Number(rawCost):null;
    const sharedMass=trusted?portionWeightOz(row):null;
    const id=`menu-item-${index}`;
    if(match)for(const edge of match.components||[])include(edge.childId);
    dishes.push({...match,id,mrn:String(row.mrn??''),name:String(row.item||row.displayName||'Unnamed item'),portion:String(row.portion||''),
      cost:match?.cost??(trusted?sharedCost:null),costBasis:match?.cost!=null?'Recipe snapshot':'Shared item data',
      massOz:sharedMass??match?.massOz??null,massBasis:sharedMass?'Shared item data':'Recipe snapshot',
      batchServings:match?.batchServings??null,components:match?.components||[],topLevel:true,
      linkStatus:match?'Recipe linked':candidates.length?'Ambiguous recipe variants; shared item economics only':'Recipe not linked; shared item economics only'});
  });
  return {concept:menu,basis:library?.basis,recipes:[...dishes,...selected.values()]};
}
