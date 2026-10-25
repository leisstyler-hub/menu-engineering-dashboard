// Public calendar display projection. Never return workspace objects or spread
// menu/item values here: this endpoint intentionally precedes SSMT sign-in.
const text = value => typeof value === 'string' ? value : '';
const date = value => /^\d{4}-\d{2}-\d{2}$/.test(text(value)) ? value : '';
const visible = value => value && typeof value === 'object' && !value.hidden && !value.hiddenFromDownstream;

function schedule(value) {
  if (!value || typeof value !== 'object') return undefined;
  return {
    mode: text(value.mode),
    weekdays: Array.isArray(value.weekdays) ? value.weekdays.filter(day=>Number.isInteger(day)&&day>=1&&day<=5) : [],
    skippedDates: Array.isArray(value.skippedDates) ? value.skippedDates.map(date).filter(Boolean) : [],
  };
}

export function publicCalendarMenus(menus) {
  return (Array.isArray(menus)?menus:[]).filter(visible).map(menu=>{
    const result={id:text(menu.id),name:text(menu.name),type:text(menu.type),phase:text(menu.phase),activeStart:date(menu.activeStart),activeEnd:date(menu.activeEnd),promotionSchedule:schedule(menu.promotionSchedule)};
    if(menu.type!=='Promotion')return result;
    result.fixyDesignation=text(menu.fixyDesignation);
    result.previewSource='Current SSMT calendar details';
    result.items=(Array.isArray(menu.items)?menu.items:[])
      .filter(item=>visible(item)&&item.recordType!=='divider'&&item.rowType!=='divider')
      .map(item=>{
        const row={label:text(item.label)||text(item.name),description:text(item.description),category:text(item.category)};
        if((typeof item.calories==='number'||typeof item.calories==='string')&&String(item.calories).trim()!==''&&Number.isFinite(Number(item.calories))&&Number(item.calories)>=0)row.calories=item.calories;
        return row;
      }).filter(item=>item.label.trim());
    return result;
  });
}
