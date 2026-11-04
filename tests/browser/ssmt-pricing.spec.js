import {test,expect} from '@playwright/test';
import XLSX from 'xlsx';
import {readFileSync} from 'node:fs';

async function fixture(page,planned=false){
 const priceBook=[{id:'burger',category:'Burger',selectorLabel:'$12.00 - Burger',areas:{SEA:'$12.00',AUS:'$10.40',BNA:'$11.00'}}];
 const item={id:'linked',label:'Linked Burger',name:'Linked Burger',mrn:'000123',fohColumn:'R | GRILL | BURGER',lockedForCentric:true,priceSelectorId:'burger',seaPrice:'$99.00',areaPrices:{SEA:'$99.00',AUS:'$99.00',BNA:'$99.00'},modifierGroups:['extras']};
 const original={menus:[{id:'complete',name:'Completed Pricing Menu',type:'Core',phase:'IT complete',completedAt:'2026-10-01',fixyDesignation:'GRILL',items:[item]}],priceBook,modifierGroups:[{id:'extras',name:'Extras',modifierType:'Addition',choices:[{id:'cheese',label:'Cheese',mrn:'000124',priceSelectorId:'burger',price:'$99.00',areaPrices:{SEA:'$99.00',AUS:'$99.00',BNA:'$99.00'}}]}],selectedMenuId:'complete',priceBookArchives:[],plannedPriceBook:planned?{effectiveDate:'2026-12-01',priceBook:[{...priceBook[0],areas:{SEA:'$14.00',AUS:'$13.00',BNA:'$13.50'}}]}:null};
 let shared=structuredClone(original);const saves=[];
 await page.addInitScript(()=>{localStorage.clear();sessionStorage.clear();});
 // Intercept every API request, including all writes, on local and production hosts.
 await page.route('**/api/**',async r=>{
  const request=r.request(),url=new URL(request.url());
  if(!url.pathname.endsWith('/ssmt'))return r.fulfill({json:{ok:true,records:[]}});
  const body=request.method()==='POST'?request.postDataJSON():null;
  const action=body?.action||url.searchParams.get('action');
  if(action==='status')return r.fulfill({json:{ok:true,enabled:true}});
  if(action==='session')return r.fulfill({json:{ok:true,member:{id:'isolated-chef',name:'Test Chef',role:'Chef',isAdmin:true}}});
  if(action==='calendar')return r.fulfill({json:{ok:true,menus:[]}});
  if(action==='workspace')return r.fulfill({json:{ok:true,workspace:shared,revision:'fixture-1'}});
  if(action==='save'){saves.push(body.workspace);shared=structuredClone(body.workspace);return r.fulfill({json:{ok:true,revision:`fixture-${saves.length+1}`}});}
  return r.fulfill({status:400,json:{ok:false,message:`Unexpected isolated action ${action}`}});
 });
 await page.goto('/');await page.getByRole('button',{name:/open ssmt/i}).click();
 await expect(page.getByRole('button',{name:'Pricing Structure',exact:true})).toBeVisible();
 return {original,saves};
}
async function openMenu(page){
 await page.getByRole('button',{name:'Menu Selector / New Menu',exact:true}).click();
 await page.locator('[data-menu-name="Completed Pricing Menu"]').click();
}
async function verifyExport(page,aus,bna){
 const download=page.waitForEvent('download');
 await page.getByRole('button',{name:'Export SSMT',exact:true}).click();
 const file=await download,wb=XLSX.read(readFileSync(await file.path()));
 const items=XLSX.utils.sheet_to_json(wb.Sheets.Items),mods=XLSX.utils.sheet_to_json(wb.Sheets.Modifiers);
 expect(items[0]['$$AUS']).toBe(aus);expect(items[0]['$$BNA']).toBe(bna);expect(mods[0]['$$AUS']).toBe(aus);
}
test('current pricing edits update completed menu display and item/modifier exports without rewriting saved menu data',async({page})=>{
 const {original,saves}=await fixture(page);
 await page.getByRole('button',{name:'Pricing Structure',exact:true}).click();
 await page.getByLabel('AUS price for $12.00 - Burger',{exact:true}).fill('$9.99');
 await openMenu(page);
 await expect(page.getByLabel('Copy AUS price for Linked Burger',{exact:true})).toContainText('$9.99');
 await expect(page.getByLabel('Copy BNA price for Linked Burger',{exact:true})).toContainText('$11.00');
 await verifyExport(page,'9.99','11.00');
 await page.getByRole('button',{name:'Save menu',exact:true}).click();
 await expect.poll(()=>saves.length).toBeGreaterThan(0);
 for(const saved of saves){expect(saved.menus).toEqual(original.menus);expect(saved.modifierGroups).toEqual(original.modifierGroups);}
});
test('scheduled activation updates a completed menu while the editor stays open and preserves historical prices',async({page})=>{
 await page.clock.install({time:new Date('2026-11-30T12:00:00')});
 const {original,saves}=await fixture(page,true);
 await openMenu(page);
 await expect(page.getByLabel('Copy AUS price for Linked Burger',{exact:true})).toContainText('$10.40');
 await page.clock.setSystemTime(new Date('2026-12-01T00:01:00'));
 await page.clock.runFor(31_000);
 await expect(page.getByLabel('Copy AUS price for Linked Burger',{exact:true})).toContainText('$13.00');
 await verifyExport(page,'13.00','13.50');
 await page.clock.runFor(5_000);
 await expect.poll(()=>saves.some(s=>s.priceBookArchives.length===1)).toBe(true);
 const activated=saves.find(s=>s.priceBookArchives.length===1);
 expect(activated.priceBookArchives[0].priceBook).toEqual(original.priceBook);
 expect(activated.menus).toEqual(original.menus);expect(activated.modifierGroups).toEqual(original.modifierGroups);
});
