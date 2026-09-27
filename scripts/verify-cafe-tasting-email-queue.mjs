import assert from "node:assert/strict";
import handler, { findRowsReadyForEmail, isScheduledQueueTime } from "../api/cafe-tasting/email-ready-queue.js";

const columns = ["Cafe Name", "Dish Name", "Chef Contact", "Director Contact", "Email Ready", "Chef/Director Alert Sent"]
  .map((title, index) => ({ id: index + 1, title }));
const cell = (columnId, value, extra = {}) => ({ columnId, value, ...extra });
const sheet = {
  columns,
  rows: [
    { id: 1, cells: [cell(1, "Cafe A"), cell(2, "Dish A"), cell(3, "chef@example.com"), cell(5, false), cell(6, false)] },
    { id: 2, cells: [cell(1, "Cafe B"), cell(2, "Dish B"), cell(4, "director@example.com"), cell(5, false), cell(6, false)] },
    { id: 3, cells: [cell(1, "Cafe C"), cell(2, "Dish C"), cell(3, "chef@example.com"), cell(5, true), cell(6, false)] },
    { id: 4, cells: [cell(1, "Cafe D"), cell(2, "Dish D"), cell(3, "chef@example.com"), cell(5, false), cell(6, true)] },
    { id: 5, cells: [cell(1, "Cafe E"), cell(2, "Dish E"), cell(5, false), cell(6, false)] },
  ],
};
assert.deepEqual(findRowsReadyForEmail(sheet).rows.map(({ id }) => id), [1, 2]);
assert.equal(isScheduledQueueTime(new Date("2026-09-28T20:00:00Z")), true);
assert.equal(isScheduledQueueTime(new Date("2026-09-29T00:00:00Z")), true);
assert.equal(isScheduledQueueTime(new Date("2026-12-07T21:00:00Z")), true);
assert.equal(isScheduledQueueTime(new Date("2026-12-08T01:00:00Z")), true);
assert.equal(isScheduledQueueTime(new Date("2026-09-27T20:00:00Z")), false);

const response = () => ({
  statusCode: 200,
  headers: {},
  setHeader(name, value) { this.headers[name] = value; },
  status(value) { this.statusCode = value; return this; },
  json(value) { this.body = value; return this; },
});
const unauthorized = response();
await handler({ method: "GET", headers: {} }, unauthorized);
assert.equal(unauthorized.statusCode, 401);
const outsideWindow = response();
const originalDate = globalThis.Date;
globalThis.Date = class extends originalDate { constructor() { super("2026-09-27T18:00:00Z"); } };
try {
  await handler({ method: "GET", headers: { "user-agent": "vercel-cron/1.0" } }, outsideWindow);
  assert.equal(outsideWindow.statusCode, 200);
  assert.equal(outsideWindow.body.scheduledWindow, false);
} finally {
  globalThis.Date = originalDate;
}
console.log("Cafe Tasting scheduled email queue verification passed.");
