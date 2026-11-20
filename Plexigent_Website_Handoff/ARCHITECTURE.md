# Production architecture direction

Status: design brief for the actual repository; implementation has not yet been integrated there.

## Preservation boundary

Preserve the visual and behavioral result. Replacing the old component structure, animation engine, state model, CSS organization, or build setup is permitted. A minimal diff is not the goal. Keep unrelated functionality and user changes intact.

The approved study is vanilla JavaScript, Canvas 2D, native Web Animations, and CSS. It is self-contained. The earlier approved technology proposal was React, Vite, TypeScript, custom CSS, Canvas/SVG, and GSAP where beneficial. These are compatible directions: implement cleanly using the actual repository, and use GSAP only if it improves orchestration while faithfully reproducing the reference. Do not replace custom motion with library presets.

## Free hosting

Build to static HTML/CSS/JavaScript/assets served by Cloudflare Pages Free. Client-side graphics and interaction do not require server compute. The design needs no runtime backend, database, paid image service, hosted AI API, or form service. Contact can remain a mailto link.

Cloudflare's documentation checked in this conversation states that static asset requests on Pages are free and unlimited, with 500 builds/month on Free, up to 20,000 files and 25 MiB per asset. Functions invoke Workers quotas and are unnecessary for this design. Existing domain registration is separate from the hosting choice. Verify the project's actual configuration and current terms before release.

If the repository already uses another static Cloudflare deployment mechanism, compare it with these requirements and retain it if appropriate. There is no visual requirement to migrate hosting products. Do not introduce a paid service to accomplish an effect that the browser can render locally.

## Suggested responsibility boundaries

| Module | Responsibility |
|---|---|
| Application shell | Layout, persistent xi, menu, safe areas, accessible landmarks |
| Scene router/controller | Current destination, direct URLs, browser history, interruption and focus |
| Brand assets | Canonical xi/wordmark artwork, butterfly geometry, original specimen art |
| Opening renderer | Wordless sequence, consumption, metamorphosis, emergence, deterministic time |
| Domain renderer | The four stable dot compositions and transitions between them |
| Motion coordinator | Play/pause/replay, timing, visibility, reduced motion, cleanup |
| Input adapter | Native controls, touch gestures, wheel/trackpad, keyboard, intent thresholds |
| Design tokens | Palette, spacing, font treatment, easing, responsive composition constants |

Separate per-frame graphics updates from React state updates. Use one authoritative animation clock for a running sequence. Keep framework rerenders out of the particle loop. Cancel obsolete animations and callbacks when a scene changes. Preserve deterministic geometry and random seeds so comparison is repeatable.

## Scene addressing

The names are business domains, not a request for separate DNS domains or websites. Proposed paths are `/`, `/labs/`, `/dynamic-ux/`, `/engineering-six/`, `/back-office-six/`, `/about/`, and `/contact/`. If the existing repository has established routes, reconcile and document them. Static HTML per route or a correctly configured SPA fallback is acceptable. Test direct loading, refresh, Back/Forward, and an unknown path.

The reference's menu links currently use local state and prevent default hash navigation. Convert that into real addressable navigation in production without altering the visible journey. Direct entry to a domain should not force the opening animation.

## Layout and assets

The study's 640px outer scene is an inline demonstration container, not an instruction to hard-code a short website viewport. Compose production screens for the actual laptop and mobile visible viewport, browser toolbar changes, orientation, notches, and safe areas. Retain the approved art/type relationships. At short heights or increased text size, allow necessary scrolling rather than clipping content or trapping the user.

The standalone reference uses embedded PNGs for portability. Production may externalize them into local, cacheable assets with exact decoded pixels. Use fingerprinted asset paths where supported. Keep an existing canonical brand asset such as `/logo.png` working if other communications depend on it. Do not remove a live asset merely because the new homepage no longer uses it.

The xi/wordmark should render consistently across Safari, Chromium, iOS, and Android. A matching vector master is preferable to relying on platform font substitution. Check licensing if font files are added. Ensure correct accessible naming and touch targets without decorative focus removal.

## Animation lifecycle

Run the opening when it is visible. Pause for hidden tabs, an open menu, and offscreen conditions; resume from the same progress without consuming hidden wall time. After completion, settle and stop the animation loop. Honor reduced motion with the composed final state and working navigation. Replay restarts only on deliberate input. Match current within-visit completion behavior before deciding whether any cross-visit storage is useful.

The prototype uses a device-pixel-ratio cap of 2. Keep performance adaptive where needed, while protecting the butterfly silhouette, narrative stages, timing, and brand mark. Optimize computation, cached drawings, resolution, and redundant effects before deleting story or replacing the animation with a still.

## Production hardening to complete

1. Replace preview-only hooks with development/test controls that cannot accidentally freeze production.
2. Handle fast repeated navigation, canceled Web Animations promises, resize/orientation during every phase, and component unmount cleanly.
3. Make menu focus behavior, Escape, browser history, assistive technology, and reduced motion reliable.
4. Add native-feeling wheel/trackpad progression and verify touch gesture behavior on physical phones. Preserve intentional scrolling, pinch zoom, and platform gestures.
5. Ensure assets load deterministically before dependent phases; provide a composed fallback for an asset or script failure without falsely presenting a blank finished experience.
6. Supply appropriate page titles, descriptions, favicon, and sharing metadata without expanding on-screen explanatory copy.
7. Confirm build output, deployment branch, preview workflow, cache behavior, and rollback path.

## Sources checked 2026-11-01

- https://developers.cloudflare.com/pages/functions/pricing/
- https://developers.cloudflare.com/pages/platform/limits/
- https://vite.dev/guide/static-deploy
- https://gsap.com/docs/v3/GSAP/Timeline/
- https://gsap.com/community/standard-license/

GSAP's current standard license permits commercial website use at no charge. Its use is optional; this reference does not depend on it.

