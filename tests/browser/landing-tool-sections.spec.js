import { expect, test } from "@playwright/test";
import { collectUnexpectedPageErrors, expectNoAppProtection, expectNoUnexpectedPageErrors } from "./smoke-helpers.js";

test("home screen groups tools under Chef Tools and Programming & Auditing in the requested order", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");

  const sections = page.getByTestId("landing-tool-section");
  await expect(sections).toHaveCount(2);

  await expect(sections.nth(0).getByRole("heading", { name: "Chef Tools" })).toBeVisible();
  await expect(sections.nth(1).getByRole("heading", { name: "Programming & Auditing" })).toBeVisible();
  await expect(sections.nth(0).getByRole("button", { name: "Open Transfer", exact: true })).toBeVisible();
  await expect(sections.nth(0).getByRole("button", { name: "Open Commissary Ordering", exact: true })).toBeVisible();
  await expect(sections.nth(0).getByRole("button", { name: "Open Cross Utilization", exact: true })).toBeVisible();
  await expect(sections.nth(0).getByRole("button", { name: /Open .* Tool/ })).toHaveCount(0);

  const toolSections = await sections.evaluateAll((nodes) => nodes.map((section) => ({
    heading: section.querySelector("h2")?.textContent?.trim(),
    tools: Array.from(section.querySelectorAll("[data-tool-title]")).map((node) => node.getAttribute("data-tool-title")),
  })));

  expect(toolSections).toEqual([
    {
      heading: "Chef Tools",
      tools: [
        "Neighborhood Rotations",
        "Transfer",
        "Commissary Ordering",
        "Menu Library",
        "Menu Engineering",
        "Menu Cross Utilization",
        "Webtrition",
      ],
    },
    {
      heading: "Programming & Auditing",
      tools: ["SSMT", "Menu Projects", "Menu Audit Tool", "Lean Tool", "Cafe Tasting Form"],
    },
  ]);

  const transferTile = page.locator('article[data-tool-title="Transfer"]');
  await expect(transferTile).toContainText("current Item + Waste Cost");
  await expect(transferTile).not.toContainText("G/L");

  const platformIntelligence = page.getByTestId("platform-intelligence");
  const operationsConsole = page.getByTestId("operations-console");
  await expect(platformIntelligence).not.toHaveAttribute("open", "");
  await expect(operationsConsole).not.toHaveAttribute("open", "");

  const lastToolBottom = await sections.nth(1).boundingBox().then((box) => box.y + box.height);
  const intelligenceTop = await platformIntelligence.boundingBox().then((box) => box.y);
  const operationsTop = await operationsConsole.boundingBox().then((box) => box.y);
  expect(intelligenceTop).toBeGreaterThan(lastToolBottom);
  expect(operationsTop).toBeGreaterThan(intelligenceTop);

  const semanticOrder = await page.evaluate(() => {
    const tools = document.querySelectorAll("[data-tool-title]");
    const lastTool = tools.item(tools.length - 1);
    const intelligence = document.querySelector('[data-testid="platform-intelligence"]');
    const operations = document.querySelector('[data-testid="operations-console"]');
    return {
      toolsBeforeIntelligence: Boolean(lastTool?.compareDocumentPosition(intelligence) & Node.DOCUMENT_POSITION_FOLLOWING),
      intelligenceBeforeOperations: Boolean(intelligence?.compareDocumentPosition(operations) & Node.DOCUMENT_POSITION_FOLLOWING),
    };
  });
  expect(semanticOrder).toEqual({ toolsBeforeIntelligence: true, intelligenceBeforeOperations: true });

  await platformIntelligence.locator("summary").click();
  await expect(platformIntelligence).toHaveAttribute("open", "");
  await expect(platformIntelligence.getByRole("heading", { name: "Diet Mix" })).toBeVisible();

  await operationsConsole.locator("summary").click();
  await expect(operationsConsole).toHaveAttribute("open", "");
  await expect(operationsConsole.getByText("MenuWorks dataset")).toBeVisible();

  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("home shows the shared promotion calendar without opening password-protected SSMT menus", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  const now = new Date();
  const dateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const workspaceMenus = [{ id: "landing-promo", name: "Landing Page Promo", type: "Promotion", activeStart: dateKey, activeEnd: dateKey, items: [] }];
  await page.route("**/api/storage/records**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.method() === "GET" && url.searchParams.get("tool") === "SSMT") {
      await route.fulfill({ json: { ok: true, source: "supabase", records: [{ "Record ID": "ssmt|workspace|current", menus: workspaceMenus }] } });
      return;
    }
    await route.continue();
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");

  const calendar = page.getByTestId("landing-promotion-calendar");
  const programming = page.getByTestId("landing-tool-section").nth(1);
  const intelligence = page.getByTestId("platform-intelligence");
  await expect(calendar).toBeVisible();
  await expect(calendar.getByText("Landing Page Promo", { exact: true })).toBeVisible();
  const positions = await page.evaluate(() => {
    const programmingSection = document.querySelectorAll('[data-testid="landing-tool-section"]')[1];
    const calendarSection = document.querySelector('[data-testid="landing-promotion-calendar"]');
    const intelligenceSection = document.querySelector('[data-testid="platform-intelligence"]');
    return {
      programmingBeforeCalendar: Boolean(programmingSection?.compareDocumentPosition(calendarSection) & Node.DOCUMENT_POSITION_FOLLOWING),
      calendarBeforeIntelligence: Boolean(calendarSection?.compareDocumentPosition(intelligenceSection) & Node.DOCUMENT_POSITION_FOLLOWING),
    };
  });
  expect(positions).toEqual({ programmingBeforeCalendar: true, calendarBeforeIntelligence: true });
  await expect(calendar.getByRole("button", { name: "Landing Page Promo" })).toHaveCount(0);
  await calendar.getByText("Landing Page Promo", { exact: true }).click();
  await expect(page.getByText(/passcode required/i)).toHaveCount(0);
  await expect(programming).toBeVisible();
  await expect(intelligence).toBeVisible();
  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});
