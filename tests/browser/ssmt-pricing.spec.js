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
 await page.getByRole('button',{name:'Save SSMT workspace',exact:true}).click();
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


test('one workspace save stays above navigation on selector, builder and price increase screens', async ({page}) => {
 const {saves}=await fixture(page);
 const checkSave=async()=>{
  const save=page.getByRole('button',{name:'Save SSMT workspace',exact:true});
  await expect(save).toHaveCount(1);
  const saveBox=await save.boundingBox(),navBox=await page.getByRole('navigation',{name:'SSMT sections',exact:true}).boundingBox();
  expect(saveBox.y+saveBox.height).toBeLessThanOrEqual(navBox.y);
  expect(saveBox.x+saveBox.width).toBeGreaterThan(navBox.x+navBox.width-25);
  await expect(page.getByRole('button',{name:'Save menu',exact:true})).toHaveCount(0);
 };
 await page.getByRole('button',{name:'Menu Selector / New Menu',exact:true}).click();
 await checkSave();
 await page.locator('[data-menu-name="Completed Pricing Menu"]').click();
 await checkSave();
 await page.getByRole('button',{name:'Save SSMT workspace',exact:true}).click();
 await expect.poll(()=>saves.length).toBeGreaterThan(0);
 await page.getByRole('button',{name:'Pricing Structure',exact:true}).click();
 await checkSave();
 await page.getByRole('button',{name:/Planning New Price Increase/}).click();
 await checkSave();
 const environment=process.env.PLAYWRIGHT_BASE_URL?.includes('vercel.app')?'PRODUCTION':'LOCAL';
 await page.screenshot({path:`../../WORK_LOGS/SSMT_SAVE_${environment}_DESKTOP.png`});
 await page.setViewportSize({width:390,height:844});
 await checkSave();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:`../../WORK_LOGS/SSMT_SAVE_${environment}_PHONE.png`});
});

test('current price deletion warns with linked counts, blocks used rows and preserves saved data when deleting an unused row',async({page})=>{
 const {original,saves}=await fixture(page);
 await page.getByRole('button',{name:'Pricing Structure',exact:true}).click();
 await page.getByRole('button',{name:'Delete price row $12.00 - Burger',exact:true}).click();
 let dialog=page.getByRole('dialog',{name:'Delete current pricing row',exact:true});
 await expect(dialog).toContainText('Menu items using this row: 1');
 await expect(dialog).toContainText('Modifier choices using this row: 1');
 await expect(dialog.getByRole('button',{name:'Delete pricing row',exact:true})).toBeDisabled();
 await expect(dialog).toContainText('Reassign these links before deleting');
 const environment=process.env.PLAYWRIGHT_BASE_URL?.includes('vercel.app')?'PRODUCTION':'LOCAL';
 await page.screenshot({path:`../../WORK_LOGS/SSMT_PRICE_DELETE_${environment}_DESKTOP.png`});
 await page.setViewportSize({width:390,height:844});
 await expect(dialog.getByRole('button',{name:'Cancel',exact:true})).toBeInViewport();
 await page.screenshot({path:`../../WORK_LOGS/SSMT_PRICE_DELETE_${environment}_PHONE.png`});
 await page.setViewportSize({width:1280,height:720});
 await dialog.getByRole('button',{name:'Cancel',exact:true}).click();
 await page.getByLabel('New pricing category',{exact:true}).fill('Test Row');
 await page.getByLabel('New SEA price',{exact:true}).fill('1.25');
 await page.getByRole('button',{name:'Add pricing row',exact:true}).click();
 const remove=page.getByRole('button',{name:/Delete price row.*Test Row/});
 await remove.click();
 dialog=page.getByRole('dialog',{name:'Delete current pricing row',exact:true});
 await expect(dialog).toContainText('Menu items using this row: 0');
 await expect(dialog).toContainText('Modifier choices using this row: 0');
 await dialog.getByRole('button',{name:'Cancel',exact:true}).click();
 await expect(remove).toBeVisible();
 await remove.click();
 await dialog.getByRole('button',{name:'Delete pricing row',exact:true}).click();
 await expect(remove).toHaveCount(0);
 await page.getByRole('button',{name:'Save SSMT workspace',exact:true}).click();
 await expect.poll(()=>saves.length).toBeGreaterThan(0);
 expect(saves.at(-1).priceBook).toEqual(original.priceBook);
 expect(saves.at(-1).menus).toEqual(original.menus);
 expect(saves.at(-1).modifierGroups).toEqual(original.modifierGroups);
 expect(saves.at(-1).priceBookArchives).toEqual(original.priceBookArchives);
 await page.reload();await page.getByRole('button',{name:/open ssmt/i}).click();
 await page.getByRole('button',{name:'Pricing Structure',exact:true}).click();
 await expect(remove).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Delete price row $12.00 - Burger',exact:true})).toBeVisible();
});

test('legacy deletion of the final unused price row stays empty after save and reload',async({page})=>{
 let shared={'Record ID':'ssmt|workspace|current','Record Type':'SSMT Workspace',menus:[],modifierGroups:[],seedMenuTypeCorrectionsApplied:true,priceBook:[{id:'last-test-row',category:'Last Test',selectorLabel:'$1.00 - Last Test',areas:{SEA:'1.00'}}]};
 await page.addInitScript(()=>{localStorage.clear();sessionStorage.clear();});
 await page.route('**/api/**',async r=>{
  const req=r.request(),url=new URL(req.url());
  if(url.pathname.endsWith('/ssmt'))return r.fulfill({json:{ok:true,enabled:false,menus:[]}});
  if(url.pathname.endsWith('/storage/records')){
   if(req.method()==='POST')shared=structuredClone(req.postDataJSON().records[0]);
   return r.fulfill({json:{ok:true,source:'supabase',records:[shared],synced:1}});
  }
  return r.fulfill({json:{ok:true,records:[]}});
 });
 const open=async()=>{
  await page.goto('/');await page.getByRole('button',{name:/open ssmt/i}).click();
  await page.getByLabel('SSMT passcode',{exact:true}).fill('0411');
  await page.getByRole('button',{name:'Unlock SSMT',exact:true}).click();
  await page.getByRole('button',{name:'Pricing Structure',exact:true}).click();
  await expect(page.getByRole('button',{name:'Save SSMT workspace',exact:true})).toBeVisible();
 };
 await open();
 await page.getByRole('button',{name:'Delete price row $1.00 - Last Test',exact:true}).click();
 await page.getByRole('dialog',{name:'Delete current pricing row',exact:true}).getByRole('button',{name:'Delete pricing row',exact:true}).click();
 await page.getByRole('button',{name:'Save SSMT workspace',exact:true}).click();
 await expect.poll(()=>shared.priceBook).toEqual([]);
 await open();
 await expect(page.getByRole('button',{name:/Delete price row/})).toHaveCount(0);
});
