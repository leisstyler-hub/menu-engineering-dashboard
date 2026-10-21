# SSMT password recovery correction - 2026-10-20

Requesting Admin / Admin of Record: Tyler, authenticated Buzz identity 12fc010ae7314bd1bf75d7a74c296a93629c12a464ba2aaa406fee08a57d794d. Report event 7544eed4ad98a108e1f5f1672c59335656315370b87b69ab9003987685cbb58c; solo direction 79d5f0059c118b25899fec95ed77d7eebe2ec72a3ef176c895ada6985ffa2484.

Scope: restore approved email recovery workflow; no role, authentication policy, schema, account, password, menu-data or API changes. Existing branch chief/ssmt-accounts-imports, base 9776ad7. Chief sole implementer and verifier as requested; no independent review or Scribe clearance claimed. Classified Level 3 recovery UI defect with an existing authentication boundary.

Observed: screenshot ordinary SSMT Sign in after email reset link. Code only selected setup after a successful token exchange; a setup URL without access_token silently continued to login. Provider errors in the fragment were ignored. Exact reason Tyler's original token was missing/unusable remains unconfirmed; no original token/link was requested, read or consumed.

Correction: missing recovery token shows a dedicated reset-email form with no password required; rejected exchange also offers recovery; valid token still opens Set your password; recovery fragments are scrubbed before monitoring.

Evidence: tests/browser/ssmt-recovery.spec.js first produced 2 failures / 1 pass against original behavior. Final affected suite (recovery, accounts/reuse, ssmt-tool, landing-tool-sections) 44/44 passed using synthetic tokens and all API calls intercepted in recovery tests. Valid test submits a synthetic new password; rejected-exchange test requests a fresh email with no old password. Full npm run verify passed including production build. Logs .scratch/recovery-red.log, .scratch/recovery-final-browser.log, .scratch/recovery-verify.log. No production writes or emails from these tests.

Rollback: previous production dpl_ExgMeMnaxroZU6mkHVTju2eeUtBD / 9776ad7. Keep all existing database audit guards/schema. No data restore needed for UI-only rollback.

State before publish: IMPLEMENTED and locally verified. Real-user recovery completion is pending. Do not label LIVE without the required independent clearance.

Deployment: application 8be2aa2fb0a4b6dcf760656b183f115a169da139, dpl_4BKZTfZtiRAhaBDXPJksdHE69nby READY, production alias confirmed by Vercel. Four deployed-bundle recovery checks passed with all API requests intercepted. Actual production GET status and expired-link screen verified separately with all mutations blocked; screenshot WORK_LOGS/SSMT_RECOVERY_PRODUCTION_2026_10_20.png. No real password or email was used by verification. State DEPLOYED; solo execution, independent clearance and real-user success pending.


## Follow-up: missing email report

Tyler event fe80df43401b7fe1a16272ed9775baf2756ac4f4adfcaeac33ae2d6029f0b3f5: newest email not received. Read-only existing-account checks confirmed active membership and normalized email; last recorded send initially 02:27:34Z. One requested direct recovery retry returned 200 and advanced recovery_sent_at to 2026-10-21T02:48:56.497898Z. Inbox delivery not verified. last_sign_in_at advanced to 02:49:03Z; email scanner is a hypothesis, not an established cause. Available auth audit query returned no entries. No account/password/role changes or operational writes were made.

Confirmed API defect: recover errors were discarded by catch(() => {}), so provider failure returned success. Failing isolated test reproduced this path; correction normalizes email once and returns bounded 429/503 recovery failure messages. Unknown addresses retain generic replies and do not trigger recovery. Test cases cover normalized email, rate limiting, provider outage, acceptance and unregistered address. No credentials or links retained in test artifacts.

Official references: https://supabase.com/docs/guides/auth/auth-smtp documents built-in mail limits and best-effort delivery. https://supabase.com/docs/guides/auth/auth-email-templates documents link-prefetch consumption. Neither establishes the cause of this account's missing email; no SMTP/template/security-policy change is authorized or made by this correction.

Follow-up validation: original isolated test failed on unnormalized email/provider error suppression; 14/14 final domain/API tests passed, 13/13 affected recovery/accounts browser checks passed, full npm run verify including build passed. Source base d8362e2; only API reset branch, version and records changed; no schema/auth-policy/menu changes. Rollback d8362e2 retains the dedicated recovery screen. Solo review, no independent clearance.
