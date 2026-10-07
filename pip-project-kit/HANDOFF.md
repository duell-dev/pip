# Pip isolated project handoff

Use this folder to start a new, isolated software project. The owner requested a complete plan and assets before implementation. No product application has been created, and no implementation should be inferred from the animation demo or the synthetic Codex probe.

## Brief for the next development session

Build Pip, an open-source Windows notch-style personal productivity companion. It accepts unstructured text and links, saves immediately in SQLite, and uses background AI to extract organized items and a traceable knowledge graph. Its main job is helping the user choose a next action from commitments and priorities, then time and energy. Preserve the selected apricot bird and keep the interface gentle and optional.

Read PRD.md, ARCHITECTURE.md, DEVELOPMENT_PLAN.md and AI_INTEGRATION.md before changing scope. Start with Phase 0 and the first offline capture batch. The full version 1 includes an interactive graph, one configurable daily check-in, and four explicit AI choices: Codex login, OpenAI API key, Claude API key and Gemini API key. A Codex-only alpha must be labeled as such.

SQLite is the immediate durable store. A small model organizes records asynchronously. Graph nodes/edges can initially be implemented in SQLite if the benchmark supports that choice; a physical graph engine remains a Phase 0 decision. The accepted knowledge-graph requirement is not optional.

Do not overwrite user edits with extraction results, invent deadlines, silently switch billing routes, execute captured tasks, or send provider inquiries. Keep credentials behind an OS-protected boundary and out of renderer state, Git, logs and exports. Existing login belongs to the official Codex runtime; no session-token copying.

## Decisions already made

- Product name and mascot: Pip, the apricot bird.
- Windows first; mobile, separate server/self-hosting and SaaS later.
- Text/link capture, editable life areas, projects, tasks, notes, ideas, saved media and an interactive graph.
- Immediate SQLite persistence followed by background organization with a small model.
- Codex login plus three API-key choices. Claude/Gemini subscription access is deferred.
- One configurable daily check-in; bird chirps optional; reduce interruption and guilt.
- Real articulated animation, with Pip planted in place. The current frame-based draft has improved but residual drift remains.
- External provider outreach stopped. No new messages or inquiries without a new instruction.

## Recommendations to finalize

| Decision | Proposed default or next step |
| --- | --- |
| Framework/build | Electron, React, TypeScript, electron-vite, pnpm; prove packaged Windows behavior first |
| SQLite driver | Evaluate better-sqlite3 with packaged Electron ABI support |
| Physical graph storage | Benchmark SQLite node/edge tables against actual version 1 queries |
| Background model | Small accessible model that passes evaluation; Luna is a candidate, not a guaranteed identifier |
| Credential storage | Windows-protected store, with no plaintext persistence fallback |
| Check-in time | User choice during onboarding; keep disabled until configured |
| Shortcut | Configurable with conflict handling; confirm a default during Phase 1 |
| Code/content license | Owner decision before public publication; no license has been assigned here |
| Repo and signing | Owner chooses destination/identity when preparing release |

## Evidence to reuse

The Codex SDK/CLI 0.160.0 proof succeeded twice on 5 October 2026, including restart, with ChatGPT login and no API key. It had 14,861 input tokens for the recorded tiny synthetic batch, so configuration isolation and prompt overhead require attention. Expired login, cancellation, natural quota exhaustion, the application queue and all API-key integrations remain unverified.

The animation preview and its checks are complete prototypes. They do not prove Windows shell behavior, SQLite durability, graph correctness or any application feature. The sources and standalone preview are self-contained in this kit.

## Working approach

Use the simplest implementation that satisfies each acceptance gate. Prefer one SQLite writer and one organization worker initially. Validate trust boundaries and data-loss paths; do not add an autonomous agent framework, event broker, cloud authentication, sync layer or extra server for hypothetical future scale.

The first batch should package a Windows shell and persist one offline capture with draft recovery and a restart test. Continue in the new project when the owner instructs implementation. This kit itself is safe to move, rename and place under source control after reviewing its contents.
