# Plexigent brand experience

Updated 2026-11-20. Canonical implementation architecture. The frozen design brief remains in `Plexigent_Website_Handoff/`; this document describes the actual application.

## Product and preservation boundary

An invitation to discover: wordless scattered signals → feeding caterpillar → chrysalis → connected-dot butterfly/eureka. The opening takes 14.6 seconds of visible playback and then stops. The xi header and direct menu are always available. The approved reference replaces the old word-association experience and perpetual wingbeat. No service grids, explanatory phase captions, backend, analytics, or paid APIs are introduced.

`Plexigent_Website_Handoff/reference/approved-study.fragment.html` remains byte-for-byte unchanged (SHA-256 `11617b5f9b3806803364a6c41d9062c2784f3b9cfd3688c7e288fb0f1750a778`). Original PNGs retain their bytes and their Vite-generated asset filenames. Geometry is externalized without alteration in `src/react-app/experience/geometry.json`.

## Implementation

| File | Responsibility |
|---|---|
| `src/react-app/App.tsx` | React shell, semantic landmarks, heading, shared xi markup, native links and controls |
| `src/react-app/experience/controller.ts` | Scoped DOM controller, route/history changes, focus, input, image readiness, visibility and cleanup |
| `src/react-app/experience/clock.ts` | Elapsed active-time clock; one scheduled frame, pause/resume without hidden time, deterministic completion |
| `src/react-app/experience/opening.ts` | Canvas drawing expressions ported from the exact reference, including consumption and wing emergence |
| `src/react-app/experience/geometry.json` | Original nodes, edges, detail lines, silhouettes, source indices and mesh |
| `src/react-app/experience/domains.ts` | Original domain compositions and 720ms cubic interpolation |
| `src/react-app/experience/pages.ts` | Exact display copy, route mapping and next/back sequence |
| `src/react-app/App.css` | Approved CSS followed by viewport, safe-area, focus and text-size adaptations |
| `scripts/experience.test.mjs` | Reference-command parity, assets, geometry, clock, routing contract and build limits |
| `scripts/controller.test.mjs` | Integration tests using simulated DOM adapters; explicitly not browser evidence |
| `scripts/generate-brand-assets.swift` | Optional macOS authoring utility for exact connected-dot SVG and social PNG |

React does not rerender per animation frame. An effect mounts a scoped controller and returns complete cleanup; Strict Mode remounts dispose listeners, observers, frames, animations and image-load timers. Opening and transition clocks are mutually exclusive. Their shared browser adapter calls both animation-frame methods directly on Window to preserve the native receiver. Web Animations are paused and scrubbed by the same active-time clock as the canvas, so text and geometry pause together. Animation promises are not used, avoiding canceled-promise rejections.

The opening preserves the original drawing expressions, quintic easing, particle ordering, source-to-destination mapping and overlap. The wordmark starts at 13.15s with the original 900ms opacity easing and 1100ms transform easing. The final frame is 14.6s. Domain copy fades out over 180ms and in over 468ms within a 720ms particle transition. Interrupted transitions start from the currently drawn points. Completed visits return to the final Home composition; deliberate Replay restarts. There is no cross-visit persistence.

Images decode before playback. A failed or stalled image (five-second ceiling) falls back to the original silhouette particles; no dependency on remote artwork. Missing Canvas support produces a static SVG from the original butterfly geometry. HTML contains a static brand/contact fallback until React mounts, also covering disabled or failed JavaScript.

## Navigation and input

| Path | Identity | Next |
|---|---|---|
| `/` | Plexigent | Labs |
| `/labs/` | Plexigent Labs | Dynamic UX |
| `/dynamic-ux/` | Plexigent Dynamic UX | Engineering SiX |
| `/engineering-six/` | Plexigent Engineering SiX | Back Office SiX |
| `/back-office-six/` | Plexigent Back Office SiX | Home |
| `/about/` | About Us | Contact |
| `/contact/` | Contact | Home |

