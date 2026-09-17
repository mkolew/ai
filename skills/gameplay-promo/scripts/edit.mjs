#!/usr/bin/env node
/**
 * Cuts captured clips into a finished promo, scored to music.
 *
 *   node edit.mjs <plan.json> [--out-dir promo-output]
 *
 * Takes what film.mjs captured, trims each clip to a length that lands on a beat, joins them with
 * cross-fades, lays the music underneath, and encodes one H.264 file.
 *
 * The beat grid is the only reason this is not a plain concat. A cut that lands 100ms off the beat
 * reads as a mistake even to someone not listening for it, so every clip boundary is moved to the
 * nearest beat before anything is rendered — the clips are trimmed to fit the music rather than the
 * music being stretched to fit the clips.
 */

import { execFile } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";

import { analyse, snap } from "./beats.mjs";

const run = promisify(execFile);

/**
 * How long a clip actually is, in seconds.
 *
 * @param {string} path
 * @returns {Promise<number>}
 */
async function duration(path) {
  const { stdout } = await run("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=nw=1:nk=1",
    path,
  ]);
  return Number(stdout.trim());
}

/** Cross-fade between shots. Long enough to read as a transition, short enough not to hide a cut. */
const FADE = 0.4;

/** Below this, the tempo found is not trusted and the edit falls back to unsynced cuts. */
const MIN_CONFIDENCE = 1.25;

/** Music level under gameplay. The game's own audio is not captured, so this carries the whole mix. */
const MUSIC_GAIN = 0.85;

/**
 * Trims each clip so its boundary falls on a beat.
 *
 * Only ever shortens. Stretching a clip to reach the next beat would either freeze a frame or slow
 * the footage, and gameplay slowed by 8% looks like a performance problem rather than an edit.
 *
 * @param {Array<{ name: string, path: string, seconds: number }>} clips
 * @param {number[]} beats
 * @returns {Array<{ name: string, path: string, seconds: number, cutAt: number }>}
 */
function alignToBeats(clips, beats) {
  let running = 0;
  return clips.map((clip) => {
    const wanted = running + clip.seconds;
    const landed = beats.length > 0 ? snap(beats, wanted) : wanted;

    // Never grow, and never collapse a shot to nothing if the nearest beat is behind us.
    const seconds = Math.max(1.0, Math.min(clip.seconds, landed - running));
    running += seconds;
    return {
      ...clip,
      seconds: Number(seconds.toFixed(3)),
      cutAt: Number(running.toFixed(3)),
    };
  });
}

/**
 * The filter graph: trim each clip, cross-fade between them, fade the whole thing up and down.
 *
 * xfade rather than concat, because concat gives a hard cut and a hard cut between two shots of the
 * same starfield reads as a dropped frame. Each xfade overlaps its two inputs, so the running
 * offset accounts for the overlap already consumed.
 *
 * @param {Array<{ seconds: number }>} clips
 * @param {number} fps
 * @returns {{ graph: string, total: number }}
 */
function videoGraph(clips, fps) {
  const parts = [];
  clips.forEach((clip, i) => {
    /*
     * `skip` exists because a run's opening is its least interesting footage. The difficulty curves
     * start gentle by design, so filming from t=0 shows an empty sky and one obstacle — accurate,
     * and a poor advertisement. Capturing long and starting late costs only capture time.
     */
    const start = clip.skip ? `start=${clip.skip}:` : "";
    parts.push(
      `[${i}:v]trim=${start}duration=${(clip.skip ?? 0) + clip.seconds},` +
        `setpts=PTS-STARTPTS,fps=${fps},format=yuv420p[v${i}]`,
    );
  });

  let previous = "v0";
  let total = clips[0].seconds;
  for (let i = 1; i < clips.length; i++) {
    const at = total - FADE;
    const label = i === clips.length - 1 ? "vmix" : `x${i}`;
    parts.push(
      `[${previous}][v${i}]xfade=transition=fade:duration=${FADE}:offset=${at}[${label}]`,
    );
    previous = label;
    total += clips[i].seconds - FADE;
  }

  if (clips.length === 1) {
    parts.push("[v0]null[vmix]");
  }

  // Up from black at the head, down to black at the tail: the head fade is what makes the still
  // ship read as a deliberate opening rather than a paused video.
  parts.push(
    `[vmix]fade=t=in:st=0:d=0.6,fade=t=out:st=${(total - 0.8).toFixed(3)}:d=0.8[vout]`,
  );

  return { graph: parts.join(";"), total };
}

