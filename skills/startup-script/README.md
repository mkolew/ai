# Skill: startup-script

Turns "how do I run this repo again?" into one command. The agent investigates how a
project is _actually_ started — reading its config rather than trusting its README — then
writes `.scripts/run.sh` that starts every component in the right order, validates the
environment first, and prints the URLs at the end.

Everything lives in `.scripts/`, which contains a `.gitignore` holding `*`. The script,
its logs and its state are invisible to git, so this is personal tooling that never
appears in a pull request and never needs the team's agreement.

## Install

```bash
npx skills@latest add mkolew/ai --skill startup-script
```

## Use

```text
/startup-script                    installed as a skill file
/startup-script:startup-script     installed as a Claude Code plugin
```

Or just ask: _"give me a one-command way to start this project locally"_.

**Ready-made prompts:** [examples/prompts.md](examples/prompts.md) —
copy-paste prompts for the common cases (multi-component repo, Docker Compose
infra, menus for brands/tenants/profiles, fixing an existing script,
diagnosing "it starts but the page is wrong", fresh-machine onboarding).

## What it produces

```text
.scripts/
├── .gitignore     # contains: *
├── run.sh         # the single entry point
└── logs/          # one log per component, created at runtime
```

`run.sh` gives you interactive menus for anything the repo genuinely supports — runtime
environments, brands, tenants, markets, launch profiles — and flags for every menu so it
works non-interactively too:

```bash
./.scripts/run.sh                              # menus
./.scripts/run.sh --site acme --env local      # scripted
./.scripts/run.sh --help
```

## The core guarantee

**The script contains no startup logic of its own.** It calls the commands the repo
already defines — npm/pnpm/yarn scripts, `dotnet run --launch-profile`,
`docker compose up`, Makefile targets. Menu options are read from the files that define
them, so a new brand or launch profile appears without touching the script. When
maintainers change how the project starts, the script follows.

The corollary: **no tracked file is ever modified.** Where configuration has to change,
it goes through the platform's own override — `ConnectionStrings__*` for .NET, a shell
export for Next.js, `.git/info/exclude` for local-only ignores.

## Why not just follow the README

Across the repositories this skill was built from, every README was wrong in a way that
would have broken the script:

- a documented runtime version several majors behind the one pinned in the version file,
  the `engines` field and CI
- a setup step whose container block had been commented out, so following it gave no
  database
- several documented commands that no longer existed as scripts at all
- an env template shipping the single most important variable blank, guaranteeing a crash

So the skill treats the README as a hypothesis and verifies against `package.json`,
lockfiles, `launchSettings.json`, compose files and CI definitions. CI is trusted most: it
runs on a clean machine and cannot depend on undocumented local state.

## Hard-won rules it encodes

Each of these cost a real bug during development:

| Rule                                          | The failure it prevents                                                                       |
| --------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Readiness is an HTTP status, not an open port | An orchestrator proxy bound the port and 404'd; startup reported success while nothing worked |
| Preflight every port                          | A dev server silently moved to 3001, breaking auth callbacks and domain routing               |
| Fail fast on sustained 5xx                    | A misconfigured token made every page 500; the probe waited instead of reporting it           |
| Validate env files first, with reasons        | Copying `.env.example` verbatim produced a crash with no explanation                          |
| Verify on content, not status                 | HTTP 200 on an error page looks identical to success                                          |
| Stop everything you started                   | Leftover servers hold the fixed ports the project needs                                       |

## Diagnosing "it starts but the page is wrong"

The skill also carries a triage order for the case where startup succeeds and the site
still misbehaves: which data source is it _actually_ connected to, does that source have
publishable content, are the binary assets present, is an upstream service rejecting its
credentials, and is the error page itself missing. A blank white page and a "page not
found" are routinely the same root cause — frameworks pick different error paths per
environment name.

## Files

| File                     | Contents                                                                                                                          |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `SKILL.md`               | The procedure, rules and diagnostics                                                                                              |
| `references/patterns.md` | Tested bash for readiness probes, port preflight, background-process tracking, cleanup traps, menus and JSONC-safe config reading |

## License

MIT
