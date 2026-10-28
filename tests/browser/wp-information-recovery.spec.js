import {test,expect} from '@playwright/test';
import {openTool,collectUnexpectedPageErrors} from './smoke-helpers.js';
import JSZip from 'jszip';
import * as XLSX from 'xlsx';
import {readFile} from 'node:fs/promises';
const rows=[
 ['216051.2','Lemon Herb Halloumi Kebab Plate','1 serving(s)',8.035],
 ['216051.5','Sumac Pistachio Halloumi Kebab Plate','1 serving(s)',8.035],
 ['216051.3',"Za'atar Lamb Kofta Kebab Plate",'1 serving(s)',8.035],
 ['216051.6','Sumac Tomato Eggplant Plate','1 serving(s)',8],
 ['216051.4','Zaffron Ember Chicken Plate','1 serving(s)',12.187]
].map(([mrn,item,portion,portionOz])=>({menu:'AMZ: Anisa',mrn,item,portion,portionOz,trueCost:2}));
rows.push({menu:'AMZ: Test Recovery',mrn:'142401',item:'EUR: Roasted Tandoori Salmon',portion:'1 each',trueCost:4.02});
for(const width of [390,1440])test(`Source recovery reasons and export at ${width}px`,async({page})=>{
 const errors=collectUnexpectedPageErrors(page),writes=[];
 await page.setViewportSize({width,height:900});
 await page.route('**/api/**',r=>{if(r.request().method()!=='GET'&&!r.request().url().includes('/traffic/'))writes.push(r.request().url());return r.fulfill({json:r.request().url().includes('recipe-library')?{ok:true,source:'supabase-recipe-items',rows}:{ok:true,rows:[],records:[]}});});
 await openTool(page,/Open Menu Analysis/i,/Menu Engineering/);
 await page.getByRole('button',{name:'W&P Guidance',exact:true}).click();
 const picker=page.getByRole('group',{name:'Menu selection'});
 await picker.getByRole('checkbox',{name:/Anisa/}).check();
 const view=page.getByRole('region',{name:'W&P qualifying portfolio'});

 const detail=page.getByRole('dialog',{name:'Food details'});
 for(const [mrn,text] of [['179291.1','Weight: 5 oz'],['191619','Approximate source weight'],['35992.45','Conflicting portion evidence'],['26414.36','Raw chicken quarter weight only'],['191645','Vegetables']]){
  await view.getByLabel('Search portfolio foods').fill(mrn);
  const name=(await view.getByTestId('portfolio-food').getAttribute('aria-label')).replace(/^Select /,'');await view.getByTestId('portfolio-food').click();await view.getByRole('button',{name:`Details for ${name}`,exact:true}).click();
  await expect(detail).toContainText(text);await detail.getByRole('button',{name:'Close details'}).click();
 }
 await view.getByLabel('Search portfolio foods').fill('');
 const enterprise=page.getByRole('region',{name:'Enterprise W&P overview'});
 await enterprise.locator('summary').click();
 await expect(enterprise).toContainText('missing information');
 await expect(enterprise).toContainText('service review');
 const download=page.waitForEvent('download');
 await page.getByRole('button',{name:'Export menu package',exact:true}).click();
 const zip=await JSZip.loadAsync(await readFile(await(await download).path()));
 const workbook=XLSX.read(await zip.file('data-audit.xlsx').async('uint8array'));
 const audit=XLSX.utils.sheet_to_json(workbook.Sheets['Servable Items']);
 expect(audit.find(r=>r.MRN==='191619')['Approximate weight']).toBe('Yes');
 expect(audit.find(r=>r.MRN==='35992.45')['Information needed']).toContain('Conflicting portion evidence');
 await picker.getByRole('button',{name:'Clear filters'}).click();
 await picker.getByRole('checkbox',{name:/Test Recovery/}).check();
 await view.getByLabel('Search portfolio foods').fill('142401');const name=(await view.getByTestId('portfolio-food').getAttribute('aria-label')).replace(/^Select /,'');await view.getByTestId('portfolio-food').click();await view.getByRole('button',{name:`Details for ${name}`,exact:true}).click();await expect(detail).toContainText('Weight: ~4 oz');await detail.getByRole('button',{name:'Close details'}).click();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 expect(errors).toEqual([]);expect(writes).toEqual([]);
});
