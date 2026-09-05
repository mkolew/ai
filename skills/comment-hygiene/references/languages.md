# Per-language comment reference

The rules from `SKILL.md`, made concrete per technology. Single-line comments stay
one line; inline notes prefer the single-line form over doc blocks. Doc comments
(shown per language below) are added **only when the user asks** — methods document
every parameter and the return, classes/types describe their purpose, in ≤5 lines.

## JavaScript / TypeScript

- Inline: `//` (one line).
- Multiline / doc: `/** */`.
- Method doc: JSDoc — `@param {Type} name` per parameter, `@returns {Type}`.

```ts
/**
 * Resolve the active user from a session token.
 * @param token - Raw bearer token from the request.
 * @returns The user, or null when the token is invalid.
 */
function resolveUser(token: string): User | null {
  /* … */
}
```

## Java

- Inline: `//`.
- Doc: `/** */` Javadoc — `@param name`, `@return`, `@throws` when relevant.

```java
/**
 * Transfers funds between two accounts.
 * @param from source account id
 * @param to destination account id
 * @param cents amount in minor units
 * @return the resulting transaction id
 */
long transfer(long from, long to, long cents) { /* … */ }
```

## C#

- Inline: `//`.
- Doc: `///` XML documentation comments — **not** `/** */`.
- Tags: `<summary>`, `<param name="…">`, `<returns>`, `<exception>` as needed.

```csharp
/// <summary>Resolves the active user from a session token.</summary>
/// <param name="token">Raw bearer token from the request.</param>
/// <returns>The user, or null when the token is invalid.</returns>
public User? ResolveUser(string token) { /* … */ }
```

## Python

- Inline: `#`.
- Doc: triple-quoted `"""docstring"""` as the first statement of the method. No `/** */`.
- Document parameters and the return in a consistent style (Google/NumPy/reST); keep the summary ≤5 lines.

```python
def resolve_user(token: str) -> User | None:
    """Resolve the active user from a session token.

    Args:
        token: Raw bearer token from the request.

    Returns:
        The user, or None when the token is invalid.
    """
```

## Go

- Inline: `//` (Go has `/* */` but idiom is `//`).
- Doc: a `//` comment directly above the declaration, starting with the identifier's name (godoc convention). There is no block doc form; describe parameters and return in prose.

```go
// ResolveUser returns the active user for the given bearer token,
// or nil when the token is invalid.
func ResolveUser(token string) *User { /* … */ }
```

## Rust

- Inline: `//`.
- Doc: `///` (outer) rustdoc above the item; `//!` for module-level docs.
- Use `# Arguments` and `# Returns` sections (and `# Errors` / `# Panics` when relevant).

```rust
/// Resolve the active user from a session token.
///
/// # Arguments
/// * `token` - Raw bearer token from the request.
///
/// # Returns
/// The user, or `None` when the token is invalid.
fn resolve_user(token: &str) -> Option<User> { /* … */ }
```

## Ruby

- Inline: `#`.
- Doc: `#` comment block directly above the method using YARD tags `@param` / `@return`.

```ruby
# Resolve the active user from a session token.
# @param token [String] raw bearer token from the request
# @return [User, nil] the user, or nil when the token is invalid
def resolve_user(token)
end
```

## PHP

- Inline: `//` (or `#`, but standardize on `//`).
- Doc: `/** */` PHPDoc — `@param type $name`, `@return type`, `@throws`.

```php
/**
 * Resolve the active user from a session token.
 * @param string $token Raw bearer token from the request.
 * @return User|null The user, or null when the token is invalid.
 */
function resolveUser(string $token): ?User {}
```

## Shell / .env / YAML / TOML

- Comment: `#` only, always single-line. These formats have no block comment — never fake one by stacking `#` lines for a paragraph; keep it to one line per note.

```bash
# Fail fast so a half-applied migration never ships.
set -euo pipefail
```

## CSS / SCSS / LESS

- CSS: only `/* */` exists — there is no single-line comment. Keep it short.
- SCSS / LESS: `//` (silent — stripped by the compiler) and `/* */` (emitted to CSS). Prefer `//` so notes don't ship to production CSS.

```scss
// Silent: internal note, never compiled into the output.
/* Emitted: visible in the built stylesheet. */
```

## SQL

- Inline: `--` (one line).
- Multiline / header: `/* */`.

```sql
-- Only active accounts; soft-deleted rows are excluded downstream.
select id, email from accounts where deleted_at is null;
```

## GDScript (Godot)

- Inline: `#` (one line). GDScript has no block comment.
- Doc: `##` documentation comment directly above the member; every method gets one describing params and return.

```gdscript
## Resolve the active user from a session token.
## Returns null when the token is invalid.
func resolve_user(token: String) -> User:
    pass
```

## HTML

- `<!-- -->` **ships to the DOM** — the browser downloads it and it's visible in "View Source" / devtools. Avoid it. If you must annotate markup, put the note in the code that generates it, or in the template layer where it's stripped (below).

## Templating languages

Use the engine's own comment syntax — these are removed before the HTML is sent, unlike `<!-- -->`.

| Engine                | Comment                                                                    | Renders to DOM?        |
| --------------------- | -------------------------------------------------------------------------- | ---------------------- |
| JSX / TSX             | `{/* … */}`                                                                | No                     |
| Angular templates     | (no stripped comment) — put notes in the component `.ts`, avoid `<!-- -->` | `<!-- -->` can persist |
| Vue templates         | prefer notes in `<script>`; avoid `<!-- -->`                               | `<!-- -->` may persist |
| Handlebars / Mustache | `{{! … }}` or `{{!-- … --}}`                                               | No                     |
| Blade (Laravel)       | `{{-- … --}}`                                                              | No                     |
| Razor (.cshtml)       | `@* … *@`                                                                  | No                     |
| ERB (Rails)           | `<%# … %>`                                                                 | No                     |
| Twig                  | `{# … #}`                                                                  | No                     |

Rule of thumb: if the engine offers a native comment, use it; reserve `<!-- -->` for the rare case where you deliberately want the note in the shipped HTML.
