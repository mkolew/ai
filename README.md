# Skills

A collection of reusable **agent skills** — markdown instructions that teach AI coding agents (Claude Code, Codex, Cursor, and others) how to perform a specialized task well.

Each skill lives in its own directory, described by a `SKILL.md` the agent reads and a `README.md` for humans:

```text
.claude-plugin/
  marketplace.json   # Claude Code plugin catalog — one plugin per skill
skills/
  ai-scaffolding/
    SKILL.md      # frontmatter (name, description) + agent instructions
    README.md     # human-facing docs for the skill
  microfrontends/
    SKILL.md
    README.md
  startup-script/
    SKILL.md
    README.md
    references/
      patterns.md # tested bash primitives the skill reuses
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

Two ways to install: as a **Claude Code plugin** from the marketplace in this repo, or as a **plain skill file** with the `skills` installer (works with any agent).

### Claude Code plugin marketplace

This repo doubles as a plugin marketplace named `mkolew-skills`. Each skill ships as its own plugin, so you install only the ones you want.

**Inside Claude Code.** Add the marketplace once, then install per plugin:

```text
/plugin marketplace add mkolew/skills
/plugin install microfrontends@mkolew-skills
/plugin install ai-scaffolding@mkolew-skills
/plugin install typed-blocks@mkolew-skills
/plugin install startup-script@mkolew-skills
/reload-plugins
```

Or run `/plugin` on its own to browse the catalog and install from the list. Installing asks for a scope — `user` (machine-wide), `project` (shared through the repo's `.claude/settings.json`), or `local` (this machine, not committed).

**From the CLI**, for dotfiles and scripting:

```bash
claude plugin marketplace add mkolew/skills
claude plugin install typed-blocks@mkolew-skills            # user scope (default)
claude plugin install typed-blocks@mkolew-skills -s project # shared with the team
```

**For a whole team.** Commit this to your project's `.claude/settings.json` and everyone who clones and trusts the folder is prompted to install:

```json
{
  "extraKnownMarketplaces": {
    "mkolew-skills": {
      "source": { "source": "github", "repo": "mkolew/skills" }
    }
  },
  "enabledPlugins": {
    "microfrontends@mkolew-skills": true,
    "typed-blocks@mkolew-skills": true
  }
}
```

**After installing**, Claude invokes each skill automatically from its `description` triggers. To invoke one by hand, use the plugin namespace: `/microfrontends:microfrontends`, `/ai-scaffolding:ai-scaffolding`, `/typed-blocks:typed-blocks`, `/startup-script:startup-script`.

**Updates.** Run `/plugin marketplace update mkolew-skills` to refresh the catalog. Plugins are pinned to the `version` in `marketplace.json`, so a new copy arrives only when that string changes — see [Releasing](#releasing).

### `npx skills add` (any agent)

Install skills from this repo with the [`skills`](https://www.npmjs.com/package/skills) installer:

```bash
# interactive picker over all skills in the repo
npx skills@latest add mkolew/skills

# install a specific skill
npx skills@latest add mkolew/skills --skill microfrontends
npx skills@latest add mkolew/skills --skill ai-scaffolding
npx skills@latest add mkolew/skills --skill typed-blocks
npx skills@latest add mkolew/skills --skill startup-script
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
4. Publish it as a plugin — add an entry to `.claude-plugin/marketplace.json`:

   ```json
   {
     "name": "my-skill",
     "source": "./",
     "skills": ["./skills/my-skill"],
     "description": "What it does, for the plugin browser",
     "version": "0.1.0",
     "license": "MIT"
   }
   ```

   `source: "./"` points at this repo; `skills` scopes the entry to one skill directory so the other skills don't load with it. `npm run verify` fails when a skill has no marketplace entry, or when an entry points at a directory with no `SKILL.md`.

5. Run `npm run verify`, then `claude plugin validate .` to check the marketplace catalog itself (schema, duplicate plugin names, source paths).

## Releasing

Pushing to `main` updates the catalog, but installed plugins are pinned to the `version` string in their `marketplace.json` entry. **Bump `version` on every meaningful skill change**, otherwise existing users keep the copy they already have. Users then pick it up with `/plugin marketplace update mkolew-skills`.

Names are stable identifiers, so treat them as public API:

| Field | Cost of renaming after release |
|---|---|
| Marketplace `name` | Highest — no migration path. Users must remove the marketplace, re-add it, and reinstall every plugin. |
| Plugin `name` | Breaks existing installs. Add a top-level `renames` map (`{"old-name": "new-name"}`, or `null` if removed) so Claude Code migrates users automatically. Treat it as append-only history. |
| `displayName` | Free — a UI label only, not used for lookup or namespacing. |

## Available skills

| Skill | Triggers on | Description |
|---|---|---|
| [ai-scaffolding](skills/ai-scaffolding/README.md) | `/ai-scaffolding`, "set up CLAUDE.md / copilot instructions / cursor rules / AGENTS.md" | Interviews you about project type, layout, stack, and target agents, then generates tailored AI agent configs where each tool reads them — Claude Code, GitHub Copilot, Cursor, OpenAI Codex, Gemini CLI, and the cross-tool `AGENTS.md` baseline. |
| [microfrontends](skills/microfrontends/README.md) | `/microfrontends`, mentions of *microfrontend, shell, host, remote, module federation, native federation* | Analyzes a codebase's microfrontend architecture: federation type, host/remote topology, vertical vs horizontal split, technology map, communication model, route ownership, risks, and improvements — citing file evidence and asking instead of guessing. |
| [typed-blocks](skills/typed-blocks/README.md) | any line starting with `===(`, or `/typed-blocks` | Typed content delimiters for prompts — mark pasted content as `===(json)`, `===(code\|typescript)`, `===(pr-comment)`, `===(error)`, etc., plus `---`/`+++` before/after pairs. Block content is treated as data, never instructions. |

## License

MIT — see [LICENSE](LICENSE).
