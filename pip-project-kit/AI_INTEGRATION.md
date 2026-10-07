# Pip AI integration plan and evidence

Implementation update, 7 October 2026: the offline application runs without an SDK, runtime sign-in or API credentials. No new live provider checks or outreach were performed. The historical probe below is preserved unchanged and is not production isolation evidence. A missing Codex runtime/login cannot block capture; Phase 2 will expose that condition only when the user deliberately configures Codex. Inherited configuration/tool isolation remains a gate before background organization is enabled. The four explicit choices below remain required for version 1.

Pip has four explicit connection options. The original all-three-subscriptions prerequisite was superseded: Codex login is the first route, and OpenAI, Claude and Gemini API keys are in scope. Claude/Gemini subscription login is deferred and does not block the product.

## Connection matrix

| User-facing option | Intended integration | Billing/access boundary | Evidence in this kit |
| --- | --- | --- | --- |
| Codex login | Official local Codex runtime through `@openai/codex-sdk` | Applicable ChatGPT/Codex plan allowance and account conditions | Two successful synthetic classifications on 5 October 2026, including a fresh process |
| OpenAI API key | Official OpenAI API SDK | User's OpenAI API account and usage billing | Planned; no account-level test |
| Claude API key | Official Anthropic API SDK | User's Anthropic API account and usage billing | Planned; no account-level test |
| Gemini API key | Official Google Gen AI SDK | User's Gemini API project quota/billing | Planned; no account-level test |

