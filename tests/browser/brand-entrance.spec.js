import { expect, test } from "@playwright/test";

async function observeEntrances(page) {
  await page.addInitScript(() => {
    window.__brandEntranceMounts = 0;
    new MutationObserver((records) => {
      for (const record of records) for (const node of record.addedNodes) {
        if (node.nodeType === 1) {
          if (node.matches('[data-testid="brand-entrance"]')) window.__brandEntranceMounts++;
          window.__brandEntranceMounts += node.querySelectorAll('[data-testid="brand-entrance"]').length;
        }
      }
    }).observe(document, { childList: true, subtree: true });
  });
}

for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }, { width: 320, height: 640 }]) {
  test(`branded entrance reveals usable home once per session at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await observeEntrances(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const entrance = page.getByTestId("brand-entrance");
    await expect(entrance).toBeVisible({ timeout: 1500 });
    await expect(entrance.locator("img")).toBeVisible();
    const box = await entrance.boundingBox();
    expect(Math.abs(box.width - viewport.width)).toBeLessThan(2);
    expect(Math.abs(box.height - viewport.height)).toBeLessThan(2);
    await expect(entrance).toHaveCount(0, { timeout: 2500 });
    const intelligence = page.getByTestId(viewport.width < 768 ? "mobile-platform-intelligence" : "platform-intelligence");
    await expect(intelligence).toBeVisible();
    await intelligence.locator("summary").click();
    await expect(intelligence).toHaveAttribute("open", "");
    expect(await page.evaluate(() => window.__brandEntranceMounts)).toBe(1);
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(intelligence).toBeVisible();
    expect(await page.evaluate(() => window.__brandEntranceMounts)).toBe(0);
  });
}

test("reduced motion bypasses entrance", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await observeEntrances(page);
  await page.goto("/");
  await expect(page.getByTestId("platform-intelligence")).toBeVisible();
  expect(await page.evaluate(() => window.__brandEntranceMounts)).toBe(0);
});

test("unavailable session storage bypasses entrance safely", async ({ page }) => {
  await observeEntrances(page);
  await page.addInitScript(() => {
    Object.defineProperty(window, "sessionStorage", { get() { throw new DOMException("Blocked", "SecurityError"); } });
  });
  await page.goto("/");
  await expect(page.getByTestId("platform-intelligence")).toBeVisible();
  expect(await page.evaluate(() => window.__brandEntranceMounts)).toBe(0);
});


test("returning from a tool never replays the entrance", async ({ page }) => {
  await observeEntrances(page);
  await page.goto("/");
  await expect(page.getByTestId("brand-entrance")).toHaveCount(0, { timeout: 2500 });
  await page.locator('article[data-tool-title="Menu Engineering"] button').click();
  const back = page.getByRole("button", { name: /Back to Culinary Tools Platform/i });
  await expect(back).toBeVisible();
  await back.click();
  await expect(page.getByTestId("platform-intelligence")).toBeVisible();
  expect(await page.evaluate(() => window.__brandEntranceMounts)).toBe(1);
});

for (const width of [1440, 390]) {
  test(`logo wipe and website reveal have continuous geometry at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.clock.install({ time: new Date("2026-09-14T12:00:00Z") });
    await page.clock.pauseAt(new Date("2026-09-14T12:00:00Z"));
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => document.querySelector('.brand-entrance--ready') && document.getAnimations().length >= 6);
    await page.evaluate(() => document.getAnimations().forEach(animation => animation.pause()));
    async function sample(time) {
      return page.evaluate((time) => {
        document.getAnimations().forEach(animation => { animation.currentTime = time; });
        const rect = (selector) => {
          const element = document.querySelector(selector);
          const box = element.getBoundingClientRect();
          return { y: box.y, bottom: box.bottom, height: box.height, visibility: getComputedStyle(element).visibility, opacity: getComputedStyle(element).opacity };
        };
        return { top: rect('.brand-entrance__line--top'), bottom: rect('.brand-entrance__line--bottom'), panel: rect('.brand-entrance__panel--top'), logo: rect('.brand-entrance__logo'), image: rect('.brand-entrance__logo img'), backdrop: rect('.brand-entrance__backdrop'), durations: document.getAnimations().map(animation => animation.effect.getTiming().duration) };
      }, time);
    }
    const start = await sample(240);
    expect(Number(start.image.opacity)).toBe(1);
    expect(start.logo.visibility).toBe("visible");
    expect(start.top.y).toBeCloseTo(0, 0);
    expect(start.panel.height).toBeCloseTo(0, 0);
    expect(start.durations.every(duration => duration === 1200)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath("logo.png") });
    const wiping = await sample(500);
    expect(wiping.top.y).toBeGreaterThan(start.top.y);
    expect(wiping.top.y).toBeLessThan(450);
    expect(Math.abs(wiping.top.y - wiping.panel.bottom)).toBeLessThan(1);
    const center = await sample(624);
    expect(Math.abs(center.top.y - center.bottom.y)).toBeLessThan(1);
    expect(center.logo.visibility).toBe("hidden");
    expect(center.backdrop.visibility).toBe("hidden");
    expect(center.panel.height).toBeCloseTo(450, 0);
    await page.screenshot({ path: testInfo.outputPath("center.png") });
    const opening = await sample(950);
    expect(opening.top.y).toBeLessThan(center.top.y);
    expect(opening.bottom.y).toBeGreaterThan(center.bottom.y);
    expect(opening.panel.height).toBeLessThan(center.panel.height);
    expect(opening.backdrop.visibility).toBe("hidden");
    await page.screenshot({ path: testInfo.outputPath("reveal.png") });
  });
}

