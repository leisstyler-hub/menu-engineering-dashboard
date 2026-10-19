import { test, expect } from '@playwright/test';
import JSZip from 'jszip';
import { readFile } from 'node:fs/promises';
import { openTool, collectUnexpectedPageErrors } from './smoke-helpers.js';

const row = (id, item, extra = {}) => ({ id, item, menu: 'Test Kitchen', category: 'Entree', mrn: `000${id}.123456789`, price: 8, trueCost: 1, portionOz: 8, ...extra });
const rows = [row(1, 'Roast Chicken'), row(2, 'Lentil Rice', { category: 'Side' }), row(3, 'Cauliflower Steak', { category: 'Side' }), row(4, 'Salmon'), row(5, 'Uncosted Vegetables', { trueCost: null }), row(1, 'Roast Chicken'), row(6, 'Unknown Portion', { menu: 'Incomplete Kitchen', portionOz: null, portion: '1 piece' })];

async function setup(page, source = 'supabase-recipe-items') {
  const writes = [];
  await page.route('**/api/**', route => {
    const request = route.request();
    if (request.method() !== 'GET' && !request.url().includes('/api/traffic/')) writes.push(request.url());
    if (request.url().includes('/api/recipe-library')) return route.fulfill({ json: { ok: true, rows, source } });
    return route.fulfill({ json: { ok: true, records: [], rows: [], days: [] } });
  });
  await openTool(page, /open dashboard/i, /Menu Engineering/);
  return writes;
}

