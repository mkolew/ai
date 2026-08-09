---
name: startup-script
description: Create a single-command local startup script for a repository at .scripts/run.sh, driven by the project's own existing tooling. Use when the user types /startup-script or asks for a way to start a project locally with one command, a run script, a dev-environment bootstrap, or says onboarding a repo takes too many steps. Investigates the repo to find how it is actually started, treats the README as untrusted, and never invents commands.
license: MIT
---

# Startup Script

You are creating a standardised way to start a repository locally with one command.

The deliverable is `.scripts/run.sh` plus `.scripts/.gitignore` containing `*`, so the
whole folder — the script, its logs, its state — stays out of git. Nothing you produce
is ever committed, and nothing the team owns is ever modified.

**The script must contain no startup logic of its own.** It invokes commands that already
exist in the repository — npm/pnpm/yarn scripts, `dotnet run --launch-profile`,
`docker compose up`, Makefile targets — so that when maintainers change those, the script
keeps working. If you find yourself writing `node server.js` where `npm run dev` exists,
stop and use the existing script.

## Non-negotiable rules

These are ordered by how often they are the thing that goes wrong.

1. **The README is a hypothesis, not evidence.** Verify every claim against config files.
   Stale READMEs are the norm: expect wrong Node versions, scripts that no longer exist,
   and documented setup steps that have been commented out.
2. **Never invent a command.** Every command must be traceable to a file in the repo.
   Quote the source path when you report what you found.
3. **Derive menus from repo config at runtime**, never hardcode. Read brands, launch
   profiles, locales and environments out of the files that define them, so new ones
   appear without editing the script.
4. **Never modify a tracked file.** To change configuration, use the platform's own
   override mechanism (see Overrides below). If the only way to achieve something is
   editing tracked code, say so and let the user decide — do not do it silently.
5. **Readiness is a real HTTP status, not an open port.** Proxies and supervisors bind
   ports before the app serves anything. Accept 2xx/3xx/401/403; keep waiting on
   000/404/5xx.
6. **Preflight every port.** Dev servers silently fall back to the next free port, which
   then breaks configured URLs, auth callbacks and domain routing. Refuse to start and
   name the process holding it.
7. **Fail fast on sustained 5xx.** A dev server erroring on every request will not heal;
   after a short grace period, stop waiting and show the log.
8. **Validate environment files before starting anything**, naming the missing file, what
   it is for, and its template.
9. **Stop everything you started** and verify it is down.
10. **Verify with content, not status.** "HTTP 200" is not proof; assert on something only
    the working app produces — a title, a brand string, a locale attribute.

## Procedure

### 1. Investigate

Read widely before writing anything. Cover, where present:

- `README*`, `docs/`, `AGENT*.md`, `CONTRIBUTING*`
- `package.json` (root **and** every workspace), lockfiles, `.nvmrc`, `.npmrc`,
  `packageManager`, `pnpm-workspace.yaml`, `turbo.json`, `nx.json`, `lerna.json`
- `*.sln`, `*.csproj`, `Properties/launchSettings.json`, `appsettings*.json`,
  `global.json`, `Directory.*.props`, `.config/dotnet-tools.json`
- `docker-compose*.yml`, `compose*.yml`, `Dockerfile*`
- `Makefile`, `*.sh`, `*.ps1`, `*.cmd` at the root
- CI: `.github/workflows`, `azure-pipelines*.yml`, `.gitlab-ci.yml`, `Jenkinsfile`
- `.env*`, `*.example`, `*.template`, and `.gitignore` entries that reveal
  required-but-ignored files
- framework config: `next.config.*`, `vite.config.*`, `angular.json`, `.storybook/`,
  codegen configs, CMS clients

Answer these before writing a line:

- What are the components, and what order do they need? What waits for what?
- What is the exact command for each, and which file does it come from?
- Which ports, with evidence?
- Is Docker required, and for what — or is compose a dead production-image path?
- Which env files are required, which are gitignored, which have templates?
- Which runtime environments exist, and which are actually runnable locally?
- Are there brands/tenants/markets/themes selecting a variant at startup?
- What generated-but-gitignored artifacts must exist first (codegen, bundles, types)?

