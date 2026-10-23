import {test,expect} from '@playwright/test';
import JSZip from 'jszip';
import {readFile} from 'node:fs/promises';
import {openTool,collectUnexpectedPageErrors} from './smoke-helpers.js';
for(const width of [390,1440])test(`All W&P menus use component view and current catalog at ${width}px`,async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('culinaryToolsMenuEngineeringItems_v3',JSON.stringify([{menu:'Stale browser menu',item:'Stale item'}])));
 await page.setViewportSize({width,height:900});const errors=collectUnexpectedPageErrors(page),writes=[];
 const rows=[{menu:'New Kitchen',item:'Gnocchi',mrn:'88770.1',portion:'6 oz portion',portionOz:6,trueCost:2},{menu:'New Kitchen',item:'Purchased topping',mrn:'00000999.01',portion:'1 oz',portionOz:1,trueCost:.1}];
 await page.route('**/api/**',r=>{if(r.request().method()!=='GET')writes.push(r.request().url());return r.fulfill({json:r.request().url().includes('recipe-library')?{ok:true,source:'supabase-recipe-items',rows}:{ok:true,records:[],rows:[],days:[]}})});
 await openTool(page,/open dashboard/i,/Menu Engineering/);await page.getByRole('button',{name:'W&P Guidance',exact:true}).click();await page.getByRole('button',{name:'New Kitchen',exact:true}).click();
 const view=page.getByRole('region',{name:'Pan-ready W&P assortment'});await expect(view).toBeVisible();await expect(view.getByTestId('servable-food')).toHaveCount(2);await expect(view.getByRole('img',{name:'Servable components by category chart'})).toBeVisible();
 const dish=view.getByTestId('servable-food').filter({has:page.getByRole('button',{name:'Compare Gnocchi',exact:true})});await expect(dish).toContainText('Recipe linked');await dish.getByText(/Supporting components/).click();await expect(dish.getByTestId('supporting-component').first()).toBeVisible();
 await expect(view).toContainText('Recipe not linked; shared item economics only');await expect(view).not.toContainText('HACCP');
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'Export menu package',exact:true}).click();const zip=await JSZip.loadAsync(await readFile(await(await download).path()));expect(await zip.file('flash-cards.html').async('string')).toContain('Purchased topping');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();expect(errors).toEqual([]);expect(writes.filter(x=>!x.includes('/traffic/'))).toEqual([]);await page.screenshot({path:`../../WORK_LOGS/WP_PAN_READY_2026_10_23/WP-${width}.png`,fullPage:true});
});
test('Transfer includes a new shared menu and exact new MRN without bundled catalog',async({page})=>{
 await page.route('**/api/**',r=>r.fulfill({json:r.request().url().includes('recipe-library')?{ok:true,source:'supabase-recipe-items',rows:[{menu:'New Shared Menu',item:'New Shared Item',mrn:'0001.23456789',portion:'4 oz',trueCost:1.25}]}:{ok:true,records:[],rows:[],days:[]}}));
 await openTool(page,/transfer/i,/Transfer/);await page.getByLabel('Menu 1',{exact:true}).selectOption('New Shared Menu');await expect(page.getByLabel('Item 1',{exact:true})).toContainText('New Shared Item');await expect(page.getByLabel('Item 1',{exact:true})).toContainText('0001.23456789');
});
