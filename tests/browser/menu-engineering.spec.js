import { test, expect } from '@playwright/test';
import JSZip from 'jszip';
import { readFile } from 'node:fs/promises';
import { openTool, collectUnexpectedPageErrors } from './smoke-helpers.js';

const row = (id, item, extra = {}) => ({ id, item, menu: 'Test Kitchen', category: 'Entree', mrn: `000${id}.123456789`, price: 8, trueCost: 1, portionOz: 8, ...extra });
const rows = [row(1, 'Roast Chicken'), row(2, 'Lentil Rice', { category: 'Side' }), row(3, 'Cauliflower Steak', { category: 'Side' }), row(4, 'Roast Salmon'), row(5, 'Uncosted Vegetables', { trueCost: null }), row(1, 'Roast Chicken'), row(7,'Andes sample',{menu:'AMZ: Andes'}), row(6, 'Unknown Portion', { menu: 'Incomplete Kitchen', portionOz: null, portion: '1 piece' })];

async function setup(page, source = 'supabase-recipe-items') {
  const writes = [];
  await page.route('**/api/**', route => {
    const request = route.request();
    if (request.method() !== 'GET' && !request.url().includes('/api/traffic/')) writes.push(request.url());
    if (request.url().includes('/api/recipe-library')) return route.fulfill({ json: { ok: true, rows, source } });
    return route.fulfill({ json: { ok: true, records: [], rows: [], days: [] } });
  });
  await openTool(page, /open menu analysis/i, /Menu Engineering/);
  return writes;
}

test('W&P evaluates all menus with the 60% gate, missing inputs and stored categories', async ({ page }) => {
  const errors = collectUnexpectedPageErrors(page);
  const writes = await setup(page);
  await page.getByRole('button', { name: 'W&P Guidance', exact: true }).click();
  await expect(page.getByRole('group',{name:'Menu selection'}).locator('label').filter({hasText:'Test Kitchen'})).toContainText('60.0%');
  await chooseMenu(page,'Test Kitchen');
  await expect(page.getByText('Test Kitchen - 3/5 allowed components - 60.0% - Pass',{exact:true})).toBeVisible();
  await page.getByText('Servable component guidance and session adjustments',{exact:true}).click();
  await page.getByRole('button',{name:'Show only approved components',exact:true}).click();
  await page.getByRole('button',{name:'Clear filter',exact:true}).click();
  await expect(page.getByRole('heading', { name: 'Starches / grains', exact: true })).toBeVisible();
  await expect(page.getByTestId('wp-item-row').filter({ hasText: 'Roast Salmon' })).toContainText('Seafood');
  await expect(page.getByTestId('wp-item-row').filter({ hasText: 'Uncosted Vegetables' })).toContainText('Needs cost');
  await chooseMenu(page,'Incomplete Kitchen');
  await page.getByText('Servable component guidance and session adjustments',{exact:true}).click();
  await expect(page.getByText('Classification review (1)',{exact:true})).toBeVisible();
  expect(writes).toEqual([]);
  expect(errors).toEqual([]);
});

test('W&P controls require Edit and a reason; export captures exceptions without writing data', async ({ page }) => {
  const writes = await setup(page);
  await page.getByRole('button', { name: 'W&P Guidance', exact: true }).click();
  await chooseMenu(page,'Test Kitchen');
  await page.getByText('Servable component guidance and session adjustments',{exact:true}).click();
  await expect(page.getByLabel('Decision for Roast Salmon')).toHaveCount(0);
  await page.getByRole('button', { name: 'Edit guidance', exact: true }).click();
  const salmon = page.getByTestId('wp-item-row').filter({ hasText: 'Roast Salmon' });
  await salmon.getByLabel('Decision for Roast Salmon').selectOption('allow');
  await salmon.getByRole('button', { name: 'Apply', exact: true }).click();
  await expect(salmon).toContainText('Enter a reason');
  await salmon.getByLabel('Reason for Roast Salmon').fill('Approved limited assortment');
  await salmon.getByRole('button', { name: 'Apply', exact: true }).click();
  await expect(salmon).toContainText('Allowed by override');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export menu package', exact: true }).click();
  const zip = await JSZip.loadAsync(await readFile(await (await download).path()));
  expect(Object.keys(zip.files)).toEqual(expect.arrayContaining(['data-audit.xlsx', 'data-audit.html', 'flash-cards.html']));
  expect(Object.keys(zip.files)).not.toEqual(expect.arrayContaining(['calculation-snapshot.json','README.txt']));
  expect(await zip.file('flash-cards.html').async('string')).toContain('Approved limited assortment');
  expect(writes).toEqual([]);
});

