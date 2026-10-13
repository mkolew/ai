---
name: reviewer-tooling
description: 'Review project tooling: GitHub Actions workflows, package.json and pnpm workspace files, .gitignore, .gitattributes, agent and editor config (.claude, launch.json), Makefiles and Dockerfiles. Use when reviewing changes to these files, or when the user types /reviewer-tooling. Catches script injection and leaked secrets in CI, over-broad permissions and tokens, deploys that run on pull requests, unpinned or deprecated actions and runtimes, lockfile drift, ignored files that must be committed (or committed files that must be ignored), CRLF and LFS mistakes, and machine-specific config. Part of the reviewer bundle.'
license: MIT
---

# Tooling reviewer

Scope: `.github/workflows/*`, `package.json`, `pnpm-workspace.yaml`, `.npmrc`, `.gitignore`, `.gitattributes`, `.claude/**`, `.vscode/**`, `Makefile`, `Dockerfile`. Skip lockfiles, except to check that they moved with `package.json`.

## Before reviewing

- Read each workflow end to end: triggers, permissions, jobs, the secrets used, and what is deployed where.
- Validate YAML (`actionlint` if installed, otherwise a YAML parser). Run `git check-ignore -v <path>` on files whose ignore status matters.

## Checklist

**CI security**

- `${{ github.event.* }}` values (PR titles, branch names, issue bodies) interpolated into `run:` let anyone run code. Pass them through `env:` and quote them.
- `pull_request_target` and `workflow_run` together with a checkout of PR code give that code your secrets.
- `permissions:` is least privilege (`contents: read` by default). Grant writes per job.
- Secrets are exposed only to the steps that need them, never echoed, and unavailable to fork PRs.
- Tokens are scoped to what the job does. Cloudflare: an API token from a template with only the needed permissions, never the Global API Key.
- Third-party actions are pinned to a release or commit SHA, never a branch.

**CI behaviour**

- Deploys run only on push to the release branch (or a manual trigger), never on pull requests.
- A `concurrency` group stops two deploys overlapping.
- Tests run before deploy, and a failing step fails the job. No `|| true` or `continue-on-error` on checks.
- Tool versions are pinned (Node, Python, Godot or Unity, pnpm). Caches are keyed on those versions and the lockfile hash.
- No deprecated runtimes or actions (warnings in recent runs). Setup steps come before the actions that need them (pnpm before an action that runs `pnpm`).
- Checkout fetches LFS when the build needs LFS files.

**Packages**

- `packageManager` matches the lockfile's tool and version. The lockfile changes whenever dependencies change.
- Runtime dependencies and devDependencies are in the right section. Apps set `"private": true`.
- `scripts` work on every OS the team and CI use.

**Git config**

- `.gitignore` covers build output, dependency folders, engine caches (`.godot/`, `Library/`), and secrets (`.env*`, `.dev.vars`, keystores, `credentials*`).
- It must not ignore files that have to be committed (Godot `.uid`/`.import`, Unity `.meta`). Negation patterns are needed when a parent folder is ignored.
- `.gitattributes`: `eol=lf` for scripts (CRLF breaks bash). Binaries are marked binary. LFS patterns match where the large files actually live.

**Agent and editor config**

- No machine-specific absolute paths or usernames in shared files.
- Commands named in config (`launch.json`, hooks) exist and run.
- No secrets, and no permission rules wider than the project needs.

**Containers and Make**

- Base images pinned. No secrets in layers. Make targets are `.PHONY` where needed, and fail on error.

## Readability

Apply [reviewer-readability](../reviewer-readability/SKILL.md) to the same files (names, structure, dead code, and whether comments are true, needed and well-shaped), plus:

- Every workflow step has a `name:` that says what it does. A non-obvious condition, pin or cache key has a one-line `#` comment explaining why.
- Scripts in `package.json` are named by what they do; long inline shell moves into a script file.

## Not findings

- Formatting of YAML or JSON.
- Pinning first-party `actions/*` to a major version, when the project does so consistently.

## Report

Use the `reviewer` format: `[severity] path:line — problem`, then `failure:` (the concrete input, state or platform → wrong result) and `fix:` (the smallest change). Most severe first. Prove each finding before reporting it, and say `No findings` with what you checked when there are none.
