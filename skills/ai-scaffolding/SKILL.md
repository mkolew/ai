---
name: ai-scaffolding
description: Scaffold AI coding agent configuration (Claude Code, GitHub Copilot, Cursor, OpenAI Codex, Gemini CLI, AGENTS.md) into a project. Use when the user types /ai-scaffolding or asks to set up or scaffold AI agent configs, CLAUDE.md, copilot-instructions, cursor rules, or agent skills for their repo. Interviews the user about project type, folder layout, tech stack, and target agents, then generates tailored config files in the exact locations each tool reads.
license: MIT
---

# AI Agent Scaffolding

You are scaffolding AI coding agent configuration into the user's project.
The reference implementation is the public repo
`https://github.com/mkolew/ai-scaffolding` — its `COPY_TO_ROOT/` directory
holds a working example for every supported agent. Your job is NOT to copy
it verbatim: it describes a fictional project. You interview the user,
inspect their repo, and generate the same structure with content tailored
to their real stack.

Work deterministically. Never invent config files a tool does not support —
a gap stated honestly ("Gemini CLI has no hook system") beats a fake
equivalent. Never overwrite an existing config file without asking.

## Step 1 — Detect before asking

Inspect the project root first and pre-fill every answer you can:

- Lockfiles → package manager (`pnpm-lock.yaml`, `package-lock.json`,
  `yarn.lock`, `bun.lockb`) or ecosystem (`go.mod`, `pom.xml`,
  `build.gradle`, `pyproject.toml`, `*.csproj`, `Cargo.toml`)
- Framework configs → tech (`next.config.*`, `angular.json`, `nuxt.config.*`,
  `vite.config.*`, `svelte.config.*`, Spring `application.yml`,
  `manage.py`, `main.go`)
- Monorepo markers → layout (`pnpm-workspace.yaml`, `turbo.json`, `nx.json`,
  `apps/`, `packages/`)
- Existing agent configs → `CLAUDE.md`, `AGENTS.md`, `.claude/`, `.github/
  copilot-instructions.md`, `.cursor/`, `.codex/`, `.gemini/`, `GEMINI.md`
- Commands → `package.json` scripts, `Makefile`, CI workflow steps
- Formatter/linter → prettier/eslint/biome config or dependency

Present what you detected as pre-filled answers to confirm, and only ask
what you could not infer. If a detected command references tooling that is
not actually installed (e.g. scripts call `turbo` but no `turbo.json` or
dependency exists), flag it to the user instead of documenting a broken
command.

## Step 2 — Interview

Ask (structured multiple-choice where the platform supports it, plain
numbered questions otherwise; batch related questions):

1. **Project type** — frontend / backend / both
2. **Folders** — where each part lives (e.g. `apps/web`, `apps/api`;
   repo root for a single-part project)
3. **Frontend tech** — React/Next.js, Angular, Vue/Nuxt, Svelte/SvelteKit,
   other (skip if backend-only)
4. **Backend tech** — Node/TypeScript, Java/Spring, Python
   (Django/FastAPI), Go, .NET, other (skip if frontend-only)
5. **Target agents** — multi-select: Claude Code, GitHub Copilot, Cursor,
   OpenAI Codex, Gemini CLI. Always recommend adding **AGENTS.md** as the
   cross-tool baseline regardless of selection — 28+ tools read it.
   Selecting AGENTS.md as a target means: root `AGENTS.md` plus nested
   per-folder `AGENTS.md` files for both-type projects — nothing else (the
   standard has no skills/hooks/MCP surface).
6. **Extras** — confirm: include starter skills? include hooks? include MCP
   server config (which servers matter to them: GitHub, database,
   Playwright, ...)?

If any existing agent config was detected in Step 1, ask per file:
keep / merge / replace. Default to keep.

## Step 3 — Fetch the reference

```bash
git clone --depth 1 https://github.com/mkolew/ai-scaffolding /tmp/ai-scaffolding-ref
```

Read `COPY_TO_ROOT/README.md` (per-agent comparison table and layout) and
skim the config files for the agents the user selected — they are the
authoritative examples of format, frontmatter, hook wiring, and tone.

If a local checkout of the reference repo is available (or the user points
you at one), use it instead of cloning. If the clone fails (offline, git
missing), fall back to the structure table at the bottom of this skill and
your own knowledge of each format. Say that you used the fallback.

## Step 4 — Generate

For each selected agent, create its files at the exact locations from the
table below. Content rules:

**Always-on file** (CLAUDE.md / copilot-instructions.md / always-apply
.mdc / AGENTS.md / GEMINI.md) — keep it short; every line costs context:

- one-paragraph project overview (real name, real purpose)
- real commands (from Step 1 detection, confirmed in Step 2)
- architecture tree of the actual folders
- 5-10 stack-specific conventions from your knowledge of the chosen tech —
  concrete and opinionated (React: server components by default, no
  `useEffect` for data fetching; Spring: constructor injection, no field
  `@Autowired`; Django: fat models thin views; Go: errors wrapped with
  `%w`, no panics in handlers). Match the quality bar of the reference
  repo's Orderly examples — a realistic rule teaches more than "add your
  rules here".
