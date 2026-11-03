import {serviceProfile} from './wpServiceProfile.js';
import {estimatePans,portionCups} from './wpPanEstimate.js';
import {entryPounds} from './wpPanModel.js';
const positive = value => String(value).trim() !== '' && Number.isFinite(Number(value)) && Number(value) > 0;
const finite = value => Number.isFinite(value) ? value : null;

// Source portion estimates drive pan plans; legacy session quantities remain read-compatible.
export function projectStation(entries, catalog, rate, sellThrough, trusted) {
  const rows = entries.map(entry => {
    const food = catalog.find(row => row.key === entry.key);
    const countMode=['portions','cups'].includes(entry.quantityMode);
    const quantity=Number(entry.quantityMode==='cups'?entry.expectedCups:entry.expectedPortions);
    const count=countMode&&positive(quantity)&&(entry.quantityMode==='cups'||Number.isInteger(quantity))?entry.quantityMode==='cups'?(portionCups(food?.portion)?quantity/portionCups(food.portion):null):quantity:null;
    let estimate=countMode?{servings:count,pounds:count!=null&&food?.massOz>0?count*food.massOz/16:null,cost:count!=null&&Number.isFinite(food?.cost)&&food.cost>=0?count*food.cost:null,approximate:true,basis:'Chef quantity forecast times compatible source serving evidence.',reason:count==null?'Enter positive portions, or cups with a source volume portion.':!(food?.massOz>0)?'Source serving weight is missing; weight-based sales remain incomplete.':''}:entry.totalPans!==undefined?estimatePans(entry,food):null;
    const validReference=entry.useReference&&entry.quantityMode==='pan'&&entry.panSize==='full'&&serviceProfile(food||{}).comparableSaucedDish&&positive(entry.totalPans)&&Number.isInteger(Number(entry.totalPans))&&positive(entry.referenceLow)&&positive(entry.referenceHigh)&&Number(entry.referenceLow)<=Number(entry.referenceHigh)&&Number.isFinite(Number(entry.referenceHigh)*Number(entry.totalPans));
    const referenceRange=validReference?{low:Number(entry.referenceLow)*Number(entry.totalPans),high:Number(entry.referenceHigh)*Number(entry.totalPans),basis:'Estimated using Butter Chicken reference'}:null;
    if(referenceRange&&estimate){estimate.pounds=null;estimate.servings=null;estimate.cost=null;estimate.reason='Reference scenario only; exact item yield is not measured.';estimate.basis=referenceRange.basis;}
    if(entry.useReference&&!validReference)estimate={pounds:null,servings:null,cost:null,approximate:true,reason:'Enter a valid positive reference range with low no greater than high for a comparable full-pan dish.',basis:'Invalid Butter Chicken reference range'};
    const pounds = estimate?estimate.pounds:entryPounds(entry);
    const validCost = trusted && food && !food.conflict && Number.isFinite(food.costPerLb) && food.costPerLb >= 0;
    return {...entry, food, pounds, estimate, referenceRange, servings:estimate?.servings??null, cost:estimate?(trusted&&!food?.conflict?estimate.cost:null):validCost && pounds != null ? finite(food.costPerLb * pounds) : null};
  });
  const quantitiesValid = rows.length > 0 && rows.every(row => row.pounds != null);
  const pounds = quantitiesValid ? finite(rows.reduce((sum, row) => sum + row.pounds, 0)) : null;
  const cost = rows.length && rows.every(row => row.cost != null) ? finite(rows.reduce((sum, row) => sum + row.cost, 0)) : null;
  const sellValid = String(sellThrough).trim() !== '' && Number.isFinite(Number(sellThrough)) && Number(sellThrough) >= 0 && Number(sellThrough) <= 100;
  const soldPounds = pounds != null && sellValid ? finite(pounds * (Number(sellThrough) / 100)) : null;
  const sales = !rows.some(row=>row.food?.planningOnly) && soldPounds != null && positive(rate) ? finite(soldPounds * Number(rate)) : null;
  return {rows, pounds, cost, soldPounds, sales, foodCost: cost != null && sales > 0 ? cost / sales : null,
    contribution: cost != null && sales != null ? sales - cost : null,
    reviewCount: rows.filter(row => row.food?.serviceReasons?.length).length,
    approximate: rows.some(row => row.estimate || row.food?.weightApproximate)};
}
