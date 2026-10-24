# W&P Clear filters

Request: Tyler, Buzz event `fbf28d6522d1cb6dbce6d3d0a259c9529fd484e2eb33bba8410116fb4fcd0219`; screenshot clarification `8b74ad3dd193ffcd0c546708e7de50db5e1b97ac272d96b233168c1a72207572`.

Owner: Chief, solo implementation and self-review. Branch: chief/solo-governance. Base HEAD: 7ce8284050de06f4d88331a70252166acdb401cb; upstream aa7a31f659e10c7aa4fa40c04e7e12941a800fa8 confirmed by fetch.

The existing All menus reset now visibly and accessibly reads Clear filters. It resets selected menus and menu search with the existing handler. Version: 2026.10.24.001-wp-clear-filters. Browser selectors follow the new accessible name. No operational data writes.

Validation: full npm run verify passed after installing dependencies from the frozen pnpm lockfile. Build passed. Four affected browser files reported 18 passed, one skipped (optional saved catalog absent). The first run had one preview asset-read failure during a concurrent build; rerunning after the build resolved it. No product code was changed in response. Diff and timestamp checks passed. This record describes a local candidate, not a production deployment.

Rollback: revert the Clear filters application commit. Pending earlier changelog-standard commit is separate. Preserve both historical changelog entries and exact release states.
