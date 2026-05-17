// Flags CLAUDE.md / AGENTS.md / copilot-instructions over 200 lines.
// The Project layer should be lean; long files indicate prompt bloat and push real rules out of attention.
import type { Rule, Finding } from '../types.js';

const TARGETS = [
  { path: 'CLAUDE.md', limit: 200 },
  { path: 'AGENTS.md', limit: 200 },
  { path: '.github/copilot-instructions.md', limit: 200 },
];

export const oversizedClaudeMd: Rule = {
  id: 'oversized-claude-md',
  description: 'A Project-layer context file is over its line budget (default 200).',
  defaultSeverity: 'P1',
  async run(ctx) {
    const findings: Finding[] = [];

    for (const t of TARGETS) {
      const body = await ctx.readFile(t.path);
      if (!body) continue;
      const lines = body.split('\n').length;
      if (lines > t.limit) {
        findings.push({
          ruleId: 'oversized-claude-md',
          severity: 'P1',
          file: t.path,
          message: `${t.path} is ${lines} lines (limit ${t.limit}). Move detail to dedicated docs and reference them.`,
          fix: 'Split content into docs/ files and reference from this one.',
        });
      }
    }

    return findings;
  },
};