History API supplies push/Back/Forward. Direct domain entry skips the intro. Trailing slashes normalize with `replaceState`; unknown paths recover to `/` without adding a history entry. About pairs the original chrysalis artwork with the emergence and partnership statement, superseding the founder credit in the frozen study. Contact is `mailto:info@Plexigent.com`. Modified link clicks retain native new-tab behavior.

Menu hides the scene/footer, pauses motion, focuses the first domain, confines Tab among available header/menu controls, and restores the toggle on Escape/close. Destination changes focus the heading, or the scene while the opening heading is hidden. Focus does not cause scroll jumps. Canvas has a concise accessible narrative description; per-frame state is not announced.

Tap/click links always work. Arrow/Page keys, vertical swipes (>65px, <700ms, vertical >1.5× horizontal), and accumulated wheel intent advance completed, non-overflowing views. One wheel gesture advances once, with an inertia guard. Overflowing/zoomed views retain normal scrolling. Touch is passive and preserves vertical panning and pinch zoom; actual touch arbitration still needs device validation.

## Composition and brand

The demonstration's fixed 640px container becomes a dynamic full-viewport stage with a 450px minimum content region, normal vertical overflow when required, and safe-area padding. The Home artwork and wordmark remain a centered group; extra height adds breathing room. Canvas composition is bounded to 1100px on wide displays. Canvas DPR remains capped at 2. Artwork coordinates and geometry are unchanged within that drawing surface. Long titles may wrap; small footer controls remain at least 44px tall.

Header and wordmark use the approved Arial/Helvetica xi glyphs and masks: cyan forward `/` stroke and i dot, neutral other stroke/stem. This is deliberately the original mark implementation, not an unverified replacement font. Cross-platform glyph-mask appearance remains a browser-review item. No web fonts are downloaded.

`public/plexigent-connected-butterfly.svg` and `public/plexigent-social.png` use the original butterfly coordinates. The previous `/plexigent-butterfly.svg` stays available for existing consumers. No existing `/logo.png` was present locally. No remote asset dependency is added. Title, description, canonical URL, favicon and social metadata are included. Client navigation updates title/description/canonical; no SSR is required.

## Static hosting and release

Vite + React + TypeScript build to `dist/client`. The existing Wrangler project name remains `vite-react-template`; `wrangler.json` now declares only static assets with `single-page-application` fallback. The unused Hono API and Cloudflare Vite plugin are removed. `npm run deploy` checks/builds before Wrangler deployment and explicitly selects `--config wrangler.json`, avoiding stale Cloudflare Vite deployment redirects. The old generated `.wrangler/deploy/config.json` and `dist/vite_react_template` were removed after a dry-run exposed the redirect. No Worker script executes, and no Functions, database, paid image service or form service is needed. Pages Free can also host this same output using `npm run build` and output directory `dist/client`; a hosting-product migration is unnecessary.

Official Cloudflare documentation reviewed 2026-11-20 states static requests are free/unlimited, with no asset-storage charge. Free limits include 20,000 files and 25MiB per individual asset. The built-output test checks those limits. Actual account plan, production branch mapping, custom-domain configuration, current deployment and rollback version have NOT been inspected. The Git remote is `https://github.com/Plexigent/vite-react-template.git`; no deployment workflow is present in `.github`. Account-side Git integration may deploy on push. Do not infer its settings from this repository.

Sources: https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/ ; https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/ ; https://developers.cloudflare.com/pages/platform/limits/

## Verification and continuity

See `checks/RESULTS.md` for actual evidence, `checks/BROWSER_REVIEW.md` for outstanding browser/device checks, and `IMPLEMENTATION_STATUS.md` for current worktree/release state. Command parity proves geometry/calculations, not browser pixels, font matching or frame rate. Neither simulated DOM tests nor frame-clock tests certify physical devices or 60fps.
