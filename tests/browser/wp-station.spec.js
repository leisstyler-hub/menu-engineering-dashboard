import {test,expect} from '@playwright/test';
import * as XLSX from 'xlsx';
import {readFile} from 'node:fs/promises';
import {openTool,collectUnexpectedPageErrors} from './smoke-helpers.js';

for(const width of [390,1440])test(`Station selection, projections and exact MRN workbook at ${width}px`,async({page})=>{
 const errors=collectUnexpectedPageErrors(page),writes=[];
 const rows=[{menu:'Kitchen A',item:'Roasted carrots',mrn:'00012.30',portion:'4 oz',portionOz:4,trueCost:1},
 {menu:'Kitchen B',item:'Roasted potatoes',mrn:'00013.01',portion:'4 oz',portionOz:4,trueCost:2},
 {menu:'Kitchen B',item:'Roasted squash',mrn:'00014',portion:'1 each',trueCost:2}];
 await page.route('**/_vercel/insights/**',r=>r.fulfill({contentType:'application/javascript',body:''}));
 await page.route('**/api/**',r=>{if(r.request().method()!=='GET'&&!r.request().url().includes('/traffic/'))writes.push(r.request().url());return r.fulfill({json:r.request().url().includes('recipe-library')?{ok:true,source:'supabase-recipe-items',rows}:{ok:true,rows:[],records:[]}});});
 await page.setViewportSize({width,height:900});await openTool(page,/open menu analysis/i,/Menu Engineering/);await page.getByRole('button',{name:'W&P Guidance',exact:true}).click();
 const picker=page.getByRole('group',{name:'Menu selection'}),view=page.getByRole('region',{name:'W&P qualifying portfolio'}),build=page.getByRole('complementary',{name:'Station build'});
 await picker.getByRole('checkbox',{name:/Kitchen A/}).check();
 await view.getByRole('button',{name:'Select Roasted carrots',exact:true}).click();
 await expect(view.getByRole('button',{name:'Select Roasted carrots',exact:true})).toHaveAttribute('aria-pressed','true');
 await build.getByLabel('Finished pounds for Roasted carrots',{exact:true}).fill('10');
 await build.getByLabel('Expected sell-through percent').fill('80');
 await expect(build.getByTestId('station-planned-food-cost')).toHaveText('$40.00');
 await expect(build.getByTestId('station-projected-sales')).toHaveText('$89.60');
 await expect(build.getByTestId('station-projected-fc-')).toHaveText('44.6%');
 await picker.getByRole('button',{name:'Clear filters'}).click();await picker.getByRole('checkbox',{name:/Kitchen B/}).check();
 await expect(build.getByTestId('station-food')).toHaveCount(1);
 await view.getByLabel('Portfolio result').selectOption('All');
 await view.getByRole('button',{name:'Select Roasted potatoes',exact:true}).click();
 await expect(build.getByTestId('station-food')).toHaveCount(2);
 const download=page.waitForEvent('download');await build.getByRole('button',{name:'Export station selections'}).click();
 const book=XLSX.read(await readFile(await(await download).path()));const exported=XLSX.utils.sheet_to_json(book.Sheets['Station selections']);
 expect(exported.map(r=>r.MRN)).toEqual(['00012.30','00013.01']);expect(book.Sheets['Station selections'].B2.t).toBe('s');expect(exported[0]['Planned finished lb']).toBe(10);expect(exported[0]['Source menus']).toBe('Kitchen A');expect(exported[0]['Planned food cost']).toBe(40);
 await view.getByRole('button',{name:'Select Roasted squash',exact:true}).click();
 await expect(build.getByTestId('station-planned-food-cost')).toHaveText('Incomplete');await expect(build.getByTestId('station-projected-fc-')).toHaveText('Incomplete');
 await build.getByRole('button',{name:'Details for Roasted squash'}).click();await page.getByRole('dialog',{name:'Food details'}).getByRole('button',{name:'Delete from station'}).click();await expect(view.getByRole('button',{name:'Select Roasted squash',exact:true})).toHaveAttribute('aria-pressed','false');
 await page.getByLabel('W&P selling price',{exact:true}).fill('1');
 await expect(build.getByTestId('station-projected-sales')).toHaveText('$140.80');
 await build.getByLabel('Finished pounds for Roasted carrots',{exact:true}).fill('');await expect(build.getByTestId('station-projected-sales')).toHaveText('Incomplete');
 await build.getByLabel('Finished pounds for Roasted carrots',{exact:true}).fill('10');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 await build.scrollIntoViewIfNeeded();await page.screenshot({path:`test-results/wp-station-${width}.png`,fullPage:true});
 await picker.getByRole('button',{name:'Clear filters'}).click();await view.getByRole('button',{name:'Select Roasted carrots',exact:true}).click();await expect(build.getByTestId('station-food')).toHaveCount(1);await view.getByRole('button',{name:'Select Roasted carrots',exact:true}).click();await expect(build.getByTestId('station-food')).toHaveCount(2);
 await build.getByRole('button',{name:'Clear selections'}).click();await expect(build.getByTestId('station-food')).toHaveCount(0);
 await expect(page.getByRole('region',{name:'Pan-ready W&P assortment'})).toHaveCount(0);
 expect(errors).toEqual([]);expect(writes).toEqual([]);
});

