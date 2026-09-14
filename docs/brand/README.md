# Compass One Culinary artwork

Tyler approved the generated Compass One Culinary concept in the September 14, 2026 Codex task and authorized implementation and deployment. The approved source concept is retained by the task at `outputs/approved-compass-culinary-concept.png`; it is not a pre-existing corporate vector master. The production SVGs are clean native recreations of that approved visual concept, preserving lowercase lettering, the gold circle, white wordmark, and spaced CULINARY subtitle.

- `public/brand/compass-one-culinary.svg`: horizontal entrance/header artwork.
- `public/brand/compass-one-culinary-icon.svg`: square, stacked app-icon composition with dark background and crop padding.
- `public/apple-touch-icon.png`: 180px Apple touch icon.
- `public/android-chrome-192x192.png` and `public/android-chrome-512x512.png`: Android/PWA icons.
- `public/favicon-16x16.png`, `public/favicon-32x32.png`, and `public/favicon.ico`: gold one-circle at small sizes for readability.

## Regeneration

Install the project dependencies and provide Playwright Chromium. Run `node scripts/build-brand-icons.mjs` from the repository root. If Chromium is held in a shared runtime, set `PLAYWRIGHT_BROWSERS_PATH` to that runtime's browser-cache directory before running the script; this is an environment-specific path, not a committed machine setting. The script renders the SVG with Playwright at each output size and packages 16/32/48px PNG representations into the ICO. Regeneration overwrites the listed raster icons.

## Behavior and verification limits

Version `2026.09.14.001-compass-culinary-entrance` introduces a 1,200 ms once-per-session entrance. Reduced motion, unavailable session storage, interaction, image error, and a 1,600 ms watchdog keep the site accessible. Browser emulation and asset/configuration checks are distinct from physical-device installation testing: physical iOS/Android home-screen installation has not been tested. Existing installed or saved home-screen icons can remain cached; users may need to remove the shortcut and add the site to their home screen again to see the new artwork.

Production: https://project-d8v25.vercel.app
Repository: https://github.com/leisstyler-hub/menu-engineering-dashboard
Release evidence and exact current state are recorded in `AI_HANDOFF.md` and `CHANGELOG.md`.
