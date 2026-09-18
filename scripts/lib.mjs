import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

export const SKILLS_DIR = new URL('../skills/', import.meta.url).pathname;

/**
 * Minimal frontmatter parser for SKILL.md files.
 * Supports the flat `key: value` fields these skills use — no YAML dependency.
 */
export function parseFrontmatter(content) {
  const match = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(content);
  if (!match) return { fields: null, body: content };
  const fields = {};
  for (const line of match[1].split('\n')) {
    const kv = /^([A-Za-z][\w-]*):(.*)$/.exec(line);
    if (kv) fields[kv[1]] = kv[2].trim();
  }
  return { fields, body: match[2] };
}

/**
 * Skill directories that are really submodules — another repo checked out here so the
 * folder links across on GitHub. They carry their own layout and their own CI, and in a
 * clone made without --recurse-submodules they are empty, so this repo never validates
 * them.
 *
 * @returns {Set<string>} directory names under skills/, relative to it.
 */
function submodules() {
  const file = new URL('../.gitmodules', import.meta.url).pathname;
  if (!existsSync(file)) return new Set();
  const paths = readFileSync(file, 'utf8').matchAll(/^[ \t]*path[ \t]*=(.*)$/gm);
  return new Set(
    [...paths]
      .map(([, p]) => p.trim())
      .filter((p) => p.startsWith('skills/'))
      .map((p) => p.slice('skills/'.length)),
  );
}

export function loadSkills() {
  if (!existsSync(SKILLS_DIR)) return [];
  return readdirSync(SKILLS_DIR)
    .filter((entry) => statSync(join(SKILLS_DIR, entry)).isDirectory())
    .filter((entry) => !submodules().has(entry))
    .sort()
    .map((dir) => {
      const skillFile = join(SKILLS_DIR, dir, 'SKILL.md');
      if (!existsSync(skillFile)) {
        return { dir, error: 'missing SKILL.md' };
      }
      const { fields, body } = parseFrontmatter(
        readFileSync(skillFile, 'utf8'),
      );
      return { dir, file: skillFile, fields, body };
    });
}