- a "What NOT to do" section (protected paths, forbidden shortcuts)

**Both-type projects** — shared rules go in the root file; frontend/backend
specifics go in path-scoped rules pointing at the user's folders:
subdirectory `CLAUDE.md` (Claude), `.github/instructions/*.instructions.md`
with `applyTo` glob (Copilot), `.cursor/rules/*.mdc` with `globs` (Cursor),
nested `AGENTS.md` per folder (Codex and others), subdirectory `GEMINI.md`
(Gemini).

**Starter skills** (if wanted) — stack-relevant examples: backend:
`api-endpoint`, `db-migration`; frontend: `ui-component`, `add-route`.
These are candidates, not a quota — only generate a skill whose subject
actually exists in the project (no `db-migration` when Step 1 found no
database/ORM). Claude format `.claude/skills/<name>/SKILL.md`; Copilot
reads the same format from `.github/skills/` (and also reads
`.claude/skills/`); Cursor's equivalent is an agent-requested rule
(description set, no globs, `alwaysApply: false`). For Cursor, avoid
duplicating content between glob rules and skill-rules: glob rules carry
the folder's conventions, skill-rules carry step-by-step procedures.

**Hooks** (if wanted) — only where supported: protect-files and
format-on-save patterns from the reference repo. Protected paths = what
actually exists in this project (lockfile, `.env`, migrations dir if any).
Formatter: the one detected in Step 1; if none was detected, ask, or use
`npx --yes prettier` with a comment saying it's a default. Payload field
names differ per tool — copy the per-tool protocol from the reference
scripts, do not unify blindly. For Claude, wire hooks in
`.claude/settings.json` and include a sensible `permissions` allow/deny
block alongside (the reference `settings.json` shows the pairing).

**MCP servers** (if wanted) — only servers the user asked for. Secrets are
ALWAYS placeholders: `${VAR}` (Claude/Cursor/Codex), `${input:id}`
(VS Code), `$VAR` (Gemini). Never a real token, even as an example.

Skip: the reference repo's README files, agents the user did not select,
fictional Orderly content.

## Step 5 — Validate

- every generated `.json` parses (`jq empty`)
- every generated `.sh` passes `bash -n` and is `chmod +x`
- every generated `.toml` parses (python `tomllib` if available)
- every `.mdc` / `SKILL.md` / `.instructions.md` / `.agent.md` has valid
  YAML frontmatter with the fields its tool requires (Cursor silently
  ignores malformed `.mdc` — re-read each one after writing)
- every generated path matches the locations table — no invented locations
- grep generated files for token-shaped strings (`ghp_`, `github_pat_`,
  `sk-`, `AKIA`, `xox[bpars]-`, `eyJ` JWTs, `Bearer <base64ish>`, 32+ char
  hex/base64 literals); placeholders only

## Step 6 — Report

List generated files grouped per agent, then next steps: review and commit,
set the env vars the MCP configs reference, and one thing to try per agent
(e.g. "open the repo in Cursor and check the rule attaches on files under
`apps/api/`"). If Step 3 cloned into a temp dir, clean it up.

## Locations table (fallback reference)

| Building block    | Claude Code                     | GitHub Copilot                        | Cursor                          | OpenAI Codex                  | Gemini CLI                  |
| ----------------- | ------------------------------- | ------------------------------------- | ------------------------------- | ----------------------------- | --------------------------- |
| Always-on rules   | `CLAUDE.md`                     | `.github/copilot-instructions.md`     | `.cursor/rules/*.mdc` (alwaysApply) | `AGENTS.md`               | `GEMINI.md`                 |
| Path-scoped rules | subdirectory `CLAUDE.md`        | `.github/instructions/*.instructions.md` (applyTo) | `.cursor/rules/*.mdc` (globs) | nested `AGENTS.md`      | subdirectory `GEMINI.md`    |
| On-demand skills  | `.claude/skills/*/SKILL.md`     | `.github/skills/*/SKILL.md`           | `.cursor/rules/` (description-only mdc) | —                     | —                           |
| Reusable prompts  | `.claude/commands/*.md`         | `.github/prompts/*.prompt.md`         | `.cursor/commands/*.md`         | `~/.codex/prompts` (personal) | `.gemini/commands/*.toml`   |
| Event hooks       | `.claude/settings.json` + scripts | `.github/hooks/*.json`              | `.cursor/hooks.json` + scripts  | `.codex/config.toml [[hooks.*]]` | —                        |
| Subagents         | `.claude/agents/*.md`           | `.github/agents/*.agent.md`           | —                               | `[agents.*]` in config.toml   | —                           |
| MCP servers       | `.mcp.json`                     | `.vscode/mcp.json`                    | `.cursor/mcp.json`              | `.codex/config.toml [mcp_servers]` | `.gemini/settings.json` |

A dash = the tool has no project-file equivalent. Say so; do not fake one.

## Engineering principles

- Detection before questions; confirm, don't interrogate.
- Every generated rule must be true for THIS project — no leftover
  fictional content, no generic filler.
- Placeholders for every secret, everywhere, always.
- State honestly which blocks a tool lacks.
- Ask before touching any existing config.
