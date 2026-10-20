import { PGlite } from "../../.scratch/db-test/node_modules/@electric-sql/pglite/dist/index.js";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
const db = new PGlite();
await db.exec(
  `create role anon; create role authenticated; create role service_role; create schema auth; create table auth.users(id uuid primary key,email text,deleted_at timestamptz); create table public.app_records(record_id text primary key,record_payload jsonb,updated_at timestamptz default now(),updated_at_text text);`,
);
const sql = readFileSync("supabase/ssmt-accounts.sql", "utf8");
await db.exec(sql);
const admin = "11111111-1111-4111-8111-111111111111",
  chef = "22222222-2222-4222-8222-222222222222";
await db.query("insert into auth.users(id) values($1),($2)", [admin, chef]);
await db.query(
  "insert into ssmt_members(user_id,email,display_name,work_role,is_admin) values($1,'admin@example.test','Admin','Chef',true)",
  [admin],
);
const old = {
    menus: [{ id: "safe", items: [{ mrn: "000123.10", price: 0 }] }],
  },
  next = {
    "Record ID": "ssmt|workspace|current",
    ssmtPayloadEncoding: "gzip-base64-json-v1",
    compressedWorkspace: "test",
  };
await db.query(
  "insert into app_records(record_id,record_payload) values($1,$2)",
  ["ssmt|workspace|current", old],
);
await db.exec(readFileSync('supabase/ssmt-protect-workspace.sql','utf8'));
await assert.rejects(db.query('update app_records set record_payload=$1 where record_id=$2',[{bad:true},'ssmt|workspace|current']),/audited commit/);
await assert.rejects(db.query('delete from app_records where record_id=$1',['ssmt|workspace|current']),/deletion is prohibited/);
const same = await db.query("select record_payload from app_records");
assert.deepEqual(same.rows[0].record_payload, old);
await db.query("select ssmt_commit_workspace($1,$2,$3,$4,$5)", [
  admin,
  old,
  next,
  [{ action: "edited" }],
  "Chef",
]);
assert.equal((await db.query("select * from ssmt_audit")).rows.length, 1);
assert.deepEqual(
  (await db.query("select record_payload from ssmt_workspace_backups")).rows[0]
    .record_payload,
  old,
);
await assert.rejects(
  db.query("select ssmt_commit_workspace($1,$2,$3,$4,$5)", [
    admin,
    old,
    next,
    [],
    "Chef",
  ]),
  /Workspace changed/,
);
assert.equal(
  (await db.query("select * from ssmt_workspace_backups")).rows.length,
  1,
);
// Force audit failure: the entire write including backup must roll back.
await db.exec(
  "alter table ssmt_audit add constraint force_failure check (jsonb_array_length(events)=0) not valid;",
);
await assert.rejects(
  db.query("select ssmt_commit_workspace($1,$2,$3,$4,$5)", [
    admin,
    next,
    { ...next, changed: true },
    [{ action: "edited" }],
    "Chef",
  ]),
);
assert.deepEqual(
  (await db.query("select record_payload from app_records")).rows[0]
    .record_payload,
  next,
);
assert.equal(
  (await db.query("select * from ssmt_workspace_backups")).rows.length,
  1,
);
await db.exec("alter table ssmt_audit drop constraint force_failure;");
await assert.rejects(
  db.query("select ssmt_set_member($1,$1,null,$2,$3,false,false)", [
    admin,
    "Admin",
    "Chef",
  ]),
  /last active admin/,
);
await db.query("select ssmt_set_member($1,$2,$3,$4,$5,false,true)", [
  admin,
  chef,
  "chef@example.test",
  "Chef",
  "IT",
]);
await db.exec("set role anon;");
await assert.rejects(db.query("select * from ssmt_audit"), /permission denied/);
await assert.rejects(
  db.query("select ssmt_commit_workspace($1,$2,$3,$4,$5)", [
    admin,
    next,
    next,
    [],
    "Chef",
  ]),
  /permission denied/,
);
await db.exec("reset role;set role service_role;");
await assert.rejects(db.query("delete from ssmt_audit"), /permission denied/);
await assert.rejects(
  db.query("update ssmt_members set active=false"),
  /permission denied/,
);
await db.exec("reset role;");
console.log(
  "Isolated PostgreSQL: additive setup, exact original payload, atomic backup/audit/save, conflict rejection, forced-failure rollback, last-admin guard, anonymous denial and service-role append-only grants passed.",
);
await db.exec("delete from ssmt_members;");
await db.query("update auth.users set email=$1 where id=$2", [
  "tyler.leiss@compass-usa.com",
  admin,
]);
await db.exec(readFileSync("supabase/ssmt-bootstrap-admin.sql", "utf8"));
assert.equal(
  (await db.query("select * from ssmt_members")).rows[0].is_admin,
  true,
);
await assert.rejects(
  db.exec(readFileSync("supabase/ssmt-bootstrap-admin.sql", "utf8")),
  /enrollment already exists/,
);
await db.exec("rollback;");
console.log(
  "One-time initial admin bootstrap and repeated-enrollment rejection passed.",
);
await db.close();
