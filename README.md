# Pip

A local Windows companion for quickly saving thoughts and links. This is the **offline capture milestone (0.1.0)**, not the complete version 1 product.

Click the small Pip panel at the top edge of your screen, or press **Ctrl+Alt+Space**. Type or paste a thought, then click **Save capture** or press **Ctrl+Enter**. The inbox displays the original text after SQLite commits it. **Escape** collapses the panel after saving the draft. Open Pip again through the panel, tray or shortcut.

Drag the **⠿ grip** on the small panel, or the expanded workspace's header, to move Pip. It snaps to the top edge when released and remembers the monitor and horizontal position after restart. Opening the workspace keeps your chosen position while fitting it onscreen.

Pip saves drafts as you type. Wait for **Draft saved on this device** before terminating Windows or Pip. A failed write keeps the input visible and prevents normal dismissal/quit; correct the problem and retry. Text labelled “Saving draft…” or “not saved” is not yet durable. No software can persist new input to a disk that cannot accept writes.

Settings offer three shortcut choices, disabling the shortcut, quiet mode and Quit. Sound is off; there are no provider connections or network requests in this milestone. Raw URLs are kept as text, without fetching titles or opening them automatically.

## Run locally

Use Windows x64, Node.js **24.19.0** (24.x) and pnpm **11.19.0**. Package versions and transitive dependencies are pinned in `package.json` and `pnpm-lock.yaml`.

```powershell
git clone https://github.com/duell-dev/pip.git
cd pip
pnpm install --frozen-lockfile
pnpm dev
```

Dependency installation and first-time packaging download public build dependencies. Running Pip and all routine tests requires no provider credentials. Electron 44 uses an explicit binary installer, included in `postinstall`; better-sqlite3 13 supplies the Windows x64 native prebuild. Do not manually rebuild the driver against an unrelated Node/Electron version.

## Check and package

```powershell
pnpm typecheck
pnpm format:check
pnpm test
pnpm test:desktop
pnpm test:dev
pnpm benchmark
pnpm package:win
pnpm test:packaged
pnpm test:baseline
```

- `test` builds and exercises real SQLite transactions, rollback, locks, capacity failures, source preservation and process termination.
- `test:desktop` runs the compiled development application through real Electron windows. Run `pnpm build` first after source changes.
- `test:dev` runs the actual electron-vite development server with temporary test instrumentation.
- `test:packaged` checks the executable in `dist/win-unpacked`, including native SQLite, 100 offline captures, failures and restarts.
- `benchmark` uses synthetic graphs in separate databases; it does not add a graph UI to this milestone.
- `test:baseline` measures ten minutes of idle packaged CPU/memory. It intentionally takes ten minutes.
- `package:win` creates `dist/Pip Setup 0.1.0.exe` and `dist/win-unpacked/Pip.exe`. `package:dir` builds only the unpacked application. These are **unsigned local development builds**. No signing, publication or updates are enabled.

Use `pnpm format` to format application sources and test scripts. It leaves the artwork alone. The tests create disposable profiles, reports and screenshots under `test-results`; they never use your regular Pip profile or call an AI provider. Some desktop tests temporarily register shortcuts and show application windows. Do not interact with those test windows while a suite runs.

## Data

The packaged application uses `%APPDATA%\Pip\pip.db`. Development uses `.local/development/pip.db` beneath this project. `PIP_DATA_DIR` can select an **absolute** isolated profile directory before launch; desktop tests use this to keep synthetic data separate. The directory also contains Electron's local cache. Settings show the active directory.

SQLite uses WAL journaling, full synchronization and transactional schema version 2. Version 1 databases migrate automatically, adding notch position storage while preserving captures and drafts. Captures have stable UUIDs, immutable original revision rows, timestamps, timezone and SHA-256 content hashes. A successful capture and replacement of its draft happen in one transaction. Retrying the same capture ID is safe. Draft versions reject stale writes.

The database is **not encrypted**. Do not copy only an active `pip.db` file as a backup; its WAL may contain committed data. In-app backup, export/import and restore remain in the version 1 backlog. No API keys or Codex tokens are stored by this build.

## Project record

- [Contributing: setup, code map and checks](CONTRIBUTING.md)
- [Roadmap and version 1 acceptance checklist](ROADMAP.md)
- [Implementation decisions and evidence](IMPLEMENTATION.md)
- [Artwork and provenance](assets/pip/README.md)

The repository contains everything needed to build the application. The local planning/prototype kit is excluded from Git tracking; application artwork lives in `assets/pip`. The active app reuses the existing bird and capture registration/timing, without copying the preview host. No public code/content license has been assigned. The full product still includes Codex login plus OpenAI, Claude and Gemini API-key connections, a persistent knowledge graph and interactive graph, corrections, check-ins and data portability. See the implementation record for current limitations and the next development batch.
