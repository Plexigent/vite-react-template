# Plexigent — Connecting Dots

The approved wordless metamorphosis and four-domain experience, implemented in React, TypeScript and Canvas. Builds to static assets compatible with Cloudflare Free.

Read `ARCHITECTURE.md`, `IMPLEMENTATION_STATUS.md` and `checks/RESULTS.md` for implementation and validation status. The original handoff remains intact under `Plexigent_Website_Handoff/`.

## Local development and review

Use Node 24 or newer (`nvm use` reads `.nvmrc`). On a clean checkout:

```sh
npm ci
npm run check
npm run dev
```

Open the Local URL printed by Vite. `dev` binds to the LAN so a phone on the same trusted Wi-Fi can use the printed Network URL. This is an HTTP local preview, not the required HTTPS release preview.

Review the production build with:

```sh
npm run build
npm run preview
```

Dev-only deterministic times are in **seconds**: `/?sceneTime=0.5`, `2.6`, `4.8`, `8.9`, `12.1`, or `14.6`. These do not work in production. Development DOM attributes report time, phase, draw count, frame p95/p99 and average JavaScript draw time; they do not measure GPU time or certify device performance.

The reference can be viewed from the dev server at `/Plexigent_Website_Handoff/reference/index.html`. To generate its frozen fixtures:

```sh
python3 Plexigent_Website_Handoff/tools/make_qa.py
```

Open `/Plexigent_Website_Handoff/_qa/index.html` on the dev server. Reference/QA files are outside `public` and are not part of the deployed build.

## Checks

- `npm test`: reference integrity, 48 exact canvas-command comparisons, domain geometry, motion clock, route/copy contracts and simulated-DOM controller integration.
- `npm run build`: TypeScript and Vite production build to `dist/client`.
- `npm run test:build`: static hosting limits, no leaked development hooks, plus renderer checks.
- `npm run check`: runs the above in order.
- `npm run lint`: project lint.
- `npm run deploy:check`: Wrangler static-deployment dry-run (no publication).
- `python3 Plexigent_Website_Handoff/tools/verify.py`: checks the immutable handoff manifest.

See `checks/BROWSER_REVIEW.md` for the browser/physical-device acceptance that remains unperformed.

## Deployment

The existing Wrangler name is retained. `npm run deploy` validates/builds and deploys static assets with SPA fallback; it requires the account's existing authentication. It has **not** been run. For Cloudflare Pages, build with `npm run build`, publish `dist/client`, and keep SPA routing enabled. No backend or paid service is required.

Before a release, confirm the account's production branch/auto-deploy settings and current rollback version, create an HTTPS preview, and complete the recorded browser/device review. Do not push to `main` merely to obtain a preview.

The SVG/favicon and social image can be regenerated on macOS, without affecting the web runtime:

```sh
swift -module-cache-path /tmp/plexigent-swift-cache scripts/generate-brand-assets.swift
```