test("failed logo request exits without blocking tools", async ({ page }) => {
  await page.route("**/brand/compass-one-culinary.svg", route => route.abort());
  await page.goto("/");
  await expect(page.getByTestId("brand-entrance")).toHaveCount(0, { timeout: 2000 });
  await page.getByTestId("platform-intelligence").locator("summary").click();
  await expect(page.getByTestId("platform-intelligence")).toHaveAttribute("open", "");
});

test("disabled animation cannot leave a blocking entrance", async ({ page }) => {
  await page.addInitScript(() => {
    const style = document.createElement("style");
    style.textContent = "*, *::before, *::after { animation: none !important; }";
    document.addEventListener("DOMContentLoaded", () => document.head.append(style), { once: true });
  });
  await page.goto("/");
  await expect(page.getByTestId("brand-entrance")).toHaveCount(0, { timeout: 2500 });
  await page.getByTestId("platform-intelligence").locator("summary").click();
  await expect(page.getByTestId("platform-intelligence")).toHaveAttribute("open", "");
});

test("mobile app and browser icon references decode at their declared sizes", async ({ page, request }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const manifestHref = await page.locator('link[rel="manifest"]').getAttribute("href");
  const response = await request.get(manifestHref);
  expect(response.ok()).toBe(true);
  const manifest = await response.json();
  expect(manifest.display).toBe("standalone");
  expect(manifest.icons.map(icon => icon.sizes)).toEqual(expect.arrayContaining(["192x192", "512x512"]));
  const htmlIcons = await page.locator('link[rel="apple-touch-icon"], link[rel="icon"][type="image/png"]').evaluateAll(links => links.map(link => ({ src: link.href, sizes: link.sizes.value })));
  expect(htmlIcons.map(icon => icon.sizes)).toContain("180x180");
  for (const icon of [...manifest.icons, ...htmlIcons]) {
    const dimensions = await page.evaluate(async (src) => {
      const image = new Image();
      image.src = src;
      await image.decode();
      return `${image.naturalWidth}x${image.naturalHeight}`;
    }, icon.src);
    expect(dimensions).toBe(icon.sizes);
    expect(icon.src).toContain("v=");
  }
});

for (const installedMode of ["standalone", "minimal-ui", "ios"]) {
  test(`installed launch ${installedMode} reveals tools without a second logo`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript((mode) => {
      if (mode === "ios") Object.defineProperty(navigator, "standalone", { value: true });
      else {
        const original = window.matchMedia.bind(window);
        window.matchMedia = query => {
          const result = original(query);
          if (query.includes(`display-mode: ${mode}`)) Object.defineProperty(result, "matches", { value: true });
          return result;
        };
      }
    }, installedMode);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const entrance = page.getByTestId("brand-entrance");
    await expect(entrance).toBeVisible();
    expect(await entrance.locator("img, .brand-entrance__logo, .brand-entrance__backdrop").count()).toBe(0);
    const positions = await page.evaluate(() => {
      const animations = document.getAnimations();
      animations.forEach(animation => { animation.pause(); animation.currentTime = 0; });
      const top = document.querySelector('.brand-entrance__line--top');
      const bottom = document.querySelector('.brand-entrance__line--bottom');
      const start = { top: top.getBoundingClientRect().y, bottom: bottom.getBoundingClientRect().y };
      animations.forEach(animation => { animation.currentTime = 300; });
      const mid = { top: top.getBoundingClientRect().y, bottom: bottom.getBoundingClientRect().y };
      const durations = animations.map(animation => animation.effect.getTiming().duration);
      animations.forEach(animation => animation.play());
      return { start, mid, durations };
    });
    expect(Math.abs(positions.start.top - positions.start.bottom)).toBeLessThan(1);
    expect(positions.mid.top).toBeLessThan(positions.start.top);
    expect(positions.mid.bottom).toBeGreaterThan(positions.start.bottom);
    expect(positions.durations.length).toBeGreaterThan(0);
    expect(positions.durations.every(duration => duration === 600)).toBe(true);
    await expect(entrance).toHaveCount(0, { timeout: 1200 });
    await expect(page.getByTestId("mobile-platform-intelligence")).toBeVisible();
    await page.reload();
    await expect(entrance).toHaveCount(0);
  });
}


test("installed app icon preserves the approved horizontal logo composition", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const comparison = await page.evaluate(async () => {
    async function load(src) { const image = new Image(); image.src = src; await image.decode(); return image; }
    const [source, actual] = await Promise.all([load('/brand/compass-one-culinary.svg'), load('/android-chrome-512x512.png')]);
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 512;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.fillStyle = '#151719'; context.fillRect(0, 0, 512, 512);
    // The approved horizontal artwork is centered with 9% side padding; never restack its words.
    const width = 420;
    const height = width * source.naturalHeight / source.naturalWidth;
    context.drawImage(source, (512 - width) / 2, (512 - height) / 2, width, height);
    const expected = context.getImageData(0, 0, 512, 512).data;
    context.clearRect(0, 0, 512, 512); context.drawImage(actual, 0, 0);
    const rendered = context.getImageData(0, 0, 512, 512).data;
    let difference = 0; let minX = 512, maxX = 0, minY = 512, maxY = 0;
    for (let pixel = 0; pixel < rendered.length; pixel += 4) {
      for (let channel = 0; channel < 3; channel++) difference += Math.abs(expected[pixel + channel] - rendered[pixel + channel]);
      if (rendered[pixel] > 100 && rendered[pixel + 1] > 80) {
        const x = (pixel / 4) % 512, y = Math.floor(pixel / 4 / 512);
        minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      }
    }
    return { meanDifference: difference / (512 * 512 * 3), artworkAspect: (maxX - minX) / (maxY - minY) };
  });
  expect(comparison.artworkAspect).toBeGreaterThan(2.7);
  expect(comparison.meanDifference).toBeLessThan(1.5);
});
