# Offline capture milestone — 7 October 2026

The owner's implementation instruction supersedes the kit's previous planning-only authorization. Product requirements are unchanged. This milestone implements Phase 0's offline gate and the first capture batch; it does **not** complete all of Phase 1 or version 1.

## Decisions

| Area | Decision and reason |
| --- | --- |
| Windows shell | Electron 44.6.0, React 19.3.0, TypeScript 7.0.2. Actual development and packaged Windows x64 windows tested. No server component. |
| Build | electron-vite 5.0.0 with Vite 7.3.7 and React plugin 5.2.0. Vite 7 satisfies electron-vite's declared peer range; latest Vite 8 was deliberately not selected. pnpm 11.19.0, hoisted layout in `pnpm-workspace.yaml`, exact direct versions and frozen lockfile. |
| Native database | better-sqlite3 13.0.3, bundled SQLite 3.53.4. Its Windows x64 prebuild runs in Electron 44.6.0 (Node 24.21.0). One worker thread owns the only application writer. Native module remains external to the Vite bundle and unpacked from ASAR. |
| Packaging | electron-builder 26.15.3, unsigned NSIS installer and unpacked executable. Explicit `--publish never`; resource editing applies the existing bird as the app icon; code signing disabled. No updater. |
| Data directory | Packaged `%APPDATA%\Pip`; development `.local/development`; absolute `PIP_DATA_DIR` override for isolated profiles. UI shows the path. |
| Migrations | Transactional `PRAGMA user_version`, current version 2. Version 2 adds one notch-position row without modifying captures/drafts. Startup refuses a newer schema rather than writing to it. Prior destructive migrations do not exist yet; the first such migration must use SQLite's supported backup API before changing data. |
| Durability | WAL, `synchronous=FULL`, foreign keys, 1.5-second busy timeout. Exact text and SHA-256 hash are stored in a revision row. Capture plus replacement draft commit atomically. Replies, inbox insertion and Pip's capture motion follow commit. |
| Drafts | Immediate per-change worker writes with stable ID and monotonic version. Stale autosaves cannot recreate submitted drafts. Same-ID retries return the existing capture; mismatched content is rejected. Dismiss/quit flush the current draft and wait for writes. |
| Initial schema | Captures, source revisions, one current draft, preferences. No unused item, graph, scheduler or provider tables. Phase 2 will enqueue existing unorganized revisions in its migration. |
| Physical graph | Keep SQLite node/assertion/edge tables. The isolated benchmark covers the specified corpus and query classes; no evidence justifies a second engine. The interactive Cytoscape view remains mandatory in Phase 4. Cytoscape is not installed before there is a graph view to implement. |
| Credentials | Select main-process Electron asynchronous `safeStorage` (Windows DPAPI). Live synthetic encryption/decryption and plaintext-absence check passed. The guard refuses unavailable encryption; no plaintext persistence fallback. Key entry, ciphertext persistence and adapter routing are Phase 3 work, not simulated product features. |
| Codex | Application has no SDK, login request, provider call or organizer tool access. Existing SDK/CLI 0.160.0 probe is retained as historical evidence only. Missing runtime/sign-in leaves capture fully usable. Phase 2 must validate official login and pre-execution config/tool isolation before enabling the organizer. |
| License | No license assigned. MIT is a possible code-license proposal for owner review before public release; artwork/content and release notices remain separate decisions. |

SQLite lives behind the worker boundary; the main process handles windows, tray and validated IPC. Renderer Node integration is disabled; sandbox and context isolation are enabled. Each IPC request checks the window, main frame, exact trusted URL and bounded payload. Navigation, new windows, permissions and remote requests are denied. The packaged renderer has a CSP; only development relaxes inline scripts for React refresh. Captured text is rendered as text, without HTML interpretation or link execution.

The original source string passed to the capture API is not trimmed, normalized or classified. The input handler preserves raw pasted text (including CRLF) and maps textarea edits back onto it so untouched line endings survive. Newly typed line breaks use the browser's LF convention. Source editing/revision UI for already saved captures is part of the next batch.

Pip uses the supplied registration transforms, including corrective alignment, and plays one capture animation only on successful save. Idle is a still frame, sound is off, quiet/reduced-motion modes show still poses. There is no whole-character activity bounce. Residual drift in the source art remains a known prototype limitation.

## Validation record

