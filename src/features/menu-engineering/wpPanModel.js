export const PAN_SIZES = ['bullet','half','full'];
export const whole = value => String(value??'').trim()!=='' && Number.isInteger(Number(value)) && Number(value)>=0;
export function entryPounds(entry) {
  if(entry.quantityMode!=='pan')return String(entry.pounds??'').trim()!==''&&Number.isFinite(Number(entry.pounds))&&Number(entry.pounds)>0?Number(entry.pounds):null;
  if(!PAN_SIZES.includes(entry.panSize)||!whole(entry.openingPans)||!whole(entry.reservePans))return null;
  const count=Number(entry.openingPans)+Number(entry.reservePans),fill=Number(entry.fillLb);
  const value=count*fill;
  return count>0&&Number.isFinite(fill)&&fill>0&&Number.isFinite(value)?value:null;
}
