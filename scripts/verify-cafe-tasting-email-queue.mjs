import assert from "node:assert/strict";
import handler, { findRowsReadyForEmail, isScheduledQueueTime } from "../api/cafe-tasting/email-ready-queue.js";

const columns = [
  "Cafe Name", "Dish Name", "Chef Contact", "Director Contact", "Email Ready", "Chef/Director Alert Sent",
].map((title, index) => ({ id: index + 1, title }));
const cell = (columnId, value, extra = {}) => ({ columnId, value, ...extra });
const sheet = {
  columns,
  rows: [
    { id: 1, cells: [cell(1, "Cafe A"), cell(2, "Dish A"), cell(3, "chef@example.com"), cell(5, false), cell(6, false)] },
    { id: 2, cells: [cell(1, "Cafe B"), cell(2, "Dish B"), cell(4, "director@example.com"), cell(5, false), cell(6, false)] },
    { id: 3, cells: [cell(1, "Cafe C"), cell(2, "Dish C"), cell(3, "chef@example.com"), cell(5, true), cell(6, false)] },
    { id: 4, cells: [cell(1, "Cafe D"), cell(2, "Dish D"), cell(3, "chef@example.com"), cell(5, false), cell(6, true)] },
    { id: 5, cells: [cell(1, "Cafe E"), cell(2, "Dish E"), cell(5, false), cell(6, false)] },
    { id: 6, cells: [cell(1, "Cafe F"), cell(2, "Dish F"), cell(3, "", { objectValue: { objectType: "CONTACT", email: "object@example.com" } }), cell(5, false), cell(6, false)] },
  ],
};

assert.deepEqual(findRowsReadyForEmail(sheet).rows.map(({ id }) => id), [1, 2, 6]);
assert.equal(isScheduledQueueTime(new Date("2026-09-28T20:00:00Z")), true);
assert.equal(isScheduledQueueTime(new Date("2026-09-29T00:00:00Z")), true);
assert.equal(isScheduledQueueTime(new Date("2026-12-07T21:00:00Z")), true);
assert.equal(isScheduledQueueTime(new Date("2026-12-08T01:00:00Z")), true);
assert.equal(isScheduledQueueTime(new Date("2026-09-27T20:00:00Z")), false);
assert.equal(isScheduledQueueTime(new Date("2026-09-28T19:00:00Z")), false);

function response() {
  return {
    statusCode: 200,
    headers: {},
    setHeader(name, value) { this.headers[name] = value; },
    status(value) { this.statusCode = value; return this; },
    json(value) { this.body = value; return this; },
  };
}

const originalSecret = process.env.CRON_SECRET;
const originalEnabled = process.env.CAFE_TASTING_EMAIL_QUEUE_ENABLED;
try {
  process.env.CRON_SECRET = "test-secret";
  process.env.CAFE_TASTING_EMAIL_QUEUE_ENABLED = "false";
  const disabled = response();
  await handler({ method: "GET", headers: { authorization: "Bearer test-secret" } }, disabled);
  assert.equal(disabled.statusCode, 200);
  assert.equal(disabled.body.enabled, false);
  const unauthorized = response();
  await handler({ method: "GET", headers: {} }, unauthorized);
  assert.equal(unauthorized.statusCode, 401);
} finally {
  if (originalSecret === undefined) delete process.env.CRON_SECRET;
  else process.env.CRON_SECRET = originalSecret;
  if (originalEnabled === undefined) delete process.env.CAFE_TASTING_EMAIL_QUEUE_ENABLED;
  else process.env.CAFE_TASTING_EMAIL_QUEUE_ENABLED = originalEnabled;
}

console.log("Cafe Tasting scheduled email queue verification passed.");
