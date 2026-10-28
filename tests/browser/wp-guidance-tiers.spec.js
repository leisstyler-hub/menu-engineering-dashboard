import {test,expect} from '@playwright/test';
import {openTool,collectUnexpectedPageErrors} from './smoke-helpers.js';
import {TIERS} from '../../src/features/menu-engineering/panReadyModel.js';
for(const width of [390,1440])test(`Visible food cost tiers update and category chips clear at ${width}px`,async({page})=>{
 const errors=collectUnexpectedPageErrors(page),writes=[];
 const rows=[.7,.98,1.26,1.54,1.96].map((trueCost,i)=>({menu:'Tier kitchen',item:`Roasted carrots ${i}`,mrn:`000${i}`,portion:'4 oz',portionOz:4,trueCost}));
 rows.push({menu:'Tier kitchen',item:'Roasted squash',mrn:'009',portion:'1 each',trueCost:1},{menu:'Tier kitchen',item:'Roasted potatoes',mrn:'010',portion:'4 oz',portionOz:4,trueCost:.7},{menu:'Tier kitchen',item:'Grilled chicken',mrn:'011',portion:'4 oz',portionOz:4,trueCost:.7});
 await page.route('**/api/**',r=>{if(r.request().method()!=='GET'&&!r.request().url().includes('/traffic/'))writes.push(r.request().url());return r.fulfill({json:r.request().url().includes('recipe-library')?{ok:true,source:'supabase-recipe-items',rows}:{ok:true,rows:[],records:[]}});});
 await page.setViewportSize({width,height:900});await openTool(page,/open menu analysis/i,/Menu Engineering/);await page.getByRole('button',{name:'W&P Guidance',exact:true}).click();
 const view=page.getByRole('region',{name:'W&P qualifying portfolio'});
 await expect(view.getByLabel('Portfolio result')).toHaveCount(0);
 for(let i=0;i<5;i++)await expect(view.getByRole('region',{name:`Food cost tier ${TIERS[i]}`,exact:true})).toContainText(`Roasted carrots ${i}`);
 await expect(view.getByRole('region',{name:'Food cost tier Needs information',exact:true})).toContainText('Roasted squash');
 for(const name of ['Proteins','Starches / grains','Vegetables']){
  const chip=view.getByRole('button',{name:new RegExp(`^${name}:`)});
  await chip.click();await expect(chip).toHaveAttribute('aria-pressed','true');await expect(view.getByLabel('Portfolio category')).toHaveValue(name);
  await chip.click();await expect(chip).toHaveAttribute('aria-pressed','false');await expect(view.getByLabel('Portfolio category')).toHaveValue('All');
 }
 await page.getByLabel('W&P selling price',{exact:true}).fill('2.1');
 await expect(view.getByRole('region',{name:`Food cost tier ${TIERS[0]}`,exact:true})).toContainText('Roasted carrots 4');
 await expect(view.getByRole('region',{name:'Food cost tier >60%',exact:true}).getByTestId('portfolio-food')).toHaveCount(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 await view.screenshot({path:`test-results/wp-guidance-tiers-${width}.png`});expect(errors).toEqual([]);expect(writes).toEqual([]);
});
