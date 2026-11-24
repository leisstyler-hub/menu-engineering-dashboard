import {test,expect} from '@playwright/test';
import {GUIDE_COLUMNS} from '../../src/features/ssmt/ssmtPriceGuide.js';

test('one bracket exposes all rows and identifies E-S source values without saving',async({page})=>{
 const prices=Object.fromEntries(GUIDE_COLUMNS.map((c,i)=>[c,i===8?null:5+i/10]));
 const priceBook=[{id:'source',category:'Base Burger - No Side',selectorLabel:'$5.10 - Base Burger - No Side',areas:{SEA:'$5.10'},sourceGuide:{range:'E:S',sourceRow:22,section:'Grill',sourceName:'Smashburger with Side',prices}},
 {id:'price-guide-2026-row-16',category:'Smashburger',selectorLabel:'$4.00 - Smashburger',areas:{SEA:'$4.00'}},
 {id:'other',category:'Other',selectorLabel:'$0.00 - Other',areas:{SEA:0},modifierOnly:true}];
 const workspace={'Record ID':'ssmt|workspace|current',menus:[],modifierGroups:[],priceBook};
 let saves=0;
 await page.route('**/api/**',route=>{
  if(route.request().url().includes('/storage/records') && route.request().method()!=='GET')saves++;
  return route.fulfill({json:route.request().url().includes('/storage/records')?{ok:true,source:'supabase',records:[workspace]}:{ok:true,enabled:false,records:[],menus:[]}});
 });
 await page.addInitScript(()=>{localStorage.clear();sessionStorage.clear();});
 await page.goto('/');await page.getByRole('button',{name:/open ssmt/i}).click();
 await page.getByLabel(/SSMT passcode/i).fill('0411');await page.getByRole('button',{name:/unlock ssmt/i}).click();
 await page.getByRole('button',{name:'Pricing Structure',exact:true}).click();
 await expect(page.getByTestId('ssmt-source-price-guide')).toHaveCount(0);
 const bracket=page.getByTestId('ssmt-price-bracket');
 await expect(bracket.locator('tbody tr')).toHaveCount(3);
 await expect(bracket.getByLabel('Workbook E-S source bracket',{exact:true})).toHaveCount(1);
 await expect(bracket.getByRole('columnheader',{name:'E · Tier 1',exact:true})).toBeVisible();
 await expect(bracket.getByRole('columnheader',{name:'S · Canada (CAD)',exact:true})).toHaveCount(1);
 await expect(bracket.locator('[data-source-column="SAN"]').first()).toContainText('Missing');
 await bracket.getByLabel('Find pricing bracket',{exact:true}).fill('Smashburger');
 await expect(bracket.locator('tbody tr')).toHaveCount(2);
 await bracket.getByLabel('Find pricing bracket',{exact:true}).fill('');
 await bracket.getByLabel('Show unstarred brackets only',{exact:true}).check();
 await expect(bracket.locator('tbody tr')).toHaveCount(2);
 await bracket.getByRole('button',{name:'Delete price row $4.00 - Smashburger',exact:true}).click();
 const dialog=page.getByRole('dialog',{name:'Delete current pricing row',exact:true});
 await expect(dialog.getByLabel('Replacement pricing row').locator('option').filter({hasText:'★ E-S'})).toHaveCount(1);
 await dialog.getByRole('button',{name:'Cancel',exact:true}).click();
 await page.setViewportSize({width:390,height:844});
 await bracket.scrollIntoViewIfNeeded();
 expect(await bracket.getByRole('region',{name:'All pricing brackets'}).evaluate(el=>el.scrollWidth>el.clientWidth)).toBe(true);
 expect(saves).toBe(0);
});
