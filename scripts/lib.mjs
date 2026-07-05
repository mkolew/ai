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
    const kv = /^([A-Za-z][\w-]*):\s*(.*)$/.exec(line);
    if (kv) fields[kv[1]] = kv[2].trim();
  }
  return { fields, body: match[2] };
}

export function loadSkills() {
  if (!existsSync(SKILLS_DIR)) return [];
  return readdirSync(SKILLS_DIR)
    .filter((entry) => statSync(join(SKILLS_DIR, entry)).isDirectory())
    .sort()
    .map((dir) => {
      const skillFile = join(SKILLS_DIR, dir, 'SKILL.md');
      if (!existsSync(skillFile)) {
        return { dir, error: 'missing SKILL.md' };
      }
      const { fields, body } = parseFrontmatter(readFileSync(skillFile, 'utf8'));
      return { dir, file: skillFile, fields, body };
    });
}
