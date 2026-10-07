# Pip project kit validation

## Application milestone evidence — 7 October 2026

The parent directory now contains a working offline application. Its separate `IMPLEMENTATION.md` and `evidence/offline-capture/` record actual SQLite, Electron, packaged-window and benchmark results. The original prototype/kit evidence below remains distinct.

- Development and packaged Windows x64 capture-to-SQLite-to-inbox flows passed without credentials or internet.
- 100 acknowledged captures survived full process-tree termination and restart in each desktop suite. Draft dismissal/restart and graceful quit were checked.
- Real SQLite lock contention, transaction rollback and a controlled database capacity ceiling tested failure behavior. Physical disk exhaustion and hardware power failure were not performed.
- The selected graph-store candidate was measured against 10,000 captures and up to 50,000 nodes / 150,000 edges. This does not complete PIP-10/PIP-11.
- Actual synthetic Windows protected encryption/decryption passed; unavailable-credential-store behavior was simulated and failed closed.
- The unsigned installer was built; packaged executable tests do not establish clean-machine installation, upgrade or uninstall behavior.
- No live provider request, account modification, publication or license assignment was made.

The supplied asset/probe files are unchanged. The kit manifest is intentionally refreshed for these documentation updates; its original state is preserved in the initial local Git commit.

## Original kit validation record

The handoff is a planning package with portable design assets and an integration probe. It does not contain a working productivity application. Product acceptance checks remain tasks in DEVELOPMENT_PLAN.md.

## Checks for this package

- Required documents, their relative local links, the five animation atlases and metadata are checked by `tools/check-kit.cjs`.
- MANIFEST.json records each packaged file's byte count and SHA-256 hash. It excludes itself, installed dependencies, Git internals, generated preview screenshots and later local probe outputs.
- Packaged text and scripts are checked for machine-specific paths back to the original workspace.
- The animation browser check exercises sixty distinct frames, fixed canvas bounds, scrub/pause, one-shot completion, three chirps, muted defaults, reduced motion and 320/736-pixel light/dark layouts.
- The standalone browser check opens the exported file with HTTP/HTTPS requests blocked and verifies that artwork and controls work without the chat host.
- Relocation validation copies the package into a differently named directory containing spaces and a non-ASCII character, checks it there, rebuilds its assets, and opens its standalone preview there.

The maintenance scripts use Node.js and the pinned Sharp/Playwright dependencies declared in tools/package.json. A browser check uses installed Edge by default or Chrome through `PIP_BROWSER_CHANNEL`. The supplied pip.html requires only a modern browser, not those developer dependencies.

## Commands after moving the folder

```powershell
cd tools
pnpm install
pnpm run check:kit
pnpm run check:preview
pnpm run check:standalone
```

For intentional art/player changes:

```powershell
pnpm run build:assets
pnpm run check:preview
pnpm run check:standalone
pnpm run manifest
pnpm run check:kit
```

The generated screenshots go to preview/checks and are not shipped application assets. A successful rebuild is not a new art-generation request and makes no inference calls.

## Package results — 6 October 2026

All package checks passed: 39 inventoried files, hashes, relative document links, portable paths and sprite metadata. The browser checks passed for all sixty frames, playback controls, chirps, reduced motion and responsive layouts. The standalone preview loaded and responded with internet requests blocked.

A temporary copy in a renamed folder containing spaces and `ő` passed the same integrity and offline-preview checks. Rebuilding its assets reproduced the manifest hashes exactly. The temporary copy was removed after validation.

## Existing integration evidence

The recorded Codex test result is from 5 October 2026. It establishes successful synthetic structured output using the official local SDK with ChatGPT login and fresh-process reuse. It does not establish application-level durability, exhaustive authentication recovery, all billing conditions, public-distribution approval, or live API-key support for the other providers.

No live AI request or external provider contact is required by the package checks. See AI_INTEGRATION.md for the complete evidence boundary and outstanding tests.

## Remaining design limitations

The mascot animation is a generated frame prototype. Registration reduces drift but does not guarantee a perfectly invariant silhouette, texture or camera angle. The production target remains a planted character with independently moving parts. No new visual-design work should displace the first software implementation milestones.

Open-source licensing, final tray/app icons, signing, updater distribution and actual application performance remain implementation/release work. Documentation performance figures are targets, not measured application claims.
