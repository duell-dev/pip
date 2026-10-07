# Offline application evidence

Recorded 7 October 2026, separately from the historical Codex/animation prototypes. All captures and encryption test strings are synthetic. No provider calls were made. User-data paths have been replaced by a profile description; other measurements are unchanged.

- `data.json`: real SQLite persistence, exact source, committed records, interrupted transaction and draft recovery, lock/capacity failure checks. Disk capacity and credential unavailability are controlled simulations, labelled in the report.
- `desktop.json`: compiled development Electron app, 100 captures and process-tree termination.
- `development.json`: actual electron-vite dev command, capture and renderer reload.
- `packaged.json`: final unsigned packaged app, 100 captures, failure retention, forced/graceful restart, shortcut collision, simulated monitor event and Windows protected-storage proof.
- `graph.json`: deterministic synthetic graph storage/query/rebuild experiment. No product graph feature is claimed complete.
- `baseline.json`: ten-minute Phase 0 idle measurement. This preceded the final source-preservation and lifecycle fixes; it is explicitly labelled as that baseline.
- `build.json`: sizes and SHA-256 hashes of the final local Windows artifacts. Installer execution/upgrade/uninstall are not tested.
- `inbox.png`: final packaged application after restart, with synthetic captures and a recovered draft.

Reproduce with the commands in the project README. Test reports regenerate under ignored `test-results/`; this folder is a deliberate snapshot of the milestone evidence, not an automatically updated test output directory.

The movable-notch follow-up rebuilt the same local artifact paths. These original build hashes remain historical; current follow-up evidence is in `../movable-notch/`.
