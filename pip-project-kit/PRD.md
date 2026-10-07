# Pip product requirements

Implementation status, 7 October 2026: the product baseline below is unchanged. The first offline capture batch is implemented; the current acceptance-ID checklist is in DEVELOPMENT_PLAN.md. This is neither all of Phase 1 nor version 1 completion.

Pip turns unstructured captures into a useful personal memory and a manageable set of next actions. Its first release is a local Windows companion for the founder's own daily use. Capturing a thought must remain quick even when the network, a model or the organization process is unavailable.

Status: product baseline and proposed version 1 requirements, 6 October 2026. The agreed direction is identified in the project README. Detailed interaction defaults below are recommendations to validate during the personal trial.

## Problem and intended user

The first user juggles personal responsibilities, day-job work and side projects. Notes, ideas, videos, music and commitments arrive faster than they can be filed. Traditional task applications often require deciding where an item belongs before capturing it, while a large undifferentiated inbox makes deciding what to do next difficult.

Pip should accept the messy input first, preserve it, organize it later, and explain its suggestions. It is a productivity aid, not a medical treatment or a system for evaluating the user's behavior. The product should be useful without requiring a diagnosis, a rigid routine, or daily engagement.

## Product goals

1. Capture a thought or link without first choosing a category or project.
2. Keep the original text retrievable and let the user correct every inferred fact.
3. Build meaningful, traceable relationships across the user's life areas and projects.
4. Reduce next-action decision effort with a small, explained set of suggestions.
5. Be pleasant to return to after a gap, with no guilt, lost streaks or backlog punishment.
6. Keep local data usable independently of a provider connection or future hosted service.

## Core journeys

### Capture something before it disappears

The user invokes a configurable global shortcut, types or pastes text or a URL, and submits. Pip confirms only after the local transaction commits. The panel returns to its unobtrusive state. Classification happens later and never blocks the input. A draft survives an accidental dismissal or restart.

Example capture: “Personal: book a dentist appointment next Thursday. Also keep this video for later.” The original remains one capture. The organizer may create a task and a resource with separate evidence spans. An ambiguous date remains unresolved or explicitly tentative until corrected; it does not silently become a hard commitment.

### Find something without remembering how it was filed

The user searches a phrase or filters by area, project, type or status. Search includes unprocessed captures. A saved link is useful immediately even if its title cannot be fetched. A result shows its original capture, current interpretation and related items.

### Correct Pip quickly

The user changes “Day job” to “Side hustle,” changes an item from a task to an idea, or removes an incorrect relationship. The edit takes effect immediately and survives reprocessing. Undo restores the previous value. Pip can offer a classification hint for future captures, but does not silently generalize one correction into a global rule.

### Decide what to do next

The user asks “What should I do?” or selects an available time and energy level. Pip proposes one primary action and up to two alternatives, with a short reason and a link to the source commitment. Explicit deadlines and priorities outrank convenience. Blocked, waiting, completed and snoozed tasks are treated appropriately. If nothing is actionable, Pip says so rather than inventing work.

### Explore a project through its relationships

The user opens a project and sees connected tasks, notes and resources. Selecting a node opens the item and its evidence; selecting an edge explains why the connection exists. Filters and one-hop expansion keep the graph understandable. A list view offers the same information for keyboard and screen-reader users.

### Receive one useful daily check-in

At the selected local time, Pip offers a compact check-in with relevant commitments and a proposed next step. It can be dismissed, snoozed or disabled. It does not repeatedly alert until acknowledged. On return after sleep or a long absence, it presents a gentle summary once instead of replaying missed alerts.

### Choose something to watch or listen to

The user asks for a saved video, music item or other resource that fits their available time or topic. Pip searches the user's library, explains the match, and opens the selected link only on request. Playback control, streaming-service integrations and unsolicited internet recommendations are outside version 1.

## Version 1 requirements

