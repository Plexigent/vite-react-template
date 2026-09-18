# Plexigent Product Architecture

## 1. Product Description

**Core Value:** Plexigent is a premium one-page company introduction site centered on the motif of connecting dots, transformation, and emerging insight. The experience should feel intelligent, futuristic, calm, and memorable without adding navigation, sections, or placeholder copy.

**Target Audience:** Prospective customers, partners, investors, and early visitors encountering the Plexigent brand.

**Current State:** Visual MVP / design prototype. The September 2026 animation pass replaces legacy hand-drawn particle targets and per-frame React graphics with artwork-derived destinations and a cached canvas renderer. The September 18 follow-up adds a spaced 192-to-23 chrysalis consolidation and a perpetual, shallow butterfly wingbeat. The chrysalis-only refinement slows consolidation and adds bright planetary orbits before the final dissolve. Local validation is complete; real-device cross-browser profiling remains outstanding.

## 2. Architecture Reference

**Tech Stack:** Vite, React, TypeScript, CSS, Cloudflare Git Integration. No animation libraries; use React, CSS, and HTML canvas only.

**Key Files:**
- `src/react-app/App.tsx`: page composition and cinematic word reveal; measures actual rendered letters to fit every association within the stage.
- `src/react-app/ParticleScene.tsx`: canvas renderer, cached dot sprites/linework, image decoding, lifecycle, adaptive resolution and accessibility.
- `src/react-app/sceneModel.ts`: pure layout transforms, phase timing, particle paths and continuous butterfly handoff.
- `src/react-app/butterflyMotion.ts`: shared wing/body classification, diagonal hinge, wingbeat settings and projection math for tests.
- `src/react-app/sceneGeometry.ts`: original final-scene dot and line primitives.
- `src/react-app/artworkPoints.ts`: 192 inset destinations for each current PNG silhouette, prepaired for the morph; includes source hashes.
- `src/react-app/App.css`: safe-area layout, static atmospheric background, wordmark/button styling, gentle final drift and cached-wing CSS animation.
- `src/react-app/index.css`: global/root page behavior.
- `scripts/generate-artwork-points.py`: offline silhouette filling, evenly spaced sampling and minimum-cost pairing; Pillow/NumPy only, never runs in the browser.
- `scripts/scene.test.mjs`: artwork freshness, alignment, phase boundaries, transfer continuity and viewport/pixel-budget tests.

**Scene Model:**
- One full-screen landing page with centered `Plexigent` wordmark.
- Foreground artwork renders inside a measured scene stage: full-viewport landscape on wide screens and a contained 390:844 portrait stage on phones/portrait displays.
- Landscape and portrait use the same primitives and animation pipeline with layout-specific coordinate transforms.
- Intro phase sequence: `loading -> swarm -> caterpillar -> chrysalis -> reveal -> done`. Both images decode before the clock starts.
- Swarm settles by 3.6s; caterpillar-to-chrysalis morph runs 4.35–5.85s. The chrysalis beat now runs 4.55–9.95s (5.4s, previously 1.9s). Satellites gather into orbital lanes during 5.85–6.95s, circle visibly until the late fade begins at 8.45–8.70s, and leave exactly 23 seeds by 9.95s. Seeds hold until release at 10.8s; all arrive by 13.34s; finale begins at 14.3s. Only chrysalis duration is extended: later flight/entrance/wingbeat motion and relative timing are unchanged.
- The 23 retained seeds use farthest-point spacing among interior artwork samples (minimum normalized inset .025), providing room for complete orbits inside the silhouette. Other dots gather into ordered lanes around their nearest seed, remain bright while circling, then dissolve in place without collapsing into the seed. Orbit radii are bounded by silhouette inset and neighbouring seed distance; slight spacing/size variation makes rotation readable. Neighbouring systems vary rotation direction and sweep. Survivors brighten modestly; no additive glow or stacked-particle clumps.
- Artwork and its particles use the same proportionally scaled rectangle. Do not replace these destinations with approximate ovals or portrait-specific offsets.
- Each selected chrysalis dot becomes its permanent butterfly dot, with identical endpoint coordinates and no fade-out/replacement. Butterfly proportions use uniform scaling.
- Final scene retains 31 lower-left dots, 29 middle mesh dots, 23 butterfly dots and the original line primitives. At the finale, the butterfly switches from the shared canvas to three pre-rendered small canvases (far wing, near wing, stationary body), with identical open-pose geometry.
- After the wordmark/button entrance (1.2s delay), the wings fold gently around the slanted body axis on a 6.2s loop: near wing 25 degrees, far wing -32 degrees with slight timing offset. Dots and veins transform together; body and antennae remain fixed relative to the butterfly. No full-page redraw loop resumes.
- Final wordmark and spherical `?` button appear last.

