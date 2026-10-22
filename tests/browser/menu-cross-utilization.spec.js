import { expect, test } from "@playwright/test";
import { collectUnexpectedPageErrors, expectNoAppProtection, expectNoUnexpectedPageErrors, openTool } from "./smoke-helpers.js";

test("Menu Cross Utilization Tool opens with pillar strategy and the full menu list", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);

  await openTool(page, /open cross utilization/i, /^Menu Cross Utilization Tool$/);

  await expect(page.getByText("Amazon Region (FBE000)", { exact: true })).toBeVisible();
  await expect(page.getByText("Report date 2026-08-03", { exact: true })).toBeVisible();
  await expect(page.getByText(/guidance only, not an automatic rotation rule/i)).toBeVisible();

  await expect(page.getByRole("heading", { name: "Cuisine pillar groupings" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Base Station Infrastructure" })).toBeVisible();

  await expect(page.getByRole("heading", { name: "Menu cross-utilization list" })).toBeVisible();
  const chickleRow = page.getByRole("row", { name: /Chickle/ });
  await expect(chickleRow).toBeVisible();
  await expect(chickleRow.getByText("no ingredient data")).toBeVisible();
  await expect(page.getByRole("row", { name: /^Andes/ })).toBeVisible();

  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("Menu Cross Utilization Tool pairwise matrix shows overlap detail in the required field order", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);

  await openTool(page, /open cross utilization/i, /^Menu Cross Utilization Tool$/);
  await page.getByRole("button", { name: /open pairwise matrix/i }).click();

  await expect(page.getByRole("heading", { name: "Ingredient overlap by menu pair" })).toBeVisible();
  await expect(page.getByText("Chickle has no ingredient data and is excluded from this grid.")).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Chickle" })).toHaveCount(0);
  await expect(page.getByText("Pillar cross-utilization %").first()).toBeVisible();
  await expect(page.getByTestId("pillar-cross-use-Latin").getByText(/\d+%/)).toBeVisible();

  await page.getByTitle(/Andes × Cevicheria:/).click();

  const andesCevicheriaCell = page.getByTitle(/Andes .* Cevicheria:/).first();
  await expect(andesCevicheriaCell).toContainText(/\d+%/);
  const cellBox = await andesCevicheriaCell.boundingBox();
  expect(cellBox?.width).toBeGreaterThanOrEqual(34);
  expect(cellBox?.height).toBeGreaterThanOrEqual(34);
  const background = await andesCevicheriaCell.evaluate((element) => getComputedStyle(element).backgroundColor);
  const channels = background.match(/\d+(\.\d+)?/g)?.map(Number) ?? [];
  expect(channels[0]).toBeGreaterThan(channels[1]);
  expect(channels[0]).toBeGreaterThan(channels[2]);

  const detail = page.locator("aside", { hasText: "Pair Detail" });
  await expect(detail.getByRole("heading", { name: "Andes × Cevicheria" })).toBeVisible();
  await expect(detail.getByText("% Overlap")).toBeVisible();
  await expect(detail.getByText(/shared ingredients \(ingredient\/purchasing overlap only\)/i)).toBeVisible();
  await expect(detail.getByText(/Shared ingredients \(\d+\)/)).toBeVisible();
  await expect(detail.getByText(/Ordering \/ reuse opportunity/i)).toBeVisible();
  await expect(detail.getByText(/not proof of a shared recipe/i)).toBeVisible();

  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("Menu Cross Utilization Tool gives long pair details more shared-ingredient space", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);

  await openTool(page, /open cross utilization/i, /^Menu Cross Utilization Tool$/);
  await page.getByRole("button", { name: /open pairwise matrix/i }).click();

  await page.getByTitle(/Curated Sandwiches .* Deli Core:/).click();

  const detail = page.getByTestId("pair-detail-panel");
  const sharedList = page.getByTestId("pair-detail-shared-ingredients");
  const reuseNote = page.getByTestId("pair-detail-reuse-opportunity");

  await expect(detail.getByRole("heading", { name: /Curated Sandwiches .* Deli Core/ })).toBeVisible();
  await expect(sharedList.getByText(/Anchovy Fillets/)).toBeVisible();
  await expect(sharedList).toHaveCSS("overflow-y", "auto");

  const detailBox = await detail.boundingBox();
  const sharedListBox = await sharedList.boundingBox();
  const reuseNoteBox = await reuseNote.boundingBox();

  expect(sharedListBox?.height).toBeGreaterThanOrEqual(320);
  expect(reuseNoteBox && detailBox ? Math.abs(detailBox.y + detailBox.height - (reuseNoteBox.y + reuseNoteBox.height)) : 999).toBeLessThanOrEqual(24);

  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("Menu Cross Utilization Tool groups the pairwise matrix by pillar with self-match diagonal cells", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);

  await openTool(page, /open cross utilization/i, /^Menu Cross Utilization Tool$/);
  await expect(page.getByText("Pillar cross-utilization %").first()).toBeVisible();
  await expect(page.getByTestId("pillar-overview-Latin").getByText("Pillar cross-utilization %")).toBeVisible();
  await expect(page.getByTestId("pillar-overview-Latin").getByText(/Andes/)).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Pillar Cross-Use %" })).toBeVisible();
  await expect(page.getByRole("row", { name: /^Andes/ }).getByText(/\d+%/)).toHaveCount(2);

  await page.getByRole("button", { name: /open pairwise matrix/i }).click();

  await expect(page.getByTestId("pairwise-pillar-group-Latin")).toBeVisible();
  await expect(page.getByTestId("pairwise-self-cell-Andes")).toContainText("100%");
  await expect(page.getByTestId("pairwise-self-cell-Andes")).toHaveCSS("cursor", "default");
  await expect(page.getByTitle(/Andes .* Andes:/)).toHaveCount(0);

  const latinHeaderColor = await page.getByTestId("pairwise-pillar-group-Latin").evaluate((element) => getComputedStyle(element).borderLeftColor);
  expect(latinHeaderColor).not.toBe("rgb(226, 232, 240)");

  const matrixBox = await page.getByTestId("pairwise-matrix-grid").boundingBox();
  expect(matrixBox?.width).toBeGreaterThanOrEqual(1200);

  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("Menu Cross Utilization Tool pairwise matrix can expand to fill the browser and restore", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);

  // 1440x900 is a common laptop viewport where the collapsed matrix's 820px
  // cap mostly sits below the fold with zero page scroll, so the real proof
  // of "more space" is visible height without scrolling, not raw box height.
  const viewport = { width: 1440, height: 900 };
  await page.setViewportSize(viewport);
  await openTool(page, /open cross utilization/i, /^Menu Cross Utilization Tool$/);
  await page.getByRole("button", { name: /open pairwise matrix/i }).click();

  const matrixGrid = page.getByTestId("pairwise-matrix-grid");
  const collapsedBox = await matrixGrid.boundingBox();
  const collapsedVisibleHeight = Math.max(
    0,
    Math.min(collapsedBox.y + collapsedBox.height, viewport.height) - Math.max(collapsedBox.y, 0)
  );

  const expandButton = page.getByRole("button", { name: /^expand$/i });
  await expect(expandButton).toBeVisible();
  await expandButton.click();

  const restoreButton = page.getByRole("button", { name: /^restore$/i });
  await expect(restoreButton).toBeVisible();
  await expect(restoreButton).toBeFocused();

  const expandedBox = await matrixGrid.boundingBox();
  expect(expandedBox.height).toBeGreaterThan(collapsedVisibleHeight + 100);
  expect(expandedBox.width).toBeGreaterThanOrEqual(collapsedBox.width);

  let horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(horizontalOverflow).toBeLessThanOrEqual(8);
  let verticalOverflow = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
  expect(verticalOverflow).toBeLessThanOrEqual(8);

  await page.getByTitle(/Andes × Cevicheria:/).click();
  const detail = page.getByTestId("pair-detail-panel");
  await expect(detail.getByRole("heading", { name: "Andes × Cevicheria" })).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(expandButton).toBeVisible();
  await expect(expandButton).toBeFocused();

  const restoredBox = await matrixGrid.boundingBox();
  expect(restoredBox.height).toBe(collapsedBox.height);

  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("Menu Cross Utilization Tool expanded pairwise matrix contains keyboard focus away from covered background controls", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);

  await openTool(page, /open cross utilization/i, /^Menu Cross Utilization Tool$/);
  await page.getByRole("button", { name: /open pairwise matrix/i }).click();
  await page.getByTitle(/Andes × Cevicheria:/).click();
  await page.getByRole("button", { name: /^expand$/i }).click();

  const restoreButton = page.getByRole("button", { name: /^restore$/i });
  await expect(restoreButton).toBeFocused();

  const backgroundButtons = [
    page.getByRole("button", { name: /back to platform/i }),
    page.getByRole("button", { name: /^settings$/i }),
    page.getByRole("button", { name: /pillar strategy & menus/i }),
    page.getByRole("button", { name: /open pairwise matrix/i }),
  ];

  // Real containment, not merely an absence of tab stops: the background
  // chrome is `inert`, so a direct, non-keyboard focus() call must still be
  // refused by the browser and leave the Restore button focused.
  for (const button of backgroundButtons) {
    await button.evaluate((element) => element.focus());
    await expect(restoreButton).toBeFocused();
  }

  // Repeated Tab/Shift+Tab, with a pair already selected, must never land on
  // a covered background control. Restore is the only focusable element
  // inside the expanded dialog, so Tab can legitimately leave focus on
  // nothing (the browser has nowhere else to go) -- the invariant under test
  // is that it never lands on a background button, not that Restore holds
  // focus forever.
  for (let i = 0; i < 5; i += 1) {
    await page.keyboard.press("Tab");
    for (const button of backgroundButtons) {
      await expect(button).not.toBeFocused();
    }
  }
  for (let i = 0; i < 5; i += 1) {
    await page.keyboard.press("Shift+Tab");
    for (const button of backgroundButtons) {
      await expect(button).not.toBeFocused();
    }
  }

  const detail = page.getByTestId("pair-detail-panel");
  await expect(detail.getByRole("heading", { name: "Andes × Cevicheria" })).toBeVisible();

  const expandedSection = page.locator('section[role="dialog"]');
  await expect(expandedSection).toHaveAttribute("aria-modal", "true");
  const bodyOverflowWhileExpanded = await page.evaluate(() => document.body.style.overflow);
  expect(bodyOverflowWhileExpanded).toBe("hidden");

  await page.keyboard.press("Escape");
  const expandButton = page.getByRole("button", { name: /^expand$/i });
  await expect(expandButton).toBeFocused();

  // Restoring must lift containment: background chrome becomes focusable
  // again and body scroll is unlocked.
  const backToPlatform = page.getByRole("button", { name: /back to platform/i });
  await backToPlatform.evaluate((element) => element.focus());
  await expect(backToPlatform).toBeFocused();
  const bodyOverflowAfterRestore = await page.evaluate(() => document.body.style.overflow);
  expect(bodyOverflowAfterRestore).toBe("");

  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("Menu Cross Utilization Tool expanded pairwise matrix stays usable on a narrow viewport", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);

  await page.setViewportSize({ width: 390, height: 844 });
  await openTool(page, /open cross utilization/i, /^Menu Cross Utilization Tool$/);
  await page.getByRole("button", { name: /open pairwise matrix/i }).click();
  await page.getByRole("button", { name: /^expand$/i }).click();

  await expect(page.getByRole("button", { name: /^restore$/i })).toBeVisible();
  await expect(page.getByTestId("pairwise-matrix-grid")).toBeVisible();

  const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(horizontalOverflow).toBeLessThanOrEqual(8);

  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: /^expand$/i })).toBeVisible();

  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

