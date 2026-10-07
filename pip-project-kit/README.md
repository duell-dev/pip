# Pip project kit

> **Implementation update — 7 October 2026:** the owner has authorized local implementation. The parent project directory now contains the working offline Electron application, pinned dependencies and Windows packaging. See its `README.md` and `IMPLEMENTATION.md` for commands and application evidence. The planning material below is preserved as the original handoff; its statements about implementation not yet existing are historical. Artwork, preview tools and Codex evidence remain unchanged.

Pip is a Windows personal productivity companion for capturing messy thoughts, organizing them into a knowledge graph, and choosing a useful next action. Its mascot is the apricot bird in this folder. The product should reduce the effort of managing a busy life, particularly for its first user, who has ADHD.

Prepared 6 October 2026. This folder is the complete planning and asset handoff. It contains no application implementation. The only executable code is the existing animation prototype, its maintenance checks, and the disposable Codex integration probe.

## Start here

1. Move or copy this entire folder to the new project directory. Keep its internal structure intact.
2. Read [PRD.md](PRD.md) for the product requirements and [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md) for the implementation sequence and acceptance gates.
3. Read [ARCHITECTURE.md](ARCHITECTURE.md) for storage, the graph, background processing, and process boundaries.
4. Read [AI_INTEGRATION.md](AI_INTEGRATION.md) before connecting a provider. It distinguishes the working Codex login proof from integrations still to build.
5. Open [preview/pip.html](preview/pip.html) in Edge or Chrome. It includes its artwork and synthesized chirps and can run offline without this conversation or a server. Sound starts off.
6. Give [HANDOFF.md](HANDOFF.md) to the developer or coding agent starting the isolated project.

## Contents

| Path | Purpose |
| --- | --- |
| [PRD.md](PRD.md) | Users, workflows, scope, functional requirements, product acceptance |
| [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md) | Phases, tasks, dependencies, validation, effort estimates and release gates |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Recommended stack, data model, graph projection and application contracts |
| [AI_INTEGRATION.md](AI_INTEGRATION.md) | Four provider options, model policy, authentication, billing boundaries and evidence |
| [ASSETS.md](ASSETS.md) | Asset inventory, appearance, motion and audio rules, provenance and remaining polish |
| [HANDOFF.md](HANDOFF.md) | Concise project bootstrap brief and unresolved decisions |
| [VALIDATION.md](VALIDATION.md) | Kit checks and distinction between prototype evidence and product tests |
| [assets/animation/](assets/animation/) | Five 12-frame animation atlases, small WebP copies, alignment data and prompts |
| [assets/reference/](assets/reference/) | Original naming concepts and the selected Pip pose sheet |
| [preview/pip.html](preview/pip.html) | Standalone portable animation and chirp preview |
| [preview/template.html](preview/template.html) | Editable animation code before artwork is embedded |
| [tools/](tools/) | Optional portable scripts to rebuild and check the prototype |
| [evidence/codex-probe/](evidence/codex-probe/) | Reproducible synthetic subscription-login probe and its recorded result |
| [MANIFEST.json](MANIFEST.json) | SHA-256 hashes and sizes of the packaged files |

## Agreed product direction

- Windows first, with a notch-style companion and an expandable workspace.
- Save text and links immediately in SQLite; organize them asynchronously with a small LLM.
- Editable life areas start with Personal, Day job and Side hustle.
- A real knowledge graph represents relationships between captures, tasks, projects and resources. An interactive graph view is part of the first version.
- Suggest a next action from commitments and stated priorities, then available time and energy.
- Support Codex login using the user's applicable ChatGPT/Codex allowance, plus separate OpenAI, Claude and Gemini API-key options. Never silently change the billing route.
- One configurable daily check-in, with optional bird chirps and a calm animated Pip.
- Open-source distribution is the intent. Mobile, a separate self-hosted server and a hosted SaaS are later phases.

Electron, React, TypeScript, the SQLite driver, and the physical graph storage choice are recommendations in this kit, not previously approved implementation decisions. Phase 0 resolves them. No application repository, release, cloud service, or provider inquiry is created by this handoff.

## Optional prototype maintenance

Node.js 24 and a package manager are recommended for these developer-only scripts. The visual preview itself needs neither. Install the tools from this folder after moving it:

```powershell
cd tools
pnpm install
pnpm run check:kit
pnpm run check:preview
```

The browser check uses an installed Edge by default; set `PIP_BROWSER_CHANNEL=chrome` to use Chrome. `pnpm run build:assets` rebuilds WebP atlases, alignment metadata, and the standalone preview from the included source art. It does not generate new art or call an AI provider. Run `pnpm run manifest` after intentional edits to refresh the file inventory.

The optional [Codex probe](evidence/codex-probe/README.md) has its own dependency lockfile. Its live command sends only three synthetic captures and consumes the selected account's allowance. It is never run by the kit checks.

## Portability and release status

There are no credentials, login tokens, personal captures, external repository clones, installed dependencies, or required paths back to the original workspace in this kit. The folder can be renamed. External documentation links are reference material; runtime assets are local or embedded.

The open-source license, public repository name, signing identity and release ownership remain undecided. This kit intentionally does not assign a license or assert trademark clearance for the name Pip.
