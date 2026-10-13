---
name: reviewer-cloudflare
description: 'Review Cloudflare Workers projects: wrangler.toml or wrangler.json, the Worker entry and the modules it imports, D1 schemas and queries (.sql), and Worker tests. Use when reviewing changes to any of these, or when the user types /reviewer-cloudflare. Catches secrets in config, SQL built from strings, unvalidated request input, abuse-prone public write endpoints, wrong headers for compressed and wasm assets, the 25 MiB asset limit, caching mistakes, and per-request state in globals. Part of the reviewer bundle.'
license: MIT
---

# Cloudflare reviewer

Scope: `wrangler.toml` / `wrangler.json*`, the Worker entry (`main`) and every module it imports, D1 `*.sql`, and Worker tests. Browser code goes to reviewer-web, the deploy workflow to reviewer-tooling.

## Before reviewing

- Read the wrangler config: `main`, `compatibility_date`, compatibility flags, routes and custom domains, assets, bindings (D1, KV, R2), and per-environment overrides.
- Run the Worker tests (`node --test`, `vitest`, a Miniflare harness). Run `wrangler deploy --dry-run` only if it needs no credentials.

## Checklist

**Config**

- No secrets in `[vars]` or committed files. Secrets come from `wrangler secret put` or `.dev.vars`, and `.dev.vars` is gitignored.
- Binding names match what the code reads (`env.DB`). Each environment has its own `database_id`.
- `compatibility_date` is set. Node APIs need the `nodejs_compat` flag.
- `workers_dev = false` when only the custom domain should serve the site. Routes and custom domains point at the right zone.

**Static assets**

- A single asset is limited to 25 MiB, which large `.wasm` files exceed. Store them compressed and serve them from the Worker.
- Returning a pre-compressed body needs `Content-Encoding` plus `encodeBody: "manual"`. Without it the client gets a double-encoded body.
- `.wasm` must be served as `application/wasm`, or streaming compilation fails.
- Cache rules: hashed files can be cached for long; `index.html`, the service worker and manifests must revalidate. Otherwise users keep running an old build.
- COOP/COEP headers only when the page really needs cross-origin isolation (threads). They break cross-origin resources that lack CORP.

**Request handling**

- Check the method and route. Unknown routes return 404 and wrong methods 405, not 500.
- `await request.json()` throws on bad input. Return 400.
- Validate every field at the boundary: type, range, length and allowed characters. For names shown to other players, also filter profanity.
- Public write endpoints (scores, leaderboards) need abuse limits: plausible-value checks, a server-issued run or nonce token, and rate limits. Anyone can call the endpoint without the game.
- CORS: no `Access-Control-Allow-Origin: *` together with credentials. Answer the `OPTIONS` preflight when it is needed.
- Errors return a short JSON message. Never return stack traces, SQL or secrets.

**D1 / SQL**

- Every query uses `prepare(…).bind(…)`. SQL built by string interpolation is an injection hole.
- Statements that must succeed together go in `db.batch([...])`.
- Reads have a `LIMIT`. Columns used in `WHERE` and `ORDER BY` on large tables are indexed.
- Schema changes are additive migrations that existing data survives. `schema.sql` matches what is applied.
- Read rows from `.results`, and handle an empty result.

**Runtime**

- Module-level variables persist between requests in the same isolate. Never keep per-request or per-user data there.
- Work after the response goes in `ctx.waitUntil()`, or it may be cut off.
- Use Web Crypto (`crypto.randomUUID`, `crypto.subtle`), not `Math.random`, for ids and tokens.

**Tests**

- New endpoints and branches have tests, including rejected input.

## Readability

Apply [reviewer-readability](../reviewer-readability/SKILL.md) to the same files (names, structure, dead code, and whether comments are true, needed and well-shaped), plus:

- The request router reads as a table: method and path to handler, one line each.
- JSDoc on exported handlers and helpers the project documents. Status codes and header names come from named constants when they repeat.
- Each non-obvious header or encoding choice (`encodeBody: "manual"`, a cache rule) has a one-line why.

## Not findings

- Missing rate limits on read-only, cacheable endpoints with bounded output.
- A Global API Key or token scope set in CI secrets. That belongs to reviewer-tooling, and only when the workflow shows it.

## Report

Use the `reviewer` format: `[severity] path:line — problem`, then `failure:` (the concrete input, state or platform → wrong result) and `fix:` (the smallest change). Most severe first. Prove each finding before reporting it, and say `No findings` with what you checked when there are none.
