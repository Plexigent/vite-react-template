# Plexigent Product Architecture

## 1. Product Description

**Core Value:** Plexigent is a premium one-page company introduction site centered on the motif of connecting dots, transformation, and emerging insight. The experience should feel intelligent, futuristic, calm, and memorable without adding navigation, sections, or placeholder copy.

**Target Audience:** Prospective customers, partners, investors, and early visitors encountering the Plexigent brand.

**Current State:** Visual MVP / design prototype. The landing page is deployed-compatible and being refined through focused visual/animation passes.

## 2. Architecture Reference

**Tech Stack:** Vite, React, TypeScript, CSS, Cloudflare Git Integration. No animation libraries; use React, CSS, and HTML canvas only.

**Key Files:**
- `src/react-app/App.tsx`: scene geometry, intro phase timing, canvas swarm/chrysalis/butterfly transfer, word reveal interaction.
- `src/react-app/App.css`: layout, visual styling, CSS animation phases, background, final dot/mesh/butterfly reveal, wordmark/button timing.
- `src/react-app/index.css`: global/root page behavior.

**Scene Model:**
- One full-screen landing page with centered `Plexigent` wordmark.
- Intro phase sequence: `swarm -> caterpillar -> chrysalis -> reveal -> done`.
- Canvas intro renders swarm dots, caterpillar fill, chrysalis dissolve, and 23-dot transfer into butterfly positions.
- Persistent final scene renders 31 lower-left dots, 29 middle mesh dots, and 23 butterfly dots plus linework.
- Final wordmark and spherical `?` button appear last.

**Performance Design:**
- Intro canvas is region-sized rather than full-screen.
- Canvas coordinates are authored in page percentages and mapped into active canvas regions.
- Desktop Safari canvas DPR is capped lower than other browsers.
- `useMotionTime()` is paused until `phase-done` to avoid hidden React animation work during intro.
- Ambient background animations pause during intro and resume after `phase-done`.

## 3. Current State & Key Info

**Completed Features:**
- Premium dark animated background.
- Caterpillar/chrysalis intro built from canvas dots.
- Caterpillar definition lines, chrysalis linework, chrysalis dissolve.
- 23 selected intro dots swarm from chrysalis into permanent butterfly positions.
- Final lower-left/middle/butterfly dot systems reveal only late in the sequence.
- `Plexigent` swells/fades in after the visual reveal.
- Spherical `?` button appears after a slight pause.
- Button cycles word associations: `ComPlex`, `Intelligent`, `exigent`, `Plexippus`.

**Important Quirks:**
- Keep page phase classes as `phase-*`; do not rename them to `intro-*` because that previously collided with intro layer classes.
- Wrangler may print an `EPERM` warning when writing logs, but builds still complete.
- Avoid adding libraries unless explicitly requested.
- Avoid broad visual changes; update one animation beat at a time.

**Known Performance Concern:** Mac Safari may stall if canvas/background/React animations are too heavy. Current mitigations are regional canvas sizing, Safari DPR cap, paused background animation during intro, and paused React background motion until final state.

## 4. Next Session Instructions

**Use This File As:** Concise project memory and architecture guidance, not proof of current code state.

**Next Session Prompt:**
Continue the Plexigent landing page project using `productArchitecture.md` as continuity context. First inspect the current repo state and relevant files before editing. Preserve Cloudflare compatibility. Use React, CSS, and existing canvas code only unless I explicitly request otherwise. Keep the page simple: no nav, no extra sections, no placeholder copy. Make focused, one-beat-at-a-time visual changes and run the build after edits.

**Immediate Priorities:**
- Review Mac Safari performance after the latest optimizations.
- If Safari still stalls, profile with Safari Web Inspector Timelines and reduce canvas gradient work or pause more CSS effects.
- Continue refining animation timing only after performance is acceptable.
