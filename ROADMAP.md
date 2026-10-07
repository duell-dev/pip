# Pip roadmap

The current milestone is a working offline Windows capture app with a movable top-edge companion, SQLite inbox and draft recovery. It is not version 1. Pip should remain calm and useful after a gap, without guilt, streak penalties or constant interruptions.

This public checklist preserves the original acceptance IDs and development gates. The local planning/prototype kit is not a build dependency. Requirements below are product commitments; the recorded implementation choices in [IMPLEMENTATION.md](IMPLEMENTATION.md) may change when compatibility or measurements justify it.

## Version 1 checklist

| ID | Acceptance and remaining work | Status |
| --- | --- | --- |
| PIP-01 | Text/URL capture commits before confirmation, offline and signed out. | Implemented |
| PIP-02 | Movable expandable Windows companion, configurable shortcut, tray and keyboard dismissal; monitor removal and Windows accessibility/scaling matrix. | Partial |
| PIP-03 | Exact originals and source revisions survive restart, extraction failure and provider changes; source history/editing UI. | Partial |
| PIP-04 | Durable background organization queue with recovery, pause, cancellation, bounded retries and visible job states. | Planned |
| PIP-05 | Editable Personal, Day job and Side hustle areas plus projects; create, rename, archive, reassign and Unassigned for uncertainty. | Planned |
| PIP-06 | Separate tasks, notes, ideas and saved resources; multi-item captures retain source evidence. Ideas and saved videos do not automatically become commitments. | Planned |
| PIP-07 | Evidence for inferred fields/links, easy corrections, undo, preserved user overrides and conservative merge review. | Planned |
| PIP-08 | Editable task title, status, priority, area, project, optional due date, time estimate, energy, waiting and snooze state. Preserve date precision and explicit clearing. | Planned |
| PIP-09 | Local FTS search including unprocessed captures, area/project/type/status filters and original-source links. | Planned; FTS5 benchmark passed |
| PIP-10 | Persistent typed graph with provenance, manual links/corrections, consistent source revision/deletion handling and rebuild from accepted records without AI calls. | Planned; SQLite benchmark passed |
| PIP-11 | Interactive Cytoscape graph with bounded scoped views, selection, search, filtering, progressive expansion and an accessible list equivalent. | Planned |
| PIP-12 | Commitment/priority-first next actions, dependency eligibility, user-stated time/energy, grounded explanations, local fallback agenda and accepted-only suggested starting steps. Recommend relevant saved resources by topic/type/known duration; unknown duration stays unknown. | Planned |
| PIP-13 | One configurable daily check-in, opt-in notifications, quiet hours, snooze/disable and no repeated delivery across restart, sleep or DST. | Planned |
| PIP-14 | Four explicit options: official local Codex runtime with ChatGPT sign-in, OpenAI API key, Claude API key and Gemini API key. Separate authentication, status and billing labels; independent background/interactive model choices. | Planned |
| PIP-15 | Recoverable auth/quota/network/cancellation failures, no partial application and no hidden provider/authentication/billing fallback. | Partial: capture has no AI dependency |
| PIP-16 | Versioned export/import, tested backup/restore, migration recovery and deletion of originals/derived data; credentials excluded. | Planned |
| PIP-17 | Existing Pip identity, semantic animation, optional chirps/volume/mute, quiet mode and reduced motion. No whole-character activity jitter. | Partial: capture animation and still/quiet modes |
| PIP-18 | Clear local-storage/remote-inference boundaries, immediate local-only setup, pending-work inspection, global AI pause and life-area exclusions. Optional link enrichment; opening links requires explicit action. | Partial: local-only capture |

Never invent deadlines, commitments or source IDs. A user edit, completion or deletion must survive reprocessing and late responses. Inference cannot execute tasks, send messages or operate external services on the user's behalf. Preserve source provenance and distinguish facts from suggestions.

## Development gates

| Phase | Gate |
| --- | --- |
| 0 — foundation | Passed for the offline milestone: pinned Windows build, packaged SQLite proof, data/migration and credential-store decisions, graph benchmark and resource baseline. Production Codex isolation is still a Phase 2 gate. |
| 1 — offline records | Next: source detail/revisions, editable areas/projects, manual types/task fields, undo and FTS search. All editing/search works without AI; 100 acknowledged captures survive defined crash/restart points. Complete shortcut/monitor/accessibility checks. |
| 2 — Codex organization | Capture → durable job → official Codex classification → correction → restart. Verify inherited configuration/tool isolation before execution, no API fallback, validated outputs and source IDs, stale/delete protection, worker recovery without duplicates, cancellation and auth/quota handling. Record a real synthetic classification; fixtures alone do not validate the adapter. |
| 3 — four providers | OpenAI, Claude and Gemini API adapters pass the same contract suite plus separately identified live checks. Protected key entry/removal, capability/model checks and exact billing routes; no secrets in renderer, logs, exports or command lines. Missing credentials leave an adapter explicitly unverified. |
| 4 — graph | Rebuild without model calls, retain user corrections and multiply-supported links, reconcile source edits/deletions, meet bounded query/view targets and find related resources through graph and accessible list views. |
| 5 — guidance/check-in | Ranking fixtures preserve hard commitments and task eligibility. Ground answers in bounded retrieved context. One check-in per local day across DST/restarts/sleep; retries do not replay sounds. |
| 6 — recovery/release candidate | Install, upgrade, export, restore and uninstall checks; preserved data unless deletion is chosen. Test fresh profiles, spaces/non-ASCII paths, multiple monitors, 100/150/200% scaling, disk/lock/worker/provider failures and diagnostics excluding content/secrets by default. No unresolved data-loss or stale-write issue. |
| 7 — trial/release | Two-week personal trial, measured correction/recommendation usefulness, complete acceptance evidence, contributor/setup/billing/backup docs, owner-approved code/artwork licensing and distribution review. Signed builds/update distribution require their own decision; no remote analytics by default. |

A Codex-only alpha is an intermediate milestone. Version 1 requires all four connections, the persistent and interactive graph, daily check-in and tested data portability.

Release targets on the reference Windows machine: warm input p95 ≤250 ms, durable capture p95 ≤200 ms for 20 KB text, search p95 ≤300 ms over 10,000 captures, first scoped graph ≤1 second with at most 100 initial nodes, and idle CPU <1% averaged over ten minutes. Zero acknowledged captures, overrides or deletions may be lost in the acceptance suite. The human-reviewed extraction set targets ≥90% type/area accuracy with zero invented hard deadlines; at least four of five sampled next-action suggestions should be reasonable during the trial. These remain release targets, not claims that the unimplemented features have passed.

Mobile, synchronization, Pip accounts, a separate self-hosted server, hosted SaaS, Claude/Gemini subscription login, voice/screen/clipboard monitoring, external inbox/calendar integrations, streaming playback, arbitrary file ingestion, autonomous external actions and plugin/agent frameworks are later phases. Do not build their infrastructure into the current milestone.
