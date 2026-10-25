import {test,expect} from '@playwright/test';

for(const width of [320,390,1440,1920]) test(`Tool cards show complete descriptions at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:1000});
  await page.route('**/api/**',route=>route.fulfill({json:{ok:true,rows:[],records:[]}}));
  await page.goto('/');
  const cards=page.locator(width<768?'button.mobile-tool-card':'article[data-tool-title]');
  await expect(cards).toHaveCount(12);
  for(const card of await cards.all()){
    const description=card.getByTestId('tool-description');
    await expect(description).toBeVisible();
    expect(await description.evaluate(el=>({clamp:getComputedStyle(el).webkitLineClamp,height:el.scrollHeight<=el.clientHeight,width:el.scrollWidth<=el.clientWidth}))).toEqual({clamp:'none',height:true,width:true});
    const title=card.getByRole('heading');
    // Wide-screen typography can round glyph bounds one pixel past line height.
    expect(await title.evaluate(el=>getComputedStyle(el).webkitLineClamp==='none'&&el.scrollHeight<=el.clientHeight+1&&el.scrollWidth<=el.clientWidth)).toBeTruthy();
    if(width>=768){const button=card.getByRole('button');expect(await button.evaluate(el=>el.scrollWidth<=el.clientWidth)).toBeTruthy();}
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  const engineering=cards.filter({has:page.getByRole('heading',{name:'Menu Engineering',exact:true})});
  if(width<768)await engineering.click();else await engineering.getByRole('button',{name:'Open Menu Analysis',exact:true}).click();
  await expect(page.getByRole('button',{name:'W&P Guidance',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Menu Performance',exact:true}).click();
  await expect(page.getByRole('navigation',{name:'Menu Performance views'})).toBeVisible();
});