test('W&P evaluates all menus with the 60% gate, missing inputs and stored categories', async ({ page }) => {
  const errors = collectUnexpectedPageErrors(page);
  const writes = await setup(page);
  await page.getByRole('button', { name: 'Weigh & Pay', exact: true }).click();
  const menu = page.getByTestId('wp-menu-row').filter({ hasText: 'Test Kitchen' });
  await expect(menu).toContainText('3 / 5');
  await expect(menu).toContainText('60.0%');
  await expect(menu.getByTestId('wp-menu-status')).toHaveText('Pass');
  await menu.getByRole('button', { name: 'Test Kitchen', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Side', exact: true })).toBeVisible();
  await expect(page.getByTestId('wp-item-row').filter({ hasText: 'Salmon' })).toContainText('Seafood');
  await expect(page.getByTestId('wp-item-row').filter({ hasText: 'Uncosted Vegetables' })).toContainText('Needs cost');
  await page.getByLabel('Search W&P menus').fill('Incomplete');
  await expect(page.getByTestId('wp-menu-row')).toHaveCount(1);
  await page.getByRole('button', { name: 'Incomplete Kitchen', exact: true }).click();
  await expect(page.getByTestId('wp-item-row')).toContainText('Needs weight');
  expect(writes).toEqual([]);
  expect(errors).toEqual([]);
});

test('W&P controls require Edit and a reason; export captures exceptions without writing data', async ({ page }) => {
  const writes = await setup(page);
  await page.getByRole('button', { name: 'Weigh & Pay', exact: true }).click();
  await page.getByRole('button', { name: 'Test Kitchen', exact: true }).click();
  await expect(page.getByLabel('Decision for Salmon')).toHaveCount(0);
  await page.getByRole('button', { name: 'Edit guidance', exact: true }).click();
  const salmon = page.getByTestId('wp-item-row').filter({ hasText: 'Salmon' });
  await salmon.getByLabel('Decision for Salmon').selectOption('allow');
  await salmon.getByRole('button', { name: 'Apply', exact: true }).click();
  await expect(salmon).toContainText('Enter a reason');
  await salmon.getByLabel('Reason for Salmon').fill('Approved limited assortment');
  await salmon.getByRole('button', { name: 'Apply', exact: true }).click();
  await expect(salmon).toContainText('Allowed by override');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export menu package', exact: true }).click();
  const zip = await JSZip.loadAsync(await readFile(await (await download).path()));
  expect(Object.keys(zip.files)).toEqual(expect.arrayContaining(['menu-summary.xlsx', 'guidance-report.html', 'flash-cards.html', 'calculation-snapshot.json', 'README.txt']));
  const snapshot = JSON.parse(await zip.file('calculation-snapshot.json').async('string'));
  expect(snapshot.menus[0].items.find(item => item.item === 'Salmon')).toMatchObject({ override: { decision: 'allow', reason: 'Approved limited assortment' }, mrn: '0004.123456789' });
  expect(await zip.file('flash-cards.html').async('string')).toContain('Approved limited assortment');
  expect(writes).toEqual([]);
});

test('Menu Engineering retains Menu and Portfolio views with compact desktop and mobile controls', async ({ page }) => {
  await setup(page);
  await expect(page.getByRole('button', { name: 'Menu View', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Portfolio Menu View', exact: true }).click();
  await expect(page.getByText('Test Kitchen', { exact: true }).last()).toBeVisible();
  await page.getByRole('button', { name: 'Menu View', exact: true }).click();
  await expect(page.getByText('Menu engineering controls', { exact: false })).toBeVisible();
  const header = await page.getByTestId('engineering-header').boundingBox();
  expect(header.height).toBeLessThan(260);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Weigh & Pay', exact: true }).click();
  await expect(page.getByLabel('Search W&P menus')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('W&P labels fallback data as reference rather than shared approval', async ({ page }) => {
  await setup(page, 'server-menuworks-json');
  await page.getByRole('button', { name: 'Weigh & Pay', exact: true }).click();
  await expect(page.getByText(/Fallback data.*reference only/i)).toBeVisible();
  await expect(page.getByTestId('wp-menu-row').first().getByTestId('wp-menu-status')).toHaveText('Conditional');
});

test('W&P refreshes server data despite a browser override and clears session exceptions', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('culinaryToolsMenuEngineeringItems_v3', JSON.stringify([{ menu: 'Stale browser', item: 'Stale' }])));
  await setup(page);
  await page.getByRole('button', { name: 'Weigh & Pay', exact: true }).click();
  await expect(page.getByTestId('wp-menu-row').filter({ hasText: 'Test Kitchen' })).toBeVisible();
  await page.getByRole('button', { name: 'Test Kitchen', exact: true }).click();
  await page.getByRole('button', { name: 'Edit guidance', exact: true }).click();
  const chicken = page.getByTestId('wp-item-row').filter({ hasText: 'Roast Chicken' });
  await chicken.getByLabel('Decision for Roast Chicken').selectOption('block');
  await chicken.getByLabel('Reason for Roast Chicken').fill('Temporary service restriction');
  await chicken.getByRole('button', { name: 'Apply', exact: true }).click();
  await expect(chicken).toContainText('Blocked by override');
  await page.getByRole('button', { name: 'Refresh data', exact: true }).click();
  await expect(chicken).toContainText('Allowed');
  await expect(chicken).not.toContainText('Temporary service restriction');
});

test('W&P cannot turn missing cost into a pass through an override', async ({ page }) => {
  await setup(page);
  await page.getByRole('button', { name: 'Weigh & Pay', exact: true }).click();
  await page.getByRole('button', { name: 'Test Kitchen', exact: true }).click();
  await page.getByRole('button', { name: 'Edit guidance', exact: true }).click();
  const missing = page.getByTestId('wp-item-row').filter({ hasText: 'Uncosted Vegetables' });
  await missing.getByLabel('Decision for Uncosted Vegetables').selectOption('allow');
  await missing.getByLabel('Reason for Uncosted Vegetables').fill('Test approval');
  await missing.getByRole('button', { name: 'Apply', exact: true }).click();
  await expect(missing).toContainText('Valid cost and weight are required');
  await expect(missing).toContainText('Needs cost');
});

test('W&P shows read failure and can recover through Refresh', async ({ page }) => {
  await setup(page);
  await page.route('**/api/recipe-library?scope=all', route => route.fulfill({ status: 503, json: { ok: false, message: 'Shared source unavailable' } }));
  await page.getByRole('button', { name: 'Weigh & Pay', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Shared source unavailable');
  await expect(page.getByRole('button', { name: 'Export all menus', exact: true })).toBeDisabled();
  await page.unroute('**/api/recipe-library?scope=all');
  await page.getByRole('button', { name: 'Refresh data', exact: true }).click();
  await expect(page.getByTestId('wp-menu-row')).toHaveCount(2);
});

test('W&P exports all menus with safely escaped reference content and printable cards', async ({ page }) => {
  await setup(page);
  const unsafe = { ...row(10, '<script>window.BAD=true</script>'), menu: 'Test & <Kitchen>', category: '<Sides>' };
  await page.route('**/api/recipe-library?scope=all', route => route.fulfill({ json: { ok: true, rows: [unsafe], source: 'supabase-recipe-items' } }));
  await page.getByRole('button', { name: 'Weigh & Pay', exact: true }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export all menus', exact: true }).click();
  const zip = await JSZip.loadAsync(await readFile(await (await download).path()));
  const html = await zip.file('guidance-report.html').async('string');
  expect(html).toContain('&lt;script&gt;');
  expect(html).not.toContain('<script>');
  await page.setContent(await zip.file('flash-cards.html').async('string'));
  await expect(page.getByRole('heading', { name: unsafe.item, exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Print / Save as PDF', exact: true })).toBeVisible();
  expect(await page.evaluate(() => window.BAD)).toBeUndefined();
});

test('W&P overview and oz/lb scenario price update guidance and exported report together', async ({page})=>{
 await setup(page);
 await page.getByRole('button',{name:'Weigh & Pay',exact:true}).click();
 await expect(page.getByLabel('W&P overview')).toContainText('W&P qualified menus');
 await page.getByLabel('W&P price unit').selectOption('oz');
 await page.getByLabel('W&P selling price').fill('1');
 await page.getByRole('button',{name:'Test Kitchen',exact:true}).click();
 const download=page.waitForEvent('download');
 await page.getByRole('button',{name:'Export menu package',exact:true}).click();
 const zip=await JSZip.loadAsync(await readFile(await(await download).path()));
 const snapshot=JSON.parse(await zip.file('calculation-snapshot.json').async('string'));
 expect(snapshot.pricePerLb).toBe(16);
 expect(await zip.file('guidance-report.html').async('string')).toContain('$16.000/lb');
 await page.screenshot({path:'../../.scratch/wp-prototype-overview.png',fullPage:true});
 await page.getByLabel('W&P selling price').fill('0');
 await expect(page.getByRole('button',{name:'Export menu package',exact:true})).toBeDisabled();
 await expect(page.getByTestId('wp-item-row').first()).toContainText('Needs price');
});

test('Andes analysis opens without sign-in and exposes costs and charts without recipe content',async({page})=>{
 await setup(page);
 await page.getByRole('button',{name:'Weigh & Pay',exact:true}).click();
 await expect(page.getByRole('img',{name:'Menu qualification chart'})).toBeVisible();
 await expect(page.getByLabel('Private recipe email')).toHaveCount(0);
 const analysis=page.getByRole('region',{name:'Andes component analysis'});
 await expect(analysis).toBeVisible();
 await expect(analysis.getByRole('img',{name:'Andes economics chart'})).toBeVisible();
 const tofu=analysis.getByTestId('andes-recipe').filter({has:page.getByRole('heading',{name:'AMZ: Peruvian Stewed Tofu in Creamy Aji Pepper Sauce',exact:true})});
 await expect(tofu).toContainText('$1.5200');
 await tofu.getByText('Component cost breakdown',{exact:true}).first().click();
 await expect(tofu).toContainText('$0.2050');
 await expect(tofu).toContainText('$1.3150');
 await expect(tofu).toContainText('Needs weight');
 await expect(tofu.getByLabel('Serving pan').first()).toHaveText('');
 await expect(analysis.locator('a')).toHaveCount(0);
 await expect(analysis).not.toContainText('HACCP');
 await page.getByLabel('W&P selling price').fill('20');
 await expect(tofu).toContainText('15.2%');
 await page.screenshot({path:'../../.scratch/ANDES_ANALYSIS_DESKTOP.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:'../../.scratch/ANDES_ANALYSIS_MOBILE.png',fullPage:true});
});
