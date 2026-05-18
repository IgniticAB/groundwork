// Detects Cursor .mdc rule files that exceed the word budget for their trigger level.
// Cursor loads rules in four ways, each with a different attention cost:
//   - Always (alwaysApply: true): loads every prompt. Budget: ~200 words.
//   - Auto-Attached (globs set): loads when a matching file is in context. Budget: ~500 words.
//   - Agent-Requested (description only, no globs/alwaysApply): loaded on demand. Budget: ~800 words.
//   - Manual (no description, no globs, no alwaysApply): only when invoked. Unbounded.
import type { Rule, Finding } from '../types.js';

const ALWAYS_BUDGET = 200;
const AUTO_BUDGET = 500;
const AGENT_BUDGET = 800;

type Trigger = 'always' | 'auto' | 'agent' | 'manual';

export const oversizedCursorRule: Rule = {
  id: 'oversized-cursor-rule',
  description:
    'A .cursor/rules/*.mdc file exceeds the word budget for its trigger level. Always-applied rules pay attention cost on every prompt.',
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

      if (trigger === 'always' && wordCount > ALWAYS_BUDGET) {
        findings.push({
          ruleId: 'oversized-cursor-rule',
          severity: 'P1',
          file,
          message: `${file} is ${wordCount} words but uses alwaysApply: true (loads every prompt; budget ${ALWAYS_BUDGET}).`,
          fix: 'Trim the body, or split into a smaller always-rule plus a Manual or Agent-Requested companion that holds the detail.',
        });
      } else if (trigger === 'auto' && wordCount > AUTO_BUDGET) {
        findings.push({
          ruleId: 'oversized-cursor-rule',
          severity: 'P2',
          file,
          message: `${file} is ${wordCount} words for an Auto-Attached rule (budget ${AUTO_BUDGET}). The rule fires whenever its globs match; large bodies dilute the contextual signal.`,
          fix: 'Narrow the globs, or split detail into an Agent-Requested companion.',
        });
      } else if (trigger === 'agent' && wordCount > AGENT_BUDGET) {
        findings.push({
          ruleId: 'oversized-cursor-rule',
          severity: 'P2',
          file,
          message: `${file} is ${wordCount} words for an Agent-Requested rule (budget ${AGENT_BUDGET}).`,
          fix: 'Consider whether the rule should be Manual instead, so it only loads on explicit invocation.',
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
