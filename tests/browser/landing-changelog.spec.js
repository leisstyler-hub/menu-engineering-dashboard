import { expect, test } from "@playwright/test";
import { collectUnexpectedPageErrors, expectNoAppProtection, expectNoUnexpectedPageErrors } from "./smoke-helpers.js";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/**", route => route.request().method() === "GET" ? route.continue() : route.fulfill({ json: { ok: true } }));
});

test("home changelog shows compact release summaries that stay inside the card", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);

  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto("/");

  const platformIntelligence = page.getByTestId("platform-intelligence");
  await expect(platformIntelligence).not.toHaveAttribute("open", "");
  await platformIntelligence.locator("summary").click();

  const changelogPanel = page
    .getByRole("heading", { name: "Latest Changelog" })
    .locator("xpath=ancestor::section[1]");
  await expect(changelogPanel).toBeVisible();
  await expect(page.getByText(/The score formula, shopping-list source data/)).toHaveCount(0);
  await expect(page.getByText(/public production bundle contains version/)).toHaveCount(0);

  const firstSummary = changelogPanel.getByTestId("landing-changelog-summary").first();
  await expect(firstSummary).toContainText(/\[\w+ \d+, \d+:\d+ [AP]M\]/);
  const summaryText = (await firstSummary.innerText()).trim();
  expect(summaryText.length).toBeLessThanOrEqual(150);

  const recentPanel = page.getByRole("heading", { name: "Recently Added Items" }).locator("xpath=ancestor::section[1]");
  const panelBox = await changelogPanel.boundingBox();
  const recentBox = await recentPanel.boundingBox();
  expect(Math.abs(panelBox.y + panelBox.height - recentBox.y - recentBox.height)).toBeLessThanOrEqual(2);
  const listBox = await changelogPanel.getByTestId("landing-changelog-panel").boundingBox();
  expect(panelBox.y + panelBox.height - listBox.y - listBox.height).toBeLessThan(30);
  await page.screenshot({ path: "test-results/landing-gap-desktop.png", fullPage: true });
  await changelogPanel.locator("..").screenshot({ path: "test-results/landing-gap-row.png" });

  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("landing changelog remains bounded on tablet and mobile", async ({ page }) => {
  for (const width of [1024, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    if (width >= 768) await page.getByTestId("platform-intelligence").locator("summary").click();
    else {
      await page.getByTestId("mobile-platform-intelligence").locator("summary").click();
      await expect(page.getByRole("heading", { name: "Changelog", exact: true })).toBeVisible();
    }
    const list = page.getByTestId("landing-changelog-panel");
    if (await list.isVisible()) {
      expect((await list.boundingBox()).height).toBeLessThanOrEqual(460);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.screenshot({ path: `test-results/landing-gap-${width}.png`, fullPage: true });
  }
});
