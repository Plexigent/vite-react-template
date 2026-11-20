# Implementation sequence

## 1. Establish the real workspace

Inspect Git status, branch, remotes, root instructions, package/build configuration, existing asset URLs, and Cloudflare deployment mapping. Preserve unrelated changes. Create an appropriate feature branch or isolated worktree if needed. Do not assume the live minified bundle describes the current repository accurately.

Verify this package, open the exact reference, and watch the whole experience before deciding implementation details. Merge the root guidance and update the canonical architecture with the intended approach.

## 2. Make the visual baseline repeatable

Keep the reference unchanged. Generate deterministic QA frames with `tools/make_qa.py`. Capture baseline screenshots at target dimensions with the same browser configuration used for implementation comparison. Use both static comparisons and real playback. The previous conversation does not need to be accessible to complete this work.

## 3. Implement the actual site

Port the accepted composition, assets, narrative, point geometry, and timing. Refactor or replace the old code as necessary; do not preserve obsolete mechanisms simply to reduce the diff. Choose a clear state and motion architecture that remains static-hostable on Cloudflare Free.

Integrate responsive scene layouts, canonical brand assets, real routing/history, persistent direct menu access, About Us, Contact, replay, and all input methods. Match the baseline before making performance-driven refinements. Maintain recognizable intermediate stages and settled compositions throughout.

## 4. Harden and verify

Run available browser and interaction checks. Compare keyframes and motion. Profile actual bottlenecks. Fix narrow-screen layouts, mobile viewport changes, focus, interruption, asset loading, and reduced motion. Test actual iPhone Safari and Android Chrome when available; be explicit about gaps.

## 5. Produce the reviewable result

Prepare the working preview with the tested commit and evidence. Confirm that it can be deployed within the free constraints. Use the user's current release instruction and the existing repository's deployment process for production promotion; a future reading of this package alone does not grant new account access or publication authority.

## Continuity after every substantial milestone

Maintain a short `IMPLEMENTATION_STATUS.md` in the repository containing:

- Current branch and commit; dirty/uncommitted changes that matter.
- Completed outcome, not just attempted commands.
- Exact run/build/preview commands and preview location.
- Architecture decisions and why they preserve the approved result.
- Browser/device evidence and checks still unverified.
- Next independent action and any specific blocker.

Update architecture when the implementation changes. Keep the root AGENTS.md pointer concise so future sessions discover the durable brief. Do not repeatedly restart the design process or ask Paul to choose routine implementation internals that have been delegated.

