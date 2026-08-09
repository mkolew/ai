# Bash patterns for `.scripts/run.sh`

Tested implementations. Copy and adapt; the failure modes noted are ones that have
actually occurred, not hypotheticals.

Target `bash` 3.2 compatibility unless you have confirmed otherwise — macOS ships 3.2 at
`/bin/bash`. Avoid associative arrays, `mapfile`, and `${var,,}`.

## Header

```bash
#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
LOG_DIR="$SCRIPT_DIR/logs"
mkdir -p "$LOG_DIR"
```

## Output helpers

```bash
if [[ -t 1 ]]; then
  BOLD=$'\033[1m'; RED=$'\033[31m'; GREEN=$'\033[32m'
  YELLOW=$'\033[33m'; CYAN=$'\033[36m'; DIM=$'\033[2m'; RESET=$'\033[0m'
else
  BOLD=''; RED=''; GREEN=''; YELLOW=''; CYAN=''; DIM=''; RESET=''
fi

section() {
  printf '\n%s==================================%s\n' "$CYAN" "$RESET"
  printf '%s%s%s\n' "$BOLD" "$1" "$RESET"
  printf '%s==================================%s\n' "$CYAN" "$RESET"
}
info() { printf '%s\n' "$1"; }
note() { printf '%s  %s%s\n' "$DIM" "$1" "$RESET"; }
ok()   { printf '%s* %s%s\n' "$GREEN" "$1" "$RESET"; }
warn() { printf '%s! %s%s\n' "$YELLOW" "$1" "$RESET"; }

# fail "headline" "detail line" "another detail"
fail() {
  local msg=$1; shift || true
  printf '\n%sERROR: %s%s\n' "$RED" "$msg" "$RESET" >&2
  local line; for line in "$@"; do printf '  %s\n' "$line" >&2; done
  printf '\n' >&2
  exit 1
}
```

## Prerequisites

`command -v` inside `set -e` is safe only when guarded — an unguarded non-zero exit kills
the script silently.

```bash
require_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "Required tool not found: $1" "${@:2}"
  ok "$1 ($(command -v "$1"))"
}
```

Same trap with `lsof`, `grep` and `pgrep`: any of them can exit non-zero legitimately.
Append `|| true` in command substitutions.

## Port preflight

Dev servers fall back to the next free port and break every configured URL. Refuse
instead, and name the culprit so it can be killed.

```bash
require_port_free() { # <port> <what needs it>
  local port=$1 what=$2 line cmd pid
  line=$(lsof -nP -iTCP:"$port" -sTCP:LISTEN 2>/dev/null | awk 'NR==2 {print $1" "$2}')
  if [[ -z $line ]]; then ok "Port $port is free ($what)."; return 0; fi
  cmd=${line%% *}; pid=${line##* }
  fail "Port $port is already in use by $cmd (pid $pid)." \
       "$what needs this port." \
       "Dev servers silently fall back to another port, which breaks the configured URLs." \
       "" \
       "Free it with:  kill $pid"
}
```

## Readiness probe

An open port proves nothing. Reverse proxies and orchestrator supervisors bind the port
immediately and return 404 until the real process is serving.

```bash
http_status() { curl -sk -o /dev/null -w '%{http_code}' --max-time 5 "$1" 2>/dev/null || printf '000'; }

status_ready() {
  case $1 in
    2??|3??|401|403) return 0 ;;   # serving, possibly behind auth
    *) return 1 ;;                 # 000 nothing listening, 404 proxy-only, 5xx erroring
  esac
}

await_service() { # <name> <url> <timeout> <label> [hint...]
  local name=$1 url=$2 timeout=$3 label=$4; shift 4
  local waited=0 status=000 erroring=0
  printf '%s' "Waiting for $label "
  while (( waited < timeout )); do
    status=$(http_status "$url")
    if status_ready "$status"; then
      printf '\n'; ok "$label started successfully (HTTP $status)."; return 0
    fi
    if ! proc_alive "$name"; then
      printf '\n'; dump_log "$name"
      fail "$label exited before it became reachable." "$@" "See $LOG_DIR/$name.log"
    fi
    case $status in 5??) erroring=$((erroring + 2)) ;; *) erroring=0 ;; esac
    if (( erroring >= 40 )); then   # a dev server 500ing on every request will not heal
      printf '\n'; dump_log "$name"
      fail "$label is running but returns HTTP $status for every request." "$@"
    fi
    sleep 2; waited=$((waited + 2)); printf '.'
  done
  printf '\n'; dump_log "$name"
  local detail="last HTTP status was $status"
  [[ $status == 000 ]] && detail="nothing accepted a connection on that port"
  fail "$label did not become ready on $url within ${timeout}s ($detail)." "$@"
}
```

**Choosing the probe URL.** Pick a path that answers whenever the app is serving,
independent of content. A CMS root can legitimately 404 on an empty database, so probe a
login or health path instead and check the root separately as a *content* signal.

## Background processes

Parallel indexed arrays, not associative — bash 3.2 compatibility.

