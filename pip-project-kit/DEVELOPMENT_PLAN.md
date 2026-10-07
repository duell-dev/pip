# Pip development plan

Build Pip in an isolated project from this kit, starting with durable capture and a small complete workflow. The deliverable at each phase is running software with a specific acceptance gate. The Codex-only personal alpha is an intermediate milestone; version 1 retains all four AI connections and the graph.

The effort ranges below assume one experienced developer working primarily on this project. They are planning estimates, not a delivery commitment. They exclude time waiting for signing credentials, provider access or outside review. Total estimated engineering effort is 35–55 focused days, approximately 7–11 full-time weeks. Re-estimate after Phase 2 with actual package, model and interaction measurements.

## Phase sequence

| Phase | Effort | Deliverable | Depends on |
| --- | --- | --- | --- |
| 0 | 2–3 days | Recorded stack choices and a reproducible isolated workspace | This kit |
| 1 | 4–6 days | Offline desktop capture, inbox and editable records | 0 |
| 2 | 5–8 days | Durable organization queue with Codex login | 1 |
| 3 | 6–9 days | OpenAI, Claude and Gemini API-key connections | 2 |
| 4 | 5–8 days | Search, validated knowledge graph and interactive graph | 2; integrate 3 before full release |
| 5 | 5–8 days | Next-action assistant and one daily check-in | 4 |
| 6 | 4–6 days | Recovery, data portability and packaged Windows candidate | 3 and 5 |
| 7 | 4–7 days | Personal trial fixes and open-source release preparation | 6 |

Source control and normal documentation begin in Phase 0 and continue throughout. Do not wait until Phase 7 to start testing or to write setup instructions.

## Phase 0 Establish the isolated project

Tasks:

1. Copy this kit into the chosen project root and preserve it as the initial product brief. Confirm PRD acceptance IDs with the owner; record any scope changes.
2. Select and pin compatible Electron, React, TypeScript, build, database and packaging versions. Prove a Windows packaged launch with the selected SQLite driver before writing the full UI.
3. Measure baseline startup, memory and idle CPU. Record the Windows version, CPU, RAM and display scaling of the reference machine.
4. Spike node/edge tables with the representative graph queries and benchmark sizes in ARCHITECTURE.md. Record whether SQLite is adequate or a dedicated embedded engine is needed, including packaging and rebuild implications.
5. Re-run the included Codex probe only when an appropriate signed-in account is available. Record runtime versions and usage. Investigate supported instruction/configuration isolation and unexpected tool access before enabling background processing.
6. Choose the secret-store implementation and validate failure behavior. Choose an initial open-source license proposal; owner approval is needed before publishing under it, not before routine local development.
7. Set up a local development command, formatting/type checks, a small test command and a Windows build check. Keep generated data and secrets out of Git.

Exit gate: a packaged empty shell can start and persist a synthetic record; the physical graph decision, dependency versions, data directory and credential approach are recorded; Codex setup has a clear failure path. No model alias is assumed available merely because it appeared in this planning conversation.

## Phase 1 Make capture reliable without AI

Implement PIP-01, PIP-02, PIP-03 and the local portions of PIP-05, PIP-08, PIP-09 and PIP-18.

- Add single-instance lifecycle, tray access, shortcut registration, top-edge companion positioning and an expandable workspace.
- Implement the SQLite migrations, capture/revision transaction, draft recovery and persistence errors.
- Build Inbox, item detail and basic Tasks views. Add editable initial life areas and project assignment.
- Add manual type/status/priority/date changes, undo and original-source inspection. Preserve date precision and explicit clearing of a value.
- Add local text search that includes unprocessed captures. Use seed fixtures only in a separate development/test profile.
- Add local-only onboarding. Adopt existing Pip assets without another visual-design phase.

Exit gate: after submitting 100 synthetic captures, restart and forcibly terminate the application at defined points. Every acknowledged capture remains present; uncommitted text remains a draft or visibly unsaved. Editing and searching work with no network or provider credentials. Test shortcut collision and monitor removal.

## Phase 2 Organize through Codex in the background

Implement PIP-04, PIP-06, PIP-07, PIP-15 and Codex's portion of PIP-14.

- Implement persisted job states, leases, revision-based idempotency, retry/backoff, pause and cancellation.
- Add Codex installation detection and guided official login. Display the selected authentication method. Reject API-key fallback when the Codex-login connection is selected.
- Create a minimal extraction schema and provider result validator. Limit input/output sizes and ensure source evidence exists.
- Add safe application of model proposals, field overrides, stale-response rejection and multi-item capture reconciliation.
- Persist extraction version and usage metadata without sensitive payload logging. Show pending, processing, blocked and failed states.
- Add a small evaluation corpus before tuning prompts. Include explicit tasks, ideas, completed work, negation, mixed captures, dates, URLs and prompt-injection text.

