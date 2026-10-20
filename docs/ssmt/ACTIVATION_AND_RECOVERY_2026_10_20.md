# SSMT activation and recovery package — prepared, not executed

Request: Tyler, Buzz event efa9b429e4cd520447f8c2a40557e9916bec16985057798fce8708f14dddd68c (2026-10-20T20:41:47Z), after the agreed design and straight-deployment estimate. Solo execution; independent release clearance unavailable. Ordinary application deployment is authorized. Production schema changes need the concrete approval required by GOVERNANCE.md / RELEASE_RUNBOOK.md. The initial account setup itself was explicitly requested and follows that activation. Nothing in this document authorizes deleting or rewriting existing menus/items.

## Exact protected actions

1. Inspect the production project `pzilyzqhatthctgsjwtt`: canonical app_records row exists, actual column types match the migration, and no conflicting ssmt_members/ssmt_audit/ssmt_workspace_backups objects or grants exist. Check existing Auth email configuration, sender delivery and redirect allowlist. Refresh the production backup immediately before activation; the October 20 snapshot alone is not sufficient if the workspace has changed.
2. Apply `supabase/ssmt-accounts.sql` in its transaction. This creates three service-only tables and two RPC functions; it does not update, replace, delete, or reseed the existing app_records row. Direct anonymous/authenticated access and direct service-role mutation of the new tables are denied. The commit RPC atomically locks/checks the canonical payload, stores its prior compressed value, appends server-derived identity/history, and updates only that canonical record. Existing app_records schema, source precedence, MRNs, prices and menus remain intact during installation.
3. Issue the requested Supabase Auth invitation for `tyler.leiss@compass-usa.com` with redirect `https://project-d8v25.vercel.app/?ssmt=setup`, then apply `supabase/ssmt-bootstrap-admin.sql`. This resolves the exact Auth UUID from the trusted Auth table, refuses ambiguous/deleted users and refuses a second initial enrollment. It adds Tyler as Chef plus separate Admin with an audit entry. It never sets the password posted in chat. If the Auth account already exists, do not replace it: verify that identity and use a private recovery/setup link instead of creating a duplicate.
4. Set server-only `SSMT_ACCOUNTS_ENABLED=true`, `SSMT_APP_ORIGIN=https://project-d8v25.vercel.app`, and ensure existing server-only `SUPABASE_URL` and service credential resolve to that exact project. Add the exact setup redirect to Supabase's allowlist. No secret is put in client configuration, logs, code or this file. Keep the feature disabled until schema and initial membership have been verified.
5. Deploy the approved application candidate and apply `supabase/ssmt-protect-workspace.sql` as the final brief SSMT write cutover. Its canonical-row trigger blocks direct insert/update/delete, including legacy deployment save routes; only the audited RPC may update the existing row, and deleting it is always prohibited. No other app_records row is affected. Do not claim that historical deployment reads are protected: verify Vercel protection for older deployment URLs before claiming SSMT-only account confidentiality.
6. Confirm identity, API protection, public calendar projection and exact version. Production browser tests must intercept every storage/account mutation; do not save a throwaway menu or edit the live workspace. Real email delivery and Tyler's private password choice require an actual completed setup link, so do not label them verified from mocks. Keep the real setup link out of chat and artifacts.

References for Auth behavior: https://supabase.com/docs/guides/auth/redirect-urls ; https://supabase.com/docs/guides/auth/users ; https://github.com/supabase/auth/blob/master/openapi.yaml . Redirect must be allowlisted or Supabase can use Site URL instead. The app strips its setup fragment before initializing monitoring, uses memory only until exchanging into a Secure/HttpOnly/SameSite cookie, and verifies membership on every protected request.

## Backup evidence

Read-only production GET at 2026-10-20T20:56:02Z returned 88 menus, 2,361 stored rows and 872 modifier groups. Expanded canonical JSON SHA-256: `853d7f8bf2ddc877bbe9d1acf07c98d8a667ac0845d8370662d281ad2559a500`. The durable local private copy and manifest are in `C:/Users/leiss/.buzz/WORK_LOGS/SSMT_BACKUP_2026_10_20_205602/`, outside Git. This is an expanded API record, not a raw database snapshot. Exact compress/decompress JSON equality was verified. An authenticated `BEGIN READ ONLY` preflight at 2026-10-20T21:14:39Z also captured the raw canonical row and all 18 column types. Its private file is `RAW_DATABASE_PREFLIGHT.json` in the same backup directory, SHA-256 `1486d6f1fd9a05b0ed39baa9ed199c854ba5b50199d7ee3da1f5c3f4ba60e63d`. A separate isolated PostgreSQL table restored all 18 raw column values with exact JSON equality under UTC. The canonical row still has 88 menus / 2,361 rows / 872 groups; the three new tables and the requested Auth user are absent. Production schema/records were not mutated by this read-only preflight. Refresh if edited concurrently; never overwrite an active user's later work using this earlier backup.

## Recovery

Before activation record the preceding deployment ID, Git SHA, current Auth/SSMT activation configuration, current workspace hash and read-only row inventory. Application rollback retains all new tables, histories and snapshots. Keep the audited save API/database guard active, or keep the older UI read-only while recovering. The canonical guard intentionally rejects old unaudited saves; removing it is a separate protected rollback action. Disabling account protection reopens the preceding shared-passcode workflow, so it is an explicit rollback choice, not an automatic fallback on a failed request. A data restore is a separate protected operation: quiesce edits, capture the current row again, select the authorized prior backup, restore only `ssmt|workspace|current`, compare exact fields/hash/counts, and document the recovery. Never drop new tables or erase audit evidence to roll back the UI.

## Verification commands

`node --test tests/ssmt/*.test.mjs`

Disposable PostgreSQL test engine only, not a product dependency: `npm install --prefix .scratch/db-test --cache .scratch/npm-cache --no-save --ignore-scripts @electric-sql/pglite@0.5.10`, then `node tests/ssmt/database.integration.mjs`.

`npm run verify`

`$env:PLAYWRIGHT_BROWSERS_PATH='C:/Users/leiss/AppData/Local/ms-playwright'; node scripts/run-playwright.mjs tests/browser/ssmt-accounts-reuse.spec.js tests/browser/ssmt-tool.spec.js`

`node tests/ssmt/restore-backup.mjs <private-RAW_DATABASE_PREFLIGHT.json-path>` rehearses the exact raw-row restore in the disposable database only.

The full local browser package is also required; distinguish existing baseline failures from new failures, and never aim that broad suite at production. Some legacy tests exercise unmocked save paths and are unsafe against the production base URL.

## Known limits before activation

No real Auth email, enrollment, production schema execution, protected Vercel deployment or real account session has been verified yet. Read-only production schema preflight, raw-row backup and isolated restore have been verified. Session expiry requires sign-in again (no refresh token is persisted). Activity search is explicitly scoped to the currently displayed page, with older/newer pagination. Backups retain each prior saved payload and need a separately approved long-term capacity/retention policy; no automatic pruning is included. The existing monolithic workspace remains subject to platform request limits; an oversized request must fail without replacing data. Completed-menu reference snapshots remain a proposal: matching uses menus currently in IT complete, not an invented previously-approved snapshot policy. Centric import compatibility and personalized task dashboards remain separate.