Actual commands run from the project root, on Windows 11 Pro build 26300, Intel Core i7-13650HX (12 logical CPUs exposed), 23.73 GiB RAM. The build host uses Node 24.19.0 and pnpm 11.19.0. Electron runtime versions are reported by the tests. Reference monitors include 100% and 150% scaling; the ordinary workspace smoke run used a 100% monitor.

| Command/check | Outcome |
| --- | --- |
| `node pip-project-kit/tools/check-kit.cjs` before changes | Passed: all 39 inventoried supplied files, hashes, links and metadata. |
| `pnpm install --frozen-lockfile` | Passed after resolving pnpm 11 build policies and explicitly invoking Electron's binary installer. Squirrel installer scripts are denied because this app uses NSIS. |
| `pnpm typecheck` / `pnpm build` | Passed, native driver externalized and renderer/preload bundles generated. |
| `pnpm test` | Passed real SQLite tests: exact source, revisions/hash contract, idempotency, stale drafts, validation, paging, rollback, newer-schema refusal, 102 committed records after reopen, forced exits at defined transaction points. |
| Lock failure | Real second connection/process holds `BEGIN IMMEDIATE`; `SQLITE_BUSY` leaves input visible and prevents dismissal. Retry succeeds after unlock. |
| Capacity failure | Real `SQLITE_FULL` generated with a controlled `max_page_count` ceiling. This simulates disk capacity exhaustion; the host disk was not filled. No partial capture and last committed draft remains. |
| Mid-transaction failure | Controlled SQLite trigger rejects revision insertion after capture insertion; the whole transaction rolls back. A separate subprocess is forcibly terminated with an open transaction; startup recovers with no partial capture. |
| `pnpm test:desktop` | Passed real Electron window: 100 captures offline, exact displayed original, failed save, dismissal, process-tree termination, restart, drafts, paging, shortcut changes, quiet settings, reduced motion and graceful quit. |
| `pnpm test:dev` | Passed actual electron-vite dev command, SQLite capture, inbox and draft recovery after renderer reload. Test-only debugger uses an ephemeral port. |
| `pnpm package:win` | Built unsigned NSIS installer and packaged x64 executable with SQLite inside the app's packaged dependencies. |
| `pnpm test:packaged` | Passed the same offline 100-capture/failure/restart suite against `Pip.exe`, with `app.isPackaged=true` and isolated profile containing spaces/non-ASCII characters. |
| Credential unavailable | Simulated OS-unavailable result; guard fails before encryption and returns no key/ciphertext. Actual Windows synthetic encryption/decryption was also tested. No provider credentials used. |
| Shortcut collision | Real registration collision held by the test process; the rejected shortcut does not replace the working saved shortcut. |
| Monitor recovery | Simulated `display-removed` event after moving the window offscreen; it returns inside an actual monitor work area. Physical unplug remains unverified. |
| `pnpm test:baseline` | Completed 600 seconds of packaged idle sampling; 0.0146% mean summed Electron CPU and 361.8 MiB peak summed working set. |
| Provider checks | No live tests, account changes, provider requests, copied tokens or outreach. Historical Codex evidence remains unchanged. |

Final focused runs: database save p95 **1.43 ms** for 100 synthetic ~20 KB captures; UI save p95 **67.0 ms** packaged / **67.2 ms** compiled development (includes Playwright click/wait overhead). Packaged launch to ready input was **571 ms** in one instrumented warm run, not a startup percentile. The first 100 acknowledged UI captures survived a full Windows process-tree termination; one more capture and a draft survived graceful quit/relaunch. Hardware power loss is not tested.

The earlier failed restart harness killed only Electron's launcher, leaving its child application alive. The test now uses Windows process-tree termination. Desktop tests also exposed and fixed a settings response field accidentally being sent back as a preference input. These failed attempts are not counted as passes.

Reports/screenshots live in ignored `test-results/`. Screenshots contain synthetic test content only. Evidence saved in `evidence/offline-capture/` retains result summaries without machine-specific profile paths.

The ten-minute Phase 0 baseline used an empty profile, collapsed still Pip and attached Playwright instrumentation. It was measured before the final paste-preservation and dismissal/animation-replay fixes; those changes do not introduce idle timers. Summed working sets can double-count shared pages and are not private-memory usage. Provisional regression budgets on this reference machine: under 450 MiB summed working set for the empty idle profile, under 1% idle CPU (the PRD target), and under 150 MiB for the unsigned installer. These are local measurement budgets, not cross-machine guarantees.

