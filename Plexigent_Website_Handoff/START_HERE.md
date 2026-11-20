# Plexigent website implementation handoff

Version 1.0 · 2026-11-01 · Owner: Paul Crimm · Target: plexigent.com

## Outcome

Implement the included, approved brand experience in the actual Plexigent repository and keep production within Cloudflare's free offering. Preserve the experience, artwork, composition, motion, and navigation. Refactor or replace the old website implementation wherever that improves the result.

This package transfers executable work, not just a description. `reference/approved-study.fragment.html` is the exact final interactive study delivered in the originating conversation. `reference/index.html` wraps that fragment without changing it, so it can run independently. All artwork is embedded in the reference; extracted originals are also in `assets/`.

The user approved the four-domain study and then the wordless opening. Their latest direction explicitly removes any preference for retaining older implementation code. The approved outcome is the constraint. Legacy architecture is not.

## On the Mac

1. Download and unzip `Plexigent_Website_Handoff.zip`.
2. Move the extracted `Plexigent_Website_Handoff` folder into the local Plexigent repository root. It is reference material; do not replace the repository with this folder.
3. Open that repository as the local project in Codex. Ensure this is the actual working tree with the website source.
4. Start a new task and paste the contents of `CODEX_PROMPT.md`, or tell Codex: “Read Plexigent_Website_Handoff/START_HERE.md and implement this approved experience.”
5. Keep the reference and guidance in Git alongside the implementation. A chat transcript alone is not the durable handoff.

You can double-click `reference/index.html` to see the complete experience. If local file viewing behaves differently in a browser, run `python3 tools/preview.py` from this folder and open the printed localhost address. No packages or network downloads are needed for the reference.

## Required reading order for the implementation agent

1. The destination repository's existing instructions and Git status.
2. This document and `DESIGN_CONTRACT.md`.
3. `ARCHITECTURE.md`, `MOTION_SPEC.md`, and `ACCEPTANCE.md`.
4. `STATUS.md`, so existing evidence is not overstated.
5. `reference/index.html` in a browser: watch the full sequence and navigate all destinations.

Run `python3 tools/verify.py` before editing. The authoritative fragment should remain unchanged. Implement in the repository's source files and compare against the preserved reference. If further user instructions intentionally revise the design, record the revision and retain the previous reference.

## Persist the brief in the repository

Merge the concise section from `repo-guidance/AGENTS.append.md` into the repository-root `AGENTS.md`. Read existing content first; do not overwrite unrelated project guidance. This package's nested `AGENTS.md` does not automatically apply to the entire repository.

Update the existing root `architecture.md` or `ARCHITECTURE.md`, using this package's architecture as the design brief and recording the actual resulting implementation. If neither exists, create `ARCHITECTURE.md`. Maintain one canonical architecture document rather than contradictory duplicates.

Use `IMPLEMENTATION_PLAN.md` to sequence the work. Maintain a short checked-in implementation status that records the current branch/commit, commands, evidence, unresolved issues, and next action. Do not represent a proposal as completed work.

## Priority and permitted change

Latest instructions from Paul govern the design. This package records those instructions and preserves the approved reference. The destination repository's implementation and old design commentary are historical inputs, not reasons to weaken the newly approved experience. Reconcile stale project guidance with the user's current direction, while preserving unrelated valid requirements.

Routine implementation choices are delegated: reorganizing components, replacing animation internals, removing superseded code, introducing appropriate free dependencies, and improving responsiveness are permitted. Preserve unrelated user work. Inspect the actual build/deployment setup before changing it; pushes to a production branch may automatically publish.

This handoff does not itself publish anything or assert that native mobile validation has happened. Complete implementation and available verification autonomously. Report any unavailable real-device checks accurately and continue all independent work. Follow the user's current release instruction and the repository's deployment process when promoting to production.

## Files that matter

| File | Purpose |
|---|---|
| `reference/approved-study.fragment.html` | Exact approved executable source; preserve its bytes |
| `reference/index.html` | Self-contained browser reference using the exact fragment |
| `assets/` | Original artwork and connected-dot geometry, including source mapping |
| `DESIGN_CONTRACT.md` | Brand and interaction invariants |
| `ARCHITECTURE.md` | Free-hosting constraints and production architecture direction |
| `MOTION_SPEC.md` | Timing, easing, geometry, and lifecycle behavior |
| `ACCEPTANCE.md` | Browser, device, motion, and functional acceptance checks |
| `IMPLEMENTATION_PLAN.md` | Work sequence and continuity checkpoints |
| `STATUS.md` | What has and has not been verified |
| `contract.json` | Machine-readable identifiers, copy, timing, and palette |
| `manifest.json` | SHA-256 inventory of the package |
| `tools/` | Integrity verification, local preview, and deterministic QA pages |

