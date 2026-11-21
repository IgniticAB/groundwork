// Flags Cursor .mdc rule files that are long relative to how often they load.
//
// Cursor activates rules four ways, each with a different attention cost
// (names are Cursor's own, from its rule-type dropdown):
//   - Always Apply (alwaysApply: true): loads on every request.
//   - Apply to Specific Files (globs set): loads when a matching file is in play.
//   - Apply Intelligently (description, no globs): the agent decides.
//   - Apply Manually (neither): only when @-mentioned. Unbounded.
//
// IMPORTANT: the thresholds below are GROUNDWORK'S HEURISTIC, not a Cursor
// limit. Cursor documents exactly one size rule — keep a rule under 500 lines —
// and publishes no per-type word budget. The messages below must say so, or we
// are inventing a product constraint and asserting it to users. The ratio is
// what matters: a rule that loads on every request should be short; one that
// loads only when invoked can be long.
import type { Rule, Finding } from '../types.js';

// Groundwork's own guidance, not Cursor's. See the note above.
const ALWAYS_SOFT_LIMIT = 200;
const SPECIFIC_FILES_SOFT_LIMIT = 500;
const INTELLIGENT_SOFT_LIMIT = 800;

type Trigger = 'always' | 'auto' | 'agent' | 'manual';

export const oversizedCursorRule: Rule = {
  id: 'oversized-cursor-rule',
  description:
    'A .cursor/rules/*.mdc file is long relative to how often it loads. Groundwork guidance, not a Cursor limit: always-applied rules pay attention cost on every request.',
  defaultSeverity: 'P2',
  async run(ctx) {
    const findings: Finding[] = [];
    const files = await ctx.glob('.cursor/rules/**/*.mdc');

    for (const file of files) {
      const body = await ctx.readFile(file);
      if (!body) continue;

      const parsed = parseFrontmatter(body);
      if (!parsed) continue; // No frontmatter; can't determine trigger. Skip.

      const trigger = classifyTrigger(parsed.fm);
      const wordCount = countWords(parsed.body);

      if (trigger === 'always' && wordCount > ALWAYS_SOFT_LIMIT) {
        findings.push({
          ruleId: 'oversized-cursor-rule',
          severity: 'P1',
          file,
          message: `${file} is ${wordCount} words and uses alwaysApply: true, so it loads on every request. Groundwork suggests under ${ALWAYS_SOFT_LIMIT} words for an always-applied rule; Cursor itself sets no such limit.`,
          fix: 'Trim the body, or split into a short always-rule plus an Apply-Manually companion holding the detail.',
        });
      } else if (trigger === 'auto' && wordCount > SPECIFIC_FILES_SOFT_LIMIT) {
        findings.push({
          ruleId: 'oversized-cursor-rule',
          severity: 'P2',
          file,
          message: `${file} is ${wordCount} words for an Apply-to-Specific-Files rule (Groundwork suggests under ${SPECIFIC_FILES_SOFT_LIMIT}; not a Cursor limit). It fires whenever its globs match, so a broad glob makes a long body expensive.`,
          fix: 'Narrow the globs first — scoping beats trimming. Otherwise split the detail into an Apply-Intelligently companion.',
        });
      } else if (trigger === 'agent' && wordCount > INTELLIGENT_SOFT_LIMIT) {
        findings.push({
          ruleId: 'oversized-cursor-rule',
          severity: 'P2',
          file,
          message: `${file} is ${wordCount} words for an Apply-Intelligently rule (Groundwork suggests under ${INTELLIGENT_SOFT_LIMIT}; not a Cursor limit).`,
          fix: 'Consider Apply Manually instead, so it loads only when @-mentioned.',
        });
      }
    }

    return findings;
  },
};

function parseFrontmatter(
  content: string,
): { fm: Record<string, unknown>; body: string } | null {
  const lines = content.split('\n');
  if (lines[0]?.trim() !== '---') return null;
  const endIdx = lines.findIndex((line, i) => i > 0 && line.trim() === '---');
  if (endIdx === -1) return null;

  const fm: Record<string, unknown> = {};
  let i = 1;
  while (i < endIdx) {
    const match = lines[i].match(/^(\w+):\s*(.*)$/);
    if (!match) {
      i++;
      continue;
    }
    const key = match[1];
    const rawVal = match[2].trim();

    if (rawVal === '') {
      // Multi-line list value (YAML "key:\n  - item\n  - item").
      const items: string[] = [];
      i++;
      while (i < endIdx && /^\s*-\s*/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*-\s*/, '').trim());
        i++;
      }
      fm[key] = items;
      continue;
    }

    if (rawVal === 'true') fm[key] = true;
    else if (rawVal === 'false') fm[key] = false;
    else fm[key] = rawVal.replace(/^["']|["']$/g, '');
    i++;
  }

  return { fm, body: lines.slice(endIdx + 1).join('\n') };
}

function classifyTrigger(fm: Record<string, unknown>): Trigger {
  if (fm.alwaysApply === true) return 'always';
  const globs = fm.globs;
  const hasGlobs =
    (Array.isArray(globs) && globs.length > 0) ||
    (typeof globs === 'string' && globs.trim() !== '');
  if (hasGlobs) return 'auto';
  const desc = fm.description;
  if (typeof desc === 'string' && desc.trim() !== '') return 'agent';
  return 'manual';
}

function countWords(body: string): number {
  const stripped = body.trim();
  if (stripped === '') return 0;
  return stripped.split(/\s+/).length;
}
