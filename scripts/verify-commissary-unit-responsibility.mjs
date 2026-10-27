import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  COMMISSARY_RESPONSIBLE_CHEFS,
  COMMISSARY_UNIT_RESPONSIBILITY,
  COMMISSARY_UNIT_RESPONSIBILITY_BY_PROFIT_CENTER,
  commissaryResponsibilityForProfitCenter,
} from "../internal/commissary-unit-responsibility.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const expectedUnits = [
  ["50360", "SEA 58 - APOLLO MKT"], ["35983", "SEA90 - ATLAS CAFE"],
  ["30783", "SEA53 - BRAZIL COFFEE"], ["22472", "SEA20 - CRICKET CAFE"],
  ["28675", "SEA27 - DAWSON CAFE"], ["28676", "SEA27 - DAWSON COFFEE"],
  ["28673", "SEA24 - FIONA COFFEE"], ["30529", "SEA58 - KUMO CAFE"],
  ["30159", "SEA39 - NESSIE CAFE"], ["28672", "SEA29 - ARIZONA COFFEE"],
  ["28674", "SEA21 - PATH TO YES COFFEE"], ["28671", "SEA37 - ROXANNE COFFEE"],
  ["35982", "SEA86 - TRIUMPH COFFEE"], ["30871", "SEA41 - DAY 1 CAFE"],
  ["35981", "SEA41 - DAY 1 COFFEE"], ["30786", "SEA40 - DOPPLER CAFE"],
  ["30787", "SEA40 - DOPPLER CATERING"], ["31508", "SEA40 - DOPPLER COFFEE"],
  ["30788", "SEA40 - DOPPLER MKT"], ["53166", "SEA44 - FRONTIER CAFE"],
  ["53167", "SEA44 - FRONTIER COFFEE"], ["53168", "SEA44 - FRONTIER MKP"],
  ["51641", "SEA43 - NITRO N CAFE"], ["51642", "SEA43 - NITRO N COFFEE"],
  ["51643", "SEA43 - NITRO N MKT"], ["47622", "SEA42 - REINVENT CAFE"],
  ["47620", "SEA42 - REINVENT CATERING"], ["47621", "SEA42 - REINVENT COFFEE"],
];

assert.deepEqual(
  COMMISSARY_UNIT_RESPONSIBILITY.map(({ profitCenter, unitName }) => [profitCenter, unitName]),
  expectedUnits,
  "The responsibility roster must match the approved 28-unit list exactly.",
);
assert.equal(new Set(COMMISSARY_UNIT_RESPONSIBILITY.map(({ profitCenter }) => profitCenter)).size, 28);
assert.ok(COMMISSARY_UNIT_RESPONSIBILITY.every(({ profitCenter }) => /^\d{5}$/.test(profitCenter)));
assert.ok(COMMISSARY_UNIT_RESPONSIBILITY.every(({ responsibleChefId }) => responsibleChefId === "jordan-gheen"));
assert.equal(COMMISSARY_RESPONSIBLE_CHEFS["jordan-gheen"].displayName, "Jordan Gheen");
assert.equal(COMMISSARY_RESPONSIBLE_CHEFS["jordan-gheen"].title, "Executive Chef, Commissary Program");
assert.equal(Object.keys(COMMISSARY_UNIT_RESPONSIBILITY_BY_PROFIT_CENTER).length, 28);
assert.equal(commissaryResponsibilityForProfitCenter(28675)?.unitName, "SEA27 - DAWSON CAFE");
assert.equal(commissaryResponsibilityForProfitCenter(" 47621 ")?.responsibleChef.displayName, "Jordan Gheen");
assert.equal(commissaryResponsibilityForProfitCenter("99999"), null);

const searchableExtensions = new Set([".js", ".jsx", ".mjs", ".cjs", ".json", ".html", ".css", ".md"]);
const forbiddenMarkers = ["Jordan Gheen", "jordan-gheen", "commissary-unit-responsibility"];
function filesBelow(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? filesBelow(path) : [path];
  });
}
for (const clientRoot of ["src", "public", "api"]) {
  for (const path of filesBelow(join(root, clientRoot))) {
    if (!searchableExtensions.has(extname(path))) continue;
    const contents = readFileSync(path, "utf8");
    for (const marker of forbiddenMarkers) {
      assert.equal(contents.includes(marker), false, `Private responsibility marker leaked into client/public code: ${path}`);
    }
  }
}

console.log("Verified internal commissary responsibility routing for 28 units with no client/public exposure.");
