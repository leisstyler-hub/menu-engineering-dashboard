import { validateExperienceChange } from "../../src/features/ssmt/ssmtAudit.js";
import { test, expect } from "@playwright/test";
const item = {
  id: "source-item",
  label: "Smash Burger",
  name: "Smash Burger",
  fohColumn: "R FBB | GRILL | SMASH BURGER ENT BF",
  description: "Beef burger",
  mrn: "00083821.10",
  modifierGroups: ["bread"],
  seaPrice: 0,
  areaPrices: { SEA: 0 },
  lockedForCentric: false,
};
const source = {
  id: "source",
  name: "Source Menu",
  type: "Core",
  phase: "IT complete",
  fixyDesignation: "GRILL",
  items: [item],
};
const target = {
  id: "target",
  name: "Target Menu",
  type: "Core",
  phase: "Culinary draft",
  items: [],
};
const workspace = () => ({
  menus: structuredClone([source, target]),
  modifierGroups: [
    {
      id: "bread",
      name: "Bread",
      alias: "BREADS",
      modifierType: "Force",
      minQty: "1",
      maxQty: "1",
      choices: [{ id: "bun", label: "Bun", mrn: "00042", price: 0 }],
    },
  ],
  priceBook: [],
  priceBookArchives: [],
  deletedMenuKeys: [],
  modifierClipboardSlots: [],
  seedMenuTypeCorrectionsApplied: true,
  selectedMenuId: "target",
});
async function isolated(
  page,
  {
    role = "Chef",
    conflict = false,
    failLoad = false,
    extraGroups = false,
    missingFixy = false,
    chiang = false,
  } = {},
) {
  let shared = workspace();
  if (missingFixy) shared.menus[0].items.push({ ...structuredClone(item), id: "missing-fixy", label: "Missing Code Dish", name: "Missing Code Dish", fohColumn: "", mrn: "00999" });
  if (extraGroups) {
    shared.modifierGroups.push({
      id: "cheese",
      name: "Cheese",
      alias: "CHEESE",
      modifierType: "Addition",
      choices: [{ id: "cheddar", label: "Cheddar", mrn: "00099", price: 0 }],
    });
    shared.menus[0].items[0].modifierGroups.push("cheese");
  }
  if (chiang) {
    shared.menus[0].name = "AMZ: Chiang Mai";
    shared.menus[0].items = [
      { id: "section", recordType: "divider", dividerKind: "submenu", name: "Desserts", modifierGroups: [] },
      { ...structuredClone(item), id: "banana", label: "THAI BANANA PANCAKE", name: "THAI BANANA PANCAKE", mrn: "000123.10", fohColumn: "R FSO | CHIANG MAI | Thai Banana Pancake SNK ", seaPrice: "$3.85", modifierGroups: ["N/A"] },
      { ...structuredClone(item), id: "mango", label: "MANGO STICKY RICE", name: "MANGO STICKY RICE", mrn: "000124.10", fohColumn: "R FSO | CHIANG MAI | Mango Sticky Rice SNK ", seaPrice: "$3.85", modifierGroups: ["N/A"] },
      { ...structuredClone(item), id: "broken", label: "BROKEN SOURCE DISH", name: "BROKEN SOURCE DISH", mrn: "000125.10", modifierGroups: ["Missing sauce"] },
    ];
  }
  const saves = [];
  const member = {
    id: "test-user",
    name: "Test Chef",
    email: "chef@example.test",
    role,
    isAdmin: role === "Chef",
  };
  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  // Never let any storage request escape the test.
  await page.route("**/api/storage/records**", (r) =>
    r.fulfill({
      status: 500,
      json: {
        ok: false,
        message: "Legacy writes forbidden in isolated account test",
      },
    }),
  );
  await page.route("**/api/smartsheet/records**", (r) =>
    r.fulfill({ json: { ok: true, records: [] } }),
  );
  await page.route("**/api/ssmt**", async (r) => {
    const req = r.request(),
      body = req.method() === "POST" ? req.postDataJSON() : null;
    const action =
      body?.action || new URL(req.url()).searchParams.get("action");
    if (action === "status")
      return r.fulfill({ json: { ok: true, enabled: true } });
    if (action === "calendar")
      return r.fulfill({ json: { ok: true, menus: [] } });
    if (action === "session")
      return r.fulfill({
        status: 401,
        json: { ok: false, message: "Sign in to SSMT." },
      });
    if (action === "login") return r.fulfill({ json: { ok: true, member } });
    if (action === "members") return r.fulfill({ json: { ok: true, members: [
      { user_id: "one", email: "chef@example.test", display_name: "Test Chef", work_role: "Chef", is_admin: true, active: true, last_sign_in_at: "2026-10-21T04:00:00Z" },
      { user_id: "two", email: "new@example.test", work_role: "IT", is_admin: false, active: true, last_sign_in_at: null },
    ] } });
    if (action === "workspace")
      return r.fulfill({
        status: failLoad ? 503 : 200,
        json: failLoad
          ? { ok: false, message: "Unavailable" }
          : { ok: true, workspace: shared, revision: "rev-1" },
      });
    if (action === "save") {
      if (role === "Experience") {
        const denied = validateExperienceChange(shared, body.workspace);
        if (denied)
          return r.fulfill({
            status: 403,
            json: { ok: false, message: denied },
          });
      }
      saves.push(body);
      if (!conflict) shared = body.workspace;
      return r.fulfill({
        status: conflict ? 409 : 200,
        json: conflict
          ? {
              ok: false,
              message:
                "The shared workspace changed. Reload and reconcile your draft before saving.",
            }
          : { ok: true, revision: "rev-2" },
      });
    }
    if (action === "history")
      return r.fulfill({
        json: {
          ok: true,
          entries: [
            {
              id: 1,
              created_at: "2026-10-20T21:00:00Z",
              actor_name: "Test Chef",
              actor_email: "chef@example.test",
              events: [
                {
                  entityId: "item/test",
                  kind: "item",
                  label: "Smash Burger",
                  action: "edited",
                  changes: { description: { before: "Old", after: "New" } },
                },
              ],
            },
          ],
        },
      });
    return r.fulfill({
      status: 400,
      json: { ok: false, message: `Unexpected isolated action ${action}` },
    });
  });
  await page.goto("/");
  await page.getByRole("button", { name: /open ssmt/i }).click();
  await expect(
    page.getByRole("heading", { name: "SSMT Sign in" }),
  ).toBeVisible();
  await page.getByLabel("Email", { exact: true }).fill("chef@example.test");
  await page
    .getByLabel("Password", { exact: true })
    .fill("a private test password");
  await page
    .getByRole("button", { name: "Sign in to SSMT", exact: true })
    .click();
  return { saves, getWorkspace: () => shared };
}
async function openTarget(page) {
  await page
    .getByRole("button", { name: "Menu Selector / New Menu", exact: true })
    .click();
  await page.locator('[data-menu-name="Target Menu"]').click();
}

