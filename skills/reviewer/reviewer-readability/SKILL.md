---
name: reviewer-readability
description: "Review how readable code is, including its comments: names, structure, duplication, dead code, and whether every comment is true, needed and well-shaped. Use alongside any reviewer-* technology checklist on every hand-written file, or when the user types /reviewer-readability or asks to review readability, naming, clarity or comments. Judges against the project's own conventions, not personal taste, and reports only issues with a concrete cost to the next reader. Part of the reviewer bundle."
license: MIT
---

# Readability reviewer

Scope: every hand-written file under review, read together with its technology checklist. The question for each finding: what will the next person who reads or changes this code get wrong, or waste time on?

## Before reviewing

- Learn the house style from neighbouring files: naming, comment density, doc-comment form, error-handling and logging patterns. The project's conventions are the bar, not your preferences.
- Read the code a comment describes before judging the comment.

## Checklist

**Names**

- A name says what the thing is or does, in the project's domain terms. One term per concept across the codebase: not `word`, `term` and `entry` for the same thing.
- A name still tells the truth after the change: `get_x()` that now also writes, `is_valid` that now also loads, `tmp` that lives for the whole script.
- Booleans read as yes/no questions (`is_`, `has_`, `can_`). No abbreviations the codebase doesn't already use.

**Structure**

- A function does one job at one level of detail. Distinct phases in a long function, or nesting deeper than about three levels, cost the reader: early returns or one extracted step fix most of it.
- Logic that must change together lives in one place. Flag copied blocks across files that have already drifted, or would drift on the next change.
- Gameplay, config and business numbers are named constants or live in the project's data or tuning file. A bare `86400`, `0.8` or `25` needs a name or a one-line why.
- No dead code: unused functions, parameters, imports and variables, unreachable branches, commented-out code.
- No clever one-liners the reader must decode. Plain code that is a few lines longer wins.

**Comments**

- **True.** Every claim in a comment (a name, a default, a count, a path, who calls what, what the code does) matches the code as it is now. A false comment is the most expensive readability defect: report it first.
- **Needed.** A comment states what the code cannot: intent, a constraint, a platform quirk, a workaround and why it exists. A comment that restates the next line or the signature (types, defaults, the name reworded) is noise.
- **Present where it matters.** A non-obvious workaround, magic value, ordering dependency or platform-specific branch without a one-line why. A new public function, class or script without the doc comment the project gives its siblings, in the project's form: `##` (GDScript), docstring (Python), JSDoc (JS), `///` XML doc (C#), a header usage comment (shell scripts).
- **Well-shaped.** A one-line comment stays one line; no stack of `//` or `#` lines faking a paragraph. Doc comments sit directly on what they document, never floating between members.
- **Current.** No history or noise: "Phase 2", "old version", "ported from", "now uses", "no longer", dates, ticket or file links the reader doesn't need. `TODO`/`FIXME` state what is missing and why it is deferred.
- **Not shipped.** HTML `<!-- -->` comments reach every visitor. Use the template engine's comment, or move the note into code.

**Consistency**

- New code matches its surroundings: the same error-handling style, logging, file layout and member order as its siblings. Siblings are documented the same way.
- Tests read as specifications: the name says the behaviour, the setup, action and check are visible, and a failure message says what was expected and what came instead.

## Severity

| Severity | Readability issue                                                                                                                                                      |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| medium   | a false comment, misleading name or doc that would lead the next change astray                                                                                         |
| low      | dead code, duplication with real drift risk, a missing why on a non-obvious workaround or magic value, a missing doc comment where the project documents every sibling |

Readability findings are never high or critical on their own. When a misleading comment already caused a bug, report the bug with its own severity and mention the comment in the fix.

## Not findings

- Preferences without a cost: brace style, naming taste that matches the project, line length a formatter handles.
- Renaming or documenting code the change did not touch, unless the change made it wrong.
- Extracting helpers or adding abstractions "for later".

## Report

Use the `reviewer` format: `[severity] path:line — problem`, then `failure:` (the concrete cost: what a reader would believe or do wrong, or what they must dig through) and `fix:` (the smallest change, such as the corrected comment text or the better name). Most severe first. Say `No findings` with what you checked when there are none.
