import {test,expect} from '@playwright/test';
import {openTool,collectUnexpectedPageErrors} from './smoke-helpers.js';
import * as XLSX from 'xlsx';
import {readFile} from 'node:fs/promises';
const rows=[
 ['AMZ: Andes','Roasted carrots','0001',1.8],['AMZ: Andes','Roasted squash','0002',.3],
 ['AMZ: Andes','Grilled chicken','0003',.7],['AMZ: Andes','Steamed rice','0004',.2],
 ['AMZ: Andes','Cucumber salad','0005',.4],['AMZ: Andes','Chili Herb Crunch','0006',.2],
 ['AMZ: Balti','Roasted Salmon','0007',1.2]
].map(([menu,item,mrn,trueCost])=>({menu,item,mrn,trueCost,portion:'4 oz',portionOz:4}));
for(const width of [390,1440])test(`Smart pillars, safe preview, pan plan and swaps at ${width}px`,async({page})=>{
 const errors=collectUnexpectedPageErrors(page),writes=[];
 await page.route('**/api/**',r=>{if(r.request().method()!=='GET'&&!r.request().url().includes('/traffic/'))writes.push(r.request().url());return r.fulfill({json:r.request().url().includes('recipe-library')?{ok:true,source:'supabase-recipe-items',rows}:{ok:true,rows:[],records:[]}});});
 await page.setViewportSize({width,height:950});await openTool(page,/open menu analysis/i,/Menu Engineering/);await page.getByRole('button',{name:'W&P Guidance',exact:true}).click();
 const picker=page.getByRole('group',{name:'Menu selection'}),view=page.getByRole('region',{name:'W&P qualifying portfolio'}),smart=page.getByRole('region',{name:'Smart spread guidance'}),station=page.getByRole('complementary',{name:'Station build'});
 await picker.getByRole('button',{name:'Latin (1)',exact:true}).click();await expect(picker.getByRole('checkbox',{name:'AMZ: Andes',exact:true})).toBeChecked();await expect(picker.getByRole('checkbox',{name:'AMZ: Balti',exact:true})).not.toBeChecked();
 await view.getByRole('button',{name:'Select Roasted carrots',exact:true}).click();
 await smart.getByLabel('Hot full-pan spaces').fill('2');await smart.getByLabel('Cold full-pan spaces').fill('1');await smart.getByLabel('Ambient display positions').fill('1');
 await smart.getByRole('button',{name:'Suggest a starting spread',exact:true}).click();await expect(smart.getByLabel('Suggested spread preview')).toBeVisible();
 await station.getByLabel('Lock Roasted carrots',{exact:true}).check();await expect(smart.getByLabel('Suggested spread preview')).toHaveCount(0);
 await smart.getByRole('button',{name:'Suggest a starting spread',exact:true}).click();await smart.getByRole('button',{name:'Use suggested lineup (replace unlocked selections)',exact:true}).click();
 await expect(station.getByLabel('Lock Roasted carrots',{exact:true})).toBeChecked();await expect(station).toContainText('Chili Herb Crunch');await expect(station.getByTestId('station-projected-fc-')).toHaveText('Incomplete');
 await smart.getByRole('button',{name:'Undo last smart change'}).click();await expect(station.getByTestId('station-food')).toHaveCount(1);
 await station.getByLabel('Lock Roasted carrots',{exact:true}).uncheck();
 await station.getByLabel('Quantity mode for Roasted carrots').selectOption('pan');
 await station.getByLabel('Opening display pans for Roasted carrots').fill('2');await station.getByLabel('Reserve / refill pans for Roasted carrots').fill('2');await station.getByLabel('Measured finished lb per pan for Roasted carrots').fill('3');
 await expect(station.getByTestId('station-finished-pounds')).toHaveText('12.00');await station.getByLabel('Service placement for Roasted carrots',{exact:true}).selectOption('Hot');await station.getByLabel('Confirm service placement for Roasted carrots',{exact:true}).check();
 await expect(smart.getByRole('button',{name:'Apply swap: Roasted squash',exact:true})).toBeVisible();await smart.getByRole('button',{name:'Apply swap: Roasted squash',exact:true}).click();
 await expect(station.getByLabel('Measured finished lb per pan for Roasted squash')).toHaveValue('');await expect(station.getByLabel('Confirm service placement for Roasted squash',{exact:true})).not.toBeChecked();
 await station.getByLabel('Measured finished lb per pan for Roasted squash').fill('2');
 const download=page.waitForEvent('download');await station.getByRole('button',{name:'Export station selections'}).click();
 const book=XLSX.read(await readFile(await(await download).path()));const data=XLSX.utils.sheet_to_json(book.Sheets['Station selections']);expect(data[0].MRN).toBe('0002');expect(data[0]['Opening display pans']).toBe('2');expect(data[0]['Profile status']).toContain('Proposed');
 await station.getByLabel('Pan size for Roasted squash').selectOption('bullet');await expect(station.getByLabel('Measured finished lb per pan for Roasted squash')).toHaveValue('');await expect(smart).toContainText('bullet pan footprint');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();expect(errors).toEqual([]);expect(writes).toEqual([]);
 await smart.screenshot({path:`test-results/wp-smart-${width}.png`});
});
test('Actual shared catalog can build a mixed smart spread without writes',async({page,request})=>{
 test.skip(!process.env.WP_ACTUAL_PROOF,'Explicit read-only shared catalog proof');test.setTimeout(120000);
 const response=await request.get('https://project-d8v25.vercel.app/api/recipe-library?scope=all');expect(response.ok()).toBeTruthy();const payload=await response.json();expect(payload.source).toMatch(/^supabase-recipe-items/);
 const writes=[],errors=collectUnexpectedPageErrors(page);
 await page.route('**/api/**',r=>{if(r.request().method()!=='GET'&&!r.request().url().includes('/traffic/'))writes.push(r.request().url());return r.fulfill({json:r.request().url().includes('recipe-library')?payload:{ok:true,rows:[],records:[]}});});
 await openTool(page,/open menu analysis/i,/Menu Engineering/);await page.getByRole('button',{name:'W&P Guidance',exact:true}).click();
 const picker=page.getByRole('group',{name:'Menu selection'}),smart=page.getByRole('region',{name:'Smart spread guidance'}),station=page.getByRole('complementary',{name:'Station build'});
 await picker.getByRole('button',{name:/^Asian & Pacific/}).click();await picker.getByRole('button',{name:/^Mediterranean & Middle Eastern/}).click();
 await smart.getByLabel('Planning season').selectOption('Fall');await smart.getByRole('button',{name:'Suggest a starting spread',exact:true}).click();
 const preview=smart.getByLabel('Suggested spread preview');await expect(preview).toBeVisible();expect(await preview.getByRole('listitem').count()).toBeGreaterThan(2);
 await preview.getByRole('button',{name:'Use suggested lineup (replace unlocked selections)',exact:true}).click();
 expect(await station.getByTestId('station-food').count()).toBeGreaterThan(2);await expect(station.getByTestId('station-projected-fc-')).toHaveText('Incomplete');
 await expect(station).toContainText('Culinary monikers');
 for(const width of [1440,390]){await page.setViewportSize({width,height:1000});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();await page.getByRole('region',{name:'W&P qualifying portfolio'}).screenshot({path:`test-results/wp-smart-actual-${width}.png`});}
 expect(errors).toEqual([]);expect(writes).toEqual([]);
});