Official interfaces consulted during implementation: [electron-vite dependency handling](https://electron-vite.org/guide/dependency-handling), [Electron renderer security](https://www.electronjs.org/docs/latest/tutorial/security), [Electron safeStorage](https://www.electronjs.org/docs/latest/api/safe-storage), and [electron-builder native dependencies](https://www.electron.build/v26/docs/tutorials/two-package-structure/). Installed declarations and source were also inspected for the pinned versions; future adapter implementation must recheck its own official documentation.

## Graph experiment

`pnpm benchmark` runs the proposed query classes against real on-disk SQLite with WAL/full sync, foreign keys and indexes on source/target/relation. Each corpus includes **10,000 synthetic captures**. Queries include project membership, one hop, two hops, supporting source evidence, unresolved task prerequisites, resources by project and FTS5. Initial returned graphs are bounded to 100 nodes; search returns 50 rows.

| Corpus | Ingestion | Rebuild from assertions | Delete 100 sources | Largest query p95 | DB size |
| --- | --- | --- | --- | --- | --- |
| 25,000 nodes / 75,000 edges | 544 ms | 232 ms | 8.2 ms | 0.14 ms | 19.8 MiB |
| 50,000 nodes / 150,000 edges | 1,059 ms | 514 ms | 13.9 ms | 0.24 ms | 33.2 MiB |

These are deterministic synthetic, warm-cache measurements (100 samples/query), not full product graph acceptance, a cold-cache guarantee or a Cytoscape rendering benchmark. Rebuild uses accepted synthetic assertions without model calls; deletion verifies foreign keys/integrity. Multiple supporting assertions, corrections and source revision reconciliation still need the Phase 4 product implementation and tests. FTS5 works in the selected binary; search UI is the next batch.

## Limits and next batch

This build is suitable for reviewing the capture-to-SQLite-to-inbox flow. It has no manual editing, tasks/projects/areas UI, FTS search UI, AI organizer, graph UI, daily check-in, export/import or backup/restore yet. It does not fetch or open saved links. The initial database is not encrypted. Raw input is limited to 1 MB per capture/draft; ordinary capture performance was measured around 20 KB.

Physical monitor removal, 200% display scaling, full keyboard/screen-reader accessibility review, sleep/resume, fresh-machine installer execution, installation upgrade/uninstall and real hardware power loss remain unverified. The NSIS installer was built, but the packaged executable was tested directly; an installer being generated is not evidence of a full installation/upgrade test. Windows x64 is the tested target; ARM64 is not claimed.

Next: complete Phase 1 with source detail/revisions, editable Personal / Day job / Side hustle, manual task/note/idea/resource types, status/priority/date corrections, undo and FTS search. Then implement the persisted Codex organization queue with pre-execution isolation and stale-result protection. Codex-only alpha remains an intermediate milestone; version 1 still requires all four explicit providers, validated graph plus interactive view, grounded next actions, one configurable daily check-in and tested data portability.

## Movable notch follow-up — 7 October 2026

The owner requested a movable top notch and confirmed the drag works in Windows. Native Electron drag regions cover the collapsed grip and expanded header; header buttons remain interactive. On release Pip snaps to the selected monitor's work-area top. SQLite stores the display ID and fractional horizontal center. Expanding, collapsing and monitor changes clamp the window onscreen without replacing that anchor. Missing monitors fall back to a current display. A failed position write is reported.

The existing SQLite test now verifies migration from version 1 with 102 captures and a committed draft, position validation and persistence after reopen. The desktop suite simulates native move events and checks top-edge snap, edge clamping without anchor loss, and position recovery after forced and graceful restart. These event simulations are separate from the owner's manual drag confirmation; automated native pointer verification was obstructed by another foreground window. Physical monitor removal remains unverified.

Follow-up build and test evidence is in `evidence/movable-notch/`. The earlier `evidence/offline-capture/` reports and build hashes describe the original milestone build and are preserved as historical evidence. Official native window behavior: [Electron drag regions](https://www.electronjs.org/docs/latest/tutorial/custom-window-interactions) and [BrowserWindow movement events](https://www.electronjs.org/docs/latest/api/browser-window).
