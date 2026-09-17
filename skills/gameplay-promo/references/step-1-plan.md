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
| `music`       | one track. Point at the file, not the folder — you chose, and you say why          |
| `fps`         | the **output** rate, 30 for a store listing. Shots capture at 60 and are resampled |
| `seconds`     | how long to **capture**                                                            |
| `skip`        | how much of the front to throw away. Capture long, keep the good part              |
| `use`         | how much to keep after `skip`. Omit to keep the rest                               |
| `interactive` | `true` if the user plays this shot. `seconds` becomes a suggestion, not a limit    |
| `command`     | the shot contract, verbatim, with `{{out}}` and `{{frames}}`                       |

## Choosing the music

List what is in the folder with durations. Pick one and give a reason a human can disagree with —
"the only track with a steady kick, so the cuts have something to land on" is a reason; "it fits the
mood" is not.

Run the detector before committing to it:

```bash
node scripts/beats.mjs <track> --seconds 60
```

`confidence` below **1.25** means no reliable beat was found. That is not a failure — ambient tracks
genuinely have no beat — but say so, because the cuts will not be synced and the user should know
before they watch for it.

## Who plays the gameplay shot

Ask. Default to the user playing it.

```json
{
  "name": "run",
  "seconds": 40,
  "skip": 6,
  "use": 22,
  "interactive": true,
  "command": "godot --path godot --sv-film --write-movie {{out}} --fixed-fps 60"
}
```

No `--quit-after`: the take ends when they quit the game. `skip` still trims the opening, which on a
played take is usually the seconds spent getting a hand on the controls.

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
