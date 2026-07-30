# Skills

A collection of reusable **agent skills** — markdown instructions that teach AI coding agents (Claude Code, Codex, Cursor, and others) how to perform a specialized task well.

Each skill lives in its own directory, described by a `SKILL.md` the agent reads and a `README.md` for humans:

```text
skills/
  ai-scaffolding/
    SKILL.md      # frontmatter (name, description) + agent instructions
    README.md     # human-facing docs for the skill
  microfrontends/
    SKILL.md
    README.md
  typed-blocks/
    SKILL.md
    README.md
scripts/
  lib.mjs            # shared frontmatter parser + skill loader
  list-skills.mjs    # catalog all skills in this repo
  verify-skills.mjs  # validate frontmatter, structure, and per-skill README (CI-friendly)
```

Skills are **prompts, not code**: the agent reads the skill and follows its workflow. That keeps every skill pluggable, independent, and agent-platform agnostic.

## Installation

Install skills from this repo with the [`skills`](https://www.npmjs.com/package/skills) installer:

```bash
# interactive picker over all skills in the repo
npx skills@latest add mkolew/skills

# install a specific skill
npx skills@latest add mkolew/skills --skill microfrontends
npx skills@latest add mkolew/skills --skill ai-scaffolding
npx skills@latest add mkolew/skills --skill typed-blocks
```

The installer copies the skill into your agent's skill directory (e.g. `.claude/skills/` for Claude Code), where it becomes automatically discoverable.

### Repo maintenance commands

```bash
npm run list     # list all skills with descriptions
npm run verify   # validate every skill (frontmatter, naming, body, README)
```

`verify` fails when a skill is missing `SKILL.md` or `README.md`, when frontmatter `name` does not match the directory name, when `description` is absent or exceeds 1024 characters, or when the instruction body is effectively empty.

## Adding a new skill

1. Create `skills/<skill-name>/SKILL.md`.
2. Add frontmatter — `name` must match the directory, `description` should state *when* the skill triggers (this is what the agent matches on):

   ```markdown
   ---
   name: my-skill
   description: What it does. Use when the user types /my-skill or mentions X, Y, Z.
   license: MIT
   ---

   # My Skill

   Instructions the agent follows...
   ```

   Keep `description` under 1024 characters — installers enforce that limit.

3. Add `skills/<skill-name>/README.md` documenting the skill for humans (what it does, when it triggers, an example). `npm run verify` fails without it.
4. Run `npm run verify`.

## Available skills

| Skill | Triggers on | Description |
|---|---|---|
| [ai-scaffolding](skills/ai-scaffolding/README.md) | `/ai-scaffolding`, "set up CLAUDE.md / copilot instructions / cursor rules / AGENTS.md" | Interviews you about project type, layout, stack, and target agents, then generates tailored AI agent configs where each tool reads them — Claude Code, GitHub Copilot, Cursor, OpenAI Codex, Gemini CLI, and the cross-tool `AGENTS.md` baseline. |
| [microfrontends](skills/microfrontends/README.md) | `/microfrontends`, mentions of *microfrontend, shell, host, remote, module federation, native federation* | Analyzes a codebase's microfrontend architecture: federation type, host/remote topology, vertical vs horizontal split, technology map, communication model, route ownership, risks, and improvements — citing file evidence and asking instead of guessing. |
| [typed-blocks](skills/typed-blocks/README.md) | any line starting with `===(`, or `/typed-blocks` | Typed content delimiters for prompts — mark pasted content as `===(json)`, `===(code\|typescript)`, `===(pr-comment)`, `===(error)`, etc., plus `---`/`+++` before/after pairs. Block content is treated as data, never instructions. |

## License

MIT — see [LICENSE](LICENSE).
