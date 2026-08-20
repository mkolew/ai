# Copy-paste prompts — startup-script

Copy one, swap the `<PLACEHOLDERS>`, send. The skill investigates the repo
before writing, so a short prompt works — the longer ones below just answer
its questions up front or narrow the scope.

Plugin install? The explicit form is `/startup-script:startup-script`.

---

## Just make it start

```text
/startup-script

Give me a one-command way to start this project locally. Read the repo to
find out how it actually starts — don't trust the README.
```

---

## Multi-component repo

```text
/startup-script

This repo runs <NUMBER> components: <e.g. Next.js frontend in apps/web,
.NET API in src/Api, Postgres + Redis via docker compose>. Write
`.scripts/run.sh` that starts them in dependency order, waits for each to be
genuinely ready before starting the next, and prints every URL at the end.
```

---

## Answer the fork questions up front

```text
/startup-script

Write the startup script. Answering the questions you'd ask:

- Startup path: <use the orchestrator | start each component manually>
- Environments in the menu: <local only | also include <ENV NAMES>>
- Pinned toolchain version: <enforce it and fail | report drift and continue>

Everything else, determine from the repo.
```

---

## Menus for the repo's own variants

```text
/startup-script

This project has multiple <brands | tenants | markets | launch profiles>,
defined in <FILE OR FOLDER THAT DEFINES THEM>. The script should read that
list at runtime rather than hardcoding it, offer it as a menu, and expose the
same choice as a flag so I can run it non-interactively.
```

---

## Docker Compose based

```text
/startup-script

Infrastructure here comes from <docker-compose.yml OR compose file path>.
The script should check Docker is running before anything else, bring up the
infra services, wait until each is actually accepting connections (not just
port-open), then start the app components. Fail with a clear message if
Docker isn't available.
```

---

## Fix an existing script

```text
/startup-script

`.scripts/run.sh` already exists but <WHAT GOES WRONG: e.g. it reports
success while the site 404s / it leaves servers running when I Ctrl-C / it
hangs waiting for a service that already crashed>. Investigate the real
cause and fix the script.
```

---

## It starts, but the page is wrong

```text
/startup-script

Startup reports success, but <SYMPTOM: e.g. the homepage is blank / every
route 404s / images are missing / the page renders but with no content>.
Walk the diagnosis order: which data source it's actually connected to,
whether that source has publishable content, whether assets are present,
whether an upstream service is rejecting credentials, and whether the error
page itself is missing.
```

---

## Environment validation only

```text
/startup-script

Before writing any startup logic: audit the env files in this repo. Tell me
which variables are required, which are blank or placeholder in the example
files, and what each one breaks when it's wrong. Then add that validation as
the first step of `.scripts/run.sh`.
```

---

## Port conflicts

```text
/startup-script

Fixed ports matter here — <WHY: e.g. auth callbacks and domain routing are
bound to them>. Make the script preflight every port it needs, refuse to
start on a conflict with the exact command to free it, and never let a dev
server silently move to another port.
```

---

## Onboarding a new machine

```text
/startup-script

Write the startup script assuming a fresh machine: check every prerequisite
first (runtime versions against what's pinned, package manager, Docker, CLI
tools), and for each missing one print exactly how to install it. Then do
the normal startup.
```

---

## Document what actually starts it

```text
/startup-script

Don't write the script yet. First tell me how this project really starts —
which commands, in what order, with which prerequisites — and where each
conclusion came from (package.json, lockfile, launchSettings.json, compose
file, CI). Flag anything the README claims that's no longer true.
```
