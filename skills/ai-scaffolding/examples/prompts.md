# Copy-paste prompts — ai-scaffolding

Copy one, swap the `<PLACEHOLDERS>`, send. The skill interviews you before
writing anything, so a short prompt is enough — the prompts below just skip
ahead by answering the interview questions up front.

Plugin install? The explicit form is `/ai-scaffolding:ai-scaffolding`.

---

## Scaffold from scratch, let it interview me

```text
/ai-scaffolding

Set up AI agent configuration for this repository. Detect what you can first,
then ask me only what you couldn't determine.
```

---

## Answer the interview up front

```text
/ai-scaffolding

Set up AI agent configs. Answering your interview in advance:

- Project type: <frontend | backend | both>
- Folders: <e.g. frontend in apps/web, backend in apps/api — or "repo root">
- Frontend: <React/Next.js | Angular | Vue/Nuxt | Svelte/SvelteKit | other | n/a>
- Backend: <Node/TypeScript | Java/Spring | Python | Go | .NET | other | n/a>
- Target agents: <Claude Code, Cursor, Copilot, Codex, Gemini CLI> + AGENTS.md
- Extras: starter skills <yes/no>, hooks <yes/no>, MCP servers <e.g. GitHub,
  Postgres, Playwright — or "none">

Keep any existing agent config unless I say otherwise.
```

---

## One agent only

```text
/ai-scaffolding

I only use <Claude Code | Cursor | GitHub Copilot | OpenAI Codex | Gemini CLI>.
Generate just that tool's configuration plus AGENTS.md as the cross-tool
baseline. Skip everything else.
```

---

## Cross-tool baseline only

For a team where everyone uses a different agent.

```text
/ai-scaffolding

Generate only AGENTS.md — root file plus nested per-folder files if this is a
multi-part repo. No tool-specific config, no skills, no hooks, no MCP.
```

---

## Monorepo with path-scoped rules

```text
/ai-scaffolding

This is a monorepo: <FRONTEND STACK> in <apps/web>, <BACKEND STACK> in
<apps/api>, shared packages in <packages/>. Generate agent config with
path-scoped rules per folder — each part should get its own nested
instructions file, not one giant root file. Target agents:
<Claude Code, Cursor, AGENTS.md>.
```

---

## Add a tool to an existing setup

```text
/ai-scaffolding

We already have <e.g. CLAUDE.md and .claude/> in this repo and it's correct —
keep it untouched. Add configuration for <NEW AGENT> that mirrors the same
conventions, so both tools give consistent guidance.
```

---

## Refresh stale config

```text
/ai-scaffolding

Our agent config is out of date — the commands, folder layout and stack have
all moved since it was written. Re-detect the project as it is today, show me
a diff of what's wrong in each existing file, and ask per file whether to
keep, merge or replace.
```

---

## MCP servers included

```text
/ai-scaffolding

Set up agent config including MCP server configuration for: <e.g. GitHub,
Postgres, Playwright, Sentry>. Use placeholder env references for every
credential — never a real token, even a fake-looking one. Target agents:
<Claude Code, Cursor>.
```

---

## Audit before generating

```text
/ai-scaffolding

Don't write anything yet. Inspect this repo and tell me: which agent configs
already exist, which are stale or wrong, which agents I'm missing config for,
and what you would generate for each. I'll pick from that list.
```

---

## Offline / no network

```text
/ai-scaffolding

I'm offline, so the reference repo clone will fail. Use the embedded
locations table instead, tell me explicitly that you're on the fallback path,
and generate config for <TARGET AGENTS>.
```
