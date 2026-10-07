# Movable notch evidence

Recorded 7 October 2026. This follow-up preserves the original offline milestone evidence in the adjacent folder. Reports use synthetic data and isolated profiles; no provider calls were made.

- `data.json`: real SQLite v1-to-v2 migration preserves 102 captures and a draft; position validation and reopen checks pass. Run `pnpm test` (the recorded final run used `node scripts/electron-node.cjs tests/data.cjs` after the successful build).
- `desktop.json`: `pnpm test:desktop` passed the compiled development window, position persistence and offline capture regression checks.
- `packaged.json`: `pnpm test:packaged` passed those checks against the rebuilt packaged executable. Move events are simulated; top snap, edge clamping, expand/collapse and forced/graceful restart use real Electron windows and SQLite.
- `development.json`: `pnpm test:dev` checks the actual development server, capture and draft recovery.
- `build.json`: successful `pnpm package:win` output hashes. Installer installation/upgrade/uninstall remain untested. The owner separately confirmed native Windows dragging works. Automated native pointer verification was obstructed by another foreground window and is not claimed as a pass.

`pnpm format:check` and `git diff --check` also passed. Physical monitor removal remains unverified.
