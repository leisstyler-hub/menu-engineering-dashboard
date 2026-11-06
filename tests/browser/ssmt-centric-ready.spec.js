import {test,expect} from '@playwright/test';

for (const width of [1440,390]) test(`Centric readiness on both calendars at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:1000});
  await page.clock.setFixedTime(new Date(2026,10,6,12));
  const menus=['IT complete','IT programming','Experience review','Culinary draft'].map((phase,index)=>({id:`promo-${index}`,name:`Promotion ${index}`,type:'Promotion',phase,activeStart:'2026-11-06',activeEnd:'2026-11-06',items:[]}));
  await page.addInitScript(()=>{localStorage.clear();sessionStorage.clear();});
  await page.route('**/api/ssmt**',r=>r.fulfill({json:new URL(r.request().url()).searchParams.get('action')==='status'?{ok:true,enabled:false}:{ok:true,menus}}));
  await page.route('**/api/storage/records**',r=>r.fulfill({json:r.request().method()==='GET'?{ok:true,source:'supabase',records:[{'Record ID':'ssmt|workspace|current','Record Type':'SSMT Workspace',menus,modifierGroups:[],priceBook:[],updatedAt:'2026-11-06T12:00:00Z'}]}:{ok:true,synced:1}}));
  await page.goto('/');
  const check=async calendar=>{
    const ready=calendar.getByRole('button',{name:/Promotion 0/});
    await expect(ready).toContainText('Centric Ready: ✅');
    await expect(ready).toHaveCSS('border-color','rgb(22, 163, 74)');
    for(const index of [1,2,3])await expect(calendar.getByRole('button',{name:`Promotion ${index}`,exact:true})).not.toContainText('Centric Ready');
  };
  await check(page.getByTestId(width===390?'mobile-landing-promotion-calendar':'landing-promotion-calendar'));
  await page.getByRole('button',{name:/open ssmt/i}).click();
  await page.getByLabel(/SSMT passcode/i).fill('0411');
  await page.getByRole('button',{name:/unlock ssmt/i}).click();
  await check(page.getByTestId('ssmt-promotion-calendar'));
  await page.locator('html').evaluate(el=>el.classList.add('dark'));
  await check(page.getByTestId('ssmt-promotion-calendar'));
  await page.screenshot({path:`test-results/centric-ready-${width}.png`,fullPage:true});
  menus[0].phase='IT programming';
  await page.reload();
  await expect(page.getByTestId(width===390?'mobile-landing-promotion-calendar':'landing-promotion-calendar')).not.toContainText('Centric Ready');
});