/**
 * Renders the promo.
 *
 * @param {object} plan
 * @param {Array<{ name: string, path: string, seconds: number }>} clips
 * @param {string} outDir
 * @returns {Promise<{ output: string, total: number, bpm: number|null }>}
 */
export async function edit(plan, clips, outDir) {
  const fps = plan.fps ?? 30;
  const output = join(outDir, plan.output ?? "promo.mp4");

  let beats = [];
  let bpm = null;
  if (plan.music) {
    const music = await analyse(plan.music, 90);
    if (music.confidence >= MIN_CONFIDENCE) {
      beats = music.beats;
      bpm = music.bpm;
      process.stdout.write(
        `music: ${music.bpm} BPM, confidence ${music.confidence}\n`,
      );
    } else {
      process.stdout.write(
        `music: no reliable beat (confidence ${music.confidence}); cutting without it\n`,
      );
    }
  }

  const aligned = alignToBeats(clips, beats);
  for (const clip of aligned) {
    process.stdout.write(
      `  ${clip.name}: ${clip.seconds}s, cut at ${clip.cutAt}s\n`,
    );
  }

  const { graph, total } = videoGraph(aligned, fps);
  const args = ["-v", "error", "-y"];
  for (const clip of aligned) {
    args.push("-i", clip.path);
  }

  let filter = graph;
  const maps = ["-map", "[vout]"];

  if (plan.music) {
    args.push("-i", plan.music);
    const index = aligned.length;
    /*
     * Trimmed to the video, not faded from wherever the track happens to be. The tail fade starts
     * 1.5s before the end so the music resolves rather than being cut off mid-phrase.
     */
    filter +=
      `;[${index}:a]atrim=duration=${total.toFixed(3)},asetpts=PTS-STARTPTS,` +
      `volume=${MUSIC_GAIN},afade=t=in:st=0:d=0.5,` +
      `afade=t=out:st=${Math.max(0, total - 1.5).toFixed(3)}:d=1.5[aout]`;
    maps.push("-map", "[aout]", "-c:a", "aac", "-b:a", "192k");
  }

  args.push(
    "-filter_complex",
    filter,
    ...maps,
    "-c:v",
    "libx264",
    "-crf",
    "18",
    "-preset",
    "slow",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    "-r",
    String(fps),
    output,
  );

  await run("ffmpeg", args, { maxBuffer: 1 << 28 });
  return { output, total, bpm };
}

/*
 * Run directly, or imported? `process.argv[1]` is undefined under `node -e`, and reading it blindly
 * made importing this module throw before the importer got a chance to use it.
 */
const argv = process.argv.slice(2);
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const planPath = argv.find((a) => !a.startsWith("--"));
  if (!planPath) {
    console.error("usage: node edit.mjs <plan.json> [--out-dir promo-output]");
    process.exit(2);
  }

  const outAt = argv.indexOf("--out-dir");
  const outDir = outAt >= 0 ? argv[outAt + 1] : "promo-output";
  const plan = JSON.parse(readFileSync(planPath, "utf8"));

  /*
   * Reads what film.mjs left rather than re-capturing: the edit is the part worth iterating on.
   *
   * Length comes from the file, never from the plan. An interactive take is however long the player
   * made it, and even a fixed capture can come back a frame or two short — trusting the plan would
   * ask ffmpeg to trim past the end, which it answers with a frozen last frame rather than an error.
   */
  const clips = [];
  for (const shot of plan.shots) {
    const path = join(outDir, "clips", `${shot.name}.avi`);
    const actual = await duration(path);
    const skip = shot.skip ?? 0;
    const available = Math.max(0, actual - skip);

    clips.push({
      name: shot.name,
      path,
      seconds: shot.use ? Math.min(shot.use, available) : available,
      skip,
    });
  }

  const result = await edit(plan, clips, outDir);
  console.log(`\nwrote ${result.output} — ${result.total.toFixed(1)}s`);
}
