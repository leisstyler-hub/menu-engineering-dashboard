// Bounded extraction corrections only: no raw recipes or operational writes.
export function reconcileRecipeEvidence(recipe, evidence, parseMeasure, sourceHashes=[]) {
  const result={...recipe};
  if(Number.isFinite(recipe.massOz)&&recipe.massOz>0)return result;
  const matches=evidence.filter(e=>e.id===recipe.id&&e.mrn===recipe.mrn&&e.portion===recipe.portion&&(!e.sourceSha256||sourceHashes.includes(e.sourceSha256)));
  if(matches.length){
    const signatures=new Set(matches.map(e=>JSON.stringify([e.massOz??null,e.approximate??false,e.reason??''])));
    if(signatures.size!==1)return {...result,informationReasons:['Conflicting reviewed serving evidence; weight unresolved']};
    const entry=matches[0];
    if(entry.reason)result.informationReasons=[entry.reason];
    if(Number.isFinite(entry.massOz)&&entry.massOz>0){
      result.massOz=entry.massOz;
      result.massBasis=entry.basis;
      result.weightApproximate=Boolean(entry.approximate);
    }
    return result;
  }
  const mass=parseMeasure(String(recipe.portion||'').replace(/\s+portion$/i,''));
  if(mass?.dimension==='mass'){
    result.massOz=mass.amount;
    result.massBasis=`Recipe mass portion header (${recipe.id})`;
  }
  return result;
}

export function informationReasonsFor(recipe,cost,mass,parseMeasure) {
  const reasons=[];
  if(cost===null)reasons.push('Source cost unavailable for this serving variant');
  if(!mass){
    if(recipe.informationReasons?.length)reasons.push(...recipe.informationReasons);
    else {
      const portion=parseMeasure(recipe.portion);
      reasons.push(portion?.dimension==='volume'?'Volume portion supplied; no validated matching serving weight':portion?.dimension==='count'?'Count portion supplied; no validated finished serving weight':'No validated finished serving weight for this variant');
    }
  }
  return [...new Set(reasons)];
}