| ID | Requirement | Acceptance |
| --- | --- | --- |
| PIP-01 | Text and URL capture | Captures commit locally before confirmation; multiple captures work while offline or signed out. |
| PIP-02 | Windows companion | Configurable shortcut, tray access, expandable panel, keyboard dismissal, and recovery when a monitor is removed. |
| PIP-03 | Reliable originals | Original captures and their revisions remain readable after extraction failure, application restart or provider change. |
| PIP-04 | Background organization | A persistent queue extracts candidate items, area, project and typed relationships without holding up capture. |
| PIP-05 | Editable areas and projects | Personal, Day job and Side hustle are initial areas. The user can create, rename, archive and reassign; uncertainty uses Unassigned. |
| PIP-06 | Separate content types | Tasks, notes, ideas and resources have distinct intent. Saving an idea or video does not automatically make it a commitment. |
| PIP-07 | Corrections and provenance | Every inferred field or relationship has a source. User corrections override future inference and can be undone. |
| PIP-08 | Task handling | Task title, status, priority, area, project, optional due date, time estimate, energy and waiting/snooze state are editable. |
| PIP-09 | Search and retrieval | Text search, area/project/type/status filters and source links work for both processed and unprocessed captures. |
| PIP-10 | Knowledge graph | Typed nodes and edges persist, show provenance, support manual corrections and can be rebuilt from accepted records. |
| PIP-11 | Interactive graph | Scoped subgraphs, selection, search, filtering and progressive expansion work alongside an accessible list equivalent. |
| PIP-12 | Next-action guidance | Recommendations respect commitments, explicit priority, dependencies and availability, and explain the source of the suggestion. |
| PIP-13 | Daily check-in | One configurable check-in per local day, opt-in notifications, quiet hours, and no duplicate delivery after restart or sleep. |
| PIP-14 | Four AI connections | Codex login, OpenAI API key, Claude API key and Gemini API key are explicit choices with separate status and billing labels. |
| PIP-15 | Provider failure recovery | Auth, quota and network failures keep data safe, show an actionable status and never trigger a hidden paid fallback. |
| PIP-16 | Data ownership | Versioned local export/import, tested backup/restore and deletion include source records and derived relationships. Credentials are excluded. |
| PIP-17 | Pip and sound | Existing bird identity, semantic animation states, optional chirps, mute, volume, quiet mode and reduced-motion support. |
| PIP-18 | Transparent local operation | Local storage and remote inference are clearly distinguished. The user can pause AI processing and inspect pending work. |

## Interaction and organization rules

- Capture input accepts plain text and pasted HTTP/HTTPS URLs. No microphone, clipboard surveillance or screen monitoring in version 1.
- Each capture may yield several items. Long or mixed captures must retain the correspondence between each item and its supporting text.
- A task represents an intended action. Possibilities, quotations, negative statements and already-completed work require different treatment.
- An inferred deadline must identify the supporting phrase and reference timezone. Keep date-only deadlines separate from exact timestamps. Ask or retain uncertainty for phrases such as “sometime next week.”
- An inferred project or person is a candidate until confidently linked. Similar names do not authorize irreversible merges.
- Areas categorize responsibility; projects group outcomes; tags describe topics. These are separate relationships.
- Manual completion or deletion cannot be reversed by a delayed model response.
- Relationship confidence is an aid to review, not a calibrated probability or an excuse to conceal uncertainty.
- The graph helps navigate the information; it is not the primary capture form and must not become an unreadable full-library network.

## Next-action policy

Candidate tasks first pass eligibility checks: not completed or deleted, not snoozed, dependency prerequisites met, and not waiting on someone else unless the actionable step is a follow-up. A user can deliberately view excluded tasks with reasons.

Rank overdue and near-term explicit commitments alongside user-set priority. Then use project importance, available time and stated energy to select feasible options. Do not infer the user's energy from behavior or health data. Explain conflicts: a high-priority task that will not fit in ten minutes may warrant a suggested starting step, not disappearance from the list.

Suggested starting steps are proposals. They become tasks only when accepted. “Why this?” shows the dates, priority and other records used. The assistant cannot complete tasks, send messages, schedule external meetings or execute code by itself.

## Essential quality of life

The proposed version 1 includes draft recovery, quick correction chips, undo, waiting/snooze/someday states, a “help me start” suggestion, a visible pending/paused state and a gentle return-after-a-gap message. These additions support the core workflows and should be cut before data integrity, graph usefulness or provider choice if a release must be narrowed.

