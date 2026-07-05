#!/usr/bin/env node
import { loadSkills } from './lib.mjs';

const skills = loadSkills();

if (skills.length === 0) {
  console.log('No skills found in skills/.');
  process.exit(0);
}

console.log(`${skills.length} skill(s):\n`);
for (const skill of skills) {
  if (skill.error) {
    console.log(`  ${skill.dir}  !! ${skill.error}`);
    continue;
  }
  console.log(`  ${skill.fields?.name ?? skill.dir}`);
  console.log(`    ${skill.fields?.description ?? '(no description)'}`);
  console.log('');
}
