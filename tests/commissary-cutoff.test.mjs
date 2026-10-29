import assert from "node:assert/strict";
import { test } from "node:test";
import { buildOrderRecord, emptyQuantities, cutoffDateForWeek, firstOpenWeek, isWeekLocked } from "../src/features/commissary-ordering/commissaryModel.js";

import { commissaryWriteValidation } from "../api/storage/records.js";

test("November 2 exception closes exactly Thursday October 29 at 5 PM Pacific", () => {
  assert.equal(cutoffDateForWeek("2026-11-02"), "2026-10-29");
  assert.equal(isWeekLocked("2026-11-02", new Date("2026-10-29T23:59:59.999Z")), false);
  assert.equal(firstOpenWeek(new Date("2026-10-29T16:45:00Z")), "2026-11-02");
  assert.equal(isWeekLocked("2026-11-02", new Date("2026-10-30T00:00:00Z")), true);
  assert.equal(firstOpenWeek(new Date("2026-10-30T00:00:00Z")), "2026-11-09");
});

test("November 9 retains Wednesday November 4 at 5 PM Pacific after DST ends", () => {
  assert.equal(cutoffDateForWeek("2026-11-09"), "2026-11-04");
  assert.equal(isWeekLocked("2026-11-09", new Date("2026-11-05T00:59:59.999Z")), false);
  assert.equal(isWeekLocked("2026-11-09", new Date("2026-11-05T01:00:00Z")), true);
  assert.equal(cutoffDateForWeek("2026-10-26"), "2026-10-21");
  assert.equal(cutoffDateForWeek("2026-11-16"), "2026-11-11");
});


test("server rejects direct order writes at each effective cutoff", (t) => {
  const record = buildOrderRecord({ cafe: "Nessie", weekStart: "2026-11-02", quantities: emptyQuantities() });
  t.mock.timers.enable({ apis: ["Date"], now: new Date("2026-10-29T23:59:59.999Z") });
  assert.equal(commissaryWriteValidation([record], { tool: "commissaryOrders" }), "");
  t.mock.timers.setTime(new Date("2026-10-30T00:00:00Z").getTime());
  assert.match(commissaryWriteValidation([record], { tool: "commissaryOrders" }), /order is locked/i);
  const next = buildOrderRecord({ cafe: "Nessie", weekStart: "2026-11-09", quantities: emptyQuantities() });
  t.mock.timers.setTime(new Date("2026-11-05T00:59:59.999Z").getTime());
  assert.equal(commissaryWriteValidation([next], { tool: "commissaryOrders" }), "");
  t.mock.timers.setTime(new Date("2026-11-05T01:00:00Z").getTime());
  assert.match(commissaryWriteValidation([next], { tool: "commissaryOrders" }), /order is locked/i);
});
