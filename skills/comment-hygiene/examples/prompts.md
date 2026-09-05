# Copy-paste prompts — comment-hygiene

Copy one, replace the `<PLACEHOLDER>` parts, send. The skill also applies on its
own whenever the agent writes or edits comments, so you rarely need a command —
these are for explicit cleanup passes.

---

## Review comments in a file

```text
/comment-hygiene review the comments in <FILE>. Flag stacked single-line
comments, comments that just restate the code, and any method missing a doc
comment or missing @param / return. Show me the fixes before applying.
```

---

## Add doc comments to every method

```text
Add a doc comment to every method in <FILE>. Keep each description to five lines
or fewer, document every parameter, and describe what it returns. Use the idiom
for <LANGUAGE> (e.g. JSDoc, Javadoc, C# XML doc, Python docstring, godoc).
```

---

## Collapse stacked single-line comments

```text
In <FILE>, the comments are split across multiple // lines. Collapse each into a
single one-line comment where it fits, or convert to a proper block/doc comment
if it genuinely needs more than one line.
```

---

## Fix comments that leak into the DOM

```text
Go through <TEMPLATE FILE> and replace any <!-- --> comments with <ENGINE>'s
own comment syntax so they don't ship to the DOM. If a note only makes sense to
developers, move it to the component code instead.
```

---

## Stylesheet comments

```text
In <SCSS/LESS FILE>, switch /* */ notes to // so they aren't compiled into the
output CSS, unless a comment is meant to appear in the shipped stylesheet.
```

---

## One-off: write this method with proper docs

```text
Write <METHOD DESCRIPTION> in <LANGUAGE>. Give it a doc comment (≤5 lines) that
documents every parameter and the return value, and keep any inline notes to a
single line each.
```
