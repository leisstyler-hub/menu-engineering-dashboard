import { itemRestrictions, pricePerLb, portionWeightOz } from './weighPayModel.js';

// Quantities compare only within one dimension. Volume is never treated as mass.
export function measure(text) {
  const units={tsp:['volume',1],tbsp:['volume',3],cup:['volume',48],qt:['volume',192],gal:['volume',768],floz:['volume',6],oz:['mass',1],ounce:['mass',1],lb:['mass',16],g:['mass',1/28.349523125],kg:['mass',1000/28.349523125],ea:['count',1],each:['count',1],piece:['count',1]};
  let dimension=null,amount=0;
  for(const part of String(text||'').toLowerCase().split(',')) {
    const match=part.trim().match(/^(\d+(?:\.\d+)?(?:[- ]\d+\/\d+)?|\d+\/\d+)\s*(tsp|tbsp|cups?|qt|gal|fl\s*oz|ounces?|oz|lbs?|kg|g|ea|each|pieces?)$/);
    if(!match)return null;
    const n=match[1];let value;
    if(/^\d+[- ]\d+\//.test(n)){const [whole,num,den]=n.split(/[- /]/).map(Number);value=whole+num/den;}
    else if(n.includes('/')){const [num,den]=n.split('/').map(Number);value=num/den;}else value=Number(n);
    const unit=units[match[2].replace(/\s/g,'').replace(/s$/,'')];
    if(!unit||!Number.isFinite(value)||value<=0||dimension&&dimension!==unit[0])return null;
    dimension=unit[0];amount+=value*unit[1];
  }
  return dimension?{dimension,amount}:null;
}
export function componentContribution(parent,edge,child) {
  const used=measure(edge.quantity),serving=measure(child?.portion);
  if(!used||!serving||used.dimension!==serving.dimension||!(parent.batchServings>0)||!Number.isFinite(child?.cost)||child.cost<0)return null;
  const result=used.amount/serving.amount*child.cost/parent.batchServings;
  return Number.isFinite(result)?result:null;
}
// Never match by name or MRN alone: a recipe may have several serving variants.
function sharedMass(recipe,rows,concept) {
  const portion=measure(recipe.portion);
  if(!portion)return null;
  const matches=rows.filter(row=>String(row.menu||'')===concept&&String(row.mrn??'')===recipe.mrn).filter(row=>{
    const candidate=measure(row.portion);
    return candidate&&candidate.dimension===portion.dimension&&Math.abs(candidate.amount-portion.amount)<1e-9;
  });
  const weights=matches.map(portionWeightOz);
  if(!weights.length||weights.some(w=>w==null)||weights.some(w=>Math.abs(w-weights[0])>1e-9))return null;
  return weights[0];
}
export function analyzeAndes(data,rate,sharedRows=[]) {
  const recipes=data?.recipes||[],byId=new Map(recipes.map(r=>[r.id,r])),price=pricePerLb(rate);
  function visit(recipe,seen=[]) {
    if(!recipe)return {issue:'Component link needs review'};
    if(seen.includes(recipe.id)||seen.length>=8)return {issue:'Component cycle or depth needs review'};
    const cost=Number.isFinite(recipe.cost)&&recipe.cost>=0?recipe.cost:null;
    const snapshotMass=Number.isFinite(recipe.massOz)&&recipe.massOz>0?recipe.massOz:null;
    const mass=snapshotMass??sharedMass(recipe,sharedRows,data.concept||'AMZ: Andes');
    const weightSource=snapshotMass?'Recipe snapshot':mass?'Shared item data':'Not documented';
    const fc=price&&cost!==null&&mass?cost/(mass/16*price):null;
    const economics=!price?'Needs price':cost===null?'Needs cost':!mass?'Needs weight':fc<=.4+1e-12?'Within 40%':'Above 40%';
    const restriction=itemRestrictions({item:recipe.name,portion:recipe.portion});
    const components=(recipe.components||[]).map(edge=>{const child=byId.get(edge.childId);return {...edge,contribution:componentContribution(recipe,edge,child),analysis:visit(child,[...seen,recipe.id])};});
    const known=components.reduce((sum,c)=>sum+(c.contribution??0),0);
    const remainder=cost!==null&&components.every(c=>c.contribution!==null)&&known<=cost+1e-9?Math.max(0,cost-known):null;
    return {...recipe,cost,massOz:mass,weightSource,foodCost:fc,economics,minimumOz:price&&cost!==null?cost/(price*.4)*16:null,serviceReasons:[...restriction.reasons,...restriction.reviews],components,remainder};
  }
  return recipes.map(recipe=>visit(recipe));
}
