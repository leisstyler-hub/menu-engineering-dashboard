// Isolated PostgreSQL restore rehearsal. Never connects to production.
import { PGlite } from "../../.scratch/db-test/node_modules/@electric-sql/pglite/dist/index.js";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
const path = process.argv[2];
if (!path)
  throw new Error("Supply the private RAW_DATABASE_PREFLIGHT.json path.");
const bytes = readFileSync(path),
  data = JSON.parse(
    bytes[0] === 255 && bytes[1] === 254
      ? bytes.toString("utf16le").replace(/^\uFEFF/, "")
      : bytes.toString("utf8").replace(/^\uFEFF/, ""),
  );
const snapshot = data.rows[0].snapshot,
  row = snapshot.canonical_row;
assert.equal(row.record_id, "ssmt|workspace|current");
const types = new Set(["text", "boolean", "jsonb", "timestamp with time zone"]);
const columns = snapshot.columns.map((column) => {
  if (!/^[a-z_]+$/.test(column.name) || !types.has(column.type))
    throw new Error("Unsupported column type; explicit review required.");
  return `"${column.name}" ${column.type}`;
});
const db = new PGlite();
await db.exec("set time zone 'UTC';");
await db.exec(`create table restored_workspace(${columns.join(",")});`);
await db.query(
  "insert into restored_workspace select * from jsonb_populate_record(null::restored_workspace,$1::jsonb)",
  [row],
);
const readback = (
  await db.query(
    "select to_jsonb(restored_workspace) as row from restored_workspace",
  )
).rows[0].row;
const sorted = (value) =>
  Array.isArray(value)
    ? value.map(sorted)
    : value && typeof value === "object"
      ? Object.fromEntries(
          Object.keys(value)
            .sort()
            .map((key) => [key, sorted(value[key])]),
        )
      : value;
assert.ok(
  JSON.stringify(sorted(readback)) === JSON.stringify(sorted(row)),
  "Isolated restore differs; inspect the private backup locally.",
);
console.log(
  JSON.stringify(
    {
      result: "Exact raw-row JSON equality after isolated PostgreSQL restore",
      backupSha256: createHash("sha256").update(bytes).digest("hex"),
      columns: columns.length,
      recordId: row.record_id,
      productionWrites: 0,
    },
    null,
    2,
  ),
);
await db.close();
