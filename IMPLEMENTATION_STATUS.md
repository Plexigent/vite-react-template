# Plexigent implementation status

Updated 2026-11-20. Paul reviewed the local preview and confirmed it looks good. The build, tests, lint, handoff integrity check and Wrangler deployment dry-run pass. The production deployment is pending.

## Local preview correction, November 20

Paul started Vite on port 5173 and reported a frozen opening and stale Home text on menu selection. The shared clock now calls both animation-frame methods on Window. The controller harness reproduces the former illegal invocation and checks all six menu headings and prompts using the production clock adapter. All 22 tests, the production build and 17 build checks pass. Paul confirmed the fix worked after restarting the preview. The preview restrictions below describe the original implementation session.

## About and Contact revision

About now introduces Plexigent through the chrysalis, its mission, and its partnerships. Contact and the static HTML fallback open `info@Plexigent.com`.

## Working tree

- Base: `main` at `7a02f6ed7f518936b9b7e22bf886198464d28a1d`.
- Intended feature branch: `feature/approved-plexigent-experience`. `git switch -c` failed because this session can read but not write `.git`. No commit or push occurred. All edits remain in the working tree.
- Initial user work was only the untracked `Plexigent_Website_Handoff/` folder; its manifest contents remain unchanged. Generated `_qa/` fixtures are ignored.
- Exact source and built-file hashes are in `checks/SOURCE_SNAPSHOT.json`.

## Completed outcome

- Replaced the older single-screen/word-association/perpetual-wingbeat site with the approved opening and seven addressable scenes.
- Ported the 14.6-second renderer and domain geometry from the frozen study. Preserved PNG bytes and deterministic seeds; 48 exact drawing-command comparisons pass.
- Added direct menu access, About/Contact, real routes/history, replay, keyboard/touch/wheel handling, focus management, reduced motion, image fallbacks and scoped cleanup.
- Adapted the study's inline container for full viewport, safe areas, narrow screens and overflow/text enlargement. Paul reviewed the local appearance. The device-specific review is documented separately.
- Replaced the unused Worker/API setup with static assets, retained the Wrangler project name and old favicon URL, added matching SVG/social metadata. Explicit deploy configuration avoids a stale former plugin redirect discovered during dry-run.
- Added root guidance and one canonical `ARCHITECTURE.md`; the prior `productArchitecture.md` now points there. No contradictory legacy instructions remain.
- Passed TypeScript/Vite build, 22 tests, 17 build/renderer checks, source lint, handoff verification, patch hygiene and a static deployment dry-run.

## Commands and preview

Use Node 24+ (`nvm use`). From this repository:

```sh
npm run check
npm run dev
```

Vite prints a Local URL and a LAN Network URL for phone review. Paul ran the preview from his Mac terminal. `dist/client` contains the completed static build. `npm run preview` serves that build from an ordinary local terminal. An HTTPS Cloudflare preview is still required before release.

For deterministic dev frames, use `/?sceneTime=0.5`, `2.6`, `4.8`, `8.9`, `12.1` or `14.6` (seconds). Production ignores these hooks. The exact reference is available at `/Plexigent_Website_Handoff/reference/index.html` on the development server.

```sh
python3 Plexigent_Website_Handoff/tools/verify.py
npm run deploy:check
```

`deploy:check` is a dry-run only. `npm run deploy` would check/build and publish through the existing Wrangler project; it has **not** been executed.

## Release handoff

The current work is on local `main`. Include new files, changes and deletions in the release commit. Confirm the existing Cloudflare project for plexigent.com tracks this repository and production branch before pushing. Once the deployment succeeds, verify the opening and a direct Contact page load on the public domain.

Paul confirmed the updated preview looks good. The exact devices tested were unspecified. The detailed device matrix and clean-install build remain unverified in this session.
