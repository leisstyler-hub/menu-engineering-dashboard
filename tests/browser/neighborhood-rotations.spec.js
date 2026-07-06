import { expect, test } from "@playwright/test";
import { collectUnexpectedPageErrors, expectNoAppProtection, expectNoUnexpectedPageErrors, openTool } from "./smoke-helpers.js";

test("Neighborhood Rotations opens planner and gives a visible blocked-submit reason", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);

  await openTool(page, /open rotations/i, /^Neighborhood Rotations$/);

  await page.getByRole("button", { name: /South/i }).click();
  await page.getByRole("button", { name: /^Doppler$/i }).click();

  await expect(page.getByRole("heading", { name: /^Doppler$/ })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(/Planner Remote Control/i)).toBeVisible();
  await expect(page.getByText(/Global Rotation/i)).toBeVisible();

  const submitButton = page.getByRole("button", { name: /Submit/i });
  await expect(submitButton).toBeVisible();
  await expect(submitButton).toHaveAttribute("aria-disabled", "true");
  await expect(submitButton).toHaveAttribute("title", /Global Menu|entree|station/i);
  await expect(page.getByText(/Submit blocked/i)).toBeVisible();

  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});
