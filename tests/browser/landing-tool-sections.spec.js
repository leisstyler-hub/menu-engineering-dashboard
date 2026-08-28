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

  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});
