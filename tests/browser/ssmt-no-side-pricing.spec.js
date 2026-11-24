import {test,expect} from '@playwright/test';

test('approved no-side brackets remain starred through isolated save and reload',async({page})=>{
 const schedules=[['Base Burger',8.70],['Signature Burger',9.20],['Premium Burger',10.75],['Chicken Sandwich',9.20],['Chicken Tenders',7.65]];
 const priceBook=schedules.map(([name,price],i)=>({id:`no-side-${i}`,category:`${name} - No Side`,selectorLabel:`$${price.toFixed(2)} - ${name} - No Side`,areas:{SEA:`$${price.toFixed(2)}`},sourceSchedule:{kind:'approved-no-side',approvalEventId:'629ee5ffa84df57fc07ff3bc84143fdee63369101ed5aa3044378780e2fb8874',sourcePriceId:`retained-${i}`}}));
 priceBook.push({id:'workbook',category:'Cheese Smashburger with Side',selectorLabel:'$11.75 - Cheese Smashburger with Side',areas:{SEA:'$11.75'},sourceGuide:{range:'E:S',sourceRow:23,sourceName:'Cheese Smashburger with Side',prices:{SEA:11.75}}});
 priceBook.push({id:'old',category:'Retained',selectorLabel:'$1.00 - Retained',areas:{SEA:'$1.00'}});
 const original={menus:[{id:'fixture',name:'Pricing Fixture',type:'Core',phase:'Culinary draft',items:[{id:'dish',name:'Fixture Dish',label:'Fixture Dish',mrn:'000123.10',priceSelectorId:'old',modifierGroups:[]}]}],priceBook,modifierGroups:[],priceBookArchives:[],selectedMenuId:'fixture'};
 let shared=structuredClone(original);const saves=[];
 await page.addInitScript(()=>{localStorage.clear();sessionStorage.clear();});
 await page.route('**/api/**',async route=>{
  const req=route.request(),url=new URL(req.url());
  if(!url.pathname.endsWith('/ssmt'))return route.fulfill({json:{ok:true,records:[]}});
  const body=req.method()==='POST'?req.postDataJSON():null,action=body?.action||url.searchParams.get('action');
  const responses={status:{ok:true,enabled:true},session:{ok:true,member:{id:'fixture-chef',name:'Fixture Chef',role:'Chef',isAdmin:true}},calendar:{ok:true,menus:[]},workspace:{ok:true,workspace:shared,revision:'fixture'}};
  if(action==='save'){shared=structuredClone(body.workspace);saves.push(shared);return route.fulfill({json:{ok:true,revision:`saved-${saves.length}`}});}
  return route.fulfill({json:responses[action]||{ok:false}});
 });
 const open=async()=>{await page.goto('/');await page.getByRole('button',{name:/open ssmt/i}).click();await page.getByRole('button',{name:'Pricing Structure',exact:true}).click();};
 await open();
 const bracket=page.getByTestId('ssmt-price-bracket');
 await expect(bracket.getByLabel('Approved no-side bracket',{exact:true})).toHaveCount(5);
 await expect(bracket.getByLabel('Workbook E-S source bracket',{exact:true})).toHaveText('\u2605');
 for(const [name,price] of schedules)await expect(bracket.getByText(`$${price.toFixed(2)} - ${name} - No Side`,{exact:true})).toBeVisible();
 await bracket.getByLabel('Show unstarred brackets only',{exact:true}).check();
 await expect(bracket.locator('tbody tr')).toHaveCount(1);
 await bracket.getByLabel('Show unstarred brackets only',{exact:true}).uncheck();
 await page.getByRole('button',{name:'Menu Selector / New Menu',exact:true}).click();
 await page.locator('[data-menu-name="Pricing Fixture"]').click();
 const selector=page.getByLabel('SEA price for Fixture Dish',{exact:true});
 for(let i=0;i<5;i++)await expect(selector.locator(`option[value="no-side-${i}"]`)).toContainText('\u2605');
 await expect(selector).toHaveValue('old');
 await page.getByRole('button',{name:'Save SSMT workspace',exact:true}).click();
 await expect.poll(()=>saves.length).toBeGreaterThan(0);
 expect(saves.at(-1).priceBook).toEqual(original.priceBook);
 expect(saves.at(-1).menus).toEqual(original.menus);
 await open();
 await expect(bracket.getByLabel('Approved no-side bracket',{exact:true})).toHaveCount(5);
 await page.setViewportSize({width:390,height:844});
 await expect(bracket.getByText('$9.20 - Signature Burger - No Side',{exact:true})).toBeVisible();
});
