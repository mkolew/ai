---
name: reviewer-shell
description: 'Review shell scripts (.sh, .bash, files with a sh or bash shebang). Use when reviewing changes to scripts, or when the user types /reviewer-shell. Catches unquoted expansions, set -e and pipefail traps, wrong root-path detection, macOS bash 3.2 and BSD-versus-GNU portability breaks, dangerous rm on empty variables, prompts that hang CI, leaked secrets, missing cleanup traps, and help text out of sync with the commands. Part of the reviewer bundle.'
license: MIT
---

# Shell reviewer

Scope: `*.sh`, `*.bash`, and executables with a `sh` or `bash` shebang. Find out where each script runs: macOS (bash 3.2, BSD tools), Linux CI (bash 5, GNU tools), or both.

## Before reviewing

- Run `shellcheck -x <file>` if it is installed, and report the warnings that matter.
- Run `bash -n <file>` for syntax. Run `<script> --help` or the no-argument path when that is safe.

## Checklist

**Failure handling**

- Bash scripts start with `set -euo pipefail`, or handle errors explicitly.
- `set -e` does not fire inside `if`, `while`, `&&`/`||` lists, or functions called from them. A failing command there continues silently.
- `local x=$(cmd)` and `export x=$(cmd)` hide `cmd`'s exit status. Declare first, then assign.
- With `pipefail`, `cmd | grep -q x` or `cmd | head` can fail with 141 (SIGPIPE) once the reader exits early.
- Errors go to stderr, and the script exits non-zero.

**Quoting and expansion**

- Every `"$var"`, `"$(cmd)"` and `"${arr[@]}"` is quoted. Paths with spaces (`~/Library/Application Support`) break unquoted code.
- `rm -rf "$dir/"` with an empty `dir` deletes from `/`. Use `"${dir:?}"`.
- Code tested in an interactive zsh can behave differently in bash, because zsh does not word-split unquoted variables.

**Paths**

- Find the repo root from the script's location: `"$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"`. `$0` and `pwd` are wrong when the script is sourced or run from another directory.
- A sourced library guards its entry point: `[ "${BASH_SOURCE[0]}" = "$0" ] && main "$@"`. `exit` inside a sourced function ends the caller's shell.
- Temp files come from `mktemp`, never a fixed `/tmp` name. Cleanup and restoration of modified files go in `trap … EXIT`.

**Portability**

- macOS ships bash 3.2: no `declare -A`, `mapfile`/`readarray`, `${var,,}` or `${var^^}`. `"${arr[@]}"` on an empty array fails under `set -u` before bash 4.4.
- BSD and GNU differ: `sed -i ''` vs `sed -i`, `date -v` vs `date -d`, `stat -f` vs `stat -c`, no `readlink -f` or `grep -P` on macOS. A script that runs on both must use the common subset or branch on `uname`.
- `echo -e` and `echo -n` are not portable. Use `printf`.

**Interaction and side effects**

- Prompts (`read`) are guarded by `[ -t 0 ]`, so CI and pipes never hang. Every menu choice has a non-interactive command.
- Downloads use `curl -fL` (`-f` makes HTTP errors fail). Large downloads ask first and say the size.
- Background jobs (`&`, servers) are waited on or killed on exit.
- Destructive steps (`rm`, `git reset`, store uploads, deploys) are explicit commands, never a side effect of a default path.

**Secrets**

- Tokens never go to `echo`, `set -x` output or command-line arguments (visible in `ps`). Pass them through the environment.
- Keystores and `.env` files are read from ignored paths only.

**Consistency**

- The usage text and header comment list exactly the commands and flags the `case` branches handle.
- Shared helpers come from the project's `lib/` files instead of being copied into each script.

## Not findings

- Style that shellcheck does not flag and the project does consistently.
- `sh`-incompatible syntax in a script with a bash shebang.

## Report

Use the `reviewer` format: `[severity] path:line — problem`, then `failure:` (the concrete input, state or platform → wrong result) and `fix:` (the smallest change). Most severe first. Prove each finding before reporting it, and say `No findings` with what you checked when there are none.
