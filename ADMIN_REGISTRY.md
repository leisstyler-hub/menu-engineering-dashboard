# Administrator Registry

Single source of truth for which authenticated Buzz identity currently holds which administrative role for the Culinary Tools Platform. Maintained by Scribe, on explicit instruction from any Registered Admin (per GOVERNANCE.md's role-based authority — not restricted to one person).

GOVERNANCE.md defines what each role is authorized to do. This file defines who currently holds it. If this file conflicts with a stale conversation, an agent's memory, or Buzz's native owner/member/bot channel role, this file wins.

Buzz's channel role (owner/member/bot, from `buzz channels members`) is a channel-management permission — it grants no administrative authority and must not be used as a substitute for a registry entry. (Chief itself holds Buzz owner on this channel and is not a Registered Admin.)

## Registry

| Display Name | Buzz Identity | GitHub Identity | Active | Registered Admin | Release-Authorized | Date Added | Added By | Notes |
|---|---|---|---|---|---|---|---|---|
| Tyler | 12fc010ae7314bd1bf75d7a74c296a93629c12a464ba2aaa406fee08a57d794d (npub1zt7qzzh8x99ar0m467n5c2t2jd3fcy4yvjaz42jqdlhq3fta09xsvtukqh) | leisstyler-hub (assumed from repo ownership of menu-engineering-dashboard — unconfirmed, please verify) | Yes | Yes | Yes | 2026-07-25 | Tyler (self) | Confirmed in practice: deploy authorization 2026-07-24, governance audit + doc build-out 2026-07-25. |
| Alex Neuse | 80c0476321696d659089332a38d4c9bcb2f03f33bc264b05ec095b28df93ee0d (Buzz display name "Alex" on this channel) | alexanderneuse | Yes | Yes | Yes | 2026-07-25 | Tyler | Full parity with Tyler, per Tyler 2026-07-25: "yes we want alex to be able to do everything that i can do." Contact: alexander.neuse@compass-usa.com. |

## Maintenance

- Adding a row grants nothing by itself — only the Registered Admin / Release-Authorized columns marked Yes confer authority. Blank or "No" = not authorized.
- Setting Active = No revokes future authority immediately. Do not delete historical rows on removal — mark inactive instead, so past Admin-of-Record attribution in CHANGELOG.md / mission records stays intact.
- Copy identities directly from `buzz channels members` / `buzz users get` output rather than hand-retyping pubkeys — a transcription error here silently grants or denies real authority.
- This file lives in the app repo, which auto-deploys on merge to main (per RELEASE_RUNBOOK.md) — a registry edit goes through the same Release Gate / Release-Authorized Admin approval as any other merge, even though its content is personnel, not app behavior.
