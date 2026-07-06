import { expect, test } from "@playwright/test";

test("browser smoke traffic requests are marked so production analytics can ignore them", async ({ page }) => {
  const trafficPosts = [];

  await page.route("**/api/traffic/weekly", async (route) => {
    const request = route.request();
    if (request.method() === "POST") {
      trafficPosts.push(request.headers());
    }
    await route.fulfill({
      json: {
        ok: true,
        status: "live",
        source: "browser-smoke",
        days: [
          { day: "Mon", date: "2026-07-06", visitors: 0 },
          { day: "Tue", date: "2026-07-07", visitors: 0 },
          { day: "Wed", date: "2026-07-08", visitors: 0 },
          { day: "Thu", date: "2026-07-09", visitors: 0 },
          { day: "Fri", date: "2026-07-10", visitors: 0 },
          { day: "Sat", date: "2026-07-11", visitors: 0 },
          { day: "Sun", date: "2026-07-12", visitors: 0 },
        ],
        totalVisitors: 0,
      },
    });
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Culinary Tools Platform/i })).toBeVisible();
  await expect.poll(() => trafficPosts.length).toBeGreaterThan(0);
  expect(trafficPosts[0]["x-culinary-smoke-test"]).toBe("true");
});
