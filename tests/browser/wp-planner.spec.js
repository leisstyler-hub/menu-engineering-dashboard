import {test,expect} from '@playwright/test';
import {openTool,collectUnexpectedPageErrors} from './smoke-helpers.js';
const rows=[['AMZ: Andes','Roasted carrots','001'],['AMZ: Andes','Chicken salad','002'],['AMZ: Andes','Steamed rice','003'],['AMZ+RA: Oregano','Grilled chicken','004']].map(([menu,item,mrn])=>({menu,item,mrn,portion:'1/2 cup',portionOz:4,trueCost:.5}));
for(const width of [390,1440])test(`planner fills slots without replacing choices at ${width}`,async({page})=>{
 const errors=collectUnexpectedPageErrors(page);await page.setViewportSize({width,height:950});
 await page.route('**/api/**',r=>r.fulfill({json:r.request().url().includes('recipe-library')?{ok:true,source:'supabase-recipe-items',rows}:{ok:true,rows:[],records:[]}}));
 await openTool(page,/open menu analysis/i,/Menu Engineering/);await page.getByRole('button',{name:'W&P Guidance',exact:true}).click();
 const view=page.getByRole('region',{name:'W&P qualifying portfolio'}),station=page.getByRole('complementary',{name:'Station build'});
 await expect(page.getByRole('checkbox',{name:'AMZ+RA: Oregano',exact:true})).toHaveCount(0);
 await view.getByRole('button',{name:'Select Roasted carrots',exact:true}).click();
 await expect(view.getByLabel('Planning season')).toHaveCount(0);await expect(view.getByLabel('Spread capacity')).toContainText('full 11.36 qt');expect(await station.getByTestId('station-food').first().evaluate(el=>getComputedStyle(el).borderLeftWidth)).toBe('7px');
 await view.getByText('Edit capacity',{exact:true}).click();
 await view.getByLabel('Hot full-pan spaces').fill('1');await view.getByLabel('Cold full-pan spaces').fill('0');await view.getByLabel('Ambient display positions').fill('0');await expect(view.getByLabel('Individual item choices')).toHaveCount(0);
 await view.getByRole('button',{name:'Suggest items',exact:true}).click();await view.getByRole('button',{name:'Add suggested items',exact:true}).click();
 await expect(station.getByTestId('station-food')).toHaveCount(2);await expect(view.getByLabel('Spread capacity')).toContainText('Spread complete');
 await view.getByRole('button',{name:'Select Chicken salad',exact:true}).click();await expect(station.getByLabel('Expected salads for Chicken salad')).toBeVisible();await station.getByLabel('Expected salads for Chicken salad').fill('20');await expect(view.getByLabel('Spread capacity')).toContainText('Spread complete');
 await expect(station.getByLabel('Serve Chicken salad in pans')).not.toBeChecked();
 const browse=view.getByLabel('Portfolio food list');expect(await browse.evaluate(el=>getComputedStyle(el).overflowY)).toBe('auto');
 await page.getByRole('checkbox',{name:'Include RA menus',exact:true}).check();await expect(page.getByRole('checkbox',{name:'AMZ+RA: Oregano',exact:true})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBeTruthy();expect(errors).toEqual([]);
 await view.getByText('Edit capacity',{exact:true}).click();await view.scrollIntoViewIfNeeded();
 await page.screenshot({path:`test-results/wp-planner-${width}.png`});
});

test('count service, rice cups and reference range keep estimates explicit',async({page})=>{
 const items=[['Grilled chicken sandwich','s','1 each'],['Butter Chicken','b','4 oz'],['Steamed rice','r','1/2 cup'],['Chicken salad','c','1 each']].map(([item,mrn,portion])=>({menu:'AMZ: Test',item,mrn,portion,portionOz:4,trueCost:.5}));
 await page.route('**/api/**',r=>r.fulfill({json:r.request().url().includes('recipe-library')?{ok:true,source:'supabase-recipe-items',rows:items}:{ok:true,rows:[],records:[]}}));
 await openTool(page,/open menu analysis/i,/Menu Engineering/);await page.getByRole('button',{name:'W&P Guidance',exact:true}).click();
 const v=page.getByRole('region',{name:'W&P qualifying portfolio'}),s=page.getByRole('complementary',{name:'Station build'});
 await v.getByRole('button',{name:'Select Grilled chicken sandwich',exact:true}).click();await s.getByLabel('Expected sandwiches / wraps for Grilled chicken sandwich').fill('40');await expect(s.getByTestId('station-planned-food-cost')).toHaveText('$20.00');await expect(s.getByTestId('station-projected-sales')).toHaveText('Incomplete');
 await v.getByRole('button',{name:'Select Butter Chicken',exact:true}).click();await expect(s.getByLabel('Planning cups per serving for Butter Chicken')).toHaveValue('0.5');await expect(s).toContainText('Planning assumption: 0.5 cup');await s.getByLabel('Planning cups per serving for Butter Chicken').fill('1');await expect(s).toContainText('Planning assumption: 1 cup');await expect(s).not.toContainText('Source portion has no explicit volume');await s.getByLabel('Pan size for Butter Chicken').selectOption('full');await s.getByText('Use Butter Chicken reference range',{exact:true}).click();await expect(s).toContainText('21.19-24.75 lb total');
 await v.getByRole('button',{name:'Select Steamed rice',exact:true}).click();await s.getByLabel('Service format for Steamed rice').selectOption('cups');await s.getByLabel('Expected cups for Steamed rice').fill('10');await expect(s).toContainText('Estimated 20.0 source servings');
 await v.getByRole('button',{name:'Select Chicken salad',exact:true}).click();await s.getByLabel('Serve Chicken salad in pans').check();await expect(s.getByLabel('Pan size for Chicken salad')).toBeVisible();
});
