import { expect, test } from "@playwright/test";
import { collectUnexpectedPageErrors, expectNoAppProtection, expectNoUnexpectedPageErrors, openTool } from "./smoke-helpers.js";

async function stubMenuProjectBackbone(page) {
  await page.route("**/api/storage/records**", async (route) => {
    const request = route.request();
    if (request.method() === "GET") {
      await route.fulfill({ json: { records: [], source: "browser-smoke" } });
      return;
    }
    await route.fulfill({ json: { ok: true, source: "browser-smoke", message: "Browser smoke storage stub" } });
  });

  await page.route("**/api/smartsheet/records**", async (route) => {
    await route.fulfill({ json: { ok: true, records: [], source: "browser-smoke" } });
  });
}

test("Menu Projects can create and trash a project without app protection", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  await stubMenuProjectBackbone(page);
  await page.addInitScript(() => {
    window.localStorage.removeItem("culinaryToolsMenuProjects.v2");
    window.localStorage.removeItem("culinaryToolsMenuProjects.deleted.v1");
  });

  await openTool(page, /open projects/i, /^Menu Projects$/);

  await expect(page.getByText("Menu Projects Database", { exact: true })).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: /New Menu Project/i }).click();
  await expect(page.getByRole("heading", { name: /Create menu project/i })).toBeVisible();

  const menuName = `Browser Smoke Menu ${Date.now()}`;
  await page.getByPlaceholder("Menu name").fill(menuName);
  await page.getByLabel(/Menu Launch Date/i).fill("2026-08-14");
  await page.getByRole("button", { name: /^Create Project/i }).click();

  await expect(page.getByRole("heading", { name: menuName })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(menuName).first()).toBeVisible();

  await page.getByRole("button", { name: /Trash Project/i }).first().click();
  await expect(page.getByText(/Confirm Trash/i)).toBeVisible();
  await page.getByRole("button", { name: /^Trash Project$/ }).last().click();

  await expect(page.getByRole("heading", { name: menuName })).toHaveCount(0);
  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("Menu Projects new-project text fields keep focus while typing", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  await stubMenuProjectBackbone(page);
  await page.addInitScript(() => {
    window.localStorage.removeItem("culinaryToolsMenuProjects.v2");
    window.localStorage.removeItem("culinaryToolsMenuProjects.deleted.v1");
  });

  await openTool(page, /open projects/i, /^Menu Projects$/);
  await page.getByRole("button", { name: /New Menu Project/i }).click();
  await expect(page.getByRole("heading", { name: /Create menu project/i })).toBeVisible();

  const menuName = page.getByPlaceholder("Menu name");
  await menuName.pressSequentially("Focus Test Menu");
  await expect(menuName).toHaveValue("Focus Test Menu");
  await expect(menuName).toBeFocused();

  const ownerName = page.locator('input[placeholder="Name"]').first();
  await ownerName.click();
  await ownerName.pressSequentially("Owner Test");
  await expect(ownerName).toHaveValue("Owner Test");
  await expect(ownerName).toBeFocused();

  const ownerEmail = page.locator('input[placeholder="Email"]').first();
  await ownerEmail.click();
  await ownerEmail.pressSequentially("owner.test@compass-usa.com");
  await expect(ownerEmail).toHaveValue("owner.test@compass-usa.com");
  await expect(ownerEmail).toBeFocused();

  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});
