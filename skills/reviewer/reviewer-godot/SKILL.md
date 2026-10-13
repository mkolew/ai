---
name: reviewer-godot
description: 'Review Godot 4 projects: GDScript (.gd), scenes and resources (.tscn, .tres), project.godot, export_presets.cfg and shaders. Use when reviewing changes to any of these files, or when the user types /reviewer-godot. Catches type-inference and JSON number bugs, node lifecycle mistakes, export-only breakage (missing include filters, res:// writes, unimported class_name globals), web and Android export pitfalls, and container layout traps. Part of the reviewer bundle.'
license: MIT
---

# Godot reviewer

Scope: `*.gd`, `*.tscn`, `*.tres`, `*.gdshader`, `project.godot`, `export_presets.cfg`. Assumes Godot 4.x; check `config/features` in `project.godot` for the exact version.

## Before reviewing

- Read `project.godot`: autoloads, renderer, display and stretch settings, and the input map.
- Find how tests run (headless `--script`, test scenes, CI) and run them. Fresh checkouts need `godot --headless --path <dir> --import` first, or `class_name` globals fail to resolve.

## Checklist

**Typing and values**

- `:=` on a Variant right-hand side (dictionary lookup, JSON, an autoload method with no return type) fails with "Cannot infer the type". Use an explicit type.
- `JSON.parse_string` returns every number as a float. `{"a": 1}` loaded from disk is not equal to `{"a": 1}` built in code, `1.0` keys miss `1` keys, and `"%d"` truncates. Normalize with `int()` where a value is an integer.
- `/` on two ints is integer division (`5 / 2 == 2`).
- Typed arrays (`Array[String]`) reject assignment from untyped arrays at runtime. Use `.assign()`.

**Node lifecycle**

- `queue_free()` keeps the node in the tree until the frame ends. A new child added with the same name is renamed (`Label2`, `@Label@3`), so lookups by name or path break. Call `remove_child()` first, or don't depend on names.
- Any use after `await`, a timer or a tween must check `is_instance_valid()`. The node or its target may have been freed meanwhile.
- `@onready` vars are null in `_init()`. Children get `_ready()` before their parent.
- Signals connected to lambdas that capture a node outlive that node. Disconnect them, or connect with the node as the target.
- `RandomNumberGenerator.new()` is not randomized. Call `randomize()` or set a seed on purpose (tests).

**Files and persistence**

- `res://` is read-only in exports. Write user data to `user://`.
- Writes that must survive a crash: write a `.tmp` file, then `DirAccess.rename_absolute()`. Loading must survive missing or corrupt files with a default, not a crash.
- `FileAccess.open()` returns null on failure. Check it and `FileAccess.get_open_error()`.
- Non-resource files the game reads (`*.json`, `*.txt`, `*.md`, `*.csv`) ship only if `include_filter` in `export_presets.cfg` lists them. They work in the editor and are missing in the export.
- `Image.load_from_file("res://…")` works only in the editor (tools). Game code must `load()` the imported resource.

**UI**

- Containers own their children's position and size. Setting `size` or `position` on a child of a container is overwritten. Use `custom_minimum_size` and size flags.
- A `Label` with autowrap inside an `HBoxContainer` and no width collapses to one letter per line. Give it `SIZE_EXPAND_FILL` or turn autowrap off.
- Decorative Controls drawn over buttons must use `mouse_filter = MOUSE_FILTER_IGNORE`, or they swallow clicks.
- Glyphs missing from the font render as boxes (●, ⌫, arrows). Check the font's coverage, or draw the shape or use an icon.
- Text that must fit (buttons, tiles) at the longest content and smallest supported resolution.

**Performance**

- No `get_node()`, `find_child()`, allocation or string building in `_process`/`_physics_process` when it can be cached. Prefer signals to polling.

**Export targets**

- Web: thread support needs COOP/COEP headers. Audio starts only after a user gesture. `JavaScriptBridge` must sit behind `OS.has_feature("web")`. The generated service worker serves the old `.pck` until it is patched or the version changes.
- Android: `display/window/handheld/orientation` is an int (`1` = portrait). A string is silently ignored. Dev and release builds need distinct package names. `version/code` must increase for every store upload. Keystores and passwords never go in `export_presets.cfg` or the repo; use env vars or `credentials` outside git.
- `export_presets.cfg` must not contain absolute paths from one machine, unless the project accepts that.

**Scenes and project files**

- `.tscn` diffs should contain only the intended change. Flag editor noise (reordered nodes, unrelated `unique_id` churn) that hides real edits.
- `ext_resource` paths and `uid://` references must resolve after moves and renames. Every new script has its `.uid` committed (Godot 4.4+). `.godot/` is never committed.
- Autoload names in `project.godot` must match the names the code uses. Renaming a `class_name` breaks every reference to it, including other scenes.

**Conventions** (official style guide, unless the project differs)

- Tabs; `snake_case` files, functions and variables; `PascalCase` `class_name`; `CONSTANT_CASE` constants.
- Signals in past tense (`answered`, `round_finished`). Handlers named `_on_<source>_<signal>`.
- `##` doc comments on classes and functions the project documents. Static types wherever the project uses them.
- Gameplay numbers in a data or tuning file when the project has one, not hard-coded.

**Tests**

- Headless tests must exit non-zero on failure (`quit(1)`), and new tests are registered in the runner or CI list.

## Not findings

- Missing types in a project that does not use static typing.
- `@warning_ignore` with a reason.
- Editor-generated formatting of `.tscn` files when the content change is intended.

## Report

Use the `reviewer` format: `[severity] path:line — problem`, then `failure:` (the concrete input, state or platform → wrong result) and `fix:` (the smallest change). Most severe first. Prove each finding before reporting it, and say `No findings` with what you checked when there are none.
