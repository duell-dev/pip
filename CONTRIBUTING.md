# Contributing to Pip

Pip is an early Windows desktop project. The current build provides offline capture; the [roadmap](ROADMAP.md) lists the remaining version 1 work. Public code and artwork licensing is still undecided. This guide does not assign a license or introduce a contributor agreement.

## Start locally

Use Windows x64, Node.js 24.19.0 and pnpm 11.19.0. Fork the repository for a contribution, clone your fork, and create a branch for one focused change.

```powershell
pnpm install --frozen-lockfile
pnpm dev
```

You do not need provider credentials or the original project kit. Development data stays under `.local/development`; the packaged app uses `%APPDATA%\Pip`. Use an absolute `PIP_DATA_DIR` for a separate manual test profile. Do not test migrations or failure cases against your everyday data.

## Find the code

| Path | Responsibility |
| --- | --- |
| `src/main` | Electron lifecycle, window position, tray, validated IPC and credential boundary |
| `src/preload` | Narrow bridge exposed to the sandboxed renderer |
| `src/shared` | Data contracts and input validation |
| `src/data` | SQLite schema, transactions and the single database worker |
| `src/renderer/src` | React capture/inbox UI, CSS Modules and Pip canvas player |
| `assets/pip` | Application artwork and its provenance |
| `tests` | Offline SQLite, desktop, failure, restart and benchmark checks |
| `scripts` | Native runtime and packaging helpers |
| `evidence` | Historical validation snapshots; ordinary runs write to ignored `test-results` |

[IMPLEMENTATION.md](IMPLEMENTATION.md) records the selected stack, boundaries, measured results and known limitations. Keep changes within the current architecture unless a concrete problem warrants a change.

## Check a change

```powershell
pnpm format
pnpm format:check
pnpm test
pnpm test:desktop
```

For development-server or preload changes, also run `pnpm test:dev`. For asset, native dependency or packaging changes, run `pnpm package:dir` followed by `pnpm test:packaged`. Use `pnpm package:win` when checking the installer build. Graph performance changes need `pnpm benchmark`; changes affecting ongoing idle work need `pnpm test:baseline` (ten minutes).

Desktop tests show real windows and register shortcuts temporarily. Let them finish without interacting with those windows. They use disposable profiles and synthetic content. Routine tests never call an AI provider. Keep any future live-provider check separately opt-in and label its actual provider/authentication route and outcome.

The Windows CI workflow runs formatting, SQLite tests, desktop/development smoke checks, packaging and packaged smoke checks. It does not publish an installer or release. Describe skipped or unverified checks in your pull request rather than treating them as passes.

## Preserve these contracts

- Confirm capture only after SQLite commits. Preserve exact source text and revisions, keep drafts on failure, and test data-loss paths with real SQLite.
- User corrections, completions and deletions take precedence over inference. Validate proposals and their evidence before applying them; stale responses cannot recreate deleted records.
- Captured text and remote content are data. The organizer must not execute captured tasks or receive shell authority. Codex authentication stays with the official runtime; inspect configuration/tool access before execution.
- Keep renderer privileges restricted, validate IPC, and protect credentials with the OS. Never commit databases, private captures, tokens, keys, logs or local profiles.
- Keep provider and billing choices explicit. No silent provider switch or paid fallback. Missing AI access must leave capture usable.
- Preserve keyboard access, visible focus, reduced motion and quiet behavior. Pip's confirmation animation follows a saved capture.

Use exact dependency versions and update `pnpm-lock.yaml` with any dependency change. Keep migrations compatible with existing profiles; document recovery requirements for destructive changes. Avoid bundling unrelated refactors with a feature.

## Report or propose work

Use [issues](https://github.com/duell-dev/pip/issues) for reproducible bugs or a short proposal before a broad feature change. Include Windows version, app/commit version, steps, expected and actual behavior, and whether the issue occurs with a fresh profile. Share synthetic examples and redact private content from screenshots or logs.

Open pull requests against `main`. Explain the problem, resulting behavior, relevant roadmap IDs and commands actually run. Include a screenshot for visible changes and label simulations, such as disk-capacity or monitor-removal tests. Keep discussions respectful and focused on the work.
