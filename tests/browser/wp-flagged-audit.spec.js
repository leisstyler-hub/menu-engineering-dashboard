import {test,expect} from '@playwright/test';
import {openTool,collectUnexpectedPageErrors} from './smoke-helpers.js';
import * as XLSX from 'xlsx';
import {readFile} from 'node:fs/promises';
for(const width of [390,1440])test(`Flagged Item Audit downloads all menus with correction fields at ${width}px`,async({page})=>{
 const errors=collectUnexpectedPageErrors(page),writes=[];
 const rows=[{menu:'AMZ: Audit One',item:'Roasted squash',mrn:'0001.20',portion:'1 each',trueCost:1},
 {menu:'AMZ: Audit Two',item:'Grilled chicken',mrn:'0002.30',portion:'4 oz',portionOz:4,trueCost:9},
 {menu:'AMZ: Audit Two',item:'Chicken Bowl',mrn:'0003.40',portion:'1 each',trueCost:2}];
 await page.route('**/api/**',r=>{if(r.request().method()!=='GET'&&!r.request().url().includes('/traffic/'))writes.push(r.request().url());return r.fulfill({json:r.request().url().includes('recipe-library')?{ok:true,source:'supabase-recipe-items',rows}:{ok:true,rows:[],records:[]}});});
 await page.setViewportSize({width,height:1000});await openTool(page,/open menu analysis/i,/Menu Engineering/);await page.getByRole('button',{name:'W&P Guidance',exact:true}).click();
 const audit=page.getByRole('button',{name:'Flagged Item Audit',exact:true});await expect(audit).toBeEnabled();
 await page.getByRole('group',{name:'Menu selection'}).getByRole('checkbox',{name:'AMZ: Audit One',exact:true}).check();
 const download=page.waitForEvent('download');await audit.click();
 const file=await download;expect(file.suggestedFilename()).toBe('wp-flagged-item-audit.xlsx');
 const book=XLSX.read(await readFile(await file.path())),exported=XLSX.utils.sheet_to_json(book.Sheets['Flagged Item Audit']);
 expect(exported.find(r=>r.MRN==='0001.20')['Flags / information needed']).toMatch(/weight/i);
 expect(exported.find(r=>r.MRN==='0002.30')['Flags / information needed']).toContain('Above 40%');
 expect(exported.find(r=>r.MRN==='0003.40')['Classification review']).toContain('Assembly');
 expect(exported[0]['Recommended remedy']).toBeTruthy();expect(exported[0]['Remediation status']).toBe('Open');
 expect(book.Sheets['Flagged Item Audit'].A2.t).toBe('s');
 expect(XLSX.utils.sheet_to_json(book.Sheets['Audit context']).find(r=>r.Field==='Scope').Value).toContain('All 2 loaded menus');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();expect(errors).toEqual([]);expect(writes).toEqual([]);
 await page.screenshot({path:`test-results/wp-flagged-audit-${width}.png`});
});

test('actual shared catalog audit and pillar coverage export without writes',async({page,request})=>{
 test.skip(!process.env.WP_ACTUAL_PROOF,'Explicit read-only shared proof');test.setTimeout(120000);
 const response=await request.get('https://project-d8v25.vercel.app/api/recipe-library?scope=all');expect(response.ok()).toBeTruthy();const payload=await response.json();expect(payload.source).toMatch(/^supabase-recipe-items/);
 const writes=[];await page.route('**/api/**',r=>{if(r.request().method()!=='GET'&&!r.request().url().includes('/traffic/'))writes.push(r.request().url());return r.fulfill({json:r.request().url().includes('recipe-library')?payload:{ok:true,rows:[],records:[]}});});
 await openTool(page,/open menu analysis/i,/Menu Engineering/);await page.getByRole('button',{name:'W&P Guidance',exact:true}).click();
 const picker=page.getByRole('group',{name:'Menu selection'});await expect(picker.getByRole('checkbox',{name:'AMZ: Harvest Co.',exact:true})).toBeVisible({timeout:60000});
 await picker.getByRole('button',{name:/^Core Stations Pillar/}).click();
 for(const name of ['AMZ: Harvest Co.','AMZ: Cafe Express Soup','AMZ: Cafe Express Curated Salads','AMZ: Cafe Express Curated Sandwiches'])await expect(picker.getByRole('checkbox',{name,exact:true})).toBeChecked();
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'Flagged Item Audit',exact:true}).click();
 const book=XLSX.read(await readFile(await(await download).path())),rows=XLSX.utils.sheet_to_json(book.Sheets['Flagged Item Audit']);
 expect(rows.length).toBeGreaterThan(100);expect(rows.some(r=>r.Menu==='AMZ+RA: Chickle')).toBeTruthy();
 expect(rows.some(r=>r.Menu==='AMZ: Harvest Co.'&&r.Pillar==='Core Stations Pillar')).toBeTruthy();
 expect(rows.some(r=>r['Pan estimate gap'])).toBeTruthy();expect(rows.some(r=>r['Flags / information needed'].includes('weight'))).toBeTruthy();expect(writes).toEqual([]);
});

test('W&P pillar selector covers live-name aliases and Core Stations tiles',async({page})=>{
 const menus=['AMZ+RA: Barbanzo','AMZ+RA: Paninoteca','AMZ: Harvest Co.','AMZ: Cafe Express Curated Salads','AMZ: Cafe Express Curated Sandwiches','AMZ: Cafe Express Soup','AMZ+RA: Chickle'];
 await page.route('**/api/**',r=>r.fulfill({json:r.request().url().includes('recipe-library')?{ok:true,source:'supabase-recipe-items',rows:menus.map((menu,i)=>({menu,item:'Roasted squash',mrn:String(i),portion:'4 oz',portionOz:4,trueCost:1}))}:{ok:true,rows:[],records:[]}}));
 await openTool(page,/open menu analysis/i,/Menu Engineering/);await page.getByRole('button',{name:'W&P Guidance',exact:true}).click();
 const picker=page.getByRole('group',{name:'Menu selection'});
 await picker.getByRole('button',{name:'Core Stations Pillar (4)',exact:true}).click();
 for(const name of menus.slice(2,6))await expect(picker.getByRole('checkbox',{name,exact:true})).toBeChecked();
 await expect(picker.getByRole('checkbox',{name:menus[0],exact:true})).not.toBeChecked();
 await picker.getByRole('button',{name:'Mediterranean & Middle Eastern (1)',exact:true}).click();
 await expect(picker.getByRole('checkbox',{name:menus[0],exact:true})).toBeChecked();
 await picker.getByRole('button',{name:'Italian (1)',exact:true}).click();
 await expect(picker.getByRole('checkbox',{name:menus[1],exact:true})).toBeChecked();
 await picker.getByRole('button',{name:'Needs pillar assignment (1)',exact:true}).click();
 await expect(picker.getByRole('checkbox',{name:menus[6],exact:true})).toBeChecked();
});
