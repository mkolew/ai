# Skill: ai-scaffolding

Sets up AI coding agent configuration in any project — interactively. The
skill interviews you (project type, folder layout, tech stack, which agents
you use), inspects your repo to pre-fill what it can, then generates
tailored config files in the exact locations each tool reads:

| Agent          | What you get                                                        |
| -------------- | ------------------------------------------------------------------- |
| Claude Code    | `CLAUDE.md`, `.claude/` (settings, skills, commands, agents, hooks), `.mcp.json` |
| GitHub Copilot | `.github/copilot-instructions.md`, instructions, prompts, agents, hooks, `.vscode/mcp.json` |
| Cursor         | `.cursor/rules/*.mdc` (all three activation modes), commands, hooks, `mcp.json` |
| OpenAI Codex   | `AGENTS.md`, `.codex/config.toml` (MCP, agents, hooks)              |
| Gemini CLI     | `GEMINI.md`, `.gemini/settings.json`, TOML commands                 |
| AGENTS.md      | the cross-tool baseline, read by 28+ tools — always recommended     |

Generated content is real, not boilerplate: your actual commands, your
folder tree, opinionated conventions for your chosen stack (React, Angular,
Spring, Django, Go, ...), and path-scoped rules per folder for
frontend+backend monorepos.

## Install

```bash
npx skills@latest add mkolew/skills --skill ai-scaffolding
```

## Usage

```text
/ai-scaffolding
```

or just ask: "set up AI agent configs for this repo".

### Example session

```text
You:   /ai-scaffolding

Agent: Detected: pnpm workspace, Next.js app in apps/web, Fastify API in
       apps/api, no existing agent config. Confirm or correct:
       1. Project type: both (frontend + backend)?
       2. Frontend: Next.js in apps/web?
       3. Backend: Node/TypeScript (Fastify) in apps/api?
       4. Which agents? (Claude Code / Copilot / Cursor / Codex / Gemini)
          — I recommend AGENTS.md in any case.

You:   All correct. Claude Code + Cursor + AGENTS.md.

Agent: [clones the reference repo, generates:]
       AGENTS.md
       CLAUDE.md                      + apps/web/CLAUDE.md, apps/api/CLAUDE.md
       .claude/settings.json, skills/, commands/, hooks/
       .mcp.json
       .cursor/rules/*.mdc (always-apply + per-folder globs), hooks.json, mcp.json
       [validates json/sh/toml, reports next steps]
```

## How it works

The skill uses [github.com/mkolew/ai-scaffolding](https://github.com/mkolew/ai-scaffolding)
as its reference implementation: at runtime it shallow-clones the repo and
reads `COPY_TO_ROOT/` — a maintained, validated example setup for every
supported agent. Your generated files follow those formats but describe
your project, not the reference's fictional one.

If the clone fails (offline), the skill falls back to a locations table
embedded in the SKILL.md and says so.

## Design decisions

- **Clone at runtime, don't embed templates.** The reference repo is the
  single source of truth; the skill never goes stale when the repo gains an
  agent or fixes a format.
- **Detect before asking.** Lockfiles, framework configs, and workspace
  markers answer most interview questions — you confirm instead of typing.
- **Honest gaps.** Tools missing a building block (Gemini has no hooks,
  Cursor has no custom subagents) are reported as gaps, never faked with
  invented config files.
- **Placeholder secrets only.** Every MCP config uses `${VAR}` /
  `${input:id}` style references; the skill refuses to write a real-looking
  token even if you paste one.
- **Existing config is sacred.** Anything already in the repo is kept
  unless you explicitly choose merge or replace.
