# Skill: comment-hygiene

Keeps the comments an agent writes consistent and useful across every language. It applies automatically whenever the agent adds, edits, or reviews a comment — no command needed — and it can also be invoked as `/comment-hygiene` for a focused cleanup pass over a file or selection.

The rules it enforces:

- **One-line comments stay one line.** No stacks of `//` or `#` faking a paragraph.
- **Prefer single-line notes** over `/** */` blocks for inline "why" comments.
- **New methods and classes get a doc comment.** When the agent writes a new method or class it documents it in the right form — JSDoc, Javadoc, C# XML doc, Python docstring, godoc, rustdoc, YARD, PHPDoc, or GDScript `##` — a ≤5-line description covering every parameter and the return for methods, and the purpose for classes/types. It never backfills docs on existing code you didn't ask it to touch.
- **Every unit test is marked Arrange / Act / Assert.** New unit tests get the mandatory `// Arrange`, `// Act`, `// Assert` phase comments (using the language's comment token, e.g. `# Arrange` in Python).
- **Comments say what code can't** — intent, constraints, gotchas — never a restatement of the next line.
- **Nothing leaks into the DOM** — avoid HTML `<!-- -->`; use each templating engine's stripped comment syntax, and prefer `//` in SCSS/LESS so notes never reach the compiled CSS.

It only enforces on comments the agent writes or directly touches — it won't mass-reformat unrelated existing comments.

## Install

```bash
npx skills@latest add mkolew/ai --skill comment-hygiene
```

## Invoke

Usually nothing to do — the skill applies whenever the agent writes or edits comments. To trigger an explicit review/cleanup:

```text
/comment-hygiene                      installed as a skill file
/comment-hygiene:comment-hygiene      installed as a Claude Code plugin
```

Example:

```text
Clean up the comments in src/auth/session.ts — the block comments should be
single-line where they can be, and every method needs a proper doc comment.
```

## Before / after

```ts
// this function
// takes a token
// and returns the user
function resolveUser(token) {
  /* … */
}
```

becomes:

```ts
/**
 * Resolve the active user from a session token.
 * @param token - Raw bearer token from the request.
 * @returns The user, or null when the token is invalid.
 */
function resolveUser(token) {
  /* … */
}
```

## Coverage

JS/TS, Java, C#, Python, Go, Rust, Ruby, PHP, Shell/.env/YAML/TOML, CSS/SCSS/LESS, SQL, GDScript, plus HTML and templating engines (JSX, Angular, Vue, Handlebars, Blade, Razor, ERB, Twig). Full per-language detail — which doc tags, which gotchas, which comment form renders to the DOM — lives in [references/languages.md](references/languages.md).

**Ready-made prompts:** [examples/prompts.md](examples/prompts.md).
