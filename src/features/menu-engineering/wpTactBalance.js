import {tactProfile,TACT_VOCABULARY} from './wpTactProfile.js';
export const TACT_DIMENSIONS=Object.keys(TACT_VOCABULARY);
const ordinal=(n,fallback)=>Number.isFinite(Number(n))&&Number(n)>=1&&Number(n)<=3?Number(n):fallback;
export function weightedTact(food,entry={}) {
 const profile=tactProfile(food),result={};
 for(const dimension of TACT_DIMENSIONS){
  const values=(entry.tactTags?.[dimension]||profile[dimension].values).filter(tag=>TACT_VOCABULARY[dimension].includes(tag)).slice(0,3);
  const tags=values.map((tag,index)=>{
   const saved=profile[dimension].weights?.[tag]||{},scenario=entry.tactWeights?.[dimension]?.[tag]||{};
   const importance=ordinal(scenario.importance??saved.importance,Math.max(1,3-index));
   const intensity=ordinal(scenario.intensity??saved.intensity,tag==='Neutral'||tag==='No aroma'?1:2);
   return {tag,importance,intensity,value:importance*intensity,status:entry.tactTags?.[dimension]||scenario.importance||scenario.intensity?'Proposed':profile[dimension].status,basis:entry.tactTags?.[dimension]||scenario.importance||scenario.intensity?'Chef scenario':saved.importance||saved.intensity?'Stored profile weight':'Proposed planning default'};
  });
  const total=tags.reduce((s,t)=>s+t.value,0);
  result[dimension]=tags.map(t=>({...t,share:total?t.value/total:0}));
 }
 return result;
}
export function buildTactBalance(rows,basis='items') {
 const dimensions=Object.fromEntries(TACT_DIMENSIONS.map(d=>[d,[]]));
 const coverage={selected:rows.length,included:0,missingMass:0,missingProfiles:0,proposed:0};
 for(const row of rows){
  if(!row.food){coverage.missingProfiles++;continue;}
  if(basis==='mass'&&!(Number.isFinite(row.pounds)&&row.pounds>0)){coverage.missingMass++;continue;}
  const weight=basis==='mass'?row.pounds:1,tact=weightedTact(row.food,row);
  if(!TACT_DIMENSIONS.some(d=>tact[d].length)){coverage.missingProfiles++;continue;}
  coverage.included++;
  if(TACT_DIMENSIONS.some(d=>tact[d].some(t=>t.status!=='Reviewed'||t.basis==='Proposed planning default')))coverage.proposed++;
  for(const d of TACT_DIMENSIONS)for(const tag of tact[d]){
   let aggregate=dimensions[d].find(t=>t.tag===tag.tag);
   if(!aggregate){aggregate={tag:tag.tag,value:0,contributors:[]};dimensions[d].push(aggregate);}
   const strength=Math.max(...tact[d].map(t=>t.intensity))/3;
   aggregate.value+=tag.share*weight*strength*(tag.tag==='Neutral'||tag.tag==='No aroma'?.25:1);aggregate.contributors.push(row.key);
  }
 }
 for(const d of TACT_DIMENSIONS)dimensions[d].sort((a,b)=>b.value-a.value||a.tag.localeCompare(b.tag));
 return {basis,dimensions,coverage};
}
export function tactContrast(food,selected) {
 const candidate=weightedTact(food),others=selected.map(f=>weightedTact(f));let score=0;
 for(const d of TACT_DIMENSIONS)for(const t of candidate[d])if(!others.some(p=>p[d].some(x=>x.tag===t.tag)))score+=t.share;
 return score;
}