const squeezeProneViewports = [
  { width: 1366, height: 768 },
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
];

for (const viewport of squeezeProneViewports) {
  for (const order of ["select-then-expand", "expand-then-select"]) {
    test(`Menu Cross Utilization Tool keeps a usable expanded matrix after selecting a pair at ${viewport.width}x${viewport.height} (${order})`, async ({ page }) => {
      const pageErrors = collectUnexpectedPageErrors(page);

      await page.setViewportSize(viewport);
      await openTool(page, /open cross utilization/i, /^Menu Cross Utilization Tool$/);
      await page.getByRole("button", { name: /open pairwise matrix/i }).click();

      const expandButton = page.getByRole("button", { name: /^expand$/i });
      const selectAndesCevicheria = () => page.getByTitle(/Andes × Cevicheria:/).click();

      if (order === "select-then-expand") {
        await selectAndesCevicheria();
        await expandButton.click();
      } else {
        await expandButton.click();
        await selectAndesCevicheria();
      }

      // Below the 1536px (2xl) breakpoint the matrix and pair detail stack as
      // two grid rows inside a height-constrained viewport. Without a floor on
      // each row's height, the detail panel's own intrinsic min-height used to
      // win the implicit-row sizing contest and squeeze the matrix row to
      // near-zero once a pair was selected -- reproduced identically regardless
      // of selection order. A real container height (not just DOM presence) is
      // the right assertion: that's exactly what previously collapsed to
      // 2-43px.
      const matrixGrid = page.getByTestId("pairwise-matrix-grid");
      const matrixBox = await matrixGrid.boundingBox();
      expect(matrixBox).not.toBeNull();
      expect(matrixBox.height).toBeGreaterThanOrEqual(300);

      // A data row near the top of the table (not the cell we just clicked,
      // which Playwright's .click() may have scrolled into view on its own)
      // must actually fall within the matrix container's visible box -- proof
      // that real data rows render, not just the sticky pillar header.
      const andesSelfCell = page.getByTestId("pairwise-self-cell-Andes");
      const andesCellBox = await andesSelfCell.boundingBox();
      expect(andesCellBox).not.toBeNull();
      expect(andesCellBox.y).toBeGreaterThanOrEqual(matrixBox.y - 1);
      expect(andesCellBox.y + andesCellBox.height).toBeLessThanOrEqual(matrixBox.y + matrixBox.height + 1);

      // The matrix must still be usably scrollable for rows beyond the fold.
      const matrixScrollHeight = await matrixGrid.evaluate((element) => element.scrollHeight);
      const matrixClientHeight = await matrixGrid.evaluate((element) => element.clientHeight);
      expect(matrixScrollHeight).toBeGreaterThan(0);
      expect(matrixClientHeight).toBeGreaterThan(0);
      await matrixGrid.evaluate((element) => {
        element.scrollTop = 50;
      });
      expect(await matrixGrid.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
      await matrixGrid.evaluate((element) => {
        element.scrollTop = 0;
      });

      // Detail content must be reachable by scrolling, not merely its heading.
      const detail = page.getByTestId("pair-detail-panel");
      await expect(detail.getByRole("heading", { name: "Andes × Cevicheria" })).toBeVisible();
      await expect(detail.getByText("% Overlap")).toBeVisible();
      const reuseNote = page.getByTestId("pair-detail-reuse-opportunity");
      await reuseNote.scrollIntoViewIfNeeded();
      await expect(reuseNote).toBeVisible();

      // Restore must remain reachable: it is pinned above the scrolling grid
      // row, not carried off by any section-level scroll.
      const restoreButton = page.getByRole("button", { name: /^restore$/i });
      await expect(restoreButton).toBeVisible();
      await restoreButton.evaluate((element) => element.focus());
      await expect(restoreButton).toBeFocused();

      const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(horizontalOverflow).toBeLessThanOrEqual(8);

      await expectNoAppProtection(page);
      expectNoUnexpectedPageErrors(pageErrors);
    });
  }
}

const wideDesktopViewports = [
  { width: 1920, height: 1080, minMatrixHeight: 900 },
  { width: 2560, height: 1440, minMatrixHeight: 1250 },
];

for (const { width, height, minMatrixHeight } of wideDesktopViewports) {
  test(`Menu Cross Utilization Tool keeps the expanded matrix and pair detail side-by-side at ${width}x${height} after selecting a pair`, async ({ page }) => {
    const pageErrors = collectUnexpectedPageErrors(page);

    await page.setViewportSize({ width, height });
    await openTool(page, /open cross utilization/i, /^Menu Cross Utilization Tool$/);
    await page.getByRole("button", { name: /open pairwise matrix/i }).click();
    await page.getByRole("button", { name: /^expand$/i }).click();
    await page.getByTitle(/Andes × Cevicheria:/).click();

    const matrixGrid = page.getByTestId("pairwise-matrix-grid");
    const detail = page.getByTestId("pair-detail-panel");
    const matrixBox = await matrixGrid.boundingBox();
    const detailBox = await detail.boundingBox();

    // At >=1536px the two-column layout applies: detail sits beside the
    // matrix, not beneath it, and the matrix keeps the large height this
    // layout has always given wide desktops once a pair is selected.
    expect(matrixBox.height).toBeGreaterThanOrEqual(minMatrixHeight);
    expect(detailBox.x).toBeGreaterThanOrEqual(matrixBox.x + matrixBox.width - 1);

    await expectNoAppProtection(page);
    expectNoUnexpectedPageErrors(pageErrors);
  });
}

test("Menu Cross Utilization Tool reflows the expanded, pair-selected matrix cleanly across the 1536px breakpoint", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);

  await page.setViewportSize({ width: 1440, height: 900 });
  await openTool(page, /open cross utilization/i, /^Menu Cross Utilization Tool$/);
  await page.getByRole("button", { name: /open pairwise matrix/i }).click();
  await page.getByRole("button", { name: /^expand$/i }).click();
  await page.getByTitle(/Andes × Cevicheria:/).click();

  const matrixGrid = page.getByTestId("pairwise-matrix-grid");
  const detail = page.getByTestId("pair-detail-panel");

  let matrixBox = await matrixGrid.boundingBox();
  let detailBox = await detail.boundingBox();
  expect(matrixBox.height).toBeGreaterThanOrEqual(300);
  expect(detailBox.y).toBeGreaterThanOrEqual(matrixBox.y + matrixBox.height - 1);

  await page.setViewportSize({ width: 1920, height: 1080 });
  matrixBox = await matrixGrid.boundingBox();
  detailBox = await detail.boundingBox();
  await expect(detail.getByRole("heading", { name: "Andes × Cevicheria" })).toBeVisible();
  expect(matrixBox.height).toBeGreaterThanOrEqual(900);
  expect(detailBox.x).toBeGreaterThanOrEqual(matrixBox.x + matrixBox.width - 1);

  await page.setViewportSize({ width: 1440, height: 900 });
  matrixBox = await matrixGrid.boundingBox();
  detailBox = await detail.boundingBox();
  await expect(detail.getByRole("heading", { name: "Andes × Cevicheria" })).toBeVisible();
  expect(matrixBox.height).toBeGreaterThanOrEqual(300);
  expect(detailBox.y).toBeGreaterThanOrEqual(matrixBox.y + matrixBox.height - 1);

  const restoreButton = page.getByRole("button", { name: /^restore$/i });
  await expect(restoreButton).toBeVisible();

  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});

test("Menu Cross Utilization Tool stays usable on tablet and mobile viewports", async ({ page }) => {
  const pageErrors = collectUnexpectedPageErrors(page);

  await page.setViewportSize({ width: 820, height: 1180 });
  await openTool(page, /open cross utilization/i, /^Menu Cross Utilization Tool$/);
  await expect(page.getByRole("heading", { name: "Cuisine pillar groupings" })).toBeVisible();
  let horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(horizontalOverflow).toBeLessThanOrEqual(8);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("heading", { name: "Menu Cross Utilization Tool" })).toBeVisible();
  await expect(page.getByRole("button", { name: /open pairwise matrix/i })).toBeVisible();
  horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(horizontalOverflow).toBeLessThanOrEqual(8);

  await expectNoAppProtection(page);
  expectNoUnexpectedPageErrors(pageErrors);
});
