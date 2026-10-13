---
name: reviewer-web
description: 'Review static web pages and browser code: HTML, CSS, JavaScript that runs in the page, SVG, web manifests and robots.txt (design atlases, privacy and terms pages, landing pages, PWA shells). Use when reviewing changes to these files, or when the user types /reviewer-web. Catches XSS through innerHTML, contrast and accessibility failures, hard-coded colours that bypass design tokens, mobile overflow, unguarded storage, broken links, SVGs that do not scale, and legal pages that contradict what the app does. Part of the reviewer bundle.'
license: MIT
---

# Web reviewer

Scope: `*.html`, `*.css`, browser `*.js`/`*.mjs`, `*.svg`, `*.webmanifest`, `robots.txt`. Worker code goes to reviewer-cloudflare, Unity WebGL templates to reviewer-unity.

## Before reviewing

- Open changed pages in a browser when one is available. Check them at 375px wide and at desktop width, in light and dark mode if the page supports both.
- Find the design tokens (CSS custom properties on `:root`) and the shared stylesheet.

## Checklist

**Security**

- Data inserted with `innerHTML`, `outerHTML`, `insertAdjacentHTML` or `document.write` is an XSS hole unless it is a constant. Use `textContent`, or build elements.
- `target="_blank"` links to other origins have `rel="noopener"`.
- No secrets, internal URLs or `<!-- -->` notes meant for developers. HTML comments ship to every visitor.
- Third-party scripts are pinned to an exact version, with `integrity` where the CDN supports it.

**Accessibility**

- `<html lang>`, `<meta charset>`, `<meta name="viewport">` and a `<title>` are present.
- Text contrast is at least 4.5:1 (3:1 for large text and UI outlines). Compute it for each token pair the change introduces.
- Actions are `<button>`s and navigation is `<a href>`. Inputs have labels; images have `alt` (`alt=""` when decorative). Headings go in order.
- Focus is visible. Everything works by keyboard. Touch targets are at least 44px. Animations respect `prefers-reduced-motion`.

**CSS**

- Colours, radii and spacing come from the tokens. A hard-coded hex that duplicates a token drifts on the next palette change.
- Dark mode, when supported, redefines the tokens, so no component hard-codes light colours.
- No horizontal scroll at 320–375px. Use `dvh`/`svh` rather than `100vh` on mobile.
- No selectors left behind for removed markup.

**Browser JavaScript**

- `localStorage`/`sessionStorage` access is wrapped in `try`/`catch`. It throws in private modes and with blocked storage.
- `fetch` handles network failure and non-2xx status.
- No accidental globals. Listeners on elements that are re-rendered get removed or delegated.
- Feature detection before using newer APIs.

**SVG**

- `viewBox` is set, so the image scales. No fixed `width`/`height` when it is resized by CSS.
- No embedded scripts, external references or leftover editor metadata.
- `id`s are unique when SVGs are inlined together. Text is converted to paths when the font isn't guaranteed.

**Content**

- Privacy and terms pages match what the app actually does: data collected, where it is stored, third parties, contact address, effective date. Check the claims against the code (analytics, leaderboards, device ids, crash reporting).
- Relative links and anchors resolve after files move.

**PWA**

- The manifest has `name`, `start_url`, `display`, and icons at 192 and 512 px (plus maskable if used).
- The service worker update flow does not trap users on an old build.

## Not findings

- Vendor prefixes and formatting a build tool or formatter handles.
- Contrast of purely decorative elements.

## Report

Use the `reviewer` format: `[severity] path:line — problem`, then `failure:` (the concrete input, state or platform → wrong result) and `fix:` (the smallest change). Most severe first. Prove each finding before reporting it, and say `No findings` with what you checked when there are none.
