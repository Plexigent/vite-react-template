# Implementation verification — 2026-11-20

This records actual evidence from the local Mac execution environment. It does **not** certify browser rendering, animation smoothness or physical phones.

| Field | Observed value |
|---|---|
| Base commit | `7a02f6ed7f518936b9b7e22bf886198464d28a1d` (`x and i animation`) |
| Branch/worktree | `main`, uncommitted implementation and untracked handoff/docs; `.git` is read-only in this session |
| Intended branch | `feature/approved-plexigent-experience`; creation failed before source edits |
| Runtime | Local macOS, Node 24.18.0, TypeScript 5.9.3, Vite 7.3.6, React 19.2.1, Wrangler 4.88.0 |
| Source/build provenance | Exact hashes in `checks/SOURCE_SNAPSHOT.json`; this is a working-tree snapshot, not a new commit |
| Preview | Static build prepared in `dist/client`; no running preview or HTTPS URL |
| Publication | Not performed; no push, commit, deployment or account configuration change |

## Release review, November 20

Paul confirmed that the opening and navigation fix worked and that the updated local preview looks good. Device details were unspecified. The release review passed the test suite, build, lint, Wrangler dry-run, handoff verification and patch whitespace check. Cloudflare account settings and the public deployment are unverified.

## Animation and menu fix, November 20

A controller test using the production clock and receiver-checking frame methods failed before the fix with `TypeError: Illegal invocation: requestAnimationFrame`. It passed after binding frame requests and cancellations to Window. The full suite verifies the 14.6-second opening, replay, and six menu destinations with their correct headings and prompts. All 22 tests, TypeScript/Vite build, and 17 build checks passed. The user's Vite process was listening on port 5173. Browser control was unavailable for visual confirmation. The table below records the initial implementation run.

## Passed checks

| Check | Evidence and scope |
|---|---|
| Handoff integrity | `python3 Plexigent_Website_Handoff/tools/verify.py`: all 22 manifest files verified; exact wrapper, PNG bytes and geometry intact. Reference SHA-256 remains `11617b5f9b3806803364a6c41d9062c2784f3b9cfd3688c7e288fb0f1750a778`. |
| Unit and adapter integration | `npm test`: 21 tests passed. This includes five simulated-DOM integration tests, not a headless browser. |
| Reference drawing parity (partial V02–V05) | Six frozen times × eight widths = 48 **exact canvas-command traces** compared with the actual frozen reference renderer executed in a VM. Numeric coordinates, draw order, alpha, colors, image placement, glows and line geometry agree exactly. Widths: 320, 360, 390, 430, 768, 1100, 1366, 1920. This does not measure raster pixels, CSS placement or font rendering. |
| Domain parity | All seven point compositions agree exactly with reference expressions; transition endpoints checked. |
| Asset preservation | Both specimen SHA-256 values and the full externalized geometry match the handoff. The generated specimen asset filenames also match the old published asset URLs. |
| Clock behavior (partial M03–M07) | Deterministic 60Hz/120Hz time simulation, pause/resume, replay, interrupted work, no frames after completion, reduced motion and cleanup pass. These tests do not measure actual display frame rate. |
| Controller integration (partial N01–N06, M04–M07) | Direct routes/trailing-slash normalization, unknown route recovery, history, focus, About/Contact journey, menu focus containment/Escape, visibility/offscreen pause, failed images, completed Home return, Replay, reduced-motion changes, rapid navigation, resize/remount, wheel intent and native-overflow behavior pass in simulated DOM adapters. |
| TypeScript and production build | `npm run build` passes. Vite emits a 234,282-byte JS bundle (73.90kB gzip), 11,149-byte CSS, unchanged specimen PNGs, HTML, two SVGs and social PNG. Total: 8 files, 464,837 bytes. |
| Production output checks (D01–D02 partial) | `npm run test:build`: 17 tests passed (renderer checks repeated plus output checks). No development `sceneTime`, phase/profiling hooks or reference/QA pages in bundled output; file count and asset sizes below Free static limits. |
| Lint | `node node_modules/eslint/bin/eslint.js src/react-app vite.config.ts` passes. |
| Deployment dry-run | `npm run deploy:check` passes with explicit `--config wrangler.json`, no bindings. A first dry-run discovered a stale generated redirect to the old Hono bundle; it was removed, and deploy now explicitly selects the static config. No publication occurred. |
| Lockfile consistency | Unused Hono/Cloudflare Vite-plugin dependencies removed with offline package-lock-only resolution. Vite pinned to tested installed 7.3.6, using installed package metadata and the existing pnpm integrity record. A subsequent offline package-lock-only resolution passed. Clean `npm ci` was not run; complete registry cache was unavailable. |
| Sharing image | Generated from original butterfly geometry and inspected as a local PNG; correct cyan x stroke/i dot. This is asset inspection, not site/browser validation. |
| Patch hygiene | `git diff --check` passes. |

## Unverified and blocked

| Requirement | Result / reason |
|---|---|
| Watch reference before edits | **Blocked.** Python preview-server bind failed with `PermissionError: Operation not permitted`; browser security policy rejected `file://` navigation. Continued with exact source port and independent checks; no alternate browser-policy workaround attempted. |
| Live working preview | **Blocked.** No permitted server startup path established. `npm run dev` and `npm run preview` are prepared for a normal local terminal. No listening server is claimed. |
| Mac Safari / Chrome | Not tested. |
| Automated Chromium / WebKit | Not tested. No browser engine was run for this implementation. |
| Actual iPhone Safari / Android Chrome | Not tested. No device, toolbar, safe-area, orientation or real gesture evidence. |
| Screenshot overlays / full-page CSS comparison | Not performed; drawing-command parity is not a screenshot comparison. |
| Xi across platforms, 200% text, small/landscape layouts | Implemented safeguards; visual acceptance pending. Arial/CSS-mask reference treatment retained. |
| Actual 60fps, p95/p99, long tasks, GPU behavior | Not measured. Dev instrumentation is provided; no performance claim. |
| HTTPS preview / route refresh on Cloudflare | Not deployed/tested. Local route adapter tests do not exercise a real CDN. |
| Production account, plan, branch mapping, rollback deployment | Not inspected; no account access used. Public Cloudflare documentation confirms static compatibility, not actual account settings. |
| Feature branch, commit, checked-in handoff | **Blocked by read-only Git metadata.** Source files and durable guidance are present locally but uncommitted. |

Follow `checks/BROWSER_REVIEW.md` in a browser-enabled session, add actual evidence here, and update the snapshot/commit after fixes. All release/browser gaps remain open.