test("mobile home uses a contained two-column compact grid with closed bottom accordions", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/");

  const cards = page.locator(".mobile-tool-card");
  await expect(cards).toHaveCount(12);
  const first = await cards.nth(0).boundingBox();
  const second = await cards.nth(1).boundingBox();
  expect(Math.abs(first.y - second.y)).toBeLessThan(2);
  expect(second.x).toBeGreaterThan(first.x + first.width - 2);

  const geometry = await cards.evaluateAll((nodes) => nodes.map((node) => {
    const card = node.getBoundingClientRect();
    const title = node.querySelector("h2")?.getBoundingClientRect();
    return {
      cardLeft: card.left,
      cardRight: card.right,
      titleLeft: title?.left,
      titleRight: title?.right,
    };
  }));
  for (const box of geometry) {
    expect(box.cardLeft).toBeGreaterThanOrEqual(0);
    expect(box.cardRight).toBeLessThanOrEqual(320);
    expect(box.titleLeft).toBeGreaterThanOrEqual(box.cardLeft);
    expect(box.titleRight).toBeLessThanOrEqual(box.cardRight);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);

  const mobileIntelligence = page.getByTestId("mobile-platform-intelligence");
  const mobileOperations = page.getByTestId("mobile-operations-console");
  await expect(mobileIntelligence).not.toHaveAttribute("open", "");
  await expect(mobileOperations).not.toHaveAttribute("open", "");
  const lastCardBottom = await cards.last().boundingBox().then((box) => box.y + box.height);
  const intelligenceTop = await mobileIntelligence.boundingBox().then((box) => box.y);
  const operationsTop = await mobileOperations.boundingBox().then((box) => box.y);
  expect(intelligenceTop).toBeGreaterThan(lastCardBottom);
  expect(operationsTop).toBeGreaterThan(intelligenceTop);

  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});
