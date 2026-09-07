# AI

Reusable building blocks for working with AI coding agents (Claude Code, Codex, Cursor, and others). Today that's **agent skills** — markdown instructions that teach an agent to perform a specialized task well — but the repo isn't skills-only by design; other agent-facing tooling lands here as it comes up.

## Skills

Each skill lives in its own directory, described by a `SKILL.md` the agent reads and a `README.md` for humans:

```text
.claude-plugin/
  marketplace.json   # Claude Code plugin catalog — one plugin per skill
skills/
  ai-scaffolding/
    SKILL.md      # frontmatter (name, description) + agent instructions
    README.md     # human-facing docs for the skill
    examples/
      prompts.md  # copy-paste prompts for common cases
  comment-hygiene/
    SKILL.md
    README.md
    examples/
      prompts.md
    references/
      languages.md # per-language comment + doc-comment rules
  microfrontends/
    SKILL.md
    README.md
    examples/
      prompts.md
  startup-script/
    SKILL.md
    README.md
    examples/
      prompts.md
    references/
      patterns.md # tested bash primitives the skill reuses
  typed-blocks/
    SKILL.md
    README.md
    examples/
      prompts.md
scripts/
  lib.mjs            # shared frontmatter parser + skill loader
  list-skills.mjs    # catalog all skills in this repo
  verify-skills.mjs  # validate frontmatter, structure, and per-skill README (CI-friendly)
```

Skills are **prompts, not code**: the agent reads the skill and follows its workflow. That keeps every skill pluggable, independent, and agent-platform agnostic.

## Installation

Two ways to install: as a **Claude Code plugin** from the marketplace in this repo, or as a **plain skill file** with the `skills` installer (works with any agent).

### Claude Code plugin marketplace

This repo doubles as a plugin marketplace named `mkolew`. Each skill ships as its own plugin, so you install only the ones you want.

**Inside Claude Code.** Add the marketplace once, then install per plugin:

```text
/plugin marketplace add mkolew/ai
/plugin install microfrontends@mkolew
/plugin install ai-scaffolding@mkolew
/plugin install typed-blocks@mkolew
/plugin install startup-script@mkolew
/plugin install comment-hygiene@mkolew
/reload-plugins
```