Codex documents ChatGPT sign-in and API-key sign-in as distinct access methods. Pip must keep them distinct in its settings and requests. A ChatGPT subscription is not a general-purpose OpenAI API key or an unlimited allowance. [Official Codex authentication](https://learn.chatgpt.com/docs/auth).

## What was actually validated

The included [recorded result](evidence/codex-probe/codex-result.json) is from 5 October 2026 at 17:24:35 UTC. The official SDK and CLI were both version 0.160.0. The runtime reported ChatGPT login, and the request returned the three expected structured classifications without tool items. A preceding invocation also succeeded; the recorded second invocation established that a fresh process could reuse the official sign-in.

The recorded request used 14,861 input tokens and 121 output tokens. That is unexpectedly high overhead for three short synthetic captures and must be measured and reduced before frequent background use. The probe inherited local Codex configuration; it is a proof of integration, not a production-isolated runtime.

No API key was used in those checks. Additional billing conditions were not fully verified; the recorded result deliberately says `additionalBillingVerified: false`. The historical account usage indicator could not isolate this request's cost. No fresh account integration tests were run while preparing this kit.

The official [Codex SDK documentation](https://learn.chatgpt.com/docs/codex-sdk) describes a TypeScript library for local threads. The application should run it behind the privileged worker boundary, not inside the renderer. Follow the actual installed SDK's contracts and supported runtime settings rather than private backend endpoints.

## Codex connection implementation

1. Detect an installed supported official runtime and show its version. If absent, provide guided official installation; do not silently install unrelated tools.
2. Use its official sign-in flow. Store no copied OAuth/session tokens in Pip. Do not log the user out of another Codex client as part of a test.
3. Check the reported authentication method before the first request and after an auth failure. Codex-login mode must require ChatGPT login.
4. Remove API-key/access-token/base-URL overrides from the child environment for this route, using a case-insensitive check on Windows. Pass supported `forced_login_method=chatgpt` and provider restrictions where available.
5. Use a controlled empty working directory, no shell, web search, external apps or arbitrary tools, and a restrictive approval/sandbox configuration. Audit inherited MCP/configuration behavior; rejecting tool results after execution is not sufficient isolation on its own.
6. Require a completed turn and validate the entire output. A partial stream, failed turn or unexpected tool item is not an accepted classification.
7. Support cancellation and timeouts. Keep the local source/job safe if the child exits or the user closes Pip.

The included probe already demonstrates several of these controls but has not established complete production isolation. It must not be pointed at private project folders as a shortcut to providing context. Send explicit bounded content instead.

## Provider contract

Each adapter exposes the same application-level operations: connection status, supported model/capability information, classify structured content, answer from supplied context, cancel, and normalize usage/error information. Keep provider-specific authentication and request formats inside the adapter.

Use a common, deliberately small extraction schema: source ID/revision, candidate items, source evidence, proposed field values, candidate entities and typed relationship assertions. Let the application assign or validate stable IDs. JSON validity does not establish factual correctness, so evidence and domain validation remain mandatory.

Claude and Gemini document structured output with supported-schema limitations. Adapt the shared schema to each selected model's supported subset and keep the application validator authoritative. [Claude structured outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs), [Gemini structured outputs](https://ai.google.dev/gemini-api/docs/structured-output).

Normalize failures into canceled, timeout, offline/transient, invalid_output, auth_required, quota_blocked, unsupported_model and provider_error. Retain a redacted diagnostic code and human-readable action. Do not display a fabricated reset time when the provider does not report one.

## Model and usage policy

The user proposed Luna or another small model for background organization. Treat “Luna” as a candidate to validate through the chosen connection, not a guaranteed model identifier or universal plan entitlement. Pick the smallest accessible model that passes the evaluation corpus. Record the exact identifier and reasoning settings.

Provide separate background and interactive model settings. Start with one configured connection for both unless the user deliberately chooses a split. Coalesce a short burst of captures when it reduces overhead, but keep source revisions, per-item results and retry identity distinct. Never reclassify an unchanged item simply because the application restarted.

Use queue concurrency one initially, bounded context retrieval, bounded output, caching of accepted extraction results and visible pause controls. API modes should offer local request/token limits and estimates where reliable pricing is available. A client-side estimate cannot guarantee the provider's final invoice. No hidden model upgrades, API-key fallback or cross-provider retry is permitted.

## Prompt boundaries

System instructions define extraction behavior. Captures and retrieved documents are delimited data, including any embedded “ignore instructions” text. The model may propose structure but may not browse links, inspect local files, send messages, modify external services or carry out a captured task.

Pass the current date, timezone, permitted areas, relevant project candidates and exact source revision. Require null/unknown for unsupported dates and estimates. Do not send the whole personal database or unrelated life areas for every request. Keep schema/prompt versioning in the extraction record.

For next-action responses, provide a bounded set of eligible IDs and evidence. Validate references, distinguish suggestions from stored facts, and make a deterministic local agenda available when the model is blocked.

## Remaining integration acceptance matrix

| Case | Required behavior | Current evidence |
| --- | --- | --- |
| Official sign-in and structured classification | Explicit expected auth route, completed validated result | Passed for Codex login only |
| Process restart | Reuse official stored login and keep jobs consistent | Probe restart passed; application queue not built |
| Background operation | Works without an API key in Codex-login mode | Local noninteractive probe passed; app worker not built |
| Expired/denied login | Pause, retain source, offer reconnect | Not live tested |
| User cancels login or inference | No partial extraction; next request can start | Not live tested |
| Exhausted quota | Pause without a paid fallback; preserve queue | Not live tested; simulate handling without exhausting allowance |
| Loss of subscription eligibility | Clear provider failure; no account changes by Pip | Not tested; do not cancel a real subscription to test |
| API-key connections | Correct provider, model, error mapping and protected storage | None live tested |
| Tool/configuration isolation | No hidden tools, unexpected file access or instruction bleed | Partial restrictions in probe; production gate still open |
| Public distribution/SaaS conditions | Review applicable current terms for the exact release | A technical success is not blanket distribution approval |

## Historical decisions and outreach

Coucou was inspected at commit `30edad4c5c0b6c3d16a2092a35cddeb9018a0016`. Its normal chat used an Anthropic API key; the macOS subscription gauge displayed Claude Code usage, and a separate optional path launched the local CLI. This did not establish subscription-backed normal chat approval for Pip. The reference repository is intentionally not included in this kit. [Coucou source](https://github.com/Louis-CFM/coucou/tree/30edad4c5c0b6c3d16a2092a35cddeb9018a0016).

A Gemini CLI Q&A was posted before the user stopped outreach. No Anthropic inquiry was sent. No follow-up, monitoring or new provider contact is authorized by this handoff. [Historical Gemini discussion](https://github.com/google-gemini/gemini-cli/discussions/29642).

For a later Claude/Gemini subscription proposal, verify the current developer requirements separately. Do not let the deferred subscription question replace the accepted API-key integrations or restart external inquiries without a new user instruction.
