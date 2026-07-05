---
name: microfrontends
description: Analyze and reason about microfrontend architectures. Use when the user types /microfrontends or mentions microfrontend(s), shell, host, remote, module federation, or native federation. Detects federation type, host/remote topology, vertical vs horizontal split, per-app technology, communication patterns, and route ownership — asking clarifying questions instead of guessing.
license: MIT
---

# Microfrontends Architecture Analysis

You are analyzing a codebase to understand and evaluate its microfrontend architecture. Work deterministically: every conclusion must be explainable from code evidence you actually found. Never invent config files or architecture facts. When evidence is unclear, ask the user — do not guess.

## Terminology

- **Host** = **shell**: the container application that composes the system. A microfrontend setup has **one host** and multiple remotes. If you find more than one host-like app, treat it as an anomaly and confirm with the user before proceeding.
- **Remote** = **microfrontend (MFE)**: an independently built and deployed feature application consumed by the host.

## Step 1 — Confirm microfrontend context

Inspect the project for federation evidence:

- `federation.config.js` (or `.ts` / `.mjs`)
  - content mentions `native-federation` or `@angular-architects/native-federation` or `@softarc/native-federation-node` → **Native Federation**
- `webpack.config.js` / `module-federation.config.*`
  - content mentions `ModuleFederationPlugin` or `module-federation` or `@angular-architects/module-federation` → **Webpack Module Federation**
- `vite.config.*` with `@originjs/vite-plugin-federation` or `@module-federation/vite` → Module Federation via Vite
- `rspack.config.*` with Module Federation plugin → Module Federation via Rspack
- `federation.manifest.json` → Native Federation manifest (top-level keys are remote names)
- `initFederation('<url or path to manifest.json>')` in the bootstrap file → Native Federation host with a **runtime-fetched manifest**: the remote list comes from an endpoint at startup (often cached on `window`), not from static config. In that case the config files alone will not show all remotes — check the manifest endpoint or ask the user for the deployed manifest content.

If none of these exist, ask:

> "Is this a microfrontend architecture?"

If the user says no, stop and say so. If yes, treat the integration as **custom** and continue.

## Step 2 — Determine architecture topology

Detection rules on federation configs:

- declares `remotes: { ... }`, or fetches a remotes manifest at runtime → **HOST**
- declares `exposes: { ... }` → **REMOTE**
- declares both → bidirectional (host that also exposes) — uncommon, confirm intent with the user

Expect exactly one host. Multiple remotes are normal; multiple hosts are not — if detected, ask whether the system intentionally runs several shells (e.g. one per product line) or whether one of them is legacy/experimental.

If neither key exists but federation tooling is present, ask the user whether this app is the host or a remote. Do not guess.

## Step 3 — Architecture clarification flow

**If HOST detected:**
- ask how many remote apps exist in the whole system
- request absolute local paths for each remote so they can be analyzed too
- if remotes are discovered via a runtime manifest, ask for the manifest content or endpoint

**If REMOTE detected:**
- ask for the host/shell path
- ask whether other remotes exist in the system (and their paths)

**If MONOREPO** (multiple apps with federation configs under one repo):
- treat it as the full system graph: identify the host, the remotes, and the relationships between them
- no path questions needed — everything is local

Note that remotes often support **two run modes**: standalone (own dev server, routes mounted at `/`) and hosted (mounted under a route prefix inside the shell). Indicators: a runtime flag such as `window.isHosted`, route definitions registered twice (with and without a prefix), or a guard that prepends the prefix when hosted. Analyze the hosted mode as the system architecture; mention standalone capability as a strength.

Always confirm your topology conclusion with the user before producing the final report, e.g.:

> "I detected 1 host (shell) and 3 remotes (shop, cart, profile). Correct?"

## Step 4 — Classify vertical vs horizontal split (IMPORTANT)

**Vertical split** — a remote is loaded per route; each route prefix maps to exactly one remote:

```text
/checkout → checkout remote
/profile  → profile remote
```

NOTE: the mapping is one remote per route prefix, **not** one route prefix per remote — a single remote may own several prefixes:

```text
/cart      → checkout remote
/checkout  → checkout remote
```

Evidence: remote imports inside routing config (`loadChildren`, `loadRemoteModule`, `lazy: () => import('remote/...')`), custom URL matchers (`startsWith`-style) binding path prefixes to a remote, or wrapper-component routes carrying the remote name in route `data`.

**Horizontal split** — a single route renders components from MULTIPLE remotes; composition happens inside the route:

```text
/dashboard → header remote + charts remote + notifications remote
```

Evidence: a component (not a route file) imports from several remotes, or multiple remotes referenced within one route entry.

You MUST explicitly classify the system as **vertical**, **horizontal**, or **mixed**. If route evidence is missing or ambiguous, ask the user which model applies instead of guessing.

## Step 5 — Technology detection per app

For each app determine:

- **Framework**: React / Angular / Vue / Svelte / Solid / other — from `package.json` dependencies, falling back to import statements when there is no per-app `package.json` (common in Nx-style monorepos)
- **Build system**: Webpack / Vite / Rspack / esbuild / Angular CLI / Nx
- **Federation approach**: Module Federation / Native Federation / none / custom
- **Shared dependency strategy**: `shared` / `shareAll` config, singleton flags, `requiredVersion` policy

Then report:

- compatibility risks (e.g. Webpack MF and Native Federation runtimes do not interoperate without an adapter)
- version mismatch warnings — different majors of the same framework across apps break shared singletons at runtime; web-component isolation removes that constraint (see Step 6)
- integration suggestions

## Step 6 — Web Component architecture detection

Check whether remotes are wrapped as Web Components. Indicators:

- `customElements.define(...)` — often in the remote's exposed bootstrap file
- `document.createElement('<element-name>')` — hosts that mount remotes as custom elements create them this way inside a wrapper component, then `appendChild` into the view
- `createCustomElement(...)` from `@angular/elements` (Angular), or equivalent framework-to-custom-element adapters
- shadow DOM usage (`attachShadow`)
- a remote exposing a single generic entry (e.g. `./web-components` → `bootstrap.ts`) instead of exposing framework modules/components directly
- a host-side wrapper component that loads the remote, creates its element, assigns props as element properties, and subscribes to element events via `addEventListener`

If yes:
- assume framework (and framework-version) isolation is **intentional** — mixed frameworks and mixed versions are acceptable in this design
- recommend DOM-based communication only: attributes/properties in, CustomEvents out

## Step 7 — Communication analysis

Detect and classify how host and remotes talk to each other:

- **Preferred**: native browser events — `new CustomEvent(...)` / `dispatchEvent`. A common robust variant is a thin **event-bus service pair** (one on the host side, one on the remote side) built on CustomEvents dispatched against `document.body` or `window`, with named channels (e.g. `host→remote` and `remote→host` event types) and a typed payload envelope like `{ type, action, ...data }`. This is still the native-events model — classify it as preferred.
- **Router synchronization events**: hosts and remotes with separate router instances often sync URLs by dispatching navigation CustomEvents both ways. Map these as part of the communication model.
- shared global stores: Redux, Zustand, NgRx, Pinia, Vuex, MobX, Jotai, Recoil
- event bus libraries: mitt, eventemitter2/3, nanoevents, postal
- `postMessage`
- window globals (`window.__something`, runtime flags, cached manifests)

Always recommend **native browser events as the primary integration mechanism**. Shared stores couple teams on state shape and library versions; flag them as a risk when they cross app boundaries. Window globals used as one-time bootstrap context (hosted flag, manifest cache) are a lesser concern than globals used for ongoing state — distinguish the two.

## Step 8 — Shared enabling library detection

