import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import JSZip from 'jszip';
import * as XLSX from 'xlsx';
import {buildMenuAnalysisSource} from '../../src/features/menu-engineering/menuAnalysisSource.js';
import {buildPortfolio,includeWpMenu} from '../../src/features/menu-engineering/wpPortfolioModel.js';
import {panReadyMenu} from '../../src/features/menu-engineering/panReadyModel.js';
import {openTool,collectUnexpectedPageErrors} from './smoke-helpers.js';
const rows=[{menu:'AMZ: Balti',item:'Butter Chicken Plate',mrn:'212486.1',portion:'1 serving(s)',portionOz:17.206,trueCost:3.02},{menu:'AMZ: Andes',item:'Tofu',mrn:'187686',portion:'8 oz',portionOz:8,trueCost:1.52}];
for(const width of [390,1440]) test(`Pan-ready ranking, supporting prep and item exports at ${width}px`,async({page})=>{
  const errors=collectUnexpectedPageErrors(page),writes=[];
  await page.setViewportSize({width,height:900});
  await page.route('**/api/**',route=>{if(route.request().method()!=='GET'&&!route.request().url().includes('/traffic/'))writes.push(route.request().url());return route.fulfill({json:route.request().url().includes('recipe-library')?{ok:true,source:'supabase-recipe-items',rows}:{ok:true,records:[],rows:[]}});});
  await openTool(page,/open dashboard/i,/Menu Engineering/);
  await page.getByRole('button',{name:'W&P Guidance',exact:true}).click();
  await expect(page.getByLabel('W&P selling price',{exact:true})).toHaveValue('0.70');
  await expect(page.getByLabel('W&P price unit')).toHaveValue('oz');
  await chooseMenu(page,'AMZ: Balti');
  const view=page.getByRole('region',{name:'Pan-ready W&P assortment'});
  await expect(view.getByRole('img',{name:'Servable components by category chart'})).toBeVisible();
  await view.getByLabel('Search servable foods').fill('Butter Chicken');
  const butter=view.getByTestId('servable-food');
  await expect(butter).toHaveCount(1);
  await expect(butter).toContainText('FC Needs information');
  await expect(butter).not.toContainText('Plate');
  await butter.getByText(/Supporting components/).click();
  await expect(butter.getByTestId('supporting-component')).toContainText('Tikka Marinade');
  await view.getByRole('button',{name:/Compare EUR: Butter Chicken/}).click();
  await expect(view.getByLabel('Selected food')).toContainText('Butter Chicken');
  await view.getByLabel('Search servable foods').fill('Jeera Rice');
  await expect(view.getByLabel('Selected food')).toContainText('Butter Chicken');
  await expect(view.getByLabel('Food cost ranking').getByTestId('servable-food')).toHaveCount(1);
  await expect(view.getByLabel('Food cost ranking')).toContainText('Jeera Rice');
  const download=page.waitForEvent('download');await page.getByRole('button',{name:'Export menu package',exact:true}).click();
  const zip=await JSZip.loadAsync(await readFile(await(await download).path()));
  const html=await zip.file('flash-cards.html').async('string');
  expect(html).toContain('Butter Chicken');expect(html).toContain('FC Needs information');expect(html).not.toContain('Chicken (Murgh Makhani) Plate');
  const workbook=XLSX.read(await zip.file('data-audit.xlsx').async('uint8array'));
  const items=XLSX.utils.sheet_to_json(workbook.Sheets['Servable Items']);
  const rice=items.filter(r=>/Jeera Rice/.test(r.Item));expect(rice).toHaveLength(1);expect(typeof rice[0].MRN).toBe('string');expect(rice[0]['FC%']).toBeGreaterThanOrEqual(0);expect(rice[0]['Price per oz']).toBe(.7);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  await page.screenshot({path:`test-results/pan-ready-${width}.png`,fullPage:true});
  expect(errors).toEqual([]);expect(writes).toEqual([]);
});
test('Saved current shared catalog opens every menu with matching servable counts',async({page})=>{
  test.skip(!process.env.WP_CATALOG_SNAPSHOT,'Read-only actual-catalog proof requires an explicit saved API snapshot');
  const payload=JSON.parse(await readFile(process.env.WP_CATALOG_SNAPSHOT,'utf8'));
  const library=JSON.parse(await readFile(new URL('../../src/data/allMenusWpAnalysis.json',import.meta.url),'utf8'));
  const specials=Object.fromEntries(await Promise.all([['AMZ: Andes','andes'],['AMZ: Balti','balti']].map(async([menu,file])=>[menu,JSON.parse(await readFile(new URL(`../../src/data/${file}WpAnalysis.json`,import.meta.url),'utf8'))])));
  const menus=[...new Set(payload.rows.map(r=>r.menu))].filter(includeWpMenu),errors=collectUnexpectedPageErrors(page),writes=[];
  await page.route('**/api/**',route=>{if(route.request().method()!=='GET'&&!route.request().url().includes('/traffic/'))writes.push(route.request().url());return route.fulfill({json:route.request().url().includes('recipe-library')?payload:{ok:true,records:[],rows:[]}});});
  await openTool(page,/open dashboard/i,/Menu Engineering/);
  await page.getByRole('button',{name:'W&P Guidance',exact:true}).click();
  await expect(page.getByRole('group',{name:'Menu selection'}).getByRole('checkbox')).toHaveCount(menus.length);
  const portfolio=buildPortfolio(menus.map(menu=>panReadyMenu(buildMenuAnalysisSource(menu,payload.rows,specials[menu]||library,true),11.2,payload.rows)));
  const qualifying=portfolio.filter(r=>r.portfolioStatus==='Within 40%');
  await expect(page.getByRole('region',{name:'W&P qualifying portfolio'}).getByTestId('portfolio-food')).toHaveCount(qualifying.length);
  for(const width of [1440,390]) {
    await page.setViewportSize({width,height:900});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
    const list=page.getByLabel('Portfolio food list');
    expect((await list.boundingBox()).height).toBeLessThanOrEqual(561);
    const grid=page.getByTestId('menu-tile-grid');expect(await grid.evaluate(el=>el.scrollHeight<=el.clientHeight&&el.scrollWidth<=el.clientWidth)).toBeTruthy();const positions=await grid.getByTestId('menu-tile').evaluateAll(nodes=>[...new Set(nodes.map(n=>Math.round(n.getBoundingClientRect().top)))]);expect(positions.length).toBeGreaterThanOrEqual(3);
    await page.screenshot({path:`test-results/wp-portfolio-catalog-${width}.png`,fullPage:true});
  }
  for(const menu of menus){
    const source=buildMenuAnalysisSource(menu,payload.rows,specials[menu]||library,true);
    const expected=panReadyMenu(source,11.2,payload.rows);
    await chooseMenu(page,menu);
    const view=page.getByRole('region',{name:'Pan-ready W&P assortment'});
    await expect(view.getByLabel('Food cost ranking').getByTestId('servable-food')).toHaveCount(buildPortfolio([expected]).length);
    await expect(view.getByText(new RegExp(`^${buildPortfolio([expected]).length} serving choices`))).toBeVisible();
  }
  expect(errors).toEqual([]);expect(writes).toEqual([]);
});

async function chooseMenu(page,name) {
 const picker=page.getByRole('group',{name:'Menu selection'});

 await picker.getByRole('button',{name:'Clear filters'}).click();
 await picker.locator('label').filter({has:page.getByRole('checkbox')}).filter({hasText:name}).getByRole('checkbox').check();
}
