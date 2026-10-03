---
name: comment-hygiene
description: 'Enforce consistent comment style every time you write or edit code. ALWAYS apply when adding, editing, or reviewing comments in any language — single-line vs block form, doc comments (jsdoc, javadoc, C# XML doc, docstring, godoc, rustdoc, YARD, phpdoc, GDScript ##), and template/HTML comments that must not leak into the DOM. Also use when the user types /comment-hygiene or asks to review, clean up, or standardize comments. Keeps one-line comments to one line, prefers the comment syntax each language actually wants, gives every method/class you write a doc comment with the right shape (params, return, purpose), marks every unit test with mandatory // Arrange, // Act, // Assert comments, and keeps comments true to the code, free of signature repeats, reference noise and project history — never backfilling docs on existing code unless asked.'
license: MIT
---

# Comment Hygiene

You are writing comments a human will read later. Comments cost attention, so every one must earn it. Apply these rules to any comment you write or directly edit. Do **not** mass-reformat comments you aren't otherwise touching — only enforce on lines you add or change.

## The rules

1. **One line means one line.** A single-line comment (`//`, `#`, `--`, …) stays on one line. Never stack two or three of them to fake a paragraph — if you need more than one line, either tighten the wording or use the language's block/doc form.
2. **Prefer single-line, non-doc comments for inline notes.** Reach for `/** */`-style blocks only for method documentation or when a note genuinely spans multiple lines. An inline "why" almost always fits on one `//`.
3. **Document what you write; leave the rest alone.** When you **write a new** method/function or class/type, give it a doc comment: methods get a **≤5-line** description plus **every parameter** and the **return**; classes/types get a short doc comment describing their purpose and responsibility (class-level docs matter — they orient the reader before the members do). Prefer more lines only when truly unavoidable. Do **not** backfill or reformat doc comments on **existing** methods or classes you didn't write — only do that when the user explicitly asks (e.g. "add docs", or by invoking `/comment-hygiene`).
4. **Say what the code can't.** A comment states intent, a constraint, a gotcha, or a "why" — never a restatement of the next line. If the comment just narrates the code, delete it.
5. **Never leak comments into output.** Avoid HTML `<!-- -->` (it ships to the DOM). In templating languages use the engine's own comment syntax, which is stripped before rendering. In compiled stylesheets (SCSS/LESS) prefer `//`, which never reaches the CSS.
6. **Every unit test carries Arrange/Act/Assert.** When you write a unit test, mark its three phases with mandatory comments — `// Arrange`, `// Act`, `// Assert` — one before each block, in that order. Use the language's single-line comment token instead of `//` where that's what it uses (e.g. `# Arrange` in Python/Ruby). Keep each on its own line; if a phase is genuinely empty, still label it or fold it into the neighboring block rather than dropping the sequence.
7. **Doc blocks have a clean shape.** A doc comment is either one line (`/** Text. */`, `/// <summary>Text.</summary>`) or a full block whose opener and closer sit on their own lines. Never start the text on the opener line and wrap it onto ` * more */` or `… </summary>` lines.
8. **A doc comment sits on what it documents.** No floating `/** */` blocks after the imports, between members, or inside an object literal. A note about a whole file goes at the very top; a note about a group of fields or statements is one `//` line above the group.
9. **Comments must be true.** Every claim — a name, a default, a count, a header, who calls what — matches the current code. When you change code, update or delete the comments that describe it. A wrong comment is worse than none.
10. **Don't repeat the signature.** Types, optional/nullable, default values, enum members and the member's name reworded are already visible. Don't copy a string the code already carries either (a tool's `description`, an error message).
11. **No reference noise, no history.** Link a file, ADR, ticket or spec section only when the reader must open it to understand this code. Describe the code as it is now: no "Phase 2", "old runner", "ported from", "now uses", "no longer", plan quotes or dates of when something was found.
12. **Same kind, same form.** Siblings are documented the same way: every member of an interface, every field of a schema. A single field gets a one-line doc comment (it shows on hover); a group of related fields gets one `//` line above the group.

## Before you write any comment

- Is it one line? Keep it one line.
- Am I writing a new method or class? Give it a doc comment — methods need params + return, classes need their purpose.
- Is the method/class pre-existing (not written by me)? Leave its docs alone unless the user asked.
- Am I writing a unit test? Mark its phases with `// Arrange`, `// Act`, `// Assert`.
- Am I in a template or HTML? Use a comment form that won't render.
- Does it restate the code or the signature? Then don't write it.
- Is every claim in it true for the code as it is now? Check before you write it.
- Does it mention how the code came to be (phases, old versions, where it was ported from)? Cut that part.

## Common languages at a glance

| Language                   | Inline  | Doc comment                                      | Notes                                 |
| -------------------------- | ------- | ------------------------------------------------ | ------------------------------------- |
| JS/TS                      | `//`    | `/** */` JSDoc, `@param` / `@returns`            | Prefer `//` for non-doc notes         |
| Java                       | `//`    | `/** */` Javadoc, `@param` / `@return`           |                                       |
| C#                         | `//`    | `///` XML doc: `<summary>` `<param>` `<returns>` | Doc form is `///`, not `/** */`       |
| Python                     | `#`     | `"""docstring"""` with Args/Returns              | No `/** */`                           |
| Go                         | `//`    | `//` line above decl, starts with func name      | godoc has no block form               |
| Rust                       | `//`    | `///` rustdoc, `# Arguments` / `# Returns`       | `//!` for module docs                 |
| Ruby                       | `#`     | `#` YARD `@param` / `@return` above method       |                                       |
| PHP                        | `//`    | `/** */` PHPDoc, `@param` / `@return`            |                                       |
| Shell / .env / YAML / TOML | `#`     | —                                                | Single-line only, no block form       |
| CSS                        | `/* */` | —                                                | No single-line comment exists         |
| SCSS / LESS                | `//`    | —                                                | Prefer `//` (never compiled into CSS) |
| SQL                        | `--`    | `/* */` for headers                              |                                       |
| GDScript                   | `#`     | `##` doc comment above method                    | No block comments exist               |

For HTML, JSX, Angular, Vue, Handlebars, Blade, Razor, ERB, and the full per-language detail (which doc tags, which gotchas), read [references/languages.md](references/languages.md).

## When invoked as `/comment-hygiene`

Do a review/cleanup pass over the files the user points at, still scoped to what they asked you to touch. Check both form and content:

- **Form:** stacked single-line comments, badly shaped doc blocks, floating doc blocks, `<!-- -->` in templates, missing doc comments, missing params or return, unlabelled unit-test phases.
- **Content:** read the code each comment describes. Flag claims that are no longer true, comments that restate the code or signature, reference noise, history, and siblings documented in different forms. Having a doc comment is not enough: an existing doc can be wrong or noisy.

Report the comments that were wrong first, since they mislead readers; style fixes come after. Propose the fixes and apply them where the user agrees. For a large codebase, split the pass by area and give every part the same rules and one reference file as the example of the target style.
