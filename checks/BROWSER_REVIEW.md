# Browser and phone review — pending

No browser acceptance is claimed. The implementation session could not start a listening server (`Operation not permitted`), and the in-app browser rejected `file://`. No workaround was used. The simulated-DOM tests are not browser tests.

## Start a review

1. With Node 24 available, run `npm run dev`. Use Vite's Local URL on the Mac and Network URL on a phone on the same trusted Wi-Fi.
2. Open `/Plexigent_Website_Handoff/reference/index.html` in another tab; watch its entire opening and all seven destinations.
3. Watch `/` without query parameters. The full opening must retain gathering, recognizable consumption, chrysalis reorganization, butterfly emergence, wordmark reveal and a still final state. Replay must reset everything.
4. Before production, obtain an HTTPS preview on the existing Cloudflare project, using a non-production preview deployment. Local HTTP alone is not release acceptance.

## Visual comparison

Generate reference QA with `python3 Plexigent_Website_Handoff/tools/make_qa.py`. At matching drawing-surface widths, compare `.px-origin` canvas crops for:

| Seconds | Reference page | Production dev page |
|---|---|---|
| 0.5 | `/Plexigent_Website_Handoff/_qa/random-dots.html` | `/?sceneTime=0.5` |
| 2.6 | `/Plexigent_Website_Handoff/_qa/gathering.html` | `/?sceneTime=2.6` |
| 4.8 | `/Plexigent_Website_Handoff/_qa/consumption.html` | `/?sceneTime=4.8` |
| 8.9 | `/Plexigent_Website_Handoff/_qa/chrysalis.html` | `/?sceneTime=8.9` |
| 12.1 | `/Plexigent_Website_Handoff/_qa/emergence.html` | `/?sceneTime=12.1` |
| 14.6 | `/Plexigent_Website_Handoff/_qa/butterfly.html` | `/?sceneTime=14.6` |

Canvas height is 300px. Production artwork width is capped at 1100px; constrain the reference's canvas to the same width for wider-screen drawing comparisons. The overall production page deliberately uses the actual viewport instead of the reference's 640px demo container. Capture both matched artwork crops and full-page composition. Use image overlays/diffs plus visual inspection; do not accept or reject typography based only on a pixel threshold.

Check viewports 320×568, 360×800, 390×844, 430×932, 768×1024, 1366×768, 1440×900 and 1920×1080, plus landscape/short height and 200% browser/text zoom. Verify that art, titles, prompts, email, invitation and menu never overlap or clip. Verify xi `/` stroke/i-dot accents on every platform.

## Functional and accessibility review

- Complete Home → Labs → Dynamic UX → Engineering SiX → Back Office SiX → Home.
- Open the menu during each opening phase and midway through a domain transition; wait, close and check resumed timing.
- Directly open, refresh and use browser Back/Forward on every path. Unknown paths should recover to `/`. Modified-click/new-tab links must retain ordinary browser behavior.
- Reach About and Contact directly during the intro. About leads to Contact; Contact leads Home. Inspect mailto without sending email.
- Navigate rapidly, Replay, resize/rotate during every phase, hide/show the tab, and scroll the stage offscreen where possible. There must be no console errors, stale copy, stuck opacity or duplicate animation loops.
- Tab through controls; check visible focus, menu focus containment, Escape restoration and heading focus on destination change. Test VoiceOver/TalkBack naming and absence of per-frame announcements.
- Enable reduced motion before loading and while playing. The full static final brand must appear; Replay is hidden, navigation still works.
- Use tap, upward/downward swipe, mouse wheel, trackpad and keyboard. Momentum must not skip multiple destinations. Scrollable/zoomed layouts, native browser gestures and pinch zoom must remain usable.
- Simulate missing PNGs, missing Canvas, disabled JavaScript and slow image loading. The page should remain navigable and composed.

## Performance and real hardware

Use Mac Safari and Chrome, automated Chromium and WebKit, a **physical iPhone/Safari**, and a **physical Android/Chrome**. Desktop WebKit is not iPhone testing; a changed viewport/user agent is not Android testing. Record OS/browser/device, viewport, DPR and display refresh rate.

Capture frame intervals (p95/p99), long tasks and a complete animation recording; compare with direct observation because recording adds overhead. Dev diagnostics expose JS draw time and active frame intervals after the opening, but are not GPU profiling. After the final frame, draw counts must stop except for resize or explicit navigation. Do not claim 60fps from requestAnimationFrame alone.

Record date, tested commit/source snapshot, evidence paths, results and unresolved defects in `checks/RESULTS.md`. Confirm the account's actual free plan, HTTPS route refresh behavior and rollback deployment before promotion.
