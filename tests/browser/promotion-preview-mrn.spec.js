import { test, expect } from '@playwright/test';

for (const width of [1440, 390]) {
  test(`promotion popup shows exact item MRNs at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.clock.setFixedTime(new Date(2026, 10, 25, 12));
    let writes = 0;
    await page.route('**/api/storage/records**', async route => {
      if (route.request().method() !== 'GET') writes++;
      await route.fulfill({ json: { ok: true, records: [] } });
    });
    await page.route('**/api/ssmt**', async route => {
      if (route.request().method() !== 'GET') writes++;
      const action = new URL(route.request().url()).searchParams.get('action');
      await route.fulfill({ json: action === 'status' ? { ok: true, enabled: true } : {
        ok: true, menus: [{ id: 'fixture', name: 'MRN preview fixture', type: 'Promotion', activeStart: '2026-11-25', activeEnd: '2026-11-25', items: [
          { label: 'Trout', description: 'Grilled trout', mrn: '00083821.10' },
          { label: 'Salad', description: 'Fresh greens', mrn: '' }
        ] }]
      } });
    });
    await page.goto('/');
    const calendar = page.getByTestId(width === 1440 ? 'landing-promotion-calendar' : 'mobile-landing-promotion-calendar');
    await calendar.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    await calendar.getByRole('button', { name: 'MRN preview fixture', exact: true }).click();
    const popup = page.getByRole('dialog', { name: 'MRN preview fixture preview' });
    await expect(popup).toBeVisible();
    const trout = popup.getByRole('listitem').filter({ hasText: 'Trout' });
    await expect(trout).toContainText('Grilled trout');
    await expect(trout).toContainText('MRN: 00083821.10');
    await expect(popup.getByRole('listitem').filter({ hasText: 'Salad' })).toContainText('MRN: Not supplied');
    const box = await popup.boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(width);
    expect(writes).toBe(0);
  });
}
