// Sensory proposals only. These rules never establish dietary or holding safety.
export const TACT_VERSION=1;
export const TACT_VOCABULARY=Object.freeze({
 taste:Object.freeze(['Sweet','Sour/Acidic','Salty','Bitter','Umami']),
 aroma:Object.freeze(['Herbal','Citrus','Floral','Toasted','Roasted','Smoky','Warm Spice']),
 color:Object.freeze(['Green','Red','Orange','Yellow','Purple','Brown','White/Cream']),
 texture:Object.freeze(['Crisp/Crunchy','Creamy','Tender','Chewy','Firm','Soft','Juicy'])
});
const rules={
 taste:[['Sweet',/\b(sweet|honey|maple|sugar|caramel)\b/i],['Sour/Acidic',/\b(lemon|lime|vinegar|pickled|acidic|sour)\b/i],['Salty',/\b(salty|salted|brined)\b/i],['Bitter',/\b(bitter|radicchio|endive)\b/i],['Umami',/\b(umami|miso|mushrooms?|beef|chicken|soy sauce|parmesan)\b/i]],
 aroma:[['Herbal',/\b(herbs?|herbal|parsley|cilantro|basil|rosemary|thyme|mint)\b/i],['Citrus',/\b(citrus|lemon|lime|orange zest)\b/i],['Floral',/\b(floral|rose water|rosewater|lavender|orange blossom)\b/i],['Toasted',/\b(toasted|toasty)\b/i],['Roasted',/\b(roasted|roast)\b/i],['Smoky',/\b(smoky|smoked|smoke)\b/i],['Warm Spice',/\b(cinnamon|cloves?|cardamom|allspice|nutmeg)\b/i]],
 // Explicit color language only: ingredient presence does not prove finished color.
 color:[['Green',/\bgreen\b/i],['Red',/\bred\b/i],['Orange',/\borange[ -]colo(?:u)?red\b/i],['Yellow',/\byellow\b/i],['Purple',/\bpurple\b/i],['Brown',/\bbrown\b/i],['White/Cream',/\b(white|cream[ -]colo(?:u)?red)\b/i]],
 texture:[['Crisp/Crunchy',/\b(crisp|crispy|crunchy|crunch|croutons?)\b/i],['Creamy',/\b(creamy|puree|pureed|mashed|hummus)\b/i],['Tender',/\btender\b/i],['Chewy',/\bchewy\b/i],['Firm',/\bfirm\b/i],['Soft',/\bsoft\b/i],['Juicy',/\bjuicy\b/i]]
};
export function tactProfile(food={}) {
 const sources=[['Name',food.name??food.item],['Description',food.description]]
  .filter(([,value])=>typeof value==='string'&&value.trim());
 if(Array.isArray(food.ingredients))for(const ingredient of food.ingredients){
  const value=typeof ingredient==='string'?ingredient:ingredient?.name;
  if(typeof value==='string'&&value.trim())sources.push(['Ingredient',value]);
 }
 const stored=food.culinaryProfile?.tact;
 const result={version:TACT_VERSION};
 for(const dimension of Object.keys(TACT_VOCABULARY)){
  const saved=stored?.[dimension];
  if(saved?.status==='Reviewed'&&Array.isArray(saved.values)){
   const issues=[];
   if(stored.version!==TACT_VERSION)issues.push('Sensory vocabulary version needs review.');
   if(saved.values.some(value=>!TACT_VOCABULARY[dimension].includes(value)))issues.push('Saved sensory value is outside the current vocabulary; preserved for review.');
   if(!saved.reviewer||!saved.reviewedAt)issues.push('Reviewer and review date are required.');
   result[dimension]={...saved,values:[...saved.values],evidence:[...(saved.evidence||[])],status:issues.length?'Needs review':'Reviewed',issues};
   continue;
  }
  const values=[],evidence=[];
  for(const [label,re] of rules[dimension])for(const [source,value] of sources){
   const match=value.match(re);if(!match)continue;
   if(!values.includes(label))values.push(label);
   evidence.push({tag:label,source,phrase:match[0]});break;
  }
  result[dimension]={values,status:values.length?'Proposed':'Needs review',evidence,
   basis:'Text-derived proposal; verify the finished food.',issues:[]};
 }
 return result;
}
export function tactColumns(tact) {
 return Object.fromEntries(Object.keys(TACT_VOCABULARY).flatMap(d=>{
  const label=d[0].toUpperCase()+d.slice(1),field=tact[d];
  return [[`TACT ${label}`,field.values.join('; ')||(field.status==='Reviewed'?'None recorded':'Needs review')],
   [`TACT ${label} status`,field.status]];
 }));
}
