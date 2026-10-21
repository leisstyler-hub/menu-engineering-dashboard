# SSMT release execution ? October 21, 2026 UTC

Release target: integrated application a44ad8e1b375099d353f4b79dcf4d297b19a3dc6, version 2026.10.20.002-ssmt-accounts-reuse. Includes upstream c868953 commissary scroll release without removing its changes.

Authority: Tyler, authenticated Buzz identity in ADMIN_REGISTRY.md. Original build/deploy event efa9b429e4cd520447f8c2a40557e9916bec16985057798fce8708f14dddd68c; explicit prepared-schema approval at 2026-10-20T21:54:15Z; deployment reiterated in event 4ade2cc9f80858797d4d30db38f8849eb2a2fbc3870b41955c86e3616ebd5f0d. Chief retains execution; only Reviewer/Verifier were added under the narrow solo exception.

Reviewer approved original 3a08f02 with non-blocking notes; integration a44ad8e approved in event 09fa0f7ea4d422941622dcc7cdf237567f6219dc65c34344f68edae903feedf0. Verifier cleared original checks and completed broad suite: 116 passed / 41 failed / 157 total, failure names exactly matching documented base. Candidate collection grew from 154 to 157 after acceptance additions; base remains 148. Integration independently passed 44/44 focused SSMT/Home/commissary tests in event 25be5aa0be404f9134c0719bb1aa02300cec96fc0f1fb1b8076242c46a54bfbb. Chief ran full npm run verify on integrated a44ad8e; passed. Broad suite is not green.

Fresh private raw backup: WORK_LOGS/SSMT_ACTIVATION_2026_10_21_RAW_PREFLIGHT.json, SHA-256 07a96c966037432bfddd4cb4081dba150a16f0f692485abdcbae38a39ec252a2. Isolated PostgreSQL recovery compared all 18 columns exactly; productionWrites 0. Never commit raw records or setup links.

Executed: additive ssmt-accounts.sql; exact canonical-row equality against fresh backup verified afterward. Existing single invited Auth identity reconciled against its prepared UUID; one-time bootstrap enrolled Chef plus separate Admin. No menu/item write. Added exact setup URL to existing Auth redirect allowlist, preserving prior entries and Site URL. SSMT_APP_ORIGIN and SSMT_ACCOUNTS_ENABLED production variables prepared for next deployment. Setup email not yet sent; no password has been set by Chief.

Automatic approval review rejected rerunning invite generation because an Auth identity already existed. Chief did not repeat it: reconciled the existing UUID read-only and enrolled that same account. No duplicate user created.

Account-mode loading intentionally avoids legacy whole-workspace seed merging/load normalization so activation does not transform stored menus, exact IDs, prices or modifiers. Imported changes use explicit validation; this is not a guarantee for arbitrary malformed payloads. Non-blocking token cleanup hardening remains a follow-up.

Rollback preceding production: dpl_3f3eLU38QawM6kBakkefv38w5jrS / c868953c54262056c8eb62fb7ba4251d125a94b4. Preserve new tables/history/backups; retain audited write guard or keep older UI read-only. Do not remove the guard or restore historical data without separately approved recovery. See ACTIVATION_AND_RECOVERY_2026_10_20.md.

Current state: release prepared, not yet pushed/deployed. Canonical write guard cutover and production proof remain pending. Real mailbox delivery/password choice is not verified. No independent Scribe clearance exists; do not claim LIVE without required durable-record reconciliation.
