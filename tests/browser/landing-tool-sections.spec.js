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

  const toolSections = await sections.evaluateAll((nodes) => nodes.map((section) => ({
    heading: section.querySelector("h2")?.textContent?.trim(),
    tools: Array.from(section.querySelectorAll("[data-tool-title]")).map((node) => node.getAttribute("data-tool-title")),
  })));

  expect(toolSections).toEqual([
    {
      heading: "Chef Tools",
      tools: [
        "Neighborhood Rotations",
        "Transfer Tool",
        "Menu Library",
        "Menu Engineering",
        "Menu Cross Utilization Tool",
        "Webtrition",
      ],
    },
    {
      heading: "Programming & Auditing",
      tools: ["SSMT", "Menu Projects", "Menu Audit Tool", "Lean Tool"],
    },
  ]);

  const transferTile = page.locator('article[data-tool-title="Transfer Tool"]');
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
    const lastTool = document.querySelectorAll("[data-tool-title]").item(9);
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

test("mobile home uses a contained two-column compact grid with closed bottom accordions", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/");

  const cards = page.locator(".mobile-tool-card");
  await expect(cards).toHaveCount(10);
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
