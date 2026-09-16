# Plexigent Product Architecture

## 1. Product Description

**Core Value:** Plexigent is a premium one-page company introduction site centered on the motif of connecting dots, transformation, and emerging insight. The experience should feel intelligent, futuristic, calm, and memorable without adding navigation, sections, or placeholder copy.

**Target Audience:** Prospective customers, partners, investors, and early visitors encountering the Plexigent brand.

**Current State:** Visual MVP / design prototype. The September 2026 animation pass replaces legacy hand-drawn particle targets and per-frame React graphics with artwork-derived destinations and a cached canvas renderer. Local validation is complete; real-device cross-browser profiling remains outstanding.

## 2. Architecture Reference

**Tech Stack:** Vite, React, TypeScript, CSS, Cloudflare Git Integration. No animation libraries; use React, CSS, and HTML canvas only.

**Key Files:**
- `src/react-app/App.tsx`: page composition and cinematic word reveal; measures actual rendered letters to fit every association within the stage.
- `src/react-app/ParticleScene.tsx`: canvas renderer, cached dot sprites/linework, image decoding, lifecycle, adaptive resolution and accessibility.
- `src/react-app/sceneModel.ts`: pure layout transforms, phase timing, particle paths and continuous butterfly handoff.
- `src/react-app/sceneGeometry.ts`: original final-scene dot and line primitives.
- `src/react-app/artworkPoints.ts`: 192 inset destinations for each current PNG silhouette, prepaired for the morph; includes source hashes.
- `src/react-app/App.css`: safe-area layout, static atmospheric background, wordmark/button styling and gentle compositor-only final drift.
- `src/react-app/index.css`: global/root page behavior.
- `scripts/generate-artwork-points.py`: offline silhouette filling, evenly spaced sampling and minimum-cost pairing; Pillow/NumPy only, never runs in the browser.
- `scripts/scene.test.mjs`: artwork freshness, alignment, phase boundaries, transfer continuity and viewport/pixel-budget tests.

**Scene Model:**
- One full-screen landing page with centered `Plexigent` wordmark.
- Foreground artwork renders inside a measured scene stage: full-viewport landscape on wide screens and a contained 390:844 portrait stage on phones/portrait displays.
- Landscape and portrait use the same primitives and animation pipeline with layout-specific coordinate transforms.
- Intro phase sequence: `loading -> swarm -> caterpillar -> chrysalis -> reveal -> done`. Both images decode before the clock starts.
- Swarm settles by 3.6s; caterpillar-to-chrysalis morph runs 4.35–5.85s; butterfly release starts at 6.8s; all 23 travelling dots arrive by 9.34s; finale begins at 10.3s of visible animation time.
- Artwork and its particles use the same proportionally scaled rectangle. Do not replace these destinations with approximate ovals or portrait-specific offsets.
- Each selected chrysalis dot becomes its permanent butterfly dot, with identical endpoint coordinates and no fade-out/replacement. Butterfly proportions use uniform scaling.
- Final scene retains 31 lower-left dots, 29 middle mesh dots, 23 butterfly dots and the original line primitives, all drawn on the same canvas.
- Final wordmark and spherical `?` button appear last.

**Performance Design:**
- One full-stage canvas prevents transfer clipping. Initial DPR is capped at 1.75 with a 2.4-million-pixel budget; sustained slow frames can lower DPR further. No browser-name detection.
- Glow gradients are generated once into a reusable sprite; final linework and the lower dot field are cached, not rebuilt each frame.
- Source-over compositing and restrained dot sizes avoid the former bright, oversized chrysalis effect.
- React updates at phase changes, not on every animation frame. Canvas drawing stops after the finale; a tiny CSS translation supplies ambient movement.
- Hidden tabs pause the scene clock and CSS drift. Reduced-motion preference skips directly to the static final composition.
- Resize/orientation events are coalesced into one rebuild per frame and preserve animation time.
- Static radial backgrounds replace continuously blurred, oversized animated layers. No new runtime libraries or GPU APIs are required.

## 3. Current State & Key Info

**Completed Features:**
- Premium dark atmospheric background.
- Caterpillar/chrysalis intro with silhouette-derived particle fills and a continuous paired morph.
- Current PNG line art and particle targets share exact scaling and positioning.
- 23 selected intro dots swarm from chrysalis into permanent butterfly positions.
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

**Validation:** TypeScript, React source lint, production build, four automated scene tests and regenerated-artwork checks pass. Local browser checks cover desktop and narrow-phone layouts, word containment, mid-intro rotation, and the final canvas becoming idle. These are not evidence of performance on physical iOS/Android devices or all browser engines.

**Developer Checks:**
- `npm run build`, `npm run lint`, `npm run test:scene` (scene tests require a Node release with native TypeScript stripping, verified with Node 24).
- `python3 scripts/generate-artwork-points.py --check` requires Pillow and NumPy; verifies committed destinations against the current images. Without `--check`, it prints generated geometry as JSON. Regenerate `artworkPoints.ts` whenever artwork changes; source-hash tests intentionally reject stale geometry.
- Development-only `?sceneTime=4000`, `6200`, `8300`, or `10300` freezes a beat for visual inspection; `?sceneMotion=reduce` checks the static reduced-motion scene. These controls are ignored by production builds.
- Development-only canvas data attributes expose elapsed time, draw count, DPR and average JavaScript drawing time. They are diagnostic aids, not end-to-end GPU or device benchmarks.

## 4. Next Session Instructions

**Use This File As:** Concise project memory and architecture guidance, not proof of current code state.

**Next Session Prompt:**
Continue the Plexigent landing page project using `productArchitecture.md` as continuity context. First inspect the current repo state and relevant files before editing. Preserve Cloudflare compatibility. Use React, CSS, and existing canvas code only unless I explicitly request otherwise. Keep the page simple: no nav, no extra sections, no placeholder copy. Make focused, one-beat-at-a-time visual changes and run the build after edits.

**Immediate Priorities:**
- Profile the new renderer on real Mac Safari, iOS Safari, Android Chrome, Windows Chrome/Firefox and Linux browsers; include high-DPR displays and low-power devices.
- Check image decoding, hidden-tab resumption, reduced-motion settings and mobile browser toolbar changes on those devices.
- Tune timing/quality only from observed results; preserve the shared artwork transform and continuous 23-particle handoff.
