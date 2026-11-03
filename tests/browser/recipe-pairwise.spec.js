import {expect,test} from '@playwright/test';
import {openTool,collectUnexpectedPageErrors} from './smoke-helpers.js';
import {buildRecipePairwiseData,projectRecipePresence} from '../../src/features/menu-cross-utilization/recipePairwiseModel.js';
const fixture=(extra=false)=>projectRecipePresence(buildRecipePairwiseData([
 {menu:'Andes',version:'fixture',validated:true,recipes:[{variantKey:'1',ingredients:[{kind:'ingredient',name:'Carrots'},{kind:'ingredient',name:'Celery'}]}]},
 {menu:'Chickle',version:'fixture',validated:true,recipes:[{variantKey:'2',ingredients:[{kind:'ingredient',name:'Carrots'},...(extra?[{kind:'ingredient',name:'Celery'}]:[])]}]},
 {menu:'Breakfast',version:'fixture',validated:false,menuScopeConflict:true,recipes:[]},
],{expectedMenus:['Pho']}));
test('recipe matrix uses runtime records, exposes gaps and unassigned pillars, and refreshes scores',async({page})=>{
 const errors=collectUnexpectedPageErrors(page);let calls=0;
 await page.route('**/api/recipe-pairwise',route=>route.fulfill({json:{ok:true,data:fixture(calls++>0)}}));
 await openTool(page,/open cross utilization/i,/^Menu Cross Utilization Tool$/);
 await expect(page.getByRole('row',{name:/Breakfast/})).toContainText('Packet cover and menu filename disagree');
 await expect(page.getByRole('row',{name:/Pho/})).toContainText('No supplied packet');
 await page.getByRole('checkbox',{name:'Include RA menus',exact:true}).check();
 await expect(page.getByRole('row',{name:/Chickle/})).toContainText('American Grill & Smokehouse');
 await page.getByRole('button',{name:/open pairwise matrix/i}).click();
 await expect(page.getByTitle(/Andes .* Chickle:/).first()).toContainText('50%');
 await page.getByTitle(/Andes .* Chickle:/).first().click();
 await expect(page.getByTestId('pair-detail-panel')).toContainText('Carrots');
 await page.getByRole('button',{name:'Refresh recipe records'}).click();
 await expect(page.getByTitle(/Andes .* Chickle:/).first()).toContainText('100%');
 await page.getByRole('button',{name:'Pillar Strategy & Menus',exact:true}).click();
 await page.setViewportSize({width:390,height:844});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1)).toBe(true);
 expect(errors).toEqual([]);
});
test('recipe failure requires explicit historical source selection',async({page})=>{
 await page.route('**/api/recipe-pairwise',route=>route.fulfill({status:503,json:{ok:false}}));
 await openTool(page,/open cross utilization/i,/^Menu Cross Utilization Tool$/);
 await expect(page.getByRole('status')).toContainText('Recipe comparisons are unavailable');
 await expect(page.getByRole('heading',{name:'Menu cross-utilization list'})).toHaveCount(0);
 await page.getByRole('combobox',{name:'Comparison source'}).selectOption('history');
 await expect(page.getByText('Report date 2026-08-03',{exact:true})).toBeVisible();
 await page.getByRole('checkbox',{name:'Include RA menus',exact:true}).check();
 await expect(page.getByRole('row',{name:/Chickle/})).toContainText('no ingredient data');
});

test('RA toggle recomputes matrix membership and clears hidden pair detail',async({page})=>{
 const data=projectRecipePresence(buildRecipePairwiseData([
 {menu:'Andes',version:'f',validated:true,recipes:[{variantKey:'1',ingredients:[{kind:'ingredient',name:'Carrots'}]}]},
 {menu:'Oregano',version:'f',validated:true,recipes:[{variantKey:'2',ingredients:[{kind:'ingredient',name:'Carrots'}]}]}
 ]));
 await page.route('**/api/recipe-pairwise',r=>r.fulfill({json:{ok:true,data}}));
 await openTool(page,/open cross utilization/i,/^Menu Cross Utilization Tool$/);
 await expect(page.getByRole('row',{name:/Oregano/})).toHaveCount(0);
 await page.getByRole('checkbox',{name:'Include RA menus',exact:true}).check();await expect(page.getByRole('row',{name:/Oregano/})).toBeVisible();
 await page.getByRole('button',{name:/open pairwise matrix/i}).click();await page.getByTitle(/Andes .* Oregano:/).first().click();await expect(page.getByTestId('pair-detail-panel')).toBeVisible();
 await page.getByRole('checkbox',{name:'Include RA menus',exact:true}).uncheck();await expect(page.getByTitle(/Andes .* Oregano:/)).toHaveCount(0);await expect(page.getByTestId('pair-detail-panel')).toHaveCount(0);
 await page.getByRole('checkbox',{name:'Include RA menus',exact:true}).check();await expect(page.getByTitle(/Andes .* Oregano:/).first()).toContainText('100%');
});
