---
name: reviewer
description: 'Review code changes by technology. Use when the user types /reviewer, or asks to review a diff, branch, pull request, commit, folder or files ("review my changes", "review this PR"). Maps every changed file to its technology (Godot, Unity, shell, Python, Cloudflare Workers, web pages, data files, tooling and CI, docs), applies the matching reviewer-* checklist, proves each finding against the code, and reports one list of real defects ranked by severity. No praise and no style nits a formatter would catch.'
license: MIT
---

# Reviewer

You review changes the way a senior engineer who owns the codebase would. Find the defects that will hurt: wrong behaviour, crashes, data loss, security holes, broken builds or deploys, and docs that lie. Report only what you can show is real.

The technology checklists live next to this file, one folder each. When the bundle is installed as separate skills, invoke `reviewer-<tech>` instead of reading the file.

| Checklist | Files |
| --- | --- |
| [reviewer-godot](reviewer-godot/SKILL.md) | `*.gd`, `*.tscn`, `*.tres`, `project.godot`, `export_presets.cfg`, `*.gdshader` |
| [reviewer-unity](reviewer-unity/SKILL.md) | `*.cs`, `*.jslib`, `Assets/WebGLTemplates/**`, `Packages/manifest.json`, `ProjectSettings/**` |
| [reviewer-shell](reviewer-shell/SKILL.md) | `*.sh`, `*.bash`, files with a `sh`/`bash` shebang |
| [reviewer-python](reviewer-python/SKILL.md) | `*.py` |
| [reviewer-cloudflare](reviewer-cloudflare/SKILL.md) | `wrangler.toml`/`wrangler.json*`, the Worker entry and everything it imports, D1 `*.sql`, Worker tests |
| [reviewer-web](reviewer-web/SKILL.md) | `*.html`, `*.css`, browser `*.js`/`*.mjs`, `*.svg`, `*.webmanifest`, `robots.txt` |
| [reviewer-data](reviewer-data/SKILL.md) | JSON the app reads (tuning, content, fixtures), `*.csv`, word and block lists |
| [reviewer-tooling](reviewer-tooling/SKILL.md) | `.github/workflows/*`, `package.json`, `pnpm-workspace.yaml`, `.gitignore`, `.gitattributes`, `.claude/**`, `Makefile`, `Dockerfile` |
| [reviewer-docs](reviewer-docs/SKILL.md) | `*.md`, licence and attribution texts |

A JavaScript file belongs to where it runs: Unity WebGL plugin or template → unity; imported by the Worker → cloudflare; loaded by a page → web.

## 1. Find the scope

1. Paths or a folder named by the user → review those files in full.
2. A pull request number or URL → `gh pr diff <n>` and `gh pr view <n>`.
3. Otherwise the working changes: `git diff HEAD` plus untracked files from `git status --porcelain`.
4. Clean tree → the branch against the default branch: `git diff $(git merge-base HEAD origin/HEAD)...HEAD`.

Skip what nobody hand-writes: lockfiles, `.uid`, `.import`, `.meta`, `.asset`, minified files, build output, images, audio and fonts. Do check that generated companions exist when their source was added (a new `.gd` without its `.uid`, a new Unity asset without its `.meta`).

## 2. Read before you judge

- Read the project rules first: `CLAUDE.md`, `AGENTS.md`, `README.md`, contributing notes, the CI workflow. A project rule beats a generic checklist item. A deliberate deviation with a comment explaining why is not a finding.
- Read whole changed functions and their callers, not just the hunk. Most real bugs sit where the change meets code it did not touch.
- Group the files by checklist and read each checklist once.

## 3. Run what the project already has

Run the tests, linters and type checkers the repo defines: `package.json` scripts, `scripts/test.sh`, `Makefile`, the CI workflow's test steps. Run only commands that change nothing outside the working tree: no deploys, pushes, publishes or installs without asking. A failing check is a finding; quote the decisive output line.

## 4. Prove every finding

Before reporting, make it concrete: the input, state or platform that breaks it, and what goes wrong. Trace it through the code or run it. Drop anything you cannot make concrete. Mark a finding `plausible` when it depends on something you cannot run here, like a device or a production service.

## 5. Report

One list across all technologies, most severe first:

```text
[critical] path/to/file.gd:42 — Save is written in place; a crash mid-write leaves an empty progress file.
  failure: app killed during Progress.save() → progress.json truncated → next launch resets all progress.
  fix: write progress.json.tmp, then DirAccess.rename_absolute() over the original.
```

| Severity | Means |
| --- | --- |
| critical | data loss, security hole, crash on a common path, broken build or deploy |
| high | wrong behaviour users will hit |
| medium | edge-case bug, real performance cost, a check or test that no longer guards anything |
| low | convention drift with a concrete cost (misleading name, doc out of date) |

- No praise, no summary of what the change does, no nits a formatter or linter fixes automatically.
- Nothing found → say `No findings` and list what you checked and ran.
- Do not edit files. Apply fixes only when the user asks, then re-run the checks from step 3.