Exit gate: the complete capture → persisted job → Codex classification → correction → restart workflow passes. A correction made during inference wins. Deleting a capture during inference cannot recreate it. Killing a worker recovers one job without duplicating items. Cancellation and simulated auth/quota errors leave no partial changes. At least one successful real background classification is recorded using Codex login.

Milestone: a clearly labeled Codex-only personal alpha can now be used privately. It is not the full version 1 promise.

## Phase 3 Complete the four explicit AI options

Finish PIP-14 and strengthen PIP-15/PIP-18.

- Introduce only the shared provider contract required by the four actual adapters: connection status, capabilities, structured extraction, grounded answer, cancellation, usage and normalized errors.
- Add OpenAI API, Claude API and Gemini API adapters with explicit provider endpoints and model selection. Use native structured-output support where available and validate results independently.
- Add protected API-key entry, replace/remove actions and a synthetic “test connection” command. Return only masked status to the renderer.
- Keep background and interactive model choices separate. Let users choose one provider for both or make an explicit split.
- Display the exact connection and account/billing category. A quota block presents options; it does not switch provider or authentication route by itself.
- Add provider-specific contract fixtures for incomplete outputs, refusals, network timeouts, 401/403, 429, unsupported models and malformed data.

Exit gate: each option completes the same synthetic extraction suite and at least one live request when test credentials are available. If a live test is unavailable, keep that provider visibly unverified and do not label the release complete. Keys never appear in normal logs, exports, renderer snapshots or process command lines. A provider change does not corrupt pending work or accepted output.

## Phase 4 Make the graph useful

Implement PIP-09, PIP-10 and PIP-11.

- Add accepted entity and relationship assertions with source provenance, normalized types and conservative deduplication.
- Build the graph projection and a rebuild operation from validated records, including user additions and rejected links.
- Implement project/area subgraph queries, backlinks and dependency validation. Index the actual query predicates.
- Build the Cytoscape view with selection, filtering, bounded expansion and source inspection. Add a keyboard-accessible related-items list.
- Make rename, archive, merge review, deletion and source revision changes update the graph consistently.
- Add a compact graph health indicator only when the index is stale or rebuilding. Keep capture available during rebuild.

Exit gate: graph rebuild makes no AI calls and preserves manual links and corrections. An item with two source assertions keeps the relationship after only one is removed. The performance corpus meets the scoped-view targets. User testing can find a relevant resource from a project without opening an unbounded network.

## Phase 5 Help choose and start the next action

Implement PIP-12, PIP-13, PIP-17 and resource recommendation behavior.

- Implement deterministic task eligibility and prioritization rules before adding natural-language explanations.
- Add time/energy inputs and “Why this?” with the relevant commitments, priorities and evidence. Support a local agenda when inference is unavailable.
- Add grounded question answering over bounded retrieved context. Validate every returned item ID and distinguish source facts from suggestions.
- Add “help me start,” with proposed first steps requiring acceptance before becoming tasks.
- Add saved-video/music retrieval by topic, type and known duration; unknown duration stays unknown. Open links only on explicit action.
- Add a durable daily-check-in schedule with local timezone, once-per-day identity, sleep/resume, quiet hours and snooze behavior.
- Connect mascot states to actual events. Keep optional sounds muted by default, rate limit notifications, and respect reduced motion. Do not let unfinished asset polish block the core flow.

Exit gate: ranking fixtures prove that an easy low-priority task does not silently displace a hard explicit commitment, blocked tasks are handled correctly, and no suggestion invents an item or date. The scheduler sends at most one intended check-in per local day across restart, DST and sleep cases. Repeated background retries produce no repeated chirps.

## Phase 6 Make daily use and upgrades safe

Finish PIP-16 and the nonfunctional release targets.

- Add versioned export/import, backup creation, restore validation and a migration recovery path.
- Exercise disk-full and database-lock failures, interrupted writes, stale leases, unavailable credentials and provider outages.
- Tune source/output size bounds, queue concurrency and retrieval limits against measured latency and resource use.
- Build the Windows installer and uninstall behavior. Preserve user data unless its deletion is explicitly chosen.
- Test a clean machine/profile, installed paths with spaces, non-ASCII text, multiple monitors and 100/150/200% scaling.
- Review the IPC boundary, URL opening/fetching, logs, dependencies and release permissions. Produce a diagnostic bundle that excludes content and secrets by default.

