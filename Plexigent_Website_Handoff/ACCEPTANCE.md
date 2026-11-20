# Acceptance and evidence

Preserve the approved experience across laptop browsers, iOS, and Android. The reference is a visual/behavioral baseline, not proof that every device already passes. Record a result, environment, and evidence for each applicable item. A missing device is “not tested”, not “passed”.

## Minimum browser/device matrix

| Environment | Required evidence |
|---|---|
| Mac laptop, Safari | Complete sequence, domain traversal, menu, resize, performance observation |
| Mac laptop, Chrome | Same; deterministic frame comparison and profiling |
| Real iPhone, Safari | Touch, toolbar/viewport changes, safe areas, portrait/landscape, full sequence |
| Real Android phone, Chrome | Touch, gesture conflicts, browser controls, portrait/landscape, full sequence |
| Automated Chromium and WebKit | Functional, viewport, reduced-motion, navigation and screenshot checks |

Automation/emulation supplements physical-device testing. Desktop WebKit is not a physical iPhone; changing the viewport or user agent is not Android device validation. Use at least one representative Android device rather than assuming that a powerful iPhone proves Android performance.

Layout fixtures: 320×568, 360×800, 390×844, 430×932, 768×1024, 1366×768, 1440×900, and 1920×1080 CSS pixels; add landscape and short-height cases. Test browser zoom/text enlargement. Favor composition-preserving reflow over clipping.

## Visual and narrative checks

- V01: Correct xi accents: cyan `/` stroke and i dot, neutral remaining forms; consistent master shape in header and full wordmark.
- V02: Original caterpillar and chrysalis forms remain recognizable; incoming dots visibly imply consumption.
- V03: Metamorphosis preserves visual continuity of the dots. No replacement with unrelated particle effects.
- V04: Final butterfly matches the included geometry and connections, with its trailing mesh; no generic butterfly substitution.
- V05: All six opening QA frames agree with the reference's composition at matched dimensions. Compare image overlays/diffs and visually inspect; do not rely on an arbitrary single pixel-difference threshold across browser font rendering.
- V06: Each domain's final frame retains its name, provocation, visual idea, space, and invitation. No unsolicited explanatory UI.
- V07: At rest, animation stops; no constant pulse, wing flap, or particle drift has been added.
- V08: Every layout remains legible and unclipped, including long domain titles, the menu, short screens, and enlarged text.

## Motion and runtime checks

- M01: Observe the full playing sequence, including the consumption window and restrained emergence. Compare timing with MOTION_SPEC.md and the actual reference.
- M02: Target consistent 60fps on representative hardware. Record frame intervals (including p95/p99), visible stutter, long tasks, device/browser, and display refresh rate. Do not claim 60fps solely because the code calls requestAnimationFrame.
- M03: Preserve pacing across 60Hz and higher-refresh displays; elapsed time, not frame count, drives progress.
- M04: Menu opening, backgrounding, offscreen state, and resume preserve progress without jumps or duplicated loops.
- M05: Replay resets every stage, particle field, wordmark state, and invitation correctly.
- M06: Fast repeated input, interrupted transitions, resize/orientation changes, and mount/unmount produce no stale frames, stuck opacity, unhandled promise rejections, or leaked listeners/timers.
- M07: Reduced motion produces a complete stable brand composition and fully usable navigation.
- M08: Capture smoothness on physical devices; browser recordings can themselves add overhead, so corroborate with direct observation/profiling.

## Navigation and accessibility

- N01: Home → Labs → Dynamic UX → Engineering SiX → Back Office SiX → Home.
- N02: Menu directly reaches all four domains, About Us, and Contact, including during the opening.
- N03: About → Contact; Contact → Home. The mailto address is paul@plexigent.com.
- N04: Production direct URLs, refresh, browser Back/Forward, and unknown-route behavior work correctly without forcing an introduction on domain entry.
- N05: Tap, click, vertical swipe, keyboard, wheel, and trackpad behave naturally. Vertical page scrolling and native platform gestures are not accidentally trapped.
- N06: Keyboard focus is visible and logical; menu opening/closing, Escape, and scene changes handle focus coherently. Touch targets are comfortably usable.
- N07: The canvas has a concise accessible description; updates do not flood announcements. The full wordmark has the accessible name Plexigent despite decorative letter overlays.
- N08: Pinch zoom, enlarged text, reduced motion, and safe-area/browser toolbar changes are respected.

## Delivery and free-hosting checks

- D01: Reproducible production build with lockfile and documented command; output is static assets with no required billable backend.
- D02: No development freeze attributes, test pages, internal technical text, missing assets, or placeholder links in the deployed public experience.
- D03: Check Cloudflare limits/configuration, deployment branch behavior, and a rollback version before production promotion.
- D04: Validate preview over HTTPS, including direct route loads on phones. Preserve existing canonical asset URLs used outside the site where relevant.
- D05: Record tested commit, actual device/browser versions, viewport/DPR, test date, results, and evidence paths in `checks/RESULTS.md`.
- D06: Compare the actual preview against the preserved reference before describing the work as complete. If native testing remains unavailable, report that specifically and continue all other authorized work.

