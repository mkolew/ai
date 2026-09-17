---
name: gameplay-promo
description: 'Film a game and cut it into a promo video — a short cinematic opener on the main character, then real gameplay, scored to music with the cuts landing on the beat. Use when someone says "/gameplay-promo", "make a promo video for my game", "make a trailer", "record gameplay for the store listing", or needs a video for Google Play, the App Store, itch.io or Steam. Captures real footage from the running game rather than recreating it, so what the video shows is what the player gets.'
license: MIT
---

# Gameplay Promo

You are filming a game that already exists. Everything in the finished video comes out of the
running game — no mockups, no recreated UI, no stock footage. A promo that shows something the
player will not see is worse than no promo, because the first review says so.

## What you are making

Two shots and a soundtrack:

1. **The opener**, up to 10 seconds — the main character alone, doing one thing that ends in motion.
   For a space game: the ship sits still, its engines light, it launches. This is the only part that
   is staged, and it is still rendered by the game itself.
2. **Gameplay**, the rest — a real run. Ask the user to play it themselves unless they say
   otherwise: an autopilot dodges on a timer and it shows, while a person hesitates, cuts it fine,
   and recovers. Those near-misses are the shot.
3. **Music** from a folder the user provides, with the cut between shots landing on a beat.

Target 25–35 seconds. Store listings are not social clips; there is room to show the game.

## Step 0 — what you need before anything

Ask for these four. Do not guess any of them.

|                                          |                                                                        |
| ---------------------------------------- | ---------------------------------------------------------------------- |
| **The main character, and what it does** | "a rocket; it sits still, the engines start slowly, then it launches"  |
| **A music folder**                       | a path. List what you find and say which you picked, and why           |
| **How to run the game**                  | a command per shot — see the contract below                            |
| **Where the video goes**                 | the store, a site, a social post. It changes the length and the aspect |

## Step 0.5 — what the project can already do

**Identify the engine from the repo first** — `project.godot`, `ProjectSettings/ProjectVersion.txt`,
a `*.uproject`, and so on. `references/engine-recipes.md` has the markers and what each engine can
do. Do not ask the user to name their engine when the repo says it, and do not infer it from the
language: C# is Unity or it is not, and the difference decides every command you are about to write.

**If the repo holds more than one engine**, which is common in ports and prototypes, ask two
separate questions: which one to film, and whether the film mode belongs in all of them. One video
is enough; feature parity across engines is a decision only the user can make.

Then find out what that engine can already do, because it decides whether there is a promo to make
at all:

|                                        | If missing                                                         |
| -------------------------------------- | ------------------------------------------------------------------ |
| **Can it write video?**                | Without this there is no promo. See `references/engine-recipes.md` |
| **Can it hide its control chrome?**    | The footage shows key legends and touch pads. Add a film mode      |
| **Can it render the character alone?** | No opener. There is a fallback; it is not as good                  |

All three are changes to **the user's game**, not to this skill.

### The rules for touching their repo

1. **Ask first, per change.** Name the files, say roughly what each costs, and wait. "Make me a
   promo video" is not consent to edit an engine.
2. **Everything defaults to off.** A film mode is a flag that is false unless passed; an opener is a
   scene nothing loads on its own. A player's build must be byte-identical in behaviour, and you
   should verify that rather than assume it — capture a normal run and confirm the HUD is still
   there.
3. **Additive and separable.** New files, or guarded lines in existing ones. Never refactor
   something on the way past. The user should be able to revert the lot in one commit and lose only
   the ability to film.
4. **Never touch what a player experiences.** Not gameplay, balance, art, audio, or the HUD's
   normal appearance. Hiding chrome happens behind the flag, never by deleting it.
5. **If they decline, say what the video loses** and use the fallbacks in
   `references/engine-recipes.md`. A promo with visible key legends is worse, not impossible.

`references/engine-recipes.md` has the concrete how, per engine — and is explicit that only Godot 4
has been verified here.

## The shot contract

A shot is a command that writes a video file and exits. Two placeholders are substituted:

```
{{out}}      the path to write
{{frames}}   how many frames, at the shot's fps
```

If neither appears, `--out <path> --seconds <n>` is appended instead.

A shot marked `"interactive": true` is **played by the user**. The skill explains what is about to
happen, waits for Enter, launches the game, and records until they quit it. Leave the frame count
out of that command — the take ends when the player ends it.

Anything that can write a file this way works. A Godot project films itself with:

```bash
godot --path <project> <scene> --write-movie {{out}} --fixed-fps 60 --quit-after {{frames}}
```

Flags like `--sv-film` in the examples here are **one project's**, not a convention. Every project
names its own; the contract is the command, not the flags inside it.

That is a **fixed-frame-rate render, not a screen recording** — it cannot drop frames under load,
and two runs produce identical footage. Prefer it to any screen capture when the engine offers one.

**Warn the player that it will feel slow.** Every frame is encoded as it is drawn, so the game runs
below real time while recording — measured at 64% on a 1080p Godot project. The written file is
correct-speed regardless, because frames are stamped at a fixed rate rather than by the clock. The
consequence worth stating: the take was performed in slow motion, so it will look a little sharper
than the game actually plays.

## Steps

Each step has a gate. Do not pass one without meeting it.

**1. Plan** — write `promo-output/promo.json` from the answers. Gate: the user has seen the plan and
the shot commands, and agreed to them. See `references/step-1-plan.md`.

**2. Capture** — `node scripts/film.mjs promo-output/promo.json --out-dir promo-output`. Gate: every
clip passes its checks. See `references/step-2-capture.md`.

**3. Edit** — `node scripts/edit.mjs promo-output/promo.json --out-dir promo-output`. Gate: the
finished file has the expected duration and is not black. See `references/step-3-edit.md`.

**4. Deliver** — poster frame, where the file actually goes, and what the store wants. See
`references/step-4-deliver.md`.

`references/engine-recipes.md` covers adding capture, a film mode and an opener to a project that
has none — read it during step 0.5, not step 2.

## The laws

- **Film the game, never a drawing of it.** If a shot cannot be captured, cut the shot.
- **Prefer a person to an autopilot.** Scripted play reads as scripted: evenly spaced dodges, no
  hesitation, no near-misses. Offer the autopilot only as a fallback, and say which one produced
  the footage.
- **Show the game working.** Capture from where the game is interesting, not from `t=0`. Most games
  open at their least dense — use `skip` to start the clip later rather than filming an empty level.
- **No HUD chrome.** On-screen control pads, key legends, pause and fullscreen buttons say "someone
  is playing this on a laptop". Keep score, timer and world name — they say "this is a game".
- **Cut on the beat.** A cut 100ms off reads as a mistake to people who could not tell you why.
- **Never stretch footage to fit the music.** Trim it. Gameplay slowed 8% looks like a bad frame
  rate, and the frame rate is the one thing a game promo must never appear to have a problem with.
- **Check the footage before the edit, and the edit before delivery.** A black capture is silent,
  survives every intermediate step, and is discovered by a human watching the finished file.

## Dependencies

`ffmpeg` and `ffprobe` on PATH, and Node 18+. Nothing else — no Python, no beat-detection library,
no video framework. `scripts/beats.mjs` finds tempo with ffmpeg's own audio filters, which is why
this runs anywhere ffmpeg does.
