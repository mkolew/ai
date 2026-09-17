# Step 1 — Plan

Turn the four answers into `promo-output/promo.json`, show it to the user, and stop.

## The file

Below is one real project's plan, as an example. `--sv-film`, `--sv-sim` and the scene path are
**that project's own** — every game names its own flags, and most have none until someone adds them.
What is fixed is the shape of the file and the `{{out}}` / `{{frames}}` placeholders.

```json
{
  "title": "The Last Space Voyager",
  "music": "audio/music/music_departure.ogg",
  "output": "promo.mp4",
  "fps": 30,
  "shots": [
    {
      "name": "intro",
      "seconds": 5.4,
      "command": "godot --path godot res://tools/launch_intro.tscn --write-movie {{out}} --fixed-fps 60 --quit-after {{frames}}"
    },
    {
      "name": "run",
      "seconds": 46,
      "skip": 24,
      "command": "godot --path godot --sv-film --sv-sim --sv-invuln --write-movie {{out}} --fixed-fps 60 --quit-after {{frames}}"
    }
  ]
}
```

| Field         |                                                                                    |
| ------------- | ---------------------------------------------------------------------------------- |
| `music`       | path to one track, played whole under the film. Omit for a silent cut              |
| `sample`      | `{ "count": 4, "seconds": 6 }` — cut N windows out of one long take                |
| `fps`         | the **output** rate, 30 for a store listing. Shots capture at 60 and are resampled |
| `seconds`     | how long to **capture**                                                            |
| `skip`        | how much of the front to throw away. Capture long, keep the good part              |
| `use`         | how much to keep after `skip`. Omit to keep the rest                               |
| `interactive` | `true` if the user plays this shot. `seconds` becomes a suggestion, not a limit    |
| `command`     | the shot contract, verbatim, with `{{out}}` and `{{frames}}`                       |

## Music

Find what the project already has, and let the user choose from it:

```bash
node scripts/find-music.mjs <project-dir> --beats
```

```
12 distinct audio file(s), 3 long enough to be music:

  ♪   91s  audio/music/music_burnout.ogg     140 BPM (conf 2.057)  (3 copies)
  ♪   61s  audio/music/music_deepfield.ogg  126.75 BPM (conf 1.623)  (3 copies)
  ♪   55s  audio/music/music_departure.ogg     108 BPM (conf 1.773)  (3 copies)
      27s  audio/music/title_theme.ogg  (3 copies)
```

`♪` marks files long enough to be a track rather than an effect. "3 copies" means the same file
exists elsewhere in the repo — synced into each engine's own tree — and only the canonical path is
listed.

**Present that list and ask.** Do not choose for them: you cannot hear any of it, and whether a
track suits a game is not something ffprobe reports. Tempo and confidence are worth quoting, because
they say which tracks the cuts can lock to.

If nothing is found, ask for a path — a file, or a folder to search.

**Never use the captured game audio as the soundtrack**, even though most engines record it. It is
whatever the game happened to be doing that second, and it does not survive being cut into
six-second windows.

The chosen track plays **from its 0th second to the last frame**, continuous across the opener, the
gameplay windows and the closing card. `edit.mjs` does this; there is nothing to configure.

Run the detector on a track before committing to it:

```bash
node scripts/beats.mjs <track> --seconds 60
```

`confidence` below **1.25** means no reliable beat was found. That is not a failure — ambient tracks
genuinely have no beat — but say so, because the cuts will not be synced and the user should know
before they watch for it.

## Who plays the gameplay shot

Ask. Default to the user playing it, and **ask for two to three minutes**, not twenty seconds.

```json
{
  "name": "run",
  "seconds": 180,
  "skip": 6,
  "sample": { "count": 4, "seconds": 6 },
  "interactive": true,
  "command": "godot --path godot --sv-film --write-movie {{out}} --fixed-fps 60"
}
```

No `--quit-after`: the take ends when they quit the game. `skip` trims the front, which on a played
take is the seconds spent getting a hand on the controls and, in most games, the menu they clicked
through — the first window should open on **gameplay**, never on a start screen.

`sample` then cuts four six-second windows: the first at `skip`, the rest spread so the last lands
near the end of the session. If the take is too short to hold them all, fewer are taken rather than
overlapping ones — the note says so when it happens.

## The closing card

End on the game's own title screen, logo or splash. Two to three seconds, and it usually needs no
new code at all: run the game and simply do not start a match.

```json
{
  "name": "logo",
  "seconds": 3,
  "command": "godot --path godot --sv-film --write-movie {{out}} --fixed-fps 60 --quit-after {{frames}}"
}
```

Check what it captured before trusting it. A game that auto-starts, shows a publisher animation
first, or opens on a "continue?" prompt will give you something else entirely.

An autopilot is the fallback, not the default. It dodges on a schedule, and a viewer reads that as a
demo rather than a game — no hesitation, no near-misses, every gap taken at the same distance. If
the project has one, say which produced the footage.

## Choosing `skip`

Most games are least interesting at `t=0`: empty level, no enemies, difficulty curves still at their
starting value. Watch or reason about where the game gets busy, and start there.

For a game whose difficulty ramps over minutes, capturing 45s and skipping the first 25 costs about
twenty seconds of capture time and is the difference between "an empty sky" and "a game".

## The opener

The user describes the character and its action. Turn that into one sentence of choreography with
timings, and confirm it:

> The ship sits still for 1.1s, engines ramp from nothing to full over 1.9s while the hull shakes,
> holds half a second, then accelerates out of frame over 1.9s. 5.4s total.

If the project has no scene that can render this, stop and say so. Writing one is a change to the
game — it belongs to the project, not to this skill — and it needs the user's agreement first.

## Gate

The user has seen the plan and the exact shot commands, and agreed. Those commands run their game
on their machine; none of them should be a surprise.
