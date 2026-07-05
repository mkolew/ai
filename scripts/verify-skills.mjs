#!/usr/bin/env node
/**
 * Validate every skills/<name>/SKILL.md:
 *  - frontmatter present with `name` and `description`
 *  - `name` matches the directory name
 *  - description is non-empty and within the 1024-char limit installers enforce
 *  - body has actual instructions
 *  - a README.md sits next to SKILL.md documenting the skill for humans
 * Exit code 1 on any failure (CI-friendly).
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { loadSkills, SKILLS_DIR } from './lib.mjs';

const problems = [];
const skills = loadSkills();

if (skills.length === 0) problems.push('no skills found in skills/');

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
  if (!skill.fields.name) problems.push(`${where}/SKILL.md: missing "name" in frontmatter`);
  else if (skill.fields.name !== skill.dir) {
    problems.push(`${where}/SKILL.md: name "${skill.fields.name}" does not match directory "${skill.dir}"`);
  }
  if (!skill.fields.description) problems.push(`${where}/SKILL.md: missing "description" in frontmatter`);
  else if (skill.fields.description.length > 1024) {
    problems.push(`${where}/SKILL.md: description exceeds 1024 characters (${skill.fields.description.length})`);
  }
  if (skill.body.trim().length < 100) problems.push(`${where}/SKILL.md: body looks empty`);
  if (!existsSync(join(SKILLS_DIR, skill.dir, 'README.md'))) {
    problems.push(`${where}: missing README.md (every skill must document itself for humans)`);
  }
}

if (problems.length > 0) {
  console.error('Skill verification failed:');
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log(`All ${skills.length} skill(s) valid.`);
