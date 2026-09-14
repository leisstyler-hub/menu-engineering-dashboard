# Compass One Culinary artwork

Tyler approved the generated Compass One Culinary concept in the September 14, 2026 Codex task and authorized implementation and deployment. The approved source concept is retained by the task at `outputs/approved-compass-culinary-concept.png`; it is not a pre-existing corporate vector master. The production SVGs are clean native recreations of that approved visual concept, preserving lowercase lettering, the gold circle, white wordmark, and spaced CULINARY subtitle.

- `public/brand/compass-one-culinary.svg`: horizontal entrance/header artwork.
- `public/brand/compass-one-culinary-icon.svg`: square app-icon canvas containing the unchanged horizontal artwork with dark background and crop padding; supersedes the initial stacked composition.
- `public/apple-touch-icon.png`: 180px Apple touch icon.
- `public/android-chrome-192x192.png` and `public/android-chrome-512x512.png`: Android/PWA icons.
- `public/favicon-16x16.png`, `public/favicon-32x32.png`, and `public/favicon.ico`: gold one-circle at small sizes for readability.

## Regeneration

Install the project dependencies and provide Playwright Chromium. Run `node scripts/build-brand-icons.mjs` from the repository root. If Chromium is held in a shared runtime, set `PLAYWRIGHT_BROWSERS_PATH` to that runtime's browser-cache directory before running the script; this is an environment-specific path, not a committed machine setting. The script extracts the horizontal SVG artwork as a single group, centers and scales it into a square canvas without rearranging its words, writes the derived icon SVG, and renders it with Playwright at each output size and packages 16/32/48px PNG representations into the ICO. Regeneration overwrites the listed raster icons.

## Behavior and verification limits

Version `2026.09.14.002-installed-brand-handoff` keeps the 1,200 ms once-per-session entrance in normal browser mode. Installed standalone/minimal-ui and iOS `navigator.standalone` modes omit the second website logo and use only a 600 ms outward reveal, allowing the browser/OS native splash to supply the launch branding. Icon references use `v=20260914-2` to request the revised horizontal composition. Reduced motion, unavailable session storage, interaction, image error, and a 1,600 ms watchdog keep the site accessible. Mocked browser display-mode and icon-pixel checks are distinct from physical-device installation/startup testing: physical iOS/Android home-screen installation has not been tested. Existing installed or saved home-screen icons can remain cached; users may need to remove the shortcut and add the site to their home screen again to see the new artwork.

Production: https://project-d8v25.vercel.app
Repository: https://github.com/leisstyler-hub/menu-engineering-dashboard
Release evidence and exact current state are recorded in `AI_HANDOFF.md` and `CHANGELOG.md`.

Chrome builds its native splash from the manifest icon and other metadata: [Web app manifest](https://web.dev/articles/add-manifest). Installed metadata refresh is browser-controlled; cached installations may require reinstalling: [Updating a PWA](https://web.dev/learn/pwa/update). Changing the web overlay cannot suppress a native splash already rendered by the operating system.
