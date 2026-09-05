---
name: comment-hygiene
description: "Enforce consistent comment style every time you write or edit code. ALWAYS apply when adding, editing, or reviewing comments in any language — single-line vs block form, doc comments (jsdoc, javadoc, C# XML doc, docstring, godoc, rustdoc, YARD, phpdoc, GDScript ##), and template/HTML comments that must not leak into the DOM. Also use when the user types /comment-hygiene or asks to review, clean up, or standardize comments. Keeps one-line comments to one line, prefers the comment syntax each language actually wants, and gives every method/class you write a doc comment with the right shape (params, return, purpose) — never backfilling docs on existing code unless asked."
license: MIT
---

# Comment Hygiene

You are writing comments a human will read later. Comments cost attention, so every one must earn it. Apply these rules to any comment you write or directly edit. Do **not** mass-reformat comments you aren't otherwise touching — only enforce on lines you add or change.

## The five rules

1. **One line means one line.** A single-line comment (`//`, `#`, `--`, …) stays on one line. Never stack two or three of them to fake a paragraph — if you need more than one line, either tighten the wording or use the language's block/doc form.
2. **Prefer single-line, non-doc comments for inline notes.** Reach for `/** */`-style blocks only for method documentation or when a note genuinely spans multiple lines. An inline "why" almost always fits on one `//`.
3. **Document what you write; leave the rest alone.** When you **write a new** method/function or class/type, give it a doc comment: methods get a **≤5-line** description plus **every parameter** and the **return**; classes/types get a short doc comment describing their purpose and responsibility (class-level docs matter — they orient the reader before the members do). Prefer more lines only when truly unavoidable. Do **not** backfill or reformat doc comments on **existing** methods or classes you didn't write — only do that when the user explicitly asks (e.g. "add docs", or by invoking `/comment-hygiene`).
4. **Say what the code can't.** A comment states intent, a constraint, a gotcha, or a "why" — never a restatement of the next line. If the comment just narrates the code, delete it.
5. **Never leak comments into output.** Avoid HTML `<!-- -->` (it ships to the DOM). In templating languages use the engine's own comment syntax, which is stripped before rendering. In compiled stylesheets (SCSS/LESS) prefer `//`, which never reaches the CSS.

## Before you write any comment

- Is it one line? Keep it one line.
- Am I writing a new method or class? Give it a doc comment — methods need params + return, classes need their purpose.
- Is the method/class pre-existing (not written by me)? Leave its docs alone unless the user asked.
- Am I in a template or HTML? Use a comment form that won't render.
- Does it restate the code? Then don't write it.

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

Do a review/cleanup pass over the file or selection the user points at: flag stacked single-line comments, comments that restate code, `<!-- -->` in templates, methods missing doc comments, and doc comments missing params or return. Propose the fixes and apply them where the user agrees — still scoped to what they asked you to touch.
