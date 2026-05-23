// Detects SKILL.md files whose entry-point is bloated. The body of SKILL.md
// is read on every invocation; a 500-line entry dilutes attention compared to
// a 60-line dispatcher that references sub-files. Hard ceiling at 200 prose
// lines (excludes fenced code blocks, same as oversized-claude-md).
import type { Rule, Finding } from '../types.js';
import { findSkillFiles, countProseLines } from '../utils/skill.js';

const HARD_LIMIT = 200;

export const skillOversized: Rule = {
  id: 'skill-oversized',
  description:
    'A SKILL.md entry point is over its prose-line budget (200 lines, code examples excluded). Move detail into sub-files referenced from SKILL.md.',
  defaultSeverity: 'P1',
  async run(ctx) {
    const findings: Finding[] = [];
    const skills = await findSkillFiles(ctx);

    for (const { path, body, raw } of skills) {
      // Use the body (post-frontmatter) for the count; frontmatter is dispatch metadata, not prose.
      const measureSource = body.length > 0 ? body : raw;
      const lines = countProseLines(measureSource);
      if (lines > HARD_LIMIT) {
        findings.push({
          ruleId: 'skill-oversized',
          severity: 'P1',
          file: path,
          message: `${path}: SKILL.md is ${lines} prose lines (ceiling ${HARD_LIMIT}; code examples already excluded). The entry point should be a lean dispatcher.`,
          fix: 'Move detail into sub-files (commands/, foundation/, templates/, etc.) and reference them from SKILL.md. The agent reads SKILL.md on every invocation; sub-files load on demand.',
        });
      }
    }

    return findings;
  },
};
