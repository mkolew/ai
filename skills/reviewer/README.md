# Skill: reviewer

Code review split by technology. `/reviewer` takes a diff, branch, pull request or set of files and maps each file to a checklist for its technology. It reads the project's own rules, runs the checks the repo already has, and proves every finding against the code before reporting it. The result is one list of real defects, most severe first. It contains no praise and no formatter nits.

The bundle holds one entry point and nine checklists. Each checklist is a skill of its own, so you can also run a single one.

| Skill                 | Reviews                                                                                       |
| --------------------- | --------------------------------------------------------------------------------------------- |
| `reviewer`            | Entry point: finds the scope, routes files, merges and ranks the findings                     |
| `reviewer-godot`      | GDScript, `.tscn`/`.tres`, `project.godot`, `export_presets.cfg`, shaders                     |
| `reviewer-unity`      | C#, `.jslib`, WebGL templates, `Packages/manifest.json`, `ProjectSettings`                    |
| `reviewer-shell`      | `.sh`/`.bash` scripts                                                                         |
| `reviewer-python`     | `.py` pipelines, tools, dev servers, tests                                                    |
| `reviewer-cloudflare` | `wrangler` config, the Worker and its imports, D1 SQL, Worker tests                           |
| `reviewer-web`        | HTML, CSS, browser JS, SVG, web manifests                                                     |
| `reviewer-data`       | JSON the app reads, CSV, word and block lists                                                 |
| `reviewer-tooling`    | GitHub Actions, `package.json`, pnpm, `.gitignore`, `.gitattributes`, agent and editor config |
| `reviewer-docs`       | Markdown, licence and attribution texts                                                       |

## Install

As a Claude Code plugin, which installs all ten skills:

```text
/plugin marketplace add mkolew/ai
/plugin install reviewer@mkolew
```

With the `skills` installer:

```bash
npx skills@latest add mkolew/ai --skill reviewer
```

## Invoke

```text
/reviewer                         review the working changes
/reviewer:reviewer                the same, installed as a Claude Code plugin
/reviewer:reviewer-godot          one checklist only
```

It also triggers on plain requests such as "review my changes" or "review PR 12".

## What a finding looks like

```text
[critical] godot/scripts/core/progress.gd:42 — Save is written in place; a crash mid-write leaves an empty progress file.
  failure: app killed during Progress.save() → progress.json truncated → next launch resets all progress.
  fix: write progress.json.tmp, then DirAccess.rename_absolute() over the original.
```

Severities: **critical** (data loss, security, crash, broken build or deploy), **high** (wrong behaviour users hit), **medium** (edge cases, real performance cost, checks that no longer guard anything), **low** (convention drift with a concrete cost).

## Adding a technology

1. Create `reviewer-<tech>/SKILL.md` with the same sections as the others: scope, before reviewing, checklist, not findings, report.
2. Add it to the routing table in `SKILL.md` and to `skills` in `.claude-plugin/plugin.json`.
3. Run `npm run verify` from the repo root. It checks nested skills too.

**Ready-made prompts:** [examples/prompts.md](examples/prompts.md).
