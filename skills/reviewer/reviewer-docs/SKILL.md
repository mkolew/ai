---
name: reviewer-docs
description: 'Review documentation: Markdown (README, specs, guides, attribution files) and licence texts. Use when reviewing changes to .md files or licence and attribution files, or when the user types /reviewer-docs. Catches commands, paths, flags, script names and versions that no longer match the repo, docs that miss what the change added or removed, broken links and anchors, commands that fail when pasted, missing or wrong third-party attribution, invalid tables, and leaked secrets or private URLs. Part of the reviewer bundle.'
license: MIT
---

# Docs reviewer

Scope: `*.md`, `LICENSE*`, attribution and font licence texts. HTML pages go to reviewer-web.

## Before reviewing

- List every concrete claim the changed docs make: commands, script names, flags, paths, env vars, versions, URLs, counts.
- Look at the code change the docs belong to, so you know what should have been documented.

## Checklist

**Truth (the most common defect)**

- Every command, script, flag, path and env var exists now and does what the doc says. Grep for it, run `--help`, `ls` the path. Renamed scripts and flags are the usual miss.
- Versions, counts and defaults match the code and config.
- Behaviour described as current is current. No history ("we used to", "now uses", "Phase 2") outside a changelog.

**Completeness**

- A new script, command, env var, setup step or user-visible behaviour in the change is documented where users look. Removed things are removed from the docs.
- Setup steps work on a fresh clone in the order given.

**Commands**

- Copy-pasteable: one command per fenced block where the reader runs them, no `$` prompts, no output mixed into the block, and the working directory stated or obvious.
- Fenced blocks have a language tag (`bash`, `json`, `text`).

**Links**

- Relative links and `#anchors` resolve. External links point at the intended page.
- No `localhost`, private hostnames or links that need a login, unless they are clearly local-only.

**Licences and attribution**

- Third-party content (data, fonts, art, music, code) is credited where the licence requires it: licence name, link, author, and a note on changes for CC BY and CC BY-SA.
- Font licences (OFL) ship with the fonts. The `LICENSE` file matches the licence declared in the package metadata.
- Attribution required in the shipped product is actually bundled into the build, not only kept in the repo.

**Form**

- Tables have the same number of columns on every row. Headings go in order without skipped levels.
- Answer-first sections, short sentences, one term per concept throughout the document.

**Safety**

- No secrets, tokens, internal hostnames or personal data.

## Readability

Apply [reviewer-readability](../reviewer-readability/SKILL.md) to the same files (names, structure, dead code, and whether comments are true, needed and well-shaped), plus:

- Docs readability is covered by the checklist above (truth, answer-first, one term per concept). Code samples inside the docs follow the readability rules of their language.

## Not findings

- Wording preferences when the text is correct and clear.
- Line wrapping and other formatting that Markdown renders the same way.

## Report

Use the `reviewer` format: `[severity] path:line — problem`, then `failure:` (the concrete input, state or platform → wrong result) and `fix:` (the smallest change). Most severe first. Prove each finding before reporting it, and say `No findings` with what you checked when there are none.
