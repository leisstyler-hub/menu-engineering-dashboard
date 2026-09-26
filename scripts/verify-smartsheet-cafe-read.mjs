import assert from "node:assert/strict";
import handler from "../api/smartsheet/records.js";
const originalFetch = globalThis.fetch;
const originalEnv = { token: process.env.SMARTSHEET_ACCESS_TOKEN, defaultSheet: process.env.SMARTSHEET_SHEET_ID, cafeSheet: process.env.SMARTSHEET_CAFE_TASTING_SHEET_ID };
function responseRecorder() {
  return { statusCode: 200, headers: {}, setHeader(name, value) { this.headers[name] = value; }, status(value) { this.statusCode = value; return this; }, json(value) { this.body = value; return this; } };
}
try {
  process.env.SMARTSHEET_ACCESS_TOKEN = "test-token";
  process.env.SMARTSHEET_SHEET_ID = "default-sheet";
  process.env.SMARTSHEET_CAFE_TASTING_SHEET_ID = "cafe-sheet";
  let requestedUrl = "";
  globalThis.fetch = async (url) => {
    requestedUrl = String(url);
    return new Response(JSON.stringify({ name: "Cafe Tasting Submission Worksheet", columns: [{ id: 1, title: "Date" }, { id: 2, title: "Cafe Name" }, { id: 3, title: "Dish Name" }], rows: [{ id: 10, cells: [{ columnId: 1, value: "2026-09-25" }, { columnId: 2, value: "Nitro" }] }] }), { status: 200, headers: { "content-type": "application/json" } });
  };
  const readResponse = responseRecorder();
  await handler({ method: "GET", query: { dataset: "cafe-tasting" } }, readResponse);
  assert.equal(readResponse.statusCode, 200);
  assert.equal(requestedUrl, "https://api.smartsheet.com/2.0/sheets/cafe-sheet");
  assert.equal(readResponse.body.sheetName, "Cafe Tasting Submission Worksheet");
  assert.deepEqual(readResponse.body.columns, ["Date", "Cafe Name", "Dish Name"]);
  assert.equal(readResponse.body.count, 1);
  let writeFetchCalled = false;
  globalThis.fetch = async () => { writeFetchCalled = true; throw new Error("Cafe Tasting write path must not call Smartsheet"); };
  const writeResponse = responseRecorder();
  await handler({ method: "POST", query: { dataset: "cafe-tasting" }, body: { action: "upsertRecords" } }, writeResponse);
  assert.equal(writeResponse.statusCode, 405);
  assert.equal(writeResponse.headers.Allow, "GET");
  assert.equal(writeResponse.body.message, "Cafe Tasting access is read-only");
  assert.equal(writeFetchCalled, false);
  console.log("Cafe Tasting read-only Smartsheet selector verification passed.");
} finally {
  globalThis.fetch = originalFetch;
  for (const [name, value] of Object.entries({ SMARTSHEET_ACCESS_TOKEN: originalEnv.token, SMARTSHEET_SHEET_ID: originalEnv.defaultSheet, SMARTSHEET_CAFE_TASTING_SHEET_ID: originalEnv.cafeSheet })) {
    if (value === undefined) delete process.env[name]; else process.env[name] = value;
  }
}