**Performance Design:**
- One full-stage canvas prevents transfer clipping. Initial DPR is capped at 1.75 with a 2.4-million-pixel budget; sustained slow frames can lower DPR further. No browser-name detection.
- Glow gradients are generated once into a reusable sprite; final linework and the lower dot field are cached, not rebuilt each frame.
- Source-over compositing and restrained dot sizes avoid the former bright, oversized chrysalis effect.
- React updates at phase changes, not on every animation frame. All canvas drawing stops after the finale; CSS supplies wingbeats and a tiny shared translation. Wing bitmaps rebuild only for resize/resolution changes.
- Hidden tabs pause the scene clock, CSS drift and wingbeats. Reduced-motion preference skips directly to the static, open-wing final composition. Frozen development beats also disable wing motion.
- Resize/orientation events are coalesced into one rebuild per frame and preserve animation time.
- Static radial backgrounds replace continuously blurred, oversized animated layers. No new runtime libraries or GPU APIs are required.

## 3. Current State & Key Info

**Completed Features:**
- Premium dark atmospheric background.
- Caterpillar/chrysalis intro with silhouette-derived particle fills and a continuous paired morph.
- Current PNG line art and particle targets share exact scaling and positioning.
- 23 selected intro dots swarm from chrysalis into permanent butterfly positions.
- Chrysalis particles gather and orbit deliberately before consolidating into 23 visibly separate seeds; no jump in position, size or opacity at release.
- Perpetual, slow butterfly wingbeat after the full entrance, without per-frame JavaScript rendering.
- Final lower-left/middle/butterfly dot systems reveal only late in the sequence.
- `Plexigent` fades in after the visual reveal.
- Spherical `?` button appears after a slight pause.
- Button cycles word associations in a cinematic progression: `ComPlex`, `exigent`, `Intelligent`, `Plexippus`.
- iOS/phone-safe portrait composition with aligned intro/final graphics and reveal words constrained to the visible stage.
- Dynamic viewport units, safe-area insets, and `viewport-fit=cover` support for mobile browser chrome and device cutouts.
- Accessible 44px-minimum question-button target and reduced-motion handling.
- Browser title remains `Plexigent` and the butterfly favicon is preserved.

**Important Quirks:**
- Keep page phase classes as `phase-*`; do not rename them to `intro-*` because that previously collided with intro layer classes.
- Wrangler may print an `EPERM` warning when writing logs, but builds still complete.
- Avoid adding libraries unless explicitly requested.
- Avoid broad visual changes; update one animation beat at a time.

**Validation:** TypeScript, React source lint, production build and seven automated scene tests pass. Tests cover source-image freshness, alignment, flight continuity, pixel budget, monotonic 192-to-23 reduction, visible core separation, seed clearance, orbital containment/bright hold/late fade, fixed wing hinge and unclipped extreme poses across eight viewport sizes. Local browser checks cover phone/desktop composition, moving wing transforms with an unchanged final drawing count, and reduced-motion handling; the orbital refinement was also watched during normal playback on a phone-sized viewport. Earlier checks covered word containment and mid-intro rotation. These are not evidence of performance on physical iOS/Android devices or all browser engines.

**Developer Checks:**
- `npm run build`, `npm run lint`, `npm run test:scene` (scene tests require a Node release with native TypeScript stripping, verified with Node 24).
- `python3 scripts/generate-artwork-points.py --check` requires Pillow and NumPy; verifies committed destinations against the current images. Without `--check`, it prints generated geometry as JSON. Regenerate `artworkPoints.ts` whenever artwork changes; source-hash tests intentionally reject stale geometry.
- Development-only `?sceneTime=4000`, `6200`, `7800`, `10100`, `11900`, or `14300` freezes the caterpillar, gathering chrysalis, orbits, 23 seeds, flight or final open-wing pose; `?sceneMotion=reduce` checks the static reduced-motion scene. These controls are ignored by production builds.
- Development-only canvas data attributes expose elapsed time, draw count, DPR and average JavaScript drawing time. They are diagnostic aids, not end-to-end GPU or device benchmarks.

## 4. Next Session Instructions

**Use This File As:** Concise project memory and architecture guidance, not proof of current code state.

**Next Session Prompt:**
Continue the Plexigent landing page project using `productArchitecture.md` as continuity context. First inspect the current repo state and relevant files before editing. Preserve Cloudflare compatibility. Use React, CSS, and existing canvas code only unless I explicitly request otherwise. Keep the page simple: no nav, no extra sections, no placeholder copy. Make focused, one-beat-at-a-time visual changes and run the build after edits.

**Immediate Priorities:**
- Profile the new renderer on real Mac Safari, iOS Safari, Android Chrome, Windows Chrome/Firefox and Linux browsers; include high-DPR displays and low-power devices.
- Check image decoding, hidden-tab resumption, reduced-motion settings and mobile browser toolbar changes on those devices.
- Tune timing/quality only from observed results; preserve the shared artwork transform, separated seed dots, continuous 23-particle handoff and compositor-only wingbeat.
