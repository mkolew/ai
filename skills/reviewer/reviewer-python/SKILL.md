---
name: reviewer-python
description: 'Review Python code (.py): data pipelines, build and asset tools, small servers and their tests. Use when reviewing changes to Python files, or when the user types /reviewer-python. Catches syntax newer than the Python that actually runs it, undeclared third-party imports, encoding and CSV mistakes, Unicode comparison bugs, non-deterministic output, unsafe subprocess and deserialization, missing network timeouts, and untested logic. Part of the reviewer bundle.'
license: MIT
---

# Python reviewer

Scope: `*.py`. Find the Python that runs the code (CI setup, shebang, `python3 --version` locally, macOS system Python is 3.9) and the dependencies it may use (`requirements*.txt`, `pyproject.toml`, or stdlib only).

## Before reviewing

- Run the project's tests (`python3 -m unittest discover …`, `pytest`) and any linter it configures (`ruff`, `flake8`, `mypy`).
- Run a changed script's `--help` or dry-run mode when it has one.

## Checklist

**Runtime compatibility**

- Syntax and APIs must exist in the lowest Python that runs the code. On 3.9: no `match`, no `X | Y` in runtime annotations without `from __future__ import annotations`, no `zip(strict=)`, no `tomllib`.
- A new third-party import in a stdlib-only project, or one missing from the requirements, breaks on a clean machine.

**Files and text**

- `open()` passes `encoding="utf-8"`. CSV files also pass `newline=""`. Spreadsheet exports may start with a BOM: read them with `utf-8-sig`.
- Use the `csv` module, not `split(",")`. Check the header names `DictReader` expects.
- Compare text after `unicodedata.normalize("NFC", …)`. Use `casefold()` for case-insensitive matching.
- Large inputs (JSONL dumps) are streamed line by line, not loaded whole.
- Paths come from `pathlib` relative to `__file__`, not the current directory.
- Outputs other tools read are written atomically: a temp file, then `os.replace`.

**Determinism**

- Generated files are byte-stable across runs: sort sets and dict keys before writing, and seed randomness. Otherwise every run produces a noisy diff.
- Each rejected or dropped item gets a reason, when the pipeline has an audit file.

**Correctness traps**

- Mutable default arguments (`def f(x=[])`).
- Closures created in a loop capture the variable, not its value.
- `is` used to compare strings or numbers.
- A bare `except:`, or `except Exception: pass`, swallows real errors. Catch the specific exception, and keep or log the message.
- Generators consumed twice.

**Security and safety**

- `subprocess` gets a list of arguments, not `shell=True` with interpolated input. Use `check=True` when failure matters.
- No `eval`, `exec` or `pickle` on untrusted data. Use `yaml.safe_load`.
- Network calls have a timeout. Downloaded data is treated as untrusted (run with `python -I` when reading a downloaded directory).
- Dev servers bind `127.0.0.1` and send the right MIME types (`application/wasm`, `text/javascript`).

**Tests**

- New logic has a test. Tests are hermetic: no network, tiny fixtures, no dependence on the current directory.

**Conventions**

- PEP 8 names; docstrings and type hints where the project uses them; `if __name__ == "__main__":` for scripts that are also imported.

## Readability

Apply [reviewer-readability](../reviewer-readability/SKILL.md) to the same files (names, structure, dead code, and whether comments are true, needed and well-shaped), plus:

- Docstrings are the first statement of public functions, classes and modules, in the form the project uses. Type hints where the project uses them.
- Comprehensions stay one level deep; anything longer becomes a loop or a named helper.
- `# noqa` and `# type: ignore` carry a reason.

## Not findings

- Missing type hints in a project that doesn't use them.
- Formatting a formatter would fix.

## Report

Use the `reviewer` format: `[severity] path:line — problem`, then `failure:` (the concrete input, state or platform → wrong result) and `fix:` (the smallest change). Most severe first. Prove each finding before reporting it, and say `No findings` with what you checked when there are none.