Keep normal feature labels such as Tasks, Projects and Search. Bird language can add warmth to onboarding and the mascot, but must not make common actions difficult to discover. Chirps accompany useful events and stay silent for background processing, failures that already have a persistent notice, focus mode and quiet hours.

## First-run experience

1. Explain local storage and what selected content goes to the AI provider.
2. Offer the four connection choices and a local-only “set up later” path.
3. For Codex, guide installation/sign-in with the official local tool and show its actual status. Never ask for copied session tokens.
4. Confirm initial life areas and the shortcut. Provide conflict handling if Windows cannot register the shortcut.
5. Let the user make their first capture immediately. Offer check-in scheduling and sound as optional settings.

## Data, privacy and failure behavior

SQLite is the first durable destination for all captures. The organization service sees only the selected captures and necessary context, not arbitrary files. API credentials stay in an OS-protected store and never appear in normal exports, logs, renderer state or graph records.

Local-first storage does not mean inference is offline. The UI must identify the chosen provider and state that relevant content is sent to it. The user can pause processing globally and exclude a life area from automatic processing. Network link enrichment is optional; raw links remain useful without it.

Disk-full errors retain the input and clearly say it was not saved. A killed worker leaves a retryable job. Invalid model output has no partial application. Quota exhaustion pauses processing with a retry or reconnect action. Deleting data removes it from local derived indexes; Pip must not claim this also removes copies already sent to a provider or stored in independent backups.

## Measurable release targets

These are engineering targets to measure on the chosen Windows reference machine, not current benchmark results.

| Measure | Version 1 target |
| --- | --- |
| Shortcut to ready input | Warm p95 at most 250 ms |
| Submit to durable local confirmation | p95 at most 200 ms for normal text captures up to 20 KB |
| Search | p95 at most 300 ms on 10,000 representative captures |
| Graph interaction | First scoped view at most 1 second; limit the initial view to 100 nodes |
| Capture durability | Zero acknowledged captures lost in the crash/restart acceptance suite |
| Corrections | Zero user overrides or deletions reversed by reprocessing or late completions |
| Extraction quality | At least 90% type/area accuracy on the agreed evaluation set; zero fabricated hard deadlines in that set |
| Idle behavior | No perpetual animation or inference; target below 1% CPU averaged over ten quiet minutes on the reference machine |
| Personal usefulness | During a two-week trial, at least four of five sampled “what next?” suggestions are judged reasonable by the founder |

Memory and installer size budgets are set after the shell baseline is measured. Model latency is reported separately from capture latency. Extraction quality is reviewed by content category so a good aggregate score cannot hide failures on ambiguous dates or mixed captures.

## Accessibility and Windows behavior

All capture, task, project, search, correction and setting actions are keyboard accessible with visible focus and meaningful accessible names. Respect reduced motion, text scaling, high-contrast requirements and Windows notification settings. Graph selection has a list alternative. Test 100%, 150% and 200% display scaling, multiple monitors, taskbar positions, sleep/resume and keyboard shortcut conflicts.

The companion should not steal focus during ordinary work. The proposed behavior is a small always-available top-edge surface that expands on explicit interaction. Quiet or focus mode suppresses animation and sound. The user can hide the companion while keeping the tray and shortcut available.

## Outside version 1

Mobile apps, sync, accounts managed by Pip, collaboration, a separate server, hosted SaaS, provider subscription proxying, Claude/Gemini subscription login, voice capture, calendar/email ingestion, browser extensions, streaming playback controls, arbitrary file ingestion, autonomous external actions, plugin marketplaces and an autonomous multi-agent framework are later work.

The first release has no authentication server or recurring subscription payment system of its own. A future hosted edition requires a separate privacy, tenancy, billing and provider-access design.

## Release definition

Version 1 is ready only when all PIP requirements above pass their stated acceptance checks, all four AI connection paths have their own integration evidence, backup/restore and restart recovery pass, and the founder's trial identifies no unresolved data-loss or repeated interruption problems. A Codex-only personal alpha can ship earlier under that explicit label.
