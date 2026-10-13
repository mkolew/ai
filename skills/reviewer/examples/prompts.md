# Copy-paste prompts — reviewer

Copy one, replace the `<PLACEHOLDER>` parts, send.

---

## Review what I changed

```text
/reviewer review my uncommitted changes.
```

---

## Review a branch before opening a PR

```text
/reviewer review this branch against <BASE BRANCH>. Run the project's tests first
and include any failures as findings.
```

---

## Review a pull request

```text
/reviewer review PR <NUMBER>. Only report findings you can make concrete, ranked
by severity.
```

---

## One technology only

```text
/reviewer-<TECH> review <FILE OR FOLDER>.
```

`<TECH>` is one of `godot`, `unity`, `shell`, `python`, `cloudflare`, `web`, `data`, `tooling`, `docs`.

---

## Audit a whole folder, not just a diff

```text
/reviewer review every file in <FOLDER> in full, not only recent changes. Group
the work by technology, then give me one ranked list.
```

---

## Review, then fix

```text
/reviewer review my changes. Then fix every critical and high finding, re-run the
checks, and show me what changed.
```
