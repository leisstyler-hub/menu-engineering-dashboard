import { expect } from "@playwright/test";

export function collectUnexpectedPageErrors(page) {
  const pageErrors = [];
  page.on("pageerror", (error) => {
    if (!/Unexpected token '<'/i.test(error.message)) {
      pageErrors.push(error.message);
    }
  });
  return pageErrors;
}

export async function expectNoAppProtection(page) {
  await expect(page.getByText(/Something broke in this view/i)).toHaveCount(0);
}

export function expectNoUnexpectedPageErrors(pageErrors) {
  expect(pageErrors).toEqual([]);
}

export async function openTool(page, buttonName, headingName) {
  await page.goto("/");
  await expect(page.getByRole("button", { name: buttonName })).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: buttonName }).click();
  await expect(page.getByRole("heading", { name: headingName })).toBeVisible({ timeout: 20_000 });
  await expectNoAppProtection(page);
}