Exit gate: install, upgrade, export, restore and uninstall tests pass. A restored profile yields the same effective tasks and graph. No known data-loss, credential exposure, stale-write or repeated-alert issue remains. Record measured performance rather than replacing targets with guesses.

## Phase 7 Personal trial and release preparation

- Run a two-week personal trial across real workdays and gaps. Track a small local sample of correction burden and recommendation usefulness; do not add remote analytics by default.
- Resolve repeated friction before expanding scope. Verify the application remains useful when no AI is connected.
- Finalize the owner-approved code/content license, asset provenance notice, contributor guidance and dependency notices.
- Document setup, data location, AI billing distinctions, backup, troubleshooting and known limitations.
- Review current provider distribution terms separately from a successful local technical probe. Do not resurrect Claude/Gemini subscription access as a hidden release prerequisite.
- Prepare signed Windows artifacts if a signing identity is available. Clearly label unsigned development builds. Decide the update distribution method before enabling automatic updates.

Exit gate: every PRD acceptance item is checked with evidence; unresolved limitations are visible; the owner selects the public repository and approves publication. A hosted/SaaS product is a separate future plan.

## Test strategy

| Layer | Essential cases |
| --- | --- |
| Domain rules | Eligibility, dates/timezones, priority ordering, manual overrides, suggestion IDs and dependency cycles |
| SQLite and migrations | Atomic capture/job creation, revision races, idempotency, backup/restore, cascade/assertion deletion, version upgrades |
| Worker | Lease recovery, cancellation, bounded retry, auth/quota pause, stale completion and schema rejection |
| Provider adapters | Explicit auth route, no paid fallback, schema support, partial/empty/refused results, timeout and usage normalization |
| Desktop end to end | Capture while offline, shortcut/tray, correction, search, graph traversal, check-in, fresh-profile install and restart |
| Accessibility | Keyboard-only workflows, visible focus, labels, text scaling, contrast, graph list alternative, reduced motion |
| Performance | Warm capture, durable save, FTS query, scoped graph, queue backlog, quiet CPU and packaged startup |
| AI quality | Fixed human-reviewed cases; per-category error review; no fabricated hard deadlines or ungrounded IDs |

Use real SQLite transactions for persistence tests. Model fixture tests should not make network calls. Mark live-provider tests separately and keep them out of routine test runs. Never exhaust a paid allowance deliberately to test the UI; simulated quota errors are acceptable for handling tests but must be labeled as simulations.

The initial evaluation corpus should contain at least 50 varied synthetic captures and a smaller set of owner-approved real examples kept outside the public repository. Include multilingual text relevant to the user, contradictory priorities, negative statements, duplicate names, private URLs and embedded instructions that must be treated as data. Record provider/model, prompt/schema version and the adjudicated expected result.

## Risk register and responses

| Risk | Response and checkpoint |
| --- | --- |
| Codex instruction overhead or unintended inherited tools | Phase 0/2 configuration spike, tool-event rejection, isolated working directory and measured token use |
| Provider availability, quotas or changing terms | Explicit adapters, current source review before release, persistent paused states and no silent fallback |
| AI changes a user decision | Field-level overrides, provenance and revision checks in a single apply transaction |
| Graph complexity delays capture | Persist sources first, bounded vocabulary, scoped queries and rebuildable projection |
| Windows shell feels intrusive | Early keyboard/multi-monitor testing, hide option, no unsolicited focus capture |
| Reminders become noise | One daily check-in, quiet hours, idempotent delivery and separate sound/notification controls |
| Native module or packaging failure | Packaged SQLite smoke test in Phase 0 and a clean-profile build check thereafter |
| Animation polishing consumes the project | Use the included draft; preserve the fixed-position motion requirement for a focused later asset pass |
| Future SaaS scope expands version 1 | Keep it in later phases; do not add authentication servers, sync or tenancy now |

## First implementation batch

The first reviewable batch should establish the project, package a minimal Windows shell, create a SQLite migration, and implement one offline capture transaction with draft recovery and a restart test. The next batch adds editing and search; the next adds the Codex worker. This order tests the product's central promise before spending time on assistant conversations or graph presentation.

Record milestone outcomes and commands in the new repository. This handoff authorizes preparation of the plan and assets only; the owner starts implementation in the isolated project after moving the folder.