test('Narrowing menus cannot hide conflicts and refresh cannot retain stale costs',async({page})=>{
 let rows=[{menu:'Kitchen A',item:'Roasted carrots',mrn:'00012.30',portion:'4 oz',portionOz:4,trueCost:1},{menu:'Kitchen B',item:'Roasted carrots',mrn:'00012.30',portion:'4 oz',portionOz:4,trueCost:2}];
 await page.route('**/api/**',r=>r.fulfill({json:r.request().url().includes('recipe-library')?{ok:true,source:'supabase-recipe-items',rows}:{ok:true,rows:[],records:[]}}));
 await openTool(page,/open menu analysis/i,/Menu Engineering/);await page.getByRole('button',{name:'W&P Guidance',exact:true}).click();
 await page.getByRole('group',{name:'Menu selection'}).getByRole('checkbox',{name:/Kitchen A/}).check();
 const view=page.getByRole('region',{name:'W&P qualifying portfolio'}),build=page.getByRole('complementary',{name:'Station build'});
 await view.getByRole('button',{name:'Select Roasted carrots',exact:true}).click();
 await expect(build.getByTestId('station-planned-food-cost')).toHaveText('Incomplete');await expect(build).toContainText('Conflicting source variants');
 rows=rows.slice(0,1);await page.getByRole('button',{name:'Refresh data',exact:true}).click();
 // A refresh remounts the workbench and clears its temporary plan, rather than retaining stale economics.
 await expect(build.getByTestId('station-food')).toHaveCount(0);
});

test('Actual shared catalog station workflow, workbook and responsive proof',async({page,request})=>{
 test.skip(!process.env.WP_ACTUAL_PROOF,'Explicit read-only shared catalog proof');
 test.setTimeout(120_000); // Includes two live shared-catalog reads; the app itself allows 45 seconds per load.
 const response=await request.get('https://project-d8v25.vercel.app/api/recipe-library?scope=all');
 expect(response.ok()).toBeTruthy();const payload=await response.json();expect(payload.source).toMatch(/^supabase-recipe-items/);
 const errors=[],writes=[];page.on('pageerror',error=>errors.push(error.message));
 if(!process.env.PLAYWRIGHT_BASE_URL?.includes('project-d8v25.vercel.app'))await page.route('**/_vercel/insights/**',r=>r.fulfill({contentType:'application/javascript',body:''}));
 await page.route('**/api/**',r=>{
  if(r.request().method()!=='GET'&&!r.request().url().includes('/traffic/'))writes.push(r.request().url());
  if(process.env.PLAYWRIGHT_BASE_URL?.includes('project-d8v25.vercel.app')&&r.request().method()==='GET'&&r.request().url().includes('recipe-library'))return r.continue();
  return r.fulfill({json:r.request().url().includes('recipe-library')?payload:{ok:true,rows:[],records:[]}});
 });
 await page.setViewportSize({width:1440,height:1000});await openTool(page,/open menu analysis/i,/Menu Engineering/);await page.getByRole('button',{name:'W&P Guidance',exact:true}).click();
 const picker=page.getByRole('group',{name:'Menu selection'}),view=page.getByRole('region',{name:'W&P qualifying portfolio'}),build=page.getByRole('complementary',{name:'Station build'});
 await picker.getByRole('checkbox',{name:/Anisa/}).check();
 const first=view.getByTestId('portfolio-food').first();const name=(await first.getAttribute('aria-label')).replace(/^Select /,'');
 await first.click();await build.getByLabel(`Finished pounds for ${name}`,{exact:true}).fill('10');
 await build.getByRole('button',{name:`Details for ${name}`,exact:true}).click();const popup=page.getByRole('dialog',{name:'Food details'});await expect(popup).toContainText('MRN');await page.keyboard.press('Escape');
 await picker.getByRole('button',{name:'Clear filters'}).click();await picker.getByRole('checkbox',{name:/Balti/}).check();await expect(build.getByTestId('station-food')).toHaveCount(1);
 await expect(build.getByLabel(`Finished pounds for ${name}`,{exact:true})).toHaveValue('10');
 const download=page.waitForEvent('download');await build.getByRole('button',{name:'Export station selections'}).click();const file=await download;
 const book=XLSX.read(await readFile(await file.path()));const items=XLSX.utils.sheet_to_json(book.Sheets['Station selections']);expect(items).toHaveLength(1);expect(items[0].MRN).toBeTruthy();expect(book.Sheets['Station selections'].B2.t).toBe('s');
 const state=process.env.PLAYWRIGHT_BASE_URL?.includes('project-d8v25.vercel.app')?'PRODUCTION':'LOCAL';
 await file.saveAs(`../../WORK_LOGS/WP_STATION_BUILDER_2026_10_26/${state}_STATION.xlsx`);
 for(const width of [1440,390]){await page.setViewportSize({width,height:1000});await view.screenshot({path:`../../WORK_LOGS/WP_STATION_BUILDER_2026_10_26/${state}_${width}.png`});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();}
 expect(errors).toEqual([]);expect(writes).toEqual([]);
});
