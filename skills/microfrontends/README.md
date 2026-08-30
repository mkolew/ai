# Skill: microfrontends

Analyzes a codebase's microfrontend architecture. Triggers on `/microfrontends` or mentions of _microfrontend(s), shell, host, remote, module federation, native federation_.

Terminology the skill works with: **host = shell** (the container app; a system has exactly one) and **remote = microfrontend** (independently built and deployed feature apps; a system has many).

## Install

```bash
npx skills@latest add mkolew/ai --skill microfrontends
```

## Invoke

```text
/microfrontends                      installed as a skill file
/microfrontends:microfrontends       installed as a Claude Code plugin
```

Or just describe the task — the skill triggers on mentions of _microfrontend,
shell, host, remote, module federation, native federation_:

```text
map the microfrontend architecture in this repo
which remote owns /checkout?
does our host and this remote agree on shared dependency versions?
```

**Ready-made prompts:** [examples/prompts.md](examples/prompts.md) — copy-paste
prompts for the common cases (host with external remotes, monorepo system
graph, runtime manifest, communication-model-only, migration assessment,
pre-flight before adding a remote).

## Workflow

The skill walks the agent through a deterministic, evidence-based workflow:

1. **Confirm microfrontend context** — looks for `federation.config.js` (Native Federation), `webpack.config.js` with `ModuleFederationPlugin` (Webpack Module Federation), Vite/Rspack federation plugins, `federation.manifest.json`, or a runtime-fetched remotes manifest (`initFederation('<manifest url>')`). If nothing is found, it asks instead of assuming.
2. **Determine topology** — `remotes:`/runtime manifest → host; `exposes:` → remote; a monorepo is analyzed as the full system graph. A system is expected to have exactly one host and multiple remotes — multiple hosts get flagged and confirmed.
3. **Clarification flow** — for a host it asks how many remotes exist and where they live on disk; for a remote it asks for the host path; assumptions are always confirmed with the user. Standalone-vs-hosted dual-mode remotes are recognized.
4. **Vertical vs horizontal split** — classifies whether each route prefix is owned by one remote (vertical — a single remote may own several prefixes, e.g. `/cart` and `/checkout` both belonging to the checkout remote), routes compose components from multiple remotes (horizontal), or both (mixed).
5. **Technology map** — framework, build system, federation approach, and shared-dependency strategy per app, with version-mismatch and compatibility warnings.
6. **Web Component detection** — `customElements.define`, `document.createElement` of remote elements in a host wrapper, `createCustomElement` adapters, shadow DOM, or a single generic `./web-components` exposure mean framework isolation is intentional; the skill then recommends DOM-based communication only.
7. **Communication analysis** — classifies CustomEvents (including event-bus service pairs built on them and router-sync events), shared stores (Redux, NgRx, Zustand, …), event buses, `postMessage`, and window globals. Native browser events are always the primary recommendation.
8. **Shared enabling library detection** — looks for a package named on the `*/microfrontends` pattern (`*` is usually the company scope, e.g. `@company/microfrontends`) and for internal packages with host/remote/shared entry points that own the integration contracts; when found, that library is analyzed first.
9. **Route ownership mapping** — every route prefix mapped to its owning remote, grouped per remote, with the evidence file cited; declared-but-unreferenced remotes are flagged.
10. **Fixed 8-section report** — architecture type, federation type, split classification, technology map, ownership map, communication model, risks, and suggested improvements.

Core rule throughout: **ask instead of guessing** — every conclusion must cite a file.

## Example session

```text
You:   /microfrontends

Agent: Scanning for federation evidence...
       Found webpack.config.js with ModuleFederationPlugin declaring
       remotes: shop, cart — this app looks like a HOST (shell).

       How many remote apps exist in the whole system, and what are
       their absolute local paths?

You:   2 remotes: /Users/me/dev/shop and /Users/me/dev/cart

Agent: Analyzed both remotes. I detected 1 host and 2 remotes, with
       routes /shop → shop and /cart → cart (vertical split). Correct?

You:   yes

Agent: ## 1. Architecture type
       Host (shell) + 2 external remotes
       ## 2. Federation type
       Webpack Module Federation
       ## 3. Split classification
       Vertical — each route is owned by exactly one remote
       (evidence: src/routes.tsx)
       ## 4. App technology map
       - shell: React 18, Webpack 5, MF host
       - shop:  React 18, Webpack 5, MF remote (exposes ./ShopPage)
       - cart:  React 17, Webpack 5, MF remote (exposes ./CartPage)
       ## 5. Route ownership
       /shop → shop, /cart → cart
       ## 6. Communication model
       CustomEvents on window (src/events.ts) — keep as primary mechanism
       ## 7. Risks & issues
       - React 17 vs 18 major mismatch on shared singletons (cart)
       ## 8. Suggested improvements
       - Align React majors before sharing react as a singleton
       - Add error/loading fallbacks for both remotes
```
