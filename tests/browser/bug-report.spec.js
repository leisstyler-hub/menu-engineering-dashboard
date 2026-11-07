import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("culinaryToolsBrandEntranceSeen", "true"));
  await page.route("**/api/**", route => route.fulfill({ json: {} }));
});

for (const width of [390, 1440]) {
  test(`bug report opens at top right and prepares email at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const trigger = page.getByRole("button", { name: "Report a bug", exact: true });
    await expect(trigger).toBeVisible();
    await expect(trigger).toHaveCSS("color", "rgb(22, 163, 74)");
    const box = await trigger.boundingBox();
    expect(box.y).toBeLessThan(20);
    expect(box.x + box.width).toBeGreaterThan(width - 30);
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: "Report a bug" });
    await expect(dialog).toBeVisible();
    const email = dialog.getByRole("link", { name: "Open email to send" });
    await expect(email).toHaveCount(0);
    await dialog.getByLabel("Describe the bug").fill("Title cuts off & overlaps #1\nExpected: full title.");
    const href = await dialog.getByRole("link", { name: "Open email to send" }).getAttribute("href");
    expect(href).toMatch(/^mailto:tyler.leiss@compass-usa.com\?/);
    const params = new URLSearchParams(href.split("?")[1]);
    expect(params.get("body")).toContain("Title cuts off & overlaps #1\nExpected: full title.");
    expect(params.get("body")).toContain("Tool: Home");
    expect(params.get("body")).toContain("Version: 2026.");
    await expect(dialog).toContainText("Attach screenshots in your email app");
    await expect(dialog).toContainText("This form does not send email automatically");
    await page.screenshot({ path: `test-results/bug-report-${width}.png` });
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();
    await trigger.click();
    await expect(dialog.getByLabel("Describe the bug")).toHaveValue(/Title cuts off/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  });
}

test("report uses the active tool and excludes auth URL values", async ({ page }) => {
  await page.goto("/?tool=cafeTasting&token=PRIVATE#secret");
  await page.getByRole("button", { name: "Report a bug", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Report a bug" });
  await dialog.getByLabel("Describe the bug").fill("Photo did not load");
  const href = await dialog.getByRole("link", { name: "Open email to send" }).getAttribute("href");
  const body = new URLSearchParams(href.split("?")[1]).get("body");
  expect(body).toContain("Tool: Cafe Tasting");
  expect(body).not.toContain("PRIVATE");
  expect(body).not.toContain("secret");
});

test("empty reports stay disabled and clipboard failure offers a selectable preview", async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, "clipboard", { value: { writeText: async () => { throw new Error("Denied"); } } }));
  await page.goto("/");
  await page.getByRole("button", { name: "Report a bug", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Report a bug" });
  await dialog.getByLabel("Describe the bug").fill("   ");
  await expect(dialog.getByRole("button", { name: "Copy report" })).toBeDisabled();
  await expect(dialog.getByRole("link", { name: "Open email to send" })).toHaveCount(0);
  await dialog.getByLabel("Describe the bug").fill("Cannot save the menu");
  await dialog.getByRole("button", { name: "Copy report" }).click();
  await expect(dialog.getByRole("status")).toContainText("Copy unavailable");
  await dialog.locator("summary").click();
  await expect(dialog.getByLabel("Report preview")).toHaveValue(/Cannot save the menu/);
});

test("copy report contains the recipient and complete report", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");
  await page.getByRole("button", { name: "Report a bug", exact: true }).click();
  await page.getByLabel("Describe the bug").fill("Copy this report");
  await page.getByRole("button", { name: "Copy report", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Report copied");
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain("To: tyler.leiss@compass-usa.com");
  expect(copied).toContain("Copy this report");
});
