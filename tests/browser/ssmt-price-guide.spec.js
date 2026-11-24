import {test,expect} from '@playwright/test';
import {GUIDE_COLUMNS} from '../../src/features/ssmt/ssmtPriceGuide.js';

test('shared workbook matrix shows all E-S columns, source blanks, CAD, search and mobile scrolling',async({page})=>{
 const prices=Object.fromEntries(GUIDE_COLUMNS.map((c,i)=>[c,i===8?null:5+i/10]));
 const priceBook=[{id:'guide',category:'Base Burger - No Side',selectorLabel:'$5.10 - Base Burger - No Side',areas:{SEA:'$5.10'},sourceGuide:{range:'E:S',sourceRow:22,section:'Grill',sourceName:'Smashburger with Side',prices}},
 {id:'missing',category:'Super Premium Protein Sandwich',selectorLabel:'Missing - Super Premium Protein Sandwich',areas:{},sourceGuide:{range:'E:S',sourceRow:42,section:'Deli',sourceName:'Super Premium Protein Sandwich',prices:Object.fromEntries(GUIDE_COLUMNS.map(c=>[c,null]))}}];
 await page.route('**/api/ssmt**',route=>route.fulfill({json:{ok:true,enabled:false}}));
 await page.route('**/api/storage/records**',route=>route.fulfill({json:{ok:true,source:'supabase',records:route.request().method()==='GET'?[{'Record ID':'ssmt|workspace|current',menus:[],modifierGroups:[],priceBook}]:[]}}));
 await page.addInitScript(()=>{localStorage.clear();sessionStorage.clear();});
 await page.goto('/');
 await page.getByRole('button',{name:/open ssmt/i}).click();
 await page.getByLabel(/SSMT passcode/i).fill('0411');
 await page.getByRole('button',{name:/unlock ssmt/i}).click();
 await page.getByRole('button',{name:'Pricing Structure',exact:true}).click();
 const guide=page.getByTestId('ssmt-source-price-guide');
 await expect(guide).toBeVisible();
 await expect(guide.locator('thead th')).toHaveText(['Source category',...GUIDE_COLUMNS.map(c=>c==='Canada'?'Canada (CAD)':c)]);
 await expect(guide.locator('tbody tr').first()).toContainText('Smashburger with Side');
 await expect(guide.locator('tbody tr').first().locator('td').nth(8)).toHaveText('Missing');
 await expect(guide.locator('tbody tr').first().locator('td').last()).toHaveText('$6.40');
 await guide.getByRole('searchbox').fill('Super Premium');
 await expect(guide.locator('tbody tr')).toHaveCount(1);
 await expect(guide.locator('tbody td')).toHaveText(Array(15).fill('Missing'));
 await guide.getByRole('searchbox').fill('not present');
 await expect(guide.getByText('No matching categories.')).toBeVisible();
 await guide.getByRole('searchbox').fill('');
 await page.setViewportSize({width:390,height:844});
 const region=guide.getByRole('region');
 await region.scrollIntoViewIfNeeded();
 expect(await region.evaluate(el=>el.scrollWidth>el.clientWidth)).toBe(true);
 await region.evaluate(el=>{el.scrollLeft=el.scrollWidth;});
 await expect(guide.getByRole('columnheader',{name:'Canada (CAD)'})).toBeInViewport();
 await page.screenshot({path:'../../WORK_LOGS/SSMT_ES_PRICING_2026_11_24/GUIDE_MOBILE.png'});
});
