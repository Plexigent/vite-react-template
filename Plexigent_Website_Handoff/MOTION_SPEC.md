# Motion specification

Reference: `reference/approved-study.fragment.html`. Timing below records that exact implementation in seconds of active visible playback. Preserve its perceived rhythm and smoothness when restructuring code. A timing change must be an intentional improvement, documented and compared against this baseline.

## Opening: total 14.6 seconds

| Interval | Visible action |
|---|---|
| 0.0–approximately 1.5 | Scattered signals in a quiet field; xi and menu already available |
| 0.8–3.75, staggered per particle | Original dots gather into the caterpillar silhouette |
| 2.65–6.5, overlapping | Additional signals travel into the raised head; subtle body motion makes consumption legible |
| 6.35–8.2 | Caterpillar dots reorganize into the original chrysalis; specimen artwork crossfades |
| 8.4–10.7 | Internal consolidation and orbital reorganization |
| 9.65–10.95 | Peripheral particles resolve into the surviving structure |
| 10.85–approximately 13.46, staggered | Survivors travel on curved paths into butterfly, connecting mesh, and trailing signals |
| 11.1–13.45 | Wings unfold |
| 12.2–13.7 | Butterfly connections and mesh resolve |
| 12.8–14.1 | Original butterfly detail lines resolve |
| 12.9–14.1 | Brief, restrained concentration of light at the body |
| 13.15 | Wordmark starts its composed reveal; opacity 0.9s, vertical settling 1.1s |
| 13.45–14.55 | One small wing movement completes; no perpetual flap |
| 14.6 | Butterfly and wordmark hold; next invitation and Replay are available; frame loop stops |

The phases deliberately overlap. Do not convert the sequence into four disconnected fades or slides. No on-screen phase captions or explanatory narration.

## Geometry and assets

- 192 original caterpillar anchors and 192 corresponding chrysalis anchors.
- 23 original butterfly nodes, 30 primary butterfly edges, and 56 detail line segments.
- 29 mesh nodes, 30 mesh edges, and 31 trailing stars.
- 23 original source indices seed the butterfly. The current algorithm selects 83 survivors in total for butterfly, mesh, and stars.
- 56 additional consumption signals feed toward the caterpillar's head.
- Artwork: `assets/caterpillar-line-art.png` and `assets/chrysalis-line-art.png`, unchanged from the original live website assets retrieved during design.
- Geometry, connectivity, opacity, relative sizes, and source mapping: `assets/original-geometry.json`.

Keep the butterfly's identity. Production may cache/render geometry differently but should not regenerate or simplify it into another insect icon.

## Easing and motion calculations

The main sequence uses deterministic seeds and quintic smoothstep, `v³ × (v × (6v − 15) + 10)`, with clamped progress. Flight paths add a sinusoidal bend. Wing opening changes the component perpendicular to the body axis; the final geometry returns to the original coordinates. Small glows are bounded and settle.

The source contains the complete expressions and per-particle offsets. Preserve them during a faithful first port, then optimize measured bottlenecks without changing the observable result.

## Domain transitions

Default duration: 720ms. The outgoing copy moves up 10px and fades over 25% of that duration (180ms). The incoming copy moves from 14px below and resolves over 65% (468ms), with cubic-bezier(.16,1,.3,1). The point field interpolates throughout the 720ms using `1 − (1 − p)³` and stops afterward.

Maintain one composed destination at rest. The four scenes are sparse exploration, a responsive grid, precise circular engineering geometry, and organized parallel operational channels. Preserve the actual coordinates/appearance in the reference.

## Lifecycle and input behavior

- The reference starts at Home, not Labs.
- Completed opening state is remembered within the page instance. Returning home uses the final composition; Replay runs the opening again.
- Incomplete opening can play again when returning home. Cross-visit persistence is not implemented.
- Menu open, document hidden, and offscreen conditions pause playback. Resume resets the previous-frame timestamp to prevent a hidden-time jump.
- Reduced motion resolves directly to the final opening frame; Replay is hidden. Navigation still works.
- Reference vertical swipe: more than 65px, within 700ms, vertical distance more than 1.5 times horizontal distance. Do not treat these thresholds as a substitute for real-device testing.
- Arrow Down/Page Down advance; Arrow Up/Page Up move backward. Escape closes the menu. Ordinary buttons and links remain available.

## Deterministic QA

The exact reference accepts a `data-preview-time` attribute on its root to freeze only the opening for comparison. `tools/make_qa.py` generates standalone frozen views at 0.5, 2.6, 4.8, 8.9, 12.1, and 14.6 seconds. These are QA fixtures; do not accidentally ship a freeze attribute on the production root.

Capture the actual playing sequence as well as these stills. Still-frame similarity does not verify smooth motion, timing, input interruption, or pause/resume behavior.

