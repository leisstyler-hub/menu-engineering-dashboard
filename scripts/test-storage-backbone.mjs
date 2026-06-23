import assert from "node:assert/strict";

import {
  buildBackboneRows,
  getBackboneToolFromContext,
  normalizeBackboneRows,
  retentionDateFor,
} from "../src/integrations/storage/backboneRecords.js";

const now = new Date("2026-06-23T12:00:00.000Z");

assert.equal(getBackboneToolFromContext({ tool: "Lean Tool" }), "lean");
assert.equal(getBackboneToolFromContext({ cafe: "Doppler", week: "Jun 15, 2026 - Jun 19, 2026" }), "rotation");

assert.equal(retentionDateFor(now).toISOString(), "2028-06-23T12:00:00.000Z");

const rows = buildBackboneRows([
  {
    "Record ID": "rotation|2026-06-15|South|Doppler",
    "Parent Record ID": "",
    "Record Type": "Rotation Header",
    "Status": "Submitted",
    "District": "South",
    "Café / Unit": "Doppler",
    "Date Range Label": "Jun 15, 2026 - Jun 19, 2026",
    "Station Key": "global",
    "Submitted At": "Jun 15, 8:16 AM",
    "Updated At": "Jun 15, 8:16 AM",
  },
  {
    "Record ID": "rotation|2026-06-15|South|Doppler|global|1",
    "Parent Record ID": "rotation|2026-06-15|South|Doppler",
    "Record Type": "Global Selection",
    "Status": "Submitted",
    "District": "South",
    "Café / Unit": "Doppler",
    "Date Range Label": "Jun 15, 2026 - Jun 19, 2026",
    "Station Key": "global",
    "Menu Item / Selection": "Bibimbowl",
  },
], { tool: "Neighborhood Rotations", week: "Jun 15, 2026 - Jun 19, 2026" }, { now });

assert.equal(rows.length, 2);
assert.equal(rows[0].record_id, "rotation|2026-06-15|South|Doppler");
assert.equal(rows[0].tool, "rotation");
assert.equal(rows[0].status, "Submitted");
assert.equal(rows[0].district, "South");
assert.equal(rows[0].cafe_unit, "Doppler");
assert.equal(rows[0].retain_until, "2028-06-23T12:00:00.000Z");
assert.equal(rows[1].parent_record_id, "rotation|2026-06-15|South|Doppler");
assert.equal(rows[1].record_payload["Menu Item / Selection"], "Bibimbowl");

const normalized = normalizeBackboneRows(rows);
assert.deepEqual(normalized[1]["Menu Item / Selection"], "Bibimbowl");
assert.deepEqual(normalized[1].__supabaseRecordId, "rotation|2026-06-15|South|Doppler|global|1");

console.log("storage backbone translator tests passed");
