import {test,expect} from '@playwright/test';
import {openTool,collectUnexpectedPageErrors} from './smoke-helpers.js';
import * as XLSX from 'xlsx';
import {readFile} from 'node:fs/promises';
const rows=[
 {menu:'AMZ: Andes',item:'Roasted carrots',mrn:'0001.20',trueCost:.4,portion:'1/2 cup',portionOz:4,dietTags:'Vegan',description:'Tender and juicy orange-colored carrots'},
 {menu:'AMZ: Andes',item:'Crispy lemon chicken',mrn:'0002.10',trueCost:.8,portion:'1/2 cup',portionOz:4,description:'Crispy and smoky lemon chicken'},
 {menu:'AMZ: Cypress',item:'Cucumber salad',mrn:'0003',trueCost:.2,portion:'1/2 cup',portionOz:4,dietTags:'Vegan'},
];
const pairwise={source:'recipe-ingredient-presence',releaseVersion:'fixture-v1',menus:[{name:'Andes',pillar:'Latin',hasIngredientData:true,matchKeys:['x','y']},{name:'Cypress',pillar:'Mediterranean & Middle Eastern',hasIngredientData:true,matchKeys:['x','z']}],pairs:[],pillars:[]};
for(const width of [1440,390])test(`TACT weights, daily sales and fixed-size planogram at ${width}`,async({page})=>{
 const writes=[],errors=collectUnexpectedPageErrors(page);
 await page.route('**/api/**',r=>{if(r.request().method()!=='GET'&&!r.request().url().includes('/traffic/'))writes.push(r.request().url());return r.fulfill({json:r.request().url().includes('recipe-pairwise')?{ok:true,data:pairwise}:r.request().url().includes('recipe-library')?{ok:true,source:'supabase-recipe-items',rows}:{ok:true,rows:[],records:[]}});});
 await page.setViewportSize({width,height:1000});await openTool(page,/open menu analysis/i,/Menu Engineering/);await page.getByRole('button',{name:'W&P Guidance',exact:true}).click();
 const picker=page.getByRole('group',{name:'Menu selection'}),view=page.getByRole('region',{name:'W&P qualifying portfolio'}),wheel=view.getByRole('region',{name:'Live TACT wheel'}),station=view.getByRole('complementary',{name:'Station build'});
 await picker.getByText('Ingredient-fit planning groups',{exact:true}).click();
 await expect(picker).toContainText('Barbanzo and Oregano');await expect(picker).toContainText('33.3%');
 await picker.getByRole('button',{name:'Add ingredient-fit partner Cypress',exact:true}).click();
 await expect(picker.getByRole('checkbox',{name:'AMZ: Cypress',exact:true})).toBeChecked();
 await view.getByRole('button',{name:'Select Roasted carrots',exact:true}).click();await view.getByRole('button',{name:'Select Crispy lemon chicken',exact:true}).click();
 await expect(wheel).toContainText('2/2 foods represented');
 await wheel.getByText('Adjust planning tags and weights',{exact:true}).click();
 await wheel.getByLabel('Food to adjust TACT').selectOption({label:'Roasted carrots'});
 await wheel.getByLabel('Add taste tag').selectOption('Neutral');
 await wheel.getByLabel('taste Neutral importance').selectOption('3');await wheel.getByLabel('taste Neutral intensity').selectOption('1');
 await wheel.getByRole('button',{name:'Roasted carrots',exact:true}).click();await expect(wheel).toContainText('defining, mild (3/1)');
 await view.getByLabel('Dietary priority').selectOption('Vegan');await expect(view.getByRole('button',{name:'Select Crispy lemon chicken',exact:true})).toHaveCount(0);await expect(station.getByTestId('station-food')).toHaveCount(2);await view.getByLabel('Dietary priority').selectOption('All');
 const card=station.getByTestId('station-food').filter({has:page.getByRole('button',{name:'Details for Roasted carrots',exact:true})});
 await card.getByText(/Daily offer & replenishment/).click();await expect(card.getByLabel('Sell method for Roasted carrots')).toHaveValue('Sell by Weight');
 await card.getByLabel('Sell method for Roasted carrots').selectOption('Scan and Pay');await card.getByLabel('Scan and Pay price for Roasted carrots').fill('5');await card.getByLabel('Scan and Pay boxes for Roasted carrots').fill('3');await card.getByLabel('Source portions per box for Roasted carrots').fill('1');
 await card.getByLabel('Lightning LTO for Roasted carrots').check();await card.getByLabel('Lightning launch for Roasted carrots').fill('2026-12-01T11:30');await card.getByLabel('Lightning pan limit for Roasted carrots').fill('2');
 await card.getByLabel('Replenishment plan for Roasted carrots').fill('Limited two pans; check freshness before replenishing.');
 await station.getByLabel('Pan size for Roasted carrots').selectOption('full');
 await wheel.getByLabel('TACT representation basis').selectOption('mass');await expect(wheel).toContainText('2/2 foods represented');
 await station.getByRole('button',{name:'Open planogram builder',exact:true}).click();const dialog=page.getByRole('dialog',{name:'Pan planogram builder',exact:true});
 await expect(dialog.getByTestId('planogram-pan')).toHaveCount(2);await expect(dialog.getByLabel('Planogram pan size for Roasted carrots')).toHaveValue('full');
 await dialog.getByLabel('Bay for Crispy lemon chicken').selectOption('1');await dialog.getByLabel('Position for Crispy lemon chicken').selectOption('1');await expect(dialog.getByRole('alert').filter({hasText:'overlap'}).first()).toBeVisible();
 await dialog.getByLabel('Bay for Crispy lemon chicken').selectOption('2');await expect(dialog.getByRole('alert').filter({hasText:'overlap'})).toHaveCount(0);
 await expect(dialog.getByLabel('Planogram pan size for Roasted carrots')).toHaveValue('full');
 const download=page.waitForEvent('download');await dialog.getByRole('button',{name:'Export planogram',exact:true}).click();const book=XLSX.read(await readFile(await(await download).path()));const exported=XLSX.utils.sheet_to_json(book.Sheets['Pan locations']);expect(exported[0].MRN).toBe('0001.20');expect(exported[0]['Pan size']).toBe('full');expect(exported[0]['Limited pans']).toBe('2');
 await page.evaluate(()=>{window.printedHTML='';window.didPrint=false;window.open=()=>({opener:null,document:{write:s=>{window.printedHTML=s;},close(){}},focus(){},print(){window.didPrint=true;}});});
 await dialog.getByRole('button',{name:'Print / Save PDF',exact:true}).click();await expect.poll(()=>page.evaluate(()=>window.didPrint)).toBeTruthy();expect(await page.evaluate(()=>window.printedHTML)).toContain('Bay 2');expect(await page.evaluate(()=>window.printedHTML)).toContain('0001.20');
 const email=await dialog.getByRole('link',{name:'Email plan',exact:true}).getAttribute('href');expect(decodeURIComponent(email)).toContain('MRN 0001.20');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();await dialog.screenshot({path:`../../WORK_LOGS/WP_PLANOGRAM_${process.env.PLAYWRIGHT_BASE_URL?.includes('vercel.app')?'PRODUCTION':'LOCAL'}_${width}_2026_11_19.png`});await dialog.getByRole('button',{name:'Close planogram',exact:true}).click();
 await wheel.screenshot({path:`../../WORK_LOGS/WP_TACT_${process.env.PLAYWRIGHT_BASE_URL?.includes('vercel.app')?'PRODUCTION':'LOCAL'}_${width}_2026_11_19.png`});const bar=view.getByRole('region',{name:'Spread capacity'});await expect(bar.getByRole('region',{name:'Live TACT wheel'})).toBeVisible();expect((await wheel.getByRole('img').boundingBox()).width).toBeGreaterThan(250);await wheel.getByText('Adjust planning tags and weights',{exact:true}).click();await bar.screenshot({path:`../../WORK_LOGS/WP_BAR_LAYOUT_${process.env.PLAYWRIGHT_BASE_URL?.includes('vercel.app')?'PRODUCTION':'LOCAL'}_${width}_2026_11_19.png`});expect(errors).toEqual([]);expect(writes).toEqual([]);
});
