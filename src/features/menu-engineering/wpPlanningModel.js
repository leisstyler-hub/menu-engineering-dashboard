export const SELL_METHODS=['Sell by Weight','Scan and Pay'];
export const sellMethod=entry=>SELL_METHODS.includes(entry.sellMethod)?entry.sellMethod:'Sell by Weight';
export function scanPayRevenue(row) {
 const price=Number(row.scanPayPrice),boxes=Number(row.scanPayBoxes),perBox=Number(row.scanPayPortionsPerBox);
 const unresolved=reason=>({sales:null,reason});
 if(!Number.isFinite(price)||price<=0||!Number.isInteger(boxes)||boxes<=0||!Number.isFinite(perBox)||perBox<=0)return unresolved('Enter a positive fixed price, whole box count and source portions per box.');
 if(!row.food?.portion||!Number.isFinite(row.servings)||row.servings<=0||row.estimate?.basis?.startsWith('Planning assumption'))return unresolved('Compatible prepared source portions are required; generic pan serving assumptions cannot price boxes.');
 if(boxes*perBox>row.servings+1e-8)return unresolved('Box forecast exceeds the prepared source portions. Reduce boxes or plan more food.');
 return Number.isFinite(price*boxes)?{sales:price*boxes,reason:''}:unresolved('Box sales exceed the supported range.');
}
export function dietaryTags(food={}) {
 const raw=food.dietTags||food.culinaryProfile?.dietary||[];
 const values=Array.isArray(raw)?raw:String(raw).split(/[;,|]/);
 return [...new Set(values.map(v=>String(v).trim()).filter(v=>['Vegan','Vegetarian'].includes(v)))];
}
export function fitsDiet(food,requirement='All') {
 const tags=dietaryTags(food);
 return requirement==='All'||tags.includes(requirement)||(requirement==='Vegetarian'&&tags.includes('Vegan'));
}
const shapes={full:[2,6],half:[2,3],longhalf:[1,6],bullet:[1,2]};
export function planRevision(entries,station,bays) {
 let hash=2166136261;
 for(const character of JSON.stringify([entries,station,bays]))hash=Math.imul(hash^character.charCodeAt(0),16777619);
 return `plan-${(hash>>>0).toString(16)}`;
}
export function planogramLayout(entries,bays=4) {
 const occupied=new Set();
 return entries.map(entry=>{
  const [width,height]=shapes[entry.panSize]||shapes.half;
  let bay=Number(entry.bay),position=Number(entry.panPosition);
  const cellsAt=(b,p)=>{const x=(p-1)%2,y=Math.floor((p-1)/2);return Array.from({length:height},(_,dy)=>Array.from({length:width},(_,dx)=>({bay:b,x:x+dx,y:y+dy}))).flat();};
  if(!entry.bay&&!entry.panPosition){
   search:for(let b=1;b<=bays;b++)for(let p=1;p<=12;p++){
    const cells=cellsAt(b,p);
    if(cells.every(c=>c.x<2&&c.y<6&&!occupied.has(`${b}:${c.x}:${c.y}`))){bay=b;position=p;break search;}
   }
  }
  const valid=Number.isInteger(bay)&&bay>=1&&bay<=bays&&Number.isInteger(position)&&position>=1&&position<=12;
  const cells=valid?cellsAt(bay,position):[];
  cells.forEach(c=>occupied.add(`${c.bay}:${c.x}:${c.y}`));
  return {...entry,mrn:String(entry.mrn??''),bay:valid?bay:null,panPosition:valid?position:null,width,height,cells};
 });
}
export function planogramWarnings(layout) {
 const warnings=[],seen=new Map();
 for(const row of layout){
  if(!row.cells.length)warnings.push(`${row.name}: no fitting bay location.`);
  if(row.cells.some(c=>c.x>=2||c.y>=6))warnings.push(`${row.name}: pan extends beyond its bay.`);
  for(const c of row.cells){const key=`${c.bay}:${c.x}:${c.y}`;if(seen.has(key))warnings.push(`${row.name} and ${seen.get(key)} overlap.`);else seen.set(key,row.name);}
 }
 return [...new Set(warnings)];
}
export function lightningIssues(entry) {
 if(!entry.lightning)return [];
 const issues=[];
 if(!entry.launchAt||!entry.timezone)issues.push('Set the Lightning LTO date/time and timezone.');
 if(!Number.isInteger(Number(entry.ltoPanLimit))||Number(entry.ltoPanLimit)<1)issues.push('Set a positive whole Lightning LTO pan limit.');
 if(Number(entry.totalPans)>Number(entry.ltoPanLimit))issues.push('Prepared pans exceed the Lightning LTO limit.');
 return issues;
}
export function exclusionHelp(reason='') {
 if(/Handheld/i.test(reason))return 'Built to sell as an individual item. Plan a Scan and Pay offer; it is not part of weight-price qualification.';
 if(/Plain single/i.test(reason))return 'A plain ingredient is not a finished menu component. Choose its prepared recipe instead.';
 if(/dessert|beverage|Non-core/i.test(reason))return 'Outside the core weight-bar assortment. Plan a separate daily offer with its own price.';
 return 'Review the linked recipe and serving format before adding this food to the bar.';
}
