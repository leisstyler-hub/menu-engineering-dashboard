import {test,expect} from '@playwright/test';
test('modifier switches preserve edited MRNs and prices through isolated save and reload',async({page})=>{
 let shared={menus:[{id:'fixture',name:'Modifier Fixture',type:'Core',phase:'Culinary draft',items:[{id:'dish',name:'Fixture Dish',label:'Fixture Dish',mrn:'000123.10',modifierGroups:['group']}]}],priceBook:[{id:'paid',category:'Fixture paid',selectorLabel:'Fixture paid',areas:{SEA:'2.50',AUS:'3.00'}}],modifierGroups:[{id:'group',name:'Fixture group',modifierType:'Addition',minQty:'0',maxQty:'2',choices:[{id:'choice',label:'sauce',mrn:'000001.00',priceSelectorId:'paid',price:'2.50',areaPrices:{SEA:'2.50',AUS:'3.00'}},{id:'blank',label:'blank',mrn:'',price:'',priceSelectorId:'paid',areaPrices:{SEA:'',AUS:0}},{id:'zero',label:'zero',mrn:'0000',price:0,priceSelectorId:'',areaPrices:{SEA:0}}]}],selectedMenuId:'fixture'};
 const saves=[];
 await page.addInitScript(()=>{localStorage.clear();sessionStorage.clear();});
 await page.route('**/api/**',async route=>{
 const req=route.request(),url=new URL(req.url());
 if(!url.pathname.endsWith('/ssmt'))return route.fulfill({json:{ok:true,records:[]}});
 const body=req.method()==='POST'?req.postDataJSON():null,action=body?.action||url.searchParams.get('action');
 if(action==='save'){shared=structuredClone(body.workspace);saves.push(shared);return route.fulfill({json:{ok:true,revision:`save-${saves.length}`}});}
 return route.fulfill({json:({status:{ok:true,enabled:true},session:{ok:true,member:{id:'fixture-chef',name:'Fixture Chef',role:'Chef',isAdmin:true}},calendar:{ok:true,menus:[]},workspace:{ok:true,workspace:shared,revision:'fixture'}})[action]||{ok:false}});
 });
 const open=async()=>{await page.goto('/');await page.getByRole('button',{name:/open ssmt/i}).click();await page.getByRole('button',{name:'Menu Selector / New Menu',exact:true}).click();await page.locator('[data-menu-name="Modifier Fixture"]').click();await page.getByRole('button',{name:/View modifiers Mods/}).click();};
 await open();
 await page.getByLabel('Modifier MRN',{exact:true}).first().fill('000009.70');
 await page.getByLabel('Modifier price',{exact:true}).first().selectOption('paid');
 for(const type of ['Remove','Custom','Force','Addition','Remove']){
 await page.getByLabel('Modifier group type',{exact:true}).selectOption(type);
 await expect(page.getByLabel('Modifier MRN',{exact:true}).first()).toHaveValue('000009.70');
 await expect(page.getByLabel('Modifier price',{exact:true}).first()).toHaveValue('paid');
 }
 await page.getByRole('button',{name:'Add modifier item line',exact:true}).click();
 await expect(page.getByLabel('Modifier MRN',{exact:true}).first()).toHaveValue('000009.70');
 await expect(page.getByLabel('Modifier price',{exact:true}).first()).toHaveValue('paid');
 await page.getByRole('button',{name:'Save modifiers',exact:true}).click();
 await expect.poll(()=>saves.length).toBeGreaterThan(0);
 const saved=saves.at(-1).modifierGroups.find(g=>g.id==='group').choices[0];
 expect(saved.mrn).toBe('000009.70');expect(saved.priceSelectorId).toBe('paid');expect(saved.areaPrices.SEA).toBe('2.50');expect(saved.areaPrices.AUS).toBe('3.00');
 const choices=saves.at(-1).modifierGroups.find(g=>g.id==='group').choices;expect(choices[1].price).toBe('');expect(choices[1].areaPrices).toMatchObject({SEA:'',AUS:0});expect(choices[2].price).toBe(0);expect(choices[2].mrn).toBe('0000');
 await open();await expect(page.getByLabel('Modifier MRN',{exact:true}).first()).toHaveValue('000009.70');await expect(page.getByLabel('Modifier price',{exact:true}).first()).toHaveValue('paid');
});
