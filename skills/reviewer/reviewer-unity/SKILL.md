---
name: reviewer-unity
description: 'Review Unity projects: C# scripts (.cs), WebGL JavaScript plugins (.jslib), WebGL templates, Packages/manifest.json and ProjectSettings. Use when reviewing changes to any of these files, or when the user types /reviewer-unity. Catches destroyed-object null checks, per-frame allocations, lifecycle order bugs, lost serialized data, WebGL threading and interop mistakes, editor code that breaks player builds, and missing .meta files. Part of the reviewer bundle.'
license: MIT
---

# Unity reviewer

Scope: `*.cs`, `*.jslib`, `Assets/WebGLTemplates/**`, `Packages/manifest.json`, `ProjectSettings/**`, and the presence of `.meta` files. Check `ProjectSettings/ProjectVersion.txt` for the editor version.

## Before reviewing

- Find the build entry points (an editor `BuildScript`, CI batchmode commands) and the target platforms.
- Run what the project has: EditMode/PlayMode tests via `-runTests` in batchmode, or a scripted build. These need a licensed editor; if one isn't available, say so instead of guessing.

## Checklist

**Unity objects**

- `?.` and `??` on `UnityEngine.Object` skip Unity's overloaded `== null`. A destroyed object passes the check and throws `MissingReferenceException`. Use `== null` or the implicit bool.
- `GetComponent`, `Find*` and `Camera.main` inside `Update` should be cached in `Awake`.
- `Destroy` takes effect at the end of the frame. Code after it still sees the object.

**Lifecycle**

- `Awake` → `OnEnable` → `Start`. Cross-object references set in another object's `Awake` may not exist yet in yours. Physics and forces go in `FixedUpdate`; input in `Update`; `Time.deltaTime` inside `FixedUpdate` is the fixed step.
- Coroutines stop when their GameObject is disabled. Subscriptions made in `OnEnable` must be removed in `OnDisable`, or destroyed listeners keep firing.
- `async` methods keep running after the object is destroyed. Check for that, or pass a cancellation token.

**Performance (WebGL and mobile)**

- No per-frame allocations: LINQ, string concatenation or interpolation, boxing, `new` lists, closures in `Update`. They cause GC hitches.
- Avoid `SendMessage` and reflection in hot paths.

**Serialization**

- Renaming a serialized field loses its saved value in every scene and prefab. Use `[FormerlySerializedAs("old")]`.
- Prefer `[SerializeField] private` fields to public fields.
- Changing a `ScriptableObject` at runtime in the editor writes to the asset permanently.

**WebGL**

- WebGL is single-threaded: `Task.Run`, `Thread` and blocking waits deadlock or throw. Code must stay on the main thread.
- `[DllImport("__Internal")]` calls need `#if UNITY_WEBGL && !UNITY_EDITOR` guards with an editor fallback.
- `.jslib`: functions go inside `mergeInto(LibraryManager.library, {...})`. Read C# strings with `UTF8ToString` (`Pointer_stringify` is removed). Return strings with `_malloc` plus `stringToUTF8`. Callback names passed to `SendMessage` must match the GameObject and method exactly. Event listeners added there must be removable.
- `PlayerPrefs` on WebGL writes to IndexedDB lazily. Call `PlayerPrefs.Save()` after important writes.
- Template: `%UNITY_*%` tokens intact. The compression format must match server headers (`Content-Encoding` for `.br`/`.gz`, or the decompression fallback on). A service worker must not serve an old build after a deploy.

**Builds**

- Code using `UnityEditor` must live under an `Editor/` folder, or behind `#if UNITY_EDITOR`. Otherwise player builds fail.
- Every new asset and folder has its `.meta` committed. A changed GUID breaks every reference to the asset.
- `Packages/manifest.json` versions are pinned. Version bumps match `packages-lock.json` and the editor version.

**Conventions**

- `PascalCase` types, methods and properties; `_camelCase` private fields, or the project's own convention.
- `///` XML doc comments where the project documents.
- Gameplay numbers in the project's tuning or data file, not hard-coded.

## Readability

Apply [reviewer-readability](../reviewer-readability/SKILL.md) to the same files (names, structure, dead code, and whether comments are true, needed and well-shaped), plus:

- `///` XML doc comments on public types and members the project documents; `[Tooltip]` on serialized fields designers edit.
- `#region` blocks that hide a long class are a smell: the class does too much.
- `Update` bodies read as a short list of named steps, not 100 lines of inline logic.

## Not findings

- Allocation in code that runs once (setup, menus) rather than per frame.
- `public` fields in a project that uses them consistently.

## Report

Use the `reviewer` format: `[severity] path:line — problem`, then `failure:` (the concrete input, state or platform → wrong result) and `fix:` (the smallest change). Most severe first. Prove each finding before reporting it, and say `No findings` with what you checked when there are none.
