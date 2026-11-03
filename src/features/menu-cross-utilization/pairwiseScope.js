import {isRaConcept} from '../../shared/raConcepts.js';
import {portfolioCrossUseStats} from './menuCrossUtilizationModel.js';
export function scopePairwise(data,includeRa=false){
 const menus=data.menus.filter(m=>includeRa||!isRaConcept(m.name)).map(m=>({...m}));
 const names=new Set(menus.map(m=>m.name));
 const pairs=data.pairs.filter(p=>names.has(p.a)&&names.has(p.b));
 for(const menu of menus)menu.portfolio=portfolioCrossUseStats(menu,menus);
 return {...data,menus,pairs,pillars:(data.pillars||[]).map(p=>({...p,menus:p.menus.filter(n=>includeRa||!isRaConcept(n))}))};
}
