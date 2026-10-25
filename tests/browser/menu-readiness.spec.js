import { test, expect } from '@playwright/test';

for (const width of [390, 1440]) test(`Menu readiness source and actionable rows at ${width}px`, async ({ page }) => {
  const writes=[];
  await page.route('**/api/**', route => {
    const request=route.request();
    if(request.method()!=='GET'&&!request.url().includes('/traffic/')) writes.push(request.url());
    return route.fulfill({json:request.url().includes('recipe-library') ? {ok:true,source:'supabase-recipe-items',rows:[
      {item:'Roast chicken',menu:'Kitchen A',mrn:'00012.30',category:'entree',trueCost:null,price:8,allergenSummary:'None reviewed',enticingDescription:'Roast chicken'},
      {item:'Roasted carrots',menu:'Kitchen B',mrn:'00013',category:'side',trueCost:0,price:3,allergens:['Milk'],enticingDescription:'Roasted carrots'},
      {item:'Rice bowl',menu:'Kitchen A',mrn:'00014',category:'entree',trueCost:1,price:null}
    ]}:{ok:true,rows:[],records:[]}});
  });
  await page.setViewportSize({width,height:950});
  await page.goto('/');
  const panel=page.getByTestId(width<768?'mobile-menu-readiness':'menu-readiness');
  await panel.locator('summary').click();
  await expect(panel).toContainText('Bundled snapshot');
  await panel.getByRole('button',{name:'Load current menu data',exact:true}).click();
  await expect(panel).toContainText('Shared Menu Library');
  await expect(panel).toContainText('Read at');
  await panel.getByRole('button',{name:'Review missing costs: 1',exact:true}).click();
  const rows=panel.getByRole('region',{name:'Matching menu items'});
  await expect(rows).toContainText('Roast chicken');
  await expect(rows).toContainText('00012.30');
  await expect(rows).not.toContainText('Roasted carrots');
  await panel.getByRole('button',{name:'Review missing allergen details: 1',exact:true}).click();
  await expect(rows).toContainText('Rice bowl');
  await expect(rows).not.toContainText('Roast chicken');
  await panel.getByRole('button',{name:'Review required prices: 1',exact:true}).click();
  await expect(rows).toContainText('Rice bowl');
  await panel.getByRole('button',{name:'Review missing descriptions: 1',exact:true}).click();
  await expect(rows).toContainText('Rice bowl');
  await expect(panel).toContainText('Missing allergen detail does not mean allergen-free');
  await panel.getByRole('button',{name:'Review category Sides: 1',exact:true}).click();
  await expect(rows).toContainText('Roasted carrots');
  await expect(rows).not.toContainText('Rice bowl');
  await rows.getByRole('textbox',{name:'Search matching items'}).fill('does not exist');
  await expect(rows).toContainText('No matching items in the loaded rows');
  await rows.getByRole('textbox',{name:'Search matching items'}).fill('00013');
  await expect(rows).toContainText('Roasted carrots');
  if(width<768) {
    const item=rows.getByRole('cell',{name:'Roasted carrots',exact:true});
    await item.evaluate(element=>element.scrollIntoView({block:'center'}));
    expect(await item.evaluate(element=>{const box=element.getBoundingClientRect();return element.contains(document.elementFromPoint(box.x+box.width/2,box.y+box.height/2));})).toBeTruthy();
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  expect(writes).toEqual([]);
  await page.screenshot({path:`test-results/menu-readiness-${width}.png`,fullPage:true});
});

test('Menu readiness never reports a failed or reference read as current shared data', async ({page})=>{
  let fail=true;
  await page.route('**/api/**',route=>route.request().url().includes('recipe-library') ? route.fulfill(fail?{status:503,json:{ok:false,message:'Unavailable'}}:{json:{ok:true,source:'server-menuworks-json',rows:[]}}):route.fulfill({json:{ok:true,rows:[],records:[]}}));
  await page.goto('/');
  const panel=page.getByTestId('menu-readiness');await panel.locator('summary').click();
  await panel.getByRole('button',{name:'Load current menu data',exact:true}).click();
  await expect(panel.getByRole('alert')).toContainText('Unable to load current menu data');
  await expect(panel).not.toContainText('Shared Menu Library');
  fail=false;
  await panel.getByRole('button',{name:'Load current menu data',exact:true}).click();
  await expect(panel).toContainText('Reference data');
  await expect(panel).toContainText('No item rows returned');
});
