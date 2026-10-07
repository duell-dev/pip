# Codex subscription integration probe

This disposable probe sends three synthetic captures through the official local Codex SDK and checks the exact structured result. It is integration evidence, not application code. The recorded `codex-result.json` is the successful run from 5 October 2026 and is preserved separately from new runs.

Install Node.js, pnpm and the official Codex runtime. Sign in through `codex login`. Then, from this directory:

```powershell
pnpm install --frozen-lockfile --ignore-scripts
pnpm test
```

`pnpm test` runs local assertions; it sends no inference request. To deliberately run one live synthetic request against the current account:

```powershell
pnpm run check:codex
```

This consumes the applicable allowance and writes `codex-result.local.json`. The probe requires the runtime on PATH, or an explicit `COMPANION_CODEX_BINARY` path supplied by the developer. It strips API-key/access-token/base-URL environment overrides and requires the runtime to report ChatGPT login.

The scratch directory is created locally. No personal notes, credentials, auth files or account exports are included in this folder. Do not add the runtime's authentication files to this kit. See the root AI_INTEGRATION.md for the limits of the existing evidence, including unverified additional billing conditions and inherited-configuration overhead.