Mature setups often centralize the microfrontend plumbing in an internal shared library. Indicators:

- a package whose name matches the `*/microfrontends` pattern, where `*` is usually the company or organization scope — e.g. `@company/microfrontends`. Check `package.json` dependencies and import statements for it first
- an internal package with separate `host`, `remote`, and `shared` entry points
- bootstrap helpers used by every app (e.g. `bootstrapComponent(...)` / `bootstrapModule(...)` wrappers)
- a remote-wrapper component, remote-loader/preloader service, or route-prefix guard imported from that package
- shared event/notification/translation bridge services and typed event contracts

If found, analyze that library first — it defines the system's real contracts (event payload types, route prefix registration, error fallbacks, version/runtime caching). Report it as a strength: one place owns the integration rules instead of each app reinventing them.

## Step 9 — Route ownership mapping

- Vertical split: map **every route prefix** to its owning remote, grouping prefixes per remote — remember a remote can own several prefixes (`/cart` and `/checkout` → checkout remote).
- Horizontal split: map which components from which remotes appear on each route.
- Cite the file where each mapping was found (route config, URL matcher, manifest).
- Flag remotes that are declared in config or manifest but never referenced in routes or components (dead config or dynamically resolved — verify with the user).

## Step 10 — Output format

Always return exactly these sections:

1. **Architecture type** — host / remote / monorepo / mixed
2. **Federation type** — webpack / native / custom / none
3. **Split classification** — vertical / horizontal / mixed, with the evidence
4. **App technology map** — framework, version, build system, federation role per app
5. **Route/component ownership map** — grouped per remote
6. **Communication model** — what is used today, what is recommended
7. **Risks & issues**
8. **Suggested improvements**

If anything remains uncertain, list the open questions instead of filling gaps with guesses.

## Engineering principles

- Prefer deterministic reasoning over guessing; every conclusion cites a file.
- Ask before assuming architecture structure.
- Keep interactions minimal but precise — batch related questions.
- Do not hallucinate missing config files.

## Microfrontend knowledge base

Apply these principles when writing risks and suggestions:

- **Independent stacks.** The value of microfrontends is that each team ships on its own release cycle with its own framework and versions. Anything that forces lockstep upgrades across apps (shared singletons with strict version pins, a common store, a shared runtime) erodes that value — call it out.
- **Hard boundaries between apps.** Apps should not reach into each other's runtime: no shared mutable state, no cross-app service injection, no globals carrying live data. Each remote must be able to build, test, and deploy alone.
- **Namespace everything that crosses the boundary.** Event names, CSS classes, storage keys, cookies, and custom-element tag names need an app- or team-specific prefix so ownership is obvious and collisions are impossible.
- **Standard platform APIs beat bespoke contracts.** DOM events, element properties, and URLs are stable, debuggable, and framework-neutral. A custom bridge or shared library API is acceptable only as a thin typed layer over those primitives — not as a replacement for them.
- **Plan for a remote failing to load.** Every federated module needs an explicit failure path: an error route, a fallback UI, or a degraded page. A remote outage must never blank the whole shell.
- **The shell stays generic.** Routing, layout, auth session, cross-cutting UI (nav, notifications) — yes. Feature/domain logic — no. Domain code in the shell recreates the monolith with extra steps.
- **The URL is the strongest contract.** Route prefixes are the cleanest ownership boundary between shell and remotes. Prefer encoding shared context (selected entity, tenant, view state) in the URL over pushing it through events or storage.
- **Directional communication.** Into a remote: attributes/properties at mount time, then targeted events for updates. Out of a remote: CustomEvents the shell subscribes to. Keep payloads small, serializable, and versionable.
- **Support standalone mode for remotes.** Remotes that can also run outside the shell (routes mounted at `/`, hosted mode toggled by a runtime flag, prefix applied by a guard) are faster to develop and test — recommend this capability where it is missing.
