import { test } from "node:test";
import assert from "node:assert/strict";
import { assertReleaseVersion } from "../scripts/release-version.mjs";

test("daily sequence continues across publishers and historical resets", () => {
  const history = ['+export const APP_VERSION_STAMP = "2026.11.05.003-alex";', '+export const APP_VERSION_STAMP = "2026.11.05.001-tyler";'].join("\n");
  assert.throws(() => assertReleaseVersion("2026.11.05.002-fix", "2026.11.05.001-tyler", history), /004/);
  assert.doesNotThrow(() => assertReleaseVersion("2026.11.05.004-fix", "2026.11.05.001-tyler", history));
});

test("unchanged versions allow documentation releases; a new date starts at one", () => {
  const previous = "2026.11.05.003-alex";
  assert.doesNotThrow(() => assertReleaseVersion(previous, previous, previous));
  assert.doesNotThrow(() => assertReleaseVersion("2026.11.06.001-fix", previous, previous));
  assert.throws(() => assertReleaseVersion("2026.11.05.003-renamed", previous, previous), /004/);
  assert.throws(() => assertReleaseVersion("2026.11.04.009-old", previous, previous), /date/);
  assert.throws(() => assertReleaseVersion("invalid", previous, previous), /format/);
});
