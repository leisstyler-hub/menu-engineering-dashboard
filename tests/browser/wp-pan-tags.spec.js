import {test,expect} from '@playwright/test';
import {openTool,collectUnexpectedPageErrors} from './smoke-helpers.js';
import * as XLSX from 'xlsx';
import {readFile} from 'node:fs/promises';
import source from '../../src/data/wpPanEvidence.json' with {type:'json'};
import {estimatePans} from '../../src/features/menu-engineering/wpPanEstimate.js';
for(const width of [390,1440])test(`MRN portion pan estimates and Tags at ${width}px`,async({page})=>{
 const writes=[],errors=collectUnexpectedPageErrors(page);
 const rows=[{menu:'AMZ: Chaatwalla',item:'Kale Poriyal',mrn:'193119',portion:'1/2 cup',portionOz:4.273,trueCost:.616},
 {menu:'AMZ: Chaatwalla',item:'Roasted squash',mrn:'0001.20',portion:'1 each',portionOz:4,trueCost:1}];
 await page.route('**/api/**',r=>{if(r.request().method()!=='GET'&&!r.request().url().includes('/traffic/'))writes.push(r.request().url());return r.fulfill({json:r.request().url().includes('recipe-library')?{ok:true,source:'supabase-recipe-items',rows}:{ok:true,records:[],rows:[]}});});
 await page.setViewportSize({width,height:1000});await openTool(page,/open menu analysis/i,/Menu Engineering/);await page.getByRole('button',{name:'W&P Guidance',exact:true}).click();
 await page.getByRole('group',{name:'Menu selection'}).getByRole('checkbox',{name:'AMZ: Chaatwalla',exact:true}).check();
 const view=page.getByRole('region',{name:'W&P qualifying portfolio'}),station=page.getByRole('complementary',{name:'Station build'});
 await view.getByRole('button',{name:'Select Kale Poriyal',exact:true}).click();
 await station.getByLabel('Total pans to prepare for Kale Poriyal').fill('2');await station.getByLabel('Expected sell-through percent').fill('80');
 await expect(station.getByTestId('station-planned-food-cost')).toHaveText('$52.83');
 await expect(station.getByTestId('station-finished-pounds')).toHaveText('22.90');
 await expect(station.getByTestId('station-projected-sales')).toHaveText('$205.21');
 await expect(station).toContainText('LOCK ITEM FROM SUGGESTIONS');await expect(station).toContainText('Tags');
 await expect(station.getByLabel(/Service placement|Confirm service placement|Finished pounds|Measured finished|Opening display|Reserve \/ refill|Quantity mode/)).toHaveCount(0);
 await station.getByLabel('Lock Kale Poriyal',{exact:true}).check();
 const download=page.waitForEvent('download');await station.getByRole('button',{name:'Export station selections'}).click();
 const book=XLSX.read(await readFile(await(await download).path()));const exported=XLSX.utils.sheet_to_json(book.Sheets['Station selections']);
 expect(exported[0].MRN).toBe('193119');expect(exported[0]['Total pans to prepare']).toBe('2');expect(exported[0]['LOCK ITEM FROM SUGGESTIONS']).toBe('Yes');expect(exported[0].Tags).toContain('Hot');expect(exported[0]['Opening display pans']).toBeUndefined();
 expect(exported[0]['Planned food cost']).toBeCloseTo(52.82816);expect(exported[0]['Source file SHA256']).toHaveLength(64);
 await station.getByLabel('Pan size for Kale Poriyal').selectOption('full');await expect(station.getByTestId('station-planned-food-cost')).toHaveText('$111.96');
 await view.getByRole('button',{name:'Select Roasted squash',exact:true}).click();await expect(station.getByTestId('station-planned-food-cost')).toHaveText('Incomplete');await expect(station).toContainText('No exact Menu Item Index');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();expect(writes).toEqual([]);expect(errors).toEqual([]);
 await station.screenshot({path:`test-results/wp-pan-tags-${width}.png`});
});

test('Actual shared MRN and serving variant produce a pan estimate without writes',async({page,request})=>{
 test.skip(!process.env.WP_ACTUAL_PROOF,'Explicit read-only shared proof');test.setTimeout(120000);
 const response=await request.get('https://project-d8v25.vercel.app/api/recipe-library?scope=all');expect(response.ok()).toBeTruthy();const payload=await response.json();expect(payload.source).toMatch(/^supabase-recipe-items/);
 const candidate=payload.rows.find(r=>/poriyal/i.test(r.item)&&estimatePans({panSize:'half',totalPans:1},{mrn:r.mrn,menus:[r.menu],portion:r.portion},source.records).cost!=null);
 expect(candidate,'actual poriyal MRN/menu/portion evidence').toBeTruthy();
 const estimate=estimatePans({panSize:'half',totalPans:1},{mrn:candidate.mrn,menus:[candidate.menu],portion:candidate.portion});const writes=[];
 await page.route('**/api/**',r=>{if(r.request().method()!=='GET'&&!r.request().url().includes('/traffic/'))writes.push(r.request().url());return r.fulfill({json:r.request().url().includes('recipe-library')?payload:{ok:true,rows:[],records:[]}});});
 await openTool(page,/open menu analysis/i,/Menu Engineering/);await page.getByRole('button',{name:'W&P Guidance',exact:true}).click();
 const picker=page.getByRole('group',{name:'Menu selection'});await expect(picker.getByRole('checkbox',{name:candidate.menu,exact:true})).toBeVisible({timeout:60000});await picker.getByRole('checkbox',{name:candidate.menu,exact:true}).check();
 const view=page.getByRole('region',{name:'W&P qualifying portfolio'}),station=page.getByRole('complementary',{name:'Station build'});
 await view.getByRole('button',{name:`Select ${candidate.item}`,exact:true}).click();await expect(station.getByTestId('station-planned-food-cost')).toHaveText(`$${estimate.cost.toFixed(2)}`);expect(writes).toEqual([]);
});