**CI is the most reliable source.** It runs on a clean machine and cannot rely on
undocumented local state.

### 2. Confirm the forks

Ask before writing when different answers mean materially different scripts:

- Two viable startup paths (an orchestrator and a manual path) — offer both, or ask.
- Whether non-local environments belong in the menu. Default: local-runnable only.
- Whether to enforce the pinned toolchain version or only report drift.

Do not ask about anything you can determine from the repo.

### 3. Write

Structure, in order: parse args → check prerequisites → check infrastructure (Docker) →
validate env files → menus → port preflight → install deps → generate artifacts →
start components in dependency order → print URLs → wait.

Required behaviours:

- `--help`, plus non-interactive flags for every menu, so it is usable when scripted.
- Background each long-running component, logging to `.scripts/logs/<name>.log`; probe
  readiness; on failure print the last lines of that log.
- A cleanup trap on `EXIT INT TERM` that stops everything it started. Enable job control
  (`set -m`) so each child gets its own process group and can be killed as a tree.
- Progress output with `====` banners, per-component success lines, and a final URL list
  with a short description each.
- Errors that say what failed, why it matters, and the exact command to fix it.

`bash` is the default. Justify anything else before using it — PowerShell only for a
Windows-only toolchain, Python only if genuinely needed. Avoid bash 4+ features
(associative arrays, `mapfile`, `${x,,}`) unless you have confirmed the shell.

`references/patterns.md` holds tested implementations of the readiness probe, port
preflight, background-process tracking and cleanup trap. Read it before writing them.

### 4. Verify

Do not report success on "it started".

- `bash -n` the script; `shellcheck` if available.
- Run `--help`.
- Negative test: temporarily rename a required env file, confirm it exits non-zero naming
  the file, and starts nothing. Restore it.
- Full run; assert on real content, not status codes.
- Ctrl+C, then confirm no orphaned processes and every port released.
- Confirm `git status` is clean and `.scripts/` is ignored.

Then **stop everything you started** and say so.

### 5. Document

Report per repository: what you found, the commands chosen and the file each came from,
why you chose them over alternatives, environments detected, variants detected, whether
Docker is required, which env files are needed, and every assumption you made. Flag any
contradiction you found — stale docs, broken scripts, config that cannot work — as
findings for the team, without fixing them unasked.

## Overrides, not edits

Configuration lives in the environment, so you can change behaviour without touching
tracked files:

| Platform | Mechanism | Note |
|---|---|---|
| .NET | `ConnectionStrings__Name`, `ASPNETCORE_ENVIRONMENT` | `__` maps to config nesting; env beats appsettings |
| Next.js / Node | `export VAR=value` before the dev command | Next and dotenv both skip keys already in `process.env`, so the export wins over `.env` |
| Docker Compose | `-f` overlay files, `COMPOSE_PROJECT_NAME` | never edit a tracked compose file |
| git | `.git/info/exclude` | local-only ignores; never committed |

When two tools each provision their own infrastructure for the same logical resource
(two database containers, two data directories), prefer making them **share one copy of
the data** over duplicating it. Check how each mounts its data before assuming a copy is
required — the fix is often a single symlink and no duplication at all.

## Diagnostics

When the app starts cleanly but pages are wrong, work down this list. Symptoms mislead;
each step is cheap and eliminates a whole class of cause.

1. **Which data source is it actually connected to?** Same database *name* in two
   containers is not the same database. Compare mounts and row counts.
2. **Does that source have publishable content?** A CMS whose start page exists only as a
   draft returns 404 for the site while admin and login return 200.
3. **Are binary assets present?** Database dumps carry metadata, not media. Thousands of
   asset rows with an empty blob directory means the files were never copied.
4. **Is an upstream dependency rejecting it?** A local service started fresh will not
   accept an API token issued by its hosted counterpart — that surfaces as 401 upstream
   and 500 on every page.
5. **Is the error page itself missing?** An empty `<body>` with a 404 status renders as a
   blank white page, which looks like a frontend fault but is the same missing-content
   problem.

Blank page and "page not found" for the same root cause is normal: frameworks pick
different error paths per environment name.
