# SSMT admin, import and navigation correction

Requesting/Approving/Release-Authorized Admin and Admin of Record: Tyler, authenticated Buzz identity `12fc010ae7314bd1bf75d7a74c296a93629c12a464ba2aaa406fee08a57d794d`. Design approval `837b2cb3e26cb5f1a9fb50fb3e1dce4ec76bcc1840eba384578d3fcce7000da9` at 2026-10-21T04:15:03Z; navigation defect request `f4665fba07a2799b106923a6ae27ca5450d3761e0a54ee7c17d40bb1794f6584`. Chief solo per originating instruction. No independent clearance is represented.

Bounded Level 3 product change with Level 4 read-only Auth metadata integration. Existing worktree `chief/ssmt-accounts-imports`, base `1a6cdca`. Preserve existing account permissions, canonical workspace, source authority, schemas and email templates. No account or production-data writes for verification.

## Changes and acceptance

- Admin-only Settings -> User administration opens existing Manage access. The members endpoint verifies active membership/admin authority before querying Auth. Only `last_sign_in_at` is added; no Auth object or token is returned. Absence is Never signed in; service failure is Unavailable. Timestamps use browser timezone.
- Add from Menu offers only IT complete sources. `importItems` also rejects unfinished sources. Missing/malformed source FIXYs show a specific inline correction message and disabled checkbox before selection. Whole-menu selection excludes invalid items. Existing valid copy behavior, exact MRNs, prices and independent modifiers remain.
- Explicit Back to Platform from recovery clears in-memory recovery credentials and setup query marker. Reopening SSMT performs ordinary session/sign-in handling. Password success and Back to sign in clear the marker too. Email link opening still does not consume the recovery token.

## Evidence

New domain regression failed before implementation: unfinished source accepted. New API regression failed before implementation: missing sign-in timestamp. Navigation browser regression failed before correction: normal revisit remained Set your password. Full package `npm run verify` passed (17 server/domain tests plus all guards/build) before final version/docs/navigation additions. Full affected browser run after navigation correction passed 45/45. An earlier parallel build run had two timeouts; isolated sequential rerun passed both and all remaining checks. Final release-state runs follow below.

Fresh-frame self-review: Auth access remains server-only/admin-only; partial metadata failures are not misreported as Never signed in. Source FIXY safeguard is preserved rather than generating classification. Recovery cancellation only happens on explicit exit/password success, preserving StrictMode and scanner-safe email landing. No dependencies added. Solo instruction means no independent review/verification/Scribe signoff or LIVE claim.

Rollback: preceding app `2742fc7` / records main `1a6cdca`; current recovery email templates and DB protections remain in place. Request access is a separate requested feature: Tyler selected email at event `b2dbcbf9c427de9fa97bac67131e74ce6e6dbbc2371f3b56fbeb9834df1a5b0f`; notification sender configuration remains unresolved. No fake email-send success or account auto-provisioning is authorized.