```bash
PROC_NAMES=()
PROC_PIDS=()

start_bg() { # <name> <workdir> <cmd...>
  local name=$1 workdir=$2; shift 2
  local log="$LOG_DIR/$name.log"
  : > "$log"
  note "command: $*"
  note "log:     $log"
  ( cd "$workdir" && exec "$@" ) >>"$log" 2>&1 &
  PROC_NAMES+=("$name"); PROC_PIDS+=("$!")
}

proc_pid() {
  local i
  for i in "${!PROC_NAMES[@]}"; do
    if [[ ${PROC_NAMES[$i]} == "$1" ]]; then printf '%s' "${PROC_PIDS[$i]}"; return 0; fi
  done
  return 1
}

proc_alive() { local pid; pid=$(proc_pid "$1") || return 1; kill -0 "$pid" 2>/dev/null; }

dump_log() {
  local name=$1 lines=${2:-40}
  printf '\n%s--- last %s lines of %s ---%s\n' "$YELLOW" "$lines" "$LOG_DIR/$name.log" "$RESET" >&2
  tail -n "$lines" "$LOG_DIR/$name.log" >&2 || true
  printf '%s--- end of log ---%s\n\n' "$YELLOW" "$RESET" >&2
}
```

## Cleanup

`set -m` gives each background job its own process group, so the whole child tree dies
rather than just the wrapper. Enable it *after* the interactive menus — job control prints
notices that interleave with prompts.

```bash
cleanup() {
  local i pid
  printf '\n'
  for (( i = ${#PROC_PIDS[@]} - 1; i >= 0; i-- )); do
    pid=${PROC_PIDS[$i]}
    if kill -0 "$pid" 2>/dev/null; then
      info "Stopping ${PROC_NAMES[$i]} (pid $pid)..."
      kill -TERM "-$pid" 2>/dev/null || kill -TERM "$pid" 2>/dev/null || true
    fi
  done
  wait 2>/dev/null || true
}
trap cleanup EXIT INT TERM
set -m
```

End the script with `wait` so it holds the foreground until Ctrl+C.

## Menus

Sets `CHOICE_INDEX`; the caller maps it back to its own array.

```bash
CHOICE_INDEX=1
choose_index() {
  local prompt=$1; shift
  local count=$#
  if (( count == 1 )); then CHOICE_INDEX=1; return 0; fi
  if [[ $ASSUME_YES == true ]]; then CHOICE_INDEX=1; info "$prompt -> $1 (default)"; return 0; fi
  printf '\n%s%s%s\n\n' "$BOLD" "$prompt" "$RESET"
  local i=1 opt
  for opt in "$@"; do printf '  %d) %s\n' "$i" "$opt"; i=$((i + 1)); done
  local reply
  while :; do
    printf '\nChoice [1]: '
    read -r reply || reply=""
    reply=${reply:-1}
    if [[ $reply =~ ^[0-9]+$ ]] && (( reply >= 1 && reply <= count )); then
      CHOICE_INDEX=$reply; return 0
    fi
    warn "Enter a number between 1 and $count."
  done
}
```

Populate options from repo config, never a literal list:

```bash
OPTIONS=()
while IFS= read -r line; do
  [[ -n $line ]] && OPTIONS+=("$line")
done < <(node -e 'const {variants}=require(process.argv[1]);
  for (const key of Object.keys(variants)) console.log(key);' "$CONFIG_FILE")
```

## Reading config

`appsettings.json` and `tsconfig.json` are frequently **JSONC** — comments and trailing
commas are valid to their own parsers but crash `JSON.parse`. Either strip comments or use
`sed`:

```bash
CONNECTION=$(sed -n 's/.*"MainDatabase"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$APPSETTINGS" | head -1)
```

Read `.env` values without sourcing the file — sourcing executes whatever is in it:

```bash
env_value() { # <file> <key>
  [[ -f $1 ]] || return 1
  sed -n "s/^[[:space:]]*$2[[:space:]]*=[[:space:]]*//p" "$1" | head -n1 \
    | sed -e 's/^"//' -e "s/^'//" -e 's/"[[:space:]]*$//' -e "s/'[[:space:]]*$//"
}
```

## Env validation

Name the file, the reason, and the fix. Distinguish hard requirements (the process will
not boot) from soft ones (a feature fails later).

```bash
if [[ ! -f $ENV_FILE ]]; then
  fail "Missing required environment file: ${ENV_FILE#"$ROOT_DIR"/}" \
       "<what reads it, and what breaks without it>" \
       "" \
       "Fix:" \
       "  cp ${TEMPLATE#"$ROOT_DIR"/} ${ENV_FILE#"$ROOT_DIR"/}" \
       "" \
       "Then fill in <the keys the template ships blank>."
fi
```

Where a validation library already fails loudly and precisely (zod, t3-env), do not
duplicate its schema — let it fail, and point at the file. Duplicated lists rot.

## Upstream credential preflight

A locally-run backing service will not accept a token issued by its hosted counterpart.
Check once, before starting dependents, instead of letting it surface as 500s:

```bash
TOKEN_STATUS=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 \
  -X POST "$LOCAL_API/graphql" -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' --data '{"query":"{__typename}"}' 2>/dev/null || printf '000')
case $TOKEN_STATUS in
  2??)     ok "Local service accepted the token." ;;
  401|403) fail "The local service rejected the token (HTTP $TOKEN_STATUS)." \
                "Tokens belong to a single instance; this one came from the hosted service." \
                "Either use the remote service, or mint a local token and update the env file." ;;
  *)       warn "Could not verify the token (HTTP $TOKEN_STATUS) - continuing." ;;
esac
```

## Final summary

```bash
section "Project is ready"
printf '\n'
for entry in "${URLS[@]}"; do
  printf '  %s%-40s%s - %s\n' "$BOLD" "${entry%%|*}" "$RESET" "${entry#*|}"
done
printf '\n%sPress Ctrl+C to stop everything.%s\n\n' "$BOLD" "$RESET"
wait
```

Build `URLS` as `"url|description"` entries, adding conditionally so the list reflects
what actually started.
