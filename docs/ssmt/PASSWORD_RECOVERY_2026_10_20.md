# SSMT password recovery correction - 2026-10-20

Requesting Admin / Admin of Record: Tyler, authenticated Buzz identity 12fc010ae7314bd1bf75d7a74c296a93629c12a464ba2aaa406fee08a57d794d. Report event 7544eed4ad98a108e1f5f1672c59335656315370b87b69ab9003987685cbb58c; solo direction 79d5f0059c118b25899fec95ed77d7eebe2ec72a3ef176c895ada6985ffa2484.

Scope: restore approved email recovery workflow; no role, authentication policy, schema, account, password, menu-data or API changes. Existing branch chief/ssmt-accounts-imports, base 9776ad7. Chief sole implementer and verifier as requested; no independent review or Scribe clearance claimed. Classified Level 3 recovery UI defect with an existing authentication boundary.

Observed: screenshot ordinary SSMT Sign in after email reset link. Code only selected setup after a successful token exchange; a setup URL without access_token silently continued to login. Provider errors in the fragment were ignored. Exact reason Tyler's original token was missing/unusable remains unconfirmed; no original token/link was requested, read or consumed.

Correction: missing recovery token shows a dedicated reset-email form with no password required; rejected exchange also offers recovery; valid token still opens Set your password; recovery fragments are scrubbed before monitoring.

Evidence: tests/browser/ssmt-recovery.spec.js first produced 2 failures / 1 pass against original behavior. Final affected suite (recovery, accounts/reuse, ssmt-tool, landing-tool-sections) 44/44 passed using synthetic tokens and all API calls intercepted in recovery tests. Valid test submits a synthetic new password; rejected-exchange test requests a fresh email with no old password. Full npm run verify passed including production build. Logs .scratch/recovery-red.log, .scratch/recovery-final-browser.log, .scratch/recovery-verify.log. No production writes or emails from these tests.

Rollback: previous production dpl_ExgMeMnaxroZU6mkHVTju2eeUtBD / 9776ad7. Keep all existing database audit guards/schema. No data restore needed for UI-only rollback.

State before publish: IMPLEMENTED and locally verified. Real-user recovery completion is pending. Do not label LIVE without the required independent clearance.