test('Menu Engineering retains Menu and Portfolio views with compact desktop and mobile controls', async ({ page }) => {
  await setup(page);
  await page.getByRole('button', { name: 'Menu Performance', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Menu View', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Portfolio Menu View', exact: true }).click();
  await expect(page.getByText('Test Kitchen', { exact: true }).last()).toBeVisible();
  await page.getByRole('button', { name: 'Menu View', exact: true }).click();
  await expect(page.getByText('Menu engineering controls', { exact: false })).toBeVisible();
  const header = await page.getByTestId('engineering-header').boundingBox();
  expect(header.height).toBeLessThan(260);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Back to Menu Engineering choices' }).click();
  await page.getByRole('button', { name: 'W&P Guidance', exact: true }).click();
  await expect(page.getByRole('group',{name:'Menu selection'})).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('W&P labels fallback data as reference rather than shared approval', async ({ page }) => {
  await setup(page, 'server-menuworks-json');
  await page.getByRole('button', { name: 'W&P Guidance', exact: true }).click();
  await expect(page.getByText(/Fallback data.*reference only/i)).toBeVisible();
  await expect(page.getByRole('region',{name:'W&P qualifying portfolio'})).toContainText('Load current shared data');
});

test('W&P refreshes server data despite a browser override and clears session exceptions', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('culinaryToolsMenuEngineeringItems_v3', JSON.stringify([{ menu: 'Stale browser', item: 'Stale' }])));
  await setup(page);
  await page.getByRole('button', { name: 'W&P Guidance', exact: true }).click();
  await expect(page.getByRole('group',{name:'Menu selection'})).toContainText('Test Kitchen');
  await chooseMenu(page,'Test Kitchen');
  await page.getByText('Servable component guidance and session adjustments',{exact:true}).click();
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
  await page.getByRole('button', { name: 'W&P Guidance', exact: true }).click();
  await chooseMenu(page,'Test Kitchen');
  await page.getByText('Servable component guidance and session adjustments',{exact:true}).click();
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
  await page.getByRole('button', { name: 'W&P Guidance', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Shared source unavailable');
  await expect(page.getByRole('button', { name: 'Export all menus', exact: true })).toBeDisabled();
  await page.unroute('**/api/recipe-library?scope=all');
  await page.getByRole('button', { name: 'Refresh data', exact: true }).click();
  await expect(page.getByRole('group',{name:'Menu selection'}).getByRole('checkbox')).toHaveCount(3);
});

test('W&P exports all menus with safely escaped reference content and printable cards', async ({ page }) => {
  await setup(page);
  const unsafe = { ...row(10, '<script>window.BAD=true</script>'), menu: 'Test & <Kitchen>', category: '<Sides>' };
  await page.route('**/api/recipe-library?scope=all', route => route.fulfill({ json: { ok: true, rows: [unsafe], source: 'supabase-recipe-items' } }));
  await page.getByRole('button', { name: 'W&P Guidance', exact: true }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export all menus', exact: true }).click();
  const zip = await JSZip.loadAsync(await readFile(await (await download).path()));
  const html = await zip.file('data-audit.html').async('string');
  expect(html).toContain('&lt;script&gt;');
  expect(html).not.toContain('<script>');
  await page.setContent(await zip.file('flash-cards.html').async('string'));
  await expect(page.getByRole('listitem').filter({hasText:unsafe.item})).toBeVisible();
  await expect(page.getByRole('button', { name: 'Print / Save as PDF', exact: true })).toBeVisible();
  expect(await page.evaluate(() => window.BAD)).toBeUndefined();
});

test('W&P overview and oz/lb scenario price update guidance and exported report together', async ({page})=>{
 await setup(page);
 await page.getByRole('button',{name:'W&P Guidance',exact:true}).click();
 await expect(page.getByRole('region',{name:'W&P qualifying portfolio'})).toContainText('Within 40%');
 await page.getByLabel('W&P price unit').selectOption('oz');
 await page.getByLabel('W&P selling price').fill('1');
 await chooseMenu(page,'Test Kitchen');
 await page.getByText('Servable component guidance and session adjustments',{exact:true}).click();
 const download=page.waitForEvent('download');
 await page.getByRole('button',{name:'Export menu package',exact:true}).click();
 const zip=await JSZip.loadAsync(await readFile(await(await download).path()));
 expect(await zip.file('data-audit.html').async('string')).toContain('$16.00/lb');
 await page.screenshot({path:'../../.scratch/wp-prototype-overview.png',fullPage:true});
 await page.getByLabel('W&P selling price').fill('0');
 await expect(page.getByRole('button',{name:'Export menu package',exact:true})).toBeDisabled();
 await expect(page.getByTestId('wp-item-row').first()).toContainText('Needs price');
});

for (const width of [390, 1440]) {
  test(`Menu Engineering path choices and returns at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const writes = await setup(page);
    const guidance = page.getByRole('button', { name: 'W&P Guidance', exact: true });
    const matrix = page.getByRole('button', { name: 'Menu Performance', exact: true });
    await expect(guidance).toBeVisible();
    await expect(matrix).toBeVisible();
    await expect(page.getByLabel('Search all engineering items')).toHaveCount(0);
    const a = await guidance.boundingBox(), b = await matrix.boundingBox();
    expect(a.width).toBeGreaterThan(200);
    expect(width < 768 ? b.y > a.y + a.height : Math.abs(b.y - a.y) < 2).toBeTruthy();
    await guidance.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('group',{name:'Menu selection'})).toBeVisible();
    await page.getByRole('button', { name: 'Back to Menu Engineering choices' }).click();
    await matrix.click();
    await expect(page.getByRole('button', { name: 'Menu View', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: 'Portfolio Menu View', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Portfolio Menu View', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: 'Back to Menu Engineering choices' }).click();
    await expect(guidance).toBeVisible();
    await expect(matrix).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
    await page.screenshot({ path: `test-results/engineering-choices-${width}.png`, fullPage: true });
    expect(writes).toEqual([]);
  });
}

async function chooseMenu(page,name) {
 const picker=page.getByRole('group',{name:'Menu selection'});

 await picker.getByRole('button',{name:'Clear filters'}).click();
 await picker.locator('label').filter({has:page.getByRole('checkbox')}).filter({hasText:name}).getByRole('checkbox').check();
}
