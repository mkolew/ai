#!/usr/bin/env node
import { loadSkills, loadExternalSkills } from './lib.mjs';

const skills = loadSkills();
const external = loadExternalSkills();

if (skills.length === 0 && external.length === 0) {
  console.log('No skills found in skills/.');
  process.exit(0);
}

console.log(`${skills.length + external.length} skill(s):\n`);
for (const skill of skills) {
  if (skill.error) {
    console.log(`  ${skill.dir}  !! ${skill.error}`);
    continue;
  }
  console.log(`  ${skill.fields?.name ?? skill.dir}`);
  console.log(`    ${skill.fields?.description ?? '(no description)'}`);
  console.log('');
}

for (const skill of external) {
  console.log(`  ${skill.name}  (lives in ${skill.repo})`);
  console.log(`    ${skill.description}`);
  console.log('');
}