test("admin Settings shows users and last sign-in; non-admins have no entry", async ({ page }) => {
  await isolated(page);
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByRole("button", { name: "User administration", exact: true }).click();
  const panel = page.getByRole("dialog", { name: "Manage access" });
  await expect(panel.getByText("Last sign-in:", { exact: false }).first()).toBeVisible();
  await expect(panel.getByText("Never signed in", { exact: false })).toBeVisible();
  await expect(panel.getByText(/Last sign-in:.*2026/)).toBeVisible();
  await expect(panel.getByText("chef@example.test", { exact: false }).first()).toBeVisible();
  await page.screenshot({ path: "C:/Users/leiss/.buzz/WORK_LOGS/SSMT_USER_ADMIN_2026_10_20.png" });
  await panel.getByRole("button", { name: "Close", exact: true }).click();
  await isolated(page, { role: "Experience" });
  await expect(page.getByRole("button", { name: "Manage access", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "User administration", exact: true })).toHaveCount(0);
});

test("item import excludes unfinished menus and flags missing source FIXY before selection", async ({ page }) => {
  await isolated(page, { missingFixy: true });
  await openTarget(page);
  await page.getByLabel("Menu FIXY designation", { exact: true }).fill("MFP DAY");
  await page.getByRole("button", { name: "Add from Menu", exact: true }).click();
  const panel = page.getByRole("dialog", { name: "Add from Menu" });
  await expect(panel.getByLabel("Source menu").locator('option[value="target"]')).toHaveCount(0);
  await panel.getByLabel("Source menu").selectOption("source");
  await expect(panel.getByText("Smash Burger", { exact: false }).first()).toBeVisible();
  await expect(panel.getByText("Source FIXY missing or malformed.", { exact: false })).toBeVisible();
  await expect(panel.locator("label").filter({ hasText: "Missing Code Dish" }).getByRole("checkbox")).toBeDisabled();
  await panel.getByRole("button", { name: "Select whole menu" }).click();
  await panel.getByRole("button", { name: "Preview copies" }).click();
  await expect(panel.getByRole("heading", { name: "Review before applying" })).toBeVisible();
  await expect(panel.getByText("1 items / 1", { exact: false })).toBeVisible();
  await page.screenshot({ path: "C:/Users/leiss/.buzz/WORK_LOGS/SSMT_IMPORT_PREFLIGHT_2026_10_20.png" });
});
test("accounts gate only SSMT and imports independent items, prices and modifiers", async ({
  page,
}) => {
  const fixture = await isolated(page);
  await openTarget(page);
  await page
    .getByRole("button", { name: "Generate FIXY", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("designation");
  await page
    .getByLabel("Menu FIXY designation", { exact: true })
    .fill("MFP DAY");
  await page
    .getByRole("button", { name: "Generate FIXY", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("zero items");
  await page
    .getByRole("button", { name: "Add from Menu", exact: true })
    .click();
  let dialog = page.getByRole("dialog", { name: "Add from Menu", exact: true });
  await dialog.getByLabel("Source menu").selectOption("source");
  await dialog.getByRole("button", { name: "Select whole menu" }).click();
  await dialog.getByRole("button", { name: "Preview copies" }).click();
  await expect(dialog).toContainText("R FBB | MFP DAY | SMASH BURGER ENT BF");
  await dialog.getByRole("button", { name: "Apply copies" }).click();
  await expect(
    page.getByLabel("Fixy for Smash Burger", { exact: true }),
  ).toHaveValue("R FBB | MFP DAY | SMASH BURGER ENT BF");
  await page
    .getByRole("button", { name: "Save SSMT workspace", exact: true })
    .click();
  await expect.poll(() => fixture.saves.length).toBe(1);
  const saved = fixture.getWorkspace();
  const imported = saved.menus.find((m) => m.id === "target").items[0];
  expect(imported.mrn).toBe("00083821.10");
  expect(imported.seaPrice).toBe(0);
  expect(imported.modifierGroups[0]).not.toBe("bread");
  expect(saved.menus[0].items[0].fohColumn).toBe(item.fohColumn);
  await page
    .getByRole("button", { name: "SSMT Change Log", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "SSMT Change Log" }),
  ).toContainText("Test Chef");
});
test("FIXY preview requires explicit facts and applies only after confirmation", async ({
  page,
}) => {
  await isolated(page);
  await page
    .getByRole("button", { name: "Menu Selector / New Menu", exact: true })
    .click();
  await page.locator('[data-menu-name="Source Menu"]').click();
  await page
    .getByRole("button", { name: "Generate FIXY", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Generate FIXY",
    exact: true,
  });
  await dialog.getByRole("button", { name: "Preview FIXY" }).click();
  await expect(dialog.getByRole("alert")).toContainText("food type");
  await dialog.getByLabel("Food type", { exact: true }).selectOption("FBB");
  await dialog.getByLabel("Serving role", { exact: true }).selectOption("ENT");
  await dialog.getByLabel("Protein", { exact: true }).selectOption("BF");
  await dialog.getByRole("button", { name: "Preview FIXY" }).click();
  await expect(dialog).toContainText("R FBB | GRILL | SMASH BURGER ENT BF");
  await dialog.getByRole("button", { name: "Apply FIXY" }).click();
  await expect(dialog).toHaveCount(0);
});
test("modifier loader works on a new item using shared alias search", async ({
  page,
}) => {
  await isolated(page);
  await openTarget(page);
  await page.getByRole("button", { name: "Add item", exact: true }).click();
  await page.getByRole("button", { name: /View modifiers Mods \(0\)/ }).click();
  await page
    .getByRole("button", { name: "Load Modifier Groups", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Load Modifier Groups",
    exact: true,
  });
  await dialog.getByLabel("Search group name or shared alias").fill("BREADS");
  await expect(dialog).toContainText("Source Menu / Smash Burger");
  await dialog.getByRole("checkbox").first().check();
  await dialog.getByRole("button", { name: "Preview copies" }).click();
  await dialog.getByRole("button", { name: "Apply copies" }).click();
  await expect(
    page
      .getByRole("dialog", { name: "Modifier detail" })
      .getByLabel("Modifier group name", { exact: true }),
  ).toHaveValue("Bread");
});
test("Experience only sees descriptions/handoff and a failed shared load cannot save", async ({
  page,
}) => {
  const fixture = await isolated(page, { role: "Experience", failLoad: true });
  await expect(
    page.getByText(
      "Shared workspace could not be loaded. No edits or saves are allowed.",
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Save SSMT workspace", exact: true }),
  ).toHaveCount(0);
  expect(fixture.saves).toHaveLength(0);
});
test("a conflicting save preserves the draft and prevents a retry overwrite", async ({
  page,
}) => {
  const fixture = await isolated(page, { conflict: true });
  await openTarget(page);
  await page.getByLabel("Menu FIXY designation", { exact: true }).fill("GRILL");
  await page
    .getByRole("button", { name: "Save SSMT workspace", exact: true })
    .click();
  await expect(page.getByTestId("ssmt-workspace-sync")).toContainText(
    "Reload and reconcile",
  );
  await page
    .getByRole("button", { name: "Save SSMT workspace", exact: true })
    .click();
  expect(fixture.saves).toHaveLength(1);
  await expect(
    page.getByLabel("Menu FIXY designation", { exact: true }),
  ).toHaveValue("GRILL");
});

test("Experience description edits save without granting wider controls", async ({
  page,
}) => {
  const fixture = await isolated(page, { role: "Experience" });
  await page.getByLabel("Experience menu").selectOption("source");
  await page
    .getByLabel("Description for Smash Burger")
    .fill("Reviewed description");
  await expect(
    page.getByRole("button", { name: "Manage access", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Add item", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Save SSMT workspace", exact: true })
    .click();
  await expect.poll(() => fixture.saves.length).toBe(1);
  expect(fixture.getWorkspace().menus[0].items[0].description).toBe(
    "Reviewed description",
  );
});

test("public home keeps a read-only calendar while SSMT accounts are enabled", async ({
  page,
}) => {
  const now = new Date(),
    date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  await page.route("**/api/ssmt**", (r) => {
    const action = new URL(r.request().url()).searchParams.get("action");
    return r.fulfill({
      json:
        action === "status"
          ? { ok: true, enabled: true }
          : {
              ok: true,
              menus: [
                {
                  id: "public-promo",
                  name: "Public Promotion",
                  type: "Promotion",
                  phase: "Culinary draft",
                  activeStart: date,
                  activeEnd: date,
                },
              ],
            },
    });
  });
  await page.goto("/");
  const calendar = page.getByTestId("landing-promotion-calendar");
  if (![0, 6].includes(now.getDay()))
    await expect(
      calendar.getByText("Public Promotion", { exact: true }),
    ).toBeVisible();
  await expect(
    calendar.getByRole("button", { name: "Public Promotion", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "SSMT Sign in" })).toHaveCount(
    0,
  );
});

test("SSMT account controls and import preview stay contained on a phone", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await isolated(page);
  await openTarget(page);
  await page.getByLabel("Menu FIXY designation", { exact: true }).fill("GRILL");
  await page
    .getByRole("button", { name: "Add from Menu", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Add from Menu",
    exact: true,
  });
  await dialog.getByLabel("Source menu").selectOption("source");
  await dialog.getByRole("button", { name: "Select whole menu" }).click();
  await dialog.getByRole("button", { name: "Preview copies" }).click();
  await expect(dialog).toContainText("R FBB | GRILL | SMASH BURGER ENT BF");
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.screenshot({
    path: ".scratch/SSMT_IMPORT_PREVIEW_PHONE.png",
    fullPage: false,
  });
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
});

test("modifier selections survive typing a different alias", async ({
  page,
}) => {
  await isolated(page, { extraGroups: true });
  await openTarget(page);
  await page.getByRole("button", { name: "Add item", exact: true }).click();
  await page.getByRole("button", { name: /View modifiers Mods \(0\)/ }).click();
  await page
    .getByRole("button", { name: "Load Modifier Groups", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Load Modifier Groups",
    exact: true,
  });
  await dialog.getByLabel("Search group name or shared alias").fill("BREADS");
  await dialog.getByRole("checkbox").first().check();
  await dialog.getByLabel("Search group name or shared alias").fill("CHEESE");
  await dialog.getByRole("checkbox").first().check();
  await dialog.getByRole("button", { name: "Preview copies" }).click();
  await expect(dialog).toContainText("2 independent modifier groups");
  await dialog.getByRole("button", { name: "Apply copies" }).click();
  await expect(
    page
      .getByRole("dialog", { name: "Modifier detail" })
      .getByLabel("Modifier group name", { exact: true }),
  ).toHaveCount(2);
});


test("Chiang Mai picker hides sections, preflights real links and imports N/A desserts", async ({ page }) => {
  const fixture = await isolated(page, { chiang: true });
  await openTarget(page);
  await page.getByLabel("Menu FIXY designation", { exact: true }).fill("CHAING MAI");
  await page.getByRole("button", { name: "Add from Menu", exact: true }).click();
  const panel = page.getByRole("dialog", { name: "Add from Menu", exact: true });
  await panel.getByLabel("Source menu").selectOption("source");
  await expect(panel).not.toContainText("FIXY missing");
  await expect(panel.getByRole("checkbox")).toHaveCount(4);
  await expect(panel.getByLabel("Import BROKEN SOURCE DISH", { exact: true })).toBeDisabled();
  await expect(panel).toContainText("Missing sauce");
  await expect(panel).toContainText("3 items");
  await panel.getByLabel("Search items").fill("BANANA");
  await expect(panel.getByLabel("Import MANGO STICKY RICE", { exact: true })).toHaveCount(0);
  await panel.getByLabel("Search items").fill("");
  await panel.getByRole("button", { name: "Select whole menu" }).click();
  await expect(panel.getByLabel("Import THAI BANANA PANCAKE", { exact: true })).toBeChecked();
  await expect(panel.getByLabel("Import MANGO STICKY RICE", { exact: true })).toBeChecked();
  await page.screenshot({ path: "C:/Users/leiss/.buzz/WORK_LOGS/SSMT_CHIANG_PICKER_2026_10_20.png" });
  await panel.getByRole("button", { name: "Preview copies" }).click();
  await expect(panel.getByRole("alert")).toHaveCount(0);
  await expect(panel).toContainText("2 items / 0 independent modifier groups");
  await expect(panel).toContainText("R FSO | CHAING MAI | Thai Banana Pancake SNK");
  await panel.getByRole("button", { name: "Apply copies" }).click();
  await page.getByRole("button", { name: "Save SSMT workspace", exact: true }).click();
  await expect.poll(() => fixture.saves.length).toBe(1);
  const saved = fixture.getWorkspace(), destination = saved.menus.find(m => m.id === "target");
  expect(destination.items).toHaveLength(2);
  expect(destination.items[0].mrn).toBe("000123.10");
  expect(destination.items[0].seaPrice).toBe("$3.85");
  expect(destination.items[0].modifierGroups).toEqual([]);
  expect(saved.menus[0].items[1].modifierGroups).toEqual(["N/A"]);
  expect(saved.menus[0].items[1].fohColumn).toBe("R FSO | CHIANG MAI | Thai Banana Pancake SNK ");
});


test("SSMT change log and primary navigation are prominent and identify the active view", async ({ page }) => {
  await isolated(page);
  const history = page.getByRole("button", { name: "SSMT Change Log", exact: true });
  await expect(history).toBeVisible();
  expect((await history.boundingBox()).height).toBeGreaterThanOrEqual(48);
  await history.click();
  await expect(page.getByRole("dialog", { name: "SSMT Change Log", exact: true })).toContainText("Saved changes only");
  await page.getByRole("dialog", { name: "SSMT Change Log", exact: true }).getByRole("button", { name: "Close", exact: true }).click();
  for (const label of ["SSMT Start", "Pricing Structure", "Menu Selector / New Menu"]) {
    const control=page.getByRole("button", { name: label, exact: true });
    const box=await control.boundingBox();
    expect(box.height).toBeGreaterThanOrEqual(56);
    expect(box.width).toBeGreaterThanOrEqual(180);
    await control.click();
    await expect(control).toHaveAttribute("aria-pressed", "true");
  }
  await page.screenshot({path:"C:/Users/leiss/.buzz/WORK_LOGS/SSMT_PROMINENT_CONTROLS_2026_10_20.png"});
});