Or run `/plugin` on its own to browse the catalog and install from the list. Installing asks for a scope — `user` (machine-wide), `project` (shared through the repo's `.claude/settings.json`), or `local` (this machine, not committed).

**From the CLI**, for dotfiles and scripting:

```bash
claude plugin marketplace add mkolew/ai
claude plugin install typed-blocks@mkolew            # user scope (default)
claude plugin install typed-blocks@mkolew -s project # shared with the team
```

**For a whole team.** Commit this to your project's `.claude/settings.json` and everyone who clones and trusts the folder is prompted to install:

```json
{
  "extraKnownMarketplaces": {
    "mkolew": {
      "source": { "source": "github", "repo": "mkolew/ai" }
    }
  },
  "enabledPlugins": {
    "microfrontends@mkolew": true,
    "typed-blocks@mkolew": true
  }
}
```

**After installing**, Claude invokes each skill automatically from its `description` triggers. To invoke one by hand, use the plugin namespace: `/microfrontends:microfrontends`, `/ai-scaffolding:ai-scaffolding`, `/typed-blocks:typed-blocks`, `/startup-script:startup-script`.

**Updates.** Run `/plugin marketplace update mkolew` to refresh the catalog. Plugins are pinned to the `version` in `marketplace.json`, so a new copy arrives only when that string changes — see [Releasing](#releasing).

### `npx skills add` (any agent)

Install skills from this repo with the [`skills`](https://www.npmjs.com/package/skills) installer:

```bash
# interactive picker over all skills in the repo
npx skills@latest add mkolew/ai

# install a specific skill
npx skills@latest add mkolew/ai --skill microfrontends
npx skills@latest add mkolew/ai --skill ai-scaffolding
npx skills@latest add mkolew/ai --skill typed-blocks
npx skills@latest add mkolew/ai --skill startup-script
npx skills@latest add mkolew/ai --skill comment-hygiene
```

The installer copies the skill into your agent's skill directory (e.g. `.claude/skills/` for Claude Code), where it becomes automatically discoverable.

### Repo maintenance commands

```bash
npm run list     # list all skills with descriptions
npm run verify   # validate every skill (frontmatter, naming, body, README)
```

`verify` fails when a skill is missing `SKILL.md`, `README.md`, or `examples/prompts.md`, when frontmatter `name` does not match the directory name, when `description` is absent or exceeds 1024 characters, or when the instruction body is effectively empty.

## Adding a new skill

1. Create `skills/<skill-name>/SKILL.md`.
2. Add frontmatter — `name` must match the directory, `description` should state _when_ the skill triggers (this is what the agent matches on):

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
4. Add `skills/<skill-name>/examples/prompts.md` — copy-paste prompts users can send with only small edits. Use `<ALL CAPS>` placeholders for the parts they must replace. Also required by `npm run verify`.
5. Publish it as a plugin — each skill is its own plugin with its own source
   directory, so installing one doesn't pull in the others.

   Add `skills/my-skill/.claude-plugin/plugin.json`:

   ```json
   {
     "name": "my-skill",
     "description": "What it does, for the plugin browser",
     "version": "0.1.0",
     "license": "MIT",
     "author": { "name": "Your Name", "url": "https://github.com/you" },
     "skills": ["./"]
   }
   ```

   Then add the matching entry to `.claude-plugin/marketplace.json`:

   ```json
   {
     "name": "my-skill",
     "source": "./skills/my-skill",
     "description": "What it does, for the plugin browser",
     "category": "productivity"
   }
   ```

   `source` must point at that skill's own directory — sharing one `source`
   across plugin entries makes plugin identity ambiguous to installers.
   `skills: ["./"]` in `plugin.json` tells Claude Code the plugin's own root
   is the skill (root-level `SKILL.md` auto-discovery has been unreliable in
   practice, so this repo declares it explicitly). `npm run verify` fails
   when a skill has no marketplace entry, when the entry's `source` doesn't
   match `./skills/<name>`, or when `plugin.json` is missing or lacks
   `author.name`.

6. Run `npm run verify`, then `claude plugin validate .` to check the marketplace catalog itself (schema, duplicate plugin names, source paths).

## Releasing

Pushing to `main` updates the catalog, but installed plugins are pinned to the `version` string in their `marketplace.json` entry. **Bump `version` on every meaningful skill change**, otherwise existing users keep the copy they already have. Users then pick it up with `/plugin marketplace update mkolew`.

Names are stable identifiers, so treat them as public API:

| Field              | Cost of renaming after release                                                                                                                                                           |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Marketplace `name` | Highest — no migration path. Users must remove the marketplace, re-add it, and reinstall every plugin.                                                                                   |
| Plugin `name`      | Breaks existing installs. Add a top-level `renames` map (`{"old-name": "new-name"}`, or `null` if removed) so Claude Code migrates users automatically. Treat it as append-only history. |
| `displayName`      | Free — a UI label only, not used for lookup or namespacing.                                                                                                                              |

## Available skills

| Skill                                               | Triggers on                                                                                               | Description                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [ai-scaffolding](skills/ai-scaffolding/README.md)   | `/ai-scaffolding`, "set up CLAUDE.md / copilot instructions / cursor rules / AGENTS.md"                   | Interviews you about project type, layout, stack, and target agents, then generates tailored AI agent configs where each tool reads them — Claude Code, GitHub Copilot, Cursor, OpenAI Codex, Gemini CLI, and the cross-tool `AGENTS.md` baseline.                                                                                                                                                                                           |
| [microfrontends](skills/microfrontends/README.md)   | `/microfrontends`, mentions of _microfrontend, shell, host, remote, module federation, native federation_ | Analyzes a codebase's microfrontend architecture: federation type, host/remote topology, vertical vs horizontal split, technology map, communication model, route ownership, risks, and improvements — citing file evidence and asking instead of guessing.                                                                                                                                                                                  |
| [startup-script](skills/startup-script/README.md)   | `/startup-script`, "one-command way to start this project"                                                | Investigates how a repo is actually started (not what its README claims) and writes a single `.scripts/run.sh` driven by the project's own tooling, without modifying any tracked file.                                                                                                                                                                                                                                                      |
| [typed-blocks](skills/typed-blocks/README.md)       | any line starting with `===(`, or `/typed-blocks`                                                         | Typed content delimiters for prompts — mark pasted content as `===(json)`, `===(code\|typescript)`, `===(pr-comment)`, `===(error)`, etc., plus `---`/`+++` before/after pairs. Block content is treated as data, never instructions.                                                                                                                                                                                                        |
| [comment-hygiene](skills/comment-hygiene/README.md) | writing/editing any comment, or `/comment-hygiene`                                                        | Enforces consistent comment style as the agent codes — one-line comments stay one line, template/HTML comments never leak into the DOM, every method/class you write gets a doc comment (JSDoc, Javadoc, C# XML doc, docstring, godoc, rustdoc, YARD, PHPDoc, GDScript `##`) with the right params/return/purpose, and every unit test is marked `// Arrange`, `// Act`, `// Assert` — never backfilling docs on existing code unless asked. |

## License

MIT — see [LICENSE](LICENSE).
