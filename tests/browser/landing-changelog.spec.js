import { expect, test } from "@playwright/test";
import { collectUnexpectedPageErrors, expectNoAppProtection, expectNoUnexpectedPageErrors } from "./smoke-helpers.js";

test("home changelog shows compact release summaries that stay inside the card", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);

  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto("/");

  const changelogPanel = page
    .getByRole("heading", { name: "Latest Changelog" })
    .locator("xpath=ancestor::section[1]");
  await expect(changelogPanel).toBeVisible();
  await expect(page.getByText(/The score formula, shopping-list source data/)).toHaveCount(0);
  await expect(page.getByText(/public production bundle contains version/)).toHaveCount(0);

  const firstSummary = changelogPanel.getByTestId("landing-changelog-summary").first();
  await expect(firstSummary).toContainText(/Menu Cross Utilization|Changelog/i);
  const summaryText = (await firstSummary.innerText()).trim();
  expect(summaryText.length).toBeLessThanOrEqual(150);

  const panelBox = await changelogPanel.boundingBox();
  expect(panelBox?.height).toBeLessThanOrEqual(680);

  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});
