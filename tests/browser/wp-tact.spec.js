import {test,expect} from '@playwright/test';
import {openTool,collectUnexpectedPageErrors} from './smoke-helpers.js';
import * as XLSX from 'xlsx';
import {readFile} from 'node:fs/promises';

for(const width of [390,1440])test(`new menu arrival receives TACT display and export at ${width}px`,async({page})=>{
 const writes=[],errors=collectUnexpectedPageErrors(page);
 const item='Crispy smoky lemon chicken with red peppers';
 const rows=[{menu:'AMZ: Andes',item,mrn:'0001.20',portion:'1/2 cup',portionOz:4,trueCost:1}];
 await page.route('**/api/**',r=>{
  if(r.request().method()!=='GET'&&!r.request().url().includes('/traffic/'))writes.push(r.request().url());
  return r.fulfill({json:r.request().url().includes('recipe-library')?{ok:true,source:'supabase-recipe-items',rows}:{ok:true,records:[],rows:[]}});
 });
 await page.setViewportSize({width,height:1000});
 await openTool(page,/open menu analysis/i,/Menu Engineering/);
 await page.getByRole('button',{name:'W&P Guidance',exact:true}).click();
 await page.getByRole('group',{name:'Menu selection'}).getByRole('checkbox',{name:'AMZ: Andes',exact:true}).check();
 await page.getByRole('region',{name:'W&P qualifying portfolio'}).getByRole('button',{name:`Select ${item}`,exact:true}).click();
 const station=page.getByRole('complementary',{name:'Station build'});
 await expect(station).toContainText('Taste: Sour/Acidic, Umami (Proposed)');
 await expect(station).toContainText('Aroma: Citrus, Smoky (Proposed)');
 await expect(station).toContainText('Color: Red (Proposed)');
 await expect(station).toContainText('Texture: Crisp/Crunchy (Proposed)');
 const download=page.waitForEvent('download');await station.getByRole('button',{name:'Export station selections'}).click();
 const book=XLSX.read(await readFile(await(await download).path()));
 const exported=XLSX.utils.sheet_to_json(book.Sheets['Station selections'])[0];
 expect(exported.MRN).toBe('0001.20');expect(exported['TACT Aroma']).toBe('Citrus; Smoky');
 expect(exported['TACT Texture status']).toBe('Proposed');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 expect(writes).toEqual([]);expect(errors).toEqual([]);
 await page.screenshot({path:`test-results/wp-tact-${width}.png`,fullPage:true});
});
