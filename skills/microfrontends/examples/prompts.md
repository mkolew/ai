# Copy-paste prompts — microfrontends

Copy one, swap the `<PLACEHOLDERS>`, send. Everything here triggers the skill
automatically; the leading `/microfrontends` is optional but makes the intent
explicit. If you installed the skill as a Claude Code plugin, the explicit form
is `/microfrontends:microfrontends`.

---

## Analyze this repo, no context

```text
/microfrontends

Analyze the microfrontend architecture of this repository. Tell me the
federation type, whether this app is the host or a remote, the split model,
and cite the files you based each conclusion on.
```

---

## Host with remotes checked out elsewhere

```text
/microfrontends

This repo is the host (shell). The remotes live at:

- <ABSOLUTE PATH TO REMOTE 1>
- <ABSOLUTE PATH TO REMOTE 2>
- <ABSOLUTE PATH TO REMOTE 3>

Analyze the whole system: which remote owns which route prefixes, how host
and remotes communicate, and any version or federation-type mismatch between
them.
```

---

## Remote, analyzing upward to the host

```text
/microfrontends

This repo is a remote. The host lives at <ABSOLUTE PATH TO HOST>, and the
other remotes in the system are at:

- <ABSOLUTE PATH TO OTHER REMOTE>

Check that what I expose matches what the host actually loads, that my route
prefixes don't collide with the other remotes, and that my shared-dependency
config is compatible with the host's.
```

---

## Monorepo containing the whole system

```text
/microfrontends

This monorepo contains the host and all remotes under <apps/ OR packages/ OR
YOUR FOLDER>. Map the full system graph: identify the host, every remote,
the route prefixes each remote owns, and the communication paths between
them. Flag any remote declared in config or manifest but never actually
loaded.
```

---

## Runtime-fetched remotes manifest

Use when the host discovers remotes at startup rather than from static config —
`initFederation('<manifest url>')` in the bootstrap file.

```text
/microfrontends

The host fetches its remotes manifest at runtime from
<MANIFEST URL OR ENDPOINT PATH>, so the federation config alone doesn't list
them. The deployed manifest currently looks like this:

<PASTE MANIFEST JSON, OR SAY WHERE IT'S SERVED FROM>

Analyze the architecture using that as the remote list.
```

---

## Just the communication model

```text
/microfrontends

Skip the full report. I only want the communication model: every mechanism
used between host and remotes (CustomEvents, event-bus services, shared
stores, postMessage, window globals, router-sync events), where each one is
defined, and which ones couple the apps together. Then tell me what to
replace the coupled ones with.
```

---

## Just the split classification

```text
/microfrontends

Only answer this: is this system a vertical split, a horizontal split, or
mixed? List every route prefix with its owning remote (grouped per remote —
one remote may own several prefixes) and cite the file each mapping came
from. If the evidence is ambiguous, ask me rather than guessing.
```

---

## Pre-flight before adding a new remote

```text
/microfrontends

I'm about to add a new remote called <REMOTE NAME> that will own the
<ROUTE PREFIX(ES)> route prefix(es), built with <FRAMEWORK + VERSION>.

Analyze the current architecture and tell me: what the new remote must match
(federation type, shared deps, exposure shape, bootstrap contract), whether
its framework version conflicts with anything shared today, and whether the
route prefixes collide with an existing remote.
```

---

## Migration assessment

```text
/microfrontends

Analyze the current setup, then assess migrating from <CURRENT: e.g. Webpack
Module Federation> to <TARGET: e.g. Native Federation>. I want: what changes
per app, what breaks during a partial migration where host and remotes are
on different federation runtimes, and a safe order to do it in.
```

---

## Risk review only

```text
/microfrontends

Give me only sections 7 and 8 of the report — risks and suggested
improvements — ranked by blast radius. For each risk, cite the file that
proves it and say what breaks at runtime if it goes unfixed.
```

---

## Web Component boundary check

```text
/microfrontends

The remotes here are wrapped as Web Components. Verify that the isolation is
actually intact: check that nothing crosses the boundary except element
properties in and CustomEvents out, that no shared store or window global
carries live state between apps, and that custom-element tag names and event
names are prefixed per remote.
```
