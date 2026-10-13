---
name: reviewer-data
description: 'Review data and content files the app reads: JSON (tuning and balance values, word lists, content, fixtures, asset manifests), CSV, and plain-text lists such as blocklists. Use when reviewing changes to these files, or when the user types /reviewer-data. Catches invalid syntax, schema and type drift, silent duplicate keys, renamed ids that orphan saved progress, keys that no longer match the code, hand edits to generated files, out-of-range values, offensive or mistranslated content, and missing attribution. Part of the reviewer bundle.'
license: MIT
---

# Data reviewer

Scope: JSON the app or its tools read (`tuning.json`, `data/*.json`, fixtures, asset manifests), `*.csv`, and line-based lists. `package.json` and other tooling JSON go to reviewer-tooling.

## Before reviewing

- Find who reads each changed file (grep for its name) and who writes it (a generator script or hand edits).
- Check that it parses: `python3 -m json.tool <file> >/dev/null` or `jq empty <file>`. For CSV, use `python3 -c` with the `csv` module and check that the column count is the same on every row.

## Checklist

**Syntax and encoding**

- JSON has no trailing commas or comments, unless the reader accepts JSONC.
- CSV quotes fields that contain commas, quotes or newlines, and keeps one header row.
- UTF-8 without a BOM unless the reader expects one. LF line endings.

**Schema and types**

- Every record has the fields its reader requires, with consistent types. `"10"` is not `10`.
- Some loaders return every JSON number as a float (Godot's `JSON`). Integer comparisons and dictionary keys then need normalizing, so flag code-side assumptions.
- Enum-like values come from the set the code handles.
- JSON objects silently keep the last of two duplicate keys. Find duplicates with a parser that rejects them (`json.load(f, object_pairs_hook=…)`).
- No duplicate ids or rows.

**Compatibility**

- Ids that saved progress, user data or other files reference are never renamed or reused. Removed items stay tolerated by the loader.
- A key renamed in the data but not in the code (or the reverse) silently falls back to the default. Grep both sides.
- Version fields that must increase (`versionCode`, schema versions) do increase.

**Values**

- Numbers are in a sane range, with a clear unit. Check a changed balance value against how the code uses it: a divisor of 0, a negative cost, a cap below its floor.
- URLs and paths in config resolve.

**Generated files**

- Files a pipeline generates are regenerated, not hand-edited. Hand edits vanish on the next run. Corrections belong in the pipeline's override file.
- The diff size fits the change, and the metadata (build date, source versions) moved with it.

**Content**

- User-facing strings: spelling, translations, articles and plurals for language content, and no offensive or blocklisted words.
- Third-party data keeps its attribution and licence terms (CC BY-SA needs credit and share-alike) in the place the project records it.
- No secrets or personal data.

**Reviewability**

- Rows and keys stay in a stable order, so diffs show real changes.
- Very large files: check the size the bundle or repo can take.

## Not findings

- Formatting differences that a stable generator produces.
- Key order in JSON that nothing depends on.

## Report

Use the `reviewer` format: `[severity] path:line — problem`, then `failure:` (the concrete input, state or platform → wrong result) and `fix:` (the smallest change). Most severe first. Prove each finding before reporting it, and say `No findings` with what you checked when there are none.
