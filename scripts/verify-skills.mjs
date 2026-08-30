#!/usr/bin/env node
/**
 * Validate every skills/<name>/SKILL.md:
 *  - frontmatter present with `name` and `description`
 *  - `name` matches the directory name
 *  - description is non-empty and within the 1024-char limit installers enforce
 *  - body has actual instructions
 *  - a README.md sits next to SKILL.md documenting the skill for humans
 *  - examples/prompts.md provides copy-paste prompts for users
 *
 * Also validates .claude-plugin/marketplace.json: every skill is published as
 * its own plugin (source: "./skills/<name>", one plugin.json per skill), and
 * every plugin entry points at a skill that exists.
 * Exit code 1 on any failure (CI-friendly).
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { loadSkills, SKILLS_DIR } from "./lib.mjs";

const MARKETPLACE_FILE = new URL(
  "../.claude-plugin/marketplace.json",
  import.meta.url,
).pathname;

const problems = [];
const skills = loadSkills();

if (skills.length === 0) problems.push("no skills found in skills/");

for (const skill of skills) {
  const where = `skills/${skill.dir}`;
  if (skill.error) {
    problems.push(`${where}: ${skill.error}`);
    continue;
  }
  if (!skill.fields) {
    problems.push(`${where}/SKILL.md: missing frontmatter block`);
    continue;
  }
  if (!skill.fields.name)
    problems.push(`${where}/SKILL.md: missing "name" in frontmatter`);
  else if (skill.fields.name !== skill.dir) {
    problems.push(
      `${where}/SKILL.md: name "${skill.fields.name}" does not match directory "${skill.dir}"`,
    );
  }
  if (!skill.fields.description)
    problems.push(`${where}/SKILL.md: missing "description" in frontmatter`);
  else if (skill.fields.description.length > 1024) {
    problems.push(
      `${where}/SKILL.md: description exceeds 1024 characters (${skill.fields.description.length})`,
    );
  }
  if (skill.body.trim().length < 100)
    problems.push(`${where}/SKILL.md: body looks empty`);
  if (!existsSync(join(SKILLS_DIR, skill.dir, "README.md"))) {
    problems.push(
      `${where}: missing README.md (every skill must document itself for humans)`,
    );
  }
  if (!existsSync(join(SKILLS_DIR, skill.dir, "examples", "prompts.md"))) {
    problems.push(
      `${where}: missing examples/prompts.md (every skill must ship copy-paste prompts)`,
    );
  }
}

// Marketplace catalog: one plugin per skill, kept in sync with skills/.
if (!existsSync(MARKETPLACE_FILE)) {
  problems.push(".claude-plugin/marketplace.json: missing");
} else {
  let marketplace;
  try {
    marketplace = JSON.parse(readFileSync(MARKETPLACE_FILE, "utf8"));
  } catch (err) {
    problems.push(
      `.claude-plugin/marketplace.json: invalid JSON (${err.message})`,
    );
  }
  if (marketplace) {
    if (!marketplace.name)
      problems.push('.claude-plugin/marketplace.json: missing "name"');
    if (!marketplace.owner?.name)
      problems.push('.claude-plugin/marketplace.json: missing "owner.name"');

    const entries = Array.isArray(marketplace.plugins)
      ? marketplace.plugins
      : [];
    if (entries.length === 0)
      problems.push('.claude-plugin/marketplace.json: "plugins" is empty');

    // Each plugin must have its own distinct source directory — sharing one
    // source across entries makes plugin identity ambiguous to installers.
    const published = new Set();
    for (const entry of entries) {
      const label = `.claude-plugin/marketplace.json: plugin "${entry.name ?? "<unnamed>"}"`;
      if (!entry.name) problems.push(`${label}: missing "name"`);
      if (!entry.description) problems.push(`${label}: missing "description"`);

      const expected = `./skills/${entry.name}`;
      if (entry.source !== expected) {
        problems.push(
          `${label}: "source" must be "${expected}" (each plugin needs its own source directory)`,
        );
        continue;
      }
      const dir = entry.name;
      if (!existsSync(join(SKILLS_DIR, dir, "SKILL.md"))) {
        problems.push(`${label}: source "${entry.source}" has no SKILL.md`);
        continue;
      }
      const pluginManifest = join(
        SKILLS_DIR,
        dir,
        ".claude-plugin",
        "plugin.json",
      );
      if (!existsSync(pluginManifest)) {
        problems.push(
          `${label}: missing skills/${dir}/.claude-plugin/plugin.json`,
        );
      } else {
        try {
          const manifest = JSON.parse(readFileSync(pluginManifest, "utf8"));
          if (manifest.name !== dir) {
            problems.push(`${label}: plugin.json "name" must be "${dir}"`);
          }
          if (!manifest.author?.name) {
            problems.push(`${label}: plugin.json missing "author.name"`);
          }
        } catch (err) {
          problems.push(`${label}: plugin.json invalid JSON (${err.message})`);
        }
      }
      published.add(dir);
    }

    for (const skill of skills) {
      if (!skill.error && !published.has(skill.dir)) {
        problems.push(
          `skills/${skill.dir}: not published in .claude-plugin/marketplace.json`,
        );
      }
    }
  }
}

if (problems.length > 0) {
  console.error("Skill verification failed:");
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log(`All ${skills.length} skill(s) valid.`);
