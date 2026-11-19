import {canonicalConceptName,isRetiredConcept} from './conceptPillars.js';

// A planning lens over one explicitly selected cohort. Cuisine memberships never change.
const eligible = data => (data?.menus || []).filter(m=>m.hasIngredientData && Array.isArray(m.matchKeys) && m.matchKeys.length && !isRetiredConcept(m.name));
export function affinityPair(a,b) {
 const left=new Set(a.matchKeys),right=new Set(b.matchKeys);
 const shared=[...left].filter(k=>right.has(k)).length,union=new Set([...left,...right]).size;
 return {shared,union,score:union?shared/union:null};
}
export function affinityPartners(data,anchorName,availableNames=null) {
 const menus=eligible(data),key=canonicalConceptName(anchorName),anchors=menus.filter(m=>canonicalConceptName(m.name)===key);
 if(anchors.length!==1)return [];
 const allowed=availableNames&&new Set(availableNames.map(canonicalConceptName));
 return menus.filter(m=>canonicalConceptName(m.name)!==key&&(!allowed||allowed.has(canonicalConceptName(m.name))))
  .map(m=>({name:m.name,pillar:m.pillar||'Unassigned',...affinityPair(anchors[0],m)}))
  .sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name));
}
export function affinitySummary(data,names) {
 const requested=new Set(names.map(canonicalConceptName)),menus=eligible(data).filter(m=>requested.has(canonicalConceptName(m.name))),scores=[];
 for(let i=0;i<menus.length;i++)for(let j=i+1;j<menus.length;j++)scores.push(affinityPair(menus[i],menus[j]).score);
 return {covered:menus.length,requested:requested.size,pairs:scores.length,mean:scores.length?scores.reduce((s,x)=>s+x,0)/scores.length:null,minimum:scores.length?Math.min(...scores):null,maximum:scores.length?Math.max(...scores):null,source:data?.source||'Unavailable',version:data?.releaseVersion||data?.schemaVersion||'Unversioned'};
}
